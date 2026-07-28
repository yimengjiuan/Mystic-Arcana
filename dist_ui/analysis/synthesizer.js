/**
 * 综合各面板数据生成分析结论。
 * @param state - 排盘核心状态
 * @returns 综合分析结果（趋势、评分、要点、提醒、建议）
 */
export function synthesize(state) {
    const points = [];
    const warnings = [];
    const recommendations = [];
    let score = 60; // 基础分
    // 以小六壬结果为主要评分依据
    switch (state.panels.xiaoliu.result) {
        case '大安':
            score += 12;
            points.push('小六壬得大安，主事安稳');
            break;
        case '速喜':
            score += 10;
            points.push('小六壬得速喜，主事速至');
            break;
        case '小吉':
            score += 6;
            points.push('小六壬得小吉，主事小成');
            recommendations.push('宜小处着手');
            break;
        case '留连':
            score -= 5;
            warnings.push('小六壬留连，事有迟延');
            break;
        case '赤口':
            score -= 12;
            warnings.push('小六壬赤口，慎防口舌');
            recommendations.push('谨言慎行');
            break;
        case '空亡':
            score -= 18;
            warnings.push('小六壬空亡，事多虚耗');
            break;
    }
    // 评分 -> 趋势映射
    let trend;
    if (score >= 85)
        trend = '上吉';
    else if (score >= 70)
        trend = '吉';
    else if (score >= 50)
        trend = '平';
    else if (score >= 30)
        trend = '凶';
    else
        trend = '大凶';
    const summary = `${state.hexagram.fullName}（${state.hexagram.palace}宫），动爻${state.moving.positions.join('、') || '无'}。${points[0] || '诸象平和'}。${warnings[0] || ''}`;
    if (recommendations.length === 0)
        recommendations.push('顺势而为，稳中求进');
    return {
        summary,
        trend,
        score: Math.max(0, Math.min(100, score)),
        keyPoints: points,
        warnings,
        recommendations,
    };
}
