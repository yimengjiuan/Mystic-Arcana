// 核心排盘引擎：串联 起卦→四柱→6面板→综合分析
// 唯一对外入口：paipan()

import {
  CoreState, TimeInput, QiGuaMethod, QiGuaBasis, MovingMark, Hexagram
} from './types';
import { dispatchQigua } from './utils/qigua';
import { buildBazi, buildHexagram, findChangedHexagram, findHuHexagram } from './utils/parser';
import { buildXiaoLiu } from './panels/xiaoliu';
import { buildMeiHua } from './panels/meihua';
import { buildZhouYi } from './panels/zhouyi';
import { buildZiWei } from './panels/ziwei';
import { buildLiuYao } from './panels/liuyao';
import { buildBaziPanel } from './panels/bazi';
import { synthesize } from './analysis/synthesizer';

export function paipan(
  input: TimeInput,
  method: QiGuaMethod,
  numberInput: readonly number[] = [],
  extra: number = 0,
  birth?: TimeInput,
  basis: QiGuaBasis = 'time',
  gender?: '男' | '女',
  name?: string
): CoreState {
  const bazi = buildBazi(input.year, input.month, input.day, input.hour);
  const q = dispatchQigua(method, input, numberInput, extra, birth, basis);
  const hexIndex = q.hexIndex;
  const moving = q.moving;

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
    huHexagram: huHex
  };

  const xiaoliu = buildXiaoLiu(bazi, input.hour);
  const meihua = buildMeiHua(hexagram, moving);
  const zhouyi = buildZhouYi(hexagram, moving);
  const ziwei = buildZiWei(bazi);
  const liuyao = buildLiuYao(hexagram, moving, bazi);
  const baziPanel = { ...bazi, ...buildBaziPanel(bazi) } as unknown as CoreState['panels']['bazi'];

  return {
    input,
    method,
    numberInput,
    bazi,
    hexagram,
    moving: movingMark,
    basis,
    birth,
    gender,
    name,
    panels: {
      xiaoliu,
      meihua,
      zhouyi,
      ziwei,
      liuyao,
      bazi: baziPanel
    }
  };
}

export function fullPaipan(
  input: TimeInput,
  method: QiGuaMethod,
  numberInput: readonly number[] = [],
  extra: number = 0,
  birth?: TimeInput,
  basis: QiGuaBasis = 'time',
  gender?: '男' | '女',
  name?: string
): { state: CoreState; synthesis: ReturnType<typeof synthesize> } {
  const state = paipan(input, method, numberInput, extra, birth, basis, gender, name);
  const synthesis = synthesize(state);
  return { state, synthesis };
}
