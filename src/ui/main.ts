/**
 * UI 主程序
 * ------------------------------------------------------------------
 * 负责：
 *   1. Hash 路由（#/ / #/chinese / #/western）
 *   2. 中式命理（原有逻辑，保持不变）
 *   3. 西式星语（星盘 / 星座 / 合盘 / 塔罗 / AI 解语）
 * 依赖浏览器 DOM 环境，通过 ES Module 直接在浏览器中加载。
 */
import { fullPaipan } from '../engine';
import type { TimeInput, QiGuaMethod, QiGuaBasis, CoreState, Synthesized, Hexagram, Line } from '../types';
import type { Spread } from '../data/western';
import { buildBaziPanel } from '../panels/bazi';
import { natalChart, synastry, createTarotDeck, buildTarotSpread, spreadById, type BirthInfo, type NatalChart, type TarotSpread, type TarotCard, type TarotDeckCard, type TarotDeckMode } from '../western';
import {
  renderChartSVG, renderChartHeader, renderPlanetList, renderAspectList, renderHouseList,
  renderSunsignPanel, renderSignDetailModal, renderTarotFan, renderTarotCardFace, renderTarotBack, renderSynastrySVG, buildWesternAIPrompt, buildTarotAIPrompt,
} from './western';
import { GEO } from './cities';

/** 按元素 ID 获取 DOM 元素 */
const $ = (id: string) => document.getElementById(id);

// ============================================================
// Hash 路由
// ============================================================

/** 隐藏所有根容器，只显示指定 id */
function showRoot(id: 'portal' | 'chinese-root' | 'western-root'): void {
  for (const rid of ['portal', 'chinese-root', 'western-root'] as const) {
    const el = $(rid);
    if (el) el.style.display = rid === id ? (rid === 'portal' ? 'flex' : 'block') : 'none';
  }
  // 切到非主入口时滚动到顶部
  if (id !== 'portal') window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
}

/** 解析 hash 并显示对应页面 */
function applyRoute(): void {
  const hash = (location.hash || '#/').replace(/^#/, '');
  if (hash === '/chinese' || hash.startsWith('/chinese')) {
    showRoot('chinese-root');
  } else if (hash === '/western' || hash.startsWith('/western')) {
    showRoot('western-root');
    initWestern();
    // 退出星域重进才触发重洗：回到初始工作流（仅切 tab 不触发，由 switchWesternTab 处理）
    const q = $('w-tarot-q') as HTMLTextAreaElement | null;
    if (q) q.value = '';
    resetTarot();
  } else {
    showRoot('portal');
  }
}

window.addEventListener('hashchange', applyRoute);

// ============================================================
// 中式命理（保留原逻辑）
// ============================================================

/** 历史快照记录 */
interface Snap {
  id: number;
  label: string;
  input: TimeInput;
  method: QiGuaMethod;
  basis: QiGuaBasis;
  state: CoreState;
  synthesis: Synthesized;
}

const history: Snap[] = [];
let snapshotId = 0;
let activeTab = 'overview';

/** 起卦依据中文标签 */
const BASIS_ZH: Record<QiGuaBasis, string> = { time: '仅时间', time_bazi: '时间+八字', bazi: '仅八字' };
/** 起卦依据后缀（用于快照标签） */
const BASIS_SUFFIX: Record<QiGuaBasis, string> = { time: '', time_bazi: '+八', bazi: '八' };

/** 各起卦方法的输入提示与标签 */
const METHOD_HINTS: Record<QiGuaMethod, { ph: string; lb: string }> = {
  time: { ph: '时间起卦无需输入', lb: '数字/铜钱' },
  number: { ph: '如 5,10 或 3,8,14', lb: '数字(2-3个)' },
  meihua: { ph: '如 1,5 (上卦数,下卦数)', lb: '上下卦数' },
  zaobi: { ph: '随机种子(可选)', lb: '种子数' },
  cuanke: { ph: '如 2,1,3,0,2,1', lb: '6次背面数(0-3)' },
};

/**
 * 通过世界时间 API 获取浏览器所在时区的准确时间。
 * 静态部署时系统时钟可能不准，以此获取权威时间。
 * @returns 时间组件，失败返回 null
 */
async function fetchWorldTime(): Promise<{ year: number; month: number; day: number; hour: number; second: number } | null> {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Shanghai';
    const res = await fetch(`https://uapis.cn/api/v1/misc/worldtime?city=${encodeURIComponent(timezone)}`);
    if (!res.ok) return null;
    const data = await res.json() as { datetime?: string };
    if (!data.datetime) return null;
    const dt = new Date(data.datetime);
    if (isNaN(dt.getTime())) return null;
    return {
      year: dt.getFullYear(),
      month: dt.getMonth() + 1,
      day: dt.getDate(),
      hour: dt.getHours(),
      second: dt.getSeconds(),
    };
  } catch {
    return null;
  }
}

/** 将表单时间默认设为当前时间（先本地时间即时填充，再异步校正为世界时间 API 的准确时间） */
function setDefaultTime(): void {
  const now = new Date();
  const ids = ['year', 'month', 'day', 'hour', 'second'] as const;
  const defaults = [now.getFullYear(), now.getMonth() + 1, now.getDate(), now.getHours(), now.getSeconds()];
  // 先用本地时间快速填充，保证 UI 立即可用
  ids.forEach((id, i) => {
    const el = $(id) as HTMLInputElement | null;
    if (el) el.value = String(defaults[i]);
  });
  // 异步获取世界时间 API 的准确时间并覆盖
  fetchWorldTime().then(worldTime => {
    if (!worldTime) return;
    const values = [worldTime.year, worldTime.month, worldTime.day, worldTime.hour, worldTime.second];
    ids.forEach((id, i) => {
      const el = $(id) as HTMLInputElement | null;
      if (el) el.value = String(values[i]);
    });
  });
}

/** 读取表单输入，组装起卦参数 */
function readForm() {
  const num = (id: string) => parseInt(($(id) as HTMLInputElement)?.value || '0', 10);
  const y = num('year'), m = num('month'), d = num('day'), h = num('hour'), s = num('second');
  const method = (($('method') as HTMLSelectElement)?.value || 'time') as QiGuaMethod;
  const nums = (($('nums') as HTMLInputElement)?.value || '').split(/[,\s]+/).map(Number).filter(n => !isNaN(n));
  const basis = (($('basis') as HTMLSelectElement)?.value || 'time') as QiGuaBasis;
  const birth: TimeInput | undefined = basis === 'time' ? undefined : { year: num('byear'), month: num('bmonth'), day: num('bday'), hour: num('bhour'), minute: 0, second: num('bsecond') };
  const gender = ($('gender') as HTMLSelectElement)?.value as '男' | '女' | undefined;
  let input: TimeInput = { year: y, month: m, day: d, hour: h, minute: 0, second: s };
  // 仅八字模式时，以生辰替代起卦时间
  if (basis === 'bazi' && birth) input = { ...birth };
  return { input, method, nums, basis, birth, gender };
}

/** 根据起卦依据切换生辰输入区可见性 */
function updateBasisVisibility(): void {
  const basis = (($('basis') as HTMLSelectElement)?.value || 'time') as QiGuaBasis;
  const block = $('birth-block');
  if (block) block.style.display = basis === 'time' ? 'none' : 'grid';
  for (const id of ['year', 'month', 'day', 'hour', 'second']) {
    const el = $(id) as HTMLInputElement | null;
    if (el) el.disabled = basis === 'bazi';
  }
}

/** 根据起卦方法更新输入框提示与标签 */
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

