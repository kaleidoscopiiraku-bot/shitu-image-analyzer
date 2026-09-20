# Verification · 拾图 0.1.0

This file records the checks performed for the current local release candidate.

## Passed

- `python3 -m unittest discover -s tests -v`: 17 tests passed.
- Python AST syntax check passed for `server.py` and `build.py`.
- Node syntax check passed for `web/ui.js` and `extension/background.js`.
- `拾图.app` passed `codesign --verify --deep --strict`.
- The signed app contains `model-manifest.json` and the Codex CLI login entry.
- The local `/system` endpoint recognized the installed `shitu-qwen3-vl-8b` model and selected it as the recommendation.
- The DMG mounted successfully and contained the app, model download list, and installation instructions.
- The App ZIP and Chrome extension ZIP were extracted and checked; their package pairing tokens matched within the controlled build.

## Scope

These checks cover the local Apple Silicon development build, loopback bridge, model metadata, package integrity, and extension syntax. They do not constitute Apple notarization, App Store review, Chrome Web Store review, or a public multi-user pairing audit.
