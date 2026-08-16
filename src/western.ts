/**
 * 西式星语计算引擎
 * ------------------------------------------------------------------
 * 定位：纯前端、近似精度、零依赖。满足「文化研究与术数学习参考」定位。
 * 算法说明：
 *   - 太阳/月亮：经典简化公式（太阳 ±0.01°，月亮 ±0.1°）
 *   - 水星~海王星：NASA JPL 开普勒根数（1800–2050 有效）+ 开普勒方程
 *     + 日心→地心转换 + 岁差修正（黄经误差约 <1°）
 *   - 冥王星：标准 J2000 根数近似
 *   - ASC/MC：标准恒星时 + 黄赤交角公式
 * 注意：仍属近似精度，不追求天文级精度；不替代专业占星软件 / Swiss Ephemeris。
 *       已在 docs/western-divination.md 文档中说明。
 */

import { SIGNS, sunSignOf, ASPECTS, MAJOR_ARCANA, MINOR_ARCANA, SPREADS, type Sign, type TarotCard, type Spread } from './data/western.js';

export type { TarotCard, Spread } from './data/western.js';

/** 出生信息（公历，UTC 时刻 = 本地时间 − 时区偏移） */
export interface BirthInfo {
  readonly year: number;
  readonly month: number;
  readonly day: number;
  readonly hour: number;
  readonly minute: number;
  readonly second: number;
  /** 出生地经度（°，东经为正） */
  readonly longitude: number;
  /** 出生地纬度（°，北纬为正） */
  readonly latitude: number;
  /** 时区偏移（小时，如东八区 = +8） */
  readonly timezone: number;
}

/** 行星位置（黄经°，0-360） */
export interface PlanetPosition {
  readonly id: string;
  readonly name: string;
  readonly symbol: string;
  /** 黄道经度 0-360° */
  readonly longitude: number;
  /** 所落星座 id */
  readonly signId: string;
  /** 星座内度数 0-30 */
  readonly degreeInSign: number;
  /** 是否逆行（基于简化判定） */
  readonly retrograde: boolean;
}

/** 宫位信息 */
export interface HousePosition {
  readonly num: number;
  /** 宫头黄经 0-360° */
  readonly cusp: number;
  readonly signId: string;
  readonly degreeInSign: number;
}

/** 相位 */
export interface AspectResult {
  readonly p1: string;
  readonly p2: string;
  readonly type: string;
  readonly typeZh: string;
  readonly symbol: string;
  readonly angle: number;
  /** 与精确角的偏差（°） */
  readonly orb: number;
  readonly nature: 'harmonious' | 'tense' | 'neutral';
}

/** 星盘结果 */
export interface NatalChart {
  readonly birth: BirthInfo;
  /** 太阳星座 */
  readonly sunSign: Sign;
  /** 上升点（度 0-360） */
  readonly ascendant: number;
  /** 天顶（度 0-360） */
  readonly midheaven: number;
  /** 上升星座 */
  readonly ascSign: Sign;
  /** 天顶星座 */
  readonly mcSign: Sign;
  /** 行星位置 */
  readonly planets: readonly PlanetPosition[];
  /** 12 宫头 */
  readonly houses: readonly HousePosition[];
  /** 相位 */
  readonly aspects: readonly AspectResult[];
}

// ============================================================
// 行星位置近似算法
// ============================================================

/**
 * 儒略日（J2000.0 起算的相对日）— 用于行星位置近似。
 * 简化版本：以 2000-01-01 12:00 UT = 0 为基准。
 */
function daysSinceJ2000(year: number, month: number, day: number, hour: number, minute: number, second: number, tz: number): number {
  // 转换为 UTC 时刻
  const ut = hour - tz + minute / 60 + second / 3600;
  // 用 Date.UTC 避免本地时区影响（与 lunar.ts 经验一致）
  const utcMs = Date.UTC(year, month - 1, day) + ut * 3600 * 1000;
  const j2000Ms = Date.UTC(2000, 0, 1, 12);
  return (utcMs - j2000Ms) / 86400000;
}