/** 渲染单爻为 HTML */
function renderLine(line: Line): string {
  const isYang = line.yinYang === 'yang';
  const mark = line.changed
    ? (isYang ? '━━━━━ ○' : '━ ━ ━ ×')
    : (isYang ? '━━━━━' : '━ ━ ━');
  const tags = (line.shi ? '<span class="tag-shi">世</span>' : '') + (line.ying ? '<span class="tag-ying">应</span>' : '');
  return `<div class="line ${isYang ? 'yang' : 'yin'} ${line.changed ? 'changed' : ''}"><span class="line-mark">${mark}</span><span class="line-pos">${line.position}爻</span><span class="line-gz">${line.tiangan}${line.dizhi}</span><span class="line-lq">${line.liuQin}</span>${tags}</div>`;
}

/** 渲染完整卦象（含六爻，自上而下显示） */
function renderHex(hex: Hexagram): string {
  return `<div class="hex"><h3>${hex.fullName}（${hex.palace}宫）</h3><div>${hex.lines.slice().reverse().map(renderLine).join('')}</div></div>`;
}

/** 生成快照标签 */
function makeLabel(input: TimeInput, method: QiGuaMethod, basis: QiGuaBasis): string {
  return `${input.year}/${input.month}/${input.day} ${input.hour}时${input.second}秒[${method}${BASIS_SUFFIX[basis]}]`;
}

/** 渲染所有面板为 HTML */
function renderPanels(state: CoreState, syn: Synthesized): string {
  const x = state.panels;
  const bd = buildBaziPanel(state.bazi);
  const pillars = bd.pillars.map((p, i) =>
    `<div class="pillar"><div class="p-name">${['年柱', '月柱', '日柱', '时柱'][i]}</div><div class="p-gz">${p.gz.ganzhi}</div><div class="p-cg">${p.canggan.map(c => `${c.gan}<sub>${c.shiShen}</sub>`).join(' ')}</div><div class="p-ny">${p.nayin}</div></div>`
  ).join('');
  return [
    `<section class="panel xiaoliu"><h2>小六壬</h2><div class="path">${x.xiaoliu.path.join(' -> ')}</div><div class="result ${x.xiaoliu.result}">${x.xiaoliu.result}</div><div class="element">五行：${x.xiaoliu.element}</div><p>${x.xiaoliu.meaning}</p></section>`,
    `<section class="panel bazi"><h2>四柱</h2><div class="pillars">${pillars}</div><p>${bd.summary}</p></section>`,
    `<section class="panel meihua"><h2>梅花易数</h2><div class="triple">${renderHex(x.meihua.ben)}${renderHex(x.meihua.hu)}${renderHex(x.meihua.bian)}</div><p>动爻：${x.meihua.dong.join('、')}</p><p>体：${x.meihua.tiElement} 用：${x.meihua.yongElement}</p><p>${x.meihua.interpretation}</p></section>`,
    `<section class="panel zhouyi"><h2>周易</h2><div class="ci"><div><strong>本卦辞：</strong>${x.zhouyi.guaCi.ben}</div><div><strong>变卦辞：</strong>${x.zhouyi.guaCi.bian}</div></div><div class="tz"><strong>彖传：</strong>${x.zhouyi.tuanZhuan}</div><div class="xz"><strong>象传：</strong>${x.zhouyi.xiangZhuan}</div><div class="yao">${x.zhouyi.yaoCi.map(y => `<div>${y}</div>`).join('')}</div><p>判断：${x.zhouyi.judgment}</p></section>`,
    `<section class="panel ziwei"><h2>紫微斗数</h2><div>命宫：${x.ziwei.mingGong} 身宫：${x.ziwei.shenGong}</div><div>五行局：${x.ziwei.wuXingJu} 大限：${x.ziwei.daXianDirection}</div><table><tr><th>主星</th><th>宫位</th><th>亮度</th></tr>${x.ziwei.mainStars.map(s => `<tr><td>${s.star}</td><td>${s.gong}</td><td>${s.brightness}</td></tr>`).join('')}</table><div>四化：${x.ziwei.siHua.map(s => `${s.star}${s.hua}`).join(' ')}</div><p>${x.ziwei.summary}</p></section>`,
    `<section class="panel liuyao"><h2>六爻基础</h2><div>${x.liuyao.summary}</div><table><tr><th>爻位</th><th>六亲</th><th>干支</th><th>六神</th></tr>${x.liuyao.liuQinMap.map((q, i) => `<tr><td>${q.position}爻</td><td>${q.liuQin}</td><td>${q.ganZhi}</td><td>${x.liuyao.liuShen[i] || ''}</td></tr>`).join('')}</table></section>`,
    `<section class="panel synthesis"><h2>综合分析</h2><div class="trend ${syn.trend}">${syn.trend} 评分 ${syn.score}</div><p class="summary">${syn.summary}</p><div class="kp"><strong>要点：</strong>${syn.keyPoints.join('；') || '-'}</div><div class="warn"><strong>提醒：</strong>${syn.warnings.join('；') || '-'}</div><div class="rec"><strong>建议：</strong>${syn.recommendations.join('；')}</div></section>`,
  ].join('');
}

/** 将 Markdown 风格文本渲染为 HTML（中式） */
function renderAIResult(content: string): string {
  const esc = content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const html = esc
    .replace(/^####\s+(.*)$/gm, '<span class="ai-h4">$1</span>')
    .replace(/^###\s+(.*)$/gm, '<span class="ai-h3">$1</span>')
    .replace(/^##\s+(.*)$/gm, '<span class="ai-h2">$1</span>')
    .replace(/\*\*(.+?)\*\*/g, '<span class="ai-em">$1</span>')
    .replace(/^&gt;\s?(.*)$/gm, '<span class="ai-quote">$1</span>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>');
  return `<section class="panel ai" id="ai-panel"><h2>AI 解卦</h2><div class="ai-content">${html}</div></section>`;
}

/** 构建发送给 AI 的排盘文本摘要（中式） */
function buildPaipanText(state: CoreState, syn: Synthesized, q: string): string {
  const x = state.panels;
  return [
    `所问之事：${q}`,
    state.birth ? `生辰：${state.birth.year}-${state.birth.month}-${state.birth.day} ${state.birth.hour}时${state.birth.second}秒` : '',
    state.gender ? `性别：${state.gender}` : '',
    `起卦方式：${state.method}`,
    `起卦依据：${BASIS_ZH[state.basis]}`,
    `本卦：${state.hexagram.fullName}（${state.hexagram.palace}宫）`,
    `动爻：${state.moving.positions.join('、') || '无'}`,
    `变卦：${state.moving.bianName}`,
    `小六壬：${x.xiaoliu.result}`,
    `综合趋势：${syn.trend}（评分${syn.score}）`,
    `综合摘要：${syn.summary}`,
  ].filter(Boolean).join('\n');
}

/**
 * 调用 DeepSeek AI 进行解卦。
 */
async function askAI(state: CoreState, syn: Synthesized, q: string, key: string): Promise<string> {
  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: '你是一位精通周易、梅花易数、小六壬、六爻、紫微斗数的易学解卦师。请根据排盘数据，用古雅清晰的语言给出解卦分析，包含吉凶总断、事理剖析、趋避建议。可使用标题(####)、加粗(**)和引用(>)标记。' },
        { role: 'user', content: buildPaipanText(state, syn, q) },
      ],
    }),
  });
  if (!res.ok) throw new Error('AI请求失败：' + res.status);
  const data = await res.json() as { choices?: { message?: { content?: string } }[] };
  return data.choices?.[0]?.message?.content || '（AI未返回内容）';
}

