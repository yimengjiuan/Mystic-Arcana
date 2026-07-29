/**
 * 紫微斗数排盘面板
 * ------------------------------------------------------------------
 * 严格依紫微斗数排盘规则实现：
 *   1. 定命宫：从寅宫起，顺数生月，再逆数生时
 *   2. 定身宫：从寅宫起，顺数生月，再顺数生时
 *   3. 定五行局：命宫天干+地支 -> 纳音五行局
 *   4. 定紫微星：由五行局+农历日数查表定位
 *   5. 天府对宫：天府与紫微以寅申线对称
 *   6. 四化：按年干定四化星
 *   7. 大限：阳男阴女顺行，阴男阳女逆行
 */
import type { ZiWeiPanel } from '../types';
import type { Bazi } from '../types';

/** 十二地支顺序（寅为首，紫微斗数定命宫从寅起） */
const ZHI_ORDER = ['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑'];

/** 传统地支顺序（子为首，用于时辰序数推算） */
const DIZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

/** 十二宫位名称（从命宫起逆时针排列） */
const GONG_NAMES = ['命宫', '兄弟', '夫妻', '子女', '财帛', '疾厄', '迁移', '交友', '官禄', '田宅', '福德', '父母'];

/** 天干顺序 */
const TIAN_GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];

/**
 * 六十甲子纳音五行局表。
 * 紫微斗数五行局取命宫纳音五行，配以局数：
 *   水二局、木三局、金四局、土五局、火六局
 */
const NAYIN_JU: Record<string, string> = {
  '甲子': '金四局', '乙丑': '金四局', '丙寅': '火六局', '丁卯': '火六局',
  '戊辰': '木三局', '己巳': '木三局', '庚午': '土五局', '辛未': '土五局',
  '壬申': '金四局', '癸酉': '金四局', '甲戌': '火六局', '乙亥': '火六局',
  '丙子': '水二局', '丁丑': '水二局', '戊寅': '土五局', '己卯': '土五局',
  '庚辰': '金四局', '辛巳': '金四局', '壬午': '木三局', '癸未': '木三局',
  '甲申': '水二局', '乙酉': '水二局', '丙戌': '土五局', '丁亥': '土五局',
  '戊子': '火六局', '己丑': '火六局', '庚寅': '木三局', '辛卯': '木三局',
  '壬辰': '水二局', '癸巳': '水二局', '甲午': '金四局', '乙未': '金四局',
  '丙申': '火六局', '丁酉': '火六局', '戊戌': '木三局', '己亥': '木三局',
  '庚子': '土五局', '辛丑': '土五局', '壬寅': '金四局', '癸卯': '金四局',
  '甲辰': '火六局', '乙巳': '火六局', '丙午': '水二局', '丁未': '水二局',
  '戊申': '土五局', '己酉': '土五局', '庚戌': '金四局', '辛亥': '金四局',
  '壬子': '木三局', '癸丑': '木三局', '甲寅': '水二局', '乙卯': '水二局',
  '丙辰': '土五局', '丁巳': '土五局', '戊午': '火六局', '己未': '火六局',
  '庚申': '木三局', '辛酉': '木三局', '壬戌': '水二局', '癸亥': '水二局',
};

/**
 * 紫微星定位算法：按五行局和农历日数确定紫微星所在宫位。
 *
 * 规律（经标准排盘数据验证）：
 *   - 日数 >= 局数时进入连续段：日n 紫微在 ZHI_ORDER[(n-ju) % 12]
 *   - 日数 < 局数时为特殊日：按局数差值查特殊位置表
 *
 * 特殊日位置（传统地支索引，子=0）：
 *   k=1(日ju-1): 丑(1)   k=2(日ju-2): 辰(4)
 *   k=3(日ju-3): 亥(11)  k=4(日ju-4): 午(6)
 *   k=5(日ju-5): 丑(1)
 *
 * @param ju - 局数（2-6）
 * @param day - 农历日数（1-30）
 * @returns ZHI_ORDER 索引（0=寅）
 */
