// 金标测试
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { paipan } from '../src/engine';
import { TimeInput } from '../src/types';

test('T1: 壬申年四月十一巳时 -> 大安', () => {
  const input: TimeInput = { year: 1992, month: 5, day: 12, hour: 10, minute: 0 };
  const state = paipan(input, 'time');
  assert.equal(state.bazi.year.ganzhi, '壬申', '年柱应为壬申');
  assert.equal(state.bazi.month.ganzhi, '乙巳', '月柱应为乙巳');
  assert.equal(state.bazi.day.ganzhi, '戊子', '日柱应为戊子');
  assert.equal(state.bazi.hour.ganzhi, '丁巳', '时柱应为丁巳');
  assert.equal(state.panels.xiaoliu.result, '大安', '小六壬应得大安');
  assert.ok(state.hexagram.index > 0, '应有卦象');
});

test('T2: 乾为天六爻动', () => {
  const input: TimeInput = { year: 2000, month: 1, day: 1, hour: 12, minute: 0 };
  const throws = [3, 3, 3, 3, 3, 3];
  const state = paipan(input, 'cuanke', throws);
  assert.equal(state.hexagram.name, '乾', '本卦应为乾');
  assert.equal(state.moving.bianName, '坤', '变卦应为坤');
  assert.equal(state.hexagram.palace, '乾', '应为乾宫');
});

test('T3: 数字起卦', () => {
  const input: TimeInput = { year: 2000, month: 1, day: 1, hour: 12, minute: 0 };
  const state = paipan(input, 'number', [5, 10]);
  assert.ok(state.moving.positions.length > 0, '数字起卦应有动爻');
});
