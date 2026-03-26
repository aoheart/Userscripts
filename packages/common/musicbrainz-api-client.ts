/**
 * MusicBrainz API Client
 *
 * 層構造：
 *   fetchUrls()       公開API・チャンク分割
 *   _cachedRequest()  リクエスト重複排除キャッシュ（1分TTL）
 *   _pump()           レートリミットキュー（1req/sec）
 *   _fetch()          HTTP層（GM_xmlhttpRequest）
 */

declare function GM_xmlhttpRequest(details: { method: string; url: string; timeout: number; headers: Record<string, string>; onload: (res: { status: number; responseText: string }) => void; onerror: () => void; ontimeout: () => void }): void;

import type { MBUrlEntry, MBUrlResponse } from "./musicbrainz-url-parser";

/* =========================================================
 *  TYPES
 * ========================================================= */

export interface MusicBrainzApiClientOptions {
  appName: string;
  appVersion: string;
  appContact: string;
  endpoint?: string;
  rateMs?: number;
  timeoutMs?: number;
}

interface QueueTask {
  url: string;
  resolve: (value: MBUrlResponse) => void;
  reject: (reason: Error) => void;
}

/* =========================================================
 *  CLIENT
 * ========================================================= */

export class MusicBrainzApiClient {
  readonly endpoint: string;
  private readonly _rateMs: number;
  private readonly _timeoutMs: number;
  private readonly _cacheTtlMs: number;
  private readonly _apiUserAgent: string;
  private readonly _cache: Map<string, Promise<MBUrlResponse>>;
  private _queue: QueueTask[];
  private _running: boolean;

  constructor({ appName, appVersion, appContact, endpoint = "https://musicbrainz.org", rateMs = 1000, timeoutMs = 10000 }: MusicBrainzApiClientOptions) {
    this.endpoint = endpoint;
    this._rateMs = rateMs;
    this._timeoutMs = timeoutMs;
    this._cacheTtlMs = 60_000;
    this._apiUserAgent = `${appName}/${appVersion} ( ${appContact} )`;
    this._cache = new Map();
    this._queue = [];
    this._running = false;
  }

  async fetchUrls(resourceUrls: string[], includes: string[]): Promise<MBUrlResponse> {
    const CHUNK_SIZE = 100;
    // includes をソートしてキャッシュキーの安定性を保証する
    const incParam = [...includes].sort().join("+");

    if (resourceUrls.length <= CHUNK_SIZE) {
      return this._cachedRequest(this._buildUrl(resourceUrls, incParam));
    }

    const merged: MBUrlEntry[] = [];
    for (let i = 0; i < resourceUrls.length; i += CHUNK_SIZE) {
      const chunk = resourceUrls.slice(i, i + CHUNK_SIZE);
      const data = await this._cachedRequest(this._buildUrl(chunk, incParam));
      const urls: MBUrlEntry[] = Array.isArray(data.urls) ? data.urls : data.resource ? [{ id: data.id ?? "", resource: data.resource, relations: data.relations ?? [] }] : [];
      merged.push(...urls);
    }

    return {
      "url-count": merged.length,
      "url-offset": 0,
      urls: merged,
      id: "",
      relations: [],
    };
  }

  private _buildUrl(resourceUrls: string[], incParam: string): string {
    const resourceParams = resourceUrls.map((u) => `resource=${encodeURIComponent(u)}`).join("&");
    return `${this.endpoint}/ws/2/url?${resourceParams}${incParam ? `&inc=${incParam}` : ""}&fmt=json`;
  }

  private _cachedRequest(url: string): Promise<MBUrlResponse> {
    const cached = this._cache.get(url);
    if (cached) return cached;

    const promise = new Promise<MBUrlResponse>((resolve, reject) => {
      this._queue.push({ url, resolve, reject });
      if (!this._running) {
        this._running = true;
        void this._pump();
      }
    });

    // 1分TTLでキャッシュを破棄する（SPA + MutationObserver 環境でのメモリリーク防止）
    void promise.finally(() => {
      setTimeout(() => this._cache.delete(url), this._cacheTtlMs);
    });

    this._cache.set(url, promise);
    return promise;
  }

  private async _pump(): Promise<void> {
    while (true) {
      const task = this._queue.shift();
      if (!task) break;

      const { url, resolve, reject } = task;

      try {
        resolve(await this._fetch(url));
      } catch (err) {
        this._cache.delete(url);
        reject(err instanceof Error ? err : new Error(String(err)));
      }

      if (this._queue.length > 0) {
        await new Promise<void>((resolve) => setTimeout(resolve, this._rateMs));
      }
    }

    this._running = false;
  }

  private _fetch(url: string): Promise<MBUrlResponse> {
    return new Promise<MBUrlResponse>((resolve, reject) => {
      GM_xmlhttpRequest({
        method: "GET",
        url,
        timeout: this._timeoutMs,
        headers: {
          Accept: "application/json",
          "User-Agent": this._apiUserAgent,
        },
        onload(res) {
          if (res.status !== 200) {
            reject(new Error(`HTTP ${res.status}`));
            return;
          }
          let parsed: MBUrlResponse;
          try {
            parsed = JSON.parse(res.responseText) as MBUrlResponse;
          } catch {
            reject(new Error("JSON Parse failed"));
            return;
          }
          resolve(parsed);
        },
        onerror: () => reject(new Error("Network Error")),
        ontimeout: () => reject(new Error("Timeout")),
      });
    });
  }
}