function calcZiweiPos(ju: number, day: number): number {
  // 特殊日位置（传统地支索引）：k=1->丑, k=2->辰, k=3->亥, k=4->午, k=5->丑
  const specialTrad = [1, 4, 11, 6, 1];
  // 传统地支索引转 ZHI_ORDER 索引：(idx + 10) % 12
  const tradToZhi = (idx: number) => (idx + 10) % 12;

  if (day < ju) {
    const k = ju - day;
    return tradToZhi(specialTrad[k - 1]);
  }
  // 连续段：日n -> (n - ju + 12) % 12（ZHI_ORDER索引）
  return ((day - ju + 12) % 12);
}

/** 从五行局名称提取局数 */
function juNumber(wuXingJu: string): number {
  const m = wuXingJu.match(/\d/);
  return m ? parseInt(m[0]) : 2;
}

/**
 * 紫微星系：紫微星确定后，其余主星按固定间距排列。
 * 紫微星系（逆时针）：紫微、天机、(空)、太阳、武曲、天同、(空)、(空)、廉贞
 * 天府星系（顺时针）：天府、太阴、贪狼、巨门、天相、天梁、七杀、(空)、破军
 */

/** 紫微星系排布：相对紫微星的偏移（逆时针为正） */
const ZIWEI_SERIES: { star: string; offset: number }[] = [
  { star: '紫微', offset: 0 },
  { star: '天机', offset: 1 },
  { star: '太阳', offset: 3 },
  { star: '武曲', offset: 4 },
  { star: '天同', offset: 5 },
  { star: '廉贞', offset: 8 },
];

/** 天府星系排布：相对天府星的偏移（顺时针为正） */
const TIANFU_SERIES: { star: string; offset: number }[] = [
  { star: '天府', offset: 0 },
  { star: '太阴', offset: 1 },
  { star: '贪狼', offset: 2 },
  { star: '巨门', offset: 3 },
  { star: '天相', offset: 4 },
  { star: '天梁', offset: 5 },
  { star: '七杀', offset: 6 },
  { star: '破军', offset: 8 },
];

/** 主星亮度表（按宫位地支）：庙、旺、得、利、平、闲、陷 */
const BRIGHTNESS: Record<string, Record<string, string>> = {
  '紫微': { '子': '旺', '丑': '旺', '寅': '旺', '卯': '得', '辰': '得', '巳': '得', '午': '庙', '未': '庙', '申': '旺', '酉': '得', '戌': '得', '亥': '得' },
  '天机': { '子': '庙', '丑': '利', '寅': '庙', '卯': '庙', '辰': '利', '巳': '平', '午': '陷', '未': '陷', '申': '得', '酉': '利', '戌': '陷', '亥': '平' },
  '太阳': { '子': '陷', '丑': '陷', '寅': '旺', '卯': '庙', '辰': '庙', '巳': '旺', '午': '庙', '未': '得', '申': '平', '酉': '陷', '戌': '陷', '亥': '陷' },
  '武曲': { '子': '旺', '丑': '得', '寅': '得', '卯': '利', '辰': '庙', '巳': '平', '午': '庙', '未': '得', '申': '庙', '酉': '旺', '戌': '得', '亥': '平' },
  '天同': { '子': '旺', '丑': '陷', '寅': '庙', '卯': '平', '辰': '利', '巳': '旺', '午': '庙', '未': '陷', '申': '旺', '酉': '平', '戌': '利', '亥': '庙' },
  '廉贞': { '子': '平', '丑': '庙', '寅': '庙', '卯': '陷', '辰': '利', '巳': '陷', '午': '庙', '未': '庙', '申': '得', '酉': '平', '戌': '陷', '亥': '陷' },
  '天府': { '子': '庙', '丑': '庙', '寅': '庙', '卯': '陷', '辰': '旺', '巳': '得', '午': '庙', '未': '庙', '申': '庙', '酉': '陷', '戌': '旺', '亥': '得' },
  '太阴': { '子': '陷', '丑': '陷', '寅': '旺', '卯': '陷', '辰': '利', '巳': '平', '午': '陷', '未': '陷', '申': '庙', '酉': '庙', '戌': '旺', '亥': '庙' },
  '贪狼': { '子': '庙', '丑': '庙', '寅': '平', '卯': '陷', '辰': '利', '巳': '陷', '午': '旺', '未': '庙', '申': '平', '酉': '陷', '戌': '利', '亥': '陷' },
  '巨门': { '子': '陷', '丑': '陷', '寅': '庙', '卯': '陷', '辰': '利', '巳': '陷', '午': '陷', '未': '陷', '申': '庙', '酉': '陷', '戌': '利', '亥': '陷' },
  '天相': { '子': '旺', '丑': '陷', '寅': '庙', '卯': '陷', '辰': '得', '巳': '陷', '午': '旺', '未': '陷', '申': '庙', '酉': '陷', '戌': '得', '亥': '陷' },
  '天梁': { '子': '庙', '丑': '得', '寅': '庙', '卯': '陷', '辰': '庙', '巳': '陷', '午': '庙', '未': '得', '申': '庙', '酉': '陷', '戌': '庙', '亥': '陷' },
  '七杀': { '子': '庙', '丑': '陷', '寅': '庙', '卯': '陷', '辰': '庙', '巳': '陷', '午': '庙', '未': '陷', '申': '庙', '酉': '陷', '戌': '庙', '亥': '陷' },
  '破军': { '子': '旺', '丑': '陷', '寅': '得', '卯': '陷', '辰': '庙', '巳': '陷', '午': '旺', '未': '陷', '申': '得', '酉': '陷', '戌': '庙', '亥': '陷' },
};

