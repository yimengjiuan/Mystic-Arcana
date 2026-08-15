import { natalChart } from '../src/western.js';

// 爱因斯坦：1879-03-14 11:30 LMT，乌尔姆 48.4°N / 9.99°E
// LMT 时区偏移 = 9.99/15 = +0.6656 小时（→ UT 10:50）
const birth = {
  year: 1879, month: 3, day: 14,
  hour: 11, minute: 30, second: 0,
  longitude: 9.99, latitude: 48.4, timezone: 9.99 / 15,
};

const c = natalChart(birth);

// 参考值（Astrotheme / Astrian DE441 / Geocult Swiss Ephemeris）
const ref: Record<string, number> = {
  sun: 353.5,       // 双鱼 23°30'
  moon: 254.52,     // 射手 14°31'
  mercury: 3.14,    // 白羊 03°08'
  venus: 16.98,     // 白羊 16°59'
  mars: 296.9,      // 摩羯 26°54'
  jupiter: 327.48,  // 水瓶 27°29'
  saturn: 4.18,     // 白羊 04°11'
  uranus: 151.28,   // 处女 01°17'（逆行）
  neptune: 37.87,   // 金牛 07°52'
  pluto: 54.72,     // 金牛 24°43'
};

console.log('== 爱因斯坦本命盘行星黄经对比（参考：Swiss Ephemeris / JPL DE441）==');
for (const p of c.planets) {
  const r = ref[p.id];
  if (r === undefined) continue;
  let d = Math.abs(p.longitude - r);
  if (d > 180) d = 360 - d;
  const ret = p.retrograde ? ' (逆行)' : '';
  console.log(
    `${p.id.padEnd(8)} 引擎=${p.longitude.toFixed(3).padStart(8)}  参考=${r.toFixed(2).padStart(8)}  偏差=${d.toFixed(3)}°${ret}`
  );
}

console.log('\n== ASC / MC ==');
console.log(`ASC=${c.ascendant.toFixed(3)}° (${c.ascSign.name} ${(c.ascendant % 30).toFixed(1)}°)  ` +
  `参考：巨蟹 11°38'（101.63°）`);
console.log(`MC =${c.midheaven.toFixed(3)}° (${c.mcSign.name} ${(c.midheaven % 30).toFixed(1)}°)  ` +
  `参考：双鱼 12°50'（342.83°）`);
