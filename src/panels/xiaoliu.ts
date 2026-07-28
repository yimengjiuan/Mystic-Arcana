// 小六壬面板
import { Bazi, XiaoLiuPanel } from '../types';

const PALACE_DATA: readonly { name: string; element: string; meaning: string }[] = [
  { name: '大安', element: '木', meaning: '身不动时，属木，青龙，主事安稳，谋事可成' },
  { name: '留连', element: '水', meaning: '卒未归时，属水，玄武，主事迟延，纠缠未决' },
  { name: '速喜', element: '火', meaning: '人便至时，属火，朱雀，主事速至，喜事来临' },
  { name: '赤口', element: '金', meaning: '官事凶时，属金，白虎，主口舌官非，不利' },
  { name: '小吉', element: '木', meaning: '人来喜时，属木，勾陈，主小吉小利，可成' },
  { name: '空亡', element: '土', meaning: '音信稀时，属土，螣蛇，主事空虚无实' }
];

const DIZHI_ORDER: readonly string[] = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];

export function buildXiaoLiu(bazi: Bazi, _hour: number): XiaoLiuPanel {
  const monthNum = bazi.lunar.month;
  const dayNum = bazi.lunar.day;
  const hourZhiIdx = DIZHI_ORDER.indexOf(bazi.hour.zhi);
  const hourNum = hourZhiIdx >= 0 ? hourZhiIdx + 1 : 1;

  let pos = 0;
  const path: string[] = ['大安'];
  pos = (pos + monthNum - 1) % 6;
  path.push(PALACE_DATA[pos]?.name || '大安');
  pos = (pos + dayNum - 1) % 6;
  path.push(PALACE_DATA[pos]?.name || '大安');
  pos = (pos + hourNum - 1) % 6;
  path.push(PALACE_DATA[pos]?.name || '大安');

  const final = PALACE_DATA[pos] || PALACE_DATA[0]!;
  return {
    monthGanZhi: bazi.month.ganzhi,
    dayGanZhi: bazi.day.ganzhi,
    hourGanZhi: bazi.hour.ganzhi,
    path,
    result: final.name as XiaoLiuPanel['result'],
    element: final.element,
    meaning: final.meaning
  };
}
