import { test } from 'node:test';
import assert from 'node:assert/strict';
import { paipan } from '../src/engine';
import { buildBazi } from '../src/utils/parser';
import { equationOfTime, trueSolarHour, dayGZ, hourGZ, getSolarTermYear, getSolarMonth } from '../src/utils/calendar';
import { buildBaziPanel } from '../src/panels/bazi';
import type { TimeInput, Bazi } from '../src/types';

// ============================================================
// 任务 1：真太阳时校准
// ============================================================

test('EoT1: 均时差 2 月中旬约 -14 分钟、11 月初约 +16 分钟', () => {
  const feb = equationOfTime(2024, 2, 4);
  assert.ok(feb > -20 && feb < -10, `2024-02-04 均时差应在 -20~-10 分钟，实际 ${feb}`);
  const nov = equationOfTime(2024, 11, 3);
  assert.ok(nov > 10 && nov < 20, `2024-11-03 均时差应在 10~20 分钟，实际 ${nov}`);
});

test('EoT2: 经度 120° 时真太阳时只含均时差项', () => {
  const ts = trueSolarHour(2024, 6, 1, 12, 120);
  assert.equal(ts, 12 + equationOfTime(2024, 6, 1) / 60, '经度 120° 时仅叠加均时差');
});

test('EoT3: buildBazi 经度 120°（东经基准线）不改变四柱', () => {
  const base = buildBazi(2024, 5, 12, 23);
  const corrected = buildBazi(2024, 5, 12, 23, { longitude: 120 });
  assert.equal(corrected.day.ganzhi, base.day.ganzhi, '经度 120° 日柱不变');
  assert.equal(corrected.hour.ganzhi, base.hour.ganzhi, '经度 120° 时柱不变');
});

test('EoT4: 经度 138° 使 23 时修正后跨日，日柱取次日', () => {
  const corrected = buildBazi(2024, 5, 12, 23, { longitude: 138 });
  const nextDay = buildBazi(2024, 5, 13, 0); // 修正后约 0 时（子时），日柱应为次日
  assert.equal(corrected.day.ganzhi, nextDay.day.ganzhi, '东经 138° 修正约 +1.2 小时，23 时应跨入次日子时');
  assert.equal(corrected.hour.zhi, '子', '跨日后仍为子时');
});

test('EoT5: 经度 87.6°（乌鲁木齐）正午 12 时修正后入巳时', () => {
  const corrected = buildBazi(2024, 5, 12, 12, { longitude: 87.6 });
  assert.equal(corrected.hour.zhi, '巳', '乌鲁木齐约 -2.2 小时，12 时应修正为巳时');
  assert.equal(buildBazi(2024, 5, 12, 12).hour.zhi, '午', '默认北京时间 12 时为午时');
});

test('EoT6: 不传经度时行为与旧版完全一致（向后兼容）', () => {
  const a = buildBazi(1992, 5, 12, 10);
  const b = buildBazi(1992, 5, 12, 10, {});
  assert.deepEqual(a, b, '空参数对象不应改变任何输出');
});

// ============================================================
// 任务 2：节气判定改用精确交节
// ============================================================

test('JQ1: 2024 立春（2月4日 16:27 交节）前后年柱切换', () => {
  assert.equal(getSolarTermYear(2024, 2, 4, 10), 2023, '立春交节前仍属上年');
  assert.equal(getSolarTermYear(2024, 2, 4, 20), 2024, '立春交节后属当年');
  assert.equal(getSolarTermYear(2024, 2, 5, 0), 2024, '立春次日属当年');
});

test('JQ2: 2021 立春在 2 月 3 日 22:58（固定表 2/4 会判错）', () => {
  assert.equal(getSolarTermYear(2021, 2, 3, 22), 2020, '2021-02-03 22 时仍在立春前');
  assert.equal(getSolarTermYear(2021, 2, 3, 23), 2021, '2021-02-03 23 时已过立春');
});

test('JQ3: 立春当天月柱按交节时刻切换（丑月->寅月）', () => {
  assert.equal(getSolarMonth(2024, 2, 4, 10), 12, '2024-02-04 10 时为丑月');
  assert.equal(getSolarMonth(2024, 2, 4, 20), 1, '2024-02-04 20 时为寅月');
  assert.equal(getSolarMonth(2021, 2, 3, 23), 1, '2021-02-03 23 时为寅月');
  assert.equal(getSolarMonth(2021, 2, 3, 22), 12, '2021-02-03 22 时为丑月');
});

