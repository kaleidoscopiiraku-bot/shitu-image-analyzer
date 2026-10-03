# MiMo看图 V2

[English](README.en.md) · [下载 V2](https://github.com/kaleidoscopiiraku-bot/shitu-image-analyzer/releases/tag/v2.0.0)

MiMo看图是原「拾图」的第二版。它把单张图片拆成创作语言，并提供可以快速查找、预览和收藏的风格提示词库。

## V2 更新

- 全部应用和界面名称更新为 **MiMo看图**。
- 风格库：关键词/编号搜索、分类、排序、提示词详情和一键复制。
- 效果预览保留完整的原图与成片对比；生成提示词只要求风格化成片。
- 卡片和详情支持收藏，在收藏夹中快速找到常用画风。收藏仅保存在本机。
- 预览只使用明确的作品样张，不使用二维码或推广图片。
- 保留图片分析、最近十条文字结果、Chrome 右键和侧栏、Mac 框选及 Finder 服务。
- 每台 Mac 首次运行生成独立的随机配对码，扩展在本机手动连接。安装包不包含个人配对码、API Key 或账号配置。

## 风格资料与使用范围

公开版附带 **233 条**带有上游 PolyForm Noncommercial 1.0.0 许可的风格提示词及作者样张，许可文件逐条随包提供。复制版移除了原照片分屏展示要求，原始文本和来源链接仍可核对。资料的公开发布者为 [小小东 / nevertoday](https://github.com/nevertoday)，没有宣称已查明每条内容的最早原创者。

遵守各条目的非商业许可。详见 [来源与修改说明](web/styles/ATTRIBUTION.md)。个人版另外收集的小红书正文和附件没有打进公开发行包；公开版数量与个人资料库不同。

本版提供提示词复制，用户自行在 ChatGPT 等工具上传参考图生成。没有接入自动生图 API，也没有保存风格使用历史、参考图或生成图。

## 安装

1. 从 Release 下载 `mimo-2.0.0-macos-arm64.dmg` 或 App ZIP，把 **MiMo看图.app** 放进 Applications。
2. 打开应用。当前是 Apple Silicon 开发构建，采用临时签名，尚未 Developer ID 签名和公证；首次打开请按 macOS 的提示处理。
3. 桌面应用的本机服务需要 Python 3.9+（构建及验证环境使用 macOS Command Line Tools 提供的 `/usr/bin/python3`）。风格库也可直接双击仓库中的 `web/style-library.html` 离线浏览和复制。
4. 图片分析可使用已安装的本地增强模型、已登录的 Codex CLI 或自己的兼容 API。本发行包不附带模型、私人 LoRA、训练集或 Codex CLI。首次设置会显示真实可用状态；没有装好模型时不会宣称可以分析。见 [模型说明](MODEL-DOWNLOADS.md)。

### Chrome 扩展配对

1. 解压 `mimo-2.0.0-chrome-extension.zip`。
2. 打开 `chrome://extensions`，开启开发者模式，加载解压后的 `extension` 文件夹。
3. 在 Mac 应用的「MiMo看图」菜单选择「复制浏览器扩展配对码」。
4. 在扩展的「选项」页面粘贴配对码并点击「连接」。配对码只保存在本机 Chrome 中，请勿分享。
5. 图片上右键选择分析方式，或打开 Chrome 侧栏查看结果。Chrome 以外的软件可使用 Mac 的 **⌃⌥I** 框选。

## 隐私与升级

本机服务只监听 `127.0.0.1:19428`，模型服务只监听 `127.0.0.1:19429`，请求必须通过配对认证。只处理用户选中的图片。图片不会保存在应用历史中；图片分析的最近十条文字结果会保存在本机。

增强模型在本机分析；Codex CLI 和自定义 API 模式会把选中的图片发送到对应服务。配对配置及 API Key 保存在用户自己的 `~/Library/Application Support/拾图/config.json`，权限为仅当前用户可读写，Key 不回显到界面。收藏沿用原有本机存储键。

V2 沿用原应用标识和数据目录以保留设置、模型路径、分析记录及收藏。个人版资料库请保留原应用备份，公开版只包含上文列出的授权资料。

## 构建和检查

需要 macOS、Swift 编译工具和 Python 3.9+：

```bash
python3 build.py
SHITU_DATA_DIR=/tmp/mimo-tests SHITU_TOKEN=mimo-test python3 -m unittest discover -s tests -q
```

构建不读取个人配置，也不把配对码嵌入 App 或扩展。默认输出 `MiMo看图.app`；可用 `--output` 指定路径。详见 [安全边界](SECURITY-REVIEW.md)、[验证记录](VERIFICATION.md)。


源码保留233条样张的来源和 SHA-256 校验清单。运行 `python3 fetch_previews.py` 下载并校验原始样张；`build.py` 会自动执行此步骤。发行安装包已包含完整样张，可离线浏览。GitHub 手动构建流程仅上传到已有发布草稿，正式发布需要单独执行。