/** 添加一条排盘快照至历史（最多保留 8 条） */
function addSnapshot(input: TimeInput, method: QiGuaMethod, basis: QiGuaBasis, state: CoreState, syn: Synthesized): void {
  history.unshift({ id: ++snapshotId, label: makeLabel(input, method, basis), input, method, basis, state, synthesis: syn });
  if (history.length > 8) history.pop();
}

/** 渲染比对标签页 */
function renderCompareTabs(): void {
  const el = $('compare-tabs');
  if (!el) return;
  const tabs = [['overview', '总览'], ['bazi', '四柱'], ['hexagram', '卦象'], ['xiaoliu', '小六壬'], ['synthesis', '综合']];
  el.innerHTML = tabs.map(([k, n]) => `<span class="compare-tab ${k === activeTab ? 'active' : ''}" data-tab="${k}">${n}</span>`).join('');
  el.querySelectorAll('.compare-tab').forEach(t => t.addEventListener('click', () => {
    activeTab = (t as HTMLElement).dataset.tab || 'overview';
    renderCompareTabs();
    renderCompareTable();
  }));
}

/** 渲染比对表格（按当前标签页展示不同维度） */
function renderCompareTable(): void {
  const el = $('compare-table') as HTMLTableElement | null;
  if (!el) return;
  if (history.length === 0) { el.innerHTML = '<tr><td class="error">暂无记录</td></tr>'; return; }

  const hdr = history.map(h => `<th>${h.label}</th>`).join('');
  let rows: [string, string[]][] = [];

  if (activeTab === 'overview') {
    rows = [
      ['起卦方式', history.map(h => h.method)],
      ['起卦依据', history.map(h => BASIS_ZH[h.basis])],
      ['时间', history.map(h => `${h.input.year}-${h.input.month}-${h.input.day} ${h.input.hour}时${h.input.second}秒`)],
      ['本卦', history.map(h => h.state.hexagram.fullName)],
      ['宫位', history.map(h => h.state.hexagram.palace + '宫')],
      ['动爻', history.map(h => h.state.moving.positions.join('、') || '无')],
      ['变卦', history.map(h => h.state.moving.bianName)],
      ['小六壬', history.map(h => h.state.panels.xiaoliu.result)],
      ['趋势', history.map(h => h.synthesis.trend)],
      ['评分', history.map(h => String(h.synthesis.score))],
    ];
  } else if (activeTab === 'bazi') {
    const lb = ['年柱', '月柱', '日柱', '时柱'];
    for (let i = 0; i < 4; i++) {
      rows.push([lb[i], history.map(h => [h.state.bazi.year, h.state.bazi.month, h.state.bazi.day, h.state.bazi.hour][i].ganzhi)]);
    }
  } else if (activeTab === 'hexagram') {
    rows = [
      ['本卦', history.map(h => h.state.hexagram.fullName)],
      ['宫位', history.map(h => h.state.hexagram.palace + '宫')],
      ['世爻', history.map(h => h.state.hexagram.shiPosition + '爻')],
      ['应爻', history.map(h => h.state.hexagram.yingPosition + '爻')],
      ['动爻', history.map(h => h.state.moving.positions.join('、') || '无')],
      ['变卦', history.map(h => h.state.moving.bianName)],
      ['互卦', history.map(h => h.state.moving.huHexagram.name)],
    ];
  } else if (activeTab === 'xiaoliu') {
    rows = [
      ['结果', history.map(h => h.state.panels.xiaoliu.result)],
      ['五行', history.map(h => h.state.panels.xiaoliu.element)],
      ['路径', history.map(h => h.state.panels.xiaoliu.path.join('->'))],
    ];
  } else if (activeTab === 'synthesis') {
    rows = [
      ['趋势', history.map(h => h.synthesis.trend)],
      ['评分', history.map(h => String(h.synthesis.score))],
      ['概要', history.map(h => h.synthesis.summary.substring(0, 30) + '...')],
      ['要点', history.map(h => h.synthesis.keyPoints.join('；').substring(0, 30) + '...')],
    ];
  }

  const body = rows.map(([k, v]) => `<tr><td class="col-key">${k}</td>${v.map(x => `<td>${x}</td>`).join('')}</tr>`).join('');
  el.innerHTML = `<tr><th>项目</th>${hdr}</tr>${body}`;
}

/** 显示比对区域 */
function showCompare(): void {
  const s = $('compare-section');
  if (s) {
    s.style.display = 'block';
    renderCompareTabs();
    renderCompareTable();
  }
}

/** 绑定所有交互事件（中式） */
function bindChineseEvents(): void {
  $('method')?.addEventListener('change', updateMethodHint);
  $('basis')?.addEventListener('change', updateBasisVisibility);
  $('run-btn')?.addEventListener('click', () => {
    const out = $('output');
    if (out) out.innerHTML = '<div class="loading">推演中</div>';
    // 延迟执行以显示加载动画
    setTimeout(() => {
      try {
        const { input, method, nums, basis, birth, gender } = readForm();
        if (method === 'cuanke' && nums.length !== 6) throw new Error('铜钱摇卦需输入6次结果(0-3)');
        const { state, synthesis } = fullPaipan(input, method, nums, 0, birth, basis, gender);
        addSnapshot(input, method, basis, state, synthesis);
        if (out) out.innerHTML = renderPanels(state, synthesis);
        showCompare();
        out?.scrollIntoView({ behavior: 'smooth', block: 'start' });

        // 若填写了 API Key 和问题，异步请求 AI 解卦
        const key = ($('apikey') as HTMLInputElement)?.value || '';
        const q = ($('question') as HTMLTextAreaElement)?.value || '';
        if (key && q) {
          askAI(state, synthesis, q, key)
            .then(c => { if (out) out.innerHTML += renderAIResult(c); })
            .catch(e => { if (out) out.innerHTML += `<section class="panel ai"><h2>AI 解卦</h2><p>失败：${(e as Error).message}</p></section>`; });
        }
      } catch (e) {
        if (out) out.innerHTML = `<div class="error">${(e as Error).message}</div>`;
      }
    }, 100);
  });
}

/** 初始化中式命理（仅在首次进入时执行） */
function initChinese(): void {
  setDefaultTime();
  updateBasisVisibility();
  updateMethodHint();
  bindChineseEvents();
}

// ============================================================
// 西式星语
// ============================================================

/** 当前星盘缓存（供 AI 解语使用） */
let currentChart: NatalChart | null = null;
let westernInited = false;

/** 塔罗会话状态：覆面牌堆 / 已抽出的牌 / 当前牌阵 / 阶段 */
let tarotDeck: TarotDeckCard[] = [];
let tarotPicks: { card: TarotCard; reversed: boolean }[] = [];
let tarotSpread: TarotSpread | null = null;
let tarotPhase: 'idle' | 'drawing' | 'collecting' | 'revealing' | 'done' = 'idle';
let tarotRevealTimer: number | null = null;
let tarotCollectTimer: number | null = null;
/** 待确认抽取的扇形牌：两段式确认（避免误选），确认后才真正抽出 */
let tarotPendingBtn: HTMLElement | null = null;
let tarotPendingIndex = -1;

/** 当前牌阵应抽张数：可变张数牌阵（如是非牌阵 1~3）取用户选择，否则取牌阵固定张数 */
function currentSpreadCount(spread: Spread): number {
  if (spread.counts && spread.counts.length > 1) {
    const v = parseInt((($('w-tarot-count') as HTMLSelectElement)?.value) || '', 10);
    if (spread.counts.includes(v)) return v;
  }
  return spread.count;
}

