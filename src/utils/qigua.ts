import { modOrMax } from './parser';
import { findHexagramByTrigrams, TRIGRAMS } from '../data/hexagrams';
import { solarToLunar } from '../data/lunar';
import { TimeInput, QiGuaBasis } from '../types';
function hourSeq(hour: number): number { return (hour === 23 || hour === 0) ? 1 : Math.floor((hour + 1) / 2) + 1; }
function yearBranchSeq(lunarYear: number): number { return ((lunarYear - 4) % 12 + 12) % 12 + 1; }
function timeNumbers(input: TimeInput) { const lunar = solarToLunar(input.year, input.month, input.day); return { yearNum: yearBranchSeq(lunar.year), monthNum: lunar.month, dayNum: lunar.day, hourNum: hourSeq(input.hour) }; }
export function timeQiGua(input: TimeInput, birth?: TimeInput, basis?: QiGuaBasis) {
  const a = timeNumbers(input); let yn = a.yearNum, mn = a.monthNum, dn = a.dayNum, hn = a.hourNum;
  if (birth) { const b = timeNumbers(birth); if (basis === 'bazi') { yn = b.yearNum; mn = b.monthNum; dn = b.dayNum; hn = b.hourNum; } else if (basis === 'time_bazi') { yn += b.yearNum; mn += b.monthNum; dn += b.dayNum; hn += b.hourNum; } }
  const total = yn + mn + dn, upper = modOrMax(total, 8) - 1, total2 = total + hn, lower = modOrMax(total2, 8) - 1, moveLine = modOrMax(total2, 6);
  return { upper, lower, moving: [moveLine] };
}
export function numberQiGua(nums: readonly number[]) {
  if (nums.length < 2) throw new Error('数字起卦需输入2-3个数');
  const n1 = nums[0] || 0, n2 = nums[1] || 0;
  return { upper: modOrMax(n1, 8) - 1, lower: modOrMax(n2, 8) - 1, moving: [nums.length >= 3 ? modOrMax(nums[2] || 0, 6) : modOrMax(n1 + n2, 6)] };
}
export function meihuaQiGua(input: TimeInput, numberInput: readonly number[] = [], birth?: TimeInput, basis?: QiGuaBasis) {
  if (numberInput.length < 2) throw new Error('梅花易数需输入2个数');
  const n1 = numberInput[0], n2 = numberInput[1];
  let hourNum = hourSeq(input.hour);
  if (birth) { if (basis === 'bazi') hourNum = hourSeq(birth.hour); else if (basis === 'time_bazi') hourNum += hourSeq(birth.hour); }
  return { upper: modOrMax(n1, 8) - 1, lower: modOrMax(n2, 8) - 1, moving: [modOrMax(n1 + n2 + hourNum, 6)] };
}
export function zaobiQiGua(input: TimeInput, seed: number = 0, birth?: TimeInput, basis?: QiGuaBasis) {
  let base = input.year * 10000 + input.month * 100 + input.day + input.hour;
  if (birth) { const bb = birth.year * 10000 + birth.month * 100 + birth.day + birth.hour; if (basis === 'bazi') base = bb; else if (basis === 'time_bazi') base += bb; }
  const total = base + seed, lines: boolean[] = [], moving: number[] = [];
  for (let i = 0; i < 6; i++) { const hash = ((total * (i + 7) * 1103515245 + 12345) >>> 0) % 1000; lines.push((hash % 4) !== 0); if ((hash % 16) === 0) moving.push(i + 1); }
  return { lines, moving };
}
export function cuankeQiGua(throws: readonly number[]) {
  if (throws.length !== 6) throw new Error('铜钱摇卦需输入6次结果');
  const lines: boolean[] = [], moving: number[] = [];
  for (let i = 0; i < 6; i++) { if (throws[i] === 0) { lines.push(false); moving.push(i + 1); } else if (throws[i] === 3) { lines.push(true); moving.push(i + 1); } else lines.push(throws[i] === 1); }
  return { lines, moving };
}
export function dispatchQigua(method: 'time' | 'number' | 'meihua' | 'zaobi' | 'cuanke', input: TimeInput, numberInput: readonly number[] = [], extra: number = 0, birth?: TimeInput, basis?: QiGuaBasis) {
  if (method === 'time') { const r = timeQiGua(input, birth, basis); return { ...r, hexIndex: findHexagramByTrigrams(r.upper, r.lower), lines: [] }; }
  if (method === 'number') { const r = numberQiGua(numberInput); return { ...r, hexIndex: findHexagramByTrigrams(r.upper, r.lower), lines: [] }; }
  if (method === 'meihua') { const r = meihuaQiGua(input, numberInput, birth, basis); return { ...r, hexIndex: findHexagramByTrigrams(r.upper, r.lower), lines: [] }; }
  if (method === 'zaobi') { const r = zaobiQiGua(input, extra, birth, basis); const upper = bitsToTrigram([r.lines[5] ?? false, r.lines[4] ?? false, r.lines[3] ?? false]); const lower = bitsToTrigram([r.lines[2] ?? false, r.lines[1] ?? false, r.lines[0] ?? false]); return { upper, lower, hexIndex: findHexagramByTrigrams(upper, lower), moving: r.moving, lines: r.lines }; }
  const r = cuankeQiGua(numberInput); const upper = bitsToTrigram([r.lines[5] ?? false, r.lines[4] ?? false, r.lines[3] ?? false]); const lower = bitsToTrigram([r.lines[2] ?? false, r.lines[1] ?? false, r.lines[0] ?? false]); return { upper, lower, hexIndex: findHexagramByTrigrams(upper, lower), moving: r.moving, lines: r.lines };
}
function bitsToTrigram(a: readonly boolean[]): number { const bits = (a[0] ? 4 : 0) + (a[1] ? 2 : 0) + (a[2] ? 1 : 0); return [7, 3, 5, 1, 6, 2, 4, 0][bits] ?? 0; }
export function trigramName(idx: number): string { return TRIGRAMS[idx] || ''; }
