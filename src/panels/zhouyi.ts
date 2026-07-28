// 周易面板
import { Hexagram, ZhouYiPanel } from '../types';
import { getHexagramByIndex, findHexagramByTrigrams } from '../data/hexagrams';

const GUA_CI: readonly string[] = [
  '元亨利贞','元亨，利牝马之贞','元亨，利贞','亨，匪我求童蒙','有孚，光亨，贞吉','有孚，窒惕','贞，丈人吉','吉',
  '亨','履虎尾，不咥人','小往大来，吉亨','不利君子贞','亨于野，亨于陵','元亨','亨，君子有终','利建侯行师',
  '元亨，利贞','元亨，利涉大川','元亨利贞','盍而不荐','亨，利用狱','亨，小利有所往','不利有攸往','亨，出入无疾',
  '元亨利贞','利贞，不家食吉','贞吉','栋桡','习坎，有孚','利贞，亨','亨利贞，取女吉','亨，无咎',
  '亨，小利贞','利贞','康侯用锡马蕃庶','明夷于飞','利女贞','小事吉','利西南','利西南',
  '有孚，元吉','利有攸往','扬于王庭','女壮','亨，王假有庙','元亨，用见大人','亨，贞大人吉','改邑不改井',
  '己日乃孚','元吉，亨','亨，震来虩虩','艮其背','女归吉','征凶','亨，王假之','小亨',
  '小亨，利有攸往','利贞','亨','涣亨','亨，苦节','豚鱼吉','亨，利贞','小过亨',
  '亨小，利贞','亨'
];

const TUAN_ZHUAN: readonly string[] = [
  '大哉乾元，万物资始','至哉坤元，万物资生','屯，刚柔始交','蒙，山下有泽','需，须也','讼，上刚下险','师，众也','比，比也',
  '小畜，柔得位','履，柔履刚也','泰，小往大来','否，大往小来','同人，柔得位得中','大有，柔得尊位','谦，谦也','豫，刚应而志行',
  '随，刚来而下柔','蛊，刚上而柔下','临，刚浸而长','观，观也','噬嗑，颐中有物','贲，柔来而文刚','剥，柔变刚也','复，刚反',
  '无妄，刚自外来','大畜，刚健笃实','颐，养正','大过，大者过也','坎，险也','离，丽也','咸，感也','恒，久也',
  '遁，亨，遁而亨也','大壮，大者壮也','晋，进也','明夷，诛也','家人，女正位乎内','睽，火动而上','蹇，难也','解，缓也',
  '损，损下益上','益，损上益下','夬，决也','姤，遇也','萃，聚也','升，柔以时升','困，刚掩也','井，井养而不穷',
  '革，革而信之','鼎，象也','震，震也','艮，止也','渐，渐之进也','归妹，女之终也','丰，大也','旅，小亨',
  '巽，柔皆顺乎刚','兑，说也','涣，涣亨','节，节亨','中孚，柔在内','小过，小者过也','既济，刚柔正','未济，柔得中'
];

