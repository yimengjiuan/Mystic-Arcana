/**
 * 西式星语 UI 渲染
 * ------------------------------------------------------------------
 * 将星盘计算结果渲染为 HTML（包含真实圆形 SVG 盘面）。
 * 风格偏西式星云：深蓝紫底、星光、银青金点缀。
 */

import { SIGNS, HOUSES, ELEMENT_ZH, MODALITY_ZH, SUIT_META, PLANET_ZH, SIGN_DETAILS } from '../data/western.js';
import type { NatalChart, AspectResult, HousePosition, PlanetPosition, TarotSpread, TarotCard, TarotDeckCard } from '../western.js';

const SIGN_COLOR: Record<string, string> = {
  aries: '#FF6B6B', taurus: '#9DC88D', gemini: '#F4D35E', cancer: '#A8DADC',
  leo: '#FFB627', virgo: '#7C9885', libra: '#E8B4BC', scorpio: '#9B2226',
  sagittarius: '#EE9B00', capricorn: '#94A187', aquarius: '#43AA8B', pisces: '#B8C0FF',
};

// ============================================================
// SVG 圆形星盘
// ============================================================

/**
 * 渲染真实圆形星盘（SVG）。
 * 坐标系：上方为 10 宫头位置，ASC 在左侧（9 点钟方向），符合西方占星传统。
 */
