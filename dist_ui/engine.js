import { dispatchQigua } from './utils/qigua.js';
import { buildBazi, buildHexagram, findChangedHexagram, findHuHexagram } from './utils/parser.js';
import { buildXiaoLiu } from './panels/xiaoliu.js';
import { buildMeiHua } from './panels/meihua.js';
import { buildZhouYi } from './panels/zhouyi.js';
import { buildZiWei } from './panels/ziwei.js';
import { buildLiuYao } from './panels/liuyao.js';
import { buildBaziPanel } from './panels/bazi.js';
import { synthesize } from './analysis/synthesizer.js';
/**
 * 执行排盘，返回核心状态。
 * @param input - 时间输入
 * @param method - 起卦方法
 * @param numberInput - 数字/铜钱输入
 * @param extra - 附加参数（造币种子）
 * @param birth - 生辰（可选）
 * @param basis - 起卦依据
 * @param gender - 性别
 * @param name - 姓名
 * @returns 排盘核心状态
 */
export function paipan(input, method, numberInput = [], extra = 0, birth, basis = 'time', gender, name) {
    // 1. 构建四柱
    const bazi = buildBazi(input.year, input.month, input.day, input.hour);
    // 2. 起卦
    const q = dispatchQigua(method, input, numberInput, extra, birth, basis);
    const hexIndex = q.hexIndex, moving = q.moving;
    // 3. 构建本卦、变卦、互卦
    const hexagram = buildHexagram(hexIndex, moving, bazi.day.gan);
    const bianIndex = findChangedHexagram(hexIndex, moving);
    const huIndex = findHuHexagram(hexIndex);
    const bianHex = buildHexagram(bianIndex, [], bazi.day.gan);
    const huHex = buildHexagram(huIndex, [], bazi.day.gan);
    const movingMark = {
        positions: moving,
        benName: hexagram.name,
        bianName: bianHex.name,
        bianHexagram: bianHex,
        huHexagram: huHex,
    };
    // 4. 构建六大面板
    const xiaoliu = buildXiaoLiu(bazi, input.hour);
    const meihua = buildMeiHua(hexagram, moving);
    const zhouyi = buildZhouYi(hexagram, moving);
    const ziwei = buildZiWei(bazi);
    const liuyao = buildLiuYao(hexagram, moving, bazi);
    const baziPanel = { ...bazi, ...buildBaziPanel(bazi) };
    return {
        input, method, numberInput, bazi, hexagram, moving: movingMark,
        basis, birth, gender, name,
        panels: { xiaoliu, meihua, zhouyi, ziwei, liuyao, bazi: baziPanel },
    };
}
/**
 * 执行完整排盘（含综合分析）。
 * @param input - 时间输入
 * @param method - 起卦方法
 * @param numberInput - 数字/铜钱输入
 * @param extra - 附加参数
 * @param birth - 生辰
 * @param basis - 起卦依据
 * @param gender - 性别
 * @param name - 姓名
 * @returns 核心状态与综合分析
 */
export function fullPaipan(input, method, numberInput = [], extra = 0, birth, basis = 'time', gender, name) {
    const state = paipan(input, method, numberInput, extra, birth, basis, gender, name);
    return { state, synthesis: synthesize(state) };
}
