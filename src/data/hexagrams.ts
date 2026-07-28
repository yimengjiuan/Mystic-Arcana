// 64卦紧凑字符串
const RAW_LINES: readonly string[] = [
  '111111','000000','010001','100010','010111','111010','000010','010000',
  '110111','111011','000111','111000','111101','101111','000100','001000',
  '011001','100110','000011','110000','101001','100101','100000','000001',
  '111001','100111','100001','011110','010010','101101','011100','001110',
  '111100','001111','101000','000101','110101','101011','010100','001010',
  '100011','110001','011111','111110','011000','000110','011010','010110',
  '011101','101110','001001','100100','110100','001011','001101','101100',
  '110110','011011','110010','010011','110011','001100','010101','101010'
];
const RAW_SHORT: readonly string[] = [
  '乾','坤','屯','蒙','需','讼','师','比','畜','履','泰','否','人','有','谦','豫',
  '随','蛊','临','观','噬','贲','剥','复','妄','畜','颐','过','坎','离','咸','恒',
  '遁','壮','晋','夷','家','睽','蹇','解','损','益','夬','姤','萃','升','困','井',
  '革','鼎','震','艮','渐','妹','丰','旅','巽','兑','涣','节','孚','过','济','济'
];
const RAW_FULL: readonly string[] = [
  '乾为天','坤为地','水雷屯','山水蒙','水天需','天水讼','地水师','水地比',
  '风天小畜','天泽履','地天泰','天地否','天火同人','火天大有','地山谦','雷地豫',
  '泽雷随','山风蛊','地泽临','风地观','火雷噬嗑','山火贲','山地剥','地雷复',
  '天雷无妄','山天大畜','山雷颐','泽风大过','坎为水','离为火','泽山咸','雷风恒',
  '天山遁','雷天大壮','火地晋','地火明夷','风火家人','火泽睽','水山蹇','雷水解',
  '山泽损','风雷益','泽天夬','天风姤','泽地萃','地风升','泽水困','水风井',
  '泽火革','火风鼎','震为雷','艮为山','风山渐','雷泽归妹','雷火丰','火山旅',
  '巽为风','兑为泽','风水涣','水泽节','风泽中孚','雷山小过','水火既济','火水未济'
];
const RAW_PALACE: readonly string[] = [
  '乾','坎','坎','艮','坤','离','坎','坤','巽','艮','坤','乾','离','乾','艮','震',
  '震','巽','坤','艮','巽','艮','乾','坤','巽','艮','巽','兑','坎','离','兑','震',
  '乾','坤','乾','巽','巽','艮','坎','震','艮','巽','兑','乾','兑','巽','兑','巽',
  '兑','离','震','艮','艮','兑','震','离','巽','兑','巽','兑','艮','兑','坎','离'
];
const RAW_SHI_YING: readonly string[] = [
  '6-3','6-3','1-4','2-5','5-2','3-6','3-6','4-1','5-2','4-1','5-2','2-5','5-2','5-2','3-6','1-4',
  '1-4','2-5','1-4','5-2','5-2','5-2','5-2','1-4','4-1','2-5','2-5','6-3','6-3','3-6','4-1','2-5',
  '2-5','4-1','5-2','3-6','5-2','5-2','2-5','2-5','6-3','3-6','6-3','1-4','4-1','5-2','4-1','2-5',
  '4-1','6-3','6-3','6-3','6-3','4-1','6-3','2-5','2-5','3-6','6-3','5-2','5-2','2-5','3-6','3-6'
];

export const TRIGRAMS: readonly string[] = ['乾', '兑', '离', '震', '巽', '坎', '艮', '坤'];
export const TRIGRAM_BITS: readonly string[] = ['111', '011', '101', '001', '110', '010', '100', '000'];
export const TRIGRAM_ELEMENT: readonly string[] = ['金', '金', '火', '木', '木', '水', '土', '土'];
export const TRIGRAM_NATURE: readonly string[] = ['健', '悦', '丽', '动', '入', '陷', '止', '顺'];
export const PALACE_EIGHT: readonly string[] = ['乾', '坎', '艮', '震', '巽', '离', '坤', '兑'];

const BIT_TO_TRI_IDX: readonly number[] = [7, 3, 5, 1, 6, 2, 4, 0];

export function bitsToTrigramIdx(a: readonly boolean[]): number {
  const bits = (a[0] ? 4 : 0) + (a[1] ? 2 : 0) + (a[2] ? 1 : 0);
  return BIT_TO_TRI_IDX[bits] ?? 0;
}

export function lookupHexagram(lines: readonly boolean[]): { index: number; name: string; fullName: string; palace: string } {
  if (lines.length !== 6) throw new Error('lines must be 6');
  const key = lines.map(b => b ? '1' : '0').join('');
  for (let i = 0; i < RAW_LINES.length; i++) {
    if (RAW_LINES[i] === key) {
      return { index: i + 1, name: RAW_SHORT[i] || '', fullName: RAW_FULL[i] || '', palace: RAW_PALACE[i] || '' };
    }
  }
  throw new Error('hexagram not found');
}

export function getHexagramByIndex(index: number): {
  index: number; name: string; fullName: string; palace: string;
  upper: number; lower: number; element: string; nature: string;
  shiPosition: number; yingPosition: number; lines: boolean[];
} {
  if (index < 1 || index > 64) throw new Error('index out of range');
  const i = index - 1;
  const bits = RAW_LINES[i] || '';
  const lines: boolean[] = [];
  for (let j = 5; j >= 0; j--) lines.push(bits[j] === '1');
  const upperIdx = bitsToTrigramIdx([bits[0] === '1', bits[1] === '1', bits[2] === '1']);
  const lowerIdx = bitsToTrigramIdx([bits[3] === '1', bits[4] === '1', bits[5] === '1']);
  const sy = (RAW_SHI_YING[i] || '6-3').split('-');
  return {
    index, name: RAW_SHORT[i] || '', fullName: RAW_FULL[i] || '', palace: RAW_PALACE[i] || '',
    upper: upperIdx, lower: lowerIdx,
    element: TRIGRAM_ELEMENT[upperIdx] || '',
    nature: (TRIGRAM_NATURE[upperIdx] || '') + (TRIGRAM_NATURE[lowerIdx] || ''),
    shiPosition: parseInt(sy[0] || '6', 10),
    yingPosition: parseInt(sy[1] || '3', 10),
    lines
  };
}

export function findHexagramByTrigrams(upper: number, lower: number): number {
  if (upper < 0 || upper > 7 || lower < 0 || lower > 7) throw new Error('trigram out of range');
  const target = (TRIGRAM_BITS[upper] || '') + (TRIGRAM_BITS[lower] || '');
  for (let i = 0; i < RAW_LINES.length; i++) {
    if (RAW_LINES[i] === target) return i + 1;
  }
  throw new Error('hexagram not found');
}

export function changeLines(lines: readonly boolean[], moving: readonly number[]): boolean[] {
  const out = lines.slice();
  for (const m of moving) {
    if (m < 1 || m > 6) continue;
    out[m - 1] = !out[m - 1];
  }
  return out;
}