export function renderChartSVG(chart: NatalChart, size = 480, scale = 1): string {
  const cx = size / 2;
  const cy = size / 2;
  const R = size / 2 - 8;
  // 内部各环半径与字号按 scale 缩放，避免小尺寸时元素过密
  const rInner = R - 90 * scale; // 行星环内圈
  const rZodiac = R - 50 * scale; // 星座带
  const rSign = R - 25 * scale;   // 星座符号
  const FS_SIGN = 18 * scale;     // 星座符号字号
  const FS_HOUSE = 13 * scale;    // 宫位数字字号
  const FS_PLANET = 14 * scale;   // 行星符号字号
  const FS_ASCMC = 11 * scale;    // ASC/MC 标签字号
  const PLANET_R = 11 * scale;    // 行星标记半径
  const PLANET_GAP = 18 * scale;  // 行星最小间距

  // 角度转换：SVG 0° 在 3 点钟，逆时针为正。
  // 占星学：以 ASC 为左端（9 点钟），逆时针为黄道正向。
  // 统一约定：把黄道 0°（白羊 0°）放在 9 点钟方向，整个盘逆时针展开。
  // 即：displayAngle = 180° - longitude
  function angle(lon: number): number {
    return (180 - lon) * Math.PI / 180;
  }
  function pt(r: number, lon: number): [number, number] {
    const a = angle(lon);
    return [cx + r * Math.cos(a), cy - r * Math.sin(a)];
  }

  // 1. 12 宫位扇形（淡色背景）
  const houses = chart.houses;
  const houseSectors = houses.map((h, i) => {
    const next = houses[(i + 1) % 12];
    const a1 = h.cusp;
    const a2 = next.cusp;
    const p1 = pt(R, a1);
    const p2 = pt(R, a2);
    const large = (a2 - a1 + 360) % 360 > 180 ? 1 : 0;
    return `<path d="M ${cx} ${cy} L ${p1[0].toFixed(1)} ${p1[1].toFixed(1)} A ${R} ${R} 0 ${large} 0 ${p2[0].toFixed(1)} ${p2[1].toFixed(1)} Z" fill="url(#houseGrad${i % 2})" opacity="0.18"/>`;
  }).join('');

  // 2. 星座带（12 等分）
  const zodiac = SIGNS.map((s, i) => {
    const startLon = i * 30;
    const endLon = (i + 1) * 30;
    const p1 = pt(R, startLon);
    const p2 = pt(R, endLon);
    const large = 0;
    const fill = SIGN_COLOR[s.id] ?? '#888';
    // 星座符号位置（带中点）
    const midLon = i * 30 + 15;
    const sym = pt(rSign, midLon);
    // 星座度数刻度
    const tickLines: string[] = [];
    for (let d = 0; d < 30; d += 5) {
      const lon = i * 30 + d;
      const inner = pt(R, lon);
      const outer = pt(R - 6, lon);
      tickLines.push(`<line x1="${inner[0].toFixed(1)}" y1="${inner[1].toFixed(1)}" x2="${outer[0].toFixed(1)}" y2="${outer[1].toFixed(1)}" stroke="#3a4860" stroke-width="0.5"/>`);
    }
    return `<path d="M ${p1[0].toFixed(1)} ${p1[1].toFixed(1)} A ${R} ${R} 0 ${large} 0 ${p2[0].toFixed(1)} ${p2[1].toFixed(1)} L ${pt(rZodiac, endLon)[0].toFixed(1)} ${pt(rZodiac, endLon)[1].toFixed(1)} A ${rZodiac} ${rZodiac} 0 ${large} 1 ${pt(rZodiac, startLon)[0].toFixed(1)} ${pt(rZodiac, startLon)[1].toFixed(1)} Z" fill="${fill}" fill-opacity="0.10" stroke="${fill}" stroke-width="0.4"/>
      <text x="${sym[0].toFixed(1)}" y="${sym[1].toFixed(1)}" text-anchor="middle" dominant-baseline="central" fill="${fill}" font-size="${FS_SIGN.toFixed(1)}" style="filter: drop-shadow(0 0 4px ${fill})">${s.symbol}</text>
      ${tickLines.join('')}`;
  }).join('');

  // 3. 宫位分割线 + 宫位数字
  const houseLines = houses.map((h) => {
    const inner = pt(rInner, h.cusp);
    const outer = pt(R, h.cusp);
    return `<line x1="${inner[0].toFixed(1)}" y1="${inner[1].toFixed(1)}" x2="${outer[0].toFixed(1)}" y2="${outer[1].toFixed(1)}" stroke="#5d7290" stroke-width="0.8" stroke-dasharray="2,2"/>`;
  }).join('');
  // ASC/MC 加粗
  const ascLine = (() => {
    const inner = pt(rInner, chart.ascendant);
    const outer = pt(R, chart.ascendant);
    return `<line x1="${inner[0].toFixed(1)}" y1="${inner[1].toFixed(1)}" x2="${outer[0].toFixed(1)}" y2="${outer[1].toFixed(1)}" stroke="#FFD27A" stroke-width="2"/>`;
  })();
  const mcLine = (() => {
    const inner = pt(rInner, chart.midheaven);
    const outer = pt(R, chart.midheaven);
    return `<line x1="${inner[0].toFixed(1)}" y1="${inner[1].toFixed(1)}" x2="${outer[0].toFixed(1)}" y2="${outer[1].toFixed(1)}" stroke="#A8DADC" stroke-width="2"/>`;
  })();

  // 宫位数字
  const houseNums = houses.map((h) => {
    // 宫位数字放在宫位中点（跨 0°/360° 边界时按环绕角度计算，避免算到相反方向）
    const next = houses[(h.num) % 12];
    const diff = (next.cusp - h.cusp + 360) % 360;
    const midLon = (h.cusp + diff / 2) % 360;
    const p = pt(rInner - 18 * scale, midLon);
    return `<text x="${p[0].toFixed(1)}" y="${p[1].toFixed(1)}" text-anchor="middle" dominant-baseline="central" fill="#D6E4F0" font-size="${FS_HOUSE.toFixed(1)}" font-weight="bold">${h.num}</text>`;
  }).join('');

  // 4. 行星（沿 rInner 环排列，处理重叠）
  const planetPositions = layoutPlanets(chart.planets, rInner, cx, cy, angle, PLANET_GAP);
  // id -> 实际布局坐标（行星标记可能被 layoutPlanets 偏移，相位线必须对准标记而非原始黄经）
  const posById = new Map(planetPositions.map(p => [p.planet.id, p]));
  const planetMarks = planetPositions.map(({ planet, x, y, lon }) => {
    const line = (() => {
      // 用偏移后的最终黄经，保证连线从标记径向延伸到星座带
      const p2 = pt(rZodiac + 5, lon);
      return `<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${p2[0].toFixed(1)}" y2="${p2[1].toFixed(1)}" stroke="#D6E4F0" stroke-width="0.6" opacity="0.6"/>`;
    })();
    return `<g class="planet-mark">${line}<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${PLANET_R.toFixed(1)}" fill="#0F1A2E" stroke="#D6E4F0" stroke-width="1"/><text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="middle" dominant-baseline="central" fill="#F5C563" font-size="${FS_PLANET.toFixed(1)}" style="filter: drop-shadow(0 0 4px #F5C563)">${planet.symbol}</text>${planet.retrograde ? `<text x="${(x + 9 * scale).toFixed(1)}" y="${(y - 9 * scale).toFixed(1)}" fill="#FF6B6B" font-size="${(9 * scale).toFixed(1)}">℞</text>` : ''}</g>`;
  }).join('');

  // 5. 相位线（连接行星标记实际位置，端点收缩到标记边缘）
  const aspectLines = chart.aspects.map((a) => {
    const p1 = posById.get(a.p1);
    const p2 = posById.get(a.p2);
    if (!p1 || !p2) return '';
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.hypot(dx, dy);
    if (len < 1e-6) return '';
    const pad = PLANET_R + 2 * scale; // 行星标记半径 + 余量，线从标记边缘引出
    const ux = dx / len, uy = dy / len;
    const color = a.nature === 'harmonious' ? '#43AA8B' : a.nature === 'tense' ? '#E63946' : '#94A187';
    return `<line x1="${(p1.x + ux * pad).toFixed(1)}" y1="${(p1.y + uy * pad).toFixed(1)}" x2="${(p2.x - ux * pad).toFixed(1)}" y2="${(p2.y - uy * pad).toFixed(1)}" stroke="${color}" stroke-width="${Math.max(0.5, 2 - a.orb / 4)}" opacity="0.55"/>`;
  }).join('');

  return `<svg class="chart-svg" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="西式星盘">
    <defs>
      <radialGradient id="bgGrad" cx="50%" cy="50%">
        <stop offset="0%" stop-color="#1A2244"/>
        <stop offset="60%" stop-color="#0F1A2E"/>
        <stop offset="100%" stop-color="#070B1A"/>
      </radialGradient>
      <linearGradient id="houseGrad0" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#3A4A6B"/><stop offset="100%" stop-color="#1A2244"/></linearGradient>
      <linearGradient id="houseGrad1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#2A3A5B"/><stop offset="100%" stop-color="#0F1A2E"/></linearGradient>
    </defs>
    <circle cx="${cx}" cy="${cy}" r="${R}" fill="url(#bgGrad)" stroke="#5d7290" stroke-width="1.5"/>
    <circle cx="${cx}" cy="${cy}" r="${rInner}" fill="none" stroke="#3a4860" stroke-width="0.6"/>
    <circle cx="${cx}" cy="${cy}" r="${rZodiac}" fill="none" stroke="#3a4860" stroke-width="0.6"/>
    ${houseSectors}
    ${zodiac}
    ${houseLines}
    ${ascLine}
    ${mcLine}
    ${houseNums}
    ${aspectLines}
    ${planetMarks}
    <text x="${cx}" y="${cy - 4}" text-anchor="middle" fill="#9DC3E6" font-size="${FS_ASCMC.toFixed(1)}" letter-spacing="2">ASC</text>
    <text x="${cx}" y="${(cy - rInner + 12 * scale).toFixed(1)}" text-anchor="middle" fill="#A8DADC" font-size="${FS_ASCMC.toFixed(1)}" letter-spacing="2">MC</text>
  </svg>`;
}

