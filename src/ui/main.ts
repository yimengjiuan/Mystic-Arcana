// UI 主程序：DOM 绑定、事件、面板渲染、横向比对、AI解卦
import { fullPaipan } from '../engine';
import type { TimeInput, QiGuaMethod, QiGuaBasis, CoreState, Synthesized, Hexagram, Line } from '../types';
import { buildBaziPanel } from '../panels/bazi';

const $ = (id: string) => document.getElementById(id);

interface Snap { id: number; label: string; input: TimeInput; method: QiGuaMethod; basis: QiGuaBasis; state: CoreState; synthesis: Synthesized }
const history: Snap[] = [];
let snapshotId = 0;
let activeTab = 'overview';

const BASIS_ZH: Record<QiGuaBasis, string> = { time: '仅时间', time_bazi: '时间+八字', bazi: '仅八字' };
const BASIS_SUFFIX: Record<QiGuaBasis, string> = { time: '', time_bazi: '+八', bazi: '八' };
const METHOD_HINTS: Record<QiGuaMethod, { ph: string; lb: string }> = {
  time: { ph: '时间起卦无需输入', lb: '数字/铜钱' },
  number: { ph: '如 5,10 或 3,8,14', lb: '数字(2-3个)' },
  meihua: { ph: '如 1,5 (上卦数,下卦数)', lb: '上下卦数' },
  zaobi: { ph: '随机种子(可选)', lb: '种子数' },
  cuanke: { ph: '如 2,1,3,0,2,1', lb: '6次背面数(0-3)' }
};

function setDefaultTime(): void {
  const now = new Date();
  (['year', 'month', 'day', 'hour'] as const).forEach((id, i) => {
    const el = $(id) as HTMLInputElement | null;
    if (el) el.value = String([now.getFullYear(), now.getMonth() + 1, now.getDate(), now.getHours()][i]);
  });
}

function readForm() {
  const num = (id: string) => parseInt(($(id) as HTMLInputElement)?.value || '0', 10);
  const y = num('year'), m = num('month'), d = num('day'), h = num('hour');
  const method = (($('method') as HTMLSelectElement)?.value || 'time') as QiGuaMethod;
  const nums = (($('nums') as HTMLInputElement)?.value || '').split(/[,\s]+/).map(Number).filter(n => !isNaN(n));
  const basis = (($('basis') as HTMLSelectElement)?.value || 'time') as QiGuaBasis;
  const birth: TimeInput | undefined = basis === 'time' ? undefined : { year: num('byear'), month: num('bmonth'), day: num('bday'), hour: num('bhour'), minute: 0 };
  const gender = ($('gender') as HTMLSelectElement)?.value as '男' | '女' | undefined;
  let input: TimeInput = { year: y, month: m, day: d, hour: h, minute: 0 };
  if (basis === 'bazi' && birth) input = { ...birth };
  return { input, method, nums, basis, birth, gender };
}

function updateBasisVisibility(): void {
  const basis = (($('basis') as HTMLSelectElement)?.value || 'time') as QiGuaBasis;
  const block = $('birth-block');
  if (block) block.style.display = basis === 'time' ? 'none' : 'grid';
  for (const id of ['year', 'month', 'day', 'hour']) {
    const el = $(id) as HTMLInputElement | null;
    if (el) el.disabled = basis === 'bazi';
  }
}

function updateMethodHint(): void {
  const method = (($('method') as HTMLSelectElement)?.value || 'time') as QiGuaMethod;
  const hint = METHOD_HINTS[method];
  const numsInput = $('nums') as HTMLInputElement | null;
  if (numsInput) numsInput.placeholder = hint.ph;
  const numsLabel = numsInput?.parentElement;
  if (numsLabel && numsLabel.childNodes[0] && numsLabel.childNodes[0].nodeType === 3) {
    numsLabel.childNodes[0].nodeValue = hint.lb;
  }
}