/** 角度归一化到 0-360 */
function norm360(deg: number): number {
  let r = deg % 360;
  if (r < 0) r += 360;
  return r;
}

/** 太阳黄经近似（基于儒略日，精度 ±0.01°） */
function sunLongitude(d: number): number {
  // 太阳平均黄经
  const L = norm360(280.460 + 0.9856474 * d);
  // 太阳平均近点角
  const g = norm360(357.528 + 0.9856003 * d) * Math.PI / 180;
  // 太阳中心差
  const C = (1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * Math.PI / 180;
  return norm360(L * Math.PI / 180 + C) * 180 / Math.PI;
}

/** 月亮黄经近似（Meeus 截断级数，精度约 ±0.1°） */
function moonLongitude(d: number): number {
  // 月亮平黄经
  const Lm = norm360(218.316 + 13.176396 * d) * Math.PI / 180;
  // 月亮平近点角
  const Mm = norm360(134.963 + 13.064993 * d) * Math.PI / 180;
  // 日月平距角
  const D = norm360(297.850 + 12.190749 * d) * Math.PI / 180;
  // 太阳平近点角
  const Ms = norm360(357.528 + 0.9856003 * d) * Math.PI / 180;
  // 主要摄动项（单位：度）——注意 2D−M' 项系数为正（此前符号错误导致约 2.4° 偏差）
  const corr = (
      6.288774 * Math.sin(Mm)
    + 1.274027 * Math.sin(2 * D - Mm)
    + 0.658314 * Math.sin(2 * D)
    + 0.213618 * Math.sin(2 * Mm)
    - 0.185116 * Math.sin(Ms)
    + 0.058793 * Math.sin(2 * D - 2 * Mm)
    + 0.057066 * Math.sin(2 * D - Mm - Ms)
    + 0.053322 * Math.sin(2 * D + Mm)
    + 0.045758 * Math.sin(2 * D - Ms)
    - 0.040923 * Math.sin(Mm - Ms)
    - 0.034720 * Math.sin(D)
    - 0.030383 * Math.sin(Mm + Ms)
  ) * Math.PI / 180;
  return norm360(Lm + corr) * 180 / Math.PI;
}

// ------------------------------------------------------------------
// 行星位置：NASA JPL 开普勒根数（1800–2050 有效）
// 数据来源：https://ssd.jpl.nasa.gov/planets/approx_pos.html
// 每一行 = [J2000 历元值, 每儒略世纪变化率]：
//   a=半长轴(AU)  e=偏心率  I=轨道倾角(°)  L=平黄经(°)
//   ϖ=近日点黄经(°)  Ω=升交点黄经(°)
// ------------------------------------------------------------------
const KEPLER: Record<string, number[][]> = {
  mercury: [
    [0.38709927, 0.00000037],
    [0.20563593, 0.00001906],
    [7.00497902, -0.00594749],
    [252.25032350, 149472.67411175],
    [77.45779628, 0.16047689],
    [48.33076593, -0.12534081],
  ],
  venus: [
    [0.72333566, 0.00000390],
    [0.00677672, -0.00004107],
    [3.39467605, -0.00078890],
    [181.97909950, 58517.81538729],
    [131.60246718, 0.00268329],
    [76.67984255, -0.27769418],
  ],
  earth: [
    [1.00000261, 0.00000562],
    [0.01671123, -0.00004392],
    [-0.00001531, -0.01294668],
    [100.46457166, 35999.37244981],
    [102.93768193, 0.32327364],
    [0.0, 0.0],
  ],
  mars: [
    [1.52371034, 0.00001847],
    [0.09339410, 0.00007882],
    [1.84969142, -0.00813131],
    [-4.55343205, 19140.30268499],
    [-23.94362959, 0.44441088],
    [49.55953891, -0.29257343],
  ],
  jupiter: [
    [5.20288700, -0.00011607],
    [0.04838624, -0.00013253],
    [1.30439695, -0.00183714],
    [34.39644051, 3034.74612775],
    [14.72847983, 0.21252668],
    [100.47390909, 0.20469106],
  ],
  saturn: [
    [9.53667594, -0.00125060],
    [0.05386179, -0.00050991],
    [2.48599187, 0.00193609],
    [49.95424423, 1222.49362201],
    [92.59887831, -0.41897216],
    [113.66242448, -0.28867794],
  ],
  uranus: [
    [19.18916464, -0.00196176],
    [0.04725744, -0.00004397],
    [0.77263783, -0.00242939],
    [313.23810451, 428.48202785],
    [170.95427630, 0.40805281],
    [74.01692503, 0.04240589],
  ],
  neptune: [
    [30.06992276, 0.00026291],
    [0.00859048, 0.00005105],
    [1.77004347, 0.00035372],
    [-55.12002969, 218.45945325],
    [44.96476227, -0.32241464],
    [131.78422574, -0.00508664],
  ],
  pluto: [
    [39.48211675, -0.00031596],
    [0.24882730, 0.00005170],
    [17.14001206, 0.00004818],
    [238.92903833, 145.20780515],
    [224.06891629, -0.04062942],
    [110.30393684, -0.01183482],
  ],
};

/** 弧度角归一化到 ±π */
function normRad(r: number): number {
  let x = r % (2 * Math.PI);
  if (x > Math.PI) x -= 2 * Math.PI;
  if (x < -Math.PI) x += 2 * Math.PI;
  return x;
}

/** 迭代求解开普勒方程 M = E − e·sin E（弧度） */
function solveKepler(M: number, e: number): number {
  let E = M + e * Math.sin(M);
  for (let i = 0; i < 20; i++) {
    const dM = M - (E - e * Math.sin(E));
    const dE = dM / (1 - e * Math.cos(E));
    E += dE;
    if (Math.abs(dE) < 1e-9) break;
  }
  return E;
}

/**
 * 行星日心黄道坐标（J2000 黄道/春分点，单位 AU）。
 * 依据 JPL 近似位置算法：开普勒根数随儒略世纪线性变化 →
 * 开普勒方程 → 轨道面坐标 → 旋转至黄道面。
 */
function heliocentricEcliptic(id: string, d: number): { x: number; y: number; z: number } {
  const T = d / 36525;
  const [a0, a1] = KEPLER[id][0];
  const [e0, e1] = KEPLER[id][1];
  const [I0, I1] = KEPLER[id][2];
  const [L0, L1] = KEPLER[id][3];
  const [w0, w1] = KEPLER[id][4];
  const [O0, O1] = KEPLER[id][5];
  const a = a0 + a1 * T;
  const e = e0 + e1 * T;
  const I = (I0 + I1 * T) * Math.PI / 180;
  const L = (L0 + L1 * T) * Math.PI / 180;
  const w = (w0 + w1 * T) * Math.PI / 180;
  const O = (O0 + O1 * T) * Math.PI / 180;
  const argPeri = w - O;
  const M = normRad(L - w);
  const E = solveKepler(M, e);
  const xp = a * (Math.cos(E) - e);
  const yp = a * Math.sqrt(1 - e * e) * Math.sin(E);
  const cw = Math.cos(argPeri), sw = Math.sin(argPeri);
  const cO = Math.cos(O), sO = Math.sin(O);
  const cI = Math.cos(I), sI = Math.sin(I);
  const x = (cw * cO - sw * sO * cI) * xp + (-sw * cO - cw * sO * cI) * yp;
  const y = (cw * sO + sw * cO * cI) * xp + (-sw * sO + cw * cO * cI) * yp;
  const z = (sw * sI) * xp + (cw * sI) * yp;
  return { x, y, z };
}

/** 岁差（度）：J2000 春分点 → 当日春分点（Meeus 近似） */
function precession(d: number): number {
  const T = d / 36525;
  return (5028.796195 * T + 1.1054348 * T * T) / 3600;
}

/** 行星地心黄经（日期春分点，0-360°）：日心坐标减地球 → 地心坐标 → 加岁差 */
function planetLongitude(id: string, d: number): number {
  const p = heliocentricEcliptic(id, d);
  const e = heliocentricEcliptic('earth', d);
  const lon = Math.atan2(p.y - e.y, p.x - e.x) * 180 / Math.PI;
  return norm360(lon + precession(d));
}

/** 真实逆行判定：黄经日速度 < 0 即逆行 */
function isRetrograde(id: string, d: number): boolean {
  if (id === 'sun' || id === 'moon') return false;
  const h = 0.5;
  const l1 = planetLongitude(id, d - h);
  const l2 = planetLongitude(id, d + h);
  let diff = l2 - l1;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return diff < 0;
}

/** 计算所有行星黄经 */
function computePlanetLongitudes(d: number): { id: string; lon: number; ret: boolean }[] {
  const ids = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];
  return ids.map(id => {
    const lon = id === 'sun' ? sunLongitude(d)
      : id === 'moon' ? moonLongitude(d)
      : planetLongitude(id, d);
    return { id, lon, ret: isRetrograde(id, d) };
  });
}

