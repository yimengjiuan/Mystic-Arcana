// 5种起卦方法
import { modOrMax } from './parser';
import { findHexagramByTrigrams, TRIGRAMS } from '../data/hexagrams';
import { solarToLunar } from '../data/lunar';
import { TimeInput, QiGuaBasis } from '../types';

function hourSeq(hour: number): number {
  if (hour === 23 || hour === 0) return 1;
  return Math.floor((hour + 1) / 2) + 1;
}

function yearBranchSeq(lunarYear: number): number {
  const branchIdx = (lunarYear - 4) % 12;
  return ((branchIdx % 12) + 12) % 12 + 1;
}

function timeNumbers(input: TimeInput): { yearNum: number; monthNum: number; dayNum: number; hourNum: number } {
  const lunar = solarToLunar(input.year, input.month, input.day);
  return {
    yearNum: yearBranchSeq(lunar.year),
    monthNum: lunar.month,
    dayNum: lunar.day,
    hourNum: hourSeq(input.hour)
  };
}

export function timeQiGua(
  input: TimeInput,
  birth?: TimeInput,
  basis?: QiGuaBasis
): { upper: number; lower: number; moving: number[] } {
  const a = timeNumbers(input);
  let yn = a.yearNum, mn = a.monthNum, dn = a.dayNum, hn = a.hourNum;
  if (birth) {
    const b = timeNumbers(birth);
    if (basis === 'bazi') { yn = b.yearNum; mn = b.monthNum; dn = b.dayNum; hn = b.hourNum; }
    else if (basis === 'time_bazi') { yn += b.yearNum; mn += b.monthNum; dn += b.dayNum; hn += b.hourNum; }
  }
  const total = yn + mn + dn;
  const upper = modOrMax(total, 8) - 1;
  const total2 = total + hn;
  const lower = modOrMax(total2, 8) - 1;
  const moveLine = modOrMax(total2, 6);
  return { upper, lower, moving: [moveLine] };
}

export function numberQiGua(nums: readonly number[]): { upper: number; lower: number; moving: number[] } {
  if (nums.length < 2) throw new Error('数字起卦需输入2-3个数');
  const n1 = nums[0] || 0;
  const n2 = nums[1] || 0;
  const upper = modOrMax(n1, 8) - 1;
  const lower = modOrMax(n2, 8) - 1;
  const moveLine = nums.length >= 3
    ? modOrMax(nums[2] || 0, 6)
    : modOrMax(n1 + n2, 6);
  return { upper, lower, moving: [moveLine] };
}

export function meihuaQiGua(
  input: TimeInput,
  numberInput: readonly number[] = [],
  birth?: TimeInput,
  basis?: QiGuaBasis
): { upper: number; lower: number; moving: number[] } {
  if (numberInput.length < 2) throw new Error('梅花易数需输入2个数');
  const n1 = numberInput[0];
  const n2 = numberInput[1];
  const upper = modOrMax(n1, 8) - 1;
  const lower = modOrMax(n2, 8) - 1;
  let hourNum = hourSeq(input.hour);
  if (birth) {
    if (basis === 'bazi') hourNum = hourSeq(birth.hour);
    else if (basis === 'time_bazi') hourNum += hourSeq(birth.hour);
  }
  const moveLine = modOrMax(n1 + n2 + hourNum, 6);
  return { upper, lower, moving: [moveLine] };
}

export function zaobiQiGua(
  input: TimeInput,
  seed: number = 0,
  birth?: TimeInput,
  basis?: QiGuaBasis
): { lines: boolean[]; moving: number[] } {
  const lines: boolean[] = [];
  const moving: number[] = [];
  let base = input.year * 10000 + input.month * 100 + input.day + input.hour;
  if (birth) {
    const bb = birth.year * 10000 + birth.month * 100 + birth.day + birth.hour;
    if (basis === 'bazi') base = bb;
    else if (basis === 'time_bazi') base += bb;
  }
  const total = base + seed;
  for (let i = 0; i < 6; i++) {
    const hash = ((total * (i + 7) * 1103515245 + 12345) >>> 0) % 1000;
    const isYang = (hash % 4) !== 0;
    const isOld = (hash % 16) === 0;
    lines.push(isYang);
    if (isOld) moving.push(i + 1);
  }
  return { lines, moving };
}

export function cuankeQiGua(throws: readonly number[]): { lines: boolean[]; moving: number[] } {
  if (throws.length !== 6) throw new Error('铜钱摇卦需输入6次结果');
  const lines: boolean[] = [];
  const moving: number[] = [];
  for (let i = 0; i < 6; i++) {
    const backs = throws[i];
    if (backs === 0) { lines.push(false); moving.push(i + 1); }
    else if (backs === 1) { lines.push(true); }
    else if (backs === 2) { lines.push(false); }
    else { lines.push(true); moving.push(i + 1); }
  }
  return { lines, moving };
}

export function dispatchQigua(
  method: 'time' | 'number' | 'meihua' | 'zaobi' | 'cuanke',
  input: TimeInput,
  numberInput: readonly number[] = [],
  extra: number = 0,
  birth?: TimeInput,
  basis?: QiGuaBasis
): { upper: number; lower: number; hexIndex: number; moving: number[]; lines: boolean[] } {
  if (method === 'time') {
    const r = timeQiGua(input, birth, basis);
    return { ...r, hexIndex: findHexagramByTrigrams(r.upper, r.lower), lines: [] };
  } else if (method === 'number') {
    const r = numberQiGua(numberInput);
    return { ...r, hexIndex: findHexagramByTrigrams(r.upper, r.lower), lines: [] };
  } else if (method === 'meihua') {
    const r = meihuaQiGua(input, numberInput, birth, basis);
    return { ...r, hexIndex: findHexagramByTrigrams(r.upper, r.lower), lines: [] };
  } else if (method === 'zaobi') {
    const r = zaobiQiGua(input, extra, birth, basis);
    const upper = bitsToTrigram([(r.lines[5] ?? false), (r.lines[4] ?? false), (r.lines[3] ?? false)]);
    const lower = bitsToTrigram([(r.lines[2] ?? false), (r.lines[1] ?? false), (r.lines[0] ?? false)]);
    return { upper, lower, hexIndex: findHexagramByTrigrams(upper, lower), moving: r.moving, lines: r.lines };
  } else {
    if (numberInput.length < 6) throw new Error('铜钱摇卦需输入6次结果');
    const r = cuankeQiGua(numberInput);
    const upper = bitsToTrigram([(r.lines[5] ?? false), (r.lines[4] ?? false), (r.lines[3] ?? false)]);
    const lower = bitsToTrigram([(r.lines[2] ?? false), (r.lines[1] ?? false), (r.lines[0] ?? false)]);
    return { upper, lower, hexIndex: findHexagramByTrigrams(upper, lower), moving: r.moving, lines: r.lines };
  }
}

function bitsToTrigram(a: readonly boolean[]): number {
  const bits = (a[0] ? 4 : 0) + (a[1] ? 2 : 0) + (a[2] ? 1 : 0);
  const BIT_TO_IDX: readonly number[] = [7, 3, 5, 1, 6, 2, 4, 0];
  return BIT_TO_IDX[bits] ?? 0;
}

export function trigramName(idx: number): string {
  return TRIGRAMS[idx] || '';
}
