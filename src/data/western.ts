/**
 * 西洋占星数据字典
 * ------------------------------------------------------------------
 * 来源：docs/western-divination.md（经三子代理核验）。
 * 用途：为西式星语模块（星盘 / 星座 / 合盘 / AI 解语）提供数据支撑。
 * 范围：12 星座、10 行星、12 宫位、主相位、塔罗 78 张（22 大阿卡纳 + 56 小阿卡纳）、18 种牌阵。
 */

export type Element = 'fire' | 'earth' | 'air' | 'water';
export type Modality = 'cardinal' | 'fixed' | 'mutable';
export type Polarity = 'yang' | 'yin';

/** 十二星座 */
export interface Sign {
  readonly id: string;
  readonly name: string;
  readonly en: string;
  readonly symbol: string;
  /** 起始月-日（含） */
  readonly from: [number, number];
  /** 结束月-日（含） */
  readonly to: [number, number];
  readonly element: Element;
  readonly modality: Modality;
  readonly ruler: string;
  readonly polarity: Polarity;
}

/** 星座数据表（按黄道顺序，起白羊） */
export const SIGNS: readonly Sign[] = [
  { id: 'aries',      name: '白羊座', en: 'Aries',       symbol: '♈', from: [3, 21], to: [4, 19],  element: 'fire',  modality: 'cardinal', ruler: 'mars',     polarity: 'yang' },
  { id: 'taurus',     name: '金牛座', en: 'Taurus',      symbol: '♉', from: [4, 20], to: [5, 20],  element: 'earth', modality: 'fixed',    ruler: 'venus',    polarity: 'yin'  },
  { id: 'gemini',     name: '双子座', en: 'Gemini',      symbol: '♊', from: [5, 21], to: [6, 21],  element: 'air',   modality: 'mutable',  ruler: 'mercury',  polarity: 'yang' },
  { id: 'cancer',     name: '巨蟹座', en: 'Cancer',      symbol: '♋', from: [6, 22], to: [7, 22],  element: 'water', modality: 'cardinal', ruler: 'moon',     polarity: 'yin'  },
  { id: 'leo',        name: '狮子座', en: 'Leo',         symbol: '♌', from: [7, 23], to: [8, 22],  element: 'fire',  modality: 'fixed',    ruler: 'sun',      polarity: 'yang' },
  { id: 'virgo',      name: '处女座', en: 'Virgo',       symbol: '♍', from: [8, 23], to: [9, 22],  element: 'earth', modality: 'mutable',  ruler: 'mercury',  polarity: 'yin'  },
  { id: 'libra',      name: '天秤座', en: 'Libra',       symbol: '♎', from: [9, 23], to: [10, 23], element: 'air',   modality: 'cardinal', ruler: 'venus',    polarity: 'yang' },
  { id: 'scorpio',    name: '天蝎座', en: 'Scorpio',     symbol: '♏', from: [10, 24], to: [11, 22], element: 'water', modality: 'fixed',    ruler: 'pluto',    polarity: 'yin'  },
  { id: 'sagittarius',name: '射手座', en: 'Sagittarius', symbol: '♐', from: [11, 23], to: [12, 21], element: 'fire',  modality: 'mutable',  ruler: 'jupiter',  polarity: 'yang' },
  { id: 'capricorn',  name: '摩羯座', en: 'Capricorn',   symbol: '♑', from: [12, 22], to: [1, 19],  element: 'earth', modality: 'cardinal', ruler: 'saturn',   polarity: 'yin'  },
  { id: 'aquarius',   name: '水瓶座', en: 'Aquarius',    symbol: '♒', from: [1, 20], to: [2, 18],  element: 'air',   modality: 'fixed',    ruler: 'uranus',   polarity: 'yang' },
  { id: 'pisces',     name: '双鱼座', en: 'Pisces',      symbol: '♓', from: [2, 19], to: [3, 20],  element: 'water', modality: 'mutable',  ruler: 'neptune',  polarity: 'yin'  },
];

/** 行星（按距日远近：内行星→外行星） */
export interface Planet {
  readonly id: string;
  readonly name: string;
  readonly symbol: string;
  /** 关键词（正位） */
  readonly keyword: string;
}

/** 十行星 */
export const PLANETS: readonly Planet[] = [
  { id: 'sun',     name: '太阳', symbol: '☉', keyword: '自我·意志·身份' },
  { id: 'moon',    name: '月亮', symbol: '☽', keyword: '情绪·潜意识·母性' },
  { id: 'mercury', name: '水星', symbol: '☿', keyword: '思考·沟通·学习' },
  { id: 'venus',   name: '金星', symbol: '♀', keyword: '爱·美·价值观' },
  { id: 'mars',    name: '火星', symbol: '♂', keyword: '行动·勇气·冲劲' },
  { id: 'jupiter', name: '木星', symbol: '♃', keyword: '扩张·幸运·信念' },
  { id: 'saturn',  name: '土星', symbol: '♄', keyword: '责任·纪律·收敛' },
  { id: 'uranus',  name: '天王星', symbol: '♅', keyword: '变革·独立·创新' },
  { id: 'neptune', name: '海王星', symbol: '♆', keyword: '灵感·灵性·幻觉' },
  { id: 'pluto',   name: '冥王星', symbol: '♇', keyword: '转化·深层·权力' },
];

/** 后天十二宫 */
export interface House {
  readonly num: number;
  readonly name: string;
  readonly en: string;
  readonly area: string;
  readonly naturalSign: string;
}

export const HOUSES: readonly House[] = [
  { num: 1,  name: '命宫',    en: '1st House', area: '自我·外貌·性格',     naturalSign: 'aries'      },
  { num: 2,  name: '财帛宫',  en: '2nd House', area: '金钱·价值观·资源',   naturalSign: 'taurus'     },
  { num: 3,  name: '兄弟宫',  en: '3rd House', area: '沟通·学习·手足',     naturalSign: 'gemini'     },
  { num: 4,  name: '家庭宫',  en: '4th House', area: '原生家庭·房产·根基', naturalSign: 'cancer'     },
  { num: 5,  name: '子女宫',  en: '5th House', area: '恋爱·创造·娱乐',     naturalSign: 'leo'        },
  { num: 6,  name: '奴仆宫',  en: '6th House', area: '工作·健康·日常',     naturalSign: 'virgo'      },
  { num: 7,  name: '夫妻宫',  en: '7th House', area: '婚姻·合作·对手',     naturalSign: 'libra'      },
  { num: 8,  name: '疾厄宫',  en: '8th House', area: '生死·偏财·蜕变',     naturalSign: 'scorpio'    },
  { num: 9,  name: '迁移宫',  en: '9th House', area: '高等教育·哲学·远行', naturalSign: 'sagittarius'},
  { num: 10, name: '官禄宫',  en: '10th House',area: '事业·名誉·天顶 MC',  naturalSign: 'capricorn'  },
  { num: 11, name: '福德宫',  en: '11th House',area: '朋友·团体·理想',     naturalSign: 'aquarius'   },
  { num: 12, name: '玄秘宫',  en: '12th House',area: '潜意识·业力·独处',   naturalSign: 'pisces'     },
];