// ============================================================
// 宫位计算（整宫制 Whole Sign + ASC/MC 准确公式）
// ============================================================

/** 儒略世纪数（自 J2000.0 起） */
function julianCenturies(d: number): number { return d / 36525; }

/** 平恒星时（小时，0-24）— Meeus 公式（d 已含当日时刻的日分数） */
function meanSiderealTime(d: number): number {
  const T = julianCenturies(d);
  // d = 自 J2000.0（2000-01-01 12:00 TT）起的天数（含当日时刻分数）
  const gmst = 280.46061837 + 360.98564736629 * d + 0.000387933 * T * T - (T * T * T) / 38710000;
  return norm360(gmst) / 15; // 转小时
}

/** 黄赤交角（°） */
function obliquity(d: number): number {
  const T = julianCenturies(d);
  // IAU 2000 公式（精度足够）
  const eps = 23.4392911 - 0.0130042 * T - 1.64e-7 * T * T + 5.04e-7 * T * T * T;
  return eps;
}

/** 上升点 ASC（度 0-360） */
function ascendant(d: number, _ut: number, lon: number, lat: number): number {
  const lst = meanSiderealTime(d) * 15 + lon; // 当地恒星时（度）
  const ramc = norm360(lst); // RAMC
  const eps = obliquity(d) * Math.PI / 180;
  const phi = lat * Math.PI / 180;
  const r = ramc * Math.PI / 180;
  // ASC = arctan( cos(RAMC) / ( −( sin(RAMC)·cos ε + tan φ · sin ε ) ) )
  const y = Math.cos(r);
  const x = -(Math.sin(r) * Math.cos(eps) + Math.tan(phi) * Math.sin(eps));
  let asc = Math.atan2(y, x) * 180 / Math.PI;
  asc = norm360(asc);
  return asc;
}

