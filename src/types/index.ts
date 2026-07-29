/**
 * 全局类型定义
 * ------------------------------------------------------------------
 * 定义排盘系统的核心数据结构，涵盖时间输入、四柱、卦象、各面板及综合分析结果。
 */

/** 时间输入（公历） */
export interface TimeInput {
  readonly year: number;
  readonly month: number;
  readonly day: number;
  readonly hour: number;
  readonly minute: number;
  readonly second: number;
}

/** 干支（天干 + 地支） */
export interface GZ {
  readonly gan: string;
  readonly zhi: string;
  readonly ganzhi: string;
}

/** 四柱（年月日时） */
export interface Bazi {
  readonly year: GZ;
  readonly month: GZ;
  readonly day: GZ;
  readonly hour: GZ;
  /** 以立春为界的年份 */
  readonly solarTermYear: number;
  /** 农历日期 */
  readonly lunar: { readonly year: number; readonly month: number; readonly day: number; isLeap: boolean };
  /** 下一时辰地支 */
  readonly solarTermNext: string;
}

/** 爻线详情 */
export interface Line {
  /** 爻位（1-6，自下而上） */
  readonly position: 1 | 2 | 3 | 4 | 5 | 6;
  /** 阴阳 */
  readonly yinYang: 'yang' | 'yin';
  /** 是否动爻 */
  readonly changed: boolean;
  /** 天干（纳甲） */
  readonly tiangan: string;
  /** 地支（纳甲） */
  readonly dizhi: string;
  /** 是否世爻 */
  readonly shi: boolean;
  /** 是否应爻 */
  readonly ying: boolean;
  /** 六亲 */
  readonly liuQin: string;
}

/** 卦象 */
export interface Hexagram {
  /** 卦序（1-64） */
  readonly index: number;
  /** 卦简称 */
  readonly name: string;
  /** 卦全称 */
  readonly fullName: string;
  /** 上卦索引 */
  readonly upper: number;
  /** 下卦索引 */
  readonly lower: number;
  /** 所属宫位 */
  readonly palace: string;
  /** 五行属性 */
  readonly element: string;
  /** 德性 */
  readonly nature: string;
  /** 六爻详情 */
  readonly lines: readonly Line[];
  /** 世爻位置 */
  readonly shiPosition: number;
  /** 应爻位置 */
  readonly yingPosition: number;
}

/** 动爻标记 */
export interface MovingMark {
  /** 动爻位置数组 */
  readonly positions: readonly number[];
  /** 本卦名 */
  readonly benName: string;
  /** 变卦名 */
  readonly bianName: string;
  /** 变卦卦象 */
  readonly bianHexagram: Hexagram;
  /** 互卦卦象 */
  readonly huHexagram: Hexagram;
}

/** 小六壬面板数据 */
export interface XiaoLiuPanel {
  readonly monthGanZhi: string;
  readonly dayGanZhi: string;
  readonly hourGanZhi: string;
  /** 走宫路径 */
  readonly path: readonly string[];
  /** 最终落宫结果 */
  readonly result: '大安' | '留连' | '速喜' | '赤口' | '小吉' | '空亡';
  /** 五行属性 */
  readonly element: string;
  /** 含义 */
  readonly meaning: string;
}

/** 梅花易数面板数据 */
export interface MeiHuaPanel {
  /** 本卦 */
  readonly ben: Hexagram;
  /** 互卦 */
  readonly hu: Hexagram;
  /** 变卦 */
  readonly bian: Hexagram;
  /** 动爻 */
  readonly dong: readonly number[];
  /** 体卦 */
  readonly ti: Hexagram;
  /** 用卦 */
  readonly yong: Hexagram;
  /** 体卦五行 */
  readonly tiElement: string;
  /** 用卦五行 */
  readonly yongElement: string;
  /** 体用生克解读 */
  readonly interpretation: string;
}

/** 周易面板数据 */
export interface ZhouYiPanel {
  readonly ben: Hexagram;
  readonly hu: Hexagram;
  readonly bian: Hexagram;
  readonly dong: readonly number[];
  /** 本卦辞与变卦辞 */
  readonly guaCi: { readonly ben: string; readonly bian: string };
  /** 彖传 */
  readonly tuanZhuan: string;
  /** 象传 */
  readonly xiangZhuan: string;
  /** 动爻爻辞 */
  readonly yaoCi: readonly string[];
  /** 吉凶判定 */
  readonly judgment: string;
}

/** 紫微斗数面板数据 */
export interface ZiWeiPanel {
  /** 命宫地支 */
  readonly mingGong: string;
  /** 身宫地支 */
  readonly shenGong: string;
  /** 五行局 */
  readonly wuXingJu: string;
  /** 十二宫位主星分布 */
  readonly palaces: readonly { gong: string; zhi: string; stars: readonly string[] }[];
  /** 主星列表（按宫位排列） */
  readonly mainStars: readonly { star: string; gong: string; brightness: string }[];
  /** 四化 */
  readonly siHua: readonly { hua: string; star: string }[];
  /** 大限方向 */
  readonly daXianDirection: '顺行' | '逆行';
  /** 命格概述 */
  readonly summary: string;
}

/** 六爻面板数据 */
export interface LiuYaoPanel {
  readonly ben: Hexagram;
  readonly bian: Hexagram;
  readonly dong: readonly number[];
  /** 伏神 */
  readonly fuShi: readonly { hex: Hexagram; line: number }[];
  /** 六神 */
  readonly liuShen: readonly string[];
  /** 六亲映射 */
  readonly liuQinMap: readonly { position: number; liuQin: string; ganZhi: string }[];
  /** 概述 */
  readonly summary: string;
}

/** 起卦方法 */
export type QiGuaMethod = 'time' | 'number' | 'meihua' | 'zaobi' | 'cuanke';

/** 起卦依据 */
export type QiGuaBasis = 'time' | 'time_bazi' | 'bazi';

/** 排盘核心状态 */
export interface CoreState {
  readonly input: TimeInput;
  readonly method: QiGuaMethod;
  readonly numberInput: readonly number[];
  readonly bazi: Bazi;
  readonly hexagram: Hexagram;
  readonly moving: MovingMark;
  readonly basis: QiGuaBasis;
  readonly birth?: TimeInput;
  readonly gender?: '男' | '女';
  readonly name?: string;
  /** 各术数面板 */
  readonly panels: {
    readonly xiaoliu: XiaoLiuPanel;
    readonly meihua: MeiHuaPanel;
    readonly zhouyi: ZhouYiPanel;
    readonly ziwei: ZiWeiPanel;
    readonly liuyao: LiuYaoPanel;
    readonly bazi: Bazi;
  };
}

/** 综合分析结果 */
export interface Synthesized {
  readonly summary: string;
  readonly trend: '上吉' | '吉' | '平' | '凶' | '大凶';
  readonly score: number;
  readonly keyPoints: readonly string[];
  readonly warnings: readonly string[];
  readonly recommendations: readonly string[];
}
