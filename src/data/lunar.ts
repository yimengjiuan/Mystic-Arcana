/**
 * 农历转换模块
 * ------------------------------------------------------------------
 * 基于寿星天文历简化算法，将公历日期转换为农历日期。
 * 数据范围：1900-2049 年。
 */

/**
 * 农历信息数据表（1900-2049），每项为 5 位十六进制编码：
 *   bit15-bit4  : 1-12 月大小（1=30天, 0=29天）
 *   bit0-bit3   : 闰月月份（0 表示无闰月）
 *   bit16       : 闰月大小（1=30天, 0=29天）
 */
const LUNAR_DATA = [
  '04bd8', '04ae0', '0a570', '054d5', '0d260', '0d950', '16554', '056a0', '09ad0', '055d2',
  '04ae0', '0a5b6', '0a4d0', '0d250', '1d255', '0b540', '0d6a0', '0ada2', '095b0', '14977',
  '04970', '0a4b0', '0b4b5', '06a50', '06d40', '1ab54', '02b60', '09570', '052f2', '04970',
  '06566', '0d4a0', '0ea50', '06e95', '05ad0', '02b60', '186e3', '092e0', '1c8d7', '0c950',
  '0d4a0', '1d8a6', '0b550', '056a0', '1a5b4', '025d0', '092d0', '0d2b2', '0a950', '0b557',
  '06ca0', '0b550', '15355', '04da0', '0a5b0', '14573', '052b0', '0a9a8', '0e950', '06aa0',
  '0aea6', '0ab50', '04b60', '0aae4', '0a570', '05260', '0f263', '0d950', '05b57', '056a0',
  '096d0', '04dd5', '04ad0', '0a4d0', '0d4d4', '0d250', '0d558', '0b540', '0b6a0', '195a6',
  '095b0', '049b0', '0a974', '0a4b0', '0b27a', '06a50', '06d40', '0af46', '0ab60', '09570',
  '04af5', '04970', '04970', '074a3', '0ea50', '06b58', '055c0', '0ab60', '096d5', '092e0',
  '0c960', '0d954', '0d4a0', '0da50', '07552', '056a0', '0abb7', '025d0', '092d0', '0cab5',
  '0a950', '0b4a0', '0baa4', '0ad50', '055d9', '04ba0', '0a5b0', '15176', '052b0', '0a930',
  '07954', '06aa0', '0ad50', '05b52', '04b60', '0a6e6', '0a4e0', '0d260', '0ea65', '0d530',
  '05aa0', '076a3', '096d0', '04afb', '04ad0', '0a4d0', '1d0b6', '0d250', '0d520', '0dd45',
  '0b5a0', '056d0', '055b2', '049b0', '0a577', '0a4b0', '0aa50', '1b255', '06d20', '0ada0',
];

/** 农历基准日期：1900-01-31（正月初一） */
const LUNAR_BASE = new Date(1900, 0, 31).getTime();

/** 获取指定年份的农历信息编码 */
function getLunarData(year: number): number {
  return parseInt(LUNAR_DATA[year - 1900] || '0', 16) || 0;
}

/** 闰月月份（0 表示该年无闰月） */
function leapMonth(year: number): number {
  return getLunarData(year) & 0xf;
}

/** 闰月天数（29 或 30，无闰月则返回 0） */
function leapDays(year: number): number {
  return leapMonth(year) === 0 ? 0 : (getLunarData(year) & 0x10000 ? 30 : 29);
}

/** 某月天数（29 或 30） */
function monthDays(year: number, month: number): number {
  return (getLunarData(year) & (0x10000 >> month)) ? 30 : 29;
}

/** 农历全年天数（含闰月） */
function lunarYearDays(year: number): number {
  let days = 348; // 12 × 29 = 348（基础天数）
  for (let i = 4; i <= 15; i++) days += (getLunarData(year) >> i) & 1;
  return days + leapDays(year);
}

/**
 * 公历转农历。
 * @param y - 公历年
 * @param m - 公历月（1-12）
 * @param d - 公历日
 * @returns 农历日期（年、月、日、是否闰月）
 */
export function solarToLunar(y: number, m: number, d: number) {
  let offset = Math.floor((new Date(y, m - 1, d).getTime() - LUNAR_BASE) / 86400000);
  if (offset < 0) return { year: 1900, month: 1, day: 1, isLeap: false };

  // 逐年扣减天数，定位农历年份
  let lunarYear = 1900;
  while (lunarYear < 2050 && offset >= lunarYearDays(lunarYear)) {
    offset -= lunarYearDays(lunarYear);
    lunarYear++;
  }

  const leap = leapMonth(lunarYear);
  let lunarMonth = 1;
  let isLeap = false;

  // 逐月扣减天数，定位农历月份
  while (lunarMonth <= 12) {
    const days = isLeap ? leapDays(lunarYear) : monthDays(lunarYear, lunarMonth);
    if (offset < days) break;
    offset -= days;
    if (lunarMonth === leap && !isLeap) {
      isLeap = true; // 进入闰月
    } else {
      isLeap = false;
      lunarMonth++;
    }
  }

  return { year: lunarYear, month: lunarMonth, day: offset + 1, isLeap };
}
