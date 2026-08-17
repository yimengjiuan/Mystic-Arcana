import type { CoreState, Synthesized, TimeInput, QiGuaMethod, QiGuaBasis } from '../types';
import type { NatalChart, BirthInfo, TarotSpread, AspectResult, PlanetPosition } from '../western';
import type { Sign } from '../data/western';
import { SIGNS } from '../data/western';
import { renderChartSVG } from './western';
import { buildBaziPanel } from '../panels/bazi';

/**
 * 海报模块 —— SVG 优先渲染
 * ------------------------------------------------------------------
 * 所有测算海报先渲染为 SVG 字符串（纯文本，可读、可在 Node 测试中断言排版），
 * 最终导出 PNG 时再由 svgToCanvas() 将同一份 SVG 绘制到画布并下载。
 * 这样布局只在 SVG 中定义一次，校验与最终产物完全一致。
 */

const W = 780;
const H = 2000;
const SCALE = 2;
const ZH_FAMILY = 'KaiTi, \'STKaiti\', \'KaiTi SC\', \'STSong\', \'SimSun\', \'Microsoft YaHei\', serif';
const LATIN_FAMILY = 'Georgia, \'Times New Roman\', serif';

export interface ChinesePosterData {
  q: string;
  input: TimeInput;
  method: QiGuaMethod;
  basis: QiGuaBasis;
  nums: number[];
  birth?: TimeInput;
  gender?: '男' | '女';
  state: CoreState;
  synthesis: Synthesized;
  ai?: string;
}

export type WesternPosterData =
  | { kind: 'chart'; chart: NatalChart; question?: string; ai?: string; cardImages?: never }
  | { kind: 'synastry'; chartA: NatalChart; chartB: NatalChart; aspects: readonly AspectResult[]; question?: string; ai?: string; cardImages?: never }
  | { kind: 'tarot'; spread: TarotSpread; question?: string; ai?: string; cardImages?: Record<string, string> };

const METHOD_ZH: Record<string, string> = {
  time: '时间起卦',
  number: '数字起卦',
  meihua: '梅花易数',
  zaobi: '蓍草占卜',
  cuanke: '铜钱摇卦',
};

const BASIS_ZH: Record<string, string> = {
  time: '仅以时间',
  time_bazi: '时间并参八字',
  bazi: '仅以八字',
};

const SIGN_MAP = new Map<string, Sign>(SIGNS.map(s => [s.id, s]));

/* ==================== 文本测量（浏览器用 Canvas，Node 测试用估算） ==================== */

export interface TextMeasure {
  width(text: string, px: number, family: string): number;
}

/** 浏览器：真实字体测量 */
const canvasMeasure: TextMeasure = (() => {
  let ctx: CanvasRenderingContext2D | null = null;
  return {
    width(text: string, px: number, family: string): number {
      if (!ctx) {
        const c = document.createElement('canvas');
        ctx = c.getContext('2d');
        if (!ctx) throw new Error('无法创建测量画布');
      }
      ctx.font = `${px}px ${family}`;
      return ctx.measureText(text).width;
    },
  };
})();

/** 是否近似全角（CJK / 全角符号 / 扩展区） */
function isWide(cp: number): boolean {
  return (
    (cp >= 0x2e80 && cp <= 0x9fff) || // CJK 部首 / 汉字
    (cp >= 0x3000 && cp <= 0x303f) || // CJK 标点
    (cp >= 0x3400 && cp <= 0x4dbf) || // 扩展 A
    (cp >= 0xf900 && cp <= 0xfaff) || // 兼容汉字
    (cp >= 0xff00 && cp <= 0xffef) || // 全角形式
    cp === 0x2026 // …
  );
}

/** Node 测试：确定性字宽估算（全角≈1em，半角≈0.55em） */
const fallbackMeasure: TextMeasure = {
  width(text: string, px: number): number {
    let w = 0;
    for (const ch of text) {
      const cp = ch.codePointAt(0)!;
      w += isWide(cp) ? px : px * 0.55;
    }
    return w;
  },
};

let measure: TextMeasure | null = null;

/** 惰性选择测量器：有 DOM 用 Canvas，否则用估算（便于 Node 测试） */
export function getMeasure(): TextMeasure {
  if (!measure) {
    measure =
      typeof document !== 'undefined' && typeof document.createElement === 'function'
        ? canvasMeasure
        : fallbackMeasure;
  }
  return measure;
}

/** 测试可显式注入测量器 */
export function setMeasure(m: TextMeasure): void {
  measure = m;
}

/* ==================== SVG 文档构建器 ==================== */

