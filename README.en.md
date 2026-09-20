# Shitu · Local Image Analysis

Shitu is a macOS image-analysis tool with a Chrome right-click workflow. It breaks one selected image into subject, material, lighting, camera, composition, style, technique, typography, and a concrete Chinese image-generation prompt.

## What it includes

- **Enhanced model**: local Qwen3-VL 8B 4-bit with the Shitu Pinterest LoRA adapter.
- **ChatGPT direct**: uses the locally installed and authenticated Codex CLI; no OpenAI API key is stored by Shitu.
- **Custom API**: an optional OpenAI-compatible vision endpoint with a locally stored key.
- **Chrome side panel**: right-click an image and analyze only that selected image. The result and the latest ten analyses stay in the side panel.
- **macOS app**: open local images, analyze a copied image, or use the system screenshot selection shortcut.

## Install the development release

1. Open the macOS `.dmg` and drag `拾图.app` to Applications.
2. If macOS blocks an ad-hoc signed app, allow it under System Settings → Privacy & Security.
3. Unzip the Chrome extension package, open `chrome://extensions`, enable Developer mode, and choose **Load unpacked**.
4. Open Shitu before using the extension. The first run may need Codex CLI login and local model setup.

The current release is an Apple Silicon development build. It is ad-hoc signed and is not notarized or submitted to the Mac App Store. The release package does not bundle the multi-gigabyte model files; see [MODEL-DOWNLOADS.md](MODEL-DOWNLOADS.md).

## Privacy and pairing

The bridge listens only on `127.0.0.1:19428`; the MLX model service listens on `127.0.0.1:19429`. Images are compressed locally before analysis. Shitu does not save source images or page URLs; the latest ten textual results are kept in the local application data directory.

The local bridge uses a pairing token. `extension/config.js` and generated `.app` packages are intentionally ignored or treated as controlled release artifacts. Do not commit a personal `config.js`, API key, history file, logs, model files, or a personal build to a public repository. A public multi-user release should add per-device first-run pairing before distribution.

## Development

```bash
python3 build.py
python3 -m unittest discover -s tests -v
```

The build regenerates the signed app, copies the web UI into the extension, and writes the local extension pairing file from the current application configuration. See [SECURITY-REVIEW.md](SECURITY-REVIEW.md) and [VERIFICATION.md](VERIFICATION.md) for the current review boundary.

## Repository layout

- `Sources/main.swift`: native macOS window, menu, screenshot capture, and Codex login bridge.
- `server.py`: loopback API, history, provider dispatch, and MLX lifecycle.
- `web/`: shared analysis UI.
- `extension/`: Chrome Manifest V3 extension and side panel.
- `model-manifest.json`: verified model and candidate download metadata.
- `MODEL-DOWNLOADS.md`: model sources, sizes, and integration status.
