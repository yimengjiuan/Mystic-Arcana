// 梅花易数面板
import { Hexagram, MeiHuaPanel } from '../types';
import { wuXingOf } from '../utils/parser';
import { getHexagramByIndex, changeLines, TRIGRAMS } from '../data/hexagrams';
import { findHexagramByTrigrams } from '../data/hexagrams';

const SHENG_KE: Record<string, readonly string[]> = {
  '金': ['金', '水', '木', '火', '土'],
  '木': ['木', '火', '土', '金', '水'],
  '水': ['水', '木', '火', '土', '金'],
  '火': ['火', '土', '金', '水', '木'],
  '土': ['土', '金', '水', '木', '火']
};

export function buildMeiHua(ben: Hexagram, dong: readonly number[]): MeiHuaPanel {
  const benRaw = getHexagramByIndex(ben.index);
  const huUpper = [benRaw.lines[1], benRaw.lines[2], benRaw.lines[3]];
  const huLower = [benRaw.lines[2], benRaw.lines[3], benRaw.lines[4]];
  const bitsToTrigramIdx = (arr: readonly boolean[]): number => {
    return (arr[0] ? 4 : 0) + (arr[1] ? 2 : 0) + (arr[2] ? 1 : 0);
  };
  const huUpperIdx = bitsToTrigramIdx(huUpper);
  const huLowerIdx = bitsToTrigramIdx(huLower);
  const huIndex = findHexagramByTrigrams(huUpperIdx, huLowerIdx);
  const hu = makeHexFromIndex(huIndex);

  const changed = changeLines(benRaw.lines, dong);
  const bianUpperIdx = bitsToTrigramIdx([changed[0], changed[1], changed[2]]);
  const bianLowerIdx = bitsToTrigramIdx([changed[3], changed[4], changed[5]]);
  const bianIndex = findHexagramByTrigrams(bianUpperIdx, bianLowerIdx);
  const bian = makeHexFromIndex(bianIndex);

  const upperDong = dong.some(d => d >= 4);
  const lowerDong = dong.some(d => d <= 3);
  let ti: Hexagram, yong: Hexagram;
  if (upperDong && !lowerDong) { ti = makeHexFromIndex(findHexagramByTrigrams(huLowerIdx, huLowerIdx)); yong = ben; }
  else if (lowerDong && !upperDong) { ti = ben; yong = makeHexFromIndex(findHexagramByTrigrams(huUpperIdx, huUpperIdx)); }
  else { ti = ben; yong = bian; }

  const tiElement = wuXingOf(TRIGRAMS[ben.upper] || '');
  const yongElement = wuXingOf(TRIGRAMS[ben.lower] || '');
  const shengKe = SHENG_KE[tiElement] || [];
  const idxYong = shengKe.indexOf(yongElement);
  let interp = '体用比和，谋事可成。';
  if (idxYong === 1) interp = '体克用，所谋易成但费力。';
  else if (idxYong === 2) interp = '用克体，所谋难成，防损耗。';
  else if (idxYong === 3) interp = '用生体，大吉，百事可成。';
  else if (idxYong === 4) interp = '体生用，小凶，付出多收获少。';
  else if (idxYong === 0 && tiElement !== yongElement) interp = '体用五行相战，宜守不宜进。';

  return { ben, hu, bian, dong, ti, yong, tiElement, yongElement, interpretation: interp };
}

function makeHexFromIndex(index: number): Hexagram {
  const r = getHexagramByIndex(index);
  return { index: r.index, name: r.name, fullName: r.fullName, upper: r.upper, lower: r.lower, palace: r.palace, element: r.element, nature: r.nature, lines: [], shiPosition: r.shiPosition, yingPosition: r.yingPosition };
}
