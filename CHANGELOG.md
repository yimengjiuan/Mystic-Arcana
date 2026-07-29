# Changelog

本项目所有重要变更均会记录于此文件。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [1.0.0] - 2026-07-29

### 新增

- 排盘引擎核心：5 种起卦方式（时间、数字、梅花易数、蓍草占卜、铜钱摇卦）
- 6 种术数面板：四柱八字、纳甲六爻、梅花易数、周易卦辞、小六壬、紫微斗数
- 综合分析引擎（趋势判定、量化评分、关键要点、风险提醒、行动建议）
- Web UI：可视化排盘界面，支持起卦配置、六面板渲染、历史比对（最近 8 次）
- AI 解卦：集成 DeepSeek Chat API，用户自行填入 Key，仅本会话使用不上传
- 时间校准：通过 uapis.cn 世界时间 API 自动获取浏览器时区准确时间
- GitHub Pages 自动部署（CI 构建后部署，构建产物不入库）
- 开源治理文件：LICENSE、CONTRIBUTING、Issue/PR 模板
- 测试套件：黄金测试 + 实战卦象验证（5 大场景）
- npm 包发布支持（ESM，含类型声明）

### 修复

- 统一包名为 mystic-arcana，README 技术栈描述由 CommonJS 更正为 ESM
- AI 解卦 API Key 输入框添加隐私说明
- 手机端起卦表单自适应优化（grid item min-width:0、超窄屏单列布局）
- 构建产物 dist_ui/ 出库，改为 CI 现场构建部署，统一 .gitignore 忽略标准
- 修正 README 与代码不一致（TimeInput 字段、起卦方式命名等）

[1.0.0]: https://github.com/yimengjiuan/Mystic-Arcana/releases/tag/v1.0.0
