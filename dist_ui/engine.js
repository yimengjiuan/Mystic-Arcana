import { dispatchQigua } from './utils/qigua.js';
import { buildBazi, buildHexagram, findChangedHexagram, findHuHexagram } from './utils/parser.js';
import { buildXiaoLiu } from './panels/xiaoliu.js';
import { buildMeiHua } from './panels/meihua.js';
import { buildZhouYi } from './panels/zhouyi.js';
import { buildZiWei } from './panels/ziwei.js';
import { buildLiuYao } from './panels/liuyao.js';
import { buildBaziPanel } from './panels/bazi.js';
import { synthesize } from './analysis/synthesizer.js';
export function paipan(input, method, numberInput = [], extra = 0, birth, basis = 'time', gender, name) {
    const bazi = buildBazi(input.year, input.month, input.day, input.hour);
    const q = dispatchQigua(method, input, numberInput, extra, birth, basis);
    const hexIndex = q.hexIndex, moving = q.moving;
    const hexagram = buildHexagram(hexIndex, moving, bazi.day.gan);
    const bianIndex = findChangedHexagram(hexIndex, moving);
    const huIndex = findHuHexagram(hexIndex);
    const bianHex = buildHexagram(bianIndex, [], bazi.day.gan);
    const huHex = buildHexagram(huIndex, [], bazi.day.gan);
    const movingMark = { positions: moving, benName: hexagram.name, bianName: bianHex.name, bianHexagram: bianHex, huHexagram: huHex };
    const xiaoliu = buildXiaoLiu(bazi, input.hour);
    const meihua = buildMeiHua(hexagram, moving);
    const zhouyi = buildZhouYi(hexagram, moving);
    const ziwei = buildZiWei(bazi);
    const liuyao = buildLiuYao(hexagram, moving, bazi);
    const baziPanel = { ...bazi, ...buildBaziPanel(bazi) };
    return { input, method, numberInput, bazi, hexagram, moving: movingMark, basis, birth, gender, name, panels: { xiaoliu, meihua, zhouyi, ziwei, liuyao, bazi: baziPanel } };
}
export function fullPaipan(input, method, numberInput = [], extra = 0, birth, basis = 'time', gender, name) {
    const state = paipan(input, method, numberInput, extra, birth, basis, gender, name);
    return { state, synthesis: synthesize(state) };
}