/** 主相位（Major Aspects） */
export interface Aspect {
  readonly id: string;
  readonly name: string;
  readonly en: string;
  readonly angle: number;
  /** 容许度（°） */
  readonly orb: number;
  readonly nature: 'harmonious' | 'tense' | 'neutral';
  readonly symbol: string;
}

export const ASPECTS: readonly Aspect[] = [
  { id: 'conjunction',  name: '合相', en: 'Conjunction', angle: 0,   orb: 8, nature: 'neutral',   symbol: '☌' },
  { id: 'sextile',      name: '六分相', en: 'Sextile',   angle: 60,  orb: 5, nature: 'harmonious',symbol: '⚹' },
  { id: 'square',       name: '四分相', en: 'Square',    angle: 90,  orb: 7, nature: 'tense',     symbol: '□' },
  { id: 'trine',        name: '三分相', en: 'Trine',     angle: 120, orb: 7, nature: 'harmonious',symbol: '△' },
  { id: 'opposition',   name: '冲相', en: 'Opposition',  angle: 180, orb: 8, nature: 'tense',     symbol: '☍' },
];

/** 塔罗花色（小阿卡纳四花色；大阿卡纳无 suit 字段即为 'major'） */
export type TarotSuit = 'wands' | 'cups' | 'swords' | 'pentacles';

/** 塔罗牌（大阿卡纳 22 + 小阿卡纳 56，共 78 张） */
export interface TarotCard {
  readonly index: number;
  readonly name: string;
  readonly en: string;
  readonly upright: string;
  readonly reversed: string;
  readonly symbol: string;
  /** 小阿卡纳所属花色；缺省视为大阿卡纳 */
  readonly suit?: TarotSuit;
}

export const MAJOR_ARCANA: readonly TarotCard[] = [
  { index: 0,  name: '愚人',     en: 'The Fool',          upright: '开始·纯真·冒险·直觉',             reversed: '鲁莽·不智·缺乏方向·逃避',               symbol: '🃏' },
  { index: 1,  name: '魔术师',   en: 'The Magician',      upright: '创造·技能·意志·资源具足',         reversed: '欺骗·意志薄弱·错失时机·技能不纯',       symbol: '🪄' },
  { index: 2,  name: '女祭司',   en: 'The High Priestess',upright: '直觉·潜意识·静观·奥秘',           reversed: '忽视直觉·秘密泄露·浮躁·拒绝倾听',       symbol: '🌙' },
  { index: 3,  name: '皇后',     en: 'The Empress',       upright: '丰饶·滋养·母性·创造',             reversed: '过度依赖·疏忽照顾·创造力受阻',           symbol: '👑' },
  { index: 4,  name: '皇帝',     en: 'The Emperor',       upright: '权威·秩序·结构·责任',             reversed: '独断专行·失控·僵化·权威压力',           symbol: '⚖️' },
  { index: 5,  name: '教皇',     en: 'The Hierophant',    upright: '传统·信仰·教导·规则',             reversed: '教条主义·叛逆·质疑权威·打破常规',       symbol: '📜' },
  { index: 6,  name: '恋人',     en: 'The Lovers',        upright: '结合·选择·爱·价值观一致',         reversed: '关系失衡·选择困难·价值观冲突',           symbol: '💞' },
  { index: 7,  name: '战车',     en: 'The Chariot',       upright: '意志·胜利·掌控·前进',             reversed: '失控·阻力·意志涣散·横冲直撞',           symbol: '🛞' },
  { index: 8,  name: '力量',     en: 'Strength',          upright: '勇气·内在力量·耐心·驯服',         reversed: '软弱·信心不足·压抑情绪·自我怀疑',       symbol: '🦁' },
  { index: 9,  name: '隐士',     en: 'The Hermit',        upright: '内省·独处·寻求真理·导师',         reversed: '过度孤立·逃避现实·拒绝帮助·迷茫',       symbol: '🕯️' },
  { index: 10, name: '命运之轮', en: 'Wheel of Fortune',  upright: '转机·循环·命运·好运',             reversed: '厄运·循环受阻·错失时机·抗拒改变',       symbol: '🎡' },
  { index: 11, name: '正义',     en: 'Justice',           upright: '公正·因果·平衡·法律',             reversed: '不公·失衡·逃避责任·偏见',               symbol: '⚖' },
  { index: 12, name: '吊人',     en: 'The Hanged Man',    upright: '悬置·换位·牺牲·等待',             reversed: '无谓牺牲·拖延·停滞·抗拒改变',           symbol: '🙃' },
  { index: 13, name: '死神',     en: 'Death',             upright: '结束·蜕变·放下·新生',             reversed: '无法放手·恐惧改变·停滞不化·执念',       symbol: '💀' },
  { index: 14, name: '节制',     en: 'Temperance',        upright: '调和·适度·融合·疗愈',             reversed: '失衡·过度放纵·失调·缺乏耐心',           symbol: '🍵' },
  { index: 15, name: '恶魔',     en: 'The Devil',         upright: '束缚·欲望·执着·阴影',             reversed: '挣脱束缚·戒除瘾习·摆脱控制·觉醒',       symbol: '⛓️' },
  { index: 16, name: '塔',       en: 'The Tower',         upright: '剧变·崩塌·解放·真相显现',         reversed: '恐惧崩塌·拖延剧变·危机潜伏',             symbol: '🗼' },
  { index: 17, name: '星星',     en: 'The Star',          upright: '希望·疗愈·灵感·宁静',             reversed: '失望·缺乏信心·灵感枯竭·悲观',           symbol: '⭐' },
  { index: 18, name: '月亮',     en: 'The Moon',          upright: '迷茫·幻觉·潜意识·不安',           reversed: '真相大白·解除迷惑·克服恐惧',             symbol: '🌕' },
  { index: 19, name: '太阳',     en: 'The Sun',           upright: '成功·活力·喜悦·光明',             reversed: '热情消退·成功延迟·过度乐观',             symbol: '☀️' },
  { index: 20, name: '审判',     en: 'Judgment',          upright: '觉醒·召唤·复盘·重生',             reversed: '自我怀疑·回避复盘·拒绝觉醒·悔恨',       symbol: '📯' },
  { index: 21, name: '世界',     en: 'The World',         upright: '完成·圆满·整合·成就',             reversed: '未竟之业·停滞不前·功亏一篑',             symbol: '🌍' },
];