/** 天顶 MC（度 0-360） */
function midheaven(d: number, _ut: number, lon: number): number {
  const lst = meanSiderealTime(d) * 15 + lon;
  const ramc = norm360(lst) * Math.PI / 180;
  const eps = obliquity(d) * Math.PI / 180;
  // MC = atan2(sin RAMC, cos RAMC · cos ε)：保证与 RAMC 同象限
  // （此前 atan(tan RAMC)/cos ε 主值域 ±90°，会丢失象限导致 MC 偏 180°）
  let mc = Math.atan2(Math.sin(ramc), Math.cos(ramc) * Math.cos(eps)) * 180 / Math.PI;
  mc = norm360(mc);
  return mc;
}

/**
 * 整宫制宫头（Whole Sign）：
 *   - 第 1 宫 = 上升点所在星座 0°
 *   - 第 N 宫 = 上升点星座 0° + (N-1) × 30°
 * 优点：稳定、易于解释，符合古代占星传统。
 */
function wholeSignHouses(asc: number): HousePosition[] {
  const startSign = Math.floor(asc / 30);
  return Array.from({ length: 12 }, (_, i) => {
    const cusp = (startSign * 30 + i * 30) % 360;
    const signId = SIGNS[Math.floor(cusp / 30)].id;
    return { num: i + 1, cusp, signId, degreeInSign: cusp % 30 };
  });
}

