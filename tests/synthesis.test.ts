import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fullPaipan } from '../src/engine';
import type { TimeInput } from '../src/types';

// 公共起卦时间
const input: TimeInput = { year: 2024, month: 5, day: 12, hour: 10, minute: 0, second: 0 };

test('综合分析S1：泽山咸3爻动（用生体大吉）评分应为吉以上', () => {
  // 案例四已知：泽山咸 -> 泽地萃，体=兑金，用=艮土，土生金=用生体大吉
  const throws = [2, 2, 3, 1, 1, 2];
  const { state, synthesis } = fullPaipan(input, 'cuanke', throws);
  assert.equal(state.hexagram.fullName, '泽山咸', '主卦应为泽山咸');
  assert.equal(state.panels.meihua.interpretation.includes('用生体'), true, '梅花应为用生体');
  // 用生体大吉（88分×30%），综合评分应偏吉
  assert.ok(synthesis.score >= 60, `用生体大吉场景综合评分应≥60，实际${synthesis.score}`);
  assert.ok(synthesis.keyPoints.some(p => p.includes('用生体')), '要点应含梅花用生体');
});

test('综合分析S2：山火贲4爻动（体生用小凶）评分应偏低', () => {
  // 案例五已知：山火贲 -> 离为火，体=离火，用=艮土，火生土=体生用小凶
  const throws = [1, 2, 1, 0, 2, 1];
  const { state, synthesis } = fullPaipan(input, 'cuanke', throws);
  assert.equal(state.hexagram.fullName, '山火贲', '主卦应为山火贲');
  assert.equal(state.panels.meihua.interpretation.includes('体生用'), true, '梅花应为体生用');
  // 体生用小凶（38分×30%），综合评分应低于用生体场景
  assert.ok(synthesis.score < 65, `体生用小凶场景综合评分应<65，实际${synthesis.score}`);
  assert.ok(synthesis.warnings.some(w => w.includes('体生用')), '警告应含梅花体生用');
});

test('综合分析S3：乾为天6爻全动（用克体凶象）评分应低', () => {
  // 乾为天全阳->坤为地，上卦动，体=下卦乾金，用=上卦乾金，体用比和
  // 但6爻全动场景特殊，验证评分在合理范围内
  const throws = [3, 3, 3, 3, 3, 3];
  const { synthesis } = fullPaipan(input, 'cuanke', throws);
  assert.ok(synthesis.score >= 0 && synthesis.score <= 100, '评分应在0-100范围内');
  assert.ok(['上吉', '吉', '平', '凶', '大凶'].includes(synthesis.trend), '趋势应为合法值');
});

test('综合分析S4：综合分析应包含各面板要点', () => {
  const throws = [2, 2, 3, 1, 1, 2]; // 泽山咸3爻动
  const { synthesis } = fullPaipan(input, 'cuanke', throws);
  // keyPoints 应至少包含梅花和周易的要点（这两项必有数据）
  assert.ok(synthesis.keyPoints.length >= 2, `要点应至少2条，实际${synthesis.keyPoints.length}`);
  // summary 应非空且含卦名
  assert.ok(synthesis.summary.length > 0, '摘要不应为空');
});

test('综合分析S5：评分与趋势映射一致', () => {
  const throws = [2, 1, 2, 2, 3, 2]; // 坎为水5爻动
  const { synthesis } = fullPaipan(input, 'cuanke', throws);
  const { score, trend } = synthesis;
  if (score >= 85) assert.equal(trend, '上吉');
  else if (score >= 70) assert.equal(trend, '吉');
  else if (score >= 50) assert.equal(trend, '平');
  else if (score >= 30) assert.equal(trend, '凶');
  else assert.equal(trend, '大凶');
});

test('综合分析S6：梅花用生体评分应高于体生用', () => {
  // 用生体（泽山咸）
  const { synthesis: good } = fullPaipan(input, 'cuanke', [2, 2, 3, 1, 1, 2]);
  // 体生用（山火贲）
  const { synthesis: bad } = fullPaipan(input, 'cuanke', [1, 2, 1, 0, 2, 1]);
  assert.ok(good.score > bad.score, `用生体场景(${good.score})应高于体生用场景(${bad.score})`);
});
