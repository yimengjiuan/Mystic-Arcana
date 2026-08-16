/**
 * 历法工具模块
 * ------------------------------------------------------------------
 * 提供节气、干支（年月日时）推算及公历转农历等功能。
 * 干支纪年以立春为岁首，干支纪月以节气为分界。
 */
import { solarToLunar as lunarSolarToLunar } from '../data/lunar';

/** 二十四节气名称（按全年顺序，自小寒起） */
const JIEQI_NAMES = [
  '小寒', '大寒', '立春', '雨水', '惊蛰', '春分', '清明', '谷雨',
  '立夏', '小满', '芒种', '夏至', '小暑', '大暑', '立秋', '处暑',
  '白露', '秋分', '寒露', '霜降', '立冬', '小雪', '大雪', '冬至',
];

/** 天干 */
const TIANGAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
/** 地支 */
const DIZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

/**
 * 计算儒略日数（用于节气日期的中间运算）。
 * @param y - 年
 * @param m - 月
 * @param d - 日
 * @returns 儒略日数（带小数）
 */
function julianDay(y: number, m: number, d: number): number {
  let yy = y, mm = m;
  if (mm <= 2) { yy -= 1; mm += 12; }
  const A = Math.floor(yy / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (yy + 4716)) + Math.floor(30.6001 * (mm + 1)) + d + B - 1524.5;
}

/** 各节气在所在公历月内的近似日号常数（21 世纪，紫金山天文台简化公式 C 值） */
const TERM_BASE_DAY: Record<number, number> = {
  0: 5.4055, 1: 20.12, 2: 3.87, 3: 18.73, 4: 5.63, 5: 20.646,
  6: 4.81, 7: 20.1, 8: 5.52, 9: 21.04, 10: 5.678, 11: 21.37,
  12: 7.108, 13: 22.83, 14: 7.5, 15: 23.13, 16: 7.646, 17: 23.042,
  18: 8.318, 19: 23.438, 20: 7.438, 21: 22.36, 22: 7.18, 23: 21.94,
};

/** 节气索引 -> 所在公历月（0=小寒→1 月 ... 23=冬至→12 月） */
const TERM_MONTHS = [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12];

/**
 * 计算指定节气交节时刻的儒略日数（JDE，UT 基准）。
 * 采用紫金山天文台简化公式：交节日号 D = C + 0.2422×Y − L，
 * 其中 Y 为年份后两位，L 为闰年修正（1-2 月用 (Y−1)/4，3 月及以后用 Y/4）。
 * 该公式在 1901-2099 年范围内误差为分钟~小时级（官方标注 ≤1 天），
 * 个别交节时刻接近午夜的年份可能出现 ±1 天的日期偏差。
 * @param year - 公历年
 * @param termIndex - 节气索引（0=小寒, 1=大寒, ... 23=冬至）
 * @returns 儒略日数
 */
function solarTermJDE(year: number, termIndex: number): number {
  const Y = year % 100;
  const m0 = TERM_MONTHS[termIndex] || 1;
  // 1、2 月的节气发生在当年可能的闰日（2/29）之前，闰年修正用 (Y−1)/4
  const L = m0 <= 2 ? Math.floor((Y - 1) / 4) : Math.floor(Y / 4);
  const D = (TERM_BASE_DAY[termIndex] || 0) + 0.2422 * Y - L; // 月内日号（含小数，按北京时间）
  // 该月 1 日 0h（UT）的儒略日 + 月内偏移（D−1 天）− 8h（C 值日号按北京时间，回转为 UT）
  return julianDay(year, m0, 1) + (D - 1) - 8 / 24;
}

/**
 * 将儒略日（UT）转换为北京时间（UTC+8）的月/日/时/分。
 * @param jd - 儒略日数
 * @returns 北京时间的月、日、时、分
 */
function jdToBeijingParts(jd: number): { month: number; day: number; hour: number; minute: number } {
  const date = new Date((jd - 2440587.5) * 86400000 + 8 * 3600000);
  return { month: date.getUTCMonth() + 1, day: date.getUTCDate(), hour: date.getUTCHours(), minute: date.getUTCMinutes() };
}

