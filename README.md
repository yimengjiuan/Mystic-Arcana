# 玄机阁术数排盘工具 · Mystic Arcana

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue)
![Node](https://img.shields.io/badge/Node-20+-green)
![Version](https://img.shields.io/badge/version-1.0.0-orange)
![Coverage](https://img.shields.io/badge/coverage-90%25-brightgreen)

一个中西合璧的术数排盘引擎与可视化工具，纯 TypeScript 实现。**中式命理**支持 **5 种起卦方式**、**6 种术数面板**与**综合趋势分析**；**西式星语**提供 **星盘排盘**、**星座**、**合盘**、**AI 解语**与 **塔罗占卜**。内置 Web UI（双门户入口）与 AI 解读能力。

> **个人娱乐项目**，借助 AI 工具辅助完成，排盘结果仅供娱乐参考，力求严谨、努力向专业靠拢。详见末尾[免责声明](#免责声明)。

## 在线体验

已通过 GitHub Pages 部署，无需安装环境，打开浏览器即可体验：

**[https://yimengjiuan.github.io/Mystic-Arcana/](https://yimengjiuan.github.io/Mystic-Arcana/)**

> 首次访问需等待 GitHub Actions 构建部署完成（推送到 main 后约 1-2 分钟）。AI 解卦 / 星盘解语功能需在界面内自行填入 DeepSeek API Key。页面加载时自动通过世界时间 API 校准初始时间。

## 功能概览

### 5 种起卦方式

| 方法标识 | 名称 | 输入 | 说明 |
|---------|------|------|------|
| `time` | 时间起卦 | 年月日时 | 依据农历年月日时推演上下卦与动爻（动爻不含秒，同一时辰结果一致），可结合生辰八字 |
| `number` | 数字起卦 | 2~3 个数字 | 以数字取上下卦，两数之和或第三数取动爻 |
| `meihua` | 梅花易数 | 2 个数字 + 时辰 | 上卦数、下卦数加时辰数定动爻 |
| `zaobi` | 蓍草占卜 | 时间 + 随机种子 | 模拟大衍筮法，四象概率符合标准分布（老阴 1/16、少阳 5/16、少阴 7/16、老阳 3/16），32 位 LCG 确定性随机 |
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
| **四柱八字** | `bazi` | 年月日时柱（可选真太阳时校正）、天干地支、藏干十神、纳音、咸池桃花、命局概述 |
| **纳甲六爻** | `liuyao` | 本卦/变卦、世应、六亲、六神（按日干正确起例）、伏神（本宫卦正确取值）、动爻 |
| **梅花易数** | `meihua` | 本卦/互卦/变卦、体用分析、体用五行生克 |
| **周易卦辞** | `zhouyi` | 卦辞、彖传、象传、爻辞、吉凶判断 |
| **小六壬** | `xiaoliu` | 掌诀路径、六神结果（大安/留连/速喜/赤口/小吉/空亡）、五行寓意 |
| **紫微斗数** | `ziwei` | 命宫身宫、五行局（汉字局数正确解析）、主星宫位亮度、四化、大限（安星诀修正） |

### 综合分析

`synthesize` 引擎汇聚各面板信息，输出结构化判断：

- **趋势判定**：上吉 / 吉 / 平 / 凶 / 大凶
- **量化评分**：0-100 分制
- **关键要点**：各面板吉凶提示
- **风险提醒**：需注意的事项
- **行动建议**：趋避方向

### 西式星语（占星 + 塔罗）

主入口左侧门户，遵循西方神秘学理论体系，包含四大能力：

| 能力 | 标识 | 说明 |
|------|------|------|
| **星盘排盘** | `natalChart` | 输入出生时间/地点/时区，计算 10 行星黄经、上升点 ASC、天顶 MC、整宫制（Whole Sign）12 宫、相位 |
| **星座** | 星座资料 | 12 星座速查卡片 + 毛玻璃详解弹窗（性格/优点/缺点/爱情/事业/健康/幸运） |
| **合盘** | `synastry` | 双盘 10×10 行星交叉相位，容许度放宽 +1° |
| **塔罗占卜** | `createTarotDeck` 等 | 78 张全牌 / 22 张大阿卡纳双牌组，18 种牌阵，两段式确认抽牌 |

星盘引擎为近似精度（纯前端、零依赖）：太阳 ±0.01°、月亮 ±0.1°、外行星 <1°（NASA JPL 开普勒根数，1800–2050 有效），ASC/MC 采用标准恒星时公式，宫位制为整宫制（Whole Sign）。算法实现与精度已通过 3 组公开权威名人星盘实例（Rodden AA 评级）对照验证，详见 [tests/chart.test.ts](./tests/chart.test.ts)。

## 技术栈

- **语言**：TypeScript 5.4（ESM）
- **运行环境**：Node.js 20+
- **构建工具**：TypeScript Compiler（tsc）
- **测试框架**：Node.js 原生测试运行器 + tsx
- **Web UI**：原生 HTML/CSS/TS，零运行时框架依赖
- **AI 解卦 / 星盘解语**：DeepSeek Chat API（可选）
- **时间校准**：uapis.cn 世界时间 API，静态部署下自动获取准确时区时间

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
│   │   ├── najia.ts             # 纳甲（干支配卦）数据
│   │   └── western.ts           # 西式：星座/行星/宫位/相位/牌阵/塔罗牌数据
│   ├── analysis/
│   │   └── synthesizer.ts       # 综合分析引擎
│   ├── western.ts               # 西式星语引擎（星盘/合盘/塔罗）
│   └── ui/
│       ├── main.ts              # Web UI 主程序（双门户：中式命理 / 西式星语）
│       ├── western.ts           # 西式星语面板渲染（星盘 SVG/合盘/塔罗/解语）
│       ├── poster.ts            # 海报导出（SVG 优先：玄界推演录 / 星语本命盘 / 合盘 / 塔罗）
│       ├── cities.ts            # 城市经纬度与时区数据
│       ├── index.html           # 界面布局
│       ├── style.css            # 样式表
│       └── assets/              # 静态资源（GitHub 图标等）
├── tests/
│   ├── golden.test.ts           # 黄金测试用例
│   ├── cases.test.ts            # 实战卦象验证用例（5 大场景）
│   ├── liuyao.test.ts           # 六爻纳甲标准案例 + 六神/伏神修正
│   ├── synthesis.test.ts        # 综合分析评分测试
│   ├── ziwei.test.ts            # 紫微斗数排盘测试（含安星诀逐日表）
│   ├── tarot.test.ts            # 塔罗洗牌/抽取/牌阵测试
│   ├── chart.test.ts            # 星盘/合盘对照权威实例验证
│   ├── improvements.test.ts     # 真太阳时/精确节气/晚子时/桃花测试
│   ├── poster.test.ts           # 海报排版与文本越界测试（玄界/星语本命/合盘/塔罗）
│   ├── qigua.test.ts            # 起卦算法修正测试（动爻/大衍筮法概率）
│   └── lunar.test.ts            # 农历转换范围校验测试
├── scripts/
│   ├── serve.mjs                # 本地预览服务器
│   ├── copy-ui.mjs              # UI 构建资源拷贝
│   └── fix-imports.mjs          # 构建后导入路径修正
├── dist/                        # 构建产物（本地 .gitignore 忽略，CI 构建后部署）
├── start.bat                    # Windows 一键构建启动脚本
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

构建产出 `dist/` 目录（运行时模块）。测试配置（`tsconfig.test.json`）仅做类型检查，不额外产出文件。

### 运行测试

```bash
npm test
```

### 生成覆盖率报告

```bash
npm run coverage
```

测试套件共 **99 项**，覆盖 11 个文件：

| 测试文件 | 项数 | 验证内容 |
|----------|------|----------|
| `golden.test.ts` | 3 | 基础引擎正确性（八字干支、小六壬、数字起卦） |
| `cases.test.ts` | 6 | 实战卦象验证（5 大场景 + 梅花数字起卦） |
| `liuyao.test.ts` | 9 | 六爻纳甲标准案例 + 六神起例/伏神本宫卦修正（天地否/雷天大壮/雷风恒/山水蒙/山风蛊） |
| `synthesis.test.ts` | 6 | 综合分析评分系统（体用生克、用克体、趋势映射） |
| `ziwei.test.ts` | 22 | 紫微斗数排盘（命宫/身宫/五行局/十四主星/四化/大限/安星诀逐日表 + 6 标准用例） |
| `tarot.test.ts` | 11 | 塔罗洗牌随机性、正逆位、牌组模式、抽取与牌阵构造 |
| `chart.test.ts` | 9 | 星盘/合盘对照权威实例（奥巴马/米歇尔/特朗普，行星/ASC/MC/相位/逆行/宫位） |
| `improvements.test.ts` | 19 | 真太阳时修正（均时差/跨日）、精确节气交节、晚子时流派、咸池桃花判定、引擎参数透传 |
| `poster.test.ts` | 5 | 海报排版（玄界推演录 / 星语本命盘 / 合盘 / 塔罗，SVG 结构完整 + 文本越界 + AI 区块省略） |
| `qigua.test.ts` | 5 | 梅花时间起卦动爻不含秒、蓍草起卦四象概率符合大衍筮法分布（1:5:7:3） |
| `lunar.test.ts` | 4 | 农历转换范围校验（1900–2049 越界显式抛错、边界年份正常转换） |

当前覆盖率：**行 91.4% / 分支 81.6% / 函数 98.5%**。

| 实战案例 | 场景 | 主卦 | 动爻 | 变卦 | 验证要点 |
|----------|------|------|------|------|----------|
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

> 排盘引擎已作为 npm 包发布，可作为 ESM 库引入。先安装：
>
> ```bash
> npm install mystic-arcana
> ```

### `paipan` - 基础排盘

执行起卦与全部面板计算，返回完整的 `CoreState` 状态。

```typescript
import { paipan } from 'mystic-arcana';

const state = paipan(
  { year: 2024, month: 1, day: 15, hour: 10, minute: 0, second: 0 },  // 起卦时间
  'time',          // 起卦方式
  [],              // 数字输入（数字/梅花/铜钱用）
  0,               // 额外参数（蓍草占卜种子）
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
import { fullPaipan } from 'mystic-arcana';

const { state, synthesis } = fullPaipan(
  { year: 2024, month: 1, day: 15, hour: 10, minute: 0, second: 0 },
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
import { fullPaipan } from 'mystic-arcana';

const input = { year: 2024, month: 6, day: 20, hour: 14, minute: 0, second: 0 };

// 数字起卦（2-3 个数）
fullPaipan(input, 'number', [5, 10]);

// 梅花易数（上卦数, 下卦数）
fullPaipan(input, 'meihua', [3, 8]);

// 铜钱摇卦（6 次背面数，0-3）
fullPaipan(input, 'cuanke', [2, 1, 3, 0, 2, 1]);

// 蓍草占卜（随机种子）
fullPaipan(input, 'zaobi', [], 42);
```

### 西式星语 API

#### `natalChart(birth)` — 星盘排盘

输入出生信息，返回完整星盘：10 行星黄经、ASC/MC、整宫制（Whole Sign）12 宫与相位。

```typescript
import { natalChart } from 'mystic-arcana';

const chart = natalChart({
  year: 1990, month: 5, day: 20, hour: 14, minute: 30, second: 0,
  longitude: 116.4,   // 出生地经度（东经为正，北京）
  latitude: 39.9,     // 出生地纬度（北纬为正）
  timezone: 8,        // 时区偏移（东八区 = +8）
});

// chart.sunSign       — 太阳星座
// chart.ascendant     — 上升点（黄经 0-360）
// chart.ascSign       — 上升星座
// chart.midheaven     — 天顶 MC
// chart.planets       — 10 行星（longitude/signId/degreeInSign/retrograde）
// chart.houses        — 12 宫头（整宫制，Whole Sign）
// chart.aspects       — 本命相位（合/六合/刑/拱/冲）
```

#### `synastry(a, b)` — 合盘

计算两盘之间 10×10 行星交叉相位，容许度较本命盘放宽 +1°。

```typescript
const aspects = synastry(chartA, chartB);
// aspects  — 交叉相位数组（p1/p2/type/orb/nature）
```

#### `createTarotDeck` / `drawTarot` — 塔罗

支持 78 张全牌与 22 张大阿卡纳两种牌组，18 种牌阵。

```typescript
// 整副 78 张（默认）
const deck = createTarotDeck();
// 仅大阿卡纳 22 张
const deck22 = createTarotDeck('major');
// 抽取凯尔特十字牌阵（10 张）
const spread = drawTarot('celtic', deck);
// spread.draws     — 按牌阵位置抽取的牌（含正逆位）
// spread.spreadId  — 牌阵标识
```

## Web UI 功能

启动 `npm run serve` 后，界面提供：

- **双门户主入口**：左侧「西式星语」✦ 与右侧「中式命理」☯ 双门户，默认黄昏配色；鼠标接近入口时全局 UI 渐变联动（日升/星夜配色、日月沿东西弧形轨迹移动）
- **起卦配置**：选择起卦方式、依据、时间、数字/铜钱输入（时间/蓍草起卦时数字输入自动置灰）
- **真太阳时修正**：中式面板支持三态——不修正（钟表时间，默认）/ 地区自动定位（国家→省份→城市级联自动填充经度）/ 直接输入经纬度，按经度与均时差校正日柱/时柱
- **子时换日流派**：可选择「零点换日（默认）」或「晚子时归次日（23 点换日）」，并附流派说明提示
- **时间校准**：页面加载时自动通过世界时间 API 获取浏览器所在时区的准确时间，解决静态部署时系统时钟不准的问题
- **生辰八字**：可选填出生时间，支持时间+八字叠加推演
- **六面板渲染**：卦象可视化、四柱展示（含咸池桃花按三合局判定）、六爻表格（六神按日干起例）、紫微星盘等
- **星盘面板**：出生时间/地点输入（含常用城市时区数据），SVG 星盘渲染（12 星座环、12 宫、行星、ASC/MC、5° 刻度），行星落座与相位解读
- **十二星座面板**：12 星座速查卡片，点击展开毛玻璃详解弹窗（性格/优点/缺点/爱情/事业/健康/幸运）
- **合盘面板**：双盘交叉相位解读
- **塔罗面板**：牌组选择（78 张全牌 / 22 张大阿卡纳）、18 种牌阵、两段式确认抽牌、已抽区展示，多列牌阵在小屏下自动折叠为 2 列展开
- **历史比对**：保存最近 8 次排盘，按总览/四柱/卦象/小六壬/综合分类横向对比
- **AI 解卦/解语**：填入 DeepSeek API Key 后可一键获取 AI 解卦与星盘解语分析
- **海报导出**：一键生成中式（玄界推演录）与西式（星语本命盘/合盘/塔罗）SVG 海报，浏览器内绘制为 PNG 下载。海报先渲染为 SVG 字符串（纯文本），便于自动化测试直接断言排版与文本越界
- **开源标识**：界面右上角 GitHub 图标链接，直达仓库源码
- **响应式布局**：自适应桌面与移动端，比对表格在小屏下自动缩放与横向滚动

## 类型定义

核心类型一览（详见 [src/types/index.ts](./src/types/index.ts)）：

| 类型 | 说明 |
|------|------|
| `TimeInput` | 时间输入（year/month/day/hour/minute/second） |
| `Bazi` | 四柱八字（年月日时干支 + 农历 + 节气） |
| `Hexagram` | 卦象（名称/宫位/五行/世应/六爻） |
| `CoreState` | 完整排盘状态（输入/八字/卦象/六面板） |
| `Synthesized` | 综合分析结果（趋势/评分/要点/建议） |
| `QiGuaMethod` | 起卦方式联合类型 |
| `QiGuaBasis` | 起卦依据联合类型 |

西式星语类型（详见 [src/western.ts](./src/western.ts)）：

| 类型 | 说明 |
|------|------|
| `BirthInfo` | 出生信息（公历年月日时刻 + 经度/纬度/时区偏移） |
| `NatalChart` | 星盘结果（太阳星座/ASC/MC/10 行星/12 宫/相位） |
| `PlanetPosition` | 行星位置（黄经/星座/宫内度数/逆行） |
| `HousePosition` | 宫头位置（整宫制，Whole Sign） |
| `AspectResult` | 相位（合/六合/刑/拱/冲 + 容许度） |
| `TarotDeckMode` | 塔罗牌组模式（`major` 22 张大阿卡纳 / `full` 78 张全牌） |
| `TarotSpread` | 塔罗牌阵结果（按牌阵位置的抽取结果） |

## 部署

项目内置 GitHub Pages 自动部署工作流（`.github/workflows/deploy-pages.yml`），推送到 `main` 分支后 CI 自动执行 `npm run build:ui` 构建，并将 `dist/` 目录部署为 GitHub Pages 静态站点。构建产物不再入库，仓库只保留源码。

如需本地预览，执行：

```bash
npm run serve
```

## 许可证

MIT License

## 免责声明

本项目仅为**个人娱乐项目**，旨在学习中国传统术数与西方占星文化、TypeScript 工程实践。项目开发过程中**借助了 AI 工具辅助完成**，所有排盘结果**仅供娱乐参考**，不构成任何专业预测、决策建议或命理/占星咨询。

作者非专业术数从业者，项目中的算法实现与解读逻辑力求严谨、努力向专业靠齐，但难免存在疏漏。请勿将本项目结果用于重大人生决策（如婚恋、投资、求职、健康等）。如有专业需求，请咨询持证命理师或相关领域专业人士。
