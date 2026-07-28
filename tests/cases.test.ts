import { test } from 'node:test';
import assert from 'node:assert/strict';
import { paipan } from '../src/engine';
import type { TimeInput } from '../src/types';

// 公共起卦时间（仅用于排盘，卦象由铜钱摇卦决定）
const input: TimeInput = { year: 2024, month: 5, day: 12, hour: 10, minute: 0, second: 0 };

test('案例一：求职运势 坎为水 -> 地水师', () => {
  // 坎为水：六爻 [阴,阳,阴,阴,阳,阴]，第5爻动
  // throws: 0=老阴动 1=少阳 2=少阴 3=老阳动
  const throws = [2, 1, 2, 2, 3, 2];
  const state = paipan(input, 'cuanke', throws);
  assert.equal(state.hexagram.fullName, '坎为水', '主卦应为坎为水');
  assert.equal(state.moving.positions.join(','), '5', '动爻应为第5爻');
  assert.equal(state.moving.bianName, '师', '变卦应为师（地水师）');
  assert.equal(state.moving.bianHexagram.fullName, '地水师', '变卦全名应为地水师');
  assert.equal(state.hexagram.palace, '坎', '坎为水属坎宫');
  assert.equal(state.panels.liuyao.bian.fullName, '地水师', '六爻面板变卦应为地水师');
});

test('案例二：婚姻状况 乾为天 -> 天山遁', () => {
  // 乾为天：六爻皆阳，第1、2爻动
  const throws = [3, 3, 1, 1, 1, 1];
  const state = paipan(input, 'cuanke', throws);
  assert.equal(state.hexagram.fullName, '乾为天', '主卦应为乾为天');
  assert.equal(state.moving.positions.join(','), '1,2', '动爻应为第1、2爻');
  assert.equal(state.moving.bianName, '遁', '变卦应为遁（天山遁）');
  assert.equal(state.moving.bianHexagram.fullName, '天山遁', '变卦全名应为天山遁');
  assert.equal(state.panels.liuyao.bian.fullName, '天山遁', '六爻面板变卦应为天山遁');
});

test('案例三：投资前景 震为雷 -> 雷水解', () => {
  // 震为雷：六爻 [阳,阴,阴,阳,阴,阴]，第1、2爻动
  const throws = [3, 0, 2, 1, 2, 2];
  const state = paipan(input, 'cuanke', throws);
  assert.equal(state.hexagram.fullName, '震为雷', '主卦应为震为雷');
  assert.equal(state.moving.positions.join(','), '1,2', '动爻应为第1、2爻');
  assert.equal(state.moving.bianName, '解', '变卦应为解（雷水解）');
  assert.equal(state.moving.bianHexagram.fullName, '雷水解', '变卦全名应为雷水解');
  assert.equal(state.panels.liuyao.bian.fullName, '雷水解', '六爻面板变卦应为雷水解');
});

test('案例四：学业考试 泽山咸 -> 泽地萃（梅花易数 体用生克）', () => {
  // 泽山咸：六爻 [阴,阴,阳,阳,阳,阴]，第3爻动（下卦动）
  const throws = [2, 2, 3, 1, 1, 2];
  const state = paipan(input, 'cuanke', throws);
  assert.equal(state.hexagram.fullName, '泽山咸', '主卦应为泽山咸');
  assert.equal(state.moving.positions.join(','), '3', '动爻应为第3爻');
  assert.equal(state.moving.bianHexagram.fullName, '泽地萃', '变卦应为泽地萃');
  // 梅花面板
  const mh = state.panels.meihua;
  assert.equal(mh.bian.fullName, '泽地萃', '梅花面板变卦应为泽地萃');
  assert.equal(mh.hu.fullName, '天风姤', '梅花面板互卦应为天风姤');
  // 体用：下卦动，体=上卦兑金，用=下卦艮土，土生金=用生体
  assert.equal(mh.tiElement, '金', '体卦应为兑金');
  assert.equal(mh.yongElement, '土', '用卦应为艮土');
  assert.equal(mh.interpretation, '用生体，大吉，百事可成。', '土生金应为用生体大吉');
});

test('案例五：法律纠纷 山火贲 -> 离为火（梅花易数 数字起卦+体用）', () => {
  // 山火贲：六爻 [阳,阴,阳,阴,阴,阳]，第4爻动（上卦动）
  const throws = [1, 2, 1, 0, 2, 1];
  const state = paipan(input, 'cuanke', throws);
  assert.equal(state.hexagram.fullName, '山火贲', '主卦应为山火贲');
  assert.equal(state.moving.positions.join(','), '4', '动爻应为第4爻');
  // 数学变卦为离为火（外应修正为天火同人不属于代码自动化范畴）
  assert.equal(state.moving.bianHexagram.fullName, '离为火', '数学变卦应为离为火');
  // 梅花面板
  const mh = state.panels.meihua;
  assert.equal(mh.bian.fullName, '离为火', '梅花面板变卦应为离为火');
  assert.equal(mh.hu.fullName, '雷水解', '梅花面板互卦应为雷水解');
  // 体用：上卦动，体=下卦离火，用=上卦艮土，火生土=体生用
  assert.equal(mh.tiElement, '火', '体卦应为离火');
  assert.equal(mh.yongElement, '土', '用卦应为艮土');
  assert.equal(mh.interpretation, '体生用，小凶，付出多收获少。', '火生土应为体生用小凶');
});

test('案例五补充：梅花数字起卦 报数7、3应得山火贲', () => {
  // 报数7（艮）、3（离），动爻=7+3+时辰数，hour=10时辰数=6，10+6=16，16%6=4
  const state = paipan(input, 'meihua', [7, 3]);
  assert.equal(state.hexagram.fullName, '山火贲', '数字7、3应得起卦山火贲');
  assert.equal(state.moving.positions.join(','), '4', '动爻应为第4爻');
});
