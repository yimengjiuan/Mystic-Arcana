import { findChangedHexagram, findHuHexagram } from '../utils/parser.js';
import { getHexagramByIndex, findHexagramByTrigrams, TRIGRAM_ELEMENT } from '../data/hexagrams.js';
/**
 * 五行生克顺序表：SHENG_KE[我][0..4] 依次为
 * [同类, 我生, 我克, 克我, 生我]，用于体用关系判定。
 */
const SHENG_KE = {
    '金': ['金', '水', '木', '火', '土'],
    '木': ['木', '火', '土', '金', '水'],
    '水': ['水', '木', '火', '土', '金'],
    '火': ['火', '土', '金', '水', '木'],
    '土': ['土', '金', '水', '木', '火'],
};
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
 * 构建梅花易数排盘。
 * @param ben - 本卦
 * @param dong - 动爻位置数组
 * @returns 梅花易数面板数据
 */
export function buildMeiHua(ben, dong) {
    const huIdx = findHuHexagram(ben.index);
    const bianIdx = findChangedHexagram(ben.index, dong);
    // 判断动爻在上卦(4-6爻)还是下卦(1-3爻)，据此分体用
    const upperDong = dong.some(d => d >= 4);
    const lowerDong = dong.some(d => d <= 3);
    // 动者为用，不动者为体
    const tiTrigram = (upperDong && !lowerDong) ? ben.lower : ben.upper;
    const yongTrigram = (upperDong && !lowerDong) ? ben.upper : ben.lower;
    const ti = makeHex(findHexagramByTrigrams(tiTrigram, tiTrigram));
    const yong = makeHex(findHexagramByTrigrams(yongTrigram, yongTrigram));
    const tiEl = TRIGRAM_ELEMENT[tiTrigram] || '';
    const yongEl = TRIGRAM_ELEMENT[yongTrigram] || '';
    // 体用五行关系判定
    const idx = (SHENG_KE[tiEl] || []).indexOf(yongEl);
    let interp = '体用比和，谋事可成。';
    if (idx === 1)
        interp = '体生用，小凶，付出多收获少。';
    else if (idx === 2)
        interp = '体克用，所谋易成但费力。';
    else if (idx === 3)
        interp = '用克体，所谋难成，防损耗。';
    else if (idx === 4)
        interp = '用生体，大吉，百事可成。';
    return {
        ben,
        hu: makeHex(huIdx),
        bian: makeHex(bianIdx),
        dong,
        ti,
        yong,
        tiElement: tiEl,
        yongElement: yongEl,
        interpretation: interp,
    };
}
