# 玄机阁术数排盘工具 · Mystic Arcana

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue)
![Node](https://img.shields.io/badge/Node-20+-green)
![Version](https://img.shields.io/badge/version-1.0.0-orange)

一个专业的中国传统术数排盘引擎与可视化工具，纯 TypeScript 实现，支持 **5 种起卦方式**、**6 种术数面板**与**综合趋势分析**，内置 Web UI 与 AI 解卦能力。

## 功能概览

### 5 种起卦方式

| 方法标识 | 名称 | 输入 | 说明 |
|---------|------|------|------|
| `time` | 时间起卦 | 年月日时 | 依据农历年月日时推演上下卦与动爻，可结合生辰八字 |
| `number` | 数字起卦 | 2~3 个数字 | 以数字取上下卦，两数之和或第三数取动爻 |
| `meihua` | 梅花易数 | 2 个数字 + 时辰 | 上卦数、下卦数加时辰数定动爻 |
| `zaobi` | 造笔起卦 | 时间 + 随机种子 | 基于时间哈希生成六爻，模拟随机摇卦 |
| `cuanke` | 铜钱摇卦 | 6 次背面数（0-3） | 三枚铜钱六次结果，0 为老阴、3 为老阳为动爻 |

起卦可依据三种数据源（`QiGuaBasis`）：

| 标识 | 名称 | 说明 |
|------|------|------|
| `time` | 仅时间 | 仅以当前起卦时间推演 |
| `time_bazi` | 时间 + 八字 | 起卦时间与生辰八字叠加 |
| `bazi` | 仅八字 | 以生辰八字为基准推演 |

### 6 种术数面板

| 面板 | 标识 | 核心输出 |
|------|------|----------|
| **四柱八字** | `bazi` | 年月日时柱、天干地支、藏干十神、纳音、大运流年 |
| **纳甲六爻** | `liuyao` | 本卦/变卦、世应、六亲、六神、伏神、动爻 |
| **梅花易数** | `meihua` | 本卦/互卦/变卦、体用分析、体用五行生克 |
| **周易卦辞** | `zhouyi` | 卦辞、彖传、象传、爻辞、吉凶判断 |
| **小六壬** | `xiaoliu` | 掌诀路径、六神结果（大安/留连/速喜/赤口/小吉/空亡）、五行寓意 |
| **紫微斗数** | `ziwei` | 命宫身宫、五行局、主星宫位亮度 |

### 综合分析

`synthesize` 引擎汇聚各面板信息，输出结构化判断：

- **趋势判定**：上吉 / 吉 / 平 / 凶 / 大凶
- **量化评分**：0-100 分制
- **关键要点**：各面板吉凶提示
- **风险提醒**：需注意的事项
- **行动建议**：趋避方向

## 技术栈

- **语言**：TypeScript 5.4（CommonJS）
- **运行环境**：Node.js 20+
- **构建工具**：TypeScript Compiler（tsc）
- **测试框架**：Node.js 原生测试运行器 + tsx
- **Web UI**：原生 HTML/CSS/TS，零运行时框架依赖
- **AI 解卦**：DeepSeek Chat API（可选）

## 项目结构

```
Mystic-Arcana/
├── src/
│   ├── engine.ts                # 核心排盘引擎（paipan / fullPaipan）
│   ├── types/index.ts           # 全局类型定义
│   ├── utils/
│   │   ├── qigua.ts             # 5 种起卦算法与调度
│   │   ├── parser.ts            # 建卦、变卦、互卦解析
│   │   └── calendar.ts          # 农历与干支历法转换
│   ├── panels/
│   │   ├── bazi.ts              # 四柱八字面板
│   │   ├── liuyao.ts            # 纳甲六爻面板
│   │   ├── meihua.ts            # 梅花易数面板
│   │   ├── zhouyi.ts            # 周易卦辞面板
│   │   ├── xiaoliu.ts           # 小六壬面板
│   │   └── ziwei.ts             # 紫微斗数面板
│   ├── data/
│   │   ├── hexagrams.ts         # 64 卦与八卦数据
│   │   ├── lunar.ts             # 农历转换算法
│   │   └── najia.ts             # 纳甲（干支配卦）数据
│   ├── analysis/
│   │   └── synthesizer.ts       # 综合分析引擎
│   └── ui/
│       ├── main.ts              # Web UI 主程序
│       ├── index.html           # 界面布局
│       └── style.css            # 样式表
├── tests/
│   ├── golden.test.ts           # 黄金测试用例
│   └── cases.test.ts            # 实战卦象验证用例（5 大场景）
├── scripts/
│   ├── serve.mjs                # 本地预览服务器
│   ├── copy-ui.mjs              # UI 构建资源拷贝
│   └── fix-imports.mjs          # 构建后导入路径修正
├── dist_ui/                     # UI 可直接预览的构建产物
├── package.json
├── tsconfig.json
└── tsconfig.test.json
```

## 快速开始

### 安装依赖

```bash
npm install
```

### 构建项目

```bash
npm run build
```

构建产出两个目录：`dist/`（运行时模块）与 `dist_test/`（测试模块）。

### 运行测试

```bash
npm test
```

测试套件包含两组：

**黄金测试（`golden.test.ts`）**：验证基础排盘引擎的正确性（八字干支、小六壬结果、数字起卦动爻）。

**实战卦象验证（`cases.test.ts`）**：覆盖 5 类真实占卜场景，验证卦象变换、动爻推演与各面板一致性：

| 案例 | 场景 | 主卦 | 动爻 | 变卦 | 验证要点 |
|------|------|------|------|------|----------|
| 一 | 求职运势 | 坎为水 | 5爻 | 地水师 | 主卦->变卦变换、六爻面板变卦一致性 |
| 二 | 婚姻状况 | 乾为天 | 1、2爻 | 天山遁 | 多爻动变换、六爻面板变卦一致性 |
| 三 | 投资前景 | 震为雷 | 1、2爻 | 雷水解 | 多爻动变换、六爻面板变卦一致性 |
| 四 | 学业考试 | 泽山咸 | 3爻 | 泽地萃 | 梅花易数互卦(天风姤)、体用生克(用生体大吉) |
| 五 | 法律纠纷 | 山火贲 | 4爻 | 离为火 | 梅花数字起卦、互卦(雷水解)、体用生克(体生用小凶) |

### 启动 Web UI

```bash
npm run serve
```

浏览器打开终端提示的本地地址，即可使用可视化排盘界面。

## 核心 API

### `paipan` — 基础排盘

执行起卦与全部面板计算，返回完整的 `CoreState` 状态。

```typescript
import { paipan } from './dist/engine';

const state = paipan(
  { year: 2024, month: 1, day: 15, hour: 10, minute: 0 },  // 起卦时间
  'time',          // 起卦方式
  [],              // 数字输入（数字/梅花/铜钱用）
  0,               // 额外参数（造笔种子）
  undefined,       // 生辰时间（结合八字时用）
  'time',          // 起卦依据
  '男',            // 性别
  '张三'           // 姓名
);

// state.hexagram   — 本卦信息
// state.bazi       — 四柱八字
// state.panels     — 六大面板数据
// state.moving     — 动爻与变卦
```

### `fullPaipan` — 排盘 + 综合分析

在 `paipan` 基础上额外执行综合分析，返回状态与分析结果。

```typescript
import { fullPaipan } from './dist/engine';

const { state, synthesis } = fullPaipan(
  { year: 2024, month: 1, day: 15, hour: 10, minute: 0 },
  'time',
  [],
  0,
  undefined,
  'time',
  '男',
  '张三'
);

// synthesis.trend           — 趋势（上吉/吉/平/凶/大凶）
// synthesis.score           — 评分（0-100）
// synthesis.summary         — 综合摘要
// synthesis.keyPoints       — 关键要点
// synthesis.warnings        — 风险提醒
// synthesis.recommendations — 行动建议
```

### 起卦方式示例

```typescript
import { fullPaipan } from './dist/engine';

const input = { year: 2024, month: 6, day: 20, hour: 14, minute: 0 };

// 数字起卦（2-3 个数）
fullPaipan(input, 'number', [5, 10]);

// 梅花易数（上卦数, 下卦数）
fullPaipan(input, 'meihua', [3, 8]);

// 铜钱摇卦（6 次背面数，0-3）
fullPaipan(input, 'cuanke', [2, 1, 3, 0, 2, 1]);

// 造笔起卦（随机种子）
fullPaipan(input, 'zaobi', [], 42);
```

## Web UI 功能

启动 `npm run serve` 后，界面提供：

- **起卦配置**：选择起卦方式、依据、时间、数字/铜钱输入
- **生辰八字**：可选填出生时间，支持时间+八字叠加推演
- **六面板渲染**：卦象可视化、四柱展示、六爻表格、紫微星盘等
- **历史比对**：保存最近 8 次排盘，按总览/四柱/卦象/小六壬/综合分类横向对比
- **AI 解卦**：填入 DeepSeek API Key 后可一键获取 AI 解卦分析
- **响应式布局**：自适应桌面与移动端，比对表格在小屏下自动缩放与横向滚动

## 类型定义

核心类型一览（详见 [src/types/index.ts](./src/types/index.ts)）：

| 类型 | 说明 |
|------|------|
| `TimeInput` | 时间输入（year/month/day/hour/minute） |
| `Bazi` | 四柱八字（年月日时干支 + 农历 + 节气） |
| `Hexagram` | 卦象（名称/宫位/五行/世应/六爻） |
| `CoreState` | 完整排盘状态（输入/八字/卦象/六面板） |
| `Synthesized` | 综合分析结果（趋势/评分/要点/建议） |
| `QiGuaMethod` | 起卦方式联合类型 |
| `QiGuaBasis` | 起卦依据联合类型 |

## 部署

项目内置 GitHub Pages 自动部署工作流（`.github/workflows/deploy-pages.yml`），推送到 `main` 分支即自动将 `dist_ui/` 目录部署为 GitHub Pages 静态站点。

如需本地预览，执行：

```bash
npm run serve
```

## 许可证

MIT License
