import { test } from 'node:test';
import assert from 'node:assert/strict';
import { paipan } from '../src/engine';
import { calcZiweiPos } from '../src/panels/ziwei';
import type { TimeInput } from '../src/types';

// 测试用例：1992年（壬申年）农历四月十一日巳时
// 即公历 1992-05-12 10:00，男
const input: TimeInput = { year: 1992, month: 5, day: 12, hour: 10, minute: 0, second: 0 };

test('紫微Z1：命宫推算正确（从寅起顺数生月，从生月宫起子时逆数至生时）', () => {
  const state = paipan(input, 'time', [], 0, undefined, 'time', '男');
  const zw = state.panels.ziwei;
  // 农历四月，巳时（时辰序数=6）
  // 从寅起顺数4月到巳宫（索引3），再从巳宫起子时逆数5步（子时不动、丑时退1格…依《紫微斗数全书》）-> 子（索引10）
  assert.equal(zw.mingGong, '子', '农历四月巳时命宫应在子');
});

test('紫微Z2：身宫推算正确（从寅起顺数生月，从生月宫起子时顺数至生时）', () => {
  const state = paipan(input, 'time', [], 0, undefined, 'time', '男');
  const zw = state.panels.ziwei;
  // 从寅起顺数4月到巳宫（索引3），再从巳宫顺数5步 -> 戌（索引8）
  assert.equal(zw.shenGong, '戌', '农历四月巳时身宫应在戌');
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

test('标准case01：1986年丙寅年-金四局初九紫微在丑', () => {
  const inp: TimeInput = { year: 1986, month: 9, day: 12, hour: 3, minute: 10, second: 0 };
  const state = paipan(inp, 'time', [], 0, undefined, 'time', '男');
  const zw = state.panels.ziwei;
  // 丙年四化：天同禄、天机权、文昌科、廉贞忌
  const huaMap: Record<string, string> = {};
  for (const s of zw.siHua) huaMap[s.hua] = s.star;
  assert.equal(huaMap['化禄'], '天同', '丙年化禄应为天同');
  assert.equal(huaMap['化忌'], '廉贞', '丙年化忌应为廉贞');
  // 权威安星诀「除局求商余」：命宫未（乙未金四局）+ 农历初九 → 紫微在丑宫
  // （对照《紫微斗数精成》金四局逐日表：初九丑；命宫按《紫微斗数全书》安身命例
  //   从寅起顺数8月至酉，再从酉宫起子时逆数至寅时退2格 → 未）
  const zwPalace = zw.palaces.find(p => p.stars.includes('紫微'));
  assert.equal(zwPalace?.zhi, '丑', '金四局农历初九紫微应在丑（安紫微星诀除局求商余）');
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

// ── 紫微星定位逐日对照（权威依据：《紫微斗数精成》·缙长乐「紫微斗数排盘方法步骤总表」逐日表，
//    与《安星诀》口诀「六五四三二，酉午亥辰丑，局数除日数，商数宫前走」一致）──

/** 权威紫微星定位表（5 局 × 30 天 → 地支），用于全表对照 */
const ZIWEI_AUTHORITATIVE: Record<number, string[]> = {
  2: '丑寅寅卯卯辰辰巳巳午午未未申申酉酉戌戌亥亥子子丑丑寅寅卯卯辰'.split(''),
  3: '辰丑寅巳寅卯午卯辰未辰巳申巳午酉午未戌未申亥申酉子酉戌丑戌亥'.split(''),
  4: '亥辰丑寅子巳寅卯丑午卯辰寅未辰巳卯申巳午辰酉午未巳戌未申午亥'.split(''),
  5: '午亥辰丑寅未子巳寅卯申丑午卯辰酉寅未辰巳戌卯申巳午亥辰酉午未'.split(''),
  6: '酉午亥辰丑寅戌未子巳寅卯亥申丑午卯辰子酉寅未辰巳丑戌卯申巳午'.split(''),
};

test('紫微Z15：五行局+日数→紫微宫位 与权威逐日表全表一致（150 个值）', () => {
  const ZHI_ORDER = ['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑'];
  for (const ju of [2, 3, 4, 5, 6]) {
    const ref = ZIWEI_AUTHORITATIVE[ju];
    for (let day = 1; day <= 30; day++) {
      const got = ZHI_ORDER[calcZiweiPos(ju, day)];
      assert.equal(got, ref[day - 1], `局${ju} 第${day}日紫微应为${ref[day - 1]}，实际${got}`);
    }
  }
});

test('紫微Z16：书载验证例（安星诀算法例）', () => {
  // 例一：27日木三局 → 整除商9 → 从寅进9格 → 戌
  assert.equal(calcZiweiPos(3, 27), 8, '27日木三局紫微应在戌');
  // 例二：13日火六局 → 商3余5（奇数）→ 辰逆回5宫 → 亥
  assert.equal(calcZiweiPos(6, 13), 9, '13日火六局紫微应在亥');
  // 例三：6日土五局 → 商2余4（偶数）→ 卯顺行4格 → 未
  assert.equal(calcZiweiPos(5, 6), 5, '6日土五局紫微应在未');
});