function renderLine(line: Line): string {
  const isYang = line.yinYang === 'yang';
  const mark = line.changed ? (isYang ? '━━━━━ ○' : '━ ━ ━ ×') : (isYang ? '━━━━━' : '━ ━ ━');
  const tags = (line.shi ? '<span class="tag-shi">世</span>' : '') + (line.ying ? '<span class="tag-ying">应</span>' : '');
  return `<div class="line ${isYang ? 'yang' : 'yin'} ${line.changed ? 'changed' : ''}"><span class="line-mark">${mark}</span><span class="line-pos">${line.position}爻</span><span class="line-gz">${line.tiangan}${line.dizhi}</span><span class="line-lq">${line.liuQin}</span>${tags}</div>`;
}

function renderHex(hex: Hexagram): string {
  return `<div class="hex"><h3>${hex.fullName}（${hex.palace}宫）</h3><div>${hex.lines.slice().reverse().map(renderLine).join('')}</div></div>`;
}

function makeLabel(input: TimeInput, method: QiGuaMethod, basis: QiGuaBasis): string {
  return `${input.year}/${input.month}/${input.day} ${input.hour}时[${method}${BASIS_SUFFIX[basis]}]`;
}

function renderPanels(state: CoreState, syn: Synthesized): string {
  const x = state.panels;
  const bd = buildBaziPanel(state.bazi);
  const pillars = bd.pillars.map((p, i) => `<div class="pillar"><div class="p-name">${['年柱', '月柱', '日柱', '时柱'][i]}</div><div class="p-gz">${p.gz.ganzhi}</div><div class="p-cg">${p.canggan.map(c => `${c.gan}<sub>${c.shiShen}</sub>`).join(' ')}</div><div class="p-ny">${p.nayin}</div></div>`).join('');
  return [
    `<section class="panel xiaoliu"><h2>小六壬</h2><div class="path">${x.xiaoliu.path.join(' -> ')}</div><div class="result ${x.xiaoliu.result}">${x.xiaoliu.result}</div><div class="element">五行：${x.xiaoliu.element}</div><p>${x.xiaoliu.meaning}</p></section>`,
    `<section class="panel bazi"><h2>四柱</h2><div class="pillars">${pillars}</div><p>${bd.summary}</p></section>`,
    `<section class="panel meihua"><h2>梅花易数</h2><div class="triple">${renderHex(x.meihua.ben)}${renderHex(x.meihua.hu)}${renderHex(x.meihua.bian)}</div><p>动爻：${x.meihua.dong.join('、')}</p><p>体：${x.meihua.tiElement} 用：${x.meihua.yongElement}</p><p>${x.meihua.interpretation}</p></section>`,
    `<section class="panel zhouyi"><h2>周易</h2><div class="ci"><div><strong>本卦辞：</strong>${x.zhouyi.guaCi.ben}</div><div><strong>变卦辞：</strong>${x.zhouyi.guaCi.bian}</div></div><div class="tz"><strong>彖传：</strong>${x.zhouyi.tuanZhuan}</div><div class="xz"><strong>象传：</strong>${x.zhouyi.xiangZhuan}</div><div class="yao">${x.zhouyi.yaoCi.map(y => `<div>${y}</div>`).join('')}</div><p>判断：${x.zhouyi.judgment}</p></section>`,
    `<section class="panel ziwei"><h2>紫微简化</h2><div>命宫：${x.ziwei.mingGong} 身宫：${x.ziwei.shenGong}</div><div>五行局：${x.ziwei.wuXingJu}</div><table><tr><th>主星</th><th>宫位</th><th>亮度</th></tr>${x.ziwei.mainStars.map(s => `<tr><td>${s.star}</td><td>${s.gong}</td><td>${s.brightness}</td></tr>`).join('')}</table><p>${x.ziwei.summary}</p></section>`,
    `<section class="panel liuyao"><h2>六爻基础</h2><div>${x.liuyao.summary}</div><table><tr><th>爻位</th><th>六亲</th><th>干支</th><th>六神</th></tr>${x.liuyao.liuQinMap.map((q, i) => `<tr><td>${q.position}爻</td><td>${q.liuQin}</td><td>${q.ganZhi}</td><td>${x.liuyao.liuShen[i] || ''}</td></tr>`).join('')}</table></section>`,
    `<section class="panel synthesis"><h2>综合分析</h2><div class="trend ${syn.trend}">${syn.trend} 评分 ${syn.score}</div><p class="summary">${syn.summary}</p><div class="kp"><strong>要点：</strong>${syn.keyPoints.join('；') || '-'}</div><div class="warn"><strong>提醒：</strong>${syn.warnings.join('；') || '-'}</div><div class="rec"><strong>建议：</strong>${syn.recommendations.join('；')}</div></section>`
  ].join('');
}

