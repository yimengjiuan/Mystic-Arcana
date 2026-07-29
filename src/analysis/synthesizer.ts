/**
 * 综合分析模块
 * ------------------------------------------------------------------
 * 汇总六大面板信息，依易学之理综合评分。
 *
 * 评分权重（合计 100 分基础，各项加减分独立计算后汇总）：
 *   梅花易数 30% - 体用生克是梅花核心，吉凶最为直截
 *   六爻      25% - 动爻所临六亲定吉凶
 *   周易卦辞  20% - 卦辞、变卦辞蕴含吉凶指示
 *   小六壬    15% - 落宫定性，快速参考
 *   八字      10% - 日干生克辅助参考
 */
import type { CoreState, Synthesized } from '../types';

/**
 * 综合各面板数据生成分析结论。
 * @param state - 排盘核心状态
 * @returns 综合分析结果（趋势、评分、要点、提醒、建议）
 */
export function synthesize(state: CoreState): Synthesized {
  const points: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];

  // 各项独立评分（0-100），最终加权汇总
  let meihuaScore = 50;
  let liuyaoScore = 50;
  let zhouyiScore = 50;
  let xiaoliuScore = 50;
  let baziScore = 50;

  // ── 梅花易数：体用生克（权重 30%） ──
  const mh = state.panels.meihua;
  const interp = mh.interpretation;
  if (interp.includes('用生体')) {
    meihuaScore = 88;
    points.push('梅花体用：用生体，大吉，百事可成');
  } else if (interp.includes('体克用')) {
    meihuaScore = 72;
    points.push('梅花体用：体克用，所谋易成但需费力');
  } else if (interp.includes('比和')) {
    meihuaScore = 68;
    points.push('梅花体用：体用比和，谋事可成');
  } else if (interp.includes('体生用')) {
    meihuaScore = 38;
    warnings.push('梅花体用：体生用，付出多收获少');
  } else if (interp.includes('用克体')) {
    meihuaScore = 22;
    warnings.push('梅花体用：用克体，所谋难成，防损耗');
    recommendations.push('宜守不宜攻，待时而动');
  }

  // ── 六爻：动爻所临六亲（权重 25%） ──
  // 易学原则：子孙临动爻为福神（吉），财爻动主财（吉），
  // 官鬼动主忧（凶），父母动主辛劳（平偏凶），兄弟动主劫财（平偏凶）。
  const ly = state.panels.liuyao;
  const dongLiuQin = ly.liuQinMap.filter(lq => ly.dong.includes(lq.position));
  if (dongLiuQin.length > 0) {
    let lqScore = 0;
    for (const lq of dongLiuQin) {
      const name = lq.liuQin;
      if (name === '食神') {
        lqScore += 18; // 子孙爻动，主福气消解
        points.push(`六爻：${lq.position}爻临子孙动，主吉庆解难`);
      } else if (name === '财爻') {
        lqScore += 12; // 财爻动，主得财
        points.push(`六爻：${lq.position}爻临财爻动，主有财利`);
      } else if (name === '比肩') {
        lqScore += 0; // 兄弟爻动，主劫财竞争
        warnings.push(`六爻：${lq.position}爻临兄弟动，防破财竞争`);
      } else if (name === '印爻') {
        lqScore += 4; // 父母爻动，主辛劳但有庇护
        points.push(`六爻：${lq.position}爻临父母动，主辛劳有获`);
      } else if (name === '官鬼') {
        lqScore -= 16; // 官鬼爻动，主忧患是非
        warnings.push(`六爻：${lq.position}爻临官鬼动，主忧患是非`);
        recommendations.push('宜谨慎行事，防口舌官非');
      }
    }
    liuyaoScore = Math.max(10, Math.min(90, 50 + lqScore));
  }

  // ── 周易卦辞判定（权重 20%） ──
  const zy = state.panels.zhouyi;
  const bianCi = zy.guaCi.bian;
  if (zy.judgment === '大吉') {
    zhouyiScore = 82;
    points.push(`周易：变卦辞「${bianCi}」，大吉之象`);
  } else if (zy.judgment === '吉') {
    zhouyiScore = 68;
    points.push(`周易：变卦辞「${bianCi}」，吉象`);
  } else if (zy.judgment === '平') {
    zhouyiScore = 50;
    points.push(`周易：变卦辞「${bianCi}」，平象`);
  } else if (zy.judgment === '凶') {
    zhouyiScore = 28;
    warnings.push(`周易：变卦辞「${bianCi}」，凶象`);
    recommendations.push('宜谨慎，不可冒进');
  }

  // ── 小六壬落宫（权重 15%） ──
  switch (state.panels.xiaoliu.result) {
    case '大安':
      xiaoliuScore = 78;
      points.push('小六壬得大安，主事安稳');
      break;
    case '速喜':
      xiaoliuScore = 74;
      points.push('小六壬得速喜，主事速至');
      break;
    case '小吉':
      xiaoliuScore = 62;
      points.push('小六壬得小吉，主事小成');
      recommendations.push('宜小处着手');
      break;
    case '留连':
      xiaoliuScore = 42;
      warnings.push('小六壬留连，事有迟延');
      break;
    case '赤口':
      xiaoliuScore = 28;
      warnings.push('小六壬赤口，慎防口舌');
      recommendations.push('谨言慎行');
      break;
    case '空亡':
      xiaoliuScore = 20;
      warnings.push('小六壬空亡，事多虚耗');
      break;
  }

  // ── 八字日干五行平衡（权重 10%） ──
  // 以日干为自身，检测四柱天干中与日干同五行（比肩助身）的比例，
  // 以及生我（印）与克我（官杀）的分布，粗略判定日干强弱。
  const dayGan = state.bazi.day.gan;
  const wuXingMap: Record<string, string> = {
    '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土',
    '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水',
  };
  const dayEl = wuXingMap[dayGan] || '土';
  const shengMap: Record<string, string> = { '金': '土', '木': '水', '水': '金', '火': '木', '土': '火' };
  const keMap: Record<string, string> = { '金': '火', '木': '金', '水': '土', '火': '水', '土': '木' };
  const allGan = [state.bazi.year.gan, state.bazi.month.gan, state.bazi.day.gan, state.bazi.hour.gan];
  const myEl = wuXingMap[dayGan] || '';
  const sameEl = allGan.filter(g => wuXingMap[g] === myEl).length;
  const shengMe = allGan.filter(g => wuXingMap[g] === shengMap[myEl]).length;
  const keMe = allGan.filter(g => wuXingMap[g] === keMap[myEl]).length;
  // 比肩助身、印生身皆为身强；官杀克身为身弱
  const strength = sameEl + shengMe - keMe;
  if (strength >= 3) {
    baziScore = 65;
    points.push(`八字：日主${dayGan}（${dayEl}）身强，自身有力`);
  } else if (strength <= 0) {
    baziScore = 42;
    warnings.push(`八字：日主${dayGan}（${dayEl}）身弱，宜借助外力`);
    recommendations.push('宜合伙共事，不宜独力冒进');
  } else {
    baziScore = 52;
    points.push(`八字：日主${dayGan}（${dayEl}）中和，运势平稳`);
  }

  // ── 加权汇总 ──
  const score = Math.round(
    meihuaScore * 0.30 +
    liuyaoScore * 0.25 +
    zhouyiScore * 0.20 +
    xiaoliuScore * 0.15 +
    baziScore * 0.10
  );

  // 评分 -> 趋势映射
  let trend: Synthesized['trend'];
  if (score >= 85) trend = '上吉';
  else if (score >= 70) trend = '吉';
  else if (score >= 50) trend = '平';
  else if (score >= 30) trend = '凶';
  else trend = '大凶';

  const summary = `${state.hexagram.fullName}（${state.hexagram.palace}宫），动爻${state.moving.positions.join('、') || '无'}。` +
    `${points[0] || '诸象平和'}。${warnings[0] || ''}`;
  if (recommendations.length === 0) recommendations.push('顺势而为，稳中求进');

  return {
    summary,
    trend,
    score: Math.max(0, Math.min(100, score)),
    keyPoints: points,
    warnings,
    recommendations,
  };
}