/**
 * 计算均时差（Equation of Time，真太阳时 − 平太阳时，单位：分钟）。
 * 采用 Meeus《Astronomical Algorithms》第 27 章 Smart 近似公式（式 27.3），
 * 基于太阳平黄经 L0、平近点角 M 与轨道偏心率 e，误差约 ±1 分钟。
 * @param y - 公历年
 * @param m - 公历月
 * @param d - 公历日
 * @returns 均时差（分钟，可为负）
 */
export function equationOfTime(y: number, m: number, d: number): number {
  const DEG2RAD = Math.PI / 180;
  const T = (julianDay(y, m, d) - 2451545.0) / 36525; // 儒略世纪数（J2000.0 起算）
  const L0 = (280.4664567 + 36000.76982779 * T + 0.0003032028 * T * T) % 360; // 太阳平黄经（度）
  const M = (357.52911 + 35999.05029 * T - 0.0001537 * T * T) % 360; // 太阳平近点角（度）
  const e = 0.016708634 - 0.000042037 * T - 0.0000001267 * T * T; // 地球轨道偏心率
  const eps = 23.4392911 - 0.013004167 * T - 0.00000016389 * T * T + 0.0000005036 * T * T * T; // 黄赤交角（度）
  const yTan = Math.pow(Math.tan(eps / 2 * DEG2RAD), 2);
  const L0r = L0 * DEG2RAD;
  const Mr = M * DEG2RAD;
  // 式 27.3：E = y·sin2L0 − 2e·sinM + 4ey·sinM·cos2L0 − (y²/2)·sin4L0 − (5/4)e²·sin2M（弧度）
  const E = yTan * Math.sin(2 * L0r) - 2 * e * Math.sin(Mr)
    + 4 * e * yTan * Math.sin(Mr) * Math.cos(2 * L0r)
    - (yTan * yTan / 2) * Math.sin(4 * L0r)
    - (5 / 4) * e * e * Math.sin(2 * Mr);
  return E * (180 / Math.PI) * 4; // 弧度 -> 度 -> 分钟
}

/**
 * 将北京时间（钟表时）换算为真太阳时（小时，含小数）。
 * 公式：真太阳时 = 北京时间 + (经度−120°)×4 分钟 + 均时差(EoT)。
 * @param y - 公历年
 * @param m - 公历月
 * @param d - 公历日
 * @param hour - 钟表小时（0-23）
 * @param longitude - 出生地经度（东经，度）
 * @returns 真太阳时小时（含小数，可能超出 0-23 表示跨日）
 */
export function trueSolarHour(y: number, m: number, d: number, hour: number, longitude: number): number {
  return hour + (longitude - 120) * 4 / 60 + equationOfTime(y, m, d) / 60;
}

/**
 * 获取指定节气的公历日期。
 * @param year - 公历年
 * @param termIndex - 节气索引（0-23）
 * @returns 节气名称与日期
 */
export function getSolarTerm(year: number, termIndex: number) {
  return {
    name: JIEQI_NAMES[termIndex] || '',
    date: new Date((solarTermJDE(year, termIndex) - 2440587.5) * 86400000),
  };
}

/**
 * 根据公历日期确定干支纪年的年份（以立春交节时刻为界）。
 * 立春前属上一年，立春交节时刻（含）起属当年。
 * @param _y - 公历年
 * @param m - 公历月
 * @param d - 公历日
 * @param h - 小时（0-23，可选；缺省时立春当天按已交节处理，与旧版"当日归新年"一致）
 * @returns 以立春为界的干支年
 */
export function getSolarTermYear(_y: number, m: number, d: number, h?: number): number {
  const jq = jdToBeijingParts(solarTermJDE(_y, 2)); // 立春交节时刻（北京时间）
  if (m !== jq.month) return m > jq.month ? _y : _y - 1;
  if (d !== jq.day) return d > jq.day ? _y : _y - 1;
  // 立春当天：按分钟粒度与交节时刻比较（h 视为 h 时整点）
  if (h !== undefined) return h * 60 >= jq.hour * 60 + jq.minute ? _y : _y - 1;
  return _y;
}

/** 天干取值（循环索引） */
function stem(n: number): string {
  return TIANGAN[((n % 10) + 10) % 10] || '';
}

/** 地支取值（循环索引） */
function branch(n: number): string {
  return DIZHI[((n % 12) + 12) % 12] || '';
}

/**
 * 推算年柱干支。
 * @param solarTermYear - 以立春为界的年份
 * @returns 年柱干支（如"甲子"）
 */
