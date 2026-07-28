import { wuXingOf, findChangedHexagram } from '../utils/parser.js';
import { getHexagramByIndex } from '../data/hexagrams.js';
/** 六神列表（按日干起算，日复一日循环） */
const LIU_SHEN = ['青龙', '朱雀', '勾陈', '螣蛇', '白虎', '玄武'];
/** 五行相生关系表（我生） */
const SHENG_MAP = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' };
/** 五行相克关系表（我克） */
const KE_MAP = { '木': '土', '火': '金', '土': '水', '金': '木', '水': '火' };
/**
 * 由卦序构造轻量卦象（不含爻线详情，仅基本信息）。
 * @param index - 卦序
 * @returns 卦象数据
 */
function makeHex(index) {
    const r = getHexagramByIndex(index);
    return {
        index,
        name: r.name,
        fullName: r.fullName,
        upper: r.upper,
        lower: r.lower,
        palace: r.palace,
        element: r.element,
        nature: r.nature,
        lines: [],
        shiPosition: r.shiPosition,
        yingPosition: r.yingPosition,
    };
}
/**
 * 构建六爻排盘。
 * @param ben - 本卦
 * @param dong - 动爻位置数组
 * @param bazi - 四柱数据（取日干）
 * @returns 六爻面板数据
 */
export function buildLiuYao(ben, dong, bazi) {
    const bianIdx = findChangedHexagram(ben.index, dong);
    // 伏神：以本卦所属宫位的本宫卦为伏神来源
    const palaceIdx = ['乾', '坎', '艮', '震', '巽', '离', '坤', '兑'].indexOf(ben.palace);
    const fuShi = Array.from({ length: 6 }, (_, i) => ({ hex: makeHex(palaceIdx * 8 + 1), line: i + 1 }));
    // 六亲推算：以日干五行与各爻地支五行的生克关系判定
    const dayEl = wuXingOf(bazi.day.gan);
    const liuQinMap = ben.lines.map((l, i) => {
        const el = wuXingOf(l.dizhi);
        let lq = '和';
        if (el === dayEl)
            lq = '比肩';
        else if (SHENG_MAP[dayEl] === el)
            lq = '食神';
        else if (KE_MAP[dayEl] === el)
            lq = '财爻';
        else if (SHENG_MAP[el] === dayEl)
            lq = '印爻';
        else if (KE_MAP[el] === dayEl)
            lq = '官鬼';
        return { position: i + 1, liuQin: lq, ganZhi: l.tiangan + l.dizhi };
    });
    // 六神：以日干序号为起点，逐爻循环配六神
    const startIdx = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'].indexOf(bazi.day.gan);
    const liuShen = Array.from({ length: 6 }, (_, i) => LIU_SHEN[(startIdx + i) % 6]);
    // 生成概述
    let summary = `${ben.fullName}，${ben.palace}宫，世爻${ben.shiPosition}爻`;
    if (dong.length > 0)
        summary += `，${dong.join('、')}爻动`;
    return { ben, bian: makeHex(bianIdx), dong, fuShi, liuShen, liuQinMap, summary: summary + '。' };
}
