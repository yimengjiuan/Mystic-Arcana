// 综合分析面板
import { CoreState, Synthesized } from '../types';

export function synthesize(state: CoreState): Synthesized {
  const points: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];
  let score = 60;

  switch (state.panels.xiaoliu.result) {
    case '大安': score += 12; points.push('小六壬得大安，主事安稳'); break;
    case '速喜': score += 10; points.push('小六壬得速喜，主事速至'); break;
    case '小吉': score += 6; points.push('小六壬得小吉，主事小成'); recommendations.push('宜小处着手'); break;
    case '留连': score -= 5; warnings.push('小六壬留连，事有迟延'); break;
    case '赤口': score -= 12; warnings.push('小六壬赤口，慎防口舌'); recommendations.push('谨言慎行'); break;
    case '空亡': score -= 18; warnings.push('小六壬空亡，事多虚耗'); break;
  }

  switch (state.panels.zhouyi.judgment) {
    case '大吉': score += 15; points.push('周易卦辞大吉'); break;
    case '吉': score += 8; points.push('周易卦辞吉'); break;
    case '平': score += 0; recommendations.push('保持现状观察'); break;
    case '凶': score -= 12; warnings.push('周易卦辞有凶'); break;
  }

  if (state.panels.meihua.interpretation.includes('大吉')) {
    score += 8; points.push('梅花体用相生');
  } else if (state.panels.meihua.interpretation.includes('大凶') || state.panels.meihua.interpretation.includes('难成')) {
    score -= 8; warnings.push('梅花体用相克');
  }

  if (state.moving.positions.length === 0) {
    recommendations.push('无动爻，主静守');
  } else if (state.moving.positions.length >= 3) {
    score -= 5; warnings.push('动爻过多，事多变数');
  }

  if (state.panels.bazi.year.ganzhi === state.panels.bazi.day.ganzhi) {
    score += 5; points.push('年日同干，自信自立');
  }

  if (state.panels.ziwei.summary.includes('庙旺')) {
    score += 6; points.push('紫微庙旺');
  }

  let trend: Synthesized['trend'];
  if (score >= 85) trend = '上吉';
  else if (score >= 70) trend = '吉';
  else if (score >= 50) trend = '平';
  else if (score >= 30) trend = '凶';
  else trend = '大凶';

  const summary = `${state.hexagram.fullName}（${state.hexagram.palace}宫），动爻${state.moving.positions.join('、') || '无'}。${points[0] || '诸象平和'}。${warnings[0] || ''}`;

  if (recommendations.length === 0) recommendations.push('顺势而为，稳中求进');

  return {
    summary,
    trend,
    score: Math.max(0, Math.min(100, score)),
    keyPoints: points,
    warnings,
    recommendations
  };
}
