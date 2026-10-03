# 模型与分析依赖 / Model availability

风格搜索、预览、收藏与提示词复制不需要生图 API 或本地模型。桌面桥接界面需要 Python 3.9+。

图片分析使用下列独立依赖；发布包不包含模型、私人训练资料、适配器或账号。

- 本地增强模式：Qwen3-VL 8B 4-bit 基座及已有兼容 LoRA、MLX 运行环境。运行路径为应用数据目录的 models/mlx-qwen3-vl、models/mlx-adapter-v2 和 runtime/mlx/venv。基座来源：https://huggingface.co/mlx-community/Qwen3-VL-8B-Instruct-4bit 。私人 Pinterest LoRA 不公开分发；没有兼容适配器时，增强模式不能直接运行。
- ChatGPT直连模式：本机安装 Codex CLI 并登录。应用只调用本机CLI，不打包登录凭据。官方说明：https://developers.openai.com/codex/cli/ 。
- 自定义API：使用用户自己的 OpenAI 兼容图片分析接口。是否收费由该服务决定。

模型候选清单在 model-manifest.json。候选并不等于已验证可运行或支持一键下载。当前没有自动安装私人增强模型的发行流程。

The style library needs no image-generation API or local model. Image analysis requires a separately configured enhanced MLX model/adapter, authenticated Codex CLI, or compatible custom vision API. Private adapters, training images, runtimes, weights and credentials are not bundled. Model candidates are metadata, not a promise of automatic installation or validated execution.
