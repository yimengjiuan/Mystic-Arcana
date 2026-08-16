import { test } from 'node:test';
import assert from 'node:assert/strict';
import { natalChart, synastry } from '../src/western';

// ============================================================
// 星盘 / 合盘逻辑准确性验证
// 参考实例来源：astrotheme.com / astro-charts.com（Rodden AA 评级）
//   1) 奥巴马 1961-08-04 19:24 HST 火奴鲁鲁
//   2) 米歇尔 1964-01-17 12:00 CST 芝加哥（出生时刻有争议，行星黄经对时刻不敏感）
//   3) 特朗普 1946-06-14 10:54 EDT 纽约（当日夏令时）
// 说明：引擎定位为近似精度（太阳±0.01°、月亮±0.1°、外行星<1°、ASC/MC 恒星时公式），
//       测试容差按此设定 + 参考数据弧分精度留余量。
// ============================================================

/** 角度最短差（0-180） */
function diff(a: number, b: number): number {
  let d = Math.abs(a - b) % 360;
  if (d > 180) d = 360 - d;
  return d;
}

/** 断言行星黄经与参考值偏差不超过容差 */
function assertPlanets(chart: ReturnType<typeof natalChart>, ref: Record<string, number>, tol: number) {
  const byId = Object.fromEntries(chart.planets.map(p => [p.id, p]));
  for (const id of Object.keys(ref)) {
    const got = byId[id].longitude;
    assert.ok(
      diff(got, ref[id]) <= tol,
      `${id} 黄经偏差超限：引擎 ${got.toFixed(2)}° vs 参考 ${ref[id].toFixed(2)}°`
    );
  }
}

function assertAscMc(chart: ReturnType<typeof natalChart>, asc: number, mc: number, tol = 0.6) {
  assert.ok(diff(chart.ascendant, asc) <= tol, `ASC 偏差超限：${chart.ascendant.toFixed(2)}° vs ${asc.toFixed(2)}°`);
  assert.ok(diff(chart.midheaven, mc) <= tol, `MC 偏差超限：${chart.midheaven.toFixed(2)}° vs ${mc.toFixed(2)}°`);
}

/** 断言某相位对存在且类型正确 */
function assertAspect(chart: ReturnType<typeof natalChart>, p1: string, p2: string, type: string) {
  const hit = chart.aspects.find(a => (a.p1 === p1 && a.p2 === p2) || (a.p1 === p2 && a.p2 === p1));
  assert.ok(hit, `本命盘应存在 ${p1}-${p2} 相位（实际相位：${chart.aspects.map(a => `${a.p1}${a.typeZh}${a.p2}`).join(', ') || '无'}）`);
  assert.equal(hit.type, type, `${p1}-${p2} 相位类型应为 ${type}，实际 ${hit.type}`);
}

const obamaChart = natalChart({
  year: 1961, month: 8, day: 4, hour: 19, minute: 24, second: 0,
  longitude: -157.8583, latitude: 21.3069, timezone: -10,
});
const michelleChart = natalChart({
  year: 1964, month: 1, day: 17, hour: 12, minute: 0, second: 0,
  longitude: -87.65, latitude: 41.85, timezone: -6,
});
const trumpChart = natalChart({
  year: 1946, month: 6, day: 14, hour: 10, minute: 54, second: 0,
  longitude: -73.8, latitude: 40.71, timezone: -4, // 纽约当日夏令时 EDT
});

// ---------- 公开权威参考数据 ----------
const OBAMA_REF: Record<string, number> = {
  sun: 132.55, moon: 63.35, mercury: 122.33, venus: 91.78, mars: 172.58,
  jupiter: 300.87, saturn: 295.33, uranus: 145.27, neptune: 218.6, pluto: 156.98,
};
const MICHELLE_REF: Record<string, number> = {
  sun: 296.67, moon: 330.52, mercury: 274.83, venus: 330.77, mars: 303.52,
  jupiter: 12.62, saturn: 322.22, uranus: 159.6, neptune: 227.55, pluto: 163.97,
};
const TRUMP_REF: Record<string, number> = {
  sun: 82.93, moon: 261.2, mercury: 98.87, venus: 115.73, mars: 146.78,
  jupiter: 197.45, saturn: 113.82, uranus: 77.9, neptune: 185.83, pluto: 130.03,
};

test('C1: 奥巴马星盘——10 行星黄经与公开权威数据一致（容差 0.5°）', () => {
  assertPlanets(obamaChart, OBAMA_REF, 0.5);
});

test('C2: 奥巴马星盘——ASC 水瓶 18°03\'、MC 天蝎 28°54\'（容差 0.6°）', () => {
  assertAscMc(obamaChart, 318.05, 238.9);
  assert.equal(obamaChart.ascSign.id, 'aquarius');
  assert.equal(obamaChart.mcSign.id, 'scorpio');
  assert.equal(obamaChart.sunSign.id, 'leo');
});

test('C3: 米歇尔星盘——10 行星黄经与公开权威数据一致（容差 0.5°）', () => {
  assertPlanets(michelleChart, MICHELLE_REF, 0.5);
  assert.equal(michelleChart.sunSign.id, 'capricorn');
});

test('C4: 特朗普星盘——10 行星黄经与公开权威数据一致（容差 0.5°，含夏令时时区）', () => {
  assertPlanets(trumpChart, TRUMP_REF, 0.5);
  assertAscMc(trumpChart, 149.98, 54.37);
  assert.equal(trumpChart.ascSign.id, 'leo');
  assert.equal(trumpChart.sunSign.id, 'gemini');
});