// ============================================================
// 相位计算
// ============================================================

function computeAspects(planets: readonly PlanetPosition[]): AspectResult[] {
  const out: AspectResult[] = [];
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const a = planets[i].longitude;
      const b = planets[j].longitude;
      let d = Math.abs(a - b);
      if (d > 180) d = 360 - d;
      for (const asp of ASPECTS) {
        const diff = Math.abs(d - asp.angle);
        if (diff <= asp.orb) {
          out.push({
            p1: planets[i].id,
            p2: planets[j].id,
            type: asp.id,
            typeZh: asp.name,
            symbol: asp.symbol,
            angle: asp.angle,
            orb: Math.round(diff * 10) / 10,
            nature: asp.nature,
          });
          break; // 每对行星只取最接近的一个相位
        }
      }
    }
  }
  return out;
}

// ============================================================
// 主入口：排本命盘
// ============================================================

export function natalChart(birth: BirthInfo): NatalChart {
  const d = daysSinceJ2000(birth.year, birth.month, birth.day, birth.hour, birth.minute, birth.second, birth.timezone);
  const ut = birth.hour - birth.timezone + birth.minute / 60 + birth.second / 3600;

  // 太阳星座（用本地日期，简化处理）
  const sunSign = sunSignOf(birth.month, birth.day);

  // 行星位置
  const longitudes = computePlanetLongitudes(d);
  const planetNames: Record<string, { name: string; symbol: string }> = {
    sun:     { name: '太阳', symbol: '☉' },
    moon:    { name: '月亮', symbol: '☽' },
    mercury: { name: '水星', symbol: '☿' },
    venus:   { name: '金星', symbol: '♀' },
    mars:    { name: '火星', symbol: '♂' },
    jupiter: { name: '木星', symbol: '♃' },
    saturn:  { name: '土星', symbol: '♄' },
    uranus:  { name: '天王星', symbol: '♅' },
    neptune: { name: '海王星', symbol: '♆' },
    pluto:   { name: '冥王星', symbol: '♇' },
  };
  const planets: PlanetPosition[] = longitudes.map(p => {
    const signIdx = Math.floor(p.lon / 30) % 12;
    const sign = SIGNS[signIdx];
    return {
      id: p.id,
      name: planetNames[p.id].name,
      symbol: planetNames[p.id].symbol,
      longitude: p.lon,
      signId: sign.id,
      degreeInSign: p.lon - signIdx * 30,
      retrograde: p.ret,
    };
  });

  // ASC / MC
  const asc = ascendant(d, ut, birth.longitude, birth.latitude);
  const mc = midheaven(d, ut, birth.longitude);
  const ascSign = SIGNS[Math.floor(asc / 30) % 12];
  const mcSign = SIGNS[Math.floor(mc / 30) % 12];

  // 宫位（整宫制）
  const houses = wholeSignHouses(asc);

  // 相位
  const aspects = computeAspects(planets);

  return { birth, sunSign, ascendant: asc, midheaven: mc, ascSign, mcSign, planets, houses, aspects };
}