/** 文本内容转义 */
function escText(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

class SvgDoc {
  readonly parts: string[] = [];
  readonly defs: string[] = [];
  private uid = 0;

  constructor(
    readonly w: number,
    readonly h: number,
  ) {}

  private nextId(prefix: string): string {
    return `${prefix}-${(this.uid++).toString(36)}`;
  }

  linearGradient(
    stops: ReadonlyArray<readonly [number, string]>,
    x1: number, y1: number, x2: number, y2: number,
  ): string {
    const id = this.nextId('lg');
    const stopsXml = stops
      .map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`)
      .join('');
    this.defs.push(
      `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stopsXml}</linearGradient>`,
    );
    return `url(#${id})`;
  }

  radialGradient(
    stops: ReadonlyArray<readonly [number, string]>,
    cx: number, cy: number, r: number,
  ): string {
    const id = this.nextId('rg');
    const stopsXml = stops
      .map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`)
      .join('');
    this.defs.push(
      `<radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="${cx}" cy="${cy}" r="${r}">${stopsXml}</radialGradient>`,
    );
    return `url(#${id})`;
  }

  rect(
    x: number, y: number, w: number, h: number,
    fill?: string,
    opts: { opacity?: number; stroke?: string; sw?: number; rx?: number } = {},
  ): void {
    const a = [
      `x="${x}"`, `y="${y}"`, `width="${w}"`, `height="${h}"`,
    ];
    if (opts.rx != null) a.push(`rx="${opts.rx}"`);
    // SVG 默认 fill 为黑色：仅描边时必须显式 fill="none"，否则会盖住背景
    a.push(`fill="${fill ?? 'none'}"`);
    if (opts.opacity != null) a.push(`fill-opacity="${opts.opacity}"`);
    if (opts.stroke != null) a.push(`stroke="${opts.stroke}"`, `stroke-width="${opts.sw ?? 1}"`);
    this.parts.push(`<rect ${a.join(' ')}/>`);
  }

  circle(
    cx: number, cy: number, r: number,
    fill: string,
    opts: { opacity?: number; stroke?: string; sw?: number } = {},
  ): void {
    const a = [`cx="${cx}"`, `cy="${cy}"`, `r="${r}"`, `fill="${fill}"`];
    if (opts.opacity != null) a.push(`fill-opacity="${opts.opacity}"`);
    if (opts.stroke != null) a.push(`stroke="${opts.stroke}"`, `stroke-width="${opts.sw ?? 1}"`);
    this.parts.push(`<circle ${a.join(' ')}/>`);
  }

  line(
    x1: number, y1: number, x2: number, y2: number,
    stroke: string,
    opts: { sw?: number; opacity?: number } = {},
  ): void {
    const a = [`x1="${x1}"`, `y1="${y1}"`, `x2="${x2}"`, `y2="${y2}"`, `stroke="${stroke}"`];
    a.push(`stroke-width="${opts.sw ?? 1}"`);
    if (opts.opacity != null) a.push(`opacity="${opts.opacity}"`);
    this.parts.push(`<line ${a.join(' ')}/>`);
  }

  polyline(pts: ReadonlyArray<readonly [number, number]>, stroke: string, opts: { sw?: number; opacity?: number } = {}): void {
    const a = [`points="${pts.map(p => p.join(',')).join(' ')}"`, `stroke="${stroke}"`, 'fill="none"'];
    a.push(`stroke-width="${opts.sw ?? 1}"`);
    if (opts.opacity != null) a.push(`opacity="${opts.opacity}"`);
    this.parts.push(`<polyline ${a.join(' ')}/>`);
  }

  text(
    content: string,
    x: number, y: number,
    px: number,
    family: string,
    fill: string,
    anchor: 'start' | 'middle' | 'end' = 'start',
    opts: { weight?: number; opacity?: number } = {},
  ): void {
    const a = [
      `x="${x}"`, `y="${y}"`,
      `font-size="${px}"`, `font-family="${family}"`,
      `fill="${fill}"`, `text-anchor="${anchor}"`,
    ];
    if (opts.weight != null) a.push(`font-weight="${opts.weight}"`);
    if (opts.opacity != null) a.push(`opacity="${opts.opacity}"`);
    this.parts.push(`<text ${a.join(' ')}>${escText(content)}</text>`);
  }

  g(attrs: string, body: () => void): void {
    this.parts.push(`<g ${attrs}>`);
    body();
    this.parts.push('</g>');
  }

  /** 增加滤镜定义（辉光/阴影），返回滤镜 id */
  filter(name: string, inner: string): string {
    const id = name;
    this.defs.push(`<filter id="${id}" x="-40%" y="-40%" width="180%" height="180%">${inner}</filter>`);
    return id;
  }

  /** 任意路径 */
  path(
    d: string,
    fill: string,
    opts: { stroke?: string; sw?: number; opacity?: number; filter?: string } = {},
  ): void {
    const a = [`d="${d}"`, `fill="${fill}"`];
    if (opts.stroke) a.push(`stroke="${opts.stroke}"`, `stroke-width="${opts.sw ?? 1}"`);
    if (opts.opacity != null) a.push(`opacity="${opts.opacity}"`);
    if (opts.filter) a.push(`filter="url(#${opts.filter})"`);
    this.parts.push(`<path ${a.join(' ')}/>`);
  }

  /** 内联原始 SVG 片段（icon 等） */
  raw(s: string): void {
    this.parts.push(s);
  }

  /** 内嵌一段外部 SVG：把 `<svg>...</svg>` 字符串作为子级绘制，可使用 x/y/width/height 重定位 */
  nestedSvg(svg: string, x: number, y: number, w: number, h: number): void {
    const inner = svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
    this.parts.push(
      `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" overflow="visible">${inner}</svg>`,
    );
  }

  /** 圆形裁剪路径定义 */
  clipCircle(cx: number, cy: number, r: number): number {
    const id = this.defs.length;
    this.defs.push(
      `<clipPath id="cl-${id}"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath>`,
    );
    return id;
  }

  /** 内嵌背景图像：将图片资源内联为 data URI，确保 blob 渲染下可用 */
  imageInline(src: string, x: number, y: number, w: number, h: number, opacity = 1): void {
    const id = this.nextId('img');
    this.defs.push(
      `<image id="${id}" href="${src}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice" opacity="${opacity}"/>`,
    );
    this.parts.push(`<use href="#${id}"/>`);
  }

  toString(): string {
    const defsXml = this.defs.length ? `<defs>${this.defs.join('')}</defs>` : '';
    return [
      `<svg xmlns="http://www.w3.org/2000/svg" width="${this.w}" height="${this.h}" viewBox="0 0 ${this.w} ${this.h}">`,
      defsXml,
      ...this.parts,
      '</svg>',
    ].join('');
  }
}

/* ==================== 文本排版工具 ==================== */

function wrapText(text: string, maxWidth: number, px: number, family: string): string[] {
  const m = getMeasure();
  const chars = Array.from(text);
  const lines: string[] = [];
  let cur = '';
  for (const ch of chars) {
    if (ch === '\n') {
      lines.push(cur);
      cur = '';
      continue;
    }
    if (cur !== '' && m.width(cur + ch, px, family) > maxWidth) {
      lines.push(cur);
      cur = ch;
    } else {
      cur += ch;
    }
  }
  if (cur !== '') lines.push(cur);
  return lines;
}

/** 输出多行文本，返回下一行起点 y；可限制最大行数（超出以省略号截断） */
function addLines(
  doc: SvgDoc,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  px: number,
  family: string,
  lineGap: number,
  color: string,
  maxLines?: number,
): number {
  let lines = wrapText(text, maxWidth, px, family);
  let truncated = false;
  if (maxLines && lines.length > maxLines) {
    lines = lines.slice(0, maxLines);
    truncated = true;
  }
  for (let i = 0; i < lines.length; i++) {
    const line = truncated && i === lines.length - 1 ? lines[i].replace(/\s+$/, '') + '…' : lines[i];
    doc.text(line, x, y, px, family, color);
    y += lineGap;
  }
  return y;
}

function stripMarkdown(s: string): string {
  return s
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/^&gt;\s*/gm, '')
    .replace(/^>\s*/gm, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^\s*[-*•·]\s+/gm, '')
    .replace(/^\s*\d+[.、）)]\s*/gm, '')
    .replace(/-{3,}/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+\n/g, '\n')
    .trim();
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function nowStamp(): string {
  const d = new Date();
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
}

function nowZh(): string {
  const d = new Date();
  const week = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()];
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 星期${week}`;
}

function truncateText(s: string, max: number): string {
  if (Array.from(s).length <= max) return s;
  return Array.from(s).slice(0, max).join('') + '…';
}

/* ==================== 玄界 · 墨韵朱砂 ==================== */

const ZH_GOLD = '#d3a656';
const ZH_CREAM = '#f2e7cd';
const ZH_VERM = '#c0463a';
const ZH_LABEL = 'rgba(211,166,86,0.85)';
const ZH_BODY = 'rgba(242,231,205,0.92)';

/** 墨色噪声点（模拟宣纸/墨晕肌理，纯矢量） */
function drawZhNoise(doc: SvgDoc, seed: number, count: number, light: boolean): void {
  let s = seed;
  const rnd = () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
  for (let i = 0; i < count; i++) {
    const x = 30 + rnd() * (W - 60);
    const y = 30 + rnd() * (H - 60);
    const r = 0.4 + rnd() * 1.2;
    const c = light ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)';
    doc.circle(x, y, r, c, { opacity: 0.3 + rnd() * 0.4 });
  }
}

function drawZhBg(doc: SvgDoc): void {
  const bg = doc.linearGradient(
    [[0, '#17120a'], [0.45, '#241b10'], [1, '#2f2414']],
    0, 0, 0, H,
  );
  doc.rect(0, 0, W, H, bg);
  drawZhNoise(doc, 20260816, 320, false);
  const vig = doc.radialGradient(
    [[0, 'rgba(0,0,0,0)'], [0.72, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.5)']],
    W / 2, H / 2, 760,
  );
  doc.rect(0, 0, W, H, vig);
}

/** 鎏金祥云 */
function drawZhCloud(doc: SvgDoc, cx: number, cy: number, scale: number, alpha: number): void {
  doc.g(`opacity="${alpha}"`, () => {
    doc.g(`transform="translate(${cx},${cy}) scale(${scale})"`, () => {
      doc.path('M -20 -2 q -10 -4 -18 0 q 0 -12 14 -12 q 10 0 12 12 z', ZH_GOLD);
      doc.path('M 2 0 q -7 -3 -12 0 q 0 -7 9 -7 q 8 0 8 7 z', ZH_GOLD);
    });
  });
}

/** 远山剪影 */
function drawZhMountains(doc: SvgDoc): void {
  doc.path('M 22 250 L 22 226 Q 90 192 160 224 Q 235 252 315 220 Q 395 190 470 222 Q 545 250 625 222 Q 705 194 758 226 L 758 250 Z', 'rgba(10,7,3,0.5)');
  doc.path('M 22 258 L 22 244 Q 120 216 220 242 Q 330 268 430 240 Q 540 214 640 242 Q 700 258 758 244 L 758 258 Z', 'rgba(6,4,2,0.65)');
}

/** 边框 + 四角回纹（金） */
function drawZhFrame(doc: SvgDoc): void {
  doc.rect(22, 22, W - 44, H - 44, undefined, { stroke: 'rgba(211,166,86,0.8)', sw: 2, rx: 14 });
  doc.rect(34, 34, W - 68, H - 68, undefined, { stroke: 'rgba(211,166,86,0.3)', sw: 0.7, rx: 10 });
  const sz = 20;
  doc.g('opacity="0.7"', () => {
    for (const tt of ['TL', 'TR', 'BL', 'BR']) {
      const lx = tt === 'TL' || tt === 'BL' ? 22 : W - 22;
      const ty = tt === 'TL' || tt === 'TR' ? 22 : H - 22;
      const dirX = tt === 'TL' || tt === 'BL' ? 1 : -1;
      const dirY = tt === 'TL' || tt === 'TR' ? 1 : -1;
      doc.path(
        `M ${lx + 12 * dirX} ${ty + 12 * dirY} L ${lx + (12 + sz) * dirX} ${ty + 12 * dirY} L ${lx + (12 + sz) * dirX} ${ty + 16 * dirY} L ${lx + 16 * dirX} ${ty + 16 * dirY} L ${lx + 16 * dirX} ${ty + (12 + sz) * dirY} L ${lx + 12 * dirX} ${ty + (12 + sz) * dirY} Z`,
        'rgba(211,166,86,0.8)',
      );
    }
  });
}

function drawZhDivider(doc: SvgDoc, cx: number, y: number, hw: number, color: string, alpha = 0.5): void {
  const grad = doc.linearGradient(
    [[0, 'rgba(0,0,0,0)'], [0.3, color], [0.5, color], [0.7, color], [1, 'rgba(0,0,0,0)']],
    cx - hw, y, cx + hw, y,
  );
  doc.line(cx - hw, y, cx + hw, y, grad, { sw: 0.8, opacity: alpha });
  doc.g(`transform="translate(${cx},${y}) rotate(45)"`, () => doc.rect(-3, -3, 6, 6, color));
}

/** 画一条爻线（阳=实，阴=断），高亮为朱砂 */
function drawZhHexLine(doc: SvgDoc, x: number, y: number, w: number, isYang: boolean, hl: boolean): void {
  const gap = Math.round(w * 0.14);
  const color = hl ? ZH_VERM : ZH_GOLD;
  if (hl) {
    doc.rect(x - 7, y - 5, w + 20, 12, 'rgba(192,70,58,0.18)', { stroke: 'rgba(192,70,58,0.5)', sw: 0.6, rx: 3 });
  }
  if (isYang) {
    doc.rect(x, y, w, 3.5, color, { rx: 1 });
  } else {
    const seg = Math.round((w - gap) / 2);
    doc.rect(x, y, seg, 3.5, color, { rx: 1 });
    doc.rect(x + seg + gap, y, seg, 3.5, color, { rx: 1 });
  }
}

/** 画六爻卦（lines 按 position 1→6 自下而上） */
function drawZhHexagram(doc: SvgDoc, lines: ReadonlyArray<{ yinYang: string; changed: boolean }>, x: number, y: number, w: number, rowH: number): void {
  const byPos = new Map(lines.map((l) => [String(l.yinYang ? l.yinYang : ''), l]));
  // 简化：直接按数组顺序视作自下而上；若数据带 position 字段则以 position 排序
  const sorted = [...lines].reverse();
  void byPos;
  for (let i = 0; i < 6; i++) {
    const l = sorted[i];
    if (!l) continue;
    drawZhHexLine(doc, x, y + i * rowH, w, l.yinYang === 'yang', !!l.changed);
  }
}

export function createChinesePosterSVG(data: ChinesePosterData): string {
  const doc = new SvgDoc(W, H);
  const glow = doc.filter('zh-glow', '<feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>');

  drawZhBg(doc);

  // Banner：朱砂旭日 + 远山 + 祥云 + 金题
  const sun = doc.radialGradient(
    [[0, 'rgba(216,86,63,0.95)'], [0.5, 'rgba(192,70,58,0.55)'], [1, 'rgba(192,70,58,0)']],
    628, 78, 200,
  );
  doc.g(`filter="url(#${glow})"`, () => doc.circle(628, 78, 96, sun, { opacity: 0.95 }));
  doc.circle(628, 78, 58, 'rgba(210,80,60,0.45)', { stroke: 'rgba(242,231,205,0.22)', sw: 0.8, opacity: 0.9 });
  drawZhMountains(doc);
  drawZhCloud(doc, 90, 40, 1.2, 0.16);
  drawZhCloud(doc, 240, 62, 0.9, 0.12);
  drawZhCloud(doc, 400, 34, 1.3, 0.12);
  drawZhCloud(doc, 550, 150, 1.1, 0.1);
  drawZhCloud(doc, 160, 150, 1.0, 0.09);
  drawZhCloud(doc, 330, 130, 0.8, 0.1);

  doc.g(`filter="url(#${glow})"`, () => doc.text('玄 界 · 推 演 录', W / 2 - 20, 118, 46, ZH_FAMILY, ZH_GOLD, 'middle', { weight: 700 }));
  doc.text('五 术 通 玄    一 卦 知 机', W / 2 - 20, 156, 14, ZH_FAMILY, 'rgba(242,231,205,0.82)', 'middle');
  drawZhDivider(doc, W / 2 - 20, 184, 150, 'rgba(211,166,86,0.75)');
  doc.text('XUANJIE · DIVINATION RECORD', W / 2 - 20, 212, 10, LATIN_FAMILY, 'rgba(211,166,86,0.55)', 'middle', { opacity: 0.9 });
  doc.text('玄机阁制', 46, 74, 11, ZH_FAMILY, 'rgba(211,166,86,0.5)');
  doc.text('丙寅年 · 秋', 46, 92, 11, ZH_FAMILY, 'rgba(211,166,86,0.35)');

  drawZhFrame(doc);
  drawZhNoise(doc, 999, 120, true);

  // 卡片分区 —— 重新规划布局：充足留白、避免文字堆叠
  const CX = 56, CW = W - 112;
  const PAD = 20; // 卡片内左右统一留白
  let y = 296;

  function secTitle(label: string, en: string): void {
    doc.rect(CX, y - 17, 4, 22, ZH_VERM, { rx: 1 });
    doc.text(label, CX + 14, y, 19, ZH_FAMILY, ZH_CREAM, 'start', { weight: 700 });
    doc.text(en, W - CX, y - 3, 9, LATIN_FAMILY, 'rgba(211,166,86,0.5)', 'end');
    doc.line(CX + 14, y + 9, W - CX, y + 9, 'rgba(211,166,86,0.26)', { sw: 0.6 });
  }
  function card(h: number, bg = 'rgba(30,23,14,0.6)'): void {
    doc.rect(CX, y, CW, h, bg, { stroke: 'rgba(211,166,86,0.3)', sw: 1, rx: 8 });
    doc.line(CX + 8, y + 1, CX + CW - 8, y + 1, 'rgba(255,255,255,0.06)', { sw: 0.5 });
    doc.line(CX + 8, y + h - 1, CX + CW - 8, y + h - 1, 'rgba(0,0,0,0.2)', { sw: 0.5 });
  }
  const GAP = 18; // 卡片间距统一 18px

  // 1. 所问之事
  secTitle('所 问 之 事', 'QUESTION');
  y += 14;
  card(70);
  doc.text(truncateText(data.q?.trim() || '未填写具体所问', 26), CX + PAD, y + 32, 16, ZH_FAMILY, ZH_CREAM);
  const inputTimeTxt = `${data.input.year} 年 ${data.input.month} 月 ${data.input.day} 日 ${pad(data.input.hour)}:${pad(data.input.minute)}`;
  doc.text(`问于 ${inputTimeTxt}`, CX + PAD, y + 56, 12, ZH_FAMILY, 'rgba(211,166,86,0.6)');
  y += 70 + GAP;

  // 2. 起卦信息（2×2 网格，增加行距避免堆叠）
  secTitle('起 卦 信 息', 'CASTING');
  y += 14;
  card(112, 'rgba(30,23,14,0.6)');
  {
    const inputTime = `${data.input.year} 年 ${data.input.month} 月 ${data.input.day} 日 ${pad(data.input.hour)}:${pad(data.input.minute)}`;
    const methodTxt = METHOD_ZH[data.method] || data.method;
    const basisTxt = BASIS_ZH[data.basis] || data.basis;
    const numsTxt = data.nums?.length ? data.nums.join('、') : '—';
    const birthTxt = data.birth
      ? `${data.birth.year} 年 ${data.birth.month} 月 ${data.birth.day} 日 ${pad(data.birth.hour)}:${pad(data.birth.minute)}${data.gender || ''}`
      : '未录入';
    const kv: ReadonlyArray<readonly [string, string]> = [
      ['时  间', inputTime],
      ['方  式', `${methodTxt} · ${basisTxt}`],
      ['生  辰', birthTxt],
      ['起  数', numsTxt],
    ];
    const colW = (CW - PAD * 2) / 2;
    kv.forEach(([k, v], i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const dx = CX + PAD + col * colW;
      doc.text(k, dx, y + 28 + row * 52, 11, ZH_FAMILY, ZH_LABEL);
      doc.text(truncateText(v, 22), dx, y + 48 + row * 52, 13, ZH_FAMILY, ZH_BODY);
    });
  }
  y += 112 + GAP;

  // 3. 卦象演化（三列，加宽间距）
  secTitle('卦 象 演 化', 'HEXAGRAM');
  y += 14;
  const hexH = 256;
  card(hexH, 'rgba(36,28,17,0.72)');
  const hex = data.state.hexagram;
  const moving = data.state.moving;
  // 三列均匀分布：列1 卦象图(88px) | 列2 卦名信息(180px) | 列3 卦辞彖传(380px)
  const c1W = 88;
  const c2W = 180;
  const c3W = CW - c1W - c2W - PAD * 2 - 12; // 剩余宽度给第3列
  const c1X = CX + PAD;
  const c2X = c1X + c1W + 12;
  const c3X = c2X + c2W + 12;
  const lw = 66;
  // 列1：本卦 + 变卦 图
  doc.g(`transform="translate(${c1X + (c1W - lw) / 2},${y + 20})"`, () => {
    doc.text('本 卦', lw / 2, 0, 11, ZH_FAMILY, ZH_LABEL, 'middle', { weight: 700 });
    drawZhHexagram(doc, hex.lines, 0, 16, lw, 12);
    doc.text('变 卦', lw / 2, 100, 11, ZH_FAMILY, ZH_LABEL, 'middle', { weight: 700 });
    const bian = moving?.bianHexagram?.lines ?? hex.lines;
    drawZhHexagram(doc, bian, 0, 116, lw, 12);
  });
  // 列间分隔线
  doc.line(c2X - 6, y + 16, c2X - 6, y + hexH - 16, 'rgba(211,166,86,0.22)', { sw: 0.5 });
  // 列2：卦名 + 宫位 + 世应 + 变卦名
  doc.text('本 卦', c2X, y + 26, 11, ZH_FAMILY, ZH_LABEL, 'start', { weight: 700 });
  doc.g(`filter="url(#${glow})"`, () => doc.text(hex.name, c2X, y + 58, 28, ZH_FAMILY, ZH_VERM, 'start'));
  doc.text(`${hex.palace}宫`, c2X, y + 82, 11, ZH_FAMILY, 'rgba(242,231,205,0.7)', 'start');
  doc.text(`动 ${moving?.positions?.length ?? 0} 爻`, c2X, y + 102, 11, ZH_FAMILY, 'rgba(242,231,205,0.7)', 'start');
  doc.text(`世 ${hex.shiPosition} 爻`, c2X, y + 122, 11, ZH_FAMILY, 'rgba(242,231,205,0.7)', 'start');
  doc.text(`应 ${hex.yingPosition} 爻`, c2X, y + 142, 11, ZH_FAMILY, 'rgba(242,231,205,0.7)', 'start');
  doc.line(c2X, y + 160, c2X + c2W - 20, y + 160, 'rgba(211,166,86,0.3)', { sw: 0.5 });
  doc.text('变 卦', c2X, y + 182, 11, ZH_FAMILY, ZH_LABEL, 'start', { weight: 700 });
  doc.text(moving?.bianName || '无', c2X, y + 214, 20, ZH_FAMILY, ZH_CREAM, 'start');
  // 列间分隔线
  doc.line(c3X - 6, y + 16, c3X - 6, y + hexH - 16, 'rgba(211,166,86,0.22)', { sw: 0.5 });
  // 列3：卦辞 + 彖传 + 动爻 + 判断
  const zy = data.state.panels.zhouyi;
  doc.text('本 卦 辞', c3X, y + 28, 11, ZH_FAMILY, ZH_LABEL, 'start', { weight: 700 });
  doc.text(truncateText(zy?.guaCi?.ben || '元亨，利贞。', 18), c3X, y + 50, 13, ZH_FAMILY, ZH_BODY, 'start');
  doc.text('彖  传', c3X, y + 78, 11, ZH_FAMILY, ZH_LABEL, 'start', { weight: 700 });
  addLines(doc, zy?.tuanZhuan || '一阳初动，生机渐归正道。', c3X, y + 100, c3W - 20, 12, ZH_FAMILY, 19, ZH_BODY, 3);
  const yaoTxt = zy?.yaoCi?.length ? zy.yaoCi[0] : '不远复，无祗悔，元吉。';
  // 动爻框（预留充足间距）
  doc.rect(c3X - 4, y + 168, c3W - 16, 26, 'rgba(192,70,58,0.12)', { stroke: 'rgba(192,70,58,0.45)', sw: 0.6, rx: 4 });
  doc.text(`动爻：${truncateText(yaoTxt, 18)}`, c3X, y + 185, 12, ZH_FAMILY, ZH_VERM, 'start', { weight: 700 });
  addLines(doc, `判断：${zy?.judgment || '吉，前路可期。'}`, c3X, y + 212, c3W - 20, 11, ZH_FAMILY, 17, 'rgba(242,231,205,0.75)', 2);
  y += hexH + GAP;

  // 3.5 小六壬 + 梅花易数（双列，充分留白）
  {
    const xl = data.state.panels.xiaoliu;
    const mh = data.state.panels.meihua;
    const halfCW = (CW - 14) / 2;
    secTitle('小 六 壬 · 梅 花 易 数', 'XIAOLIU & MEIHUA');
    y += 14;
    const xlH = 108;
    card(xlH, 'rgba(30,23,14,0.6)');
    const leftX = CX + PAD;
    const rightX = CX + halfCW + 14 + PAD;
    // 分隔线
    doc.line(CX + halfCW + 7, y + 10, CX + halfCW + 7, y + xlH - 10, 'rgba(211,166,86,0.22)', { sw: 0.5 });
    // 左：小六壬
    doc.text('小 六 壬', leftX, y + 24, 13, ZH_FAMILY, ZH_GOLD, 'start', { weight: 700 });
    doc.text(truncateText(xl.path.join(' → '), 20), leftX, y + 48, 11, ZH_FAMILY, ZH_CREAM, 'start');
    doc.text(`落宫：${xl.result}`, leftX, y + 68, 12, ZH_FAMILY, ZH_VERM, 'start', { weight: 700 });
    doc.text(`五行：${xl.element}`, leftX, y + 88, 11, ZH_FAMILY, 'rgba(242,231,205,0.7)', 'start');
    // 右：梅花易数
    doc.text('梅 花 易 数', rightX, y + 24, 13, ZH_FAMILY, ZH_GOLD, 'start', { weight: 700 });
    doc.text(`本卦 ${mh.ben.name}`, rightX, y + 48, 11, ZH_FAMILY, ZH_CREAM, 'start');
    doc.text(`互卦 ${mh.hu.name}`, rightX, y + 68, 11, ZH_FAMILY, ZH_CREAM, 'start');
    doc.text(`变卦 ${mh.bian.name}`, rightX, y + 88, 11, ZH_FAMILY, ZH_CREAM, 'start');
    y += xlH + GAP;
  }

  // 3.6 四柱八字（含藏干、纳音）—— 加大行距，纳音独立行避免与藏干堆叠
  {
    const bd = buildBaziPanel(data.state.bazi);
    secTitle('四 柱 八 字', 'BAZI');
    y += 14;
    const baziH = 130;
    card(baziH, 'rgba(36,28,17,0.72)');
    const pillarW = (CW - PAD * 2) / 4;
    const pillarNames = ['年 柱', '月 柱', '日 柱', '时 柱'];
    bd.pillars.forEach((p, i) => {
      const px = CX + PAD + i * pillarW;
      const cx = px + pillarW / 2;
      doc.text(pillarNames[i], cx, y + 22, 10, ZH_FAMILY, ZH_LABEL, 'middle', { weight: 700 });
      doc.text(p.gz.ganzhi, cx, y + 46, 18, ZH_FAMILY, ZH_VERM, 'middle', { weight: 700 });
      // 藏干 + 十神（每行一个，行距 13px，最多 3 个：y+68/81/94）
      const cgArr = p.canggan.map(c => `${c.gan}(${c.shiShen})`);
      cgArr.forEach((cg, j) => {
        doc.text(cg, cx, y + 68 + j * 13, 9, ZH_FAMILY, 'rgba(242,231,205,0.75)', 'middle');
      });
      // 纳音（独立行，y+112，与最后一行藏干 y+94 隔 18px）
      doc.text(truncateText(p.nayin, 8), cx, y + 112, 9, ZH_FAMILY, 'rgba(211,166,86,0.6)', 'middle');
      if (i < 3) doc.line(px + pillarW, y + 12, px + pillarW, y + baziH - 12, 'rgba(211,166,86,0.18)', { sw: 0.4 });
    });
    y += baziH + GAP;
  }

  // 3.7 紫微斗数（主星表 + 四化）—— 表格行距加大
  {
    const zw = data.state.panels.ziwei;
    secTitle('紫 微 斗 数', 'ZIWEI');
    y += 14;
    const zwH = 160;
    card(zwH, 'rgba(30,23,14,0.6)');
    // 命宫 / 身宫 / 五行局 / 大限（两行，不挤）
    doc.text(`命宫：${zw.mingGong}`, CX + PAD, y + 24, 11, ZH_FAMILY, ZH_CREAM, 'start');
    doc.text(`身宫：${zw.shenGong}`, CX + CW / 2, y + 24, 11, ZH_FAMILY, ZH_CREAM, 'start');
    doc.text(`五行局：${zw.wuXingJu}`, CX + PAD, y + 44, 11, ZH_FAMILY, ZH_CREAM, 'start');
    doc.text(`大限：${zw.daXianDirection}`, CX + CW / 2, y + 44, 11, ZH_FAMILY, ZH_CREAM, 'start');
    // 主星表头
    doc.line(CX + PAD, y + 56, CX + CW - PAD, y + 56, 'rgba(211,166,86,0.22)', { sw: 0.4 });
    doc.text('主 星 分 布', CX + PAD, y + 72, 10, ZH_FAMILY, ZH_LABEL, 'start', { weight: 700 });
    const starColW = (CW - PAD * 2) / 3;
    doc.text('星曜', CX + PAD, y + 90, 9, ZH_FAMILY, 'rgba(211,166,86,0.5)', 'start');
    doc.text('宫位', CX + PAD + starColW, y + 90, 9, ZH_FAMILY, 'rgba(211,166,86,0.5)', 'start');
    doc.text('亮度', CX + PAD + starColW * 2, y + 90, 9, ZH_FAMILY, 'rgba(211,166,86,0.5)', 'start');
    const visibleStars = zw.mainStars.slice(0, 3);
    visibleStars.forEach((s, i) => {
      const ry = y + 106 + i * 14;
      doc.text(s.star, CX + PAD, ry, 9, ZH_FAMILY, i === 0 ? ZH_GOLD : ZH_BODY, 'start');
      doc.text(s.gong, CX + PAD + starColW, ry, 9, ZH_FAMILY, ZH_BODY, 'start');
      doc.text(s.brightness, CX + PAD + starColW * 2, ry, 9, ZH_FAMILY, ZH_BODY, 'start');
    });
    // 四化（底部独立行，与最后一颗星 y+134 隔 18px → y+152）
    const siHuaTxt = zw.siHua.map(s => `${s.star}${s.hua}`).join('  ');
    doc.line(CX + PAD, y + 142, CX + CW - PAD, y + 142, 'rgba(211,166,86,0.18)', { sw: 0.4 });
    doc.text(`四化：${siHuaTxt}`, CX + PAD, y + zwH - 12, 10, ZH_FAMILY, ZH_VERM, 'start', { weight: 700 });
    y += zwH + GAP;
  }

  // 3.8 六爻基础（六亲 / 干支 / 六神 表）—— 行距加大
  {
    const ly = data.state.panels.liuyao;
    secTitle('六 爻 基 础', 'LIUYAO');
    y += 14;
    const lyH = 122;
    card(lyH, 'rgba(36,28,17,0.72)');
    const cols = ['爻位', '六亲', '干支', '六神'];
    const colWs = [56, 76, 96, 76];
    const totalCW = colWs.reduce((a, b) => a + b, 0);
    const startX = CX + (CW - totalCW) / 2;
    // 表头
    cols.forEach((c, i) => {
      const cx = startX + colWs.slice(0, i).reduce((a, b) => a + b, 0);
      doc.text(c, cx, y + 22, 10, ZH_FAMILY, ZH_LABEL, 'start', { weight: 700 });
    });
    doc.line(startX, y + 28, startX + totalCW, y + 28, 'rgba(211,166,86,0.3)', { sw: 0.4 });
    // 6 爻（自上而下 6→1，行距 14px）
    const sortedLy = [...ly.liuQinMap].reverse();
    sortedLy.forEach((q, i) => {
      const ry = y + 44 + i * 13;
      const shen = ly.liuShen[5 - i] || '';
      doc.text(`${q.position}爻`, startX, ry, 9, ZH_FAMILY, ZH_BODY, 'start');
      doc.text(q.liuQin, startX + colWs[0], ry, 9, ZH_FAMILY, ZH_BODY, 'start');
      doc.text(q.ganZhi, startX + colWs[0] + colWs[1], ry, 9, ZH_FAMILY, ZH_BODY, 'start');
      doc.text(shen, startX + colWs[0] + colWs[1] + colWs[2], ry, 9, ZH_FAMILY, ZH_BODY, 'start');
    });
    y += lyH + GAP;
  }

  // 4. 综合断语 —— 重排，避免徽章与文字重叠、要点/提醒分行
  secTitle('综 合 断 语', 'SUMMARY');
  y += 14;
  const synH = 168;
  card(synH);
  const syn = data.synthesis;
  const scoreRatio = Math.max(0.02, Math.min(1, (syn.score ?? 0) / 100));
  // 上半区：左 圆形徽章 | 中 趋势文字 | 右 评分+吉凶度
  const badgeCx = CX + 40;
  const badgeCy = y + 52;
  doc.g(`filter="url(#${glow})"`, () => doc.circle(badgeCx, badgeCy, 28, 'rgba(192,70,58,0.16)', { stroke: ZH_VERM, sw: 1.6 }));
  doc.text(syn.trend === '大凶' ? '凶' : syn.trend === '上吉' ? '吉' : syn.trend || '吉', badgeCx, badgeCy + 10, 28, ZH_FAMILY, ZH_VERM, 'middle', { weight: 700 });
  // 趋势文字（中列，宽 200px）
  const trendX = CX + 88;
  const trendW = 200;
  doc.text('趋  势', trendX, y + 30, 11, ZH_FAMILY, ZH_LABEL, 'start');
  const trendTxt = syn.summary || '一阳来复 · 渐入佳境';
  addLines(doc, trendTxt, trendX, y + 52, trendW, 13, ZH_FAMILY, 19, ZH_CREAM, 2);
  // 评分与吉凶度（右列）
  const scoreX = CX + 308;
  doc.text('评  分', scoreX, y + 30, 11, ZH_FAMILY, ZH_LABEL, 'start');
  doc.text(`${syn.score ?? 0} / 100`, scoreX, y + 56, 18, ZH_FAMILY, ZH_CREAM, 'start', { weight: 700 });
  doc.text('吉 凶 度', scoreX + 120, y + 30, 11, ZH_FAMILY, ZH_LABEL, 'start');
  doc.rect(scoreX + 120, y + 44, 196, 9, 'rgba(211,166,86,0.14)', { stroke: 'rgba(211,166,86,0.35)', sw: 0.5, rx: 4.5 });
  doc.rect(scoreX + 120, y + 44, 196 * scoreRatio, 9, ZH_VERM, { rx: 4.5 });
  // 下半区：要点 / 提醒 / 建议（各自独立行，要点最多2行后留间距再放提醒）
  doc.line(CX + PAD, y + 92, W - CX - PAD, y + 92, 'rgba(211,166,86,0.2)', { sw: 0.4 });
  addLines(doc, `要点：${syn.keyPoints.join('；') || '—'}`, CX + PAD, y + 110, CW - PAD * 2, 11, ZH_FAMILY, 18, 'rgba(242,231,205,0.85)', 2);
  addLines(doc, `提醒：${syn.warnings.join('；') || '—'}`, CX + PAD, y + 146, CW - PAD * 2, 11, ZH_FAMILY, 18, 'rgba(242,231,205,0.75)', 2);
  y += synH + GAP;

  // 5. AI 解挂（底部自适应，严格在 footer 之上）
  // footer 分隔线在 y = H - 106（footBase - 78），AI 区底边不能越过此线
  const aiBottomLimit = H - 110;
  if (data.ai && data.ai.trim()) {
    secTitle('AI 解 挂', 'AI INSIGHT');
    y += 14;
    // AI 区块高度：用满底部剩余空间，严格 ≤ aiBottomLimit - y - 16
    const availSpace = aiBottomLimit - y - 16;
    if (availSpace < 60) {
      // 剩余空间不足以放 AI 区块：只画标题，不画卡片（避免与 footer 堆叠）
      y += 12;
    } else {
      const aiH = availSpace;
      card(aiH, 'rgba(30,23,14,0.65)');
      const availW = CW - PAD * 2;
      // 根据可用高度自适应字号/行距，保证 350 字能放下
      const aiPx = availSpace < 120 ? 12 : 13;
      const aiGap = availSpace < 120 ? 19 : 22;
      const aiMaxLines = Math.max(3, Math.floor((aiH - 24) / aiGap));
      addLines(doc, stripMarkdown(data.ai), CX + PAD, y + 26, availW, aiPx, ZH_FAMILY, aiGap, ZH_BODY, aiMaxLines);
      y += aiH + 16;
    }
  } else {
    y += 12;
  }

  // Footer（去掉玄机阁红印，精简底部）—— 4 行文字从框底向上紧凑排列，确保不超出外框
  // 外框底边 y = H - 22；最后一行底边贴 y = H - 28，逐行向上
  const footBase = H - 28;       // 最后一行（10px 字）底边
  const footLines: ReadonlyArray<readonly [number, string, number, string, string]> = [
    [footBase - 62, 'No. 47', 11, LATIN_FAMILY, 'rgba(211,166,86,0.5)'],
    [footBase - 42, '玄界 · 第四十七卦', 13, ZH_FAMILY, ZH_CREAM],
    [footBase - 22, `推演于 ${nowZh()}`, 11, ZH_FAMILY, 'rgba(242,231,205,0.55)'],
    [footBase, '玄机阁 · 仅供文化研究与术数学习参考', 10, ZH_FAMILY, 'rgba(242,231,205,0.4)'],
  ];
  drawZhDivider(doc, W / 2, footBase - 78, 200, 'rgba(211,166,86,0.35)', 0.4);
  footLines.forEach(([ly, txt, px, fam, color]) => {
    doc.text(txt, CX, ly, px, fam, color, 'start', px >= 13 ? { weight: 700 } : undefined);
  });

  return doc.toString();
}



const W_LIGHT = 'rgba(244,238,255,0.92)';
const W_DIM = 'rgba(196,181,255,0.75)';
const W_GOLD = '#d4a949';
const W_GOLD_DIM = 'rgba(212,169,73,0.6)';
const W_PURPLE = '#c4b5ff';
/** 12 星座符号常量已废弃：星盘全部由 renderChartSVG() 渲染，此处不再独立维护。 */

function drawWStarfield(doc: SvgDoc, count: number): void {
  let s = 20260816;
  const rnd = () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
  for (let i = 0; i < count; i++) {
    const x = 30 + rnd() * (W - 60);
    const y = 30 + rnd() * (H - 60);
    const r = 0.4 + rnd() * 1.3;
    const alpha = 0.15 + rnd() * 0.6;
    const fill = i % 7 === 0 ? 'rgba(245,197,99,0.9)' : '#f4edff';
    doc.circle(x, y, r, fill, { opacity: alpha });
  }
}

function drawConstellation(doc: SvgDoc, pts: ReadonlyArray<readonly [number, number]>, alpha: number): void {
  doc.polyline(pts, `rgba(196,181,255,${alpha})`, { sw: 1 });
  for (const [x, y] of pts) {
    doc.circle(x, y, 2.2, `rgba(232,217,245,${alpha + 0.15})`);
  }
}

function drawWBackground(doc: SvgDoc): void {
  const bg = doc.linearGradient(
    [[0, '#08061a'], [0.4, '#0f0c2a'], [0.75, '#160f34'], [1, '#1a0e30']],
    0, 0, 0, H,
  );
  doc.rect(0, 0, W, H, bg);
  drawWStarfield(doc, 150);

  const nebulaGlow = doc.radialGradient(
    [[0, 'rgba(120,80,200,0.12)'], [0.4, 'rgba(80,50,150,0.05)'], [1, 'rgba(0,0,0,0)']],
    W / 2, 60, 460,
  );
  doc.rect(0, 0, W, 420, nebulaGlow);

  const moonGlow = doc.radialGradient(
    [[0, 'rgba(212,169,73,0.1)'], [1, 'rgba(0,0,0,0)']],
    650, 60, 250,
  );
  doc.rect(0, 0, W, 350, moonGlow);
}

function drawWFrame(doc: SvgDoc): void {
  doc.rect(16, 16, W - 32, H - 32, undefined, { stroke: 'rgba(232,217,245,0.5)', sw: 1.4, rx: 10 });
  doc.rect(27, 27, W - 54, H - 54, undefined, { stroke: 'rgba(196,181,255,0.25)', sw: 1, rx: 7 });
  // 四角星饰
  doc.g('opacity="0.5"', () => {
    for (const [cx, cy] of [[16, 16], [W - 16, 16], [16, H - 16], [W - 16, H - 16]] as const) {
      doc.g(`transform="translate(${cx},${cy}) rotate(45)"`, () => {
        doc.rect(-4, -4, 8, 8, W_GOLD_DIM);
        doc.rect(-8, -1, 16, 2, W_GOLD_DIM);
        doc.rect(-1, -8, 2, 16, W_GOLD_DIM);
      });
    }
  });
}

function drawWDivider(doc: SvgDoc, y: number): void {
  doc.line(56, y, W - 56, y, 'rgba(196,181,255,0.4)', { sw: 1 });
  doc.text('✦', W / 2, y + 3, 12, LATIN_FAMILY, 'rgba(245,197,99,0.9)', 'middle');
}

function drawWSection(doc: SvgDoc, y: number, text: string): number {
  doc.rect(56, y - 16, 4, 22, W_GOLD, { rx: 1 });
  doc.text(text, 74, y, 19, ZH_FAMILY, 'rgba(244,238,255,0.95)', 'start', { weight: 700 });
  const tw = getMeasure().width(text, 19, ZH_FAMILY);
  doc.line(74 + tw + 12, y - 7, W - 56, y - 7, 'rgba(212,169,73,0.35)', { sw: 0.6 });
  doc.text('✦', 46, y - 2, 10, LATIN_FAMILY, 'rgba(245,197,99,0.9)');
  return y + 12;
}

function signName(signId: string): string {
  const s = SIGN_MAP.get(signId);
  return s ? `${s.name} ${s.symbol}` : signId;
}

function planetLine(p: PlanetPosition): string {
  const deg = Math.round(p.degreeInSign * 10) / 10;
  return `${p.name} ${signName(p.signId)} ${deg}°${p.retrograde ? ' (逆行)' : ''}`;
}

function drawWesternHeader(doc: SvgDoc, title: string, sub: string): void {
  const tw = getMeasure().width(title, 40, ZH_FAMILY);
  // 标题/副标题统一上移，避免与下方星盘（轮盘顶部及 ASC/MC 标签）重叠
  doc.text(title, W / 2, 150, 40, ZH_FAMILY, 'rgba(244,238,255,0.95)', 'middle');
  doc.line(W / 2 - tw / 2 - 40, 132, W / 2 - tw / 2 - 12, 132, 'rgba(245,197,99,0.6)', { sw: 1 });
  doc.line(W / 2 + tw / 2 + 12, 132, W / 2 + tw / 2 + 40, 132, 'rgba(245,197,99,0.6)', { sw: 1 });
  doc.text(sub, W / 2, 182, 13, ZH_FAMILY, W_DIM, 'middle');
}

function drawWFooter(doc: SvgDoc, title: string): void {
  doc.text(`${title} · 玄 机 阁 · 仅 供 文 化 研 究 与 占 星 学 习 参 考`, W / 2, H - 46, 14, ZH_FAMILY, 'rgba(232,217,245,0.6)', 'middle');
  doc.text(`推演于 ${nowZh()}`, W / 2, H - 24, 12, ZH_FAMILY, 'rgba(196,181,255,0.45)', 'middle');
}

function formatBirth(b: BirthInfo): string {
  const lon = `经度${Math.abs(b.longitude).toFixed(2)}°${b.longitude >= 0 ? 'E' : 'W'}`;
  const lat = `纬度${Math.abs(b.latitude).toFixed(2)}°${b.latitude >= 0 ? 'N' : 'S'}`;
  const tz = `UTC${b.timezone > 0 ? '+' : ''}${b.timezone}`;
  return `${b.year}-${pad(b.month)}-${pad(b.day)} ${pad(b.hour)}:${pad(b.minute)}:${pad(b.second)} · ${lon} · ${lat} · ${tz}`;
}

/**
 * AI 解语区块：根据剩余纵向空间自动缩放字号/行高，并限制行数，
 * 保证正文在底部 (H-94) 之前结束，避免长文本把海报内容推出画布。
 */
function drawAiBlockFit(
  doc: SvgDoc,
  y: number,
  ai: string | undefined,
  sectionTitle: string,
): number {
  if (!ai || !ai.trim()) return y;
  y = drawWSection(doc, y, sectionTitle);
  y += 10;
  // 底部预留：divider 与 footer 固定在画布底部，AI 正文必须在 H-94 前收束
  const avail = H - 94 - y - 6;
  let lineGap = 24;
  let px = 15;
  if (avail < lineGap * 3 + 30) { lineGap = 20; px = 13; }
  if (avail < lineGap * 2 + 24) { lineGap = 18; px = 12; }
  const maxLines = Math.max(1, Math.floor(avail / lineGap));
  y = addLines(doc, stripMarkdown(ai), 56, y, W - 112, px, ZH_FAMILY, lineGap, 'rgba(232,217,245,0.85)', maxLines);
  return y + 4;
}

/**
 * 塔罗牌绘制：与界面 w-tarot-face 观感一致的纯 SVG 渲染（避免 foreignObject 引起 canvas 污染）
 * - 自动从中文名 / 序号 / 符号 / 关键词生成完整卡面
 * - 逆位时整体旋转 180° 并切换玫紫渐变
 * - 所有元素使用内联样式，零外部依赖
 */
function drawTarotCard(
  doc: SvgDoc,
  x: number, y: number, w: number, h: number,
  name: string,
  en: string,
  symbol: string,
  num: string,
  keyword: string,
  orient: 'up' | 'down',
  accent: string,
): void {
  const isRev = orient === 'down';
  const inner = (): void => {
    // 背景渐变（与界面 .w-tarot-face 同步：正位为深空蓝紫，逆位为玫紫调）
    const bg = doc.linearGradient(
      isRev
        ? [[0, '#241a2e'], [0.55, '#14101f'], [1, '#0a0710']]
        : [[0, 'rgba(30,24,65,0.96)'], [0.5, 'rgba(20,16,50,0.98)'], [1, 'rgba(15,12,40,0.95)']],
      0, 0, 0, h,
    );
    doc.rect(0, 0, w, h, bg, { stroke: accent, sw: 1.2, rx: 6 });
    // 顶部光晕（与界面 radial-gradient 顶部光晕对应）
    if (isRev) {
      doc.rect(0, 0, w, h, 'rgba(232,180,188,0.18)', { opacity: 0.18, rx: 6 });
      doc.rect(0, 0, w, h, 'rgba(155,123,196,0.28)', { opacity: 0.28, rx: 6 });
    } else {
      const halo = doc.radialGradient(
        [[0, 'rgba(232,180,188,0.18)'], [1, 'rgba(232,180,188,0)']],
        w / 2, h * 0.16, Math.max(w, h) * 0.55,
      );
      doc.rect(0, 0, w, h * 0.55, halo, { opacity: 0.18, rx: 6 });
      const halo2 = doc.radialGradient(
        [[0, 'rgba(155,123,196,0.28)'], [1, 'rgba(155,123,196,0)']],
        w / 2, h * 1.18, Math.max(w, h) * 0.6,
      );
      doc.rect(0, h * 0.6, w, h * 0.4, halo2, { opacity: 0.28, rx: 6 });
    }
    // 内层金色边框（对应 ::before 装饰线）
    doc.rect(6, 6, w - 12, h - 12, 'none', {
      stroke: `color-mix(in srgb, ${accent} 38%, rgba(245,197,99,0.2))`,
      sw: 0.6, rx: 10,
    });
    // 顶部数字徽章（左上角）
    doc.circle(16, 16, 8, 'none', { stroke: `color-mix(in srgb, ${accent} 55%, transparent)`, sw: 0.8 });
    doc.text(num, 16, 19, 9, LATIN_FAMILY, `color-mix(in srgb, ${accent} 80%, #fff 20%)`, 'middle', { weight: 700 });
    // 顶部方向徽章（右上角）
    const oriLabel = isRev ? '逆位' : '正位';
    const oriColor = isRev ? '#E8B4BC' : '#F5C563';
    const oriW = 26;
    doc.rect(w - 16 - oriW, 8, oriW, 12, 'none', {
      stroke: isRev ? 'rgba(232,180,188,0.4)' : 'rgba(245,197,99,0.35)',
      sw: 0.6, rx: 6,
    });
    doc.rect(w - 16 - oriW, 8, oriW, 12, isRev ? 'rgba(232,180,188,0.1)' : 'rgba(245,197,99,0.08)', { opacity: 0.8, rx: 6 });
    doc.text(oriLabel, w - 16 - oriW / 2, 17, 7, ZH_FAMILY, oriColor, 'middle');
    // 中央符号
    const symSize = Math.min(28, w * 0.28);
    doc.text(symbol, w / 2, h * 0.42, symSize, LATIN_FAMILY, accent, 'middle', { weight: 700 });
    // 卡名（中文）
    const nameSize = Math.min(11, w * 0.14);
    doc.text(name, w / 2, h * 0.6, nameSize, ZH_FAMILY, '#D6E4F0', 'middle', { weight: 700 });
    // 英文名
    const enSize = Math.min(7, w * 0.085);
    doc.text(en, w / 2, h * 0.66, enSize, LATIN_FAMILY, `color-mix(in srgb, ${accent} 75%, #D6E4F0 25%)`, 'middle');
    // 关键词分隔线
    doc.line(10, h * 0.74, w - 10, h * 0.74, 'rgba(245,197,99,0.25)', { sw: 0.4 });
    // 关键词（虚线框风格 + 小字）
    const kwSize = Math.min(6, w * 0.07);
    const kwLines = wrapText(keyword, w - 20, kwSize, ZH_FAMILY);
    let ky = h * 0.79;
    for (const line of kwLines.slice(0, 2)) {
      doc.text(line, w / 2, ky, kwSize, ZH_FAMILY, 'rgba(157,195,230,0.85)', 'middle');
      ky += kwSize * 1.6;
    }
    // 上下装饰线
    doc.line(8, 22, w - 8, 22, 'rgba(212,169,73,0.25)', { sw: 0.4 });
    doc.line(8, h - 22, w - 8, h - 22, 'rgba(212,169,73,0.25)', { sw: 0.4 });
    // 中心点（保持神秘感，对应界面的 NATAL 中心）
    doc.circle(w / 2, h * 0.42, 2, `color-mix(in srgb, ${accent} 30%, transparent)`, { opacity: 0.5 });
  };
  if (isRev) {
    doc.g(`transform="translate(${x + w / 2},${y + h / 2}) rotate(180) translate(${-w / 2},${-h / 2})"`, inner);
  } else {
    doc.g(`transform="translate(${x},${y})"`, inner);
  }
}