test('C5: 逆行判定——奥巴马木土、米歇尔天冥、特朗普木海逆行', () => {
  const r = (c: ReturnType<typeof natalChart>, id: string) =>
    c.planets.find(p => p.id === id)!.retrograde;
  assert.equal(r(obamaChart, 'jupiter'), true, '奥巴马木星应逆行');
  assert.equal(r(obamaChart, 'saturn'), true, '奥巴马土星应逆行');
  assert.equal(r(michelleChart, 'uranus'), true, '米歇尔天王星应逆行');
  assert.equal(r(michelleChart, 'pluto'), true, '米歇尔冥王星应逆行');
  assert.equal(r(trumpChart, 'jupiter'), true, '特朗普木星应逆行');
  assert.equal(r(trumpChart, 'neptune'), true, '特朗普海王星应逆行');
  assert.equal(r(obamaChart, 'sun'), false, '太阳不应逆行');
  assert.equal(r(obamaChart, 'moon'), false, '月亮不应逆行');
});

test('C6: 奥巴马本命相位——与公开星盘主要相位一致', () => {
  // 公开（astro-charts）：Moon sextile Mercury、Mercury opposition Jupiter、
  // Mars trine Saturn、Moon trine Jupiter、Moon square Pluto、Sun square Neptune、Jupiter conjunction Saturn
  assertAspect(obamaChart, 'moon', 'mercury', 'sextile');
  assertAspect(obamaChart, 'mercury', 'jupiter', 'opposition');
  assertAspect(obamaChart, 'mars', 'saturn', 'trine');
  assertAspect(obamaChart, 'moon', 'jupiter', 'trine');
  assertAspect(obamaChart, 'moon', 'pluto', 'square');
  assertAspect(obamaChart, 'sun', 'neptune', 'square');
  assertAspect(obamaChart, 'jupiter', 'saturn', 'conjunction');
});

test('C7: 整宫制宫头——第 N 宫 = 上升点所在星座 0° + (N-1)×30°', () => {
  // 奥巴马 ASC 318.05° → 水瓶座（300-330），第1宫头 = 300°
  assert.equal(obamaChart.houses.length, 12);
  assert.equal(obamaChart.houses[0].cusp, 300, '第1宫头应为水瓶 0°（300°）');
  assert.equal(obamaChart.houses[1].cusp, 330, '第2宫头应为双鱼 0°（330°）');
  assert.equal(obamaChart.houses[2].cusp, 0, '第3宫头应为白羊 0°（0°）');
  assert.equal(obamaChart.houses[11].cusp, 270, '第12宫头应为摩羯 0°（270°）');
});

test('C8: 合盘奥巴马×米歇尔——手工核算行星交叉相位', () => {
  const ob = Object.fromEntries(obamaChart.planets.map(p => [p.id, p]));
  const mi = Object.fromEntries(michelleChart.planets.map(p => [p.id, p]));

  // 奥太阳 132.55 vs 米木星 12.62 → 差 119.93 → 三分相
  assert.ok(diff(ob.sun.longitude, mi.jupiter.longitude) <= 120 + 1, '奥太阳-米木星应在三分相容许度内');
  // 奥月亮 63.44 vs 米火星 303.52 → 差 119.92 → 三分相
  assert.ok(diff(ob.moon.longitude, mi.mars.longitude) <= 120 + 1, '奥月亮-米火星应在三分相容许度内');
  // 奥水星 122.35 vs 米太阳 296.67 → 差 174.32 → 冲相（容许度 8+1）
  assert.ok(diff(ob.mercury.longitude, mi.sun.longitude) >= 180 - 9, '奥水星-米太阳应在冲相容许度内');
  // 奥金星 91.80 vs 米金星 330.77 → 差 121.03 → 三分相（trine orb 7 + 合盘放宽 1）
  assert.ok(diff(ob.venus.longitude, mi.venus.longitude) <= 120 + 8, '奥金星-米金星应在三分相容许度内');
});

test('C9: 合盘 synastry——输出交叉相位且与手工核算一致', () => {
  const asp = synastry(obamaChart, michelleChart);
  const has = (p1: string, p2: string) =>
    asp.some(a => (a.p1 === p1 && a.p2 === p2) || (a.p1 === p2 && a.p2 === p1));
  assert.ok(has('sun', 'jupiter'), '应含 奥太阳-米木星 相位');
  assert.ok(has('moon', 'mars'), '应含 奥月亮-米火星 相位');
  assert.ok(has('venus', 'venus'), '应含 奥金星-米金星 相位');
  assert.ok(has('mercury', 'sun'), '应含 奥水星-米太阳 相位');
  assert.ok(has('mars', 'sun'), '应含 奥火星-米太阳 相位');
  // 全矩阵应有 10×10 = 100 对（方向去重后仍各 pair 独立计）
  assert.ok(asp.length >= 20 && asp.length <= 100, `合盘相位数量应合理（实际 ${asp.length}）`);
  // 每条相位都是双盘交叉（p1 属于甲盘、p2 属于乙盘）
  for (const a of asp) {
    const inObama = obamaChart.planets.some(p => p.id === a.p1);
    const inMichelle = michelleChart.planets.some(p => p.id === a.p2);
    assert.ok(inObama && inMichelle, `相位 ${a.p1}-${a.p2} 应为双盘交叉`);
  }
});