/** 同步可变张数选择器的显隐：仅支持多档张数的牌阵（如是非牌阵）显示 */
function syncTarotCountWrap(): void {
  const spread = spreadById(($('w-spread') as HTMLSelectElement)?.value || 'three');
  const wrap = $('w-tarot-count-wrap');
  if (wrap) wrap.style.display = spread.counts && spread.counts.length > 1 ? '' : 'none';
}

function num(id: string): number { return parseInt(($(id) as HTMLInputElement)?.value || '0', 10); }

/** 切换西式星语标签页 */
function switchWesternTab(tab: string): void {
  document.querySelectorAll<HTMLElement>('.w-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === tab);
  });
  document.querySelectorAll<HTMLElement>('.w-pane').forEach(p => {
    p.style.display = p.id === `w-pane-${tab}` ? 'block' : 'none';
  });
}

/** 读取本命盘表单（时区/经度/纬度直接读取输入框，由城市级联自动填充或手动修改） */
function readChartForm(): BirthInfo {
  return {
    year: num('w-year'),
    month: num('w-month'),
    day: num('w-day'),
    hour: num('w-hour'),
    minute: num('w-minute'),
    second: 0,
    longitude: parseFloat((($('w-lon') as HTMLInputElement)?.value || '121.47')),
    latitude: parseFloat((($('w-lat') as HTMLInputElement)?.value || '31.23')),
    timezone: parseFloat((($('w-tz') as HTMLInputElement)?.value || '8')),
  };
}

function readSynForm(prefix: 'wa' | 'wb'): BirthInfo {
  return {
    year: num(`${prefix}-year`),
    month: num(`${prefix}-month`),
    day: num(`${prefix}-day`),
    hour: num(`${prefix}-hour`),
    minute: num(`${prefix}-minute`),
    second: 0,
    longitude: parseFloat((($(`${prefix}-lon`) as HTMLInputElement)?.value || '121.47')),
    latitude: parseFloat((($(`${prefix}-lat`) as HTMLInputElement)?.value || '31.23')),
    timezone: parseFloat((($(`${prefix}-tz`) as HTMLInputElement)?.value || '8')),
  };
}

/** 渲染本命星盘 */
function runWesternChart(): void {
  const out = $('w-chart-out');
  if (!out) return;
  out.innerHTML = '<div class="w-loading">排盘中</div>';
  setTimeout(() => {
    try {
      const birth = readChartForm();
      const chart = natalChart(birth);
      currentChart = chart;
      out.innerHTML = `
        ${renderChartHeader(chart)}
        <div class="w-chart-wrap">${renderChartSVG(chart)}</div>
        <h2 class="w-section-title">行星分布</h2>
        ${renderPlanetList(chart)}
        <h2 class="w-section-title">十二宫位</h2>
        ${renderHouseList(chart)}
        <h2 class="w-section-title">主要相位</h2>
        ${renderAspectList(chart.aspects.slice(0, 12))}
      `;
      out.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (e) {
      out.innerHTML = `<div class="w-error">${(e as Error).message}</div>`;
    }
  }, 80);
}

/** 将 AI 返回的 Markdown 片段渲染为安全 HTML */
function renderAIHtml(content: string): string {
  const esc = content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return esc
    .replace(/^####\s+(.*)$/gm, '<span class="ai-h4">$1</span>')
    .replace(/^###\s+(.*)$/gm, '<span class="ai-h3">$1</span>')
    .replace(/^##\s+(.*)$/gm, '<span class="ai-h2">$1</span>')
    .replace(/\*\*(.+?)\*\*/g, '<span class="ai-em">$1</span>')
    .replace(/^&gt;\s?(.*)$/gm, '<span class="ai-quote">$1</span>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>');
}

/** 调用 DeepSeek 对话接口 */
async function askDeepSeek(key: string, system: string, prompt: string): Promise<string> {
  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt },
      ],
    }),
  });
  if (!res.ok) throw new Error('AI请求失败：' + res.status);
  const data = await res.json() as { choices?: { message?: { content?: string } }[] };
  return data.choices?.[0]?.message?.content || '（AI未返回内容）';
}

/** 获取 AI 面板（不存在则创建），返回面板元素并置为加载态 */
function ensureAIPanel(container: Element, id: string): HTMLElement {
  let panel = document.getElementById(id);
  if (!panel) {
    const div = document.createElement('section');
    div.className = 'w-ai-panel';
    div.id = id;
    div.innerHTML = '<h2>AI 解 语</h2><div class="w-ai-content w-loading">正在解读</div>';
    container.appendChild(div);
    panel = div;
  } else {
    panel.querySelector('.w-ai-content')!.innerHTML = '<div class="w-loading">正在解读</div>';
  }
  return panel;
}

/** 渲染 AI 解语结果：移除加载动画类后再写入，避免末尾残留 "..." 让人误以为未输出完毕 */
function renderAIPanel(panel: HTMLElement, content: string): void {
  const el = panel.querySelector('.w-ai-content') as HTMLElement | null;
  if (!el) return;
  el.classList.remove('w-loading');
  el.innerHTML = content;
}

/** AI 解语（西式） */
async function runWesternAI(): Promise<void> {
  if (!currentChart) { runWesternChart(); }
  // 等待渲染完成
  await new Promise(r => setTimeout(r, 120));
  if (!currentChart) return;
  const key = ($('w-apikey') as HTMLInputElement)?.value || '';
  const q = ($('w-question') as HTMLTextAreaElement)?.value || '';
  if (!key) { alert('请填写 DeepSeek Key'); return; }
  const out = $('w-chart-out');
  if (!out) return;
  const panel = ensureAIPanel(out, 'w-ai-panel');
  const prompt = buildWesternAIPrompt(currentChart, undefined, q || undefined);
  try {
    const content = await askDeepSeek(key, '你是一位严谨的西方占星师，擅长星盘解读与生涯咨询。基于用户提供的星盘数据，给出结构清晰、贴合西方占星理论的解读。', prompt);
    renderAIPanel(panel, renderAIHtml(content));
  } catch (e) {
    renderAIPanel(panel, `<span style="color:var(--cos-pink)">失败：${(e as Error).message}</span>`);
  }
}