test('JQ4: buildBazi 年柱/月柱随精确交节切换', () => {
  const before = buildBazi(2024, 2, 4, 10);
  assert.equal(before.year.ganzhi, '癸卯', '交节前年柱为 2023 癸卯');
  assert.equal(before.month.ganzhi, '乙丑', '交节前月柱为丑月乙丑');
  const after = buildBazi(2024, 2, 4, 20);
  assert.equal(after.year.ganzhi, '甲辰', '交节后年柱为 2024 甲辰');
  assert.equal(after.month.ganzhi, '丙寅', '交节后月柱为寅月丙寅');
});

// ============================================================
// 任务 3：晚子时模式开关
// ============================================================

test('WZS1: 默认（零点换日）23 时日柱仍为当天', () => {
  const late23 = buildBazi(2024, 5, 12, 23);
  const early0 = buildBazi(2024, 5, 12, 0);
  assert.equal(late23.day.ganzhi, early0.day.ganzhi, '零点换日流派 23 时与 0 时同属当日子时');
});

test('WZS2: 晚子时（23点换日）23 时日柱取次日、时干按次日日干', () => {
  const late23 = buildBazi(2024, 5, 12, 23, { lateZiShi: true });
  const nextDay = dayGZ(2024, 5, 13);
  assert.equal(late23.day.ganzhi, nextDay, '晚子时流派 23 时日柱应取次日');
  assert.equal(late23.hour.ganzhi, hourGZ(nextDay, 23).gz, '晚子时时干应按次日日干推（五鼠遁）');
  assert.equal(late23.hour.zhi, '子', '时支仍为子');
});

test('WZS3: 晚子时不影响非 23 时', () => {
  const a = buildBazi(2024, 5, 12, 10, { lateZiShi: true });
  const b = buildBazi(2024, 5, 12, 10);
  assert.equal(a.day.ganzhi, b.day.ganzhi, '晚子时开关不影响其他时辰');
});

// ============================================================
// 任务 4：桃花（咸池）按三合局判定
// ============================================================

/** 构造最小 Bazi 对象（仅需四柱地支与日干） */
function mkBazi(yz: string, mz: string, dz: string, hz: string): Bazi {
  return {
    year: { gan: '甲', zhi: yz, ganzhi: '甲' + yz },
    month: { gan: '丙', zhi: mz, ganzhi: '丙' + mz },
    day: { gan: '戊', zhi: dz, ganzhi: '戊' + dz },
    hour: { gan: '壬', zhi: hz, ganzhi: '壬' + hz },
    solarTermYear: 2024,
    lunar: { year: 2024, month: 1, day: 1, isLeap: false },
    solarTermNext: '子',
  };
}

test('TH1: 申子辰见酉（年支申 + 时支酉）', () => {
  const b = mkBazi('申', '子', '辰', '酉');
  assert.ok(buildBaziPanel(b).summary.includes('桃花'), '年支申（水局）见酉应为桃花');
});

test('TH2: 亥卯未见子（日支未 + 时支子）', () => {
  const b = mkBazi('亥', '卯', '未', '子');
  assert.ok(buildBaziPanel(b).summary.includes('桃花'), '日支未（木局）见子应为桃花');
});

test('TH3: 寅午戌见卯（日支午 + 时支卯）', () => {
  const b = mkBazi('辰', '申', '午', '卯');
  assert.ok(buildBaziPanel(b).summary.includes('桃花'), '日支午（火局）见卯应为桃花');
});

test('TH4: 无桃花组合', () => {
  const b = mkBazi('寅', '巳', '未', '丑');
  assert.ok(buildBaziPanel(b).summary.includes('命局平和'), '寅（卯位）、未（子位）四柱无对应地支，不应有桃花');
});

test('TH5: 月支子午卯酉但无三合对应不误报桃花', () => {
  // 月支酉、日支子：日支子（水局）桃花在酉，月支酉正好是桃花位 → 应报桃花
  const b = mkBazi('寅', '酉', '子', '巳');
  assert.ok(buildBaziPanel(b).summary.includes('桃花'), '日支子见月支酉应为桃花');
});

// ============================================================
// 引擎透传验证
// ============================================================

test('ENG1: paipan 透传经度/晚子时参数', () => {
  const input: TimeInput = { year: 2024, month: 5, day: 12, hour: 23, minute: 0, second: 0 };
  const normal = paipan(input, 'time');
  const late = paipan(input, 'time', [], 0, undefined, 'time', undefined, undefined, { lateZiShi: true });
  assert.notEqual(late.bazi.day.ganzhi, normal.bazi.day.ganzhi, '晚子时模式日柱应切换');
  assert.equal(late.bazi.day.ganzhi, dayGZ(2024, 5, 13), '晚子时模式日柱应为次日');
});
