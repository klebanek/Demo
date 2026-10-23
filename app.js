'use strict';

(() => {
  const STORE = 'keto.v1';
  const PREFS = 'keto.prefs.v1';
  const DAY = 864e5;
  const MINUS = '−';
  const ROWS_COLLAPSED = 14;

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // ---------- storage ----------
  const readJSON = (k, fb) => {
    try { return JSON.parse(localStorage.getItem(k)) ?? fb; } catch { return fb; }
  };
  const writeJSON = (k, v) => {
    try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode / quota */ }
  };

  function uid() {
    return (crypto.randomUUID && crypto.randomUUID()) || Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function normalize(d) {
    const out = { measurements: [], activities: [] };
    if (!d || typeof d !== 'object') return out;
    const okDate = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
    const seen = new Set();
    for (const m of Array.isArray(d.measurements) ? d.measurements : []) {
      const w = Number(m?.weight);
      const f = m?.fat == null || m.fat === '' ? null : Number(m.fat);
      if (!okDate(m?.date) || !isFinite(w) || w <= 0 || (f != null && !isFinite(f)) || seen.has(m.date)) continue;
      seen.add(m.date);
      out.measurements.push({ id: String(m.id || uid()), date: m.date, weight: w, fat: f });
    }
    for (const a of Array.isArray(d.activities) ? d.activities : []) {
      const mi = Number(a?.minutes);
      const di = Number(a?.distance) || 0;
      if (!okDate(a?.date) || !isFinite(mi) || mi <= 0 || di < 0) continue;
      out.activities.push({ id: String(a.id || uid()), date: a.date, distance: di, minutes: mi });
    }
    return out;
  }

  let state = normalize(readJSON(STORE, null));
  const prefs = Object.assign({ metric: 'weight', range: '30', tab: 'm', showAll: false }, readJSON(PREFS, {}));
  const save = () => writeJSON(STORE, state);
  const savePrefs = () => writeJSON(PREFS, prefs);

  // ---------- dates & numbers ----------
  const pad = (n) => String(n).padStart(2, '0');
  const todayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };
  const toTs = (s) => { const [y, m, d] = s.split('-').map(Number); return Date.UTC(y, m - 1, d); };
  const tsToStr = (ts) => new Date(ts).toISOString().slice(0, 10);

  const dfRow = new Intl.DateTimeFormat('pl-PL', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
  const dfShort = new Intl.DateTimeFormat('pl-PL', { day: 'numeric', month: 'short', timeZone: 'UTC' });
  const dfLong = new Intl.DateTimeFormat('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' });
  const dfMonthYear = new Intl.DateTimeFormat('pl-PL', { month: 'short', year: '2-digit', timeZone: 'UTC' });

  const fmt = (v, d = 1) => v.toLocaleString('pl-PL', { minimumFractionDigits: d, maximumFractionDigits: d });
  const round = (v, d = 1) => Math.round(v * 10 ** d) / 10 ** d;
  function fmtSigned(v, d = 1) {
    const r = round(v, d);
    if (r === 0) return fmt(0, d);
    return (r > 0 ? '+' : MINUS) + fmt(Math.abs(r), d);
  }
  const dir = (v, d = 1) => { const r = round(v, d); return r === 0 ? 'flat' : r < 0 ? 'down' : 'up'; };
  // Weight precision follows the data: 0.05 kg scales get two decimals.
  let WD = 1;
  const kg = (v) => fmt(v, WD);
  const kgS = (v) => fmtSigned(v, WD);
  const kgDir = (v) => dir(v, WD);
  const fmtIn = (v) => String(v).replace('.', ',');
  const parseNum = (s) => {
    const v = parseFloat(String(s).replace(/\s/g, '').replace(',', '.'));
    return isFinite(v) ? v : NaN;
  };
  function fmtPace(minPerKm) {
    const total = Math.round(minPerKm * 60);
    return `${Math.floor(total / 60)}:${pad(total % 60)}`;
  }
  function relDay(ts) {
    const diff = Math.round((toTs(todayStr()) - ts) / DAY);
    if (diff === 0) return 'dziś';
    if (diff === 1) return 'wczoraj';
    return dfShort.format(ts);
  }

  // ---------- computations ----------
  function series() {
    const sorted = [...state.measurements].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
    if (!sorted.length) return [];
    const first = sorted[0];
    const firstFat = sorted.find((e) => e.fat != null);
    let prev = null;
    let prevFat = null;
    return sorted.map((e) => {
      const r = {
        ...e,
        ts: toTs(e.date),
        dDay: prev ? e.weight - prev.weight : null,
        dTot: e.weight - first.weight,
        dFatDay: e.fat != null && prevFat ? e.fat - prevFat.fat : null,
        dFatTot: e.fat != null && firstFat ? e.fat - firstFat.fat : null,
      };
      prev = e;
      if (e.fat != null) prevFat = e;
      return r;
    });
  }

  // Exponentially smoothed series: the "trend" line (damps day-to-day water noise).
  function ewma(vals, alpha = 0.3) {
    let t = null;
    return vals.map((v) => (t = t == null ? v : t + alpha * (v - t)));
  }

  // Least-squares slope, expressed per week.
  function slopePerWeek(pts) {
    if (pts.length < 3) return null;
    const span = (pts[pts.length - 1].ts - pts[0].ts) / DAY;
    if (span < 3) return null;
    const n = pts.length;
    const xs = pts.map((p) => (p.ts - pts[0].ts) / DAY);
    const ys = pts.map((p) => p.v);
    const mx = xs.reduce((a, b) => a + b, 0) / n;
    const my = ys.reduce((a, b) => a + b, 0) / n;
    let num = 0;
    let den = 0;
    for (let i = 0; i < n; i++) { num += (xs[i] - mx) * (ys[i] - my); den += (xs[i] - mx) ** 2; }
    return den ? (num / den) * 7 : null;
  }

  // ---------- hero + tiles ----------
  function renderHero() {
    const s = series();
    const hero = $('#hero');
    const stats = $('#stats');
    if (!s.length) {
      hero.innerHTML = `
        <p class="label">Aktualna waga</p>
        <p class="empty-title">Zacznij od pierwszego pomiaru</p>
        <p class="muted">Dodaj wagę i procent tkanki tłuszczowej – różnice i trend policzy aplikacja.</p>
        <button class="link" id="demoBtn">Wczytaj dane przykładowe</button>`;
      stats.innerHTML = '';
      return;
    }
    const last = s[s.length - 1];
    const first = s[0];
    const chip = last.dDay == null
      ? '<span class="chip">Pierwszy pomiar</span>'
      : `<span class="chip ${kgDir(last.dDay)}">${kgS(last.dDay)} kg</span><span>od poprzedniego pomiaru</span>`;
    hero.innerHTML = `
      <p class="label">Aktualna waga · ${relDay(last.ts)}</p>
      <div class="big">${kg(last.weight)}<small>kg</small></div>
      <div class="hero-foot">${chip}</div>`;

    const recent = s.filter((e) => e.ts >= last.ts - 29 * DAY).map((e) => ({ ts: e.ts, v: e.weight }));
    const slope = slopePerWeek(recent);
    const lastFat = [...s].reverse().find((e) => e.fat != null);

    stats.innerHTML = `
      <div class="tile">
        <p class="label">Łącznie</p>
        <p class="val ${kgDir(last.dTot)}">${s.length > 1 ? kgS(last.dTot) : kg(0)}<small>kg</small></p>
        <p class="sub">od ${dfShort.format(first.ts)}</p>
      </div>
      <div class="tile">
        <p class="label">Trend</p>
        <p class="val ${slope == null ? '' : kgDir(slope)}">${slope == null ? '—' : kgS(slope)}<small>${slope == null ? '' : 'kg/tydz.'}</small></p>
        <p class="sub">${slope == null ? 'brak danych' : 'ostatnie 30 dni'}</p>
      </div>
      <div class="tile">
        <p class="label">Tłuszcz</p>
        <p class="val">${lastFat ? fmt(lastFat.fat) : '—'}<small>${lastFat ? '%' : ''}</small></p>
        <p class="sub">${lastFat && lastFat.dFatTot != null && s.filter((e) => e.fat != null).length > 1 ? `${fmtSigned(lastFat.dFatTot)} p.p.` : 'brak zmian'}</p>
      </div>`;
  }

  // ---------- chart ----------
  let cs = null; // chart state for the scrubber
  const chartBox = $('#chart');

  function niceTicks(lo, hi, n) {
    const raw = (hi - lo) / n;
    const mag = 10 ** Math.floor(Math.log10(raw));
    const norm = raw / mag;
    const step = (norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10) * mag;
    const ticks = [];
    for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) ticks.push(+v.toFixed(6));
    return { ticks, step };
  }

  function smoothPath(P) {
    const f = (n) => n.toFixed(1);
    if (P.length < 3) return 'M' + P.map((p) => `${f(p.x)},${f(p.y)}`).join('L');
    let d = `M${f(P[0].x)},${f(P[0].y)}`;
    for (let i = 0; i < P.length - 1; i++) {
      const p0 = P[i - 1] || P[i];
      const p1 = P[i];
      const p2 = P[i + 1];
      const p3 = P[i + 2] || p2;
      d += `C${f(p1.x + (p2.x - p0.x) / 6)},${f(p1.y + (p2.y - p0.y) / 6)} ${f(p2.x - (p3.x - p1.x) / 6)},${f(p2.y - (p3.y - p1.y) / 6)} ${f(p2.x)},${f(p2.y)}`;
    }
    return d;
  }

  function renderChart() {
    const metric = prefs.metric;
    const unit = metric === 'weight' ? 'kg' : '%';
    const D = metric === 'weight' ? WD : 1;
    const s = series();
    let pts = s.filter((e) => e[metric] != null).map((e) => ({ ts: e.ts, date: e.date, v: e[metric] }));
    const tr = ewma(pts.map((p) => p.v));
    pts.forEach((p, i) => { p.t = tr[i]; });
    if (prefs.range !== 'all' && pts.length) {
      const cutoff = pts[pts.length - 1].ts - (Number(prefs.range) - 1) * DAY;
      pts = pts.filter((p) => p.ts >= cutoff);
    }

    const meta = $('#chartMeta');
    const mini = $('#chartStats');
    if (!pts.length) {
      cs = null;
      meta.innerHTML = '';
      mini.innerHTML = '';
      chartBox.innerHTML = `<div class="empty-chart">${metric === 'weight' ? 'Dodaj pierwszy pomiar, a tutaj pojawi się wykres.' : 'Dodaj pomiar z procentem tłuszczu, żeby zobaczyć wykres.'}</div>`;
      return;
    }

    const W = Math.max(chartBox.clientWidth, 240);
    const H = 230;
    const m = { t: 14, r: 40, b: 24, l: 4 };
    const minX = pts[0].ts;
    const maxX = pts[pts.length - 1].ts;
    const X = (ts) => (maxX === minX ? (m.l + W - m.r) / 2 : m.l + ((ts - minX) / (maxX - minX)) * (W - m.l - m.r));

    const all = pts.flatMap((p) => [p.v, p.t]);
    let lo = Math.min(...all);
    let hi = Math.max(...all);
    const pad_ = Math.max((hi - lo) * 0.18, 0.3);
    lo -= pad_;
    hi += pad_;
    const Y = (v) => m.t + (1 - (v - lo) / (hi - lo)) * (H - m.t - m.b);
    const { ticks, step } = niceTicks(lo, hi, 4);
    const dec = step >= 1 ? 0 : D;

    const trendP = pts.map((p) => ({ x: X(p.ts), y: Y(p.t) }));
    const line = smoothPath(trendP);
    const base = H - m.b;
    const area = pts.length > 1 ? `${line}L${trendP[trendP.length - 1].x.toFixed(1)},${base}L${trendP[0].x.toFixed(1)},${base}Z` : '';

    const grid = ticks.map((v) => `<line class="grid" x1="${m.l}" x2="${W - m.r + 6}" y1="${Y(v).toFixed(1)}" y2="${Y(v).toFixed(1)}"/><text x="${W - m.r + 12}" y="${(Y(v) + 4).toFixed(1)}">${fmt(v, dec)}</text>`).join('');

    const spanDays = (maxX - minX) / DAY;
    const labelFmt = spanDays > 300 ? dfMonthYear : dfShort;
    const nLabels = pts.length > 1 ? (W > 420 ? 4 : 3) : 1;
    let xl = '';
    for (let i = 0; i < nLabels; i++) {
      const f = nLabels === 1 ? 0.5 : i / (nLabels - 1);
      const ts = minX + (maxX - minX) * f;
      const anchor = nLabels === 1 ? 'middle' : i === 0 ? 'start' : i === nLabels - 1 ? 'end' : 'middle';
      const x = nLabels === 1 ? X(minX) : m.l + f * (W - m.l - m.r);
      xl += `<text x="${x.toFixed(1)}" y="${H - 6}" text-anchor="${anchor}">${labelFmt.format(Math.round(ts / DAY) * DAY)}</text>`;
    }

    const dots = pts.length <= 120 ? pts.map((p) => `<circle class="dot" cx="${X(p.ts).toFixed(1)}" cy="${Y(p.v).toFixed(1)}" r="2.6"/>`).join('') : '';
    const lp = pts[pts.length - 1];

    chartBox.innerHTML = `
      <svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Wykres: ${metric === 'weight' ? 'waga' : 'tłuszcz'}">
        <defs>
          <linearGradient id="fillg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style="stop-color:var(--accent);stop-opacity:.28"/>
            <stop offset="1" style="stop-color:var(--accent);stop-opacity:0"/>
          </linearGradient>
        </defs>
        ${grid}${xl}
        ${area ? `<path d="${area}" fill="url(#fillg)"/>` : ''}
        ${dots}
        ${pts.length > 1 ? `<path class="trend" d="${line}"/>` : ''}
        <circle class="last-ring" cx="${X(lp.ts).toFixed(1)}" cy="${Y(lp.t).toFixed(1)}" r="5.5"/>
        <g id="hov" visibility="hidden">
          <line class="cursor" id="hovLine" y1="${m.t}" y2="${base}"/>
          <circle class="hov-raw" id="hovRaw" r="5"/>
          <circle class="hov-trend" id="hovTrend" r="5"/>
        </g>
      </svg>
      <div class="tip" id="tip" hidden></div>`;

    cs = { pts, X, Y, W, unit, D };

    const first = pts[0];
    const change = lp.v - first.v;
    const slope = slopePerWeek(pts.map((p) => ({ ts: p.ts, v: p.v })));
    meta.innerHTML = `
      <div class="now">${fmt(lp.v, D)}<small>${unit}</small></div>
      <div class="legend"><span><i style="background:var(--text3)"></i>pomiar</span><span><i style="background:var(--accent)"></i>trend</span></div>`;
    mini.innerHTML = `
      <div><p class="label">Zmiana w okresie</p><p class="v ${dir(change, D)}">${pts.length > 1 ? fmtSigned(change, D) : fmt(0, D)} ${unit}</p></div>
      <div><p class="label">Tempo zmian</p><p class="v ${slope == null ? '' : dir(slope, D)}">${slope == null ? '—' : `${fmtSigned(slope, D)} ${unit}/tydz.`}</p></div>`;
  }

  function scrub(ev) {
    if (!cs) return;
    const r = chartBox.getBoundingClientRect();
    const px = ev.clientX - r.left;
    let best = 0;
    let bd = Infinity;
    cs.pts.forEach((p, i) => {
      const d = Math.abs(cs.X(p.ts) - px);
      if (d < bd) { bd = d; best = i; }
    });
    const p = cs.pts[best];
    const x = cs.X(p.ts);
    $('#hov').setAttribute('visibility', 'visible');
    $('#hovLine').setAttribute('x1', x);
    $('#hovLine').setAttribute('x2', x);
    $('#hovRaw').setAttribute('cx', x);
    $('#hovRaw').setAttribute('cy', cs.Y(p.v));
    $('#hovTrend').setAttribute('cx', x);
    $('#hovTrend').setAttribute('cy', cs.Y(p.t));
    const tip = $('#tip');
    tip.hidden = false;
    tip.innerHTML = `<span>${dfRow.format(p.ts)}</span><b>${fmt(p.v, cs.D)} ${cs.unit}</b><span>trend ${fmt(p.t, cs.D)} ${cs.unit}</span>`;
    const w = tip.offsetWidth;
    tip.style.left = `${Math.min(Math.max(x - w / 2, 0), cs.W - w)}px`;
  }
  function hideScrub() {
    const g = $('#hov');
    if (g) g.setAttribute('visibility', 'hidden');
    const tip = $('#tip');
    if (tip) tip.hidden = true;
  }
  chartBox.addEventListener('pointermove', scrub);
  chartBox.addEventListener('pointerdown', scrub);
  chartBox.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') hideScrub(); });

  // ---------- log ----------
  function renderLog() {
    const wrap = $('#table');
    const summary = $('#logSummary');
    if (prefs.tab === 'm') {
      summary.innerHTML = '';
      const rows = series().reverse();
      if (!rows.length) { wrap.innerHTML = '<p class="empty-table">Brak pomiarów. Stuknij „Dodaj pomiar”.</p>'; return; }
      const shown = prefs.showAll ? rows : rows.slice(0, ROWS_COLLAPSED);
      const dash = '<span class="dash">—</span>';
      const body = shown.map((e) => `
        <tr data-kind="m" data-id="${e.id}">
          <td class="d">${dfShort.format(e.ts)}</td>
          <td><b>${kg(e.weight)}</b></td>
          <td class="${e.dDay == null ? '' : kgDir(e.dDay)}">${e.dDay == null ? dash : kgS(e.dDay)}</td>
          <td class="${kgDir(e.dTot)}">${rows.length === 1 || e === rows[rows.length - 1] ? dash : kgS(e.dTot)}</td>
          <td>${e.fat == null ? dash : `${fmt(e.fat)}${e.dFatDay == null ? '' : `<small class="${dir(e.dFatDay)}">${fmtSigned(e.dFatDay)}</small>`}`}</td>
        </tr>`).join('');
      wrap.innerHTML = `
        <table>
          <thead><tr><th>Data</th><th>Waga</th><th>Dzień</th><th>Łącznie</th><th>Tłuszcz</th></tr></thead>
          <tbody>${body}</tbody>
        </table>
        ${rows.length > ROWS_COLLAPSED ? `<button class="more" id="moreBtn">${prefs.showAll ? 'Pokaż mniej' : `Pokaż wszystkie (${rows.length})`}</button>` : ''}`;
    } else {
      const rows = [...state.activities].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
      const today = toTs(todayStr());
      const weekStart = today - ((new Date(today).getUTCDay() + 6) % 7) * DAY;
      const week = rows.filter((a) => toTs(a.date) >= weekStart);
      const km = week.reduce((n, a) => n + a.distance, 0);
      const min = week.reduce((n, a) => n + a.minutes, 0);
      summary.innerHTML = rows.length
        ? `<span class="chip">Ten tydzień: ${fmt(km)} km</span><span class="chip">${fmt(min, 0)} min</span><span class="chip">${week.length} ${week.length === 1 ? 'aktywność' : 'akt.'}</span>`
        : '';
      if (!rows.length) { wrap.innerHTML = '<p class="empty-table">Brak aktywności. Stuknij „Dodaj aktywność”.</p>'; return; }
      const shown = prefs.showAll ? rows : rows.slice(0, ROWS_COLLAPSED);
      const body = shown.map((a) => `
        <tr data-kind="a" data-id="${a.id}">
          <td class="d">${dfShort.format(toTs(a.date))}</td>
          <td>${a.distance > 0 ? `<b>${fmt(a.distance, 2)}</b>` : '<span class="dash">—</span>'}</td>
          <td><b>${fmt(a.minutes, 0)}</b></td>
          <td>${a.distance > 0 ? fmtPace(a.minutes / a.distance) : '<span class="dash">—</span>'}</td>
        </tr>`).join('');
      wrap.innerHTML = `
        <table>
          <thead><tr><th>Data</th><th>Dystans</th><th>Czas</th><th>Tempo</th></tr></thead>
          <tbody>${body}</tbody>
        </table>
        ${rows.length > ROWS_COLLAPSED ? `<button class="more" id="moreBtn">${prefs.showAll ? 'Pokaż mniej' : `Pokaż wszystkie (${rows.length})`}</button>` : ''}`;
    }
  }

  function render() {
    $('#today').textContent = dfLong.format(new Date());
    $$('[data-key]').forEach((b) => b.setAttribute('aria-pressed', String(prefs[b.dataset.key] === b.dataset.val)));
    WD = state.measurements.some((m) => Math.abs(m.weight * 10 - Math.round(m.weight * 10)) > 1e-6) ? 2 : 1;
    renderHero();
    renderChart();
    renderLog();
  }

  // ---------- toast ----------
  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 1800);
  }

  // ---------- add / edit sheet ----------
  const sheet = $('#sheet');
  sheet.addEventListener('click', (e) => { if (e.target === sheet) sheet.close(); });

  function openSheet(kind, entry) {
    const isM = kind === 'm';
    const today = todayStr();
    let e = entry;
    if (isM && !e) e = state.measurements.find((x) => x.date === today);
    const editing = !!e;
    const lastM = series().at(-1);
    const title = isM ? (editing ? 'Pomiar' : 'Nowy pomiar') : (editing ? 'Aktywność' : 'Nowa aktywność');

    const rows = isM
      ? `
        <label class="row"><span>Data</span><input type="date" name="date" value="${e?.date || today}" max="${today}" required></label>
        <label class="row"><span>Waga</span><span class="field"><input name="weight" inputmode="decimal" autocomplete="off" placeholder="${lastM ? kg(lastM.weight) : '0,0'}" value="${e ? fmtIn(e.weight) : ''}"><em>kg</em></span></label>
        <label class="row"><span>Tłuszcz</span><span class="field"><input name="fat" inputmode="decimal" autocomplete="off" placeholder="opcjonalnie" value="${e && e.fat != null ? fmtIn(e.fat) : ''}"><em>%</em></span></label>`
      : `
        <label class="row"><span>Data</span><input type="date" name="date" value="${e?.date || today}" max="${today}" required></label>
        <label class="row"><span>Dystans</span><span class="field"><input name="distance" inputmode="decimal" autocomplete="off" placeholder="0,0" value="${e && e.distance ? fmtIn(e.distance) : ''}"><em>km</em></span></label>
        <label class="row"><span>Czas</span><span class="field"><input name="minutes" inputmode="decimal" autocomplete="off" placeholder="0" value="${e ? fmtIn(e.minutes) : ''}"><em>min</em></span></label>`;

    sheet.innerHTML = `
      <form class="sheet" novalidate>
        <div class="sheet-head">
          <button type="button" class="cancel">Anuluj</button>
          <h3 id="sheetTitle">${title}</h3>
          <button type="submit" class="save">Zapisz</button>
        </div>
        <div class="group">${rows}</div>
        <p class="err" role="alert"></p>
        ${editing ? '<button type="button" class="delete">Usuń</button>' : ''}
      </form>`;

    const form = $('form', sheet);
    const err = $('.err', sheet);
    const fail = (msg, field) => { err.textContent = msg; form.elements[field]?.focus(); };

    $('.cancel', sheet).addEventListener('click', () => sheet.close());

    const del = $('.delete', sheet);
    if (del) {
      del.addEventListener('click', () => {
        if (!del.classList.contains('armed')) {
          del.classList.add('armed');
          del.textContent = 'Na pewno usunąć?';
          return;
        }
        if (isM) state.measurements = state.measurements.filter((x) => x.id !== e.id);
        else state.activities = state.activities.filter((x) => x.id !== e.id);
        save();
        sheet.close();
        render();
        toast('Usunięto');
      });
    }

    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const f = form.elements;
      const date = f.date.value;
      if (!date || date > today) return fail('Wybierz poprawną datę (nie z przyszłości).', 'date');

      if (isM) {
        const w = parseNum(f.weight.value);
        if (!(w >= 20 && w <= 400)) return fail('Podaj wagę w kg, np. 84,2 lub 84,15.', 'weight');
        const fatRaw = f.fat.value.trim();
        const fat = fatRaw === '' ? null : parseNum(fatRaw);
        if (fat != null && !(fat >= 1 && fat <= 80)) return fail('Tłuszcz podaj w procentach, np. 27,5.', 'fat');
        if (e) state.measurements = state.measurements.filter((x) => x.id !== e.id);
        state.measurements = state.measurements.filter((x) => x.date !== date); // one measurement per day
        state.measurements.push({ id: e?.id || uid(), date, weight: round(w, 2), fat: fat == null ? null : round(fat, 1) });
      } else {
        const dRaw = f.distance.value.trim();
        const distance = dRaw === '' ? 0 : parseNum(dRaw);
        const minutes = parseNum(f.minutes.value);
        if (!(distance >= 0 && distance <= 1000)) return fail('Dystans podaj w km, np. 5,2.', 'distance');
        if (!(minutes > 0 && minutes <= 2000)) return fail('Podaj czas w minutach, np. 45.', 'minutes');
        if (e) state.activities = state.activities.filter((x) => x.id !== e.id);
        state.activities.push({ id: e?.id || uid(), date, distance: round(distance, 2), minutes: round(minutes, 0) });
      }
      save();
      sheet.close();
      if (isM) prefs.tab = 'm'; else prefs.tab = 'a';
      savePrefs();
      render();
      toast('Zapisano');
    });

    sheet.showModal();
    if (!editing) (isM ? form.elements.weight : form.elements.minutes).focus();
  }

  // ---------- demo, export, import ----------
  function demoData() {
    let seed = 7;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const today = toTs(todayStr());
    const N = 44;
    const out = { measurements: [], activities: [] };
    for (let i = N; i >= 0; i--) {
      const date = tsToStr(today - i * DAY);
      const p = (N - i) / N;
      if (i === 0 || rnd() > 0.1) {
        out.measurements.push({
          id: uid(), date,
          weight: round(92.4 - 6.4 * p ** 0.9 + (rnd() - 0.5) * 1.0, 1),
          fat: round(29.6 - 3.6 * p + (rnd() - 0.5) * 0.6, 1),
        });
      }
      if (rnd() < 0.5) {
        const minutes = Math.round(25 + rnd() * 50);
        out.activities.push({ id: uid(), date, minutes, distance: round(minutes * (0.085 + rnd() * 0.04), 2) });
      }
    }
    return out;
  }

  function exportData() {
    const blob = new Blob([JSON.stringify({ app: 'keto', version: 1, exportedAt: new Date().toISOString(), ...state }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `keto-${todayStr()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  $('#importFile').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    try {
      const data = normalize(JSON.parse(await file.text()));
      if (!data.measurements.length && !data.activities.length) throw new Error('empty');
      if (!confirm(`Zastąpić obecne dane kopią? (${data.measurements.length} pomiarów, ${data.activities.length} aktywności)`)) return;
      state = data;
      save();
      render();
      toast('Zaimportowano');
    } catch {
      alert('Nie udało się wczytać pliku. Wybierz kopię wyeksportowaną z tej aplikacji.');
    }
  });

  // ---------- events ----------
  document.addEventListener('click', (e) => {
    const seg = e.target.closest('[data-key]');
    if (seg) {
      prefs[seg.dataset.key] = seg.dataset.val;
      if (seg.dataset.key === 'tab') prefs.showAll = false;
      savePrefs();
      render();
      return;
    }
    const row = e.target.closest('tr[data-id]');
    if (row) {
      const list = row.dataset.kind === 'm' ? state.measurements : state.activities;
      const entry = list.find((x) => x.id === row.dataset.id);
      if (entry) openSheet(row.dataset.kind, entry);
      return;
    }
    if (e.target.closest('#moreBtn')) { prefs.showAll = !prefs.showAll; savePrefs(); renderLog(); return; }
    if (e.target.closest('#demoBtn')) { state = demoData(); save(); render(); toast('Wczytano dane przykładowe'); }
  });

  $('#addM').addEventListener('click', () => openSheet('m'));
  $('#addA').addEventListener('click', () => openSheet('a'));
  $('#exportBtn').addEventListener('click', exportData);
  $('#importBtn').addEventListener('click', () => $('#importFile').click());
  $('#resetBtn').addEventListener('click', () => {
    if (!confirm('Usunąć wszystkie pomiary i aktywności? Tej operacji nie można cofnąć.')) return;
    state = { measurements: [], activities: [] };
    save();
    render();
    toast('Usunięto wszystkie dane');
  });

  let rz;
  window.addEventListener('resize', () => { cancelAnimationFrame(rz); rz = requestAnimationFrame(renderChart); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) render(); });

  render();

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();
