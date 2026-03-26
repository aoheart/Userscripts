/**
 * MusicBrainz フォーム送信ユーティリティ
 *
 * 提供:
 *   - createMBForm()
 *   - submitMBForm()
 */

const DEFAULT_MB_ROOT = "https://musicbrainz.org";

interface CreateMBFormOptions {
  method?: string;
  mbRoot?: string;
}

/**
 * MusicBrainz 用フォームを生成する。
 *
 * @param action  パス形式 ("/release/add") またはフル URL
 * @param params  フィールドの key-value。null / undefined / "" はスキップ
 * @param options method (default: "POST") / mbRoot (default: "https://musicbrainz.org")
 *
 * @example
 * // デフォルトホスト
 * const form = createMBForm("/release/add", params);
 *
 * // beta サーバー
 * const form = createMBForm("/release/add", params, { mbRoot: "https://beta.musicbrainz.org" });
 */
export const createMBForm = (action: string, params: Record<string, string | number | null | undefined>, { method = "POST", mbRoot = DEFAULT_MB_ROOT }: CreateMBFormOptions = {}): HTMLFormElement => {
  const form = document.createElement("form");
  form.method = method;
  form.action = `${mbRoot}${action}`;
  form.target = "_blank";
  form.style.display = "none";
  Object.entries(params).forEach(([key, value]) => {
    if (value == null || value === "") return;
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = key;
    input.value = String(value);
    form.appendChild(input);
  });
  return form;
};

/**
 * フォームを送信する。
 *
 * @example
 * submitMBForm(createMBForm("/release/add", params));
 */
export const submitMBForm = (form: HTMLFormElement): void => {
  const submitBtn = document.createElement("button");
  submitBtn.type = "submit";
  form.appendChild(submitBtn);
  document.body.appendChild(form);
  submitBtn.click();
  requestAnimationFrame(() => form.remove());
};
