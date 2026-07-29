import { test } from 'node:test';
import assert from 'node:assert/strict';
import { paipan } from '../src/engine';
import type { TimeInput } from '../src/types';

// 公共起卦时间（仅用于排盘，卦象由铜钱摇卦决定）
const input: TimeInput = { year: 2024, month: 5, day: 12, hour: 10, minute: 0, second: 0 };

// 六爻标准案例验证（纳甲地支与案例完全一致的6个独特卦象）
// throws: 0=老阴动 1=少阳 2=少阴 3=老阳动

test('六爻案例：天地否（乾宫，世3应6，纳甲地支验证）', () => {
  const throws = [2, 2, 2, 1, 1, 1];
  const state = paipan(input, 'cuanke', throws);
  const ly = state.panels.liuyao;
  assert.equal(ly.ben.fullName, '天地否');
  assert.equal(ly.ben.palace, '乾');
  assert.equal(ly.ben.shiPosition, 3);
  assert.equal(ly.ben.yingPosition, 6);
  // 纳甲地支（自下而上1-6爻）
  const zhi = ly.liuQinMap.map(lq => lq.ganZhi[1]);
  assert.deepEqual(zhi, ['未', '巳', '卯', '午', '申', '戌']);
  // 六亲（乾宫金：未=父母, 巳=官鬼, 卯=妻财, 午=官鬼, 申=兄弟, 戌=父母）
  const lq = ly.liuQinMap.map(lq => lq.liuQin);
  assert.deepEqual(lq, ['父母', '官鬼', '妻财', '官鬼', '兄弟', '父母']);
});

test('六爻案例：雷天大壮 -> 天火同人（坤宫，世4应1，动爻2,5,6）', () => {
  const throws = [1, 3, 1, 1, 0, 0];
  const state = paipan(input, 'cuanke', throws);
  const ly = state.panels.liuyao;
  assert.equal(ly.ben.fullName, '雷天大壮');
  assert.equal(ly.ben.palace, '坤');
  assert.equal(ly.ben.shiPosition, 4);
  assert.equal(ly.ben.yingPosition, 1);
  assert.equal(ly.bian.fullName, '天火同人');
  assert.deepEqual(ly.dong, [2, 5, 6]);
  const zhi = ly.liuQinMap.map(lq => lq.ganZhi[1]);
  assert.deepEqual(zhi, ['子', '寅', '辰', '午', '申', '戌']);
  // 坤宫土：子=妻财, 寅=官鬼, 辰=兄弟, 午=父母, 申=子孙, 戌=兄弟
  const lq = ly.liuQinMap.map(lq => lq.liuQin);
  assert.deepEqual(lq, ['妻财', '官鬼', '兄弟', '父母', '子孙', '兄弟']);
});

test('六爻案例：雷风恒（震宫，世3应6，纳甲地支验证）', () => {
  const throws = [2, 1, 1, 1, 2, 2];
  const state = paipan(input, 'cuanke', throws);
  const ly = state.panels.liuyao;
  assert.equal(ly.ben.fullName, '雷风恒');
  assert.equal(ly.ben.palace, '震');
  assert.equal(ly.ben.shiPosition, 3);
  assert.equal(ly.ben.yingPosition, 6);
  const zhi = ly.liuQinMap.map(lq => lq.ganZhi[1]);
  assert.deepEqual(zhi, ['丑', '亥', '酉', '午', '申', '戌']);
  // 震宫木：丑=妻财, 亥=父母, 酉=官鬼, 午=子孙, 申=官鬼, 戌=妻财
  const lq = ly.liuQinMap.map(lq => lq.liuQin);
  assert.deepEqual(lq, ['妻财', '父母', '官鬼', '子孙', '官鬼', '妻财']);
});

test('六爻案例：雷风恒 -> 雷泽归妹（震宫，动爻1,3）', () => {
  const throws = [0, 1, 3, 1, 2, 2];
  const state = paipan(input, 'cuanke', throws);
  const ly = state.panels.liuyao;
  assert.equal(ly.ben.fullName, '雷风恒');
  assert.equal(ly.bian.fullName, '雷泽归妹');
  assert.deepEqual(ly.dong, [1, 3]);
});

test('六爻案例：山水蒙 -> 地风升（离宫，世4应1，动爻3,6）', () => {
  const throws = [2, 1, 0, 2, 2, 3];
  const state = paipan(input, 'cuanke', throws);
  const ly = state.panels.liuyao;
  assert.equal(ly.ben.fullName, '山水蒙');
  assert.equal(ly.ben.palace, '离');
  assert.equal(ly.ben.shiPosition, 4);
  assert.equal(ly.ben.yingPosition, 1);
  assert.equal(ly.bian.fullName, '地风升');
  assert.deepEqual(ly.dong, [3, 6]);
  const zhi = ly.liuQinMap.map(lq => lq.ganZhi[1]);
  assert.deepEqual(zhi, ['寅', '辰', '午', '戌', '子', '寅']);
  // 离宫火：寅=父母, 辰=子孙, 午=兄弟, 戌=子孙, 子=官鬼, 寅=父母
  const lq = ly.liuQinMap.map(lq => lq.liuQin);
  assert.deepEqual(lq, ['父母', '子孙', '兄弟', '子孙', '官鬼', '父母']);
});

test('六爻案例：山风蛊 -> 地风升（巽宫，世3应6，动爻6）', () => {
  const throws = [2, 1, 1, 2, 2, 3];
  const state = paipan(input, 'cuanke', throws);
  const ly = state.panels.liuyao;
  assert.equal(ly.ben.fullName, '山风蛊');
  assert.equal(ly.ben.palace, '巽');
  assert.equal(ly.ben.shiPosition, 3);
  assert.equal(ly.ben.yingPosition, 6);
  assert.equal(ly.bian.fullName, '地风升');
  assert.deepEqual(ly.dong, [6]);
  const zhi = ly.liuQinMap.map(lq => lq.ganZhi[1]);
  assert.deepEqual(zhi, ['丑', '亥', '酉', '戌', '子', '寅']);
  // 巽宫木：丑=妻财, 亥=父母, 酉=官鬼, 戌=妻财, 子=父母, 寅=兄弟
  const lq = ly.liuQinMap.map(lq => lq.liuQin);
  assert.deepEqual(lq, ['妻财', '父母', '官鬼', '妻财', '父母', '兄弟']);
});