/** 合盘 */
function runWesternSynastry(): void {
  const out = $('w-synastry-out');
  if (!out) return;
  out.innerHTML = '<div class="w-loading">合盘对照中</div>';
  setTimeout(() => {
    try {
      const a = natalChart(readSynForm('wa'));
      const b = natalChart(readSynForm('wb'));
      const aspects = synastry(a, b);
      currentChart = a;
      out.innerHTML = `
        ${renderSynastrySVG(a, b)}
        <h2 class="w-section-title">合盘相位（A ↔ B，前 20）</h2>
        ${renderAspectList(aspects.slice(0, 20), 'A', 'B')}
        <h2 class="w-section-title">A 盘要点</h2>
        ${renderChartHeader(a)}
        <div class="w-chart-wrap">${renderChartSVG(a, 360)}</div>
        <h2 class="w-section-title">B 盘要点</h2>
        ${renderChartHeader(b)}
        <div class="w-chart-wrap">${renderChartSVG(b, 360)}</div>
      `;
      out.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (e) {
      out.innerHTML = `<div class="w-error">${(e as Error).message}</div>`;
    }
  }, 80);
}

/** 合盘 AI 解语 */
async function runSynastryAI(): Promise<void> {
  const out = $('w-synastry-out');
  if (!out) return;
  const key = (($('w-syn-ai-key') as HTMLInputElement)?.value || '').trim();
  if (!key) { alert('请填写 DeepSeek Key'); return; }
  let a: NatalChart;
  let b: NatalChart;
  let aspects: ReturnType<typeof synastry>;
  try {
    a = natalChart(readSynForm('wa'));
    b = natalChart(readSynForm('wb'));
    aspects = synastry(a, b);
  } catch (e) {
    alert('排盘失败：' + (e as Error).message);
    return;
  }
  const panel = ensureAIPanel(out, 'w-syn-ai-panel');
  const prompt = buildWesternAIPrompt(a, { b, aspects }, undefined);
  try {
    const content = await askDeepSeek(key, '你是一位严谨的西方占星师，擅长合盘（Synastry）解读与关系咨询。基于双方星盘与合盘相位，给出结构清晰、贴合西方占星理论的解读。', prompt);
    renderAIPanel(panel, renderAIHtml(content));
  } catch (e) {
    renderAIPanel(panel, `<span style="color:var(--cos-pink)">失败：${(e as Error).message}</span>`);
  }
}

/** 开始占卜：校验问题后洗牌并展开全部 78 张扇形（未输入问题前不展示牌） */
function startTarot(): void {
  const q = (($('w-tarot-q') as HTMLTextAreaElement)?.value || '').trim();
  if (!q) {
    alert('请先输入所问之事，再开始占卜。');
    ($('w-tarot-q') as HTMLTextAreaElement)?.focus();
    return;
  }
  resetTarot(true);
}

/** 重置塔罗：按所选牌组重新洗牌并预置正/逆位。已有问题时直接展开对应张数扇形（再次占卜 / 切换牌阵 / 切换牌组 / 首次初始化时调用） */
function resetTarot(forceShow = false): void {
  if (tarotRevealTimer !== null) {
    window.clearTimeout(tarotRevealTimer);
    tarotRevealTimer = null;
  }
  if (tarotCollectTimer !== null) {
    window.clearTimeout(tarotCollectTimer);
    tarotCollectTimer = null;
  }
  const spread = spreadById(($('w-spread') as HTMLSelectElement)?.value || 'three');
  const deckMode: TarotDeckMode = (($('w-tarot-deck') as HTMLSelectElement)?.value as TarotDeckMode) || 'full';
  tarotDeck = createTarotDeck(deckMode);
  tarotPicks = [];
  tarotSpread = null;

  // 清理两段式确认与已抽区
  clearTarotPending();
  const drawnWrap = $('w-tarot-drawn');
  if (drawnWrap) {
    drawnWrap.style.display = '';
    const dc = drawnWrap.querySelector('.w-tarot-drawn-cards');
    const dn = drawnWrap.querySelector('.w-tarot-drawn-count');
    if (dc) dc.innerHTML = '';
    if (dn) dn.textContent = '已抽 0 张';
  }

  const out = $('w-tarot-out');
  if (!out) return;
  const fan = $('w-tarot-fan');
  const slot = $('w-tarot-slot');
  out.querySelector('.w-ai-panel')?.remove();

  const q = (($('w-tarot-q') as HTMLTextAreaElement)?.value || '').trim();
  const hint = $('w-tarot-hint');
  const resetBtn = $('w-tarot-reset');
  const aiBtn = $('w-tarot-ai-btn');
  if (resetBtn) resetBtn.style.display = 'none';
  if (aiBtn) aiBtn.style.display = 'none';

  if (forceShow || q) {
    tarotPhase = 'drawing';
    if (fan) fan.innerHTML = renderTarotFan(tarotDeck);
    if (slot) slot.innerHTML = '';
    if (hint) hint.textContent = `已展开整副 ${tarotDeck.length} 张塔罗牌：请在扇形中依次点选 ${currentSpreadCount(spread)} 张，抽取顺序即摆牌顺序。`;
    fan?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } else {
    tarotPhase = 'idle';
    if (fan) fan.innerHTML = '';
    if (slot) slot.innerHTML = '';
    if (hint) hint.textContent = `请选择牌阵与牌组并输入所问之事，再点击「开始占卜」展开 ${tarotDeck.length} 张塔罗牌。`;
  }
}

/** 点击扇形覆面牌：进入待确认状态（两段式，避免误选），确认后才真正抽出 */
function onTarotFanClick(ev: Event): void {
  if (tarotPhase !== 'drawing') return;
  const btn = (ev.target as HTMLElement).closest('.w-fan-card') as HTMLElement | null;
  if (!btn) return;
  const idx = parseInt(btn.dataset.fanIndex || '-1', 10);
  if (idx < 0 || idx >= tarotDeck.length) return;

  const spread = spreadById(($('w-spread') as HTMLSelectElement)?.value || 'three');

  // 已有待确认牌：点同一张视为取消，点另一张则切换
  if (tarotPendingBtn) {
    if (tarotPendingBtn === btn) {
      cancelTarotPick();
      return;
    }
    clearTarotPending();
  }

  tarotPendingBtn = btn;
  tarotPendingIndex = idx;
  btn.classList.add('is-pending');
  $('w-tarot-confirm')?.classList.add('show');
  const hint = $('w-tarot-hint');
  if (hint) hint.textContent = `已选中扇形第 ${idx + 1} 张，确认后才会正式抽取（已抽 ${tarotPicks.length} / ${currentSpreadCount(spread)} 张）。`;
}

/** 清除待确认状态：移除高亮与确认条，不影响已抽牌 */
function clearTarotPending(): void {
  if (tarotPendingBtn) {
    tarotPendingBtn.classList.remove('is-pending');
    tarotPendingBtn = null;
  }
  tarotPendingIndex = -1;
  $('w-tarot-confirm')?.classList.remove('show');
}

/** 取消抽取：恢复抽取引导提示 */
function cancelTarotPick(): void {
  clearTarotPending();
  const spread = spreadById(($('w-spread') as HTMLSelectElement)?.value || 'three');
  const left = currentSpreadCount(spread) - tarotPicks.length;
  const hint = $('w-tarot-hint');
  if (hint) {
    hint.textContent = left > 0
      ? `已抽 ${tarotPicks.length} / ${currentSpreadCount(spread)} 张，还需抽 ${left} 张：请在扇形中依次点选。`
      : '已抽满，正在归阵……';
  }
}

/** 确认抽取：真正抽出待确认的牌（不放回），并放入已抽区展示 */
function confirmTarotPick(): void {
  if (!tarotPendingBtn || tarotPendingIndex < 0) return;
  const btn = tarotPendingBtn;
  const idx = tarotPendingIndex;

  const deckCard = tarotDeck[idx];
  tarotDeck.splice(idx, 1);
  tarotPicks.push({ card: deckCard.card, reversed: deckCard.reversed });

  clearTarotPending();
  btn.remove();

  // 已抽区：追加一张小牌背 + 更新计数
  const drawnCards = $('w-tarot-drawn')?.querySelector('.w-tarot-drawn-cards');
  const drawnCount = $('w-tarot-drawn')?.querySelector('.w-tarot-drawn-count');
  if (drawnCards) {
    const cardEl = document.createElement('div');
    cardEl.className = 'w-tarot-drawn-card';
    cardEl.innerHTML = renderTarotBack();
    drawnCards.appendChild(cardEl);
  }
  if (drawnCount) drawnCount.textContent = `已抽 ${tarotPicks.length} 张`;

  const spread = spreadById(($('w-spread') as HTMLSelectElement)?.value || 'three');
  const left = currentSpreadCount(spread) - tarotPicks.length;
  const hint = $('w-tarot-hint');
  if (hint) {
    hint.textContent = left > 0
      ? `已抽 ${tarotPicks.length} / ${currentSpreadCount(spread)} 张，还需抽 ${left} 张……`
      : '已抽满，正在归阵……';
  }
  if (left <= 0) {
    tarotPhase = 'collecting';
    collectAndReveal();
  }
}

/** 抽取结束后：逐一归阵（覆面）→ 逐一翻开（按抽取先后顺序摆位） */
function collectAndReveal(): void {
  const spreadId = (($('w-spread') as HTMLSelectElement)?.value || 'three');
  tarotSpread = buildTarotSpread(spreadId, tarotPicks, currentSpreadCount(spreadById(spreadId)));
  const slot = $('w-tarot-slot');
  const fan = $('w-tarot-fan');
  if (fan) fan.innerHTML = '';
  if (!slot) return;
  slot.innerHTML = `<div class="w-tarot-title">${tarotSpread.spreadName}</div><div class="w-tarot-grid spread-${spreadId}"></div>`;
  const grid = slot.querySelector('.w-tarot-grid');
  const count = tarotSpread.draws.length;

  // 阶段一：逐一归阵（覆面落位）
  tarotPhase = 'collecting';
  let placed = 0;
  const placeStep = (): void => {
    if (tarotPhase !== 'collecting') return;
    const d = tarotSpread!.draws[placed];
    const cardEl = document.createElement('div');
    cardEl.className = 'w-tarot-slot is-placing';
    cardEl.innerHTML = `<div class="w-tarot-pos">${d.position}</div><div class="w-tarot-face is-face-down">${renderTarotBack()}</div>`;
    grid?.appendChild(cardEl);

    // 归阵同步：已抽区对应牌淡出，全部落定后收起该区域
    const drawnCard = $('w-tarot-drawn')?.querySelectorAll('.w-tarot-drawn-card')[placed];
    if (drawnCard) drawnCard.classList.add('is-out');
    placed += 1;
    if (placed >= count) {
      const drawnWrap = $('w-tarot-drawn');
      if (drawnWrap) {
        window.setTimeout(() => { drawnWrap.style.display = 'none'; }, 520);
      }
      tarotPhase = 'revealing';
      revealStep();
      return;
    }
    tarotCollectTimer = window.setTimeout(placeStep, 450);
  };

  // 阶段二：逐一翻开（替换为牌面，触发翻面动画）
  let revealed = 0;
  const revealStep = (): void => {
    if (tarotPhase !== 'revealing') return;
    const d = tarotSpread!.draws[revealed];
    const cardEl = grid?.querySelectorAll('.w-tarot-slot')[revealed] as HTMLElement | null;
    if (cardEl) {
      cardEl.classList.add('is-flipping');
      cardEl.innerHTML = `<div class="w-tarot-pos">${d.position}</div>${renderTarotCardFace(d.card, d.reversed)}`;
    }
    revealed += 1;
    if (revealed >= count) {
      tarotPhase = 'done';
      const hint = $('w-tarot-hint');
      if (hint) hint.textContent = '占卜完成。可点击「再次占卜」重新洗牌，或填写 Key 后点「AI 解语」。';
      const resetBtn = $('w-tarot-reset');
      const aiBtn = $('w-tarot-ai-btn');
      if (resetBtn) resetBtn.style.display = 'inline-block';
      if (aiBtn) aiBtn.style.display = 'inline-block';
      slot.scrollIntoView({ behavior: 'smooth', block: 'start' });
      const key = (($('w-tarot-apikey') as HTMLInputElement)?.value || '').trim();
      if (key) void runTarotAI();
      return;
    }
    tarotRevealTimer = window.setTimeout(revealStep, 900);
  };

  placeStep();
}

/** 塔罗 AI 解语 */
async function runTarotAI(): Promise<void> {
  if (!tarotSpread) return;
  const key = (($('w-tarot-apikey') as HTMLInputElement)?.value || '').trim();
  if (!key) { alert('请填写 DeepSeek Key'); return; }
  const q = (($('w-tarot-q') as HTMLTextAreaElement)?.value || '').trim();
  const slot = $('w-tarot-slot');
  if (!slot) return;
  const panel = ensureAIPanel(slot, 'w-tarot-ai-panel');
  const prompt = buildTarotAIPrompt(tarotSpread, q || undefined);
  try {
    const content = await askDeepSeek(key, '你是一位严谨的韦特塔罗占卜师，擅长牌阵解读与人生咨询。基于用户抽出的牌阵与问题，给出结构清晰、贴合传统塔罗含义的解读。', prompt);
    renderAIPanel(panel, renderAIHtml(content));
  } catch (e) {
    renderAIPanel(panel, `<span style="color:var(--cos-pink)">失败：${(e as Error).message}</span>`);
  }
}

/** 初始化西式星语（仅首次执行） */
function initWestern(): void {
  if (westernInited) {
    // 二次进入时也要根据当前 hash 切 tab
    return;
  }
  westernInited = true;

  // tab 切换
  document.querySelectorAll<HTMLElement>('.w-tab').forEach(t => {
    t.addEventListener('click', () => switchWesternTab(t.dataset.tab || 'chart'));
  });

  // 城市定位级联：国家 → 省份 → 城市，自动填充时区/经度/纬度（本命盘 + 合盘 A/B 盘）
  initCityCascader('w');
  initCityCascader('wa');
  initCityCascader('wb');

  // 经纬度方式切换：地区自动定位（默认）/ 直接输入经纬度（本命盘 + 合盘 A/B 盘）
  bindCoordMode('w');
  bindCoordMode('wa');
  bindCoordMode('wb');

  $('w-run-btn')?.addEventListener('click', runWesternChart);
  $('w-ai-btn')?.addEventListener('click', () => { void runWesternAI(); });
  $('w-syn-run')?.addEventListener('click', runWesternSynastry);
  $('w-syn-ai-btn')?.addEventListener('click', () => { void runSynastryAI(); });
  $('w-tarot-run')?.addEventListener('click', startTarot);
  $('w-tarot-reset')?.addEventListener('click', () => resetTarot());
  $('w-tarot-ai-btn')?.addEventListener('click', () => { void runTarotAI(); });
  $('w-spread')?.addEventListener('change', () => { syncTarotCountWrap(); resetTarot(); });
  $('w-tarot-count')?.addEventListener('change', () => resetTarot());
  $('w-tarot-deck')?.addEventListener('change', () => resetTarot());
  $('w-tarot-out')?.addEventListener('click', onTarotFanClick);
  $('w-tarot-confirm-yes')?.addEventListener('click', () => confirmTarotPick());
  $('w-tarot-confirm-no')?.addEventListener('click', () => cancelTarotPick());

  // 塔罗面板首次初始化（洗牌准备；退出星域重进才会重新洗牌，切换 tab 不重置）
  syncTarotCountWrap();
  resetTarot();

  // 默认填充十二星座
  const ss = $('w-sunsign-out');
  if (ss) ss.innerHTML = renderSunsignPanel();
  bindSunsignModal();
}

// ============================================================
// 星座详解弹窗：点击卡片从该卡片位置展开，点击空白处丝滑回缩
// ============================================================

/**
 * 将弹窗卡片定位到触发卡片位置（transform-origin 从该点展开）。
 * 关闭时先播放回缩动画，动画结束后移除节点。
 */
function openSignModal(signId: string, trigger: HTMLElement): void {
  const html = renderSignDetailModal(signId);
  if (!html) return;
  closeSignModal(); // 若已有弹窗先关闭
  const modal = document.createElement('div');
  modal.innerHTML = html;
  const root = modal.firstElementChild as HTMLElement;
  document.body.appendChild(root);

  const card = root.querySelector<HTMLElement>('[data-sign-modal-card]');
  if (!card) { root.remove(); return; }
  const r = trigger.getBoundingClientRect();
  // 弹窗从触发卡片中心位置展开（transform-origin）
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  card.style.setProperty('--ox', `${cx}px`);
  card.style.setProperty('--oy', `${cy}px`);
  // 下一帧加 is-open 触发展开动画
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('is-open')));
  document.body.style.overflow = 'hidden';
}

