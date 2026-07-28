import { GZ, Line, Hexagram } from '../types';
import { getHexagramByIndex, changeLines, findHexagramByTrigrams, bitsToTrigramIdx, TRIGRAMS } from '../data/hexagrams';
import { getNajia, parseNajia, hourToDizhi } from '../data/najia';
import { yearGZ, monthGZ, dayGZ, hourGZ, getSolarMonth, getSolarTermYear, solarToLunar } from './calendar';

const WUXING: Record<string, string> = {
  '甲':'木','乙':'木','丙':'火','丁':'火','戊':'土','己':'土','庚':'金','辛':'金','壬':'水','癸':'水',
  '子':'水','丑':'土','寅':'木','卯':'木','辰':'土','巳':'火','午':'火','未':'土','申':'金','酉':'金','戌':'土','亥':'水'
};

export function wuXingOf(ganOrZhi: string): string { return WUXING[ganOrZhi] || ''; }

export function liuQinOf(zhiSelf: string, zhiOther: string, dayGan: string): string {
  const selfEl = wuXingOf(zhiSelf), otherEl = wuXingOf(zhiOther);
  if (!selfEl || !otherEl) return '';
  if (selfEl === otherEl) return WUXING[dayGan] === selfEl ? '比肩' : '比和';
  const dayEl = WUXING[dayGan] || '木';
  const rel: Record<string, Record<string, string>> = {
    '金': { '木': '财', '火': '官', '水': '食', '土': '印' },
    '木': { '火': '食', '土': '财', '金': '官', '水': '印' },
    '水': { '木': '印', '火': '财', '土': '官', '金': '食' },
    '火': { '土': '印', '金': '财', '水': '官', '木': '食' },
    '土': { '金': '印', '水': '官', '木': '财', '火': '食' }
  };
  return (rel[dayEl] || {})[otherEl] || '和';
}

export function buildLines(hexIndex: number, moving: readonly number[], dayGan: string): readonly Line[] {
  const h = getHexagramByIndex(hexIndex);
  const najiaStr = getNajia(TRIGRAMS[h.upper] || '', TRIGRAMS[h.lower] || '');
  const parsed = parseNajia(najiaStr);
  return Array.from({ length: 6 }, (_, i) => {
    const pos = (i + 1) as 1 | 2 | 3 | 4 | 5 | 6;
    const isYang = h.lines[i] === true;
    const p = parsed[i] || { gan: '甲', zhi: '子', ganzhi: '甲子' };
    return { position: pos, yinYang: isYang ? 'yang' : 'yin', changed: moving.includes(pos), tiangan: p.gan, dizhi: p.zhi, shi: pos === h.shiPosition, ying: pos === h.yingPosition, liuQin: liuQinOf(p.zhi, p.zhi, dayGan) };
  });
}

export function buildHexagram(hexIndex: number, moving: readonly number[], dayGan: string): Hexagram {
  const h = getHexagramByIndex(hexIndex);
  return { index: hexIndex, name: h.name, fullName: h.fullName, upper: h.upper, lower: h.lower, palace: h.palace, element: h.element, nature: h.nature, lines: buildLines(hexIndex, moving, dayGan), shiPosition: h.shiPosition, yingPosition: h.yingPosition };
}

export function findChangedHexagram(hexIndex: number, moving: readonly number[]): number {
  const h = getHexagramByIndex(hexIndex);
  const changed = changeLines(h.lines, moving);
  return findHexagramByTrigrams(bitsToTrigramIdx([changed[5], changed[4], changed[3]]), bitsToTrigramIdx([changed[2], changed[1], changed[0]]));
}

export function findHuHexagram(hexIndex: number): number {
  const h = getHexagramByIndex(hexIndex);
  return findHexagramByTrigrams(bitsToTrigramIdx([h.lines[4], h.lines[3], h.lines[2]]), bitsToTrigramIdx([h.lines[3], h.lines[2], h.lines[1]]));
}

export function modOrMax(n: number, mod: number): number { const r = n % mod; return r === 0 ? mod : r; }

export function buildBazi(y: number, m: number, d: number, h: number): { year: GZ; month: GZ; day: GZ; hour: GZ; solarTermYear: number; lunar: { year: number; month: number; day: number; isLeap: boolean }; solarTermNext: string } {
  const sty = getSolarTermYear(y, m, d), sm = getSolarMonth(y, m, d);
  const ygz = yearGZ(sty), mgz = monthGZ(ygz, sm), dgz = dayGZ(y, m, d), hgz = hourGZ(dgz, h);
  return { year: { gan: ygz[0] || '', zhi: ygz[1] || '', ganzhi: ygz }, month: { gan: mgz[0] || '', zhi: mgz[1] || '', ganzhi: mgz }, day: { gan: dgz[0] || '', zhi: dgz[1] || '', ganzhi: dgz }, hour: { gan: hgz.gz[0] || '', zhi: hgz.gz[1] || '', ganzhi: hgz.gz }, solarTermYear: sty, lunar: solarToLunar(y, m, d), solarTermNext: hourToDizhi(h) };
}
