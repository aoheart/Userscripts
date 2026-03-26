import { MusicBrainzApiClient, MusicBrainzApiClientOptions } from "./musicbrainz-api-client";
import { MBUrlEntry, MBRelation } from "./musicbrainz-url-parser";

export type { MBUrlEntry, MBRelation } from "./musicbrainz-url-parser";
export type { MusicBrainzApiClientOptions } from "./musicbrainz-api-client";
export { getRelationsByType } from "./musicbrainz-url-parser";

/* =========================================================
 *  TYPES
 * ========================================================= */

/**
 * MusicBrainz への1件の照会クエリ。
 * URL と includes をセットで管理することで URL ごとに異なる includes を指定できる。
 *
 * @example
 * [
 *   { key: "source", url: sourceUrl, includes: ["recording-rels", "release-rels"] },
 *   { key: "artist", url: authorUrl, includes: ["artist-rels"] },
 * ]
 */
export interface MBQuery<K extends string = string> {
  key: K;
  url: string;
  includes: readonly string[];
}

export interface SiteImporter<TContext> {
  readonly siteId: string;
  extractContext: () => TContext | null;
  getQueries: (ctx: TContext) => MBQuery[];
}

export interface ImporterRunner {
  /**
   * MBエンティティへのリンクURLを解決する。
   * - リレーションが1件 → そのエンティティの直接URL
   * - リレーションが複数件 → URLエンティティページ（曖昧さ回避）
   */
  resolveEntityHref(rels: MBRelation[], entityType: "recording" | "release" | "artist", urlEntityId?: string): string | null;

  resolveUrlHref(urlEntityId: string): string;

  resolveMbidHref(entityType: "recording" | "release" | "artist", mbid: string): string;

  run<TContext, K extends string = string>(
    importer: SiteImporter<TContext>,
    token: { current: symbol },
    onAttach: (ctx: TContext) => void,
    onUpdate: (ctx: TContext, entries: Record<K, MBUrlEntry | null>) => void,
    onPendingChange?: (pending: boolean) => void,
    onStale?: () => void,
    onApiError?: (err: unknown) => void,
  ): Promise<void>;
}

/* =========================================================
 *  MB QUERY EXECUTOR
 *  MBQuery[] を受け取り MB API を実行して Record<K, MBUrlEntry | null> を返す。
 *  同一 includes を持つ URL をグループ化して1リクエストにまとめる。
 * ========================================================= */

class MBQueryExecutor {
  constructor(private readonly mb: MusicBrainzApiClient) {}

  async execute<K extends string>(queries: MBQuery<K>[]): Promise<Record<K, MBUrlEntry | null>> {
    if (queries.length === 0) return {} as Record<K, MBUrlEntry | null>;

    // groupKey: includes をソートして結合した文字列（グループ化用の内部キー）
    const groups = new Map<string, { urls: string[]; includes: string[] }>();
    for (const q of queries) {
      const groupKey = [...q.includes].sort().join("+");
      const group = groups.get(groupKey);
      if (group) {
        group.urls.push(q.url);
      } else {
        groups.set(groupKey, { urls: [q.url], includes: [...q.includes].sort() });
      }
    }

    const entryMap = new Map<string, MBUrlEntry>();
    const errors: unknown[] = [];

    await Promise.all(
      Array.from(groups.values()).map(async ({ urls, includes }) => {
        try {
          const data = await this.mb.fetchUrls(urls, includes);

          // resource → entry の Map を構築（デコード済みキーも登録してパーセントエンコード差異を吸収）
          const entries = Array.isArray(data.urls) ? data.urls : data.resource ? [{ id: data.id ?? "", resource: data.resource, relations: data.relations ?? [] }] : [];
          const resourceMap = new Map<string, MBUrlEntry>();
          for (const e of entries) {
            resourceMap.set(e.resource, e);
            try {
              resourceMap.set(decodeURIComponent(e.resource), e);
            } catch {
              /* 不正エンコードは無視 */
            }
          }

          for (const url of urls) {
            let decoded: string | undefined;
            try {
              decoded = decodeURIComponent(url);
            } catch {
              /* 不正エンコードは無視 */
            }
            const entry = resourceMap.get(url) ?? (decoded ? resourceMap.get(decoded) : undefined) ?? null;
            if (entry) entryMap.set(url, entry);
          }
        } catch (e) {
          // 404 = MBに未登録。entryMap に追加しないことで null が返る正常系。
          if (e instanceof Error && e.message === "HTTP 404") return;
          errors.push(e);
        }
      }),
    );

    if (errors.length > 0) throw errors[0];

    // url ベースの entryMap を q.key ベースの Record に変換して返す
    return Object.fromEntries(queries.map((q) => [q.key, entryMap.get(q.url) ?? null])) as Record<K, MBUrlEntry | null>;
  }
}

/* =========================================================
 *  FACTORY
 * ========================================================= */

export const createImporterRunner = (options: MusicBrainzApiClientOptions): ImporterRunner => {
  const mb = new MusicBrainzApiClient(options);
  const executor = new MBQueryExecutor(mb);

  return {
    resolveEntityHref(rels, entityType, urlEntityId) {
      if (rels.length === 0) return null;
      if (rels.length === 1) {
        const id = rels[0][entityType]?.id;
        if (id) return `${mb.endpoint}/${entityType}/${id}`;
      }
      return urlEntityId ? `${mb.endpoint}/url/${urlEntityId}` : null;
    },

    resolveUrlHref(urlEntityId) {
      return `${mb.endpoint}/url/${urlEntityId}`;
    },

    resolveMbidHref(entityType, mbid) {
      return `${mb.endpoint}/${entityType}/${mbid}`;
    },

    async run<TContext, K extends string = string>(
      importer: SiteImporter<TContext>,
      token: { current: symbol },
      onAttach: (ctx: TContext) => void,
      onUpdate: (ctx: TContext, entries: Record<K, MBUrlEntry | null>) => void,
      onPendingChange?: (pending: boolean) => void,
      onStale?: () => void,
      onApiError?: (err: unknown) => void,
    ): Promise<void> {
      const { siteId } = importer;

      const ctx = importer.extractContext();
      if (!ctx) return;

      token.current = Symbol();
      const myToken = token.current;

      onAttach(ctx);

      const queries = importer.getQueries(ctx) as MBQuery<K>[];
      if (queries.length === 0) return;

      onPendingChange?.(true);

      try {
        const entries = await executor.execute(queries);

        if (token.current !== myToken) {
          console.warn(`[MB:${siteId}] stale request ignored`);
          onStale?.();
          return;
        }

        onUpdate(ctx, entries);
      } catch (err) {
        console.error(`[MB:${siteId}] API error`, err);
        onApiError?.(err);
      } finally {
        if (token.current === myToken) {
          onPendingChange?.(false);
        }
      }
    },
  };
};
