/**
 * 卦象解析工具模块
 * ------------------------------------------------------------------
 * 提供五行、六亲推算，四柱构建，六爻爻线构建，以及变卦/互卦索引查找。
 */
import { getHexagramByIndex, findHexagramByTrigrams, bitsToTrigramIdx, TRIGRAMS } from '../data/hexagrams';
import { getNajia, parseNajia, hourToDizhi } from '../data/najia';
import { yearGZ, monthGZ, dayGZ, hourGZ, getSolarMonth, getSolarTermYear, solarToLunar } from './calendar';

/** 天干地支 -> 五行映射表 */
const WUXING_MAP: Record<string, string> = {
  '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土', '己': '土',
  '庚': '金', '辛': '金', '壬': '水', '癸': '水',
  '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土', '巳': '火',
  '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水',
};

/** 八宫五行属性：乾兑金、震巽木、坎水、离火、坤艮土 */
const PALACE_WUXING: Record<string, string> = {
  '乾': '金', '兑': '金', '震': '木', '巽': '木',
  '坎': '水', '离': '火', '坤': '土', '艮': '土',
};

/**
 * 查询天干或地支的五行属性。
 * @param ganOrZhi - 天干或地支字符
 * @returns 五行名称（金/木/水/火/土），未知则返回空串
 */
export function wuXingOf(ganOrZhi: string): string {
  return WUXING_MAP[ganOrZhi] || '';
}

/**
 * 五行生克关系表（以宫位五行为主，推导其他五行的六亲）。
 * rel[宫位五行][爻位五行] => 六亲名称
 * 传统六爻六亲：兄弟（同类）、子孙（我生）、妻财（我克）、官鬼（克我）、父母（生我）。
 */
const LIUQIN_REL: Record<string, Record<string, string>> = {
  '金': { '木': '妻财', '火': '官鬼', '水': '子孙', '土': '父母' },
  '木': { '火': '子孙', '土': '妻财', '金': '官鬼', '水': '父母' },
  '水': { '木': '父母', '火': '妻财', '土': '官鬼', '金': '子孙' },
  '火': { '土': '父母', '金': '妻财', '水': '官鬼', '木': '子孙' },
  '土': { '金': '父母', '水': '官鬼', '木': '妻财', '火': '子孙' },
};

/**
 * 推算六亲关系（基于宫位五行与爻位地支五行的生克）。
 * @param zhi - 爻位地支
 * @param palaceEl - 本卦所属宫位的五行
 * @returns 六亲名称（兄弟/父母/子孙/妻财/官鬼）
 */
export function liuQinOf(zhi: string, palaceEl: string): string {
  const el = wuXingOf(zhi);
  if (!el) return '';
  if (el === palaceEl) return '兄弟';
  return (LIUQIN_REL[palaceEl] || {})[el] || '';
}

/**
 * 取模运算，当整除时返回除数本身（而非 0）。
 * 用于起卦时的"余数归位"（如 8%8=8 而非 0）。
 * @param n - 被除数
 * @param mod - 除数
 * @returns 余数（1 ~ mod）
 */
export function modOrMax(n: number, mod: number): number {
  const r = n % mod;
  return r === 0 ? mod : r;
}

/**
 * 构建四柱（年月日时）干支。
 * @param y - 公历年
 * @param m - 公历月
 * @param d - 公历日
 * @param h - 小时（0-23）
 * @returns 四柱信息（含天干、地支、干支合字，及农历/节气数据）
 */
export function buildBazi(y: number, m: number, d: number, h: number) {
  const sty = getSolarTermYear(y, m, d);
  const sm = getSolarMonth(y, m, d);
  const ygz = yearGZ(sty);
  const mgz = monthGZ(ygz, sm);
  const dgz = dayGZ(y, m, d);
  const hgz = hourGZ(dgz, h);
  return {
    year: { gan: ygz[0], zhi: ygz[1], ganzhi: ygz },
    month: { gan: mgz[0], zhi: mgz[1], ganzhi: mgz },
    day: { gan: dgz[0], zhi: dgz[1], ganzhi: dgz },
    hour: { gan: hgz.gz[0], zhi: hgz.gz[1], ganzhi: hgz.gz },
    solarTermYear: sty,
    lunar: solarToLunar(y, m, d),
    solarTermNext: hourToDizhi(h),
  };
}

/**
 * 构建六爻爻线详情（含纳甲干支、世应标记、六亲）。
 * @param hexIndex - 卦序（1-64）
 * @param moving - 动爻位置数组（1-6）
 * @param dayGan - 日柱天干（保留接口兼容，六亲改用宫位五行）
 * @returns 6 爻详情数组
 */
export function buildLines(hexIndex: number, moving: readonly number[], _dayGan: string) {
  const h = getHexagramByIndex(hexIndex);
  const najiaStr = getNajia(TRIGRAMS[h.upper] || '', TRIGRAMS[h.lower] || '');
  const parsed = parseNajia(najiaStr);
  const palaceEl = PALACE_WUXING[h.palace] || '土';
  return Array.from({ length: 6 }, (_, i) => {
    const pos = (i + 1) as 1 | 2 | 3 | 4 | 5 | 6;
    const isYang = h.lines[i] === true;
    const p = parsed[i];
    return {
      position: pos,
      yinYang: (isYang ? 'yang' : 'yin') as 'yang' | 'yin',
      changed: moving.includes(pos),
      tiangan: p?.gan || '甲',
      dizhi: p?.zhi || '子',
      shi: pos === h.shiPosition,
      ying: pos === h.yingPosition,
      liuQin: liuQinOf(p?.zhi || '', palaceEl),
    };
  });
}

/**
 * 构建完整卦象（含爻线详情）。
 * @param hexIndex - 卦序（1-64）
 * @param moving - 动爻位置数组
 * @param dayGan - 日柱天干
 * @returns 卦象数据
 */
export function buildHexagram(hexIndex: number, moving: readonly number[], dayGan: string) {
  const h = getHexagramByIndex(hexIndex);
  return {
    index: hexIndex,
    name: h.name,
    fullName: h.fullName,
    upper: h.upper,
    lower: h.lower,
    palace: h.palace,
    element: h.element,
    nature: h.nature,
    lines: buildLines(hexIndex, moving, dayGan),
    shiPosition: h.shiPosition,
    yingPosition: h.yingPosition,
  };
}

/**
 * 查找变卦索引（动爻阴阳互变后的卦）。
 * @param hexIndex - 本卦序号
 * @param moving - 动爻位置数组
 * @returns 变卦序号
 */
export function findChangedHexagram(hexIndex: number, moving: readonly number[]): number {
  const h = getHexagramByIndex(hexIndex);
  const changed = h.lines.map((b, i) => (moving.includes(i + 1) ? !b : b));
  return findHexagramByTrigrams(
    bitsToTrigramIdx([changed[5], changed[4], changed[3]]),
    bitsToTrigramIdx([changed[2], changed[1], changed[0]]),
  );
}

/**
 * 查找互卦索引（取本卦 2-3-4 爻为下卦，3-4-5 爻为上卦）。
 * @param hexIndex - 本卦序号
 * @returns 互卦序号
 */
export function findHuHexagram(hexIndex: number): number {
  const h = getHexagramByIndex(hexIndex);
  return findHexagramByTrigrams(
    bitsToTrigramIdx([h.lines[4], h.lines[3], h.lines[2]]),
    bitsToTrigramIdx([h.lines[3], h.lines[2], h.lines[1]]),
  );
}