/** 行星布局：避免重叠，水平偏移直至无冲突 */
function layoutPlanets(planets: readonly PlanetPosition[], r: number, cx: number, cy: number, angle: (lon: number) => number, minGap = 18): { planet: PlanetPosition; lon: number; x: number; y: number }[] {
  // 按黄经排序
  const sorted = [...planets].sort((a, b) => a.longitude - b.longitude);
  const placed: { lon: number; x: number; y: number; planet: PlanetPosition }[] = [];
  for (const p of sorted) {
    let off = 0;
    let tries = 0;
    let x = 0, y = 0;
    while (tries < 40) {
      // 在弧度上偏移
      const a = angle(p.longitude) + off;
      x = cx + r * Math.cos(a);
      y = cy - r * Math.sin(a);
      const conflict = placed.some(q => Math.hypot(q.x - x, q.y - y) < minGap);
      if (!conflict) break;
      off += 0.05; // 约 3°
      tries++;
    }
    // 偏移后对应的最终黄经（angle(lon)=180°-lon，加 off 弧度等价于黄经减 off*180/PI）
    const finalLon = (p.longitude - off * 180 / Math.PI + 360) % 360;
    placed.push({ lon: finalLon, x, y, planet: p });
  }
  return placed;
}

// ============================================================
// 行星 + 宫位 + 相位 列表
// ============================================================