// ============================================================
// 合盘（Synastry）：双盘交叉相位
// ============================================================

export function synastry(a: NatalChart, b: NatalChart): AspectResult[] {
  const out: AspectResult[] = [];
  for (const pa of a.planets) {
    for (const pb of b.planets) {
      let d = Math.abs(pa.longitude - pb.longitude);
      if (d > 180) d = 360 - d;
      for (const asp of ASPECTS) {
        const diff = Math.abs(d - asp.angle);
        // 合盘容许度略宽（+1°）
        if (diff <= asp.orb + 1) {
          out.push({
            p1: pa.id,
            p2: pb.id,
            type: asp.id,
            typeZh: asp.name,
            symbol: asp.symbol,
            angle: asp.angle,
            orb: Math.round(diff * 10) / 10,
            nature: asp.nature,
          });
          break;
        }
      }
    }
  }
  return out;
}

// ============================================================
// 塔罗抽牌
// ============================================================

export interface TarotDraw {
  readonly card: TarotCard;
  readonly reversed: boolean;
  readonly position: string;
}

export interface TarotSpread {
  readonly spreadId: string;
  readonly spreadName: string;
  readonly draws: readonly TarotDraw[];
}

/** 已洗牌并预置正/逆位的塔罗牌 */
export interface TarotDeckCard {
  readonly card: TarotCard;
  readonly reversed: boolean;
}

/** 牌组模式：major 仅 22 张大阿卡纳，full 完整 78 张（大 + 小阿卡纳） */
export type TarotDeckMode = 'major' | 'full';

/** 洗牌：Fisher–Yates 随机排列（major 仅 22 大阿卡纳 / full 完整 78 张），并逐张预置正/逆位（进入界面 / 再次占卜时调用） */
export function createTarotDeck(random?: () => number, mode?: TarotDeckMode): TarotDeckCard[];
export function createTarotDeck(mode?: TarotDeckMode, random?: () => number): TarotDeckCard[];
export function createTarotDeck(a: TarotDeckMode | (() => number) = 'full', b: TarotDeckMode | (() => number) = Math.random): TarotDeckCard[] {
  const mode: TarotDeckMode = typeof a === 'string' ? a : (typeof b === 'string' ? b : 'full');
  const random: () => number = typeof a === 'function' ? a : (typeof b === 'function' ? b : Math.random);
  const cards = mode === 'major' ? [...MAJOR_ARCANA] : [...MAJOR_ARCANA, ...MINOR_ARCANA];
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards.map(card => ({ card, reversed: random() < 0.5 }));
}

/** 按 id 查找牌阵（找不到时回退三牌阵） */
export function spreadById(spreadId: string): Spread {
  return SPREADS.find(s => s.id === spreadId) ?? SPREADS.find(s => s.id === 'three') ?? SPREADS[0];
}

/** 按抽取先后顺序组装牌阵结果（抽取顺序 = 摆牌顺序）；count 可覆盖默认张数（用于可变张数牌阵） */
export function buildTarotSpread(spreadId: string, picks: readonly { card: TarotCard; reversed: boolean }[], count?: number): TarotSpread {
  const spread = spreadById(spreadId);
  const n = count ?? spread.count;
  const draws: TarotDraw[] = picks.slice(0, n).map((p, i) => ({
    card: p.card,
    reversed: p.reversed,
    position: spread.positions[i] ?? `位置${i + 1}`,
  }));
  return { spreadId: spread.id, spreadName: spread.name, draws };
}

/** 一次性便捷抽牌：从洗好的牌堆顶部取 count 张（不放回），正/逆位沿用预置结果 */
export function drawTarot(spreadId: string, deck: readonly TarotDeckCard[], _random: () => number = Math.random): TarotSpread {
  const picks = deck.slice(0, spreadById(spreadId).count).map(d => ({ card: d.card, reversed: d.reversed }));
  return buildTarotSpread(spreadId, picks);
}
