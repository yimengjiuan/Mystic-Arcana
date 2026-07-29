import { test } from 'node:test';
import assert from 'node:assert/strict';
import { paipan } from '../src/engine';
import type { TimeInput } from '../src/types';

// 测试用例：1992年（壬申年）农历四月十一日巳时
// 即公历 1992-05-12 10:00，男
const input: TimeInput = { year: 1992, month: 5, day: 12, hour: 10, minute: 0, second: 0 };

test('紫微Z1：命宫推算正确（从寅起顺数生月逆数生时）', () => {
  const state = paipan(input, 'time', [], 0, undefined, 'time', '男');
  const zw = state.panels.ziwei;
  // 农历四月，巳时（时辰序数=6）
  // 从寅起顺数4月到巳宫（索引3），再逆数6步 -> 亥（索引9）
  assert.equal(zw.mingGong, '亥', '农历四月巳时命宫应在亥');
});

test('紫微Z2：身宫推算正确（从寅起顺数生月顺数生时）', () => {
  const state = paipan(input, 'time', [], 0, undefined, 'time', '男');
  const zw = state.panels.ziwei;
  // 从寅起顺数4月到巳宫（索引3），再顺数6步 -> 亥（索引9）
  assert.equal(zw.shenGong, '亥', '农历四月巳时身宫应在亥');
});

test('紫微Z3：五行局为合法值', () => {
  const state = paipan(input, 'time', [], 0, undefined, 'time', '男');
  const zw = state.panels.ziwei;
  const validJu = ['水二局', '木三局', '金四局', '土五局', '火六局'];
  assert.ok(validJu.includes(zw.wuXingJu), `五行局应为合法值，实际为${zw.wuXingJu}`);
});

test('紫微Z4：十四主星全部出现', () => {
  const state = paipan(input, 'time', [], 0, undefined, 'time', '男');
  const zw = state.panels.ziwei;
  const allStars = ['紫微', '天机', '太阳', '武曲', '天同', '廉贞', '天府', '太阴', '贪狼', '巨门', '天相', '天梁', '七杀', '破军'];
  for (const star of allStars) {
    assert.ok(zw.mainStars.some(s => s.star === star), `应包含主星${star}`);
  }
});

test('紫微Z5：十二宫位完整', () => {
  const state = paipan(input, 'time', [], 0, undefined, 'time', '男');
  const zw = state.panels.ziwei;
  assert.equal(zw.palaces.length, 12, '应有十二宫位');
  const mingPalace = zw.palaces.find(p => p.gong === '命宫');
  assert.ok(mingPalace, '应存在命宫');
  for (const p of zw.palaces) {
    assert.ok(p.zhi.length > 0, '宫位地支不应为空');
  }
});

test('紫微Z6：四化含禄权科忌四项', () => {
  const state = paipan(input, 'time', [], 0, undefined, 'time', '男');
  const zw = state.panels.ziwei;
  assert.equal(zw.siHua.length, 4, '四化应有4项');
  assert.ok(zw.siHua.some(s => s.hua === '化禄'), '应含化禄');
  assert.ok(zw.siHua.some(s => s.hua === '化权'), '应含化权');
  assert.ok(zw.siHua.some(s => s.hua === '化科'), '应含化科');
  assert.ok(zw.siHua.some(s => s.hua === '化忌'), '应含化忌');
});

test('紫微Z7：壬年四化正确（天梁禄、紫微权、左辅科、武曲忌）', () => {
  const state = paipan(input, 'time', [], 0, undefined, 'time', '男');
  const zw = state.panels.ziwei;
  const huaMap: Record<string, string> = {};
  for (const s of zw.siHua) huaMap[s.hua] = s.star;
  assert.equal(huaMap['化禄'], '天梁', '壬年化禄应为天梁');
  assert.equal(huaMap['化权'], '紫微', '壬年化权应为紫微');
  assert.equal(huaMap['化科'], '左辅', '壬年化科应为左辅');
  assert.equal(huaMap['化忌'], '武曲', '壬年化忌应为武曲');
});