/**
 * 计算"动态"牌阵布局：≤3 牌用横排大牌；4-6 牌用 2×N 网格；7+ 用 N 列网格
 * 返回 { cols, rows, cardW, cardH }
 */
function tarotGrid(count: number, availW: number, availH: number): { cols: number; rows: number; cardW: number; cardH: number; } {
  if (count <= 1) return { cols: 1, rows: 1, cardW: availW * 0.55, cardH: availH * 0.7 };
  if (count <= 3) {
    const cardW = (availW - (count - 1) * 18) / count;
    const cardH = Math.min(availH * 0.72, cardW * 1.55);
    return { cols: count, rows: 1, cardW, cardH };
  }
  if (count <= 6) {
    const cols = count <= 4 ? count : 3;
    const rows = Math.ceil(count / cols);
    const cardW = (availW - (cols - 1) * 14) / cols;
    const cardH = Math.min(availH / rows - 16, cardW * 1.6);
    return { cols, rows, cardW, cardH };
  }
  // 7+：密集网格
  if (count >= 10) {
    const cols = 6; // 12 牌用 6×2；10 牌用 5×2
    const rows = Math.ceil(count / cols);
    const cardW = (availW - (cols - 1) * 8) / cols;
    const cardH = Math.min(availH / rows - 8, cardW * 1.55);
    return { cols, rows, cardW, cardH };
  }
  const cols = 4;
  const rows = Math.ceil(count / cols);
  const cardW = (availW - (cols - 1) * 10) / cols;
  const cardH = Math.min(availH / rows - 10, cardW * 1.7);
  return { cols, rows, cardW, cardH };
}

