# 拾图 0.1.0

这是拾图的 macOS Apple Silicon 本地开发版发布包，包含增强模型入口、ChatGPT / Codex CLI 直连入口、最近分析记录和 Chrome 图片右键分析插件。

## 安装

1. 打开 `.dmg`，把“拾图”拖到“应用程序”。
2. 第一次打开时，如果 macOS 提示无法验证开发者，请在“系统设置 → 隐私与安全性”中允许打开。
3. Chrome 插件使用单独的 `拾图-0.1.0-Chrome-extension.zip`：解压后打开 `chrome://extensions`，开启“开发者模式”，选择“加载已解压的扩展程序”。

## 模型

发布包不内置约 5–12 GB 的模型文件。当前验证过的增强模型是 Qwen3-VL 8B 4-bit 加拾图 Pinterest LoRA；候选模型、硬件建议和来源见 `MODEL-DOWNLOADS.md` 及 App 内的模型清单。

## ChatGPT / Codex CLI

“ChatGPT 直连”使用本机已登录的 Codex CLI，不需要 OpenAI API Key。首次使用可在 App 的设置卡片中打开“Codex 登录”。

## 当前发布性质

这是可运行的本地开发版，使用 macOS ad-hoc 签名，尚未进行 Apple Developer ID 公证，也未提交 App Store。公开分发前仍需要正式签名、公证和每台设备独立的配对配置。

---

# Shitu 0.1.0 · English

This Apple Silicon macOS development release includes the enhanced local model entry, ChatGPT / Codex CLI direct analysis, recent analysis history, and the Chrome image context-menu workflow.

## Installation

1. Open the `.dmg` and drag `拾图.app` to Applications.
2. If macOS blocks the ad-hoc signed app, allow it under System Settings → Privacy & Security.
3. Unzip `拾图-0.1.0-Chrome-extension.zip`, open `chrome://extensions`, enable Developer mode, and choose **Load unpacked**.

## Models

The release does not bundle the 5–12 GB model files. The verified enhanced setup is Qwen3-VL 8B 4-bit plus the Shitu Pinterest LoRA. Candidate models, hardware guidance, and source links are documented in `MODEL-DOWNLOADS.md` and the bundled model manifest.

## ChatGPT / Codex CLI

The ChatGPT direct option uses the locally installed and authenticated Codex CLI; it does not require an OpenAI API key. Use the “打开 Codex 登录 / Open Codex Login” button on the setup card when needed.

## Release status

This is a runnable local development build with an ad-hoc macOS signature. It is not notarized and has not been submitted to the Mac App Store. A public multi-user release still needs Developer ID notarization and per-device first-run pairing.
