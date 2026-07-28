// 术数排盘统一契约 —— 唯一通信源，strict:true, no-any
// 所有面板通过 CoreState 互通，禁止直接导入面板内部类型

export interface TimeInput {
  readonly year: number;
  readonly month: number;
  readonly day: number;
  readonly hour: number;
  readonly minute: number;
}

export interface GZ {
  readonly gan: string;
  readonly zhi: string;
  readonly ganzhi: string;
}

export interface Bazi {
  readonly year: GZ;
  readonly month: GZ;
  readonly day: GZ;
  readonly hour: GZ;
  readonly solarTermYear: number;
  readonly lunar: { readonly year: number; readonly month: number; readonly day: number; isLeap: boolean };
  readonly solarTermNext: string;
}

export interface Line {
  readonly position: 1 | 2 | 3 | 4 | 5 | 6;
  readonly yinYang: 'yang' | 'yin';
  readonly changed: boolean;
  readonly tiangan: string;
  readonly dizhi: string;
  readonly shi: boolean;
  readonly ying: boolean;
  readonly liuQin: string;
}

export interface Hexagram {
  readonly index: number;
  readonly name: string;
  readonly fullName: string;
  readonly upper: number;
  readonly lower: number;
  readonly palace: string;
  readonly element: string;
  readonly nature: string;
  readonly lines: readonly Line[];
  readonly shiPosition: number;
  readonly yingPosition: number;
}

export interface MovingMark {
  readonly positions: readonly number[];
  readonly benName: string;
  readonly bianName: string;
  readonly bianHexagram: Hexagram;
  readonly huHexagram: Hexagram;
}

export interface XiaoLiuPanel {
  readonly monthGanZhi: string;
  readonly dayGanZhi: string;
  readonly hourGanZhi: string;
  readonly path: readonly string[];
  readonly result: '大安' | '留连' | '速喜' | '赤口' | '小吉' | '空亡';
  readonly element: string;
  readonly meaning: string;
}

export interface MeiHuaPanel {
  readonly ben: Hexagram;
  readonly hu: Hexagram;
  readonly bian: Hexagram;
  readonly dong: readonly number[];
  readonly ti: Hexagram;
  readonly yong: Hexagram;
  readonly tiElement: string;
  readonly yongElement: string;
  readonly interpretation: string;
}

export interface ZhouYiPanel {
  readonly ben: Hexagram;
  readonly hu: Hexagram;
  readonly bian: Hexagram;
  readonly dong: readonly number[];
  readonly guaCi: { readonly ben: string; readonly bian: string };
  readonly tuanZhuan: string;
  readonly xiangZhuan: string;
  readonly yaoCi: readonly string[];
  readonly judgment: string;
}

export interface ZiWeiPanel {
  readonly mingGong: string;
  readonly shenGong: string;
  readonly wuXingJu: string;
  readonly mainStars: readonly { star: string; gong: string; brightness: string }[];
  readonly summary: string;
}

export interface LiuYaoPanel {
  readonly ben: Hexagram;
  readonly bian: Hexagram;
  readonly dong: readonly number[];
  readonly fuShi: readonly { hex: Hexagram; line: number }[];
  readonly liuShen: readonly string[];
  readonly liuQinMap: readonly { position: number; liuQin: string; ganZhi: string }[];
  readonly summary: string;
}

export type QiGuaMethod = 'time' | 'number' | 'meihua' | 'zaobi' | 'cuanke';

export type QiGuaBasis = 'time' | 'time_bazi' | 'bazi';

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
  readonly panels: {
    readonly xiaoliu: XiaoLiuPanel;
    readonly meihua: MeiHuaPanel;
    readonly zhouyi: ZhouYiPanel;
    readonly ziwei: ZiWeiPanel;
    readonly liuyao: LiuYaoPanel;
    readonly bazi: Bazi;
  };
}

export interface Synthesized {
  readonly summary: string;
  readonly trend: '上吉' | '吉' | '平' | '凶' | '大凶';
  readonly score: number;
  readonly keyPoints: readonly string[];
  readonly warnings: readonly string[];
  readonly recommendations: readonly string[];
}

export interface AppConfig {
  readonly defaultPath: string;
  readonly outputName: string;
  readonly compliance: string;
}
