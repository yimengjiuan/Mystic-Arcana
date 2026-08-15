import { natalChart } from '../src/western.js';

const birth = {
  year: 2000, month: 1, day: 1,
  hour: 12, minute: 0, second: 0,
  longitude: 0, latitude: 0, timezone: 0,
};

const c = natalChart(birth);
const ref: Record<string, number> = {
  sun: 280.369, moon: 223.324, mercury: 271.889, venus: 241.566,
  mars: 327.963, jupiter: 25.253, saturn: 40.3956, uranus: 314.809,
  neptune: 303.193, pluto: 251.455,
};

console.log('== 行星黄经对比（J2000.0, 2000-01-01 12:00 UT）==');
for (const p of c.planets) {
  const r = ref[p.id];
  if (r === undefined) continue;
  let d = Math.abs(p.longitude - r);
  if (d > 180) d = 360 - d;
  console.log(
    `${p.id.padEnd(8)} 引擎=${p.longitude.toFixed(3).padStart(8)}  瑞士=${r.toFixed(3).padStart(8)}  偏差=${d.toFixed(3)}°`
  );
}

console.log('\n== ASC / MC ==');
console.log(`ASC=${c.ascendant.toFixed(3)}° (${c.ascSign.name})  MC=${c.midheaven.toFixed(3)}° (${c.mcSign.name})`);

console.log('\n== 太阳星座 ==');
console.log(`sunSign=${c.sunSign.name}`);