/** 小阿卡纳花色元数据（元素 · 主题色 · 元素符号） */
export const SUIT_META: Readonly<Record<TarotSuit, { readonly zh: string; readonly element: Element; readonly color: string; readonly emoji: string }>> = {
  wands:     { zh: '权杖', element: 'fire',  color: '#e8833a', emoji: '🔥' },
  cups:      { zh: '圣杯', element: 'water', color: '#4aa8d8', emoji: '🏺' },
  swords:    { zh: '宝剑', element: 'air',   color: '#c9a95e', emoji: '⚔️' },
  pentacles: { zh: '星币', element: 'earth', color: '#7cb95e', emoji: '🪙' },
};

/** 小阿卡纳 56 张（index 22-77，四花色 × 14 张） */
export const MINOR_ARCANA: readonly TarotCard[] = [
  // ── 权杖（火 · 行动 / 激情 / 创造）──
  { index: 22, name: '权杖·一', en: 'Ace of Wands',      upright: '创造·新开始·灵感·机会',               reversed: '延迟·创意受阻·缺乏方向·冲动',             symbol: 'Ⅰ', suit: 'wands' },
  { index: 23, name: '权杖·二', en: 'Two of Wands',      upright: '规划·远景·抉择·展望未来',             reversed: '犹豫不决·恐惧未知·计划受阻·停滞',         symbol: 'Ⅱ', suit: 'wands' },
  { index: 24, name: '权杖·三', en: 'Three of Wands',    upright: '扩张·远航·洞察·进展',                 reversed: '延迟·阻碍·坐失良机·视野受限',             symbol: 'Ⅲ', suit: 'wands' },
  { index: 25, name: '权杖·四', en: 'Four of Wands',     upright: '庆祝·和谐·稳固·归家',                 reversed: '根基不稳·家宅纷扰·暂缓庆祝·过渡期',       symbol: 'Ⅳ', suit: 'wands' },
  { index: 26, name: '权杖·五', en: 'Five of Wands',     upright: '竞争·冲突·挑战·争执',                 reversed: '避免冲突·内耗平息·化敌为友·妥协',         symbol: 'Ⅴ', suit: 'wands' },
  { index: 27, name: '权杖·六', en: 'Six of Wands',      upright: '胜利·认可·凯旋·自信',                 reversed: '失败·骄傲·无人喝彩·失信',                 symbol: 'Ⅵ', suit: 'wands' },
  { index: 28, name: '权杖·七', en: 'Seven of Wands',    upright: '坚持·防御·坚守阵地·勇气',             reversed: '疲于防守·缴械投降·力不从心·退缩',         symbol: 'Ⅶ', suit: 'wands' },
  { index: 29, name: '权杖·八', en: 'Eight of Wands',    upright: '急速·进展·讯息·航班',                 reversed: '延误·迟滞·中断·心急如焚',                 symbol: 'Ⅷ', suit: 'wands' },
  { index: 30, name: '权杖·九', en: 'Nine of Wands',     upright: '坚韧·警戒·坚持到底·边界',             reversed: '精疲力竭·放弃·多疑·防御过重',             symbol: 'Ⅸ', suit: 'wands' },
  { index: 31, name: '权杖·十', en: 'Ten of Wands',      upright: '负担·责任·辛苦付出·完成',             reversed: '不堪重负·放弃·推卸责任·过度劳累',         symbol: 'Ⅹ', suit: 'wands' },
  { index: 32, name: '权杖侍从', en: 'Page of Wands',     upright: '热情·探索·好奇·开创精神',             reversed: '三分钟热度·鲁莽·拖延·缺乏动力',           symbol: '侍', suit: 'wands' },
  { index: 33, name: '权杖骑士', en: 'Knight of Wands',   upright: '勇往直前·冒险·激情·魅力',             reversed: '冲动鲁莽·急躁·半途而废·失控',             symbol: '骑', suit: 'wands' },
  { index: 34, name: '权杖王后', en: 'Queen of Wands',    upright: '自信·热情·魅力·果敢',                 reversed: '嫉妒·虚荣·自我中心·急躁',                 symbol: '后', suit: 'wands' },
  { index: 35, name: '权杖国王', en: 'King of Wands',     upright: '领袖·远见·魄力·开创者',               reversed: '专横·冲动决策·傲慢·缺乏远见',             symbol: '王', suit: 'wands' },
  // ── 圣杯（水 · 情感 / 关系 / 直觉）──
  { index: 36, name: '圣杯·一', en: 'Ace of Cups',       upright: '情感丰盈·爱·新关系·直觉',             reversed: '情感枯竭·压抑·关系冷淡·爱意受阻',         symbol: 'Ⅰ', suit: 'cups' },
  { index: 37, name: '圣杯·二', en: 'Two of Cups',       upright: '结合·相互吸引·友谊·合作',             reversed: '关系失衡·误会·疏离·单相思',               symbol: 'Ⅱ', suit: 'cups' },
  { index: 38, name: '圣杯·三', en: 'Three of Cups',     upright: '友谊·庆祝·团聚·喜悦',                 reversed: '过度放纵·社交孤立·小团体矛盾',             symbol: 'Ⅲ', suit: 'cups' },
  { index: 39, name: '圣杯·四', en: 'Four of Cups',      upright: '倦怠·冷漠·沉思·错失机会',             reversed: '重新投入·觉醒·接纳新机·情绪回归',         symbol: 'Ⅳ', suit: 'cups' },
  { index: 40, name: '圣杯·五', en: 'Five of Cups',      upright: '失落·悲伤·悔恨·执着过往',             reversed: '释怀·接纳·重新振作·走出悲伤',             symbol: 'Ⅴ', suit: 'cups' },
  { index: 41, name: '圣杯·六', en: 'Six of Cups',       upright: '怀旧·回忆·天真·重逢',                 reversed: '活在过去·停滞不前·依赖心重',               symbol: 'Ⅵ', suit: 'cups' },
  { index: 42, name: '圣杯·七', en: 'Seven of Cups',     upright: '幻想·选择众多·白日梦·诱惑',           reversed: '清醒·现实抉择·取舍·脚踏实地',             symbol: 'Ⅶ', suit: 'cups' },
  { index: 43, name: '圣杯·八', en: 'Eight of Cups',     upright: '离开·追寻更深意义·放下',               reversed: '犹豫不决·害怕离开·原地踏步',               symbol: 'Ⅷ', suit: 'cups' },
  { index: 44, name: '圣杯·九', en: 'Nine of Cups',      upright: '心愿达成·满足·得意·享受',             reversed: '过度贪婪·自满·虚假满足·愿望落空',         symbol: 'Ⅸ', suit: 'cups' },
  { index: 45, name: '圣杯·十', en: 'Ten of Cups',       upright: '圆满家庭·幸福·和谐·梦想成真',         reversed: '家庭矛盾·关系破裂·理想幻灭',               symbol: 'Ⅹ', suit: 'cups' },
  { index: 46, name: '圣杯侍从', en: 'Page of Cups',      upright: '情感细腻·想象·艺术灵感·好意',         reversed: '情绪化·幼稚·过度敏感·爱幻想',             symbol: '侍', suit: 'cups' },
  { index: 47, name: '圣杯骑士', en: 'Knight of Cups',    upright: '浪漫·理想主义·追求者·魅力',           reversed: '情绪反复·沉迷幻想·不切实际·退缩',         symbol: '骑', suit: 'cups' },
  { index: 48, name: '圣杯王后', en: 'Queen of Cups',     upright: '温柔·同理心·直觉·疗愈',               reversed: '过度情绪化·依赖·自欺·敏感脆弱',           symbol: '后', suit: 'cups' },
  { index: 49, name: '圣杯国王', en: 'King of Cups',      upright: '情绪成熟·包容·沉着·关怀',             reversed: '情绪失控·压抑情感·操控·冷漠',             symbol: '王', suit: 'cups' },
  // ── 宝剑（风 · 思想 / 智慧 / 冲突）──
  { index: 50, name: '宝剑·一', en: 'Ace of Swords',     upright: '真相·清晰·突破·决断',                 reversed: '混乱·偏见·误判·言语伤人',                 symbol: 'Ⅰ', suit: 'swords' },
  { index: 51, name: '宝剑·二', en: 'Two of Swords',     upright: '两难·僵持·回避抉择·平衡',             reversed: '决断·拆穿谎言·解除封锁·直面',             symbol: 'Ⅱ', suit: 'swords' },
  { index: 52, name: '宝剑·三', en: 'Three of Swords',   upright: '心碎·伤痛·分离·背叛',                 reversed: '疗愈·释怀·和解·走出阴霾',                 symbol: 'Ⅲ', suit: 'swords' },
  { index: 53, name: '宝剑·四', en: 'Four of Swords',    upright: '休整·休息·冥想·暂停',                 reversed: '精疲力竭·被迫休息·失眠·停滞',             symbol: 'Ⅳ', suit: 'swords' },
  { index: 54, name: '宝剑·五', en: 'Five of Swords',    upright: '冲突·胜负·屈辱·得不偿失',             reversed: '和解·放下执念·息事宁人·愧疚消散',         symbol: 'Ⅴ', suit: 'swords' },
  { index: 55, name: '宝剑·六', en: 'Six of Swords',     upright: '过渡·疗愈之旅·走出困境·平复',         reversed: '困在原地·抗拒过渡·旧事重提·拖延',         symbol: 'Ⅵ', suit: 'swords' },
  { index: 56, name: '宝剑·七', en: 'Seven of Swords',   upright: '策略·隐秘·闪避·孤军奋战',             reversed: '败露·坦白·自欺·被识破',                   symbol: 'Ⅶ', suit: 'swords' },
  { index: 57, name: '宝剑·八', en: 'Eight of Swords',   upright: '束缚·困局·自我设限·无助',             reversed: '解放·突破限制·自我觉察·挣脱',             symbol: 'Ⅷ', suit: 'swords' },
  { index: 58, name: '宝剑·九', en: 'Nine of Swords',    upright: '焦虑·噩梦·担忧·绝望',                 reversed: '转机·释压·寻求帮助·噩梦结束',             symbol: 'Ⅸ', suit: 'swords' },
  { index: 59, name: '宝剑·十', en: 'Ten of Swords',     upright: '终结·低谷·背叛·放手',                 reversed: '浴火重生·谷底反弹·复原·新生',             symbol: 'Ⅹ', suit: 'swords' },
  { index: 60, name: '宝剑侍从', en: 'Page of Swords',    upright: '好奇·观察·机敏·求知',                 reversed: '冲动言语·八卦·轻率·刺探',                 symbol: '侍', suit: 'swords' },
  { index: 61, name: '宝剑骑士', en: 'Knight of Swords',  upright: '果决·疾行·直言·冲锋',                 reversed: '鲁莽·冲动·争执·横冲直撞',                 symbol: '骑', suit: 'swords' },
  { index: 62, name: '宝剑王后', en: 'Queen of Swords',   upright: '理性·独立·敏锐·公正',                 reversed: '苛刻·冷酷·尖刻·多疑',                     symbol: '后', suit: 'swords' },
  { index: 63, name: '宝剑国王', en: 'King of Swords',    upright: '理性·权威·明断·公正',                 reversed: '专断·冷酷·滥用权力·狡辩',                 symbol: '王', suit: 'swords' },
  // ── 星币（土 · 金钱 / 物质 / 实践）──
  { index: 64, name: '星币·一', en: 'Ace of Pentacles',  upright: '机遇·财富·务实·新起点',               reversed: '错失良机·财务不稳·拖延·贪欲',             symbol: 'Ⅰ', suit: 'pentacles' },
  { index: 65, name: '星币·二', en: 'Two of Pentacles',  upright: '平衡·变通·周旋·多线程',               reversed: '失衡·顾此失彼·财务混乱·疲于奔命',         symbol: 'Ⅱ', suit: 'pentacles' },
  { index: 66, name: '星币·三', en: 'Three of Pentacles',upright: '合作·技艺·团队·认可',                 reversed: '缺乏协作·技能不足·忽视细节·内耗',         symbol: 'Ⅲ', suit: 'pentacles' },
  { index: 67, name: '星币·四', en: 'Four of Pentacles', upright: '储蓄·稳定·掌控·占有',                 reversed: '吝啬·固执·守成·财务紧锁',                 symbol: 'Ⅳ', suit: 'pentacles' },
  { index: 68, name: '星币·五', en: 'Five of Pentacles', upright: '匮乏·困境·孤立·信仰考验',             reversed: '转机·走出低谷·接受帮助·复苏',             symbol: 'Ⅴ', suit: 'pentacles' },
  { index: 69, name: '星币·六', en: 'Six of Pentacles',  upright: '施与受·慷慨·公平·资助',               reversed: '斤斤计较·失衡·债务·吝于付出',             symbol: 'Ⅵ', suit: 'pentacles' },
  { index: 70, name: '星币·七', en: 'Seven of Pentacles',upright: '评估·耐心·投资·长期回报',             reversed: '急于求成·回报失望·停滞·放弃',             symbol: 'Ⅶ', suit: 'pentacles' },
  { index: 71, name: '星币·八', en: 'Eight of Pentacles',upright: '专注·精进·勤勉·匠心',                 reversed: '敷衍·追求速成·厌烦·质量下滑',             symbol: 'Ⅷ', suit: 'pentacles' },
  { index: 72, name: '星币·九', en: 'Nine of Pentacles', upright: '自足·优雅·独立·丰盛',                 reversed: '依赖·挥霍·自我怀疑·孤立',                 symbol: 'Ⅸ', suit: 'pentacles' },
  { index: 73, name: '星币·十', en: 'Ten of Pentacles',  upright: '传承·家族·财富·长久安稳',             reversed: '家业动荡·财务失序·传承断裂·孤立',         symbol: 'Ⅹ', suit: 'pentacles' },
  { index: 74, name: '星币侍从', en: 'Page of Pentacles', upright: '踏实·学习·规划·新机会',               reversed: '拖延·缺乏规划·空想·散漫',                 symbol: '侍', suit: 'pentacles' },
  { index: 75, name: '星币骑士', en: 'Knight of Pentacles',upright: '稳健·勤恳·守约·按部就班',             reversed: '僵化·停滞·怠惰·错失良机',                 symbol: '骑', suit: 'pentacles' },
  { index: 76, name: '星币王后', en: 'Queen of Pentacles',upright: '务实·滋养·持家·富足',                 reversed: '过度操心·物质主义·忽略自我·缺乏安全感',   symbol: '后', suit: 'pentacles' },
  { index: 77, name: '星币国王', en: 'King of Pentacles', upright: '富足·成就·可靠·理财',                 reversed: '贪财·守财奴·固执·物质至上',               symbol: '王', suit: 'pentacles' },
];