/** 圆形星盘已废弃：改用 renderChartSVG() 嵌入真实星盘（含相位连线/12 宫/行星精确位置）。
 * 保留此注释作为迁移提示，避免有人再 fork 旧实现。 */

/** 星卡（本命盘用的总结卡片） */
function wCard(doc: SvgDoc, x: number, y: number, w: number, h: number, bg: string, stroke: string, rx = 8): void {
  doc.rect(x, y, w, h, bg, { stroke, sw: 1, rx });
  doc.line(x + rx, y + 1, x + w - rx, y + 1, 'rgba(255,255,255,0.05)', { sw: 0.5 });
  doc.line(x + rx, y + h - 1, x + w - rx, y + h - 1, 'rgba(0,0,0,0.2)', { sw: 0.5 });
}

export function createWesternPosterSVG(data: WesternPosterData): string {
  const doc = new SvgDoc(W, H);

  drawWBackground(doc);
  drawWFrame(doc);
  drawConstellation(doc, [[108, 108], [168, 96], [210, 130], [260, 112]], 0.35);
  drawConstellation(doc, [[660, 90], [706, 128], [676, 172]], 0.3);
  drawConstellation(doc, [[90, 180], [128, 206], [96, 238]], 0.25);

  if (data.kind === 'chart') {
    const chart = data.chart;
    drawWesternHeader(doc, '星 语 · 本 命 星 盘', `Natal Chart · ${chart.sunSign ? signName(chart.sunSign.id) : ''}`);
    // ===== 星盘作为视觉中心：360×360 居中，外加辉光晕环 + 装饰刻度环 =====
    const chartSize = 360;
    const chartX = (W - chartSize) / 2;
    const chartY = 212;
    const chartCx = chartX + chartSize / 2;
    const chartCy = chartY + chartSize / 2;
    // 外层辉光（深空氛围）
    const haloGrad = doc.radialGradient(
      [[0, 'rgba(212,169,73,0.18)'], [0.5, 'rgba(155,123,196,0.10)'], [1, 'rgba(0,0,0,0)']],
      chartCx, chartCy, chartSize * 0.72,
    );
    doc.circle(chartCx, chartCy, chartSize * 0.72, haloGrad);
    // 装饰外环（金色细环 + 虚线刻度）
    doc.circle(chartCx, chartCy, chartSize / 2 + 10, 'none', { stroke: 'rgba(212,169,73,0.35)', sw: 0.8 });
    doc.circle(chartCx, chartCy, chartSize / 2 + 16, 'none', { stroke: 'rgba(196,181,255,0.18)', sw: 0.5, opacity: 0.6 });
    // 12 方位刻度（装饰性，与星盘 12 宫呼应）
    doc.g(`transform="translate(${chartCx},${chartCy})"`, () => {
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
        doc.line(
          Math.cos(a) * (chartSize / 2 + 12), Math.sin(a) * (chartSize / 2 + 12),
          Math.cos(a) * (chartSize / 2 + 18), Math.sin(a) * (chartSize / 2 + 18),
          'rgba(245,197,99,0.5)', { sw: 0.8 },
        );
      }
    });
    // 真实星盘 SVG（含相位连线、12 宫、行星精确位置）
    doc.nestedSvg(renderChartSVG(chart, chartSize), chartX, chartY, chartSize, chartSize);

    const CX = 56, CW = W - 112;

    // 专属：所问之事（独立节区）
    let y = chartY + chartSize + 24;
    function secTitle(label: string, en: string): void {
      doc.rect(CX, y - 16, 4, 22, W_GOLD, { rx: 1 });
      doc.text(label, CX + 14, y, 19, ZH_FAMILY, 'rgba(244,238,255,0.95)', 'start', { weight: 700 });
      doc.text(en, W - CX, y - 3, 9, LATIN_FAMILY, 'rgba(196,181,255,0.5)', 'end');
      doc.line(CX + 14, y + 9, W - CX, y + 9, 'rgba(212,169,73,0.26)', { sw: 0.6 });
    }

    if (data.question && data.question.trim()) {
      secTitle('所 问 之 事', 'QUESTION');
      y += 12;
      wCard(doc, CX, y, CW, 40, 'rgba(18,14,50,0.55)', 'rgba(212,169,73,0.35)');
      doc.text(truncateText(data.question.trim(), 48), CX + 18, y + 26, 13, ZH_FAMILY, W_LIGHT);
      y += 40 + 14;
    }

    // 出生信息 + 命盘要素（左右双列，节省纵向空间）
    secTitle('出 生 信 息 / 命 盘 要 素', 'BIRTH & KEY POINTS');
    y += 12;
    const halfW = (CW - 12) / 2;
    wCard(doc, CX, y, halfW, 60, 'rgba(18,14,50,0.55)', 'rgba(212,169,73,0.35)');
    doc.text('出 生 信 息', CX + 14, y + 18, 10, ZH_FAMILY, 'rgba(196,181,255,0.6)');
    doc.text(formatBirth(chart.birth), CX + 14, y + 40, 11, ZH_FAMILY, W_LIGHT);
    // 命盘要素（右列：太阳/月亮/上升/天顶 2×2）
    wCard(doc, CX + halfW + 12, y, halfW, 60, 'rgba(18,14,50,0.55)', 'rgba(212,169,73,0.35)');
    doc.text('命 盘 要 素', CX + halfW + 24, y + 18, 10, ZH_FAMILY, 'rgba(196,181,255,0.6)');
    const asc = chart.ascSign ? `上升 ${signName(chart.ascSign.id)}` : '上升 —';
    const mc = chart.mcSign ? `天顶 ${signName(chart.mcSign.id)}` : '天顶 —';
    const sun = chart.sunSign ? `太阳 ${signName(chart.sunSign.id)}` : '太阳 —';
    const moonP = chart.planets.find(p => p.id === 'moon');
    const moonTxt = moonP ? `月亮 ${signName(moonP.signId)}` : '月亮 —';
    const items: Array<[string, string]> = [['太阳', sun], ['月亮', moonTxt], ['上升', asc], ['天顶', mc]];
    const subCellW = (halfW - 24) / 2;
    items.forEach(([k, v], i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const dx = CX + halfW + 12 + 12 + col * subCellW;
      doc.text(k, dx, y + 18 + row * 24, 9, ZH_FAMILY, 'rgba(196,181,255,0.6)');
      doc.text(v, dx, y + 32 + row * 24, 11, ZH_FAMILY, i === 0 ? W_GOLD : W_LIGHT);
    });
    y += 60 + 14;

    // 行星分布（2 列，行距加大避免堆叠）
    secTitle('行 星 分 布', 'PLANETS');
    y += 12;
    const planets = chart.planets;
    const pH = Math.ceil(planets.length / 2) * 22 + 16;
    wCard(doc, CX, y, CW, pH, 'rgba(18,14,50,0.55)', 'rgba(212,169,73,0.35)');
    const colW2 = (CW - 36) / 2;
    for (let i = 0; i < planets.length; i++) {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const dx = CX + 18 + col * colW2;
      doc.text(planetLine(planets[i]), dx, y + 24 + row * 22, 12, ZH_FAMILY, i === 0 ? W_GOLD : W_LIGHT);
    }
    y += pH + 12;

    if (chart.aspects && chart.aspects.length) {
      secTitle('主 要 相 位', 'ASPECTS');
      y += 12;
      const aspects = chart.aspects.slice(0, 8);
      // 左右两栏布局：避免左侧留白过多
      const halfAspectW = (CW - 12) / 2;
      const perCol = Math.ceil(aspects.length / 2);
      const aH = perCol * 22 + 16;
      wCard(doc, CX, y, CW, aH, 'rgba(18,14,50,0.55)', 'rgba(212,169,73,0.35)');
      const names = new Map(chart.planets.map(p => [p.id, p.name]));
      aspects.forEach((a, i) => {
        const n1 = names.get(a.p1) || a.p1;
        const n2 = names.get(a.p2) || a.p2;
        const col = Math.floor(i / perCol);
        const row = i % perCol;
        const dx = CX + 18 + col * halfAspectW;
        const txt = `${n1} ${a.typeZh} ${n2}（${a.symbol}${a.angle}°）`;
        doc.text(txt.slice(0, 22), dx, y + 24 + row * 22, 11, ZH_FAMILY, W_LIGHT);
      });
      y += aH + 12;
    }

    y = drawAiBlockFit(doc, y, data.ai, 'AI 解 语');
    y += 4;

    drawWDivider(doc, y);
    y += 14;
    drawWFooter(doc, '本命星盘');
  } else if (data.kind === 'synastry') {
    drawWesternHeader(doc, '星 语 · 合 盘 星 图', `Synastry · ${data.chartA.sunSign ? signName(data.chartA.sunSign.id) : ''} × ${data.chartB.sunSign ? signName(data.chartB.sunSign.id) : ''}`);
    const CX = 56, CW = W - 112;
    let y = 220;

    function secTitle(label: string, en: string): void {
      doc.rect(CX, y - 16, 4, 22, W_GOLD, { rx: 1 });
      doc.text(label, CX + 14, y, 19, ZH_FAMILY, 'rgba(244,238,255,0.95)', 'start', { weight: 700 });
      doc.text(en, W - CX, y - 3, 9, LATIN_FAMILY, 'rgba(196,181,255,0.5)', 'end');
      doc.line(CX + 14, y + 9, W - CX, y + 9, 'rgba(212,169,73,0.26)', { sw: 0.6 });
    }

    // 专属：所问之事（独立节区，紧贴副标题）
    if (data.question && data.question.trim()) {
      secTitle('所 问 之 事', 'QUESTION');
      y += 12;
      wCard(doc, CX, y, CW, 40, 'rgba(18,14,50,0.55)', 'rgba(212,169,73,0.35)');
      doc.text(truncateText(data.question.trim(), 48), CX + 18, y + 26, 13, ZH_FAMILY, W_LIGHT);
      y += 40 + 12;
    }

    // 甲方 / 乙方摘要（左右双列，各占半幅，避免文字堆叠）
    const a = data.chartA, b = data.chartB;
    y = 268;
    const halfInfoW = (CW - 16) / 2;
    // 甲方信息卡片（左）
    wCard(doc, CX, y, halfInfoW, 78, 'rgba(18,14,50,0.55)', 'rgba(212,169,73,0.35)');
    doc.text('甲 方 星 盘', CX + 14, y + 22, 15, ZH_FAMILY, W_GOLD, 'start', { weight: 700 });
    doc.text(a.sunSign ? `太阳 ${signName(a.sunSign.id)}` : '', CX + 14, y + 42, 11, ZH_FAMILY, W_LIGHT);
    doc.text(a.ascSign ? `上升 ${signName(a.ascSign.id)}` : '', CX + 14, y + 60, 11, ZH_FAMILY, W_DIM);
    // 乙方信息卡片（右）
    const bX = CX + halfInfoW + 16;
    wCard(doc, bX, y, halfInfoW, 78, 'rgba(18,14,50,0.55)', 'rgba(212,169,73,0.35)');
    doc.text('乙 方 星 盘', bX + 14, y + 22, 15, ZH_FAMILY, W_PURPLE, 'start', { weight: 700 });
    doc.text(b.sunSign ? `太阳 ${signName(b.sunSign.id)}` : '', bX + 14, y + 42, 11, ZH_FAMILY, W_LIGHT);
    doc.text(b.ascSign ? `上升 ${signName(b.ascSign.id)}` : '', bX + 14, y + 60, 11, ZH_FAMILY, W_DIM);
    y += 78 + 16;

    // 双人星盘：280×280，内联 UI 按 0.72 缩放，让星盘内部元素清晰不拥挤
    const synChartSize = 280;
    const synScale = 0.72;
    const synGap = 24;
    const synX0 = (W - synChartSize * 2 - synGap) / 2;
    const synY = y;
    const synCx1 = synX0 + synChartSize / 2;
    const synCy1 = synY + synChartSize / 2;
    const synCx2 = synX0 + synChartSize + synGap + synChartSize / 2;
    const synCy2 = synCy1;
    // 双盘辉光背景
    const synHaloA = doc.radialGradient(
      [[0, 'rgba(212,169,73,0.14)'], [1, 'rgba(0,0,0,0)']],
      synCx1, synCy1, synChartSize * 0.65,
    );
    doc.circle(synCx1, synCy1, synChartSize * 0.65, synHaloA);
    const synHaloB = doc.radialGradient(
      [[0, 'rgba(196,181,255,0.14)'], [1, 'rgba(0,0,0,0)']],
      synCx2, synCy2, synChartSize * 0.65,
    );
    doc.circle(synCx2, synCy2, synChartSize * 0.65, synHaloB);
    // 装饰外环
    doc.circle(synCx1, synCy1, synChartSize / 2 + 8, 'none', { stroke: 'rgba(212,169,73,0.3)', sw: 0.6 });
    doc.circle(synCx2, synCy2, synChartSize / 2 + 8, 'none', { stroke: 'rgba(196,181,255,0.25)', sw: 0.6 });
    doc.nestedSvg(renderChartSVG(data.chartA, synChartSize, synScale), synX0, synY, synChartSize, synChartSize);
    doc.nestedSvg(renderChartSVG(data.chartB, synChartSize, synScale), synX0 + synChartSize + synGap, synY, synChartSize, synChartSize);
    // 甲/乙标签（星盘下方）
    doc.text('A 盘', synCx1, synY + synChartSize + 18, 12, ZH_FAMILY, W_GOLD, 'middle', { weight: 700 });
    doc.text('B 盘', synCx2, synY + synChartSize + 18, 12, ZH_FAMILY, W_PURPLE, 'middle', { weight: 700 });

    // 合盘相位（左右两栏布局，避免左侧留白过多）
    y = synY + synChartSize + 32;
    secTitle('合 盘 相 位', 'ASPECTS');
    y += 12;
    const allAspects = data.aspects.slice(0, 12);
    const halfAspectW = (CW - 12) / 2;
    const perCol = Math.ceil(allAspects.length / 2);
    const aH = perCol * 22 + 16;
    wCard(doc, CX, y, CW, aH, 'rgba(18,14,50,0.55)', 'rgba(212,169,73,0.35)');
    const namesA = new Map(data.chartA.planets.map(p => [p.id, p.name]));
    allAspects.forEach((asp, i) => {
      const n1 = namesA.get(asp.p1) || asp.p1;
      const n2 = namesA.get(asp.p2) || asp.p2;
      const col = Math.floor(i / perCol);
      const row = i % perCol;
      const dx = CX + 18 + col * halfAspectW;
      const txt = `${n1} ${asp.typeZh} ${n2}（${asp.symbol}${asp.angle}°）`;
      doc.text(txt.slice(0, 22), dx, y + 24 + row * 22, 11, ZH_FAMILY, W_LIGHT);
    });
    y += aH + 12;
    y = drawAiBlockFit(doc, y, data.ai, 'AI 解 语');
    y += 4;

    drawWDivider(doc, y);
    y += 14;
    drawWFooter(doc, '合盘星图');
  } else {
    const spread = data.spread;
    drawWesternHeader(doc, '星 语 · 塔 罗 启 示', `Tarot · ${spread.spreadName}`);
    const CX = 56, CW = W - 112;
    let y = 220;

    function secTitle(label: string, en: string): void {
      doc.rect(CX, y - 16, 4, 22, W_GOLD, { rx: 1 });
      doc.text(label, CX + 14, y, 19, ZH_FAMILY, 'rgba(244,238,255,0.95)', 'start', { weight: 700 });
      doc.text(en, W - CX, y - 3, 9, LATIN_FAMILY, 'rgba(196,181,255,0.5)', 'end');
      doc.line(CX + 14, y + 9, W - CX, y + 9, 'rgba(212,169,73,0.26)', { sw: 0.6 });
    }

    // 专属：所问之事（独立节区）
    if (data.question && data.question.trim()) {
      secTitle('所 问 之 事', 'QUESTION');
      y += 12;
      wCard(doc, CX, y, CW, 36, 'rgba(18,14,50,0.55)', 'rgba(212,169,73,0.35)');
      doc.text(truncateText(data.question.trim(), 48), CX + 18, y + 24, 13, ZH_FAMILY, W_LIGHT);
      y += 36 + 12;
    }

    // 抽牌结果：N 张牌自适应网格（≤3 横排、4-6 双行、7+ 紧密网格）
    secTitle('抽 牌 结 果', 'DRAWS');
    y += 12;
    const draws = spread.draws || [];
    const cardCount = draws.length;
    const availAvail = H - 160 - y;
    const availW = CW - 28;
    const grid = tarotGrid(cardCount, availW, availAvail);
    // 牌下方描述区（位置名+正/逆+牌名）行高随牌数收紧
    const labelH = cardCount >= 10 ? 30 : cardCount >= 7 ? 36 : 42;
    const gapX = grid.cols > 1 ? 14 : 0;
    const gapY = grid.rows > 1 ? 12 : 0;
    const dH = grid.rows * (grid.cardH + labelH) + (grid.rows - 1) * gapY + 16;
    wCard(doc, CX, y, CW, dH, 'rgba(18,14,50,0.5)', 'rgba(212,169,73,0.35)');
    for (let i = 0; i < draws.length; i++) {
      const c = draws[i];
      const col = i % grid.cols;
      const row = Math.floor(i / grid.cols);
      const dx = CX + 14 + col * (grid.cardW + gapX);
      const dy = y + 8 + row * (grid.cardH + labelH + gapY);
      // 牌：优先用真实卡面（与界面 renderTarotCardFace 完全一致；含花色、元素标签、关键词）；
      // 同步测试场景无 dataURL 时回退到本地 SVG 绘制，保证测试不依赖 DOM。
      const key = `${c.card.index}|${c.reversed ? 1 : 0}`;
      const cardImage = data.kind === 'tarot' ? data.cardImages?.[key] : undefined;
      if (cardImage) {
        // 将真实卡面 PNG 直接按目标尺寸嵌入；保持卡片比例 148:238
        const aspect = 148 / 238;
        let w = grid.cardW, h = grid.cardW / aspect;
        if (h > grid.cardH) { h = grid.cardH; w = h * aspect; }
        const ox = dx + (grid.cardW - w) / 2;
        const oy = dy + (grid.cardH - h) / 2;
        doc.imageInline(cardImage, ox, oy, w, h);
      } else {
        // 完整本地 SVG 卡面（含正/逆位渐变、徽章、英文名、关键词）
        const accent = c.reversed ? '#C4B5FF' : W_GOLD;
        const numTxt = c.card.suit ? c.card.symbol : String(c.card.index);
        drawTarotCard(
          doc,
          dx, dy, grid.cardW, grid.cardH,
          c.card.name,
          c.card.en,
          c.card.symbol,
          numTxt,
          c.reversed ? c.card.reversed : c.card.upright,
          c.reversed ? 'down' : 'up',
          accent,
        );
      }
      // 标签：位置名 + 卡名（正/逆）；密集时合并为一行
      const o = c.reversed ? '逆位' : '正位';
      const labelSize = cardCount >= 10 ? 9 : 10;
      if (cardCount >= 10) {
        doc.text(`${c.position} · ${c.card.name}(${o})`, dx, dy + grid.cardH + 14, labelSize, ZH_FAMILY, W_LIGHT, 'start', { weight: 700 });
      } else {
        doc.text(c.position, dx, dy + grid.cardH + 14, labelSize, ZH_FAMILY, c.reversed ? 'rgba(196,181,255,0.85)' : W_GOLD, 'start', { weight: 700 });
        doc.text(`${c.card.name}（${o}）`, dx, dy + grid.cardH + 28, labelSize + 1, ZH_FAMILY, W_LIGHT, 'start', { weight: 700 });
      }
    }
    y += dH + 12;
    y = drawAiBlockFit(doc, y, data.ai, 'AI 解 语');
    y += 4;

    drawWDivider(doc, y);
    y += 14;
    drawWFooter(doc, '塔罗启示');
  }

  return doc.toString();
}

