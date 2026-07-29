/**
 * 核心排盘引擎
 * ------------------------------------------------------------------
 * 串联起卦 -> 四柱 -> 卦象构建 -> 六大面板构建的完整流程。
 * paipan 返回核心状态；fullPaipan 额外附加综合分析。
 */
import { CoreState, TimeInput, QiGuaMethod, QiGuaBasis, MovingMark, Hexagram } from './types/index';
// 重新导出类型，便于消费者从主入口引入（import type { CoreState } from 'xuanji-paipan'）
export * from './types/index';
import { dispatchQigua } from './utils/qigua';
import { buildBazi, buildHexagram, findChangedHexagram, findHuHexagram } from './utils/parser';
import { buildXiaoLiu } from './panels/xiaoliu';
import { buildMeiHua } from './panels/meihua';
import { buildZhouYi } from './panels/zhouyi';
import { buildZiWei } from './panels/ziwei';
import { buildLiuYao } from './panels/liuyao';
import { buildBaziPanel } from './panels/bazi';
import { synthesize } from './analysis/synthesizer';

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
export function paipan(
  input: TimeInput,
  method: QiGuaMethod,
  numberInput: readonly number[] = [],
  extra: number = 0,
  birth?: TimeInput,
  basis: QiGuaBasis = 'time',
  gender?: '男' | '女',
  name?: string,
): CoreState {
  // 1. 构建四柱
  const bazi = buildBazi(input.year, input.month, input.day, input.hour);

  // 2. 起卦
  const q = dispatchQigua(method, input, numberInput, extra, birth, basis);
  const hexIndex = q.hexIndex, moving = q.moving;

  // 3. 构建本卦、变卦、互卦
  const hexagram: Hexagram = buildHexagram(hexIndex, moving, bazi.day.gan);
  const bianIndex = findChangedHexagram(hexIndex, moving);
  const huIndex = findHuHexagram(hexIndex);
  const bianHex = buildHexagram(bianIndex, [], bazi.day.gan);
  const huHex = buildHexagram(huIndex, [], bazi.day.gan);
  const movingMark: MovingMark = {
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
  const baziPanel = { ...bazi, ...buildBaziPanel(bazi) } as unknown as CoreState['panels']['bazi'];

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
export function fullPaipan(
  input: TimeInput,
  method: QiGuaMethod,
  numberInput: readonly number[] = [],
  extra: number = 0,
  birth?: TimeInput,
  basis: QiGuaBasis = 'time',
  gender?: '男' | '女',
  name?: string,
) {
  const state = paipan(input, method, numberInput, extra, birth, basis, gender, name);
  return { state, synthesis: synthesize(state) };
}
