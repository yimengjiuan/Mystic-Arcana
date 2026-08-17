import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fullPaipan } from '../src/engine';
import { natalChart, synastry, createTarotDeck, drawTarot } from '../src/western';
import {
  createChinesePosterSVG,
  createWesternPosterSVG,
  getMeasure,
  type ChinesePosterData,
  type WesternPosterData,
} from '../src/ui/poster';

// ============================================================
// 海报 SVG 排版验证
// 说明：海报先渲染为 SVG 字符串（纯文本），因此测试可以直接断言
//       内容与坐标，而不是只判断"有无图片输出"。
// 生成的 SVG 同时落盘到 tests/artifacts/ 供人工核对排版。
// ============================================================

const ART_DIR = join(import.meta.dirname, 'artifacts');
mkdirSync(ART_DIR, { recursive: true });

const W = 780;
const H = 2000;

interface TextEl {
  x: number;
  y: number;
  px: number;
  anchor: 'start' | 'middle' | 'end';
  content: string;
}

/** 解析 SVG 中所有 <text> 元素 */
function parseTexts(svg: string): TextEl[] {
  const out: TextEl[] = [];
  const re = /<text\s+([^>]*)>([\s\S]*?)<\/text>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(svg)) !== null) {
    const attrs = m[1];
    const content = m[2]
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>');
    const num = (name: string): number => {
      const hit = new RegExp(`${name}="([^"]+)"`).exec(attrs);
      return hit ? Number(hit[1]) : NaN;
    };
    const anchor: TextEl['anchor'] = /text-anchor="middle"/.test(attrs)
      ? 'middle'
      : /text-anchor="end"/.test(attrs)
        ? 'end'
        : 'start';
    out.push({
      x: num('x'),
      y: num('y'),
      px: num('font-size'),
      anchor,
      content,
    });
  }
  return out;
}

/** 断言所有文本都在画布内且不超出左右边距（16px 外框内） */
function assertTextBounds(svg: string, label: string): void {
  const texts = parseTexts(svg);
  assert.ok(texts.length > 0, `${label} 应包含文本元素`);
  const m = getMeasure();
  for (const t of texts) {
    const w = m.width(t.content, t.px, 'KaiTi, serif');
    // 三种锚点：start = x 是左端；middle = x 是中心；end = x 是右端
    const left = t.anchor === 'middle' ? t.x - w / 2 : t.anchor === 'end' ? t.x - w : t.x;
    const right = t.anchor === 'middle' ? t.x + w / 2 : t.anchor === 'end' ? t.x : t.x + w;
    assert.ok(t.y >= 0 && t.y <= H, `${label} 文本 y 越界: "${t.content}" y=${t.y}`);
    assert.ok(left >= 0, `${label} 文本左越界: "${t.content}" left=${left.toFixed(1)}`);
    assert.ok(right <= W, `${label} 文本右越界: "${t.content}" right=${right.toFixed(1)}`);
  }
}

function assertContains(svg: string, needle: string, label: string): void {
  assert.ok(svg.includes(needle), `${label} 应包含 "${needle}"`);
}

// ---------- 玄界（中式）海报 ----------

const zhInput = { year: 2026, month: 8, day: 16, hour: 10, minute: 30, second: 0 };
const zhBirth = { year: 1995, month: 6, day: 18, hour: 14, minute: 20, second: 0 };
const zhPaipan = fullPaipan(zhInput, 'number', [3, 5, 7], 0, zhBirth, 'time_bazi', '男');

const zhData: ChinesePosterData = {
  q: '今年事业运势如何，是否适合跳槽换工作？',
  input: zhInput,
  method: 'number',
  basis: 'time_bazi',
  nums: [3, 5, 7],
  birth: zhBirth,
  gender: '男',
  state: zhPaipan.state,
  synthesis: zhPaipan.synthesis,
  ai: [
    '## 综合解读',
    '此卦显示当前处于积蓄阶段，**不宜冒进**。',
    '- 上半年宜稳守，下半年有贵人相助',
    '1. 跳槽需谨慎评估新平台稳定性',
    '2. 农历九月前后或有转机',
    '> 建议：先积累人脉与作品，再择机而动。',
  ].join('\n'),
};

