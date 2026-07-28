# 玄机阁术数排盘工具

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue)
![Node](https://img.shields.io/badge/Node-20+-green)

一个专业的中国传统术数排盘工具，支持多种起卦方式和六种经典命理面板。

## 功能特点

### 5种起卦方式

| 起卦方式 | 说明 | 状态 |
|---------|------|------|
| 时间卦 | 根据年月日时起卦 | ✅ 已实现 |
| 报数卦 | 任意报三个数起卦 | ✅ 已实现 |
| 铜钱摇卦 | 模拟三枚铜钱摇卦 | ✅ 已实现 |
| 文字卦 | 通过文字解析起卦 | 🔜 开发中 |
| 排盘回推 | 从卦象反推起卦信息 | ✅ 已实现 |

### 6种术数面板

| 面板 | 说明 | 核心功能 |
|------|------|----------|
| **八字** | 四柱八字 | 年月日时柱、干支、大运、流年 |
| **六爻** | 纳甲六爻 | 世应、伏神、六亲、六神 |
| **梅花** | 梅花易数 | 互卦、变卦、体用分析 |
| **小六壬** | 六壬掌中诀 | 掌诀排盘、吉凶判断 |
| **奇门** | 奇门遁甲 | 天地人神四盘、值符值使 |
| **紫薇** | 紫微斗数 | 十二宫位、星曜排布 |

### 综合分析

- 自动识别卦象五行属性
- 体用关系分析
-旺相休囚死状态判断
- 日干生旺死墓绝分析

## 技术栈

- **语言**: TypeScript 5.4
- **运行环境**: Node.js 20+
- **构建工具**: TypeScript Compiler
- **测试框架**: Node.js native test runner

## 项目结构

```
xuanji-paipan/
├── src/
│   ├── engine.ts          # 核心排盘引擎
│   ├── types/             # TypeScript类型定义
│   ├── utils/             # 工具函数（日历、干支、八卦）
│   ├── panels/            # 六种术数面板实现
│   ├── data/              # 卦象数据、干支数据
│   ├── analysis/          # 综合分析模块
│   └── ui/                # 前端界面
├── tests/                 # 测试文件
├── dist/                  # 编译输出
└── scripts/               # 构建脚本
```

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run serve
```

### 构建

```bash
npm run build
```

### 运行测试

```bash
npm test
```

## 使用示例

```typescript
import { paipan, fullPaipan } from './dist/engine';

// 简单排盘
const result = paipan(
  { year: 2024, month: 1, day: 15, hour: 10 },
  'time'
);

// 完整排盘（含综合分析）
const { state, synthesis } = fullPaipan(
  { year: 2024, month: 1, day: 15, hour: 10 },
  'time',
  [],      // 报数
  0,       // 额外参数
  undefined, // 出生时间
  'time',  // 起卦依据
  '男',    // 性别
  '张三'   // 姓名
);
```

## 相关文档

- [六爻排盘说明](./六爻.mmd)
- [案例分析](./案例.mmd)

## License

MIT License