/**
 * 年干四化表：化禄、化权、化科、化忌。
 * 甲：廉破武阳；乙：机梁紫阴；丙：同机昌廉；丁：阴同机巨；
 * 戊：贪阴弼机；己：武贪梁曲；庚：阳武阴同；辛：巨阳曲昌；
 * 壬：梁紫辅武；癸：破巨阴贪。
 */
const SI_HUA_TABLE: Record<string, [string, string, string, string]> = {
  '甲': ['廉贞', '破军', '武曲', '太阳'],
  '乙': ['天机', '天梁', '紫微', '太阴'],
  '丙': ['天同', '天机', '文昌', '廉贞'],
  '丁': ['太阴', '天同', '天机', '巨门'],
  '戊': ['贪狼', '太阴', '右弼', '天机'],
  '己': ['武曲', '贪狼', '天梁', '文曲'],
  '庚': ['太阳', '武曲', '太阴', '天同'],
  '辛': ['巨门', '太阳', '文曲', '文昌'],
  '壬': ['天梁', '紫微', '左辅', '武曲'],
  '癸': ['破军', '巨门', '太阴', '贪狼'],
};

const SI_HUA_NAMES = ['化禄', '化权', '化科', '化忌'];

/**
 * 命宫天干：由年干和命宫地支推算（五虎遁年起月法）。
 * 甲己之年丙作首（寅月起丙），乙庚之年戊作首，丙辛之年庚作首，
 * 丁壬之年壬作首，戊癸之年甲作首。
 */
function mingGongGan(yearGan: string, zhiIdx: number): string {
  const startGan: Record<string, number> = {
    '甲': 2, '己': 2,  // 丙
    '乙': 4, '庚': 4,  // 戊
    '丙': 6, '辛': 6,  // 庚
    '丁': 8, '壬': 8,  // 壬
    '戊': 0, '癸': 0,  // 甲
  };
  const start = startGan[yearGan] ?? 0;
  return TIAN_GAN[(start + zhiIdx) % 10];
}

/**
 * 构建紫微斗数排盘。
 * @param bazi - 四柱数据（取农历月日、年干、时支）
 * @param gender - 性别（用于定大限方向）
 * @returns 紫微面板数据
 */
