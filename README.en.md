# MiMo V2 · MiMo看图

[中文](README.md) · [Download V2](https://github.com/kaleidoscopiiraku-bot/shitu-image-analyzer/releases/tag/v2.0.0)

MiMo V2 is the second version of Shitu. It combines selected-image analysis with a searchable, previewable and locally saved collection of style prompts.

## What's new

- Renamed macOS app, menus and UI to **MiMo看图**.
- Search, categories, sorting, prompt details and one-click copy.
- Complete before/after previews. Copyable prompts request an independent styled image.
- Favorites on cards and details, with a dedicated favorites view.
- Explicit example-image selection that excludes QR codes and promotional artwork.
- Existing image analysis, ten recent textual results, Chrome right-click/side-panel workflows and macOS region capture.
- Per-device random pairing: no personal or shared pairing secret is embedded in the release.

The public package includes **233 upstream-licensed style entries** and original examples from [小小东 / nevertoday](https://github.com/nevertoday). Each entry retains its PolyForm Noncommercial 1.0.0 license, original text and source links. MiMo removes photo-comparison instructions from the copyable variant. Use these materials according to their noncommercial terms. [Attribution and modification notice](web/styles/ATTRIBUTION.md).

Personal Xiaohongshu excerpts and attachments are excluded from public redistribution. The public collection differs from the personal catalogue. The earliest creator of every prompt has not been established. Image generation remains a copy-and-paste workflow in ChatGPT or another chosen tool; there is no automated generation API integration.

## Install

Download the Apple Silicon DMG or App ZIP from the release and copy **MiMo看图.app** to Applications. This is an ad-hoc signed development build, without Developer ID signing or notarization. Follow the macOS prompts when opening it.

The desktop bridge requires Python 3.9+ at `/usr/bin/python3`, provided by macOS Command Line Tools in the tested environment. The standalone `web/style-library.html` can also be opened locally for offline browsing and copying.

Image analysis requires an installed local enhanced model, authenticated Codex CLI, or a configured compatible API. Model weights, private LoRA adapters, training images, Codex CLI and account data are not bundled. See [model availability](MODEL-DOWNLOADS.md).

### Pair the Chrome extension

1. Unzip the extension asset, open `chrome://extensions`, enable Developer mode and load the `extension` folder.
2. In the macOS app menu choose **复制浏览器扩展配对码** (Copy browser pairing code).
3. Open the extension's Options page, paste the code and click **连接** (Connect).
4. Keep the macOS app open, then right-click a selected image to analyze it.

The pairing code is stored only in this Chrome profile. Do not share it. Other apps can use the Mac region-capture shortcut **⌃⌥I**.

## Privacy and upgrades

The bridge and model service listen only on `127.0.0.1`, on ports 19428 and 19429. Requests require a device-local pairing secret. Input images and browsing URLs are not retained; image analysis retains the latest ten textual results locally. Style favorites remain local; the style library does not save reference images, generated images or usage history.

Local analysis stays on the device. Codex CLI and custom API modes send the selected image to their respective services. The original application ID, favorites key and `~/Library/Application Support/拾图` data directory are retained for upgrades. Settings, API keys, model data, histories and logs are excluded from the repository and release. Back up personal catalogue builds before replacing them with the public app.

## Build

Requires macOS, Swift compilation tools and Python 3.9+.

```bash
python3 build.py
SHITU_DATA_DIR=/tmp/mimo-tests SHITU_TOKEN=mimo-test python3 -m unittest discover -s tests -q
```

The build does not read personal configuration or embed credentials. Use `--output` to select a new app output path. See [security boundary](SECURITY-REVIEW.md) and [verification](VERIFICATION.md).


Source tracks the 233 preview URLs and SHA-256 manifest. Run `python3 fetch_previews.py` to retrieve and verify original bytes; `build.py` performs this step automatically. Release apps include complete previews for offline browsing. The manual GitHub build workflow uploads only to an existing draft; publication is a separate action.