/* ==================== 导出：SVG 预览 / SVG→PNG ==================== */

/**
 * 将 SVG 海报渲染到离屏画布（PNG 导出前的唯一一步），
 * 返回与 SVG 布局完全一致的画布。
 */
export async function svgToCanvas(svg: string, scale = SCALE): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(W * scale);
  canvas.height = Math.round(H * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('无法创建画布');

  const img = new Image();
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
  try {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('SVG 渲染失败'));
      img.src = url;
    });
    ctx.scale(scale, scale);
    ctx.drawImage(img, 0, 0, W, H);
  } finally {
    URL.revokeObjectURL(url);
  }
  return canvas;
}

/** 导出 PNG（最终交付格式） */
export function downloadCanvas(canvas: HTMLCanvasElement, filename: string): void {
  const a = document.createElement('a');
  a.download = filename;
  a.href = canvas.toDataURL('image/png');
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function chinesePosterFilename(): string {
  return `玄界推演录_${nowStamp()}.png`;
}

export function westernPosterFilename(kind: 'chart' | 'synastry' | 'tarot'): string {
  const zh = kind === 'chart' ? '本命星盘' : kind === 'synastry' ? '合盘星图' : '塔罗启示';
  return `星域${zh}_${nowStamp()}.png`;
}

export function chinesePosterSvgFilename(): string {
  return `玄界推演录_${nowStamp()}.svg`;
}

export function westernPosterSvgFilename(kind: 'chart' | 'synastry' | 'tarot'): string {
  const zh = kind === 'chart' ? '本命星盘' : kind === 'synastry' ? '合盘星图' : '塔罗启示';
  return `星域${zh}_${nowStamp()}.svg`;
}

/** 导出 SVG（调试/校验排版用） */
export function downloadSVG(svg: string, filename: string): void {
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
  const a = document.createElement('a');
  a.download = filename;
  a.href = url;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
