# 拾图模型下载清单

拾图的 App 发布包不内置本地模型。模型文件体积较大，安装 App 后再按电脑的统一内存和磁盘空间选择，会比把模型塞进 .dmg 更适合分发。

| 模型 | 适合设备 | 参考体积 | 当前状态 | 来源 |
| --- | --- | ---: | --- | --- |
| 拾图增强模型 · Qwen3-VL 8B 4-bit + Pinterest LoRA | Apple Silicon，建议 16 GB 统一内存或以上 | 基座约 5.78 GB，另加 LoRA 与运行环境 | 已在开发机验证；当前 App 使用 | https://huggingface.co/mlx-community/Qwen3-VL-8B-Instruct-4bit |
| Qwen3-VL 4B 4-bit | Apple Silicon，8 GB 统一内存起 | 约 3.09 GB | 候选，尚未接入拾图自动下载与 LoRA | https://huggingface.co/mlx-community/Qwen3-VL-4B-Instruct-4bit |
| Qwen3-VL 4B Thinking 4-bit | Apple Silicon，8 GB 统一内存起 | 约 3.11 GB | 候选，尚未接入拾图运行器 | https://huggingface.co/mlx-community/Qwen3-VL-4B-Thinking-4bit |
| Qwen3-VL 8B 8-bit | Apple Silicon，建议 24 GB 统一内存或以上 | 约 9.87 GB | 高质量候选，尚未接入拾图运行器 | https://huggingface.co/mlx-community/Qwen3-VL-8B-Instruct-8bit |

当前版本的“增强模型”需要基座模型目录和拾图 LoRA 同时存在；只下载一个原始基座模型，不会自动得到拾图的增强效果。清单里的候选模型先作为可追踪的下载来源和硬件匹配依据，只有完成下载、路径切换、服务启动和图片回归测试后，才会改为可用状态。
