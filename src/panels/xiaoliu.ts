/**
 * 小六壬面板
 * ------------------------------------------------------------------
 * 小六壬：以月、日、时辰三轮顺数六宫（大安→留连→速喜→赤口→小吉→空亡），
 * 最终落宫即为本卦结果。
 */
import type { XiaoLiuPanel } from '../types';

/** 六宫数据：名称、五行、含义 */
const PALACE_DATA = [
  { name: '大安', element: '木', meaning: '身不动时，属木，青龙，主事安稳，谋事可成' },
  { name: '留连', element: '水', meaning: '卒未归时，属水，玄武，主事迟延，纠缠未决' },
  { name: '速喜', element: '火', meaning: '人便至时，属火，朱雀，主事速至，喜事来临' },
  { name: '赤口', element: '金', meaning: '官事凶时，属金，白虎，主口舌官非，不利' },
  { name: '小吉', element: '木', meaning: '人来喜时，属木，勾陈，主小吉小利，可成' },
  { name: '空亡', element: '土', meaning: '音信稀时，属土，螣蛇，主事空虚无实' },
];

/** 地支顺序（用于时辰序号查找） */
const DIZHI_ORDER = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

/**
 * 构建小六壬排盘。
 * @param bazi - 四柱数据（取农历月、日及时辰地支）
 * @param _hour - 小时（未使用，保留接口）
 * @returns 小六壬面板数据
 */
export function buildXiaoLiu(bazi: { lunar: { month: number; day: number }; hour: { zhi: string } }, _hour: number): XiaoLiuPanel {
  let pos = 0;
  const path = ['大安'];

  // 第一轮：从大安起顺数月数
  pos = (pos + bazi.lunar.month - 1) % 6;
  path.push(PALACE_DATA[pos].name);

  // 第二轮：从上一落宫起顺数日数
  pos = (pos + bazi.lunar.day - 1) % 6;
  path.push(PALACE_DATA[pos].name);

  // 第三轮：从上一落宫起顺数时辰序数
  const hourIdx = DIZHI_ORDER.indexOf(bazi.hour.zhi);
  pos = (pos + (hourIdx >= 0 ? hourIdx + 1 : 1) - 1) % 6;
  path.push(PALACE_DATA[pos].name);

  const final = PALACE_DATA[pos];
  return {
    monthGanZhi: '',
    dayGanZhi: '',
    hourGanZhi: '',
    path,
    result: final.name as XiaoLiuPanel['result'],
    element: final.element,
    meaning: final.meaning,
  };
}
