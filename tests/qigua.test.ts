import { test } from 'node:test';
import assert from 'node:assert/strict';
import { timeQiGua, zaobiQiGua } from '../src/utils/qigua';
import { solarToLunar } from '../src/data/lunar';
import type { TimeInput } from '../src/types';

// ============ 梅花易数时间起卦：动爻 = (年支+月+日+时) % 6，不含秒数 ============

test('时间起卦：同一时辰不同秒数，结果完全一致', () => {
  const base: TimeInput = { year: 2024, month: 5, day: 12, hour: 10, minute: 0, second: 0 };
  const first = timeQiGua(base);
  for (let s = 0; s <= 59; s++) {
    const r = timeQiGua({ ...base, second: s });
    assert.deepEqual(r, first, `second=${s} 时结果应与 second=0 完全一致`);
  }
});

test('时间起卦：动爻等于 (年支+月+日+时) % 6 的标准值', () => {
  // 2025-10-30 16:00 → 农历乙巳年九月初十，申时（序数 9）
  // 动爻 = (6 巳 + 9 月 + 10 日 + 9 申) % 6 = 34 % 6 = 4 → 四爻动
  const input: TimeInput = { year: 2025, month: 10, day: 30, hour: 16, minute: 0, second: 0 };
  const lunar = solarToLunar(input.year, input.month, input.day);
  assert.deepEqual([lunar.year, lunar.month, lunar.day], [2025, 9, 10], '农历转换应返回乙巳年九月初十');
  const r = timeQiGua(input);
  assert.deepEqual(r.moving, [4]);
});

test('时间起卦：生辰叠加（time_bazi）时，不同生辰秒数结果一致', () => {
  const input: TimeInput = { year: 2024, month: 5, day: 12, hour: 10, minute: 0, second: 0 };
  const birthA: TimeInput = { year: 1990, month: 3, day: 8, hour: 6, minute: 0, second: 0 };
  const birthB: TimeInput = { ...birthA, second: 45 };
  assert.deepEqual(timeQiGua(input, birthA, 'time_bazi'), timeQiGua(input, birthB, 'time_bazi'));
});

// ============ 蓍草起卦：四象概率符合大衍筮法标准分布 1:5:7:3 ============

test('蓍草起卦：同一 seed 结果确定（确定性）', () => {
  const input: TimeInput = { year: 2024, month: 5, day: 12, hour: 10, minute: 0, second: 0 };
  assert.deepEqual(zaobiQiGua(input, 42), zaobiQiGua(input, 42));
});

test('蓍草起卦：四象概率符合大衍筮法标准分布（老阴1/16、少阳5/16、少阴7/16、老阳3/16）', () => {
  const input: TimeInput = { year: 2024, month: 5, day: 12, hour: 10, minute: 0, second: 0 };
  const counts = { laoYin: 0, shaoYang: 0, shaoYin: 0, laoYang: 0 };
  const total = 10000 * 6; // seed 0-9999 × 6 爻
  for (let seed = 0; seed < 10000; seed++) {
    const r = zaobiQiGua(input, seed);
    for (let i = 0; i < 6; i++) {
      const yang = r.lines[i] === true;
      const moving = r.moving.includes(i + 1);
      if (moving && !yang) counts.laoYin++;
      else if (moving && yang) counts.laoYang++;
      else if (!moving && yang) counts.shaoYang++;
      else counts.shaoYin++;
    }
  }
  const p = (n: number) => n / total;
  assert.ok(Math.abs(p(counts.laoYin) - 1 / 16) < 0.03, `老阴概率 ${p(counts.laoYin)} 偏离标准值 1/16`);
  assert.ok(Math.abs(p(counts.shaoYang) - 5 / 16) < 0.03, `少阳概率 ${p(counts.shaoYang)} 偏离标准值 5/16`);
  assert.ok(Math.abs(p(counts.shaoYin) - 7 / 16) < 0.03, `少阴概率 ${p(counts.shaoYin)} 偏离标准值 7/16`);
  assert.ok(Math.abs(p(counts.laoYang) - 3 / 16) < 0.03, `老阳概率 ${p(counts.laoYang)} 偏离标准值 3/16`);
});