test('紫微Z8：大限方向-阳男顺行', () => {
  // 壬年为阳干，男命应顺行
  const state = paipan(input, 'time', [], 0, undefined, 'time', '男');
  const zw = state.panels.ziwei;
  assert.equal(zw.daXianDirection, '顺行', '壬年阳男大限应顺行');
});

test('紫微Z9：大限方向-阴男逆行', () => {
  // 1985年乙丑年，阴干，男命应逆行
  const yinInput: TimeInput = { year: 1985, month: 7, day: 30, hour: 23, minute: 20, second: 0 };
  const state = paipan(yinInput, 'time', [], 0, undefined, 'time', '男');
  const zw = state.panels.ziwei;
  assert.equal(zw.daXianDirection, '逆行', '乙年阴男大限应逆行');
});

test('紫微Z10：大限方向-阳女逆行', () => {
  // 1988年戊辰年，阳干，女命应逆行
  const nvInput: TimeInput = { year: 1988, month: 3, day: 25, hour: 8, minute: 20, second: 0 };
  const state = paipan(nvInput, 'time', [], 0, undefined, 'time', '女');
  const zw = state.panels.ziwei;
  assert.equal(zw.daXianDirection, '逆行', '戊年阳女大限应逆行');
});

test('紫微Z11：大限方向-阴女顺行', () => {
  // 1985年乙丑年，阴干，女命应顺行
  const yinNvInput: TimeInput = { year: 1985, month: 7, day: 30, hour: 23, minute: 20, second: 0 };
  const state = paipan(yinNvInput, 'time', [], 0, undefined, 'time', '女');
  const zw = state.panels.ziwei;
  assert.equal(zw.daXianDirection, '顺行', '乙年阴女大限应顺行');
});

test('紫微Z12：主星亮度为合法值', () => {
  const state = paipan(input, 'time', [], 0, undefined, 'time', '男');
  const zw = state.panels.ziwei;
  const validBrightness = ['庙', '旺', '得', '利', '平', '闲', '陷'];
  for (const s of zw.mainStars) {
    assert.ok(validBrightness.includes(s.brightness), `主星${s.star}亮度${s.brightness}不合法`);
  }
});

test('紫微Z13：紫微天府以寅申线对称', () => {
  const state = paipan(input, 'time', [], 0, undefined, 'time', '男');
  const zw = state.panels.ziwei;
  const ZHI_ORDER = ['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑'];
  const zwPalace = zw.palaces.find(p => p.stars.includes('紫微'));
  const tfPalace = zw.palaces.find(p => p.stars.includes('天府'));
  assert.ok(zwPalace && tfPalace, '应找到紫微和天府所在宫位');
  const zwPos = ZHI_ORDER.indexOf(zwPalace!.zhi);
  const tfPos = ZHI_ORDER.indexOf(tfPalace!.zhi);
  assert.equal((zwPos + tfPos) % 12, 0, `紫微(索引${zwPos})与天府(索引${tfPos})应以寅申线对称（和%12=0）`);
});

test('紫微Z14：命格概述非空且含关键信息', () => {
  const state = paipan(input, 'time', [], 0, undefined, 'time', '男');
  const zw = state.panels.ziwei;
  assert.ok(zw.summary.length > 10, '命格概述不应过短');
  assert.ok(zw.summary.includes('局'), '概述应含五行局信息');
});

// ── 标准化用例验证 ──

test('标准case01：1986年丙寅年-紫府朝垣格', () => {
  const inp: TimeInput = { year: 1986, month: 9, day: 12, hour: 3, minute: 10, second: 0 };
  const state = paipan(inp, 'time', [], 0, undefined, 'time', '男');
  const zw = state.panels.ziwei;
  // 丙年四化：天同禄、天机权、文昌科、廉贞忌
  const huaMap: Record<string, string> = {};
  for (const s of zw.siHua) huaMap[s.hua] = s.star;
  assert.equal(huaMap['化禄'], '天同', '丙年化禄应为天同');
  assert.equal(huaMap['化忌'], '廉贞', '丙年化忌应为廉贞');
  // 紫府朝垣格：命宫主星应为紫微/天府之一
  const mingPalace = zw.palaces.find(p => p.gong === '命宫');
  const ziFu = ['紫微', '天府'];
  assert.ok(mingPalace && mingPalace.stars.some(s => ziFu.includes(s)), '命宫应有紫微或天府主星');
  // 阳男顺行
  assert.equal(zw.daXianDirection, '顺行', '丙年阳男应顺行');
});

