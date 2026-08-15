import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAJOR_ARCANA, MINOR_ARCANA, SPREADS } from '../src/data/western';
import { createTarotDeck, spreadById, buildTarotSpread, drawTarot } from '../src/western';

const ALL_NAMES = [...MAJOR_ARCANA, ...MINOR_ARCANA].map(c => c.name);

test('T1: createTarotDeck 返回 78 张（22 大 + 56 小）且集合完整无重复', () => {
  const deck = createTarotDeck();
  assert.equal(deck.length, 78, '整副牌应为 78 张');
  assert.equal(new Set(deck.map(d => d.card.name)).size, 78, '牌名不应重复');
  assert.deepEqual(
    deck.map(d => d.card.index).sort((a, b) => a - b),
    Array.from({ length: 78 }, (_, i) => i),
    'index 应完整覆盖 0-77'
  );
  assert.deepEqual([...deck.map(d => d.card.name)].sort(), [...ALL_NAMES].sort(), '洗牌不应改变牌集合');
});

test('T2: MINOR_ARCANA 56 张，四花色各 14，含 A-10 数字牌与侍骑后王宫廷牌', () => {
  assert.equal(MINOR_ARCANA.length, 56, '小阿卡纳应为 56 张');
  const suits = new Set(MINOR_ARCANA.map(c => c.suit));
  assert.deepEqual([...suits].sort(), ['cups', 'pentacles', 'swords', 'wands'], '应覆盖四花色');
  for (const s of suits) {
    const group = MINOR_ARCANA.filter(c => c.suit === s);
    assert.equal(group.length, 14, `${s} 花色应为 14 张`);
    const num = group.filter(c => /^[Ⅰ-Ⅹ]$/.test(c.symbol));
    assert.equal(num.length, 10, `${s} 应有 10 张数字牌（Ace-10）`);
    const court = group.filter(c => ['侍', '骑', '后', '王'].includes(c.symbol));
    assert.equal(court.length, 4, `${s} 应有 侍/骑/后/王 4 张宫廷牌`);
  }
});

test('T3: 洗牌时逐张预置正/逆位（random<0.5 逆位，>=0.5 正位）', () => {
  const deck = createTarotDeck(() => 0.1);
  assert.ok(deck.every(d => d.reversed === true), 'random 恒 0.1 时应全部逆位');
  const deck2 = createTarotDeck(() => 0.9);
  assert.ok(deck2.every(d => d.reversed === false), 'random 恒 0.9 时应全部正位');
});

test('T4: 洗牌随机性——相同随机源可复现，不同随机源牌序不同', () => {
  const seq = (seed: number) => () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  const a1 = createTarotDeck(seq(1)).map(d => d.card.name).join(',');
  const a2 = createTarotDeck(seq(1)).map(d => d.card.name).join(',');
  const b = createTarotDeck(seq(2)).map(d => d.card.name).join(',');
  assert.equal(a1, a2, '相同随机源应可复现');
  assert.notEqual(a1, b, '不同随机源应产生不同牌序');
});

test('T5: drawTarot 从牌堆顶部无放回抽取，正逆位沿用展示前预置值', () => {
  const deck = createTarotDeck(() => 0.1);
  const spread = drawTarot('three', deck, () => 0.4);
  assert.equal(spread.draws.length, 3, '三牌阵应抽 3 张');
  assert.equal(spread.spreadId, 'three');
  const names = spread.draws.map(d => d.card.name);
  assert.deepEqual(names, deck.slice(0, 3).map(d => d.card.name), '应按牌堆顶部顺序抽取');
  assert.ok(spread.draws.every(d => d.reversed === true), 'reversed 应沿用洗牌时预置值');
});

test('T6: 各牌阵抽取数量与位置顺序符合定义', () => {
  const deck = createTarotDeck(() => 0.1);
  for (const s of SPREADS) {
    const spread = drawTarot(s.id, deck, () => 0.4);
    assert.equal(spread.draws.length, s.count, `${s.id} 应抽 ${s.count} 张`);
    spread.draws.forEach((d, i) => {
      assert.equal(d.position, s.positions[i], `${s.id} 第${i + 1}位应为「${s.positions[i]}」`);
    });
  }
});

test('T7: spreadById 未知 id 回退三牌阵', () => {
  const spread = spreadById('nonexistent');
  assert.equal(spread.id, 'three', '未知牌阵应回退三牌阵');
});

test('T8: buildTarotSpread 按抽取先后顺序摆位且截断多余牌', () => {
  const deck = createTarotDeck(() => 0.1);
  const picks = deck.slice(0, 7).map(d => ({ card: d.card, reversed: d.reversed }));
  const spread = buildTarotSpread('three', picks);
  assert.equal(spread.draws.length, 3, '三牌阵只取前 3 张');
  assert.deepEqual(spread.draws.map(d => d.card.name), picks.slice(0, 3).map(p => p.card.name), '抽取先后即摆牌先后');
  assert.deepEqual(spread.draws.map(d => d.position), ['过去', '现在', '未来']);
});

test('T9: 不同牌阵抽取数量不同（无放回语义）', () => {
  const deck = createTarotDeck(() => 0.1);
  const spreadA = drawTarot('three', deck, () => 0.4);
  const spreadB = drawTarot('cross5', deck, () => 0.4);
  assert.notEqual(spreadA.draws.length, spreadB.draws.length, '不同牌阵抽取数不同');
  assert.equal(new Set(spreadA.draws.map(d => d.card.name)).size, 3);
  assert.equal(new Set(spreadB.draws.map(d => d.card.name)).size, 5);
});

test('T10: major 模式仅返回 22 张大阿卡纳，集合完整无重复', () => {
  const deck = createTarotDeck('major');
  assert.equal(deck.length, 22, '大阿卡纳牌组应为 22 张');
  assert.equal(new Set(deck.map(d => d.card.name)).size, 22, '牌名不应重复');
  assert.deepEqual(
    deck.map(d => d.card.name).sort(),
    [...MAJOR_ARCANA].map(c => c.name).sort(),
    'major 模式只应包含大阿卡纳'
  );
  const majorIndex = new Set(MAJOR_ARCANA.map(c => c.index));
  assert.ok(deck.every(d => majorIndex.has(d.card.index)), '不应混入小阿卡纳');
});

test('T11: 所有牌阵张数与位置一致，可变张数牌阵默认值合法', () => {
  for (const s of SPREADS) {
    assert.ok(s.positions.length >= s.count, `${s.id} 位置数量应不少于默认张数 ${s.count}`);
    if (s.counts) {
      assert.equal(s.counts[0], s.count, `${s.id} counts 首项应等于默认张数`);
      assert.equal(Math.max(...s.counts), s.positions.length, `${s.id} 最大可选张数应等于位置数量`);
      assert.ok(s.counts.length > 1, `${s.id} 支持多档张数`);
    } else {
      assert.equal(s.positions.length, s.count, `${s.id} 位置数量应等于固定张数`);
    }
  }
  const yesno = SPREADS.find(s => s.id === 'yesno')!;
  assert.deepEqual([...yesno.counts!], [1, 2, 3], '是非牌阵支持 1~3 张');
  const celtic = SPREADS.find(s => s.id === 'celtic')!;
  assert.equal(celtic.positions.length, 10, '凯尔特十字应含 10 个位置');
});
