/**
 * 卦象解析工具模块
 * ------------------------------------------------------------------
 * 提供五行、六亲推算，四柱构建，六爻爻线构建，以及变卦/互卦索引查找。
 */
import { getHexagramByIndex, findHexagramByTrigrams, bitsToTrigramIdx, TRIGRAMS } from '../data/hexagrams.js';
import { getNajia, parseNajia, hourToDizhi } from '../data/najia.js';
import { yearGZ, monthGZ, dayGZ, hourGZ, getSolarMonth, getSolarTermYear, solarToLunar } from './calendar.js';
/** 天干地支 -> 五行映射表 */
const WUXING_MAP = {
    '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土', '己': '土',
    '庚': '金', '辛': '金', '壬': '水', '癸': '水',
    '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土', '巳': '火',
    '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水',
};
/**
 * 查询天干或地支的五行属性。
 * @param ganOrZhi - 天干或地支字符
 * @returns 五行名称（金/木/水/火/土），未知则返回空串
 */
export function wuXingOf(ganOrZhi) {
    return WUXING_MAP[ganOrZhi] || '';
}
/**
 * 五行生克关系表（以日干五行为主，推导其他五行的六亲）。
 * rel[日干五行][其他五行] => 六亲简称
 */
const LIUQIN_REL = {
    '金': { '木': '财', '火': '官', '水': '食', '土': '印' },
    '木': { '火': '食', '土': '财', '金': '官', '水': '印' },
    '水': { '木': '印', '火': '财', '土': '官', '金': '食' },
    '火': { '土': '印', '金': '财', '水': '官', '木': '食' },
    '土': { '金': '印', '水': '官', '木': '财', '火': '食' },
};
/**
 * 推算六亲关系（基于地支五行与日干五行的生克）。
 * @param zhiSelf - 爻位地支
 * @param zhiOther - 对应地支（本实现中与 zhiSelf 相同）
 * @param dayGan - 日柱天干
 * @returns 六亲名称（比肩/比和/财/官/食/印/和）
 */
export function liuQinOf(zhiSelf, zhiOther, dayGan) {
    const selfEl = wuXingOf(zhiSelf);
    const otherEl = wuXingOf(zhiOther);
    if (!selfEl || !otherEl)
        return '';
    if (selfEl === otherEl)
        return wuXingOf(dayGan) === selfEl ? '比肩' : '比和';
    const dayEl = wuXingOf(dayGan) || '木';
    return (LIUQIN_REL[dayEl] || {})[otherEl] || '和';
}
/**
 * 取模运算，当整除时返回除数本身（而非 0）。
 * 用于起卦时的"余数归位"（如 8%8=8 而非 0）。
 * @param n - 被除数
 * @param mod - 除数
 * @returns 余数（1 ~ mod）
 */
export function modOrMax(n, mod) {
    const r = n % mod;
    return r === 0 ? mod : r;
}
/**
 * 构建四柱（年月日时）干支。
 * @param y - 公历年
 * @param m - 公历月
 * @param d - 公历日
 * @param h - 小时（0-23）
 * @returns 四柱信息（含天干、地支、干支合字，及农历/节气数据）
 */
export function buildBazi(y, m, d, h) {
    const sty = getSolarTermYear(y, m, d);
    const sm = getSolarMonth(y, m, d);
    const ygz = yearGZ(sty);
    const mgz = monthGZ(ygz, sm);
    const dgz = dayGZ(y, m, d);
    const hgz = hourGZ(dgz, h);
    return {
        year: { gan: ygz[0], zhi: ygz[1], ganzhi: ygz },
        month: { gan: mgz[0], zhi: mgz[1], ganzhi: mgz },
        day: { gan: dgz[0], zhi: dgz[1], ganzhi: dgz },
        hour: { gan: hgz.gz[0], zhi: hgz.gz[1], ganzhi: hgz.gz },
        solarTermYear: sty,
        lunar: solarToLunar(y, m, d),
        solarTermNext: hourToDizhi(h),
    };
}
/**
 * 构建六爻爻线详情（含纳甲干支、世应标记、六亲）。
 * @param hexIndex - 卦序（1-64）
 * @param moving - 动爻位置数组（1-6）
 * @param dayGan - 日柱天干（用于六亲推算）
 * @returns 6 爻详情数组
 */
export function buildLines(hexIndex, moving, dayGan) {
    const h = getHexagramByIndex(hexIndex);
    const najiaStr = getNajia(TRIGRAMS[h.upper] || '', TRIGRAMS[h.lower] || '');
    const parsed = parseNajia(najiaStr);
    return Array.from({ length: 6 }, (_, i) => {
        const pos = (i + 1);
        const isYang = h.lines[i] === true;
        const p = parsed[i];
        return {
            position: pos,
            yinYang: (isYang ? 'yang' : 'yin'),
            changed: moving.includes(pos),
            tiangan: p?.gan || '甲',
            dizhi: p?.zhi || '子',
            shi: pos === h.shiPosition,
            ying: pos === h.yingPosition,
            liuQin: liuQinOf(p?.zhi || '', p?.zhi || '', dayGan),
        };
    });
}
/**
 * 构建完整卦象（含爻线详情）。
 * @param hexIndex - 卦序（1-64）
 * @param moving - 动爻位置数组
 * @param dayGan - 日柱天干
 * @returns 卦象数据
 */
export function buildHexagram(hexIndex, moving, dayGan) {
    const h = getHexagramByIndex(hexIndex);
    return {
        index: hexIndex,
        name: h.name,
        fullName: h.fullName,
        upper: h.upper,
        lower: h.lower,
        palace: h.palace,
        element: h.element,
        nature: h.nature,
        lines: buildLines(hexIndex, moving, dayGan),
        shiPosition: h.shiPosition,
        yingPosition: h.yingPosition,
    };
}
/**
 * 查找变卦索引（动爻阴阳互变后的卦）。
 * @param hexIndex - 本卦序号
 * @param moving - 动爻位置数组
 * @returns 变卦序号
 */
export function findChangedHexagram(hexIndex, moving) {
    const h = getHexagramByIndex(hexIndex);
    const changed = h.lines.map((b, i) => (moving.includes(i + 1) ? !b : b));
    return findHexagramByTrigrams(bitsToTrigramIdx([changed[5], changed[4], changed[3]]), bitsToTrigramIdx([changed[2], changed[1], changed[0]]));
}
/**
 * 查找互卦索引（取本卦 2-3-4 爻为下卦，3-4-5 爻为上卦）。
 * @param hexIndex - 本卦序号
 * @returns 互卦序号
 */
export function findHuHexagram(hexIndex) {
    const h = getHexagramByIndex(hexIndex);
    return findHexagramByTrigrams(bitsToTrigramIdx([h.lines[4], h.lines[3], h.lines[2]]), bitsToTrigramIdx([h.lines[3], h.lines[2], h.lines[1]]));
}
