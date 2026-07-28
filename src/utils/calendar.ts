// 寿星万年历核心算法
import { solarToLunar as lunarSolarToLunar } from '../data/lunar';

const JIEQI_NAMES: readonly string[] = [
  '小寒','大寒','立春','雨水','惊蛰','春分','清明','谷雨',
  '立夏','小满','芒种','夏至','小暑','大暑','立秋','处暑',
  '白露','秋分','寒露','霜降',
  '立冬','小雪','大雪','冬至'
];

function julianDay(y: number, m: number, d: number): number {
  let yy = y, mm = m;
  if (mm <= 2) { yy -= 1; mm += 12; }
  const A = Math.floor(yy / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (yy + 4716)) + Math.floor(30.6001 * (mm + 1)) + d + B - 1524.5;
}

function solarTermJDE(year: number, termIndex: number): number {
  const y = year + (termIndex < 3 ? 0 : 1);
  const Y = y % 100;
  const baseDay: Record<number, number> = {
    0: 5.4055, 1: 20.12, 2: 3.87, 3: 18.73, 4: 5.63, 5: 20.646,
    6: 4.81, 7: 20.1, 8: 5.52, 9: 21.04, 10: 5.678, 11: 21.37,
    12: 7.108, 13: 22.83, 14: 7.5, 15: 23.13, 16: 7.646, 17: 23.042,
    18: 8.318, 19: 23.438, 20: 7.438, 21: 22.36, 22: 7.18, 23: 21.94
  };
  const L = Math.floor((y - 1900) / 4);
  const correction = (termIndex % 2 === 0)
    ? (termIndex === 0 || termIndex === 12 || termIndex === 16 || termIndex === 20 ? -1 : 0)
    : 0;
  let D = (baseDay[termIndex] || 0) + 0.2422 * Y - L + correction;
  if (termIndex === 2) D = 4.475 + 0.2422 * Y - Math.floor(Y / 4);
  return julianDay(y, 1, 1) + D - 1;
}

export function getSolarTerm(year: number, termIndex: number): { name: string; date: Date } {
  const jde = solarTermJDE(year, termIndex);
  const ms = (jde - 2440587.5) * 86400000;
  return { name: JIEQI_NAMES[termIndex] || '', date: new Date(ms) };
}

export function getSolarTermYear(_y: number, m: number, d: number): number {
  if (m > 2 || (m === 2 && d >= 4)) return _y;
  return _y - 1;
}

const TIANGAN: readonly string[] = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
const DIZHI: readonly string[] = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];

function stem(n: number): string { return TIANGAN[((n % 10) + 10) % 10] || ''; }
function branch(n: number): string { return DIZHI[((n % 12) + 12) % 12] || ''; }

export function yearGZ(solarTermYear: number): string {
  return stem(solarTermYear - 4) + branch(solarTermYear - 4);
}

const MONTH_TIANGAN_START: Record<string, number> = {
  '甲': 2, '己': 2, '乙': 4, '庚': 4, '丙': 6, '辛': 6,
  '丁': 8, '壬': 8, '戊': 0, '癸': 0
};
export function monthGZ(yearGZStr: string, solarMonth: number): string {
  const yearGan = yearGZStr[0] || '甲';
  const start = MONTH_TIANGAN_START[yearGan] || 0;
  const offset = start + (solarMonth - 1);
  return stem(offset) + branch(solarMonth + 1);
}

const BASE_DATE = new Date(1949, 9, 1).getTime();

export function dayGZ(y: number, m: number, d: number): string {
  const target = new Date(y, m - 1, d).getTime();
  const days = Math.floor((target - BASE_DATE) / 86400000);
  return stem(days) + branch(days);
}

const HOUR_TIANGAN_START: Record<string, number> = {
  '甲': 0, '己': 0, '乙': 2, '庚': 2, '丙': 4, '辛': 4,
  '丁': 6, '壬': 6, '戊': 8, '癸': 8
};

export function hourGZ(dayGZStr: string, hour: number): { name: string; gz: string } {
  const dayGan = dayGZStr[0] || '甲';
  const start = HOUR_TIANGAN_START[dayGan] || 0;
  let hBranch = 0;
  if (hour === 23 || hour === 0) hBranch = 0;
  else hBranch = Math.floor((hour + 1) / 2);
  const gz = stem(start + hBranch) + branch(hBranch);
  return { name: branch(hBranch), gz };
}

export function getSolarMonth(_y: number, m: number, d: number): number {
  const termDays: readonly number[] = [6, 4, 6, 5, 6, 6, 7, 8, 8, 8, 7, 7];
  const afterTerm: readonly number[] = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const beforeTerm: readonly number[] = [11, 12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const termDay = termDays[m - 1] || 1;
  if (d < termDay) return beforeTerm[m - 1] || 1;
  return afterTerm[m - 1] || 1;
}

export function solarToLunar(y: number, m: number, d: number): { year: number; month: number; day: number; isLeap: boolean } {
  return lunarSolarToLunar(y, m, d);
}
