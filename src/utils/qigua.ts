/**
 * 起卦方法模块
 * ------------------------------------------------------------------
 * 支持五种起卦方式：
 *   time   - 时间起卦（年月日时数取卦）
 *   number - 数字起卦（2-3 个数字取卦）
 *   meihua - 梅花易数（数字+时辰取动爻）
 *   zaobi  - 蓍草占卜（伪随机摇卦）
 *   cuanke - 铜钱摇卦（6 次背面数）
 */
import { modOrMax } from './parser';
import { findHexagramByTrigrams, TRIGRAMS } from '../data/hexagrams';
import { solarToLunar } from '../data/lunar';
import { TimeInput, QiGuaBasis } from '../types';

/**
 * 将小时转换为时辰序数（1-12）。
 * 23/0 时 -> 1（子时），1-2 时 -> 2（丑时），依此类推。
 */
function hourSeq(hour: number): number {
  return (hour === 23 || hour === 0) ? 1 : Math.floor((hour + 1) / 2) + 1;
}

/** 将农历年份转换为地支序数（1-12） */
function yearBranchSeq(lunarYear: number): number {
  return ((lunarYear - 4) % 12 + 12) % 12 + 1;
}

/** 从时间输入提取起卦用的四个数字（年支数、月数、日数、时辰数） */
function timeNumbers(input: TimeInput) {
  const lunar = solarToLunar(input.year, input.month, input.day);
  return {
    yearNum: yearBranchSeq(lunar.year),
    monthNum: lunar.month,
    dayNum: lunar.day,
    hourNum: hourSeq(input.hour),
  };
}

/**
 * 时间起卦法（梅花易数「卦以八除，爻以六除」）。
 * 上卦 = (年支数 + 月数 + 日数) % 8
 * 下卦 = (年支数 + 月数 + 日数 + 时辰数) % 8
 * 动爻 = (年支数 + 月数 + 日数 + 时辰数) % 6（不含秒数，同一时辰动爻一致）
 * 当 birth 存在时，可按 basis 叠加或替换生辰数据。
 */
export function timeQiGua(input: TimeInput, birth?: TimeInput, basis?: QiGuaBasis) {
  const a = timeNumbers(input);
  let yn = a.yearNum, mn = a.monthNum, dn = a.dayNum, hn = a.hourNum;

  // 生辰八字叠加逻辑
  if (birth) {
    const b = timeNumbers(birth);
    if (basis === 'bazi') {
      yn = b.yearNum; mn = b.monthNum; dn = b.dayNum; hn = b.hourNum;
    } else if (basis === 'time_bazi') {
      yn += b.yearNum; mn += b.monthNum; dn += b.dayNum; hn += b.hourNum;
    }
  }

  const total = yn + mn + dn;
  const upper = modOrMax(total, 8) - 1;
  const total2 = total + hn;
  const lower = modOrMax(total2, 8) - 1;
  const moveLine = modOrMax(total2, 6);
  return { upper, lower, moving: [moveLine] };
}

/**
 * 数字起卦法。
 * 上卦 = 第一个数 % 8，下卦 = 第二个数 % 8
 * 动爻 = 第三个数 % 6（若无第三数则两数之和 % 6）
 */
export function numberQiGua(nums: readonly number[]) {
  if (nums.length < 2) throw new Error('数字起卦需输入2-3个数');
  const n1 = nums[0] || 0, n2 = nums[1] || 0;
  const moveLine = nums.length >= 3 ? modOrMax(nums[2] || 0, 6) : modOrMax(n1 + n2, 6);
  return { upper: modOrMax(n1, 8) - 1, lower: modOrMax(n2, 8) - 1, moving: [moveLine] };
}

/**
 * 梅花易数起卦法。
 * 上卦 = 第一个数 % 8，下卦 = 第二个数 % 8
 * 动爻 = (第一个数 + 第二个数 + 时辰数) % 6
 */
export function meihuaQiGua(input: TimeInput, numberInput: readonly number[] = [], birth?: TimeInput, basis?: QiGuaBasis) {
  if (numberInput.length < 2) throw new Error('梅花易数需输入2个数');
  const n1 = numberInput[0], n2 = numberInput[1];
  let hourNum = hourSeq(input.hour);
  if (birth) {
    if (basis === 'bazi') hourNum = hourSeq(birth.hour);
    else if (basis === 'time_bazi') hourNum += hourSeq(birth.hour);
  }
  return { upper: modOrMax(n1, 8) - 1, lower: modOrMax(n2, 8) - 1, moving: [modOrMax(n1 + n2 + hourNum, 6)] };
}

/**
 * 蓍草占卜起卦法（模拟大衍筮法）。
 * 以时间戳+种子生成 6 爻，四象概率符合大衍筮法标准分布：
 * 老阴 1/16、少阳 5/16、少阴 7/16、老阳 3/16（老阴/老阳为动爻，共 1/4；少阴/少阳为静爻）。
 */