test('标准case02：1988年戊辰年-阳女逆行', () => {
  const inp: TimeInput = { year: 1988, month: 3, day: 25, hour: 8, minute: 20, second: 0 };
  const state = paipan(inp, 'time', [], 0, undefined, 'time', '女');
  const zw = state.panels.ziwei;
  // 戊年四化：贪狼禄、太阴权、右弼科、天机忌
  const huaMap: Record<string, string> = {};
  for (const s of zw.siHua) huaMap[s.hua] = s.star;
  assert.equal(huaMap['化禄'], '贪狼', '戊年化禄应为贪狼');
  assert.equal(huaMap['化忌'], '天机', '戊年化忌应为天机');
  // 阳女逆行
  assert.equal(zw.daXianDirection, '逆行', '戊年阳女应逆行');
});

test('标准case03：1982年壬戌年-阳男顺行', () => {
  const inp: TimeInput = { year: 1982, month: 11, day: 6, hour: 10, minute: 5, second: 0 };
  const state = paipan(inp, 'time', [], 0, undefined, 'time', '男');
  const zw = state.panels.ziwei;
  // 壬年四化：天梁禄、紫微权、左辅科、武曲忌
  const huaMap: Record<string, string> = {};
  for (const s of zw.siHua) huaMap[s.hua] = s.star;
  assert.equal(huaMap['化禄'], '天梁', '壬年化禄应为天梁');
  assert.equal(huaMap['化忌'], '武曲', '壬年化忌应为武曲');
  assert.equal(zw.daXianDirection, '顺行', '壬年阳男应顺行');
});

test('标准case04：1990年庚午年-阳女逆行', () => {
  const inp: TimeInput = { year: 1990, month: 6, day: 18, hour: 14, minute: 30, second: 0 };
  const state = paipan(inp, 'time', [], 0, undefined, 'time', '女');
  const zw = state.panels.ziwei;
  // 庚年四化：太阳禄、武曲权、太阴科、天同忌
  const huaMap: Record<string, string> = {};
  for (const s of zw.siHua) huaMap[s.hua] = s.star;
  assert.equal(huaMap['化禄'], '太阳', '庚年化禄应为太阳');
  assert.equal(huaMap['化忌'], '天同', '庚年化忌应为天同');
  assert.equal(zw.daXianDirection, '逆行', '庚年阳女应逆行');
});

test('标准case05：1984年甲子年-阳男顺行', () => {
  const inp: TimeInput = { year: 1984, month: 2, day: 8, hour: 20, minute: 15, second: 0 };
  const state = paipan(inp, 'time', [], 0, undefined, 'time', '男');
  const zw = state.panels.ziwei;
  // 甲年四化：廉贞禄、破军权、武曲科、太阳忌
  const huaMap: Record<string, string> = {};
  for (const s of zw.siHua) huaMap[s.hua] = s.star;
  assert.equal(huaMap['化禄'], '廉贞', '甲年化禄应为廉贞');
  assert.equal(huaMap['化忌'], '太阳', '甲年化忌应为太阳');
  assert.equal(zw.daXianDirection, '顺行', '甲年阳男应顺行');
});

test('标准case06：1985年乙丑年-阴男逆行', () => {
  const inp: TimeInput = { year: 1985, month: 7, day: 30, hour: 23, minute: 20, second: 0 };
  const state = paipan(inp, 'time', [], 0, undefined, 'time', '男');
  const zw = state.panels.ziwei;
  // 乙年四化：天机禄、天梁权、紫微科、太阴忌
  const huaMap: Record<string, string> = {};
  for (const s of zw.siHua) huaMap[s.hua] = s.star;
  assert.equal(huaMap['化禄'], '天机', '乙年化禄应为天机');
  assert.equal(huaMap['化忌'], '太阴', '乙年化忌应为太阴');
  assert.equal(zw.daXianDirection, '逆行', '乙年阴男应逆行');
});