function closeSignModal(): void {
  const existing = document.querySelector<HTMLElement>('[data-sign-modal]');
  if (!existing) return;
  existing.classList.remove('is-open');
  existing.classList.add('is-closing');
  // 等待回缩动画结束再移除
  window.setTimeout(() => existing.remove(), 420);
  document.body.style.overflow = '';
}

/** 绑定星座卡片点击展开 / 点击空白回缩 */
function bindSunsignModal(): void {
  const out = $('w-sunsign-out');
  if (!out) return;

  out.addEventListener('click', (ev) => {
    const target = ev.target as HTMLElement;
    const card = target.closest<HTMLElement>('[data-sign]');
    if (card) {
      ev.stopPropagation();
      openSignModal(card.dataset.sign || '', card);
    }
  });
  out.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter' || ev.key === ' ') {
      const target = ev.target as HTMLElement;
      const card = target.closest<HTMLElement>('[data-sign]');
      if (card) {
        ev.preventDefault();
        openSignModal(card.dataset.sign || '', card);
      }
    }
  });

  // 弹窗事件委托（挂在 document 上，随弹窗创建而生效）
  document.addEventListener('click', (ev) => {
    const target = ev.target as HTMLElement;
    const closeBtn = target.closest<HTMLElement>('[data-sign-modal-close]');
    if (closeBtn) {
      ev.stopPropagation();
      closeSignModal();
      return;
    }
    // 点击毛玻璃遮罩（非弹窗卡片本身）→ 关闭
    const modalRoot = target.closest<HTMLElement>('[data-sign-modal]');
    const inCard = target.closest<HTMLElement>('[data-sign-modal-card]');
    if (modalRoot && !inCard && target === modalRoot) {
      closeSignModal();
    }
  });
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') closeSignModal();
  });
}

