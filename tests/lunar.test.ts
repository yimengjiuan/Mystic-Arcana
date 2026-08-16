import { test } from 'node:test';
import assert from 'node:assert/strict';
import { solarToLunar } from '../src/data/lunar';

// ── 农历转换范围校验：LUNAR_DATA 仅覆盖 1900-2049 年，越界应显式抛错而非静默返回错误结果 ──

test('农历L1：1899-12-31（小于下限）转换应抛出明确错误', () => {
  assert.throws(() => solarToLunar(1899, 12, 31), /1900-2049/, '越界应提示支持范围');
});

test('农历L2：2050-01-01（大于上限）转换应抛出明确错误', () => {
  assert.throws(() => solarToLunar(2050, 1, 1), /1900-2049/, '越界应提示支持范围');
});

test('农历L3：错误信息应包含实际输入年份', () => {
  assert.throws(() => solarToLunar(1899, 6, 15), /1899/, '错误信息应含实际年份');
  assert.throws(() => solarToLunar(2050, 6, 15), /2050/, '错误信息应含实际年份');
});

test('农历L4：边界年份仍可正常转换（1900 与 2049）', () => {
  // 1900-02-01 = 正月初二（LUNAR_BASE 1900-01-31 为正月初一）
  const early = solarToLunar(1900, 2, 1);
  assert.equal(early.year, 1900);
  assert.equal(early.month, 1);
  assert.equal(early.day, 2);
  // 2049 年末仍在支持范围内
  const late = solarToLunar(2049, 12, 31);
  assert.equal(late.year, 2049, '2049-12-31 农历年应为 2049');
});