/** 常用牌阵 */
export interface Spread {
  readonly id: string;
  readonly name: string;
  readonly count: number;
  /** 可选张数（如是非牌阵 1~3 张），不定义时固定为 count */
  readonly counts?: readonly number[];
  readonly positions: readonly string[];
}

export const SPREADS: readonly Spread[] = [
  { id: 'daily',      name: '每日一牌',       count: 1,  positions: ['今日指引'] },
  { id: 'one',        name: '单牌阵',         count: 1,  positions: ['核心指引'] },
  { id: 'three',      name: '三牌阵',         count: 3,  positions: ['过去', '现在', '未来'] },
  { id: 'cross5',     name: '吉普赛十字',     count: 5,  positions: ['心态', '现状', '举措', '环境', '未来'] },
  { id: 'horseshoe',  name: '马蹄阵',         count: 7,  positions: ['过去', '现在', '未来', '建议', '环境', '阻碍', '结果'] },
  { id: 'celtic',     name: '凯尔特十字',     count: 10, positions: ['现状', '挑战', '根基', '近期过去', '目标', '近期未来', '自我态度', '外在环境', '希望与恐惧', '最终结果'] },
  { id: 'star',       name: '六芒星',         count: 7,  positions: ['过去', '现在', '未来', '应对策略', '周遭状况', '自我态度', '最终结果'] },
  { id: 'relationship', name: '关系牌阵',     count: 6,  positions: ['你的感受', '对方的感受', '你们的关系', '你的期望', '对方的期望', '关系走向'] },
  { id: 'yesno',      name: '是非牌阵',       count: 1,  counts: [1, 2, 3], positions: ['是/否指引', '关键影响因素', '补充建议'] },
  { id: 'year',       name: '年度运势',       count: 12, positions: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'] },
  { id: 'chakra',     name: '脉轮牌阵',       count: 7,  positions: ['海底轮', '脐轮', '太阳神经丛', '心轮', '喉轮', '眉心轮', '顶轮'] },
  { id: 'career',     name: '事业规划',       count: 7,  positions: ['职业现状', '优势与资源', '挑战与阻碍', '潜在机会', '内在动力', '环境与外因', '最佳行动方向'] },
  { id: 'love',       name: '爱情关系',       count: 7,  positions: ['你的感受', '对方的感受', '情感纽带', '潜意识动机', '近期发展', '阻碍与课题', '未来走向'] },
  { id: 'decision',   name: '决策牌阵',       count: 5,  positions: ['现状', '选项A的前景', '选项A的代价', '选项B的前景', '选项B的代价'] },
  { id: 'pyramid',    name: '爱情金字塔',     count: 4,  positions: ['感情现状', '你的付出', '对方的付出', '关系发展方向'] },
  { id: 'twochoices', name: '二择一',         count: 5,  positions: ['现状', '选项A', '选项A的结果', '选项B', '选项B的结果'] },
  { id: 'seasons',    name: '四季牌阵',       count: 4,  positions: ['春季', '夏季', '秋季', '冬季'] },
  { id: 'planets',    name: '七行星',         count: 7,  positions: ['太阳', '月亮', '水星', '金星', '火星', '木星', '土星'] },
];

/** 元素中文名 */
export const ELEMENT_ZH: Record<Element, string> = {
  fire: '火', earth: '土', air: '风', water: '水',
};

/** 模式中文名 */
export const MODALITY_ZH: Record<Modality, string> = {
  cardinal: '开创', fixed: '固定', mutable: '变动',
};

/** 行星中文名查找表 */
export const PLANET_ZH: Record<string, string> = Object.fromEntries(PLANETS.map(p => [p.id, p.name]));

/** 宫位中文名查找表 */
export const HOUSE_ZH: Record<number, string> = Object.fromEntries(HOUSES.map(h => [h.num, h.name]));

/** 根据公历日期判定太阳星座 */
export function sunSignOf(month: number, day: number): Sign {
  // 摩羯跨年 12/22-1/19 特殊处理
  for (const s of SIGNS) {
    const [fm, fd] = s.from;
    const [tm, td] = s.to;
    if (fm > tm) {
      // 跨年（如摩羯 12/22-1/19）
      if ((month === fm && day >= fd) || (month === tm && day <= td)) return s;
    } else {
      if ((month === fm && day >= fd) || (month === tm && day <= td)) return s;
    }
  }
  // 兜底（不应到达）
  return SIGNS[0];
}

// ============================================================
// 十二星座详细资料（点击星座卡片展开弹窗使用）
// 内容综合自通行占星资料（zodiacsign / astrotheme / 通行星座百科）
// ============================================================

/** 星座详细资料 */
export interface SignDetail {
  /** 关键词 */
  readonly keyword: string;
  /** 幸运数字 */
  readonly luckyNumber: string;
  /** 幸运色 */
  readonly luckyColor: string;
  /** 幸运石 */
  readonly luckyStone: string;
  /** 幸运日 */
  readonly luckyDay: string;
  /** 最佳配对 */
  readonly bestMatch: string;
  /** 优点 */
  readonly strengths: string;
  /** 缺点 */
  readonly weaknesses: string;
  /** 性格概述 */
  readonly personality: string;
  /** 爱情 */
  readonly love: string;
  /** 事业 */
  readonly career: string;
  /** 健康 */
  readonly health: string;
  /** 一句话箴言 */
  readonly motto: string;
}

/** 十二星座详细资料表（id 与 SIGNS 一致） */
export const SIGN_DETAILS: Record<string, SignDetail> = {
  aries: {
    keyword: '行动 · 开创 · 勇气',
    luckyNumber: '1、9',
    luckyColor: '红、橙',
    luckyStone: '钻石、红宝石、紫水晶',
    luckyDay: '星期二',
    bestMatch: '狮子座、射手座、双子座',
    strengths: '勇敢、坚定、自信、热情、坦率、乐观',
    weaknesses: '冲动、急躁、缺乏耐心、自我中心、三分钟热度',
    personality: '白羊座是黄道第一宫、春天的第一个星座，如火焰般生机勃勃。他们当机立断、付之行动、速战速决，富有首创精神与领导力；热情坦率、慷慨真诚，从不掩饰感情，也不委曲求全。他们渴望征服与冒险，讨厌单调与拖延，是天生的开拓者。',
    love: '白羊在爱情中热情主动，一见钟情后迅速升温，爱得单纯而炽烈，敢于毫无保留地表达心意。他们需要能并肩作战、节奏相当的伴侣；与狮子、射手等火象同盟默契十足，与双子、水瓶等风象也能擦出火花。',
    career: '白羊是天生的领导者，适合竞争性强、富有挑战与变化的工作，如销售、创业、军警消防、体育、新媒体等。他们执行力强、敢闯敢拼，但在团队中需注意收敛强势、学会倾听。',
    health: '火星守护，易头痛、眼疲劳、发炎与运动损伤。建议激烈运动前充分热身，注意用眼卫生与规律作息，少辛辣、少熬夜，管理好情绪与肝火。',
    motto: '我不是等待风暴过去，而是学会在风暴中起舞。',
  },
  taurus: {
    keyword: '稳固 · 感知 · 富足',
    luckyNumber: '2、6',
    luckyColor: '绿、粉',
    luckyStone: '祖母绿、翡翠、粉水晶',
    luckyDay: '星期五',
    bestMatch: '摩羯座、处女座、巨蟹座',
    strengths: '可靠、耐心、务实、忠诚、坚毅、品味高雅',
    weaknesses: '固执、慢热、占有欲强、贪图安逸、不善变通',
    personality: '金牛座是土象固定星座，由金星守护，代表稳固与感官之美。他们踏实可靠、忠诚坚定，追求物质与精神的双重安全感；对美与舒适有深刻品味，热爱美食、艺术与生活质感。他们节奏沉稳、持之以恒，一旦认定目标便会坚持到底。',
    love: '金牛在爱情中深情而专一，慢热但一旦投入便矢志不渝。他们注重仪式感与身体层面的温柔联结，擅长用浪漫细节宠爱伴侣；与摩羯、处女同属土象最契合，与巨蟹、双鱼也能营造温馨稳定的关系。',
    career: '金牛适合需要耐心与稳定积累的领域，如金融、财务、餐饮、艺术设计、农业与房地产等。他们做事脚踏实地、精益求精，是值得信赖的长期主义者，但需警惕因过于求稳而错失良机。',
    health: '金星守护，注意咽喉、甲状腺与颈部问题，易因久坐与贪嘴引发体重困扰。建议规律饮食、适度运动，重视睡眠质量，避免积劳成疾。',
    motto: '慢即是快，稳即是远——真正的价值经得起时间沉淀。',
  },
  gemini: {
    keyword: '沟通 · 求知 · 灵动',
    luckyNumber: '3、5',
    luckyColor: '黄、浅蓝',
    luckyStone: '玛瑙、黄水晶、蛋白石',
    luckyDay: '星期三',
    bestMatch: '天秤座、水瓶座、白羊座',
    strengths: '聪慧、机智、善于表达、好奇心强、适应力佳、多才多艺',
    weaknesses: '善变、三心二意、浮躁、缺乏定性、易言不由衷',
    personality: '双子座是风象变动星座，由水星守护，掌管思维与沟通。他们头脑敏捷、口才出众，对新知充满好奇，是天生的信息猎手与社交达人；思维如双面镜般灵动多变，既能理性分析又富幽默感。他们热爱变化，最怕单调与束缚。',
    love: '双子在爱情中轻松俏皮、妙语连珠，追求精神层面的共鸣与新鲜感。他们需要能陪他们聊天的灵魂伴侣；与天秤、水瓶等风象同频共振，与狮子、白羊等火象也能碰撞出热烈火花。',
    career: '双子适合依赖沟通与智力的职业，如媒体、写作、教学、市场、商务、编程与翻译等。他们学习力强、适应力快，能快速上手新领域，但需注意专注深耕，避免浅尝辄止。',
    health: '水星守护，注意神经紧张、失眠与呼吸系统问题。建议规律作息、适度运动释放脑力疲劳，减少久坐与过度用眼，多接触新鲜空气。',
    motto: '世界是一本书，不旅行的人只读了其中一页。',
  },
  cancer: {
    keyword: '守护 · 情感 · 直觉',
    luckyNumber: '2、7',
    luckyColor: '银白、海蓝',
    luckyStone: '珍珠、月光石、玛瑙',
    luckyDay: '星期一',
    bestMatch: '天蝎座、双鱼座、金牛座',
    strengths: '温柔、体贴、顾家、直觉敏锐、富有同情心、想象力丰富',
    weaknesses: '敏感、情绪化、多虑、过度保护、易沉溺回忆',
    personality: '巨蟹座是水象开创星座，由月亮守护，是黄道中最具母性光辉的星座。他们情感深邃、直觉敏锐，极度重视家庭与安全感；外表坚硬如蟹壳，内心柔软而念旧，对亲近之人无私奉献。他们记忆力惊人，情绪如潮汐般起伏，需要温暖的理解与陪伴。',
    love: '巨蟹在爱情中深情而细腻，以家为圆心经营关系，擅长照顾与体贴。他们需要稳定的承诺与情感回应；与天蝎、双鱼等水象心意相通，与金牛、处女等土象也能共建安稳家园。',
    career: '巨蟹适合需要同理心与细心的工作，如护理、教育、餐饮、房地产、心理与家政等领域。他们善于营造氛围、凝聚团队，是优秀的守护者与后勤核心，但需学会将情绪与工作适度分离。',
    health: '月亮守护，注意肠胃与消化系统问题，情绪波动易影响食欲。建议饮食温和规律，学会释放情绪压力，保证充足的睡眠与居家安全感。',
    motto: '家是心之所向，柔软才是最强大的铠甲。',
  },
  leo: {
    keyword: '光芒 · 自信 · 王者',
    luckyNumber: '1、9',
    luckyColor: '金、橙红',
    luckyStone: '金饰、琥珀、红宝石',
    luckyDay: '星期日',
    bestMatch: '白羊座、射手座、双子座',
    strengths: '自信、慷慨、忠诚、热情、富有领导力、创造力十足',
    weaknesses: '骄傲、好面子、固执、奢华、爱发号施令',
    personality: '狮子座是火象固定星座，由太阳守护，是黄道中天生的王者。他们自信耀眼光芒四射，慷慨大度、讲义气，渴望被欣赏与尊重；创造力与表现欲极强，是天生的舞台中心。他们内心纯净如孩童，自尊心强，需要真诚的赞美与认可。',
    love: '狮子在爱情中热烈而忠诚，愿意为爱人倾尽所有，仪式感十足。他们喜欢被崇拜也懂得宠溺对方；与白羊、射手等火象意气相投，与双子、天秤等风象也能形成光芒四射的组合。',
    career: '狮子适合舞台、管理与创意型工作，如演艺、设计、管理、公关、教育等。他们天生具备号召力与组织才能，善于激励团队，但需放下身段、学会倾听与合作。',
    health: '太阳守护，注意心脏、血压与脊椎问题，易因过度操劳与情绪起伏影响健康。建议规律有氧运动、保持乐观心态，避免熬夜与暴饮暴食。',
    motto: '我生来就是高山而非溪流，我要于群峰之巅俯视平庸。',
  },
  virgo: {
    keyword: '精细 · 服务 · 完美',
    luckyNumber: '5、8',
    luckyColor: '灰蓝、米白',
    luckyStone: '蓝宝石、翡翠、珍珠',
    luckyDay: '星期三',
    bestMatch: '金牛座、摩羯座、巨蟹座',
    strengths: '细心、务实、条理清晰、追求完美、乐于助人、自律',
    weaknesses: '挑剔、唠叨、过度担忧、自我苛求、难以放松',
    personality: '处女座是土象变动星座，由水星守护，是黄道中最具服务精神与工匠精神的星座。他们心思缜密、追求完美，擅长分析与解决问题；务实理性、精益求精，对自己与他人都有很高的标准。他们外表冷静克制，内心柔软善良，以行动默默付出。',
    love: '处女在爱情中含蓄而真诚，用行动而非言语表达爱意，照顾对方无微不至。他们需要能包容其挑剔的伴侣；与金牛、摩羯等土象最为合拍，与巨蟹、双鱼等水象也能在温柔中互补。',
    career: '处女适合医疗、教育、财务、数据分析、编辑质检与行政管理等需要精确与条理的领域。他们是一流的执行者与优化者，但需避免过度追求完美而延误决策。',
    health: '水星守护，注意肠胃功能与神经系统，易因思虑过度引发焦虑失眠。建议规律三餐、减少咖啡因摄入，学会放空与放松，别对自己太苛刻。',
    motto: '完美不是没有瑕疵，而是把每一件小事都做到极致。',
  },
  libra: {
    keyword: '平衡 · 优雅 · 和谐',
    luckyNumber: '6、2',
    luckyColor: '粉、淡蓝',
    luckyStone: '蓝宝石、碧玉、蛋白石',
    luckyDay: '星期五',
    bestMatch: '双子座、水瓶座、狮子座',
    strengths: '优雅、公正、善于协调、审美出众、温和理性、外交手腕',
    weaknesses: '优柔寡断、依赖他人、回避冲突、表面化、易妥协',
    personality: '天秤座是风象开创星座，由金星守护，是黄道中唯一以无生命物（天平）为象征的星座。他们天生追求平衡、公正与美感，是出色的协调者与关系专家；谈吐优雅、品味出众，善于在群体中营造和谐氛围。他们理性而有逻辑，却常在抉择时反复权衡。',
    love: '天秤在爱情中浪漫而细腻，讲究平等与相互尊重，喜欢有仪式感的互动。他们需要精神与审美的双重共鸣；与双子、水瓶等风象最是灵魂伴侣，与狮子、射手等火象也能互补平衡。',
    career: '天秤适合需要审美与协调的工作，如设计、法律、公关、外交、人力资源与艺术领域。他们善于谈判与平衡各方利益，是天生的和事佬与形象大使，但需训练果断决策的能力。',
    health: '金星守护，注意肾脏、腰背与内分泌问题，压力大时易倾向拖延与失衡。建议规律运动、均衡饮食，学会为自己做决定，避免长期回避冲突。',
    motto: '世间安得双全法——平衡不是妥协，而是更高阶的智慧。',
  },
  scorpio: {
    keyword: '深度 · 洞察 · 蜕变',
    luckyNumber: '8、9',
    luckyColor: '深红、紫黑',
    luckyStone: '黑曜石、石榴石、红玛瑙',
    luckyDay: '星期二',
    bestMatch: '巨蟹座、双鱼座、金牛座',
    strengths: '洞察力强、意志坚定、情感深刻、忠诚专一、爆发力惊人',
    weaknesses: '多疑、占有欲强、记仇、极端、不轻易信任',
    personality: '天蝎座是水象固定星座，由冥王星守护，是黄道中最深邃神秘的星座。他们洞察力惊人，能一眼看穿事物本质；意志如钢铁般坚定，情感炽烈而专注，一旦认定便义无反顾。他们外表冷静克制，内心暗流涌动，渴望极致的真实与掌控，是天生的破局者与蜕变者。',
    love: '天蝎在爱情中全情投入、忠诚专一，爱得深沉而热烈，占有欲与保护欲并存。他们需要绝对的信任与坦诚；与巨蟹、双鱼等水象心意相通，与金牛、处女等土象也能在稳固中交织深情。',
    career: '天蝎适合研究、侦查、金融、心理、医疗与危机处理等领域。他们专注力强、善于挖掘深层问题，在高压下愈战愈勇，但需学会团队协作与适度放手。',
    health: '冥王星守护，注意生殖泌尿系统与内分泌，情绪压抑易引发旧疾。建议学习释放情绪、规律排解压力，避免过度紧张与报复性熬夜。',
    motto: '凤凰涅槃，浴火重生——最深的黑暗之后，是全新的黎明。',
  },
  sagittarius: {
    keyword: '自由 · 探索 · 远方',
    luckyNumber: '3、9',
    luckyColor: '紫、宝蓝',
    luckyStone: '紫水晶、绿松石、蓝宝石',
    luckyDay: '星期四',
    bestMatch: '白羊座、狮子座、天秤座',
    strengths: '乐观、豁达、热爱自由、冒险精神、坦率真诚、见多识广',
    weaknesses: '粗心、直言不讳、缺乏耐心、爱承诺不兑现、难安定',
    personality: '射手座是火象变动星座，由木星守护，是黄道中的哲学家与旅行家。他们乐观开朗、心胸开阔，视自由为生命，永远向往远方与新知；坦率真诚、幽默风趣，浑身散发着阳光般的感染力。他们追求意义与成长，讨厌被规则与责任束缚。',
    love: '射手在爱情中热情奔放、坦诚以待，追求有思想共鸣与共同成长的伴侣。他们需要足够的自由与空间；与白羊、狮子等火象意气相投，与双子、天秤等风象也能在思想碰撞中擦出火花。',
    career: '射手适合教育、出版、旅行、法律、国际贸易与体育等能拓展视野的领域。他们视野开阔、富有远见，是天生的开拓者与布道者，但需培养持之以恒的耐心。',
    health: '木星守护，注意肝脏、臀部与坐骨神经问题，易因运动过度与饮食无度受损。建议均衡饮食、适度运动，避免暴饮暴食与长期奔波劳碌。',
    motto: '世界那么大，我想去看看——自由是灵魂的氧气。',
  },
  capricorn: {
    keyword: '责任 · 攀登 · 成就',
    luckyNumber: '4、8',
    luckyColor: '深棕、墨绿',
    luckyStone: '黑曜石、缟玛瑙、碧玉',
    luckyDay: '星期六',
    bestMatch: '金牛座、处女座、天蝎座',
    strengths: '自律、坚韧、责任心强、务实可靠、目标明确、沉稳老练',
    weaknesses: '严肃、压抑、固执、过劳、情感内敛、不善变通',
    personality: '摩羯座是土象开创星座，由土星守护，是黄道中天生的攀登者与建设者。他们自律坚韧、目标明确，视责任与成就为生命底色；务实低调、老成持重，能在漫长岁月中默默耕耘，一步一个脚印走向巅峰。他们外表沉稳冷峻，内心自有深沉的力量。',
    love: '摩羯在爱情中内敛而深情，行动多于言语，以责任与承诺守护关系。他们慢热但极其专一；与金牛、处女等土象志同道合，与天蝎、巨蟹等水象也能在深情中彼此支撑。',
    career: '摩羯是天生的管理者与实干家，适合政商、金融、工程、法律与管理岗位。他们极具规划力与执行力，耐得住寂寞、扛得住压力，是天生的上位者，但需平衡工作与生活。',
    health: '土星守护，注意骨骼关节、牙齿与皮肤问题，易因过度操劳与压抑情绪积劳成疾。建议规律作息、适度负重运动，学会放松与表达情感。',
    motto: '不积跬步，无以至千里；不以山海为远，终抵星辰。',
  },
  aquarius: {
    keyword: '革新 · 独立 · 前瞻',
    luckyNumber: '4、7',
    luckyColor: '电蓝、银灰',
    luckyStone: '蓝晶石、紫水晶、珍珠',
    luckyDay: '星期六',
    bestMatch: '天秤座、双子座、射手座',
    strengths: '独立、创新、理性、博爱、思想前卫、平权意识',
    weaknesses: '疏离、固执己见、叛逆、难以捉摸、不擅情感表达',
    personality: '水瓶座是风象固定星座，由天王星守护，是黄道中的变革者与未来主义者。他们思想前卫、特立独行，视自由与平等为最高信条；理性客观、博爱无私，关心社会与全人类福祉。他们聪明绝顶却不拘常规，在自己的轨道上坚定前行，是时代浪潮的弄潮儿。',
    love: '水瓶在爱情中尊重对方独立人格，追求精神共鸣与灵魂自由。他们不黏腻但深情专一；与双子、天秤等风象最是知音，与射手、白羊等火象也能在冒险与自由中找到默契。',
    career: '水瓶适合科技、科研、互联网、设计、公益与创新领域。他们创意无限、敢于颠覆，是优秀的发明家与改革者，但需注意落地执行与人际温度。',
    health: '天王星守护，注意循环系统、神经与小腿问题，易因生活不规律引发不适。建议保持规律作息、适量有氧运动，多参与集体活动增强人际联结。',
    motto: '真正的独行者不是离群索居，而是在人群中坚持自己的方向。',
  },
  pisces: {
    keyword: '梦幻 · 直觉 · 慈悲',
    luckyNumber: '7、3',
    luckyColor: '海蓝、淡紫',
    luckyStone: '海蓝宝、紫水晶、月光石',
    luckyDay: '星期四',
    bestMatch: '巨蟹座、天蝎座、金牛座',
    strengths: '温柔、富有同情心、想象力丰富、直觉敏锐、艺术天赋',
    weaknesses: '多愁善感、逃避现实、优柔寡断、易被欺骗、沉溺幻想',
    personality: '双鱼座是水象变动星座，由海王星守护，是黄道十二宫的终点与集大成者。他们情感丰沛、慈悲为怀，拥有超凡的想象力与艺术天赋；直觉如大海般深邃，能敏锐感知他人的情绪。他们温柔浪漫、富有灵性，如鱼游于情感与梦幻之间，是十二星座中最具诗意的存在。',
    love: '双鱼在爱情中浪漫至死不渝，甘愿为爱付出一切，追求灵魂层面的交融。他们需要温柔而坚定的守护；与巨蟹、天蝎等水象心意相通，与金牛、摩羯等土象也能在现实中找到安稳的港湾。',
    career: '双鱼适合艺术、音乐、影视、心理、慈善与医疗照护等富有灵性与温度的领域。他们创造力惊人、共情力极强，是天才的艺术家与疗愈者，但需学会锚定现实、聚焦目标。',
    health: '海王星守护，注意脚部、淋巴与免疫系统，易因情绪敏感影响睡眠与身心平衡。建议规律作息、亲近水边与自然，适度运动并培养稳定的生活节奏。',
    motto: '愿你在现实的深海之中，仍保有仰望星空的勇气。',
  },
};
