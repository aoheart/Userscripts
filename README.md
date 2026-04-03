# UserScripts

[日本語](./README.md) | [English](./README.en.md)

## インストール

Violentmonkeyなどの拡張機能をブラウザに追加してください。

## MusicBrainz UserScripts

### MusicBrainz Country Quick Selector

[![install](https://img.shields.io/badge/install-brightgreen?style=for-the-badge)](https://raw.githubusercontent.com/aoheart/Userscripts/refs/heads/dist/mb-country-quick-select.user.js)
[![source](https://img.shields.io/badge/source-lightgrey?style=for-the-badge)](https://github.com/aoheart/Userscripts/blob/dist/mb-country-quick-select.user.js)

リリースエディタにリリース国を選択するカスタマイズ可能なボタンを追加します。

---

### Import AWA to MusicBrainz

[![install](https://img.shields.io/badge/install-brightgreen?style=for-the-badge)](https://raw.githubusercontent.com/aoheart/Userscripts/refs/heads/dist/import-awa-to-musicbrainz.user.js)
[![source](https://img.shields.io/badge/source-lightgrey?style=for-the-badge)](https://github.com/aoheart/Userscripts/blob/dist/import-awa-to-musicbrainz.user.js)

AWAからMusicBrainzへのインポートを支援します。

#### 機能

- MusicBrainzの新規リリースとしてインポート
- MusicBrainzに登録済か表示するアイコンを追加

---

### Import Niconico to MusicBrainz

[![install](https://img.shields.io/badge/install-brightgreen?style=for-the-badge)](https://raw.githubusercontent.com/aoheart/Userscripts/refs/heads/dist/import-niconico-to-musicbrainz.user.js)
[![source](https://img.shields.io/badge/source-lightgrey?style=for-the-badge)](https://github.com/aoheart/Userscripts/blob/dist/import-niconico-to-musicbrainz.user.js)

ニコニコ動画からMusicBrainzへのインポートを支援します。

#### 機能

- レコーディング/リリースでのインポート
- レコーディング/リリース/アーティストが登録済か表示するボタンを追加
- 投稿者名かMBIDをクリップボードに保存(オプション)

---

### Links from LinkCore

[![install](https://img.shields.io/badge/install-brightgreen?style=for-the-badge)](https://raw.githubusercontent.com/aoheart/Userscripts/refs/heads/dist/links-from-linkcore.user.js)
[![source](https://img.shields.io/badge/source-lightgrey?style=for-the-badge)](https://github.com/aoheart/Userscripts/blob/dist/links-from-linkcore.user.js)

LinkCoreに掲載されているリンクを一括でコピーします。
コピーする対象サービスは設定で変更可能です。

> [!WARNING]
> 全てのリンクが正しいか確認してからMusicBrainzにインポートしてください。

#### 機能

- MusicBrainzの既存リリースへのリンクの追加または新規リリースとして追加
- LinkCoreの短縮リンクの解決
- 一部サービスのリダイレクトの解消

---

### Links from Linkfire

[![install](https://img.shields.io/badge/install-brightgreen?style=for-the-badge)](https://raw.githubusercontent.com/aoheart/Userscripts/refs/heads/dist/links-from-linkfire.user.js)
[![source](https://img.shields.io/badge/source-lightgrey?style=for-the-badge)](https://github.com/aoheart/Userscripts/blob/dist/links-from-linkfire.user.js)

Linkfireに掲載されているリンクを一括でコピーします。
コピーする対象サービスは設定で変更可能です。

> [!WARNING]
> 全てのリンクが正しいか確認してからMusicBrainzにインポートしてください。

#### 機能

- MusicBrainzの既存リリースへのリンクの追加または新規リリースとして追加
- 一部サービスのリダイレクトの解消

---

### Links from ZULA

[![install](https://img.shields.io/badge/install-brightgreen?style=for-the-badge)](https://raw.githubusercontent.com/aoheart/Userscripts/refs/heads/dist/links-from-zula.user.js)
[![source](https://img.shields.io/badge/source-lightgrey?style=for-the-badge)](https://github.com/aoheart/Userscripts/blob/dist/links-from-zula.user.js)

ZULAに掲載されているリンクを一括でコピーします。
コピーする対象サービスは設定で変更可能です。

> [!WARNING]
> 全てのリンクが正しいか確認してからMusicBrainzにインポートしてください。

#### 機能

- MusicBrainzの既存リリースへのリンクの追加または新規リリースとして追加
- 一部サービスのリダイレクトの解消

## 開発

```bash
bun install
```

## ライセンス

MIT

`packages/common/assets` 内のファイルは個別のライセンスが適用されます。  
詳細は [`Attribution.txt`](./packages/common/assets/Attribution.txt) を参照してください。
