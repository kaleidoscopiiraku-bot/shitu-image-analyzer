# 安装与数据流检查

2026-09-18，本机为 Apple M3 Pro / 18GB / macOS 15.7.9。

- 官方仓库：https://github.com/ollama/ollama
- 固定版本：v0.34.1
- 下载：https://github.com/ollama/ollama/releases/download/v0.34.1/ollama-darwin.tgz
- SHA-256：f18fba83fb1eb415e143fb0c24372ebc4388fd7206f4927d4899932653e8c11d；已与 GitHub release asset digest 对照。
- Apple Developer ID 签名：Infra Technologies, Inc (3MU9H2V9Y9)；运行器为 x86_64/arm64 通用二进制。
- 检查了该版本 go.mod、cmd/cmd.go 中启动身份文件行为、envconfig/config.go 中 HOST / MODELS / NO_CLOUD 配置与官方 macOS/FAQ/API 文档。
- 不运行在线安装脚本、不改系统 PATH、不安装开机启动项、不读取浏览器登录资料。
- 依赖：官方归档携带的推理库；应用使用 macOS AppKit/WebKit/Carbon；本机桥接使用系统 Python 标准库。
- 模型：qwen3-vl:8b-instruct，6,140,415,975 bytes；Ollama 下载结束时已验证 sha256。清单 digest：0533d74300e4f9bc367d675d4e64ffd073d50ff16a2b4096cc2e8a1cf8c96319。
- 应用与 Chrome 扩展按用户要求在 OneDrive/codex/拾图；运行器和模型在本机 Library/Application Support/拾图。原生应用将接口脚本和网页界面打包在自身 Resources 中，避免启动时读取同步目录中的外置配置。
- 私有端口11439模型服务；对外界面的端口19428需要本机配对令牌，检查Host与Origin。新版使用独立端口，避免复用仍在运行的旧版桥接服务。
- 默认使用本地模型。用户主动选择 OpenAI 云端时，仅将压缩后的所选图片和分析指令发送到 Responses API，设置 `store:false`，不赋予模型工具调用、文件读写或网页访问权限；图片内容作为不可信数据提示处理。
- OpenAI API Key 由原生 Mac 应用保存在 `ThisDeviceOnly` 钥匙串项目中，运行期间同步至本机 Python 服务内存，不进入配置文件、浏览器扩展或日志。浏览器扩展不开放密钥设置接口。
- 浏览器权限收敛到 activeTab、scripting、contextMenus 和明确的 loopback 主机。脚本只由右键行为注入。
- 这是本地个人开发版，未经过第三方审计或商店审核。
