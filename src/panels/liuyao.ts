// 六爻基础面板
import { Hexagram, LiuYaoPanel, Bazi } from '../types';
import { wuXingOf } from '../utils/parser';
import { getHexagramByIndex, findHexagramByTrigrams } from '../data/hexagrams';

const LIU_SHEN: readonly string[] = ['青龙', '朱雀', '勾陈', '螣蛇', '白虎', '玄武'];

function dayGanLiuShenIdx(dayGan: string): number {
  const order = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
  return order.indexOf(dayGan);
}

export function buildLiuYao(ben: Hexagram, dong: readonly number[], bazi: Bazi): LiuYaoPanel {
  const benRaw = getHexagramByIndex(ben.index);
  const changed = benRaw.lines.map((b, i) => dong.includes(i + 1) ? !b : b);
  const bitsToIdx = (a: readonly boolean[]): number => (a[0] ? 4 : 0) + (a[1] ? 2 : 0) + (a[2] ? 1 : 0);
  const bianIndex = findHexagramByTrigrams(bitsToIdx([changed[0], changed[1], changed[2]]), bitsToIdx([changed[3], changed[4], changed[5]]));
  const bian = makeHexFromIndex(bianIndex);

  const palaceName = ben.palace;
  const palaceIndex = ['乾','坎','艮','震','巽','离','坤','兑'].indexOf(palaceName);
  const palaceBase = palaceIndex * 8 + 1;
  const fuShi: { hex: Hexagram; line: number }[] = [];
  for (let i = 0; i < 6; i++) {
    if (ben.lines[i] === undefined || ben.lines[i] === null) continue;
    const fu = makeHexFromIndex(palaceBase);
    fuShi.push({ hex: fu, line: i + 1 });
  }

  const dayGan = bazi.day.gan;
  const dayEl = wuXingOf(dayGan);
  const liuQinMap: { position: number; liuQin: string; ganZhi: string }[] = [];
  for (let i = 0; i < 6; i++) {
    const lineZhi = ben.lines[i]?.dizhi || '';
    const lineEl = wuXingOf(lineZhi);
    let lq = '和';
    if (lineEl === dayEl) lq = '比肩';
    else {
      const sheng: Record<string, string> = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' };
      const ke: Record<string, string> = { '木': '土', '火': '金', '土': '水', '金': '木', '水': '火' };
      if (sheng[dayEl] === lineEl) lq = '食神';
      else if (ke[dayEl] === lineEl) lq = '财爻';
      else if (sheng[lineEl] === dayEl) lq = '印爻';
      else if (ke[lineEl] === dayEl) lq = '官鬼';
    }
    liuQinMap.push({ position: i + 1, liuQin: lq, ganZhi: ben.lines[i]?.tiangan + lineZhi || '' });
  }

  const startIdx = dayGanLiuShenIdx(dayGan);
  const liuShen: string[] = [];
  for (let i = 0; i < 6; i++) {
    liuShen.push(LIU_SHEN[(startIdx + i) % 6] || '青龙');
  }

  let summary = `${ben.fullName}，${ben.palace}宫，世爻${ben.shiPosition}爻`;
  if (dong.length > 0) summary += `，${dong.join('、')}爻动`;
  summary += '。';

  return { ben, bian, dong, fuShi, liuShen, liuQinMap, summary };
}

function makeHexFromIndex(index: number): Hexagram {
  const r = getHexagramByIndex(index);
  return {
    index: r.index,
    name: r.name,
    fullName: r.fullName,
    upper: r.upper,
    lower: r.lower,
    palace: r.palace,
    element: r.element,
    nature: r.nature,
    lines: [],
    shiPosition: r.shiPosition,
    yingPosition: r.yingPosition
  };
}