export function renderPlanetList(chart: NatalChart): string {
  const signName = (lon: number): string => {
    const s = SIGNS[Math.floor(lon / 30) % 12];
    return `${s.symbol} ${s.name}`;
  };
  const rows = chart.planets.map(p => {
    const deg = p.degreeInSign.toFixed(1);
    return `<tr>
      <td><span class="planet-symbol">${p.symbol}</span> ${p.name}${p.retrograde ? ' <span class="retro">℞</span>' : ''}</td>
      <td>${signName(p.longitude)}</td>
      <td>${deg}°</td>
      <td>${findHouse(p.longitude, chart.houses)} 宫</td>
    </tr>`;
  }).join('');
  return `<table class="w-table">
    <thead><tr><th>行星</th><th>所在星座</th><th>度数</th><th>宫位</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

function findHouse(lon: number, houses: readonly HousePosition[]): number {
  for (let i = 0; i < houses.length; i++) {
    const h = houses[i];
    const next = houses[(i + 1) % 12];
    let cusp = h.cusp;
    let end = next.cusp;
    if (end < cusp) end += 360; // 跨 0°
    const test = lon < cusp ? lon + 360 : lon;
    if (test >= cusp && test < end) return h.num;
  }
  return 1;
}

export function renderAspectList(aspects: readonly AspectResult[], label1 = '盘A', label2 = ''): string {
  if (aspects.length === 0) return '<p class="w-empty">暂无显著相位</p>';
  const planetName: Record<string, string> = { sun: '太阳', moon: '月亮', mercury: '水星', venus: '金星', mars: '火星', jupiter: '木星', saturn: '土星', uranus: '天王星', neptune: '海王星', pluto: '冥王星' };
  const rows = aspects.map(a => {
    const cls = a.nature === 'harmonious' ? 'asp-harm' : a.nature === 'tense' ? 'asp-ten' : 'asp-neu';
    return `<tr class="${cls}">
      <td>${planetName[a.p1]} ${a.symbol} ${planetName[a.p2]}</td>
      <td>${a.typeZh}</td>
      <td>容差 ${a.orb}°</td>
    </tr>`;
  }).join('');
  return `<table class="w-table">
    <thead><tr><th>${label1}${label2 ? ' ↔ ' + label2 : ''} 行星</th><th>相位</th><th>容差</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

export function renderHouseList(chart: NatalChart): string {
  const signName = (lon: number): string => {
    const s = SIGNS[Math.floor(lon / 30) % 12];
    return `${s.symbol} ${s.name}`;
  };
  return `<table class="w-table">
    <thead><tr><th>宫位</th><th>名称</th><th>宫头星座</th><th>宫头度数</th></tr></thead>
    <tbody>${chart.houses.map(h => {
      const meta = HOUSES.find(x => x.num === h.num)!;
      return `<tr><td>${h.num}</td><td>${meta.name}</td><td>${signName(h.cusp)}</td><td>${h.degreeInSign.toFixed(1)}°</td></tr>`;
    }).join('')}</tbody>
  </table>`;
}

export function renderChartHeader(chart: NatalChart): string {
  const b = chart.birth;
  return `<div class="w-header">
    <div class="w-signs">
      <div class="w-sign-card sun"><div class="w-sign-label">太阳</div><div class="w-sign-name">${chart.sunSign.symbol} ${chart.sunSign.name}</div><div class="w-sign-meta">${ELEMENT_ZH[chart.sunSign.element]} · ${MODALITY_ZH[chart.sunSign.modality]}</div></div>
      <div class="w-sign-card asc"><div class="w-sign-label">上升</div><div class="w-sign-name">${chart.ascSign.symbol} ${chart.ascSign.name}</div><div class="w-sign-meta">${chart.ascendant.toFixed(1)}°</div></div>
      <div class="w-sign-card mc"><div class="w-sign-label">天顶</div><div class="w-sign-name">${chart.mcSign.symbol} ${chart.mcSign.name}</div><div class="w-sign-meta">${chart.midheaven.toFixed(1)}°</div></div>
    </div>
    <div class="w-birth">${b.year}年${b.month}月${b.day}日 ${String(b.hour).padStart(2, '0')}:${String(b.minute).padStart(2, '0')} · ${b.timezone >= 0 ? '+' : ''}${b.timezone}区 · 经度 ${b.longitude}° 纬度 ${b.latitude}°</div>
  </div>`;
}

// ============================================================
// 星座速查面板
// ============================================================

export function renderSunsignPanel(): string {
  return `<div class="w-zodiac-grid">${SIGNS.map(s => {
    const from = `${s.from[0]}/${s.from[1]}`;
    const to = `${s.to[0]}/${s.to[1]}`;
    const color = SIGN_COLOR[s.id] ?? '#888';
    return `<div class="w-zodiac-card" data-sign="${s.id}" role="button" tabindex="0" title="点击查看 ${s.name} 详解" style="--zc:${color};cursor:pointer">
      <div class="w-zodiac-sym">${s.symbol}</div>
      <div class="w-zodiac-name">${s.name}</div>
      <div class="w-zodiac-en">${s.en}</div>
      <div class="w-zodiac-date">${from} – ${to}</div>
      <div class="w-zodiac-meta">${ELEMENT_ZH[s.element]} · ${MODALITY_ZH[s.modality]} · ${s.polarity === 'yang' ? '阳' : '阴'}</div>
      <div class="w-zodiac-hint">详 解 ➜</div>
    </div>`;
  }).join('')}</div>`;
}

/**
 * 渲染星座详解弹窗（毛玻璃半透明背景 + 从卡片位置丝滑展开）。
 * 结构：遮罩层 w-sign-modal（点击空白关闭）内嵌弹窗卡片 w-sign-modal-card。
 */
export function renderSignDetailModal(signId: string): string {
  const sign = SIGNS.find(s => s.id === signId);
  const d = SIGN_DETAILS[signId];
  if (!sign || !d) return '';
  const color = SIGN_COLOR[sign.id] ?? '#888';
  const from = `${sign.from[0]}/${sign.from[1]}`;
  const to = `${sign.to[0]}/${sign.to[1]}`;
  const ruler = PLANET_ZH[sign.ruler] ?? sign.ruler;

  return `<div class="w-sign-modal" data-sign-modal>
    <div class="w-sign-modal-card" style="--zc:${color}" data-sign-modal-card>
      <button class="w-sign-modal-close" data-sign-modal-close type="button" aria-label="关闭">✕</button>
      <header class="w-sign-modal-head">
        <div class="w-sign-modal-sym">${sign.symbol}</div>
        <div>
          <div class="w-sign-modal-name">${sign.name}</div>
          <div class="w-sign-modal-en">${sign.en}</div>
        </div>
        <div class="w-sign-modal-date">${from} – ${to}</div>
      </header>
      <div class="w-sign-modal-chips">
        <span class="w-chip">${ELEMENT_ZH[sign.element]}象</span>
        <span class="w-chip">${MODALITY_ZH[sign.modality]}宫</span>
        <span class="w-chip">${sign.polarity === 'yang' ? '阳' : '阴'}性</span>
        <span class="w-chip">守护星 ${ruler}</span>
        <span class="w-chip">关键词 ${d.keyword}</span>
      </div>
      <div class="w-sign-modal-sec">
        <h4>性格概述</h4>
        <p>${d.personality}</p>
      </div>
      <div class="w-sign-modal-cols">
        <div class="w-sign-modal-sec">
          <h4 class="pos">优点</h4>
          <p>${d.strengths}</p>
        </div>
        <div class="w-sign-modal-sec">
          <h4 class="neg">缺点</h4>
          <p>${d.weaknesses}</p>
        </div>
      </div>
      <div class="w-sign-modal-cols">
        <div class="w-sign-modal-sec">
          <h4>爱情</h4>
          <p>${d.love}</p>
        </div>
        <div class="w-sign-modal-sec">
          <h4>事业</h4>
          <p>${d.career}</p>
        </div>
      </div>
      <div class="w-sign-modal-sec">
        <h4>健康</h4>
        <p>${d.health}</p>
      </div>
      <div class="w-sign-modal-lucky">
        <span><b>幸运数字</b>${d.luckyNumber}</span>
        <span><b>幸运色</b>${d.luckyColor}</span>
        <span><b>幸运石</b>${d.luckyStone}</span>
        <span><b>幸运日</b>${d.luckyDay}</span>
        <span><b>最佳配对</b>${d.bestMatch}</span>
      </div>
      <footer class="w-sign-modal-motto">「${d.motto}」</footer>
    </div>
  </div>`;
}

// ============================================================
// 塔罗牌面渲染（CSS 绘制卡面 + 扇形展开 + 牌阵摆位）
// ============================================================

/** 大阿卡纳专属主色调（22 张各不相同，营造星云感）；小阿卡纳改用花色主题色 */
const TAROT_ACCENT: readonly string[] = [
  '#e8d5a3', '#c9b8ff', '#a7d8f0', '#f0a7c3', '#c96a5a', '#8f7fb0',
  '#ff8fb3', '#f5c26b', '#e07b39', '#9aa7b0', '#6b9fd8', '#7fb069',
  '#5c8a8a', '#3c3f4a', '#86c5c0', '#8e44ad', '#d9534f', '#f7e08a',
  '#b8c0ff', '#f9d423', '#a3c9a8', '#d4af7a',
];

/** 单张牌面（翻开后展示；逆位时整体旋转并转为玫紫调；小阿卡纳按花色着色） */
export function renderTarotCardFace(card: TarotCard, reversed: boolean): string {
  const suit = card.suit ? SUIT_META[card.suit] : undefined;
  const accent = suit ? suit.color : (TAROT_ACCENT[card.index % TAROT_ACCENT.length] ?? '#c9b8ff');
  const key = reversed ? card.reversed : card.upright;
  const num = suit ? card.symbol : String(card.index);
  const symbol = suit
    ? `${suit.emoji}<i class="w-tarot-face-el">${ELEMENT_ZH[suit.element]}元素</i>`
    : card.symbol;
  return `<div class="w-tarot-face${reversed ? ' is-reversed' : ''}" style="--accent:${accent}">
    <div class="w-tarot-face-top">
      <span class="w-tarot-face-num">${num}</span>
      <span class="w-tarot-face-ori">${reversed ? '逆位' : '正位'}</span>
    </div>
    <div class="w-tarot-face-symbol">${symbol}</div>
    <div class="w-tarot-face-name">${card.name}</div>
    <div class="w-tarot-face-en">${card.en}</div>
    <div class="w-tarot-face-key">${key}</div>
  </div>`;
}

/** 牌背（扇形展开中覆面朝上） */
export function renderTarotBack(): string {
  return `<div class="w-tarot-back">
    <div class="w-tarot-back-orb">✦</div>
    <div class="w-tarot-back-logo">玄机阁</div>
  </div>`;
}

const FAN_ROW_SIZE = 26;

/** 扇形展开抽牌台：整副 78 张覆面分多行扇形排布，由用户逐一抽取 */
export function renderTarotFan(deck: readonly TarotDeckCard[]): string {
  const rows: string[] = [];
  for (let r = 0, start = 0; start < deck.length; r += 1, start += FAN_ROW_SIZE) {
    const chunk = deck.slice(start, start + FAN_ROW_SIZE);
    const n = chunk.length;
    const cards = chunk.map((_, i) => `
      <button class="w-fan-card" data-fan-index="${start + i}" type="button" title="抽第 ${start + i + 1} 张" style="--fan-n:${n};--fan-i:${i}">
        ${renderTarotBack()}
      </button>`).join('');
    rows.push(`<div class="w-tarot-fan-row">${cards}</div>`);
  }
  return `<div class="w-tarot-fan" data-fan-count="${deck.length}">${rows.join('')}</div>`;
}

/** 牌阵结果渲染（按抽取先后顺序摆位） */
export function renderTarot(spread: TarotSpread): string {
  return `<div class="w-tarot-spread">
    <div class="w-tarot-title">${spread.spreadName}</div>
    <div class="w-tarot-grid spread-${spread.spreadId}">${spread.draws.map((d) => `
      <div class="w-tarot-slot">
        <div class="w-tarot-pos">${d.position}</div>
        ${renderTarotCardFace(d.card, d.reversed)}
      </div>`).join('')}
    </div>
  </div>`;
}

/** 牌阵位置释义（供 AI 解读与界面提示） */
const TAROT_POSITION_MEANING: Record<string, string> = {
  '核心指引': '整体核心指引',
  '过去': '过去：已发生的背景与来龙去脉',
  '现在': '现在：当下正在经历的境况',
  '未来': '未来：事态可能的发展走向',
  '心态': '心态：你当下的内在状态与心念',
  '现状': '现状：当下的整体局势与处境',
  '举措': '举措：应当采取的应对行动',
  '环境': '环境：外界环境与周遭的影响',
  '建议': '建议：值得参考的指引方向',
  '阻碍': '阻碍：可能遇到的障碍与挑战',
  '结果': '结果：事件最终可能的结果',
  '今日指引': '今日的主题、焦点或需要留意的能量',
  '挑战': '挑战：横在面前的主要障碍或对立力量',
  '根基': '根基：问题的潜意识基础与深层根源',
  '近期过去': '近期过去：正在消退但仍有影响的事件',
  '目标': '目标：你有意识追求的方向与理想状态',
  '近期未来': '近期未来：即将到来的发展走向',
  '自我态度': '自我态度：你如何看待自己在此局中的角色',
  '外在环境': '外在环境：他人与外部因素对你的影响',
  '希望与恐惧': '希望与恐惧：内心最深处的渴望与担忧',
  '最终结果': '最终结果：当前能量流动自然汇成的结局',
  '应对策略': '应对策略：问题应如何应对的行动方向',
  '周遭状况': '周遭状况：周围人、环境与整体氛围',
  '你的感受': '你的感受：你在这段关系中的真实情感',
  '对方的感受': '对方的感受：对方在这段关系中的真实情感',
  '你们的关系': '你们的关系：彼此之间互动的连接纽带',
  '你的期望': '你的期望：你对这段关系的期待与诉求',
  '对方的期望': '对方的期望：对方对这段关系的期待与诉求',
  '关系走向': '关系走向：这段关系可能的发展方向',
  '是/否指引': '是或否的直接指引（正位偏是、逆位偏否）',
  '关键影响因素': '影响答案的关键因素或变数',
  '补充建议': '补充背景信息与进一步建议',
  '海底轮': '海底轮：安全感、根基与生存能量',
  '脐轮': '脐轮：情绪、欲望与创造力',
  '太阳神经丛': '太阳神经丛：意志力、自信与自我力量',
  '心轮': '心轮：爱、关系与同理心',
  '喉轮': '喉轮：表达、沟通与真实之声',
  '眉心轮': '眉心轮：直觉、洞察与内在视野',
  '顶轮': '顶轮：灵性连接、觉知与更高智慧',
  '职业现状': '职业现状：当前职业处境与整体状态',
  '优势与资源': '优势与资源：可依靠的助力与资本',
  '挑战与阻碍': '挑战与阻碍：职业路上需要克服的难题',
  '潜在机会': '潜在机会：尚未显现的机遇与可能',
  '内在动力': '内在动力：你对事业的热情与内在驱动',
  '环境与外因': '环境与外因：行业、团队等外界因素',
  '最佳行动方向': '最佳行动方向：当下最值得采取的行动',
  '情感纽带': '情感纽带：连接双方的深层情感纽带',
  '潜意识动机': '潜意识动机：隐藏于意识之下的真实动因',
  '近期发展': '近期发展：短期内关系可能的变化',
  '阻碍与课题': '阻碍与课题：关系中需要面对的课题',
  '未来走向': '未来走向：关系未来的整体走势',
  '选项A的前景': '选项A的前景：选择 A 可能带来的局面',
  '选项A的代价': '选项A的代价：选择 A 需要付出的代价',
  '选项B的前景': '选项B的前景：选择 B 可能带来的局面',
  '选项B的代价': '选项B的代价：选择 B 需要付出的代价',
  '感情现状': '感情现状：当前感情关系的核心状态',
  '你的付出': '你的付出：你在这段感情中投入的面向',
  '对方的付出': '对方的付出：对方在这段感情中投入的面向',
  '关系发展方向': '关系发展方向：感情走向何方',
  '选项A': '选项A：选择 A 所代表的路径与影响',
  '选项A的结果': '选项A的结果：走 A 路的可能结局',
  '选项B': '选项B：选择 B 所代表的路径与影响',
  '选项B的结果': '选项B的结果：走 B 路的可能结局',
  '春季': '春季：第一季度的主题与能量',
  '夏季': '夏季：第二季度的主题与能量',
  '秋季': '秋季：第三季度的主题与能量',
  '冬季': '冬季：第四季度的主题与能量',
  '太阳': '太阳：生命力、意志与核心自我',
  '月亮': '月亮：情绪、直觉与潜意识',
  '水星': '水星：思维、沟通与学习',
  '金星': '金星：爱、审美与人际',
  '火星': '火星：行动、勇气与冲劲',
  '木星': '木星：机遇、成长与扩张',
  '土星': '土星：责任、课题与磨砺',
};

/** 塔罗 AI 解语 prompt */
export function buildTarotAIPrompt(spread: TarotSpread, question?: string): string {
  const lines: string[] = [];
  lines.push(`【塔罗占卜解读请求】`);
  lines.push(`牌阵：${spread.spreadName}（共 ${spread.draws.length} 张）`);
  lines.push(`\n【抽牌结果】（按抽取先后 / 摆牌顺序）`);
  spread.draws.forEach((d, i) => {
    const meaning = TAROT_POSITION_MEANING[d.position] ?? d.position;
    const suitInfo = d.card.suit ? `（${SUIT_META[d.card.suit].zh}·${ELEMENT_ZH[SUIT_META[d.card.suit].element]}元素）` : '';
    lines.push(`${i + 1}. ${d.position}（${meaning}）：${d.card.name}${suitInfo}（${d.reversed ? '逆位' : '正位'}）— 关键词：${d.reversed ? d.card.reversed : d.card.upright}`);
  });
  if (question) lines.push(`\n【用户问题】${question}`);
  lines.push(`\n请按以下结构给出解读（使用 #### 二级标题、** 加粗 **、> 引用）：`);
  lines.push(`#### 1. 牌阵总览（整体能量与主调）`);
  lines.push(`#### 2. 逐位解读（每张牌在该位置的含义，务必区分正位 / 逆位）`);
  lines.push(`#### 3. 牌与牌之间的呼应（连动关系）`);
  if (question) lines.push(`#### 4. 针对问题的具体建议`);
  lines.push(`要求：基于韦特塔罗传统含义；语言典雅易懂；避免绝对化断言；给出可把握的行动方向。`);
  return lines.join('\n');
}

// ============================================================
// AI 解语 prompt 构造
// ============================================================

export function buildWesternAIPrompt(chart: NatalChart, synastry?: { b: NatalChart; aspects: AspectResult[] }, question?: string): string {
  const b = chart.birth;
  const planetName: Record<string, string> = { sun: '太阳', moon: '月亮', mercury: '水星', venus: '金星', mars: '火星', jupiter: '木星', saturn: '土星', uranus: '天王星', neptune: '海王星', pluto: '冥王星' };
  const lines: string[] = [];
  lines.push(`【西方占星本命盘解读请求】`);
  lines.push(`出生信息：${b.year}-${b.month}-${b.day} ${String(b.hour).padStart(2,'0')}:${String(b.minute).padStart(2,'0')}（${b.timezone >= 0 ? '+' : ''}${b.timezone}区），经度 ${b.longitude}° 纬度 ${b.latitude}°`);
  lines.push(`太阳星座：${chart.sunSign.name}（${ELEMENT_ZH[chart.sunSign.element]}·${MODALITY_ZH[chart.sunSign.modality]}）`);
  lines.push(`上升星座：${chart.ascSign.name}（${chart.ascendant.toFixed(1)}°）`);
  lines.push(`天顶星座：${chart.mcSign.name}（${chart.midheaven.toFixed(1)}°）`);
  lines.push(`\n【行星分布】`);
  for (const p of chart.planets) {
    const sign = SIGNS.find(s => s.id === p.signId)!;
    const house = findHouse(p.longitude, chart.houses);
    lines.push(`- ${planetName[p.id]}：${sign.name} ${p.degreeInSign.toFixed(1)}°（${house}宫）${p.retrograde ? ' [逆行]' : ''}`);
  }
  lines.push(`\n【重要相位】（按容差从小到大取前 8）`);
  const sorted = [...chart.aspects].sort((a, c) => a.orb - c.orb).slice(0, 8);
  for (const a of sorted) {
    const nature = a.nature === 'harmonious' ? '和谐' : a.nature === 'tense' ? '紧张' : '中性';
    lines.push(`- ${planetName[a.p1]} ${a.symbol} ${planetName[a.p2]}（${a.typeZh}，容差 ${a.orb}°，${nature}）`);
  }
  if (synastry) {
    lines.push(`\n【合盘相位】（A ↔ B）`);
    for (const a of synastry.aspects.slice(0, 10)) {
      const nature = a.nature === 'harmonious' ? '和谐' : a.nature === 'tense' ? '紧张' : '中性';
      lines.push(`- A${planetName[a.p1]} ${a.symbol} B${planetName[a.p2]}（${a.typeZh}，容差 ${a.orb}°，${nature}）`);
    }
  }
  if (question) lines.push(`\n【用户问题】${question}`);
  lines.push(`\n请按以下结构给出解读（使用 #### 二级标题、** 加粗 **、> 引用）：`);
  lines.push(`#### 1. 核心人格（太阳 + 上升）`);
  lines.push(`#### 2. 情绪与内在需求（月亮）`);
  lines.push(`#### 3. 关系与审美（金星 + 火星）`);
  lines.push(`#### 4. 事业与成长（MC + 土星 + 木星）`);
  lines.push(`#### 5. 关键相位影响（紧张 / 和谐）`);
  if (synastry) lines.push(`#### 6. 双方契合点与挑战（合盘）`);
  if (question) lines.push(`#### 7. 针对问题的具体建议`);
  lines.push(`要求：符合西方占星基本理论；用词典雅但易懂；避免断语绝对化。`);
  return lines.join('\n');
}

// ============================================================
// 合盘渲染（双圆叠加）
// ============================================================

export function renderSynastrySVG(a: NatalChart, b: NatalChart, size = 480): string {
  return `<div class="w-synastry-grid">
    <div class="w-synastry-half">
      <div class="w-synastry-label">A · 盘A</div>
      <div class="w-chart-wrap">${renderChartSVG(a, size)}</div>
    </div>
    <div class="w-synastry-half">
      <div class="w-synastry-label">B · 盘B</div>
      <div class="w-chart-wrap">${renderChartSVG(b, size)}</div>
    </div>
  </div>`;
}