test('P1: 玄界海报 SVG 结构完整、内容齐全、文本不越界', () => {
  const svg = createChinesePosterSVG(zhData);
  assert.ok(svg.startsWith('<svg'), '应以 <svg 开头');
  assert.ok(svg.endsWith('</svg>'), '应以 </svg> 结尾');
  assertContains(svg, '玄 界 · 推 演 录', '玄界海报');
  assertContains(svg, '所 问 之 事', '玄界海报');
  assertContains(svg, '起 卦 信 息', '玄界海报');
  assertContains(svg, '卦 象 演 化', '玄界海报');
  assertContains(svg, '小 六 壬', '玄界海报');
  assertContains(svg, '梅 花 易 数', '玄界海报');
  assertContains(svg, '四 柱 八 字', '玄界海报');
  assertContains(svg, '紫 微 斗 数', '玄界海报');
  assertContains(svg, '六 爻 基 础', '玄界海报');
  assertContains(svg, '综 合 断 语', '玄界海报');
  assertContains(svg, 'AI 解 挂', '玄界海报');
  // 底部页脚（无红印后）
  assertContains(svg, '玄界 · 第四十七卦', '玄界海报');
  assertContains(svg, '玄机阁 · 仅供文化研究与术数学习参考', '玄界海报');
  assertContains(svg, '今年事业运势如何', '玄界海报');
  assertContains(svg, '综合解读', '玄界海报');
  assertTextBounds(svg, '玄界海报');
  writeFileSync(join(ART_DIR, 'xuanjie.svg'), svg, 'utf8');
});

test('P2: 玄界海报无 AI 时省略 AI 区块', () => {
  const svg = createChinesePosterSVG({ ...zhData, ai: undefined });
  assert.ok(!svg.includes('AI 解 挂'), '无 AI 时不应出现 AI 解挂区块');
  assertTextBounds(svg, '玄界海报(无AI)');
});

// ---------- 星域（西式）海报 ----------

const birthA = { year: 1990, month: 4, day: 12, hour: 8, minute: 30, second: 0, longitude: 116.4, latitude: 39.9, timezone: 8 };
const birthB = { year: 1992, month: 11, day: 3, hour: 21, minute: 15, second: 0, longitude: 121.47, latitude: 31.23, timezone: 8 };
const chartA = natalChart(birthA);
const chartB = natalChart(birthB);
const aspects = synastry(chartA, chartB);

const aiText = [
  '太阳与月亮形成和谐相位，情感与意志相互支持。',
  '上升点与金星相合，外在气质亲和，利于人际与感情发展。',
  '建议：关注沟通方式，避免因固执引发摩擦。',
].join('\n');

test('P3: 星域本命盘海报 SVG 结构完整、内容齐全、文本不越界', () => {
  const data: WesternPosterData = {
    kind: 'chart',
    chart: chartA,
    question: '未来一年的感情运势如何？',
    ai: aiText,
  };
  const svg = createWesternPosterSVG(data);
  assertContains(svg, '星 语 · 本 命 星 盘', '本命盘海报');
  assertContains(svg, '出 生 信 息', '本命盘海报');
  assertContains(svg, '命 盘 要 素', '本命盘海报');
  assertContains(svg, '行 星 分 布', '本命盘海报');
  assertContains(svg, '主 要 相 位', '本命盘海报');
  assertContains(svg, 'AI 解 语', '本命盘海报');
  assertContains(svg, '未来一年的感情运势如何？', '本命盘海报');
  assertTextBounds(svg, '本命盘海报');
  writeFileSync(join(ART_DIR, 'xingyu_chart.svg'), svg, 'utf8');
});

test('P4: 星域合盘海报 SVG 结构完整、文本不越界', () => {
  const data: WesternPosterData = {
    kind: 'synastry',
    chartA,
    chartB,
    aspects,
    question: '两人是否适合长期相处？',
    ai: aiText,
  };
  const svg = createWesternPosterSVG(data);
  assertContains(svg, '星 语 · 合 盘 星 图', '合盘海报');
  assertContains(svg, '甲 方 星 盘', '合盘海报');
  assertContains(svg, '乙 方 星 盘', '合盘海报');
  assertContains(svg, '合 盘 相 位', '合盘海报');
  assertContains(svg, 'AI 解 语', '合盘海报');
  assertTextBounds(svg, '合盘海报');
  writeFileSync(join(ART_DIR, 'xingyu_synastry.svg'), svg, 'utf8');
});

test('P5: 星域塔罗海报 SVG 结构完整、文本不越界', () => {
  const deck = createTarotDeck(() => 0.4);
  const spread = drawTarot('three', deck, () => 0.4);
  const data: WesternPosterData = {
    kind: 'tarot',
    spread,
    question: '近期工作是否会有变动？',
    ai: aiText,
  };
  const svg = createWesternPosterSVG(data);
  assertContains(svg, '星 语 · 塔 罗 启 示', '塔罗海报');
  assertContains(svg, '所 问 之 事', '塔罗海报');
  assertContains(svg, '抽 牌 结 果', '塔罗海报');
  assertContains(svg, 'AI 解 语', '塔罗海报');
  assertContains(svg, '近期工作是否会有变动？', '塔罗海报');
  assertTextBounds(svg, '塔罗海报');
  writeFileSync(join(ART_DIR, 'xingyu_tarot.svg'), svg, 'utf8');
});