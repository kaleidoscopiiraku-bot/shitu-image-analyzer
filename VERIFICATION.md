# V2 verification

Verified on 2026-10-03 before publication:

- 20 checks passed for loopback authorization, provider dispatch, history, licensed sources, comparison-container cleanup, unique first-run pairing, existing config reuse and mode 0600 permissions.
- Swift app build completed. The actual DMG-mounted and ZIP-extracted applications both passed strict ad-hoc signature verification and matched all built application file bytes.
- Both archives passed CRC checks. App version and Chrome manifest are 2.0.0. The app plist contains no embedded pairing secret; the extension has no config.js.
- All 233 public entries retain upstream originals, real preview bytes, source links and individual PolyForm Noncommercial licenses. Personal Xiaohongshu additions are excluded.
- Private credential scan found no current device credentials in the source or app/extension archives. No private configs, histories, logs, models, runtime or browser source-data are bundled.
- Browser UI verified search, complete photo/artwork comparison, copying an 878-character style prompt, adding a favorite, and retaining that favorite after refresh.
- All five downloadable payloads match SHA256SUMS.txt.

Real model analysis on a fresh Mac, Developer ID signing/notarization and automated image generation are outside the verified release scope. The personal application remains separate and was not overwritten by this public release task.
