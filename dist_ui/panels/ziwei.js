const ZIWEI_GONG = ['命宫', '兄弟', '夫妻', '子女', '财帛', '疾厄', '迁移', '交友', '官禄', '田宅', '福德', '父母'];
const ZIWEI_STARS = [{ star: '紫微', ji: 0, level: '帝' }, { star: '天机', ji: 1, level: '善' }, { star: '太阳', ji: 2, level: '贵' }, { star: '武曲', ji: 3, level: '财' }, { star: '天同', ji: 4, level: '福' }, { star: '廉贞', ji: 5, level: '杀' }, { star: '天府', ji: 6, level: '后' }, { star: '太阴', ji: 7, level: '财' }, { star: '贪狼', ji: 8, level: '杀' }, { star: '巨门', ji: 9, level: '暗' }, { star: '天相', ji: 10, level: '印' }, { star: '天梁', ji: 11, level: '荫' }];
const WUXING_JU = ['水二局', '木三局', '金四局', '土五局', '火六局'];
export function buildZiWei(bazi) { const zhi = bazi.day.zhi; const order = ['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑']; const mingIdx = (order.indexOf(zhi) + order.indexOf(bazi.hour.zhi)) % 12; const shenIdx = (mingIdx + 6) % 12; const mingGong = ZIWEI_GONG[mingIdx]; const shenGong = ZIWEI_GONG[shenIdx]; const wuXingJu = WUXING_JU[mingIdx % 5]; const mainStars = ZIWEI_STARS.slice(0, 6).map((s, i) => ({ star: s.star, gong: ZIWEI_GONG[(mingIdx + s.ji) % 12], brightness: ['庙', '旺', '得', '利', '平', '陷'][i % 6] })); let summary = `${mingGong}${wuXingJu}，主星${mainStars[0]?.star || '紫微'}坐命。`; if (mainStars.some(s => s.star === '紫微' && s.brightness === '庙'))
    summary += '紫微庙旺，格局清高。';
else if (mainStars.some(s => s.star === '贪狼'))
    summary += '贪狼入命，多才多艺。';
else
    summary += '命格平和，宜稳中求进。'; return { mingGong, shenGong, wuXingJu, mainStars, summary }; }
