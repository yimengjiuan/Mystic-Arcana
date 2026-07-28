import { findChangedHexagram, findHuHexagram } from '../utils/parser.js';
import { getHexagramByIndex, findHexagramByTrigrams, TRIGRAM_ELEMENT } from '../data/hexagrams.js';
const SHENG_KE = { 金: ['金', '水', '木', '火', '土'], 木: ['木', '火', '土', '金', '水'], 水: ['水', '木', '火', '土', '金'], 火: ['火', '土', '金', '水', '木'], 土: ['土', '金', '水', '木', '火'] };
function makeHex(index) { const r = getHexagramByIndex(index); return { index, name: r.name, fullName: r.fullName, upper: r.upper, lower: r.lower, palace: r.palace, element: r.element, nature: r.nature, lines: [], shiPosition: r.shiPosition, yingPosition: r.yingPosition }; }
export function buildMeiHua(ben, dong) { const huIdx = findHuHexagram(ben.index); const bianIdx = findChangedHexagram(ben.index, dong); const upperDong = dong.some(d => d >= 4), lowerDong = dong.some(d => d <= 3); const tiTrigram = (upperDong && !lowerDong) ? ben.lower : ben.upper; const yongTrigram = (upperDong && !lowerDong) ? ben.upper : ben.lower; const ti = makeHex(findHexagramByTrigrams(tiTrigram, tiTrigram)); const yong = makeHex(findHexagramByTrigrams(yongTrigram, yongTrigram)); const tiEl = TRIGRAM_ELEMENT[tiTrigram] || ''; const yongEl = TRIGRAM_ELEMENT[yongTrigram] || ''; const idx = (SHENG_KE[tiEl] || []).indexOf(yongEl); let interp = '体用比和，谋事可成。'; if (idx === 1)
    interp = '体生用，小凶，付出多收获少。';
else if (idx === 2)
    interp = '体克用，所谋易成但费力。';
else if (idx === 3)
    interp = '用克体，所谋难成，防损耗。';
else if (idx === 4)
    interp = '用生体，大吉，百事可成。'; return { ben, hu: makeHex(huIdx), bian: makeHex(bianIdx), dong, ti, yong, tiElement: tiEl, yongElement: yongEl, interpretation: interp }; }