export function zaobiQiGua(input: TimeInput, seed: number = 0, birth?: TimeInput, basis?: QiGuaBasis) {
  let base = input.year * 10000 + input.month * 100 + input.day + input.hour;
  if (birth) {
    const bb = birth.year * 10000 + birth.month * 100 + birth.day + birth.hour;
    if (basis === 'bazi') base = bb;
    else if (basis === 'time_bazi') base += bb;
  }
  // 32 位线性同余生成器（Math.imul 保证无精度损失），由 (base + seed) 派生确定性随机序列
  let state = (Math.imul((base + seed) | 0, 1664525) + 1013904223) | 0;
  const lines: boolean[] = [];
  const moving: number[] = [];
  for (let i = 0; i < 6; i++) {
    state = (Math.imul(state, 1103515245) + 12345) | 0;
    const r = (state >>> 28) & 15;
    if (r === 0) { lines.push(false); moving.push(i + 1); }    // 老阴 1/16（动）
    else if (r < 4) { lines.push(true); moving.push(i + 1); }  // 老阳 3/16（动）
    else if (r < 9) lines.push(true);                          // 少阳 5/16（静）
    else lines.push(false);                                    // 少阴 7/16（静）
  }
  return { lines, moving };
}

/**
 * 铜钱摇卦法。
 * @param throws - 6 次摇卦结果（0=老阴动, 1=少阳, 2=少阴, 3=老阳动）
 */
export function cuankeQiGua(throws: readonly number[]) {
  if (throws.length !== 6) throw new Error('铜钱摇卦需输入6次结果');
  const lines: boolean[] = [];
  const moving: number[] = [];
  for (let i = 0; i < 6; i++) {
    if (throws[i] === 0) { lines.push(false); moving.push(i + 1); }       // 老阴动
    else if (throws[i] === 3) { lines.push(true); moving.push(i + 1); }  // 老阳动
    else lines.push(throws[i] === 1);                                     // 少阳/少阴
  }
  return { lines, moving };
}

/**
 * 起卦调度器：根据方法名分发到对应起卦函数，统一返回卦象索引、上下卦、动爻、爻线。
 * @param method - 起卦方法
 * @param input - 时间输入
 * @param numberInput - 数字/铜钱输入
 * @param extra - 附加参数（造币种子）
 * @param birth - 生辰（可选）
 * @param basis - 起卦依据
 */
export function dispatchQigua(
  method: 'time' | 'number' | 'meihua' | 'zaobi' | 'cuanke',
  input: TimeInput,
  numberInput: readonly number[] = [],
  extra: number = 0,
  birth?: TimeInput,
  basis?: QiGuaBasis,
) {
  if (method === 'time') {
    const r = timeQiGua(input, birth, basis);
    return { ...r, hexIndex: findHexagramByTrigrams(r.upper, r.lower), lines: [] };
  }
  if (method === 'number') {
    const r = numberQiGua(numberInput);
    return { ...r, hexIndex: findHexagramByTrigrams(r.upper, r.lower), lines: [] };
  }
  if (method === 'meihua') {
    const r = meihuaQiGua(input, numberInput, birth, basis);
    return { ...r, hexIndex: findHexagramByTrigrams(r.upper, r.lower), lines: [] };
  }
  if (method === 'zaobi') {
    const r = zaobiQiGua(input, extra, birth, basis);
    const upper = bitsToTrigram([r.lines[5] ?? false, r.lines[4] ?? false, r.lines[3] ?? false]);
    const lower = bitsToTrigram([r.lines[2] ?? false, r.lines[1] ?? false, r.lines[0] ?? false]);
    return { upper, lower, hexIndex: findHexagramByTrigrams(upper, lower), moving: r.moving, lines: r.lines };
  }
  // method === 'cuanke'
  const r = cuankeQiGua(numberInput);
  const upper = bitsToTrigram([r.lines[5] ?? false, r.lines[4] ?? false, r.lines[3] ?? false]);
  const lower = bitsToTrigram([r.lines[2] ?? false, r.lines[1] ?? false, r.lines[0] ?? false]);
  return { upper, lower, hexIndex: findHexagramByTrigrams(upper, lower), moving: r.moving, lines: r.lines };
}

/**
 * 将三爻布尔数组（自下而上）转换为八卦索引。
 * 与 hexagrams.bitsToTrigramIdx 同逻辑，输入顺序为 [初爻, 中爻, 上爻]。
 */
function bitsToTrigram(a: readonly boolean[]): number {
  const bits = (a[0] ? 4 : 0) + (a[1] ? 2 : 0) + (a[2] ? 1 : 0);
  return [7, 3, 5, 1, 6, 2, 4, 0][bits] ?? 0;
}

/** 获取八卦名称 */
export function trigramName(idx: number): string {
  return TRIGRAMS[idx] || '';
}
