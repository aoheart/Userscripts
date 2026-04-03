# UserScripts

[日本語](./README.md) | [English](./README.en.md)

> [!NOTE]
> This README is machine-translated from the Japanese version.  
> Please refer to the Japanese README for the most accurate information.

## Installation

Install a userscript manager such as Violentmonkey in your browser.

## MusicBrainz UserScripts

### MusicBrainz Country Quick Selector

[![install](https://img.shields.io/badge/install-brightgreen?style=for-the-badge)](https://raw.githubusercontent.com/aoheart/Userscripts/refs/heads/dist/mb-country-quick-select.user.js)
[![source](https://img.shields.io/badge/source-lightgrey?style=for-the-badge)](https://github.com/aoheart/Userscripts/blob/dist/mb-country-quick-select.user.js)

Adds customizable buttons to the release editor for selecting release countries.

---

### Import AWA to MusicBrainz

[![install](https://img.shields.io/badge/install-brightgreen?style=for-the-badge)](https://raw.githubusercontent.com/aoheart/Userscripts/refs/heads/dist/import-awa-to-musicbrainz.user.js)
[![source](https://img.shields.io/badge/source-lightgrey?style=for-the-badge)](https://github.com/aoheart/Userscripts/blob/dist/import-awa-to-musicbrainz.user.js)

Helps import releases from AWA into MusicBrainz.

#### Features

- Import as a new release in MusicBrainz
- Show icons indicating whether it already exists in MusicBrainz

---

### Import Niconico to MusicBrainz

[![install](https://img.shields.io/badge/install-brightgreen?style=for-the-badge)](https://raw.githubusercontent.com/aoheart/Userscripts/refs/heads/dist/import-niconico-to-musicbrainz.user.js)
[![source](https://img.shields.io/badge/source-lightgrey?style=for-the-badge)](https://github.com/aoheart/Userscripts/blob/dist/import-niconico-to-musicbrainz.user.js)

Helps import data from Niconico into MusicBrainz.

#### Features

- Import as recording or release
- Buttons to check existing recordings/releases/artists
- Copy uploader name or MBID to clipboard (optional)

---

### Links from LinkCore

[![install](https://img.shields.io/badge/install-brightgreen?style=for-the-badge)](https://raw.githubusercontent.com/aoheart/Userscripts/refs/heads/dist/links-from-linkcore.user.js)
[![source](https://img.shields.io/badge/source-lightgrey?style=for-the-badge)](https://github.com/aoheart/Userscripts/blob/dist/links-from-linkcore.user.js)

Copies all links listed on LinkCore pages.  
You can configure which services to include.

> [!WARNING]
> Make sure all links are correct before importing into MusicBrainz.

#### Features

- Add links to existing releases or create new ones
- Resolve LinkCore short links
- Remove redirects from some services

---

### Links from Linkfire

[![install](https://img.shields.io/badge/install-brightgreen?style=for-the-badge)](https://raw.githubusercontent.com/aoheart/Userscripts/refs/heads/dist/links-from-linkfire.user.js)
[![source](https://img.shields.io/badge/source-lightgrey?style=for-the-badge)](https://github.com/aoheart/Userscripts/blob/dist/links-from-linkfire.user.js)

Copies all links listed on Linkfire pages.
You can configure which services to include.

> [!WARNING]
> Make sure all links are correct before importing into MusicBrainz.

#### Features

- Add links to existing releases or create new ones
- Remove redirects from some services

---

### Links from ZULA

[![install](https://img.shields.io/badge/install-brightgreen?style=for-the-badge)](https://raw.githubusercontent.com/aoheart/Userscripts/refs/heads/dist/links-from-zula.user.js)
[![source](https://img.shields.io/badge/source-lightgrey?style=for-the-badge)](https://github.com/aoheart/Userscripts/blob/dist/links-from-zula.user.js)

Copies all links listed on ZULA pages.
You can configure which services to include.

> [!WARNING]
> Make sure all links are correct before importing into MusicBrainz.

#### Features

- Add links to existing releases or create new ones
- Remove redirects from some services

## Development

```bash
bun install
```

## License

MIT

Files under `packages/common/assets` are subject to their respective licenses.  
See [`Attribution.txt`](./packages/common/assets/Attribution.txt) for details.