/**
 * 初始化国家 → 省份 → 城市级联选择器（前缀化，可复用于本命盘与合盘 A/B 盘）。
 * 选择城市后自动将经纬度与时区填入对应输入框（用户仍可手动微调）。
 * prefix 为表单元素 ID 前缀：本命盘 'w'、合盘 'wa' / 'wb'。
 */
function initCityCascader(prefix: string): void {
  const countrySel = $(`${prefix}-country`) as HTMLSelectElement | null;
  const provinceSel = $(`${prefix}-province`) as HTMLSelectElement | null;
  const citySel = $(`${prefix}-city`) as HTMLSelectElement | null;
  if (!countrySel || !provinceSel || !citySel) return;

  /** 填充国家下拉 */
  const fillCountries = (): void => {
    countrySel.innerHTML = GEO.map((c, i) => `<option value="${i}">${c.n}</option>`).join('');
  };

  /** 依据当前国家填充省份下拉 */
  const fillProvinces = (): void => {
    const country = GEO[parseInt(countrySel.value, 10)];
    if (!country) return;
    provinceSel.innerHTML = country.p.map((p, i) => `<option value="${i}">${p.n}</option>`).join('');
    fillCities();
  };

  /** 依据当前省份填充城市下拉，并应用坐标 */
  const fillCities = (): void => {
    const country = GEO[parseInt(countrySel.value, 10)];
    const province = country?.p[parseInt(provinceSel.value, 10)];
    if (!province) return;
    citySel.innerHTML = province.c.map((c, i) => `<option value="${i}">${c[0]}</option>`).join('');
    applyCity();
  };

  /** 将当前选中城市的经纬度与时区写入输入框 */
  const applyCity = (): void => {
    const country = GEO[parseInt(countrySel.value, 10)];
    const province = country?.p[parseInt(provinceSel.value, 10)];
    const city = province?.c[parseInt(citySel.value, 10)];
    if (!city) return;
    const lon = $(`${prefix}-lon`) as HTMLInputElement | null;
    const lat = $(`${prefix}-lat`) as HTMLInputElement | null;
    const tz = $(`${prefix}-tz`) as HTMLInputElement | null;
    if (lon) lon.value = String(city[1]);
    if (lat) lat.value = String(city[2]);
    if (tz) tz.value = String(city[3] ?? country.tz); // 优先城市级时区，缺省用国家时区
  };

  countrySel.addEventListener('change', fillProvinces);
  provinceSel.addEventListener('change', fillCities);
  citySel.addEventListener('change', applyCity);

  // 默认选中：中国 → 上海市 → 上海（与表单默认经纬度/时区一致）
  fillCountries();
  countrySel.value = '0';
  fillProvinces();
  provinceSel.value = '2'; // 上海市
  fillCities();
  citySel.value = '0';
  applyCity();
}

/**
 * 绑定经纬度方式切换：地区自动定位（默认，隐藏手动经纬度输入）/ 直接输入经纬度。
 * 两种方式共用同一组经纬度/时区输入框，其余逻辑保持一致。
 * prefix 为表单元素 ID 前缀：本命盘 'w'、合盘 'wa' / 'wb'。
 */
function bindCoordMode(prefix: string): void {
  const radios = document.querySelectorAll<HTMLInputElement>(`input[name="${prefix}-coord-mode"]`);
  if (!radios.length) return;
  const apply = (): void => {
    const manual = Array.from(radios).some(r => r.checked && r.value === 'manual');
    const grid = $(`${prefix}-coord-grid`) as HTMLElement | null;
    const loc = $(`${prefix}-location`) as HTMLElement | null;
    if (grid) grid.style.display = manual ? '' : 'none';
    if (loc) loc.style.display = manual ? 'none' : '';
  };
  radios.forEach(r => r.addEventListener('change', apply));
  apply();
}

// ============================================================
// 入口初始化
// ============================================================

/**
 * 主入口动效：日月弧形轨迹 + 鼠标驱动全屏渐变
 * ------------------------------------------------------------------
 * 鼠标 X 越靠左 → t 越接近 -1 → 月亮升起 / 太阳下落 / 全屏月色
 * 鼠标 X 越靠右 → t 越接近 +1 → 太阳升起 / 月亮下落 / 全屏日色
 * 鼠标在中央 → t ≈ 0 → 黄昏默认（双星并存）
 * 进入 portal 区域时强制 t 极值；离开时回到鼠标位置
 * 通过 CSS 变量 --t 驱动（CSS 用 calc() + color-mix() 实时插值）
 */
