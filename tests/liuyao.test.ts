import { test } from 'node:test';
import assert from 'node:assert/strict';
import { paipan } from '../src/engine';
import { buildLiuYao } from '../src/panels/liuyao';
import { buildHexagram, buildBazi } from '../src/utils/parser';
import type { Bazi, TimeInput } from '../src/types';

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

// ---- 黄金测试：六神起例 ----

// 构造指定日干的四柱（基于固定日期，仅覆盖日干）
function makeBazi(gan: string): Bazi {
  const base = buildBazi(2024, 5, 12, 10);
  return { ...base, day: { gan, zhi: base.day.zhi, ganzhi: gan + base.day.zhi } };
}

// 六神起例口诀：甲乙起青龙、丙丁起朱雀、戊起勾陈、己起螣蛇、庚辛起白虎、壬癸起玄武
test('六神起例：10 个日干初爻六神与口诀一致', () => {
  const ben = buildHexagram(1, [], '甲'); // 乾为天（乾宫）
  const cases: ReadonlyArray<readonly [string, string]> = [
    ['甲', '青龙'], ['乙', '青龙'],
    ['丙', '朱雀'], ['丁', '朱雀'],
    ['戊', '勾陈'],
    ['己', '螣蛇'],
    ['庚', '白虎'], ['辛', '白虎'],
    ['壬', '玄武'], ['癸', '玄武'],
  ];
  for (const [gan, expected] of cases) {
    const ly = buildLiuYao(ben, [], makeBazi(gan));
    assert.equal(ly.liuShen[0], expected, `日干 ${gan} 初爻应为 ${expected}`);
  }
});

test('六神起例：六神顺序固定为青龙→朱雀→勾陈→螣蛇→白虎→玄武，逐爻顺排', () => {
  const ben = buildHexagram(1, [], '甲');
  // 甲日起青龙：青龙、朱雀、勾陈、螣蛇、白虎、玄武
  const lyJia = buildLiuYao(ben, [], makeBazi('甲'));
  assert.deepEqual(lyJia.liuShen, ['青龙', '朱雀', '勾陈', '螣蛇', '白虎', '玄武']);
  // 壬日起玄武：玄武、青龙、朱雀、勾陈、螣蛇、白虎
  const lyRen = buildLiuYao(ben, [], makeBazi('壬'));
  assert.deepEqual(lyRen.liuShen, ['玄武', '青龙', '朱雀', '勾陈', '螣蛇', '白虎']);
});

// ---- 黄金测试：伏神本宫卦定位 ----

test('伏神：八宫本宫卦定位（fuShi[0].hex 应为对应八纯卦）', () => {
  // [卦序, 宫位, 本宫卦全称]
  const cases: ReadonlyArray<readonly [number, string, string]> = [
    [1, '乾', '乾为天'],
    [2, '坤', '坤为地'],
    [29, '坎', '坎为水'],
    [30, '离', '离为火'],
    [51, '震', '震为雷'],
    [52, '艮', '艮为山'],
    [57, '巽', '巽为风'],
    [58, '兑', '兑为泽'],
  ];
  for (const [hexIndex, palace, expected] of cases) {
    const ben = buildHexagram(hexIndex, [], '甲');
    assert.equal(ben.palace, palace);
    const ly = buildLiuYao(ben, [], makeBazi('甲'));
    assert.equal(ly.fuShi[0].hex.fullName, expected, `${palace}宫伏神本宫卦应为${expected}`);
  }
});