function renderAIResult(content: string): string {
  const esc = content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const html = esc.replace(/^####\s+(.*)$/gm, '<span class="ai-h4">$1</span>').replace(/^###\s+(.*)$/gm, '<span class="ai-h3">$1</span>').replace(/^##\s+(.*)$/gm, '<span class="ai-h2">$1</span>').replace(/\*\*(.+?)\*\*/g, '<span class="ai-em">$1</span>').replace(/^&gt;\s?(.*)$/gm, '<span class="ai-quote">$1</span>').replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\n/g, '<br>');
  return `<section class="panel ai" id="ai-panel"><h2>AI 解卦</h2><div class="ai-content">${html}</div></section>`;
}

function buildPaipanText(state: CoreState, syn: Synthesized, q: string): string {
  const x = state.panels;
  return [`所问之事：${q}`, state.birth ? `生辰：${state.birth.year}-${state.birth.month}-${state.birth.day} ${state.birth.hour}时` : '', state.gender ? `性别：${state.gender}` : '', `起卦方式：${state.method}`, `起卦依据：${BASIS_ZH[state.basis]}`, `本卦：${state.hexagram.fullName}（${state.hexagram.palace}宫）`, `动爻：${state.moving.positions.join('、') || '无'}`, `变卦：${state.moving.bianName}`, `小六壬：${x.xiaoliu.result}`, `综合趋势：${syn.trend}（评分${syn.score}）`, `综合摘要：${syn.summary}`].filter(Boolean).join('\n');
}

async function askAI(state: CoreState, syn: Synthesized, q: string, key: string): Promise<string> {
  const res = await fetch('https://api.deepseek.com/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key }, body: JSON.stringify({ model: 'deepseek-chat', messages: [{ role: 'system', content: '你是一位精通周易、梅花易数、小六壬、六爻、紫微斗数的易学解卦师。请根据排盘数据，用古雅清晰的语言给出解卦分析，包含吉凶总断、事理剖析、趋避建议。可使用标题(####)、加粗(**)和引用(>)标记。' }, { role: 'user', content: buildPaipanText(state, syn, q) }] }) });
  if (!res.ok) throw new Error('AI请求失败：' + res.status);
  const data = await res.json() as { choices?: { message?: { content?: string } }[] };
  return data.choices?.[0]?.message?.content || '（AI未返回内容）';
}

function addSnapshot(input: TimeInput, method: QiGuaMethod, basis: QiGuaBasis, state: CoreState, syn: Synthesized): void {
  history.unshift({ id: ++snapshotId, label: makeLabel(input, method, basis), input, method, basis, state, synthesis: syn });
  if (history.length > 8) history.pop();
}

function renderCompareTabs(): void {
  const el = $('compare-tabs');
  if (!el) return;
  const tabs = [['overview', '总览'], ['bazi', '四柱'], ['hexagram', '卦象'], ['xiaoliu', '小六壬'], ['synthesis', '综合']];
  el.innerHTML = tabs.map(([k, n]) => `<span class="compare-tab ${k === activeTab ? 'active' : ''}" data-tab="${k}">${n}</span>`).join('');
  el.querySelectorAll('.compare-tab').forEach(t => t.addEventListener('click', () => { activeTab = (t as HTMLElement).dataset.tab || 'overview'; renderCompareTabs(); renderCompareTable(); }));
}

function renderCompareTable(): void {
  const el = $('compare-table') as HTMLTableElement | null;
  if (!el) return;
  if (history.length === 0) { el.innerHTML = '<tr><td class="error">暂无记录</td></tr>'; return; }
  const hdr = history.map(h => `<th>${h.label}</th>`).join('');
  let rows: [string, string[]][] = [];
  if (activeTab === 'overview') rows = [['起卦方式', history.map(h => h.method)], ['起卦依据', history.map(h => BASIS_ZH[h.basis])], ['时间', history.map(h => `${h.input.year}-${h.input.month}-${h.input.day} ${h.input.hour}:00`)], ['本卦', history.map(h => h.state.hexagram.fullName)], ['宫位', history.map(h => h.state.hexagram.palace + '宫')], ['动爻', history.map(h => h.state.moving.positions.join('、') || '无')], ['变卦', history.map(h => h.state.moving.bianName)], ['小六壬', history.map(h => h.state.panels.xiaoliu.result)], ['趋势', history.map(h => h.synthesis.trend)], ['评分', history.map(h => String(h.synthesis.score))]];
  else if (activeTab === 'bazi') { const lb = ['年柱', '月柱', '日柱', '时柱']; for (let i = 0; i < 4; i++) rows.push([lb[i], history.map(h => [h.state.bazi.year, h.state.bazi.month, h.state.bazi.day, h.state.bazi.hour][i].ganzhi)]); }
  else if (activeTab === 'hexagram') rows = [['本卦', history.map(h => h.state.hexagram.fullName)], ['宫位', history.map(h => h.state.hexagram.palace + '宫')], ['世爻', history.map(h => h.state.hexagram.shiPosition + '爻')], ['应爻', history.map(h => h.state.hexagram.yingPosition + '爻')], ['动爻', history.map(h => h.state.moving.positions.join('、') || '无')], ['变卦', history.map(h => h.state.moving.bianName)], ['互卦', history.map(h => h.state.moving.huHexagram.name)]];
  else if (activeTab === 'xiaoliu') rows = [['结果', history.map(h => h.state.panels.xiaoliu.result)], ['五行', history.map(h => h.state.panels.xiaoliu.element)], ['路径', history.map(h => h.state.panels.xiaoliu.path.join('->'))]];
  else if (activeTab === 'synthesis') rows = [['趋势', history.map(h => h.synthesis.trend)], ['评分', history.map(h => String(h.synthesis.score))], ['概要', history.map(h => h.synthesis.summary.substring(0, 30) + '...')], ['要点', history.map(h => h.synthesis.keyPoints.join('；').substring(0, 30) + '...')]];
  const body = rows.map(([k, v]) => `<tr><td class="col-key">${k}</td>${v.map(x => `<td>${x}</td>`).join('')}</tr>`).join('');
  el.innerHTML = `<tr><th>项目</th>${hdr}</tr>${body}`;
}

function showCompare(): void { const s = $('compare-section'); if (s) { s.style.display = 'block'; renderCompareTabs(); renderCompareTable(); } }

function bindEvents(): void {
  $('method')?.addEventListener('change', updateMethodHint);
  $('basis')?.addEventListener('change', updateBasisVisibility);
  $('run-btn')?.addEventListener('click', () => {
    const out = $('output');
    if (out) out.innerHTML = '<div class="loading">推演中</div>';
    setTimeout(() => {
      try {
        const { input, method, nums, basis, birth, gender } = readForm();
        if (method === 'cuanke' && nums.length !== 6) throw new Error('铜钱摇卦需输入6次结果(0-3)');
        const { state, synthesis } = fullPaipan(input, method, nums, 0, birth, basis, gender);
        addSnapshot(input, method, basis, state, synthesis);
        if (out) out.innerHTML = renderPanels(state, synthesis);
        showCompare();
        out?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        const key = ($('apikey') as HTMLInputElement)?.value || '';
        const q = ($('question') as HTMLTextAreaElement)?.value || '';
        if (key && q) { askAI(state, synthesis, q, key).then(c => { if (out) out.innerHTML += renderAIResult(c); }).catch(e => { if (out) out.innerHTML += `<section class="panel ai"><h2>AI 解卦</h2><p>失败：${(e as Error).message}</p></section>`; }); }
      } catch (e) { if (out) out.innerHTML = `<div class="error">${(e as Error).message}</div>`; }
    }, 100);
  });
}

function init(): void { setDefaultTime(); updateBasisVisibility(); updateMethodHint(); bindEvents(); }
if (document.readyState === 'loading') window.addEventListener('DOMContentLoaded', init);
else init();
