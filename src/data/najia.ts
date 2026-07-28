// 纳甲数据
const INNER_OUTER_TRIGRAMS = [{name:'乾',inner:'甲子甲寅甲辰',outer:'壬午壬申壬戌'},{name:'坤',inner:'乙未乙巳乙卯',outer:'癸丑癸亥癸酉'},{name:'震',inner:'庚子庚寅庚辰',outer:'庚午庚申庚戌'},{name:'巽',inner:'辛丑辛亥辛酉',outer:'辛未辛巳辛卯'},{name:'坎',inner:'戊寅戊辰戊午',outer:'戊申戊戌戊子'},{name:'离',inner:'己卯己丑己亥',outer:'己酉己未己巳'},{name:'艮',inner:'丙辰丙午丙申',outer:'丙戌丙子丙寅'},{name:'兑',inner:'丁巳丁卯丁丑',outer:'丁亥丁酉丁未'}];
const TRIGRAM_INDEX: Record<string, number> = {乾:0,兑:1,离:2,震:3,巽:4,坎:5,艮:6,坤:7};

export function getNajia(upperName: string, lowerName: string): string {
  const u = INNER_OUTER_TRIGRAMS[TRIGRAM_INDEX[upperName]], l = INNER_OUTER_TRIGRAMS[TRIGRAM_INDEX[lowerName]];
  if (!u || !l) throw new Error('invalid trigram');
  return l.inner + u.outer;
}

export function parseNajia(najia: string) {
  if (najia.length !== 12) throw new Error('najia must be 12 chars');
  return Array.from({ length: 6 }, (_, i) => ({ gan: najia[i * 2], zhi: najia[i * 2 + 1], ganzhi: najia.slice(i * 2, i * 2 + 2) }));
}

export const TIANGAN_LIST = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
export const DIZHI_LIST = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
export const DIZHI_TIME = [{name:'子',start:23,end:1},{name:'丑',start:1,end:3},{name:'寅',start:3,end:5},{name:'卯',start:5,end:7},{name:'辰',start:7,end:9},{name:'巳',start:9,end:11},{name:'午',start:11,end:13},{name:'未',start:13,end:15},{name:'申',start:15,end:17},{name:'酉',start:17,end:19},{name:'戌',start:19,end:21},{name:'亥',start:21,end:23}];

export function hourToDizhi(hour: number): string {
  if (hour === 23 || hour === 0) return '子';
  for (const t of DIZHI_TIME) if (hour >= t.start && hour < t.end) return t.name;
  return '子';
}

export const CANGGAN_STRING = '癸,己癸辛,甲丙戊,乙,戊乙癸,丙戊庚,丁己,己丁乙,庚壬戊,辛,戊辛丁,壬甲';
export function parseCanggan(zhi: string): readonly string[] {
  const idx = DIZHI_LIST.indexOf(zhi);
  if (idx < 0) return [];
  return CANGGAN_STRING.split(',')[idx]?.split('').filter(c => c) || [];
}
