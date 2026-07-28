/**
 * 历法工具模块
 * ------------------------------------------------------------------
 * 提供节气、干支（年月日时）推算及公历转农历等功能。
 * 干支纪年以立春为岁首，干支纪月以节气为分界。
 */
import { solarToLunar as lunarSolarToLunar } from '../data/lunar.js';
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
function julianDay(y, m, d) {
    let yy = y, mm = m;
    if (mm <= 2) {
        yy -= 1;
        mm += 12;
    }
    const A = Math.floor(yy / 100);
    const B = 2 - A + Math.floor(A / 4);
    return Math.floor(365.25 * (yy + 4716)) + Math.floor(30.6001 * (mm + 1)) + d + B - 1524.5;
}
/**
 * 计算指定节气的儒略历力学时日期（JDE）。
 * @param year - 公历年
 * @param termIndex - 节气索引（0=小寒, 1=大寒, ... 23=冬至）
 * @returns 儒略日数
 */
function solarTermJDE(year, termIndex) {
    const y = year + (termIndex < 3 ? 0 : 1);
    const Y = y % 100;
    // 各节气在当年 1 月 1 日后的近似天数
    const baseDay = {
        0: 5.4055, 1: 20.12, 2: 3.87, 3: 18.73, 4: 5.63, 5: 20.646,
        6: 4.81, 7: 20.1, 8: 5.52, 9: 21.04, 10: 5.678, 11: 21.37,
        12: 7.108, 13: 22.83, 14: 7.5, 15: 23.13, 16: 7.646, 17: 23.042,
        18: 8.318, 19: 23.438, 20: 7.438, 21: 22.36, 22: 7.18, 23: 21.94,
    };
    const L = Math.floor((y - 1900) / 4);
    const correction = (termIndex % 2 === 0) ? ([0, 12, 16, 20].includes(termIndex) ? -1 : 0) : 0;
    let D = (baseDay[termIndex] || 0) + 0.2422 * Y - L + correction;
    // 立春特殊修正
    if (termIndex === 2)
        D = 4.475 + 0.2422 * Y - Math.floor(Y / 4);
    return julianDay(y, 1, 1) + D - 1;
}
/**
 * 获取指定节气的公历日期。
 * @param year - 公历年
 * @param termIndex - 节气索引（0-23）
 * @returns 节气名称与日期
 */
export function getSolarTerm(year, termIndex) {
    return {
        name: JIEQI_NAMES[termIndex] || '',
        date: new Date((solarTermJDE(year, termIndex) - 2440587.5) * 86400000),
    };
}
/**
 * 根据公历日期确定干支纪年的年份（以立春为界）。
 * 立春（约 2 月 4 日）前属上一年。
 */
export function getSolarTermYear(_y, m, d) {
    return (m > 2 || (m === 2 && d >= 4)) ? _y : _y - 1;
}
/** 天干取值（循环索引） */
function stem(n) {
    return TIANGAN[((n % 10) + 10) % 10] || '';
}
/** 地支取值（循环索引） */
function branch(n) {
    return DIZHI[((n % 12) + 12) % 12] || '';
}
/**
 * 推算年柱干支。
 * @param solarTermYear - 以立春为界的年份
 * @returns 年柱干支（如"甲子"）
 */
export function yearGZ(solarTermYear) {
    return stem(solarTermYear - 4) + branch(solarTermYear - 4);
}
/** 年干 -> 月干起始索引表（五虎遁元：甲己起丙寅） */
const MONTH_TIANGAN_START = {
    '甲': 2, '己': 2, '乙': 4, '庚': 4, '丙': 6, '辛': 6,
    '丁': 8, '壬': 8, '戊': 0, '癸': 0,
};
/**
 * 推算月柱干支。
 * @param yearGZStr - 年柱干支
 * @param solarMonth - 节气月序（1-12，以节为界）
 * @returns 月柱干支
 */
export function monthGZ(yearGZStr, solarMonth) {
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
export function dayGZ(y, m, d) {
    const days = Math.floor((new Date(y, m - 1, d).getTime() - BASE_DATE) / 86400000);
    return stem(days) + branch(days);
}
/** 日干 -> 时干起始索引表（五鼠遁元：甲己起甲子） */
const HOUR_TIANGAN_START = {
    '甲': 0, '己': 0, '乙': 2, '庚': 2, '丙': 4, '辛': 4,
    '丁': 6, '壬': 6, '戊': 8, '癸': 8,
};
/**
 * 推算时柱干支。
 * @param dayGZStr - 日柱干支
 * @param hour - 小时（0-23）
 * @returns 时柱信息（地支名、干支合字）
 */
export function hourGZ(dayGZStr, hour) {
    const start = HOUR_TIANGAN_START[dayGZStr[0] || '甲'] || 0;
    // 23 时和 0 时均属子时
    const hBranch = (hour === 23 || hour === 0) ? 0 : Math.floor((hour + 1) / 2);
    return { name: branch(hBranch), gz: stem(start + hBranch) + branch(hBranch) };
}
/** 各月节气近似日（用于判断是否已过节气分界） */
const TERM_DAYS = [6, 4, 6, 5, 6, 6, 7, 8, 8, 8, 7, 7];
const AFTER_TERM = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const BEFORE_TERM = [11, 12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
/**
 * 根据公历日期确定节气月序（1-12，以节为界）。
 * @param _y - 公历年（未使用，保留接口）
 * @param m - 公历月
 * @param d - 公历日
 * @returns 节气月序
 */
export function getSolarMonth(_y, m, d) {
    return d < (TERM_DAYS[m - 1] || 1) ? (BEFORE_TERM[m - 1] || 1) : (AFTER_TERM[m - 1] || 1);
}
/**
 * 公历转农历（委托至 data/lunar 模块）。
 * @param y - 公历年
 * @param m - 公历月
 * @param d - 公历日
 * @returns 农历日期
 */
export function solarToLunar(y, m, d) {
    return lunarSolarToLunar(y, m, d);
}