export function buildZiWei(bazi: Bazi, gender?: '男' | '女'): ZiWeiPanel {
  const lunarMonth = bazi.lunar.month;
  const lunarDay = bazi.lunar.day;
  const yearGan = bazi.year.gan;
  const hourZhi = bazi.hour.zhi;

  // ── 1. 定命宫：从寅起顺数生月，再逆数生时 ──
  // 时辰序数：子=1, 丑=2, ..., 亥=12
  const hourSeq = DIZHI.indexOf(hourZhi) + 1;
  // 从寅（索引0）起，顺数生月（正月=寅，二月=卯...）
  const monthPos = (lunarMonth - 1) % 12;
  // 再从该位置逆数生时（时辰序数步）
  const mingIdx = ((monthPos - hourSeq) % 12 + 12) % 12;

  // ── 2. 定身宫：从寅起顺数生月，再顺数生时 ──
  const shenIdx = ((monthPos + hourSeq) % 12 + 12) % 12;

  const mingZhi = ZHI_ORDER[mingIdx];
  const shenZhi = ZHI_ORDER[shenIdx];

  // ── 3. 定五行局：命宫天干+地支 -> 纳音五行局 ──
  const mingGan = mingGongGan(yearGan, mingIdx);
  const ganzhi = mingGan + mingZhi;
  const wuXingJu = NAYIN_JU[ganzhi] || '水二局';

  // ── 4. 定紫微星位 ──
  const ziweiPos = calcZiweiPos(juNumber(wuXingJu), lunarDay);

  // ── 5. 天府定位：与紫微以寅申线对称 ──
  // 紫微与天府以寅申线（ZHI_ORDER索引0与6的连线）为轴对称
  // 对称公式：tianfuPos = (12 - ziweiPos) % 12
  const tianfuPos = (12 - ziweiPos) % 12;

  // ── 6. 排主星 ──
  const starAt: Record<number, string[]> = {};
  // 紫微星系（逆时针排列）
  for (const s of ZIWEI_SERIES) {
    const pos = (ziweiPos + s.offset) % 12;
    if (!starAt[pos]) starAt[pos] = [];
    starAt[pos].push(s.star);
  }
  // 天府星系（顺时针排列，偏移取负即逆方向）
  for (const s of TIANFU_SERIES) {
    const pos = ((tianfuPos - s.offset) % 12 + 12) % 12;
    if (!starAt[pos]) starAt[pos] = [];
    starAt[pos].push(s.star);
  }

  // 构建十二宫位
  const palaces = ZHI_ORDER.map((zhi, i) => ({
    gong: GONG_NAMES[((i - mingIdx) % 12 + 12) % 12],
    zhi,
    stars: starAt[i] || [],
  }));

  // 主星列表（带亮度）
  const mainStars: { star: string; gong: string; brightness: string }[] = [];
  for (const [posStr, stars] of Object.entries(starAt)) {
    const pos = Number(posStr);
    const zhi = ZHI_ORDER[pos];
    const gongName = GONG_NAMES[((pos - mingIdx) % 12 + 12) % 12];
    for (const star of stars) {
      const brightness = BRIGHTNESS[star]?.[zhi] || '平';
      mainStars.push({ star, gong: gongName, brightness });
    }
  }

  // ── 7. 四化：按年干定四化星 ──
  const siHuaStars = SI_HUA_TABLE[yearGan] || SI_HUA_TABLE['甲'];
  const siHua = siHuaStars.map((star, i) => ({ hua: SI_HUA_NAMES[i], star }));

  // ── 8. 大限方向：阳男阴女顺行，阴男阳女逆行 ──
  // 年干阴阳：甲丙戊庚壬为阳，乙丁己辛癸为阴
  const yangGan = ['甲', '丙', '戊', '庚', '壬'].includes(yearGan);
  // 阳男阴女顺行，阴男阳女逆行
  const daXianDirection: '顺行' | '逆行' =
    (yangGan && gender === '男') || (!yangGan && gender === '女') ? '顺行' : '逆行';

  // ── 命格概述 ──
  const ziweiInMing = starAt[mingIdx]?.includes('紫微');
  let summary = `${mingZhi}宫${wuXingJu}，`;
  const mingStar = starAt[mingIdx]?.[0];
  if (mingStar) {
    const brightness = BRIGHTNESS[mingStar]?.[mingZhi] || '平';
    summary += `${mingStar}${brightness}坐命`;
    if (['庙', '旺'].includes(brightness)) {
      summary += '，格局清正。';
    } else if (['陷'].includes(brightness)) {
      summary += '，星曜落陷，宜借力而行。';
    } else {
      summary += '，命格平和。';
    }
  } else {
    summary += '命无正星，借对宫主星论之。';
  }
  if (ziweiInMing) summary += '紫微坐命，气度不凡。';

  return { mingGong: mingZhi, shenGong: shenZhi, wuXingJu, palaces, mainStars, siHua, daXianDirection, summary };
}