function initPortalAnim(): void {
  const root = document.documentElement;
  const portal = document.getElementById('portal');
  if (!portal) return;

  let targetT = 0;     // 目标时间 (-1..+1)
  let currentT = 0;    // 当前时间（用于平滑插值）

  /** 应用 t 到所有派生变量 */
  const applyT = (t: number): void => {
    root.style.setProperty('--t', t.toFixed(4));

    // ===========================================================
    // 太阳（弧形轨迹：东升西落）
    // ------------------------------------------------------------
    // t = +1 → 正午：天顶偏东（y=-55, x=+30）, 最大最亮
    // t =  0 → 黄昏：地平线（y=0,    x=0  ）, 中等
    // t = -1 → 深夜：西沉（y=+40,    x=-30）, 最小最暗
    // 关键：t=0 时 y=0（地平线），两侧向不同方向走
    // ===========================================================
    let sunX: number, sunY: number;
    let sunScale: number, sunOpacity: number, sunGlow: number;
    if (t >= 0) {
      // 0 → +1：地平线 → 正午（弧线上升 + 东移）
      const p = t;                            // 0..1
      const e = Math.sin(p * Math.PI / 2);    // 0..1，缓动曲线
      sunX = 30 * e;                          // 0..+30（东移）
      sunY = -55 * e;                         // 0..-55（明显上升）
      sunScale = 0.4 + 0.65 * e;              // 0.4..1.05（强对比）
      sunOpacity = 0.4 + 0.6 * e;             // 0.4..1.0
      sunGlow = 0 + 1.1 * e;                  // 0..1.1
    } else {
      // -1 → 0：深夜 → 地平线（弧线下降 + 西移）
      const p = -t;                           // 0..1
      const e = Math.sin(p * Math.PI / 2);    // 0..1
      sunX = -30 * e;                         // 0..-30（西移）
      sunY = 40 * e;                          // 0..+40（下沉）
      sunScale = 0.4 - 0.32 * e;              // 0.4..0.08（极小）
      sunOpacity = 0.4 - 0.32 * e;            // 0.4..0.08
      sunGlow = 0 - 0.4 * e;                  // 0..-0.4
    }
    root.style.setProperty('--sun-y', `${sunY.toFixed(2)}%`);
    root.style.setProperty('--sun-x', `${sunX.toFixed(2)}%`);
    root.style.setProperty('--sun-scale', sunScale.toFixed(3));
    root.style.setProperty('--sun-opacity', sunOpacity.toFixed(3));
    root.style.setProperty('--sun-glow', sunGlow.toFixed(3));

    // ===========================================================
    // 月亮（弧形轨迹，镜像太阳）
    // ------------------------------------------------------------
    // t = +1 → 白天：东沉（y=+40, x=+30）
    // t =  0 → 黄昏：地平线（y=0,    x=0  ）
    // t = -1 → 深夜：当空（y=-55,    x=-30）
    // ===========================================================
    let moonX: number, moonY: number;
    let moonScale: number, moonOpacity: number, moonGlow: number;
    if (t <= 0) {
      // 0 → -1：地平线 → 深夜（弧线上升 + 西移）
      const p = -t;                           // 0..1
      const e = Math.sin(p * Math.PI / 2);    // 0..1
      moonX = -30 * e;                        // 0..-30
      moonY = -55 * e;                        // 0..-55（明显上升）
      moonScale = 0.4 + 0.65 * e;              // 0.4..1.05
      moonOpacity = 0.4 + 0.6 * e;            // 0.4..1.0
      moonGlow = 0 + 1.1 * e;                 // 0..1.1
    } else {
      // 0 → +1：地平线 → 白天（弧线下降 + 东移）
      const p = t;                            // 0..1
      const e = Math.sin(p * Math.PI / 2);    // 0..1
      moonX = 30 * e;                         // 0..+30
      moonY = 40 * e;                         // 0..+40（下沉）
      moonScale = 0.4 - 0.32 * e;              // 0.4..0.08
      moonOpacity = 0.4 - 0.32 * e;           // 0.4..0.08
      moonGlow = 0 - 0.4 * e;                 // 0..-0.4
    }
    root.style.setProperty('--moon-y', `${moonY.toFixed(2)}%`);
    root.style.setProperty('--moon-x', `${moonX.toFixed(2)}%`);
    root.style.setProperty('--moon-scale', moonScale.toFixed(3));
    root.style.setProperty('--moon-opacity', moonOpacity.toFixed(3));
    root.style.setProperty('--moon-glow', moonGlow.toFixed(3));
  };

  /** 帧循环：dt 自适应缓动（60Hz/120Hz/30Hz 下速度一致） */
  let lastTs = performance.now();
  // 指数衰减系数：每秒衰减到 e^-SMOOTH_PER_SECOND，60fps 下相当于 0.18/帧
  const SMOOTH_PER_SECOND = 8;
  const tick = (ts: number): void => {
    const dt = Math.min(0.1, (ts - lastTs) / 1000); // 单帧秒数，封顶 100ms
    lastTs = ts;
    // 帧率自适应的指数缓动：1 - exp(-k*dt)
    const k = 1 - Math.exp(-SMOOTH_PER_SECOND * dt);
    currentT += (targetT - currentT) * k;
    if (Math.abs(currentT - targetT) < 0.0005) currentT = targetT;
    applyT(currentT);
    requestAnimationFrame(tick);
  };

  /** 参与动效的两张入口卡片（西式=moon，中式=sun） */
  const cards = portal.querySelectorAll<HTMLElement>('.portal-card[data-target]');

  /**
   * 计算鼠标位置到某张卡片的二维接近度（0=远离，1=在卡片中心）
   * 使用 smoothstep 平滑曲线：鼠标进入卡片边缘时接近度≈0，
   * 越靠近中心接近度越接近 1，提供渐进式升起的时间感
   * 注意：dist 必须先 clamp 到 [0,1]，否则卡片外（dist>1）时
   * smoothstep 公式会返回正值甚至 >1，干扰另一张卡片的接近度
   */
  const getCardProximity2D = (mx: number, my: number, card: HTMLElement): number => {
    const rect = card.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return 0;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    // 归一化距离（dx, dy 范围约 0..1+）
    const dx = (mx - cx) / (rect.width / 2);
    const dy = (my - cy) / (rect.height / 2);
    // 欧氏距离：中心=0，边缘≈1，远处>1
    const dist = Math.sqrt(dx * dx + dy * dy);
    // 先 clamp 到 [0,1]：卡片外一律为 0，杜绝跨卡干扰
    const t01 = Math.max(0, Math.min(1, 1 - dist));
    // smoothstep 插值：t=0 → 0，t=0.5 → 0.5，t=1 → 1
    return t01 * t01 * (3 - 2 * t01);
  };

  /** 鼠标移动：完全基于鼠标到各卡片中心的接近度驱动 t
   *  - 鼠标在中式卡片中心 → 太阳到达顶峰（t=+1）
   *  - 鼠标在西式卡片中心 → 月亮到达顶峰（t=-1）
   *  - 鼠标在两卡片之间/远离 → 黄昏（t=0）
   *  渐进逻辑：鼠标从卡片边缘滑向中心 → 接近度从 0 平滑升到 1
   *  → 对应天体从地平线平滑升到天顶，没有瞬变
   */
  const onMouseMove = (e: MouseEvent): void => {
    // 分别计算到两张卡片的二维接近度
    let proxSun = 0;
    let proxMoon = 0;
    cards.forEach(card => {
      const side = card.getAttribute('data-target');
      const prox = getCardProximity2D(e.clientX, e.clientY, card);
      if (side === 'sun') proxSun = Math.max(proxSun, prox);
      else if (side === 'moon') proxMoon = Math.max(proxMoon, prox);
    });

    // t = proxSun - proxMoon，范围 -1..+1
    targetT = Math.max(-1, Math.min(1, proxSun - proxMoon));
  };

  /** 鼠标离开整页：回到默认黄昏 */
  const onWindowLeave = (): void => {
    targetT = 0;
  };

  // 绑定事件
  window.addEventListener('mousemove', onMouseMove, { passive: true });
  document.addEventListener('mouseleave', onWindowLeave);

  // 启动
  applyT(0);
  requestAnimationFrame(tick);
}

function init(): void {
  // 中式命理需要 DOM 但默认隐藏，预先绑定事件（用户首次点入即生效）
  initChinese();
  // 初次显示
  if (!location.hash) location.hash = '#/';
  applyRoute();
  // 主入口动效（仅在显示主入口时执行）
  initPortalAnim();
}

if (document.readyState === 'loading') window.addEventListener('DOMContentLoaded', init);
else init();
