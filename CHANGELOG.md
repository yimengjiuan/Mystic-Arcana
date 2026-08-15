# Changelog

本项目所有重要变更均会记录于此文件。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [Unreleased]

### 新增

- 西式星语模块（主入口左侧门户）：星盘排盘（`natalChart`）、星座资料、合盘（`synastry`）、塔罗占卜
- 星盘引擎：10 行星黄经（NASA JPL 开普勒根数）、ASC/MC（标准恒星时公式）、等宫制 12 宫、相位
- 塔罗占卜：78 张全牌 / 22 张大阿卡纳双牌组，18 种牌阵（每日/三牌/凯尔特十字/是非/年度/脉轮/事业/爱情等），两段式确认抽牌
- 十二星座详解弹窗：毛玻璃半透明背景，从触发卡片位置丝滑展开/回缩，含性格、优点、缺点、爱情、事业、健康、幸运等完整资料
- 主入口双门户联动动效：日月沿东西弧形轨迹、背景与全局 UI 配色随鼠标渐变
- 星盘/合盘对照公开权威实例验证测试（`tests/chart.test.ts`，3 组 Rodden AA 名人星盘）

### 修复

- MC（天顶）象限错误：`atan(tan RAMC)/cos ε` 主值域 ±90° 会丢失象限导致 MC 偏 180°，改为 `atan2(sin RAMC, cos RAMC·cos ε)`
- 合盘 A/B 盘未像本命星盘那样居中显示：`renderSynastrySVG` 改用 `.w-chart-wrap` 包裹 SVG 实现居中
- 星盘/合盘相位内联线端点偏移：相位线改为连接行星实际布局坐标（`posById`），并沿连线方向收缩至行星标记边缘

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
