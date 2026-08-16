/**
 * 六爻基础面板
 * ------------------------------------------------------------------
 * 六爻排盘：以本卦为主，推算变卦、伏神、六神、六亲等。
 * 六亲关系基于宫位五行与各爻地支五行的生克。
 */
import type { Hexagram, LiuYaoPanel, Bazi } from '../types';
import { wuXingOf, findChangedHexagram } from '../utils/parser';
import { getHexagramByIndex } from '../data/hexagrams';

/** 六神列表（按日干起算，日复一日循环） */
const LIU_SHEN = ['青龙', '朱雀', '勾陈', '螣蛇', '白虎', '玄武'];

/**
 * 六神起例映射：日干 → 六神起始索引。
 * 口诀「甲乙起青龙、丙丁起朱雀、戊起勾陈、己起螣蛇、庚辛起白虎、壬癸起玄武」。
 */
const SIX_SHEN_START: Record<string, number> = {
  '甲': 0, '乙': 0, '丙': 1, '丁': 1, '戊': 2, '己': 3, '庚': 4, '辛': 4, '壬': 5, '癸': 5,
};

/** 八宫本宫卦（八纯卦）的卦序索引（依《周易》序卦传顺序，与 hexagrams.ts 一致） */
const GONG_BENGONG: Record<string, number> = {
  '乾': 1, '坤': 2, '坎': 29, '离': 30, '震': 51, '艮': 52, '巽': 57, '兑': 58,
};

/** 五行相生关系表（我生） */
const SHENG_MAP: Record<string, string> = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' };
/** 五行相克关系表（我克） */
const KE_MAP: Record<string, string> = { '木': '土', '火': '金', '土': '水', '金': '木', '水': '火' };

/** 八宫五行属性：乾兑金、震巽木、坎水、离火、坤艮土 */
const PALACE_WUXING: Record<string, string> = {
  '乾': '金', '兑': '金', '震': '木', '巽': '木',
  '坎': '水', '离': '火', '坤': '土', '艮': '土',
};

/**
 * 由卦序构造轻量卦象（不含爻线详情，仅基本信息）。
 * @param index - 卦序
 * @returns 卦象数据
 */
function makeHex(index: number): Hexagram {
  const r = getHexagramByIndex(index);
  return {
    index,
    name: r.name,
    fullName: r.fullName,
    upper: r.upper,
    lower: r.lower,
    palace: r.palace,
    element: r.element,
    nature: r.nature,
    lines: [],
    shiPosition: r.shiPosition,
    yingPosition: r.yingPosition,
  };
}

/**
 * 构建六爻排盘。
 * @param ben - 本卦
 * @param dong - 动爻位置数组
 * @param bazi - 四柱数据（取日干）
 * @returns 六爻面板数据
 */
export function buildLiuYao(ben: Hexagram, dong: readonly number[], bazi: Bazi): LiuYaoPanel {
  const bianIdx = findChangedHexagram(ben.index, dong);

  // 伏神：以本卦所属宫位的本宫卦为伏神来源
  const fuShi = Array.from({ length: 6 }, (_, i) => ({ hex: makeHex(GONG_BENGONG[ben.palace] ?? 1), line: i + 1 }));

  // 六亲推算：以宫位五行与各爻地支五行的生克关系判定
  const palaceEl = PALACE_WUXING[ben.palace] || '土';
  const liuQinMap = ben.lines.map((l, i) => {
    const el = wuXingOf(l.dizhi);
    let lq = '';
    if (el === palaceEl) lq = '兄弟';
    else if (SHENG_MAP[el] === palaceEl) lq = '父母';
    else if (SHENG_MAP[palaceEl] === el) lq = '子孙';
    else if (KE_MAP[palaceEl] === el) lq = '妻财';
    else if (KE_MAP[el] === palaceEl) lq = '官鬼';
    return { position: i + 1, liuQin: lq, ganZhi: l.tiangan + l.dizhi };
  });

  // 六神：按日干起例确定起始六神，逐爻循环配六神
  const startIdx = SIX_SHEN_START[bazi.day.gan] ?? 0;
  const liuShen = Array.from({ length: 6 }, (_, i) => LIU_SHEN[(startIdx + i) % 6]);

  // 生成概述
  let summary = `${ben.fullName}，${ben.palace}宫，世爻${ben.shiPosition}爻`;
  if (dong.length > 0) summary += `，${dong.join('、')}爻动`;

  return { ben, bian: makeHex(bianIdx), dong, fuShi, liuShen, liuQinMap, summary: summary + '。' };
}