const XIANG_ZHUAN: readonly string[] = [
  '天行健，君子以自强不息','地势坤，君子以厚德载物','云雷屯，君子以经纶','山下出泉蒙，君子以果行育德',
  '云上于天需，君子以饮食宴乐','天与水违行讼，君子以作事谋始','地中有水师，君子以容民畜众','地上有水比，君子以建万国',
  '风行天上小畜，君子以懿文德','上天下泽履，君子以辩上下','天地交泰，君子以财成天地','天地不交否，君子以俭德辟难',
  '天与火同人，君子以类族辨物','火在天上大有，君子以遏恶扬善','地中有山谦，君子以裒多益寡','雷出地奋豫，君子以作乐崇德',
  '泽中有雷随，君子以向晦入宴息','山下有风蛊，君子以振民育德','泽上有地临，君子以教思无穷','风行地上观，君子以省方观民设教',
  '雷电噬嗑，先王以明罚敕法','山下有火贲，君子以明庶政','山附于地剥，君子以厚下安宅','雷在地中复，君子以至日闭关',
  '天下雷行无妄，君子以茂对时育物','天在山中大畜，君子以多识前言往行','山下有雷颐，君子以慎言语节饮食','泽灭木大过，君子以独立不惧',
  '水洊至习坎，君子以常德行','明两作离，君子以继明照于四方','山上有泽咸，君子以虚受人','雷风恒，君子以立不易方',
  '天下有山遁，君子以远小人','雷在天上大壮，君子以非礼弗履','明出地上晋，君子以自昭明德','明入地中明夷，君子以莅众',
  '风火家人，君子以言有物','上火下泽睽，君子以同而异','山上有水蹇，君子以反身修德','雷雨作解，君子以赦过宥罪',
  '山下有泽损，君子以惩忿窒欲','风雷益，君子以见善则迁','泽上于天夬，君子以施禄及下','天下有风姤，君子以施命诰四方',
  '泽上于地萃，君子以除戎器','地中生木升，君子以顺德','泽无水困，君子以致命遂志','木上有水井，君子以劳民劝相',
  '泽中有火革，君子以治历明时','木上有火鼎，君子以正位凝命','洊雷震，君子以恐惧修省','兼山艮，君子以思不出其位',
  '山上有木渐，君子以居贤德','泽上有雷归妹，君子以永终知敝','雷电皆至丰，君子以折狱致刑','山上有火旅，君子以明慎用刑',
  '随风巽，君子以申命行事','丽泽兑，君子以朋友讲习','风行水上涣，君子以享于帝立庙','泽上有水节，君子以制数度',
  '泽上有风中孚，君子以议狱缓死','山上有雷小过，君子以行过乎恭','水在火上既济，君子以思患而豫防之','火在水上未济，君子以慎辨物居方'
];

export function buildZhouYi(ben: Hexagram, dong: readonly number[]): ZhouYiPanel {
  const benRaw = getHexagramByIndex(ben.index);
  const huUpper = [benRaw.lines[1], benRaw.lines[2], benRaw.lines[3]];
  const huLower = [benRaw.lines[2], benRaw.lines[3], benRaw.lines[4]];
  const bitsToIdx = (a: readonly boolean[]): number => (a[0] ? 4 : 0) + (a[1] ? 2 : 0) + (a[2] ? 1 : 0);
  const huIndex = findHexagramByTrigrams(bitsToIdx(huUpper), bitsToIdx(huLower));
  const hu = makeHexFromIndex(huIndex);

  const changed = benRaw.lines.map((b, i) => dong.includes(i + 1) ? !b : b);
  const bianIndex = findHexagramByTrigrams(bitsToIdx([changed[0], changed[1], changed[2]]), bitsToIdx([changed[3], changed[4], changed[5]]));
  const bian = makeHexFromIndex(bianIndex);

  const benCi = GUA_CI[ben.index - 1] || '';
  const bianCi = GUA_CI[bian.index - 1] || '';
  const tz = TUAN_ZHUAN[ben.index - 1] || '';
  const xz = XIANG_ZHUAN[ben.index - 1] || '';
  const yaoCi = dong.map(pos => `${pos}爻动：${GUA_CI[(ben.index + pos) % 64] || '动爻辞'}`);

  let judgment = '吉';
  if (bianCi.includes('凶') || bianCi.includes('不利')) judgment = '凶';
  else if (bianCi.includes('吉') && bianCi.includes('亨')) judgment = '大吉';
  else if (bianCi.includes('无咎') || bianCi.includes('小利')) judgment = '平';

  return { ben, hu, bian, dong, guaCi: { ben: benCi, bian: bianCi }, tuanZhuan: tz, xiangZhuan: xz, yaoCi, judgment };
}

function makeHexFromIndex(index: number): Hexagram {
  const r = getHexagramByIndex(index);
  return { index: r.index, name: r.name, fullName: r.fullName, upper: r.upper, lower: r.lower, palace: r.palace, element: r.element, nature: r.nature, lines: [], shiPosition: r.shiPosition, yingPosition: r.yingPosition };
}