export function yearGZ(solarTermYear: number): string {
  return stem(solarTermYear - 4) + branch(solarTermYear - 4);
}

/** 年干 -> 月干起始索引表（五虎遁元：甲己起丙寅） */
const MONTH_TIANGAN_START: Record<string, number> = {
  '甲': 2, '己': 2, '乙': 4, '庚': 4, '丙': 6, '辛': 6,
  '丁': 8, '壬': 8, '戊': 0, '癸': 0,
};

/**
 * 推算月柱干支。
 * @param yearGZStr - 年柱干支
 * @param solarMonth - 节气月序（1-12，以节为界）
 * @returns 月柱干支
 */
export function monthGZ(yearGZStr: string, solarMonth: number): string {
  const start = MONTH_TIANGAN_START[yearGZStr[0] || '甲'] || 0;
  return stem(start + solarMonth - 1) + branch(solarMonth + 1);
}

/** 日柱基准日：1949-10-01（甲子日），用于日柱循环推算 */
const BASE_DATE = new Date(1949, 9, 1).getTime();

/**
 * 推算日柱干支（基于 1949-10-01 甲子日循环）。
 * @param y - 公历年
 * @param m - 公历月
 * @param d - 公历日
 * @returns 日柱干支
 */
export function dayGZ(y: number, m: number, d: number): string {
  const days = Math.floor((new Date(y, m - 1, d).getTime() - BASE_DATE) / 86400000);
  return stem(days) + branch(days);
}

/** 日干 -> 时干起始索引表（五鼠遁元：甲己起甲子） */
const HOUR_TIANGAN_START: Record<string, number> = {
  '甲': 0, '己': 0, '乙': 2, '庚': 2, '丙': 4, '辛': 4,
  '丁': 6, '壬': 6, '戊': 8, '癸': 8,
};

/**
 * 推算时柱干支。
 * @param dayGZStr - 日柱干支
 * @param hour - 小时（0-23）
 * @returns 时柱信息（地支名、干支合字）
 */
export function hourGZ(dayGZStr: string, hour: number) {
  const start = HOUR_TIANGAN_START[dayGZStr[0] || '甲'] || 0;
  // 23 时和 0 时均属子时
  const hBranch = (hour === 23 || hour === 0) ? 0 : Math.floor((hour + 1) / 2);
  return { name: branch(hBranch), gz: stem(start + hBranch) + branch(hBranch) };
}

const AFTER_TERM = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const BEFORE_TERM = [11, 12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

/** 公历月 -> 该月内的「节」索引（月柱以「节」为界：1 月小寒、2 月立春、3 月惊蛰 ... 12 月大雪） */
const SOLAR_MONTH_TERM: Record<number, number> = { 1: 0, 2: 2, 3: 4, 4: 6, 5: 8, 6: 10, 7: 12, 8: 14, 9: 16, 10: 18, 11: 20, 12: 22 };

/**
 * 根据公历日期确定节气月序（1-12，以十二「节」交节时刻为界）。
 * 十二「节」：立春、惊蛰、清明、立夏、芒种、小暑、立秋、白露、寒露、立冬、大雪、小寒。
 * @param _y - 公历年
 * @param m - 公历月
 * @param d - 公历日
 * @param h - 小时（0-23，可选；缺省时交节当天按已交节处理，与旧版行为一致）
 * @returns 节气月序
 */
export function getSolarMonth(_y: number, m: number, d: number, h?: number): number {
  const jq = jdToBeijingParts(solarTermJDE(_y, SOLAR_MONTH_TERM[m] || 0)); // 本月「节」交节时刻（北京时间）
  const before = BEFORE_TERM[m - 1] || 1;
  const after = AFTER_TERM[m - 1] || 1;
  if (d !== jq.day) return d > jq.day ? after : before;
  // 交节当天：按分钟粒度与交节时刻比较（h 视为 h 时整点）
  if (h !== undefined) return h * 60 >= jq.hour * 60 + jq.minute ? after : before;
  return after;
}

/**
 * 公历转农历（委托至 data/lunar 模块）。
 * @param y - 公历年
 * @param m - 公历月
 * @param d - 公历日
 * @returns 农历日期
 */
export function solarToLunar(y: number, m: number, d: number) {
  return lunarSolarToLunar(y, m, d);
}
