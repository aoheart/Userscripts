/**
 * i18n ユーティリティ
 *
 * navigator.languages から対応言語を自動選択し、
 * 未対応言語は en にフォールバックする。
 *
 * @example
 * const i18n = createI18n({ ja: { hello: "こんにちは" }, en: { hello: "Hello" } });
 * i18n.t("hello"); // => "こんにちは" または "Hello"
 */

/* =========================================================
 *  LANG DETECTION
 * ========================================================= */

/**
 * navigator.languages から優先言語コード（2文字）を返す。
 * 古いブラウザ向けに navigator.language へのフォールバックを持つ。
 * 結果はモジュールロード時にキャッシュする。
 * 言語環境はセッション中に変化しないため、キャッシュは正当な設計。
 */
let _cachedLang: string | undefined;

const detectLang = (): string => {
  if (_cachedLang) return _cachedLang;
  const langs = navigator.languages ?? [navigator.language];
  for (const lang of langs) {
    const code = lang.split("-")[0].toLowerCase();
    if (code) return (_cachedLang = code);
  }
  return (_cachedLang = "en");
};

/* =========================================================
 *  TYPES
 * ========================================================= */

type I18nData<TKeys extends string> = Record<string, Partial<Record<TKeys, string>>>;

export interface I18n<TKeys extends string> {
  t(key: TKeys): string;
  readonly lang: string;
}

/* =========================================================
 *  FACTORY
 * ========================================================= */

/**
 * i18n インスタンスを生成する。
 *
 * @param data  言語コードをキーとした翻訳データ
 */
export const createI18n = <TKeys extends string>(data: I18nData<TKeys>): I18n<TKeys> => {
  const lang = detectLang();
  const resolved = lang in data ? lang : "en";

  return {
    lang: resolved,
    t(key) {
      return data[resolved]?.[key] ?? data["en"]?.[key] ?? key;
    },
  };
};
