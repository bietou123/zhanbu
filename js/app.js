/* ============================================================
 *  主应用：把表单 → 计算 → 渲染串起来
 *  - 兼顾"首次提交"与"流年滑动"两条路径
 *  - 自带控制台自测：乌鲁木齐 立春边缘案例
 * ============================================================ */
(function (global) {
  'use strict';

  // 状态
  let state = {
    input: null,        // 用户输入
    pillars: null,      // 四柱
    annotated: null,    // 带十神
    dayun: null,        // 大运对象
    centers: null,      // SVG 坐标
    diag: null,         // 诊断
  };

  function $(id) { return document.getElementById(id); }

  function readForm() {
    const f = $('birthForm');
    const fd = new FormData(f);
    const useBeijing = $('birthForm').useBeijingTime.checked;
    return {
      name:   fd.get('name') || '无名',
      year:   +fd.get('year'),
      month:  +fd.get('month'),
      day:    +fd.get('day'),
      hour:   +fd.get('hour'),
      minute: +fd.get('minute'),
      second: +fd.get('second') || 0,
      tzOffsetHours: useBeijing ? 8 : +fd.get('tzOffset'),
      longitudeEast: +fd.get('lng'),
      latitude:      +fd.get('lat'),
      gender: fd.get('gender'),
      southernMode: $('birthForm').southernMode.checked,
      applyChinaDST: true,
    };
  }

  function computeAll(input) {
    const time = global.SolarTime.resolveBirthTime(input);
    const { jdUT, jdLAT, diag } = time;

    // 立春信息
    const ctx = global.SolarTerms.locateGanzhiContext(jdUT);

    let pillars = global.Pillars.buildFourPillars(jdUT, jdLAT);

    // 南半球反月（实验）
    if (input.southernMode && pillars.month) {
      const mi = global.BZConst.branchIdx(pillars.month.branch);
      const flipped = global.BZConst.BRANCHES[(mi + 6) % 12];
      pillars.month.branch = flipped;
      pillars.month._flipped = true;
    }

    const annotated = global.ShiShen.annotateChart(pillars);
    const shensha = global.ShiShen.computeShenSha(pillars);
    const dayun = global.DaYun.buildDayun(jdUT, pillars.year.stem, pillars.month.stem, pillars.month.branch, input.gender);

    return { input, pillars, annotated, shensha, dayun, ctx, diag, jdUT, jdLAT };
  }

  function renderAll(result, ageOverride) {
    const svg = $('chartSvg');
    const defaultAge = Math.max(0, Math.min(120, new Date().getFullYear() - result.input.year));
    const age = ageOverride != null ? ageOverride : defaultAge;

    // 当前大运 / 流年
    const curDayun  = global.DaYun.findCurrentDayun(result.dayun, age);
    const liunian   = global.DaYun.getLiunian(result.jdUT, age);

    // 命盘渲染
    const rendered = global.ChartView.render(svg, result.annotated, curDayun, liunian);
    state.centers = rendered.centers;

    // 关系分析
    const positions = global.Relations.chartToPositions(result.annotated, curDayun, liunian);
    const relations = global.Relations.analyzeRelations(positions);

    // 关系线绘制
    global.GraphView.drawRelations(svg, rendered.centers, relations);

    // 元信息
    renderChartMeta(result, curDayun, liunian, age);
    // 右侧详情
    renderDetail(result, relations, curDayun, liunian, age);
    // 命理分析
    renderFortune(result, curDayun, liunian, age);
    // 时间轴 readout
    $('timelineReadout').textContent = `${age}岁 · ${liunian.year}年 ${liunian.stem}${liunian.branch} · 大运 ${curDayun.stem}${curDayun.branch}`;

    // 同步流年按钮组
    const yb = $('yearButtons');
    global.Timeline.ensureButtons(yb, result.jdUT);
    global.Timeline.setActive(yb, age);
  }

  function renderChartMeta(result, curDayun, liunian, age) {
    const m = result.pillars;
    const localApparent = result.diag.localApparentDate;
    const pad = n => String(n).padStart(2, '0');
    const lat = `${localApparent.year}-${pad(localApparent.month)}-${pad(localApparent.day)} ${pad(localApparent.hour)}:${pad(localApparent.minute)}:${pad(localApparent.second)}`;

    $('chartMeta').innerHTML = `
      <div><b>${result.input.name}</b> · ${result.input.gender === 'male' ? '乾造' : '坤造'}</div>
      <div>八字：<b>${m.year.stem}${m.year.branch} ${m.month.stem}${m.month.branch} ${m.day.stem}${m.day.branch} ${m.hour.stem}${m.hour.branch}</b></div>
      <div>真太阳时：<b>${lat}</b></div>
      <div>大运：<b>${curDayun.stem}${curDayun.branch}</b> (${age}岁) · 流年：<b>${liunian.year} ${liunian.stem}${liunian.branch}</b></div>
    `;

    // 诊断面板
    const d = result.diag;
    const ctx = result.ctx;
    const fmt = jd => global.Julian.formatJD(jd, result.input.tzOffsetHours, true);
    $('diagnostics').textContent = [
      `[输入] 当地标准时 ${result.input.year}-${pad(result.input.month)}-${pad(result.input.day)} ${pad(result.input.hour)}:${pad(result.input.minute)}:${pad(result.input.second)} (tz=${result.input.tzOffsetHours})`,
      `[DST]  应用中国 1986-1991 夏令时：${d.dstApplied ? '是 (-1h)' : '否'}`,
      `[经度] 标准时子午线 ${d.standardMeridianDeg}°，出生地 ${result.input.longitudeEast}°，经度差 ${d.lngCorrectMin.toFixed(2)}min`,
      `[均时差] EoT = ${d.eotMin.toFixed(2)}min`,
      `[总修正] ${d.totalDeltaMin.toFixed(2)}min`,
      `[节气] 上一节: ${ctx.lastJie ? ctx.lastJie.name + ' @ ' + fmt(ctx.lastJie.jd) : '—'}`,
      `[立春] 当前命理年立春: ${fmt(ctx.lastLichunJD)}`,
      `[起运] ${result.dayun.startAgeYears}岁${result.dayun.startAgeMonths}月${result.dayun.startAgeDays}日 (${result.dayun.forward ? '顺行' : '逆行'})`,
    ].join('\n');
  }

  function renderDetail(result, relations, curDayun, liunian, age) {
    const c = global.BZConst;
    const ann = result.annotated;
    const stems = [ann.year.stem, ann.month.stem, ann.day.stem, ann.hour.stem];
    const branches = [ann.year.branch, ann.month.branch, ann.day.branch, ann.hour.branch];
    const elemCount = { '木':0,'火':0,'土':0,'金':0,'水':0 };
    stems.forEach(s => elemCount[c.stemElement(s)]++);
    branches.forEach(b => {
      (c.HIDDEN_STEMS[b] || []).forEach((cgStem, i) => {
        // 本气 1.0, 中气 0.5, 余气 0.3
        const w = [1.0, 0.5, 0.3][i] || 0.3;
        elemCount[c.stemElement(cgStem)] += w;
      });
    });

    const elemBar = Object.entries(elemCount)
      .map(([k, v]) => `<div class="kv"><span>${k}</span><span>${v.toFixed(1)}</span></div>`)
      .join('');

    const shenshaList = result.shensha.length
      ? result.shensha.map(s => `<span class="tag tag-shen">${s.name}·${s.at}(${s.branch})</span>`).join('')
      : '<em style="color:#666">—</em>';

    // 流年/大运关系标签
    const flowRels = relations.filter(r => {
      const members = r.members || [r.a, r.b];
      return members.some(m => m && (m.key === 'dayun' || m.key === 'liunian'));
    });
    const flowTags = flowRels.length
      ? flowRels.map(r => `<span class="tag tag-${kindClass(r)} ${r.suppressed ? 'dim' : ''}">${r.desc}${r.suppressed ? '⊘' : ''}</span>`).join('')
      : '<em style="color:#666">流年与原局无显著关系</em>';

    // 全部关系按类型分类
    const byKind = relations.reduce((m, r) => { (m[r.kind] = m[r.kind] || []).push(r); return m; }, {});
    const allRelHTML = Object.entries(byKind).map(([kind, list]) => {
      const items = list.map(r => `<li class="${r.suppressed ? 'dim' : ''}">${r.desc}${r.note ? ' <em>['+r.note+']</em>' : ''}</li>`).join('');
      return `<div><b>${kindLabel(kind)}</b><ul>${items}</ul></div>`;
    }).join('');

    // 大运一览
    const dyHTML = result.dayun.list.map(d => {
      const cur = age >= d.startAge && age < d.endAge;
      return `<span class="tag ${cur ? 'tag-flow' : ''}">${d.stem}${d.branch} ${Math.floor(d.startAge)}-${Math.floor(d.endAge)}岁</span>`;
    }).join('');

    $('detailContent').innerHTML = `
      <div class="section">
        <h3>五行能量</h3>
        ${elemBar}
      </div>
      <div class="section">
        <h3>大运排布（${result.dayun.forward ? '顺行' : '逆行'}）</h3>
        <div>${dyHTML}</div>
        <div class="kv"><span>起运</span><span>${result.dayun.startAgeYears}岁${result.dayun.startAgeMonths}月${result.dayun.startAgeDays}日</span></div>
      </div>
      <div class="section">
        <h3>流年关系 · ${liunian.year} ${liunian.stem}${liunian.branch}</h3>
        ${flowTags}
      </div>
      <div class="section">
        <h3>神煞</h3>
        ${shenshaList}
      </div>
      <div class="section">
        <h3>原局关系全表</h3>
        ${allRelHTML || '<em style="color:#666">无</em>'}
      </div>
    `;
  }

  function kindClass(r) {
    if (r.kind === 'he')      return 'he';
    if (r.kind === 'chong')   return 'chong';
    if (r.kind === 'xing')    return 'xing';
    if (r.kind === 'hai')     return 'hai';
    return 'sanhe';
  }
  function kindLabel(k) {
    return ({ he:'合', chong:'冲', xing:'刑', hai:'害', sanhe:'三合', 'sanhe-half':'半三合', sanhui:'三会' })[k] || k;
  }

  /* ============================================================
   *  命理分析渲染（Fortune 引擎结果 → 各 tab）
   * ============================================================ */
  function renderFortune(result, curDayun, liunian, age) {
    $('fortuneSection').hidden = false;
    const ann      = result.annotated;
    const strength = global.Fortune.computeStrength(ann);
    const pattern  = global.Fortune.judgePattern(ann);
    const yongShen = global.Fortune.selectYongShen(ann, strength);
    const balance  = global.Fortune.elementBalance(ann);
    const person   = global.Fortune.describePersonality(ann, strength, pattern);
    const career   = global.Fortune.analyzeCareer(ann, strength, yongShen, pattern);
    const marriage = global.Fortune.analyzeMarriage(ann, result.input.gender);
    const wealth   = global.Fortune.analyzeWealth(ann, strength);
    const health   = global.Fortune.analyzeHealth(ann, balance);
    const lnAna    = global.Fortune.analyzeLiunian(ann, curDayun, liunian, yongShen, strength);

    /* ---------- 命局精要 ---------- */
    const maxElem = Math.max(...Object.values(balance.count));
    const elemBars = Object.entries(balance.count).map(([k, v]) => {
      const pct = (v / maxElem) * 100;
      const colorMap = { 木:'#6fcf97', 火:'#eb5757', 土:'#d4b06a', 金:'#d6d6d6', 水:'#56ccf2' };
      return `<div class="stat-bar"><span class="label">${k}</span>
        <div class="bar"><div class="bar-inner" style="width:${pct}%;background:${colorMap[k]}"></div></div>
        <span class="val">${v.toFixed(1)}</span></div>`;
    }).join('');

    $('tabEssence').innerHTML = `
      <div class="fortune-card">
        <h3>日主强弱</h3>
        <p class="lead">日主 <b style="color:${({木:'#6fcf97',火:'#eb5757',土:'#d4b06a',金:'#d6d6d6',水:'#56ccf2'}[strength.dayElement])}">${ann.dayMaster}${strength.dayElement}</b>
        综合分值 <b>${strength.score}</b> · <span class="tier-${strength.level==='balanced'?'neutral':(strength.level.includes('strong')?'good':'bad')}">${strength.label}</span></p>
        <h4>打分明细</h4>
        <ul>${strength.details.map(d => `<li>${d}</li>`).join('')}</ul>
        <div class="source">来源：《滴天髓·体用》《子平真诠·论用神》</div>
      </div>
      <div class="fortune-card">
        <h3>格局判定</h3>
        <p class="lead"><b>${pattern.name}</b></p>
        <p><b>立格依据：</b>${pattern.basis}</p>
        <p><b>取格要旨：</b>${pattern.gist}</p>
        <div class="source">来源：${pattern.source}</div>
      </div>
      <div class="fortune-card">
        <h3>喜用神</h3>
        <p class="lead">取用：${yongShen.primary.map(e => `<span class="badge">${e}</span>`).join(' ')}</p>
        <p><b>取用原则：</b>${yongShen.balanceReason}</p>
        <p><b>调候参考：</b>${yongShen.diaohou.length ? yongShen.diaohou.map(e => `<span class="badge">${e}</span>`).join('') : '—'}
        ${yongShen.diaohouStems.length ? `(具体如 ${yongShen.diaohouStems.join('/')})` : ''}</p>
        <div class="source">来源：${yongShen.source}</div>
      </div>
      <div class="fortune-card">
        <h3>五行能量</h3>
        ${elemBars}
        ${balance.deficiency.length ? `<p>⚠ 偏弱：${balance.deficiency.join('、')}</p>` : ''}
        ${balance.excess.length ?     `<p>⚠ 偏旺：${balance.excess.join('、')}</p>` : ''}
        <div class="source">藏干本气×1.2、中气×0.6、余气×0.3 加权</div>
      </div>
    `;

    /* ---------- 性格 ---------- */
    const ssComp = global.Fortune.analyzeShishenComposition(ann);
    $('tabPersonality').innerHTML = `
      <div class="fortune-card">
        <h3>日主本质</h3>
        <p class="lead"><b style="font-size:20px">${ann.dayMaster}</b> — ${person.core}</p>
        <p><i>"${person.metaphor}"</i></p>
        <p style="font-size:11px;color:var(--muted)">属性：${person.attr.color}·${person.attr.direction}方·${person.attr.season}季</p>
        <h4>性格特质</h4>
        <div>${person.traits.map(t => `<span class="badge">${t}</span>`).join('')}</div>
        <div class="source">来源：${person.sources.join(' · ')}</div>
      </div>
      <div class="fortune-card">
        <h3>优势 / 劣势</h3>
        <h4 style="color:var(--he)">优势</h4>
        <ul>${person.strengths.map(s => `<li>${s}</li>`).join('')}</ul>
        <h4 style="color:var(--chong)">需注意</h4>
        <ul>${person.weaknesses.map(s => `<li>${s}</li>`).join('')}</ul>
        <div class="source">来源：《滴天髓·天干论》《三命通会·论十干所属》</div>
      </div>
      <div class="fortune-card">
        <h3>强弱影响 · 处事风格</h3>
        ${person.modifiers.map(m => `<p>· ${m}</p>`).join('')}
        <h4>处事风格</h4>
        <p>· ${person.workStyle}</p>
        <div class="source">来源：《滴天髓·体用》《子平真诠》</div>
      </div>
      <div class="fortune-card">
        <h3>十神组合·综合性格</h3>
        ${ssComp.lines.length
          ? ssComp.lines.map(l => `<p>· ${l.replace(/\\*\\*(.*?)\\*\\*/g, '<b style="color:var(--accent)">$1</b>')}</p>`).join('')
          : '<p>原局十神分布平均，无特别突出的组合</p>'}
        <div class="source">来源：《子平真诠·论格局》《三命通会·论十神》</div>
      </div>
    `;

    /* ---------- 事业 ---------- */
    const indByElem = career.recommended.reduce((m, r) => { (m[r.elem]=m[r.elem]||[]).push(r.industry); return m; }, {});
    $('tabCareer').innerHTML = `
      <div class="fortune-card">
        <h3>格局与定位</h3>
        ${career.guidance.map(g => `<p>· ${g}</p>`).join('')}
        <h4>事业路线</h4>
        <p>${career.pathSuggestion}</p>
        <div class="source">来源：${career.sources.join(' · ')}</div>
      </div>
      <div class="fortune-card">
        <h3>用神五行 · 适宜行业</h3>
        ${Object.entries(indByElem).map(([e, list]) => `
          <h4>${e}行业（用神）</h4>
          <div>${list.map(i => `<span class="badge">${i}</span>`).join('')}</div>
        `).join('')}
        ${career.trapInds.length ? `
          <h4 style="color:var(--chong)">⚠ 忌神行业（谨慎选择）</h4>
          ${career.trapInds.map(t => `<p style="font-size:12px">· ${t}</p>`).join('')}` : ''}
        <div class="source">来源：《渊海子平·五行喜忌》</div>
      </div>
      <div class="fortune-card">
        <h3>团队 · 晋升</h3>
        <h4>合作模式</h4>
        <p>· ${career.teamStyle}</p>
        <h4>晋升路径</h4>
        <p>· ${career.promotion}</p>
        <div class="source">来源：《子平真诠·论官》《滴天髓·官杀》</div>
      </div>
    `;

    /* ---------- 感情 ---------- */
    $('tabMarriage').innerHTML = `
      <div class="fortune-card">
        <h3>配偶星 · 配偶宫</h3>
        <p class="lead">配偶星：<b>${marriage.spouseStarName}</b>(${marriage.spouseStarElem})</p>
        <p class="lead">配偶宫(日支)：<b>${marriage.spousePalace}</b> · ${marriage.palaceSS}</p>
        <p>命中显见配偶星：<b>${marriage.found}</b> 处</p>
        <h4>感情走向</h4>
        ${marriage.points.map(p => `<p>· ${p}</p>`).join('')}
        <div class="source">来源：${marriage.sources.join(' · ')}</div>
      </div>
      <div class="fortune-card">
        <h3>桃花与异性缘</h3>
        ${marriage.peachPoints.map(p => `<p>· ${p}</p>`).join('')}
        <div class="source">来源：《神峰通考·桃花》《三命通会·神煞》</div>
      </div>
      <div class="fortune-card">
        <h3>伴侣特征 · 相处</h3>
        <h4>伴侣特征</h4>
        ${marriage.spouseTraits.map(t => `<p>· ${t}</p>`).join('')}
        <h4>相处建议</h4>
        ${marriage.advice.map(a => `<p>· ${a}</p>`).join('')}
      </div>
      <div class="fortune-card">
        <h3>婚期/缘期判断</h3>
        ${marriage.marriageWindow.map(m => `<p>· ${m}</p>`).join('')}
        <p style="margin-top:8px;font-size:11px;color:var(--muted)">
          拖动右侧时间轴可观察各年龄段流年与日支的合冲关系，判断具体年份。
        </p>
      </div>
    `;

    /* ---------- 财运 ---------- */
    $('tabWealth').innerHTML = `
      <div class="fortune-card">
        <h3>财星(${wealth.wealthElem})结构</h3>
        ${wealth.points.map(p => `<p>· ${p}</p>`).join('')}
        <div class="kv"><span>正财</span><span>${wealth.zhengCaiCount} 处</span></div>
        <div class="kv"><span>偏财</span><span>${wealth.pianCaiCount} 处</span></div>
        <div class="source">来源：${wealth.sources.join(' · ')}</div>
      </div>
      <div class="fortune-card">
        <h3>财源类型</h3>
        <p class="lead">${wealth.source}</p>
        <h4>食伤生财</h4>
        <p>· ${wealth.generationLine}</p>
        <div class="source">来源：《滴天髓·财》《子平真诠·论财》</div>
      </div>
      <div class="fortune-card">
        <h3>致富方式 · 破财预警</h3>
        <h4>致富方式</h4>
        <p class="lead">${wealth.method}</p>
        <h4>消耗模式（破财预警）</h4>
        ${wealth.leaks.map(l => `<p>· ${l}</p>`).join('')}
        <div class="source">来源：《渊海子平·论财》</div>
      </div>
    `;

    /* ---------- 健康 ---------- */
    $('tabHealth').innerHTML = `
      <div class="fortune-card">
        <h3>五行偏枯 · 脏腑提示</h3>
        ${health.points.map(p => `<p>· ${p}</p>`).join('')}
        <p style="font-size:11px;color:var(--muted);margin-top:8px">
          ⚠ 仅为命理传统的脏腑对应提示，非医学诊断；如有不适请就医。
        </p>
        <div class="source">来源：${health.sources.join(' · ')}</div>
      </div>
      <div class="fortune-card">
        <h3>季节宜忌</h3>
        <p>· ${health.seasonalNote}</p>
        <div class="source">来源：《黄帝内经·四气调神大论》</div>
      </div>
      ${health.remedies.length ? `
      <div class="fortune-card">
        <h3>调养建议</h3>
        ${health.remedies.map(r => `
          <h4>${r.elem}（${r.type}）</h4>
          <p>· <b>饮食：</b>${r.diet}</p>
          <p>· <b>运动：</b>${r.sport}</p>
          <p>· <b>情志：</b>${r.mood}</p>
        `).join('')}
        <div class="source">来源：《黄帝内经》五行养生</div>
      </div>` : ''}
    `;

    /* ---------- 流年 ---------- */
    $('tabLiunian').innerHTML = `
      <div class="fortune-card">
        <h3>${liunian.year} ${liunian.stem}${liunian.branch} · 第 ${age} 岁
          <span class="tier-pill ${lnAna.tier.tone}">${lnAna.tier.label}</span>
        </h3>
        <h4>判定要素</h4>
        ${lnAna.lines.map(l => `<p>· ${l}</p>`).join('')}
        <h4>综合建议</h4>
        ${lnAna.advice.map(a => `<p>· ${a}</p>`).join('')}
        <div class="source">来源：${lnAna.sources.join(' · ')}</div>
      </div>
      <div class="fortune-card">
        <h3>各维度运势</h3>
        <p>· <b>事业：</b>${lnAna.subAspects.career}</p>
        <p>· <b>财运：</b>${lnAna.subAspects.wealth}</p>
        <p>· <b>感情：</b>${lnAna.subAspects.love}</p>
        <p>· <b>健康：</b>${lnAna.subAspects.health}</p>
        <div class="source">基于流年十神 + 喜用神 + 与日支的合冲推断</div>
      </div>
      <div class="fortune-card">
        <h3>12 流月概览</h3>
        <p style="font-size:11px;color:var(--muted)">月支对照日主的吉凶倾向（绿=吉用、红=克身、灰=平）</p>
        ${lnAna.monthlyHints.map(m => `
          <div class="stat-bar">
            <span style="width:48px;color:${({good:'var(--he)',bad:'var(--chong)',neutral:'var(--muted)'})[m.tone]};font-weight:600">${m.month}</span>
            <span style="width:32px">${m.branch}</span>
            <span style="flex:1;color:var(--muted);font-size:11px">${m.shishen}</span>
          </div>
        `).join('')}
      </div>
      <div class="fortune-card">
        <h3>大运 · ${curDayun.stem}${curDayun.branch}</h3>
        <p class="lead">大运十神：${global.ShiShen.getShiShen(ann.dayMaster, curDayun.stem)}</p>
        <p>大运为人生 10 年大背景，流年在大运中起作用</p>
        <p style="font-size:11px;color:var(--muted)">拖动右侧时间轴可观察任一年龄的流年命局变化</p>
      </div>
    `;
  }

  /* ---------- 事件绑定 ---------- */
  document.addEventListener('DOMContentLoaded', () => {
    // 城市预设
    $('cityPreset').addEventListener('change', e => {
      const v = e.target.value;
      if (!v) return;
      const [lng, lat, tz] = v.split(',').map(Number);
      $('birthForm').lng.value = lng;
      $('birthForm').lat.value = lat;
      $('birthForm').tzOffset.value = tz;
    });

    $('birthForm').addEventListener('submit', e => {
      e.preventDefault();
      const input = readForm();
      try {
        const result = computeAll(input);
        state = { input, ...result };
        renderAll(result);
        runSelfTest();
      } catch (err) {
        console.error(err);
        $('diagnostics').textContent = '[错误] ' + err.message + '\n' + err.stack;
      }
    });

    global.Timeline.onChange($('yearButtons'), age => {
      if (!state.dayun) return;
      renderAll(state, age);
    });

    // tab 切换
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b === btn));
        document.querySelectorAll('.fortune-tab-content').forEach(c => {
          c.hidden = c.id !== 'tab' + tab[0].toUpperCase() + tab.slice(1);
        });
      });
    });

    // 首次自动计算 + 跑自测
    $('birthForm').dispatchEvent(new Event('submit'));
  });

  /* ---------- 控制台自测 ---------- */
  function runSelfTest() {
    if (window.__bzTested) return;
    window.__bzTested = true;
    console.group('%c八字排盘自测', 'color:#d4b06a;font-weight:bold');

    // 用例 1：1989-02-04 09:25 (Beijing time) 出生在乌鲁木齐 (87.6168°E)
    // 立春 1989 约 14:27 (Beijing time)，所以是立春前 → 年柱应为戊辰 (1988)
    const c1 = computeAll({
      year: 1989, month: 2, day: 4, hour: 9, minute: 25, second: 0,
      tzOffsetHours: 8, longitudeEast: 87.6168, latitude: 43.8256,
      gender: 'male', applyChinaDST: true, southernMode: false,
    });
    const lichunDate = global.Julian.jdToDate(c1.ctx.lastLichunJD);
    const lichunDateNext = global.Julian.jdToDate(global.SolarTerms.locateGanzhiContext(c1.jdUT + 1).lastLichunJD);
    console.log('用例 1 [立春前·乌鲁木齐]:',
      '年柱期待 戊辰，得到', c1.pillars.year.stem + c1.pillars.year.branch);
    console.log('  上一立春 (UT):', lichunDate, '所属命理年:', c1.pillars.year.ganzhiYear);
    console.log('  完整八字:', c1.pillars.ganzhiString);

    // 用例 2：立春后 5 分钟（同地）→ 应该跳到 己巳年
    const c2 = computeAll({
      year: 1989, month: 2, day: 4, hour: 14, minute: 35, second: 0,
      tzOffsetHours: 8, longitudeEast: 87.6168, latitude: 43.8256,
      gender: 'male', applyChinaDST: true, southernMode: false,
    });
    console.log('用例 2 [立春后·乌鲁木齐]:',
      '年柱期待 己巳，得到', c2.pillars.year.stem + c2.pillars.year.branch);
    console.log('  完整八字:', c2.pillars.ganzhiString);

    // 用例 3：1985-01-29 (甲子年正月初一) — 验证日柱锚点
    // 这一天的日干支可参考多方资料
    const c3 = computeAll({
      year: 1985, month: 1, day: 29, hour: 12, minute: 0, second: 0,
      tzOffsetHours: 8, longitudeEast: 116.4074, latitude: 39.9042,
      gender: 'male', applyChinaDST: false, southernMode: false,
    });
    console.log('用例 3 [1985-01-29 北京]:', c3.pillars.ganzhiString);

    // 用例 4：2000-01-01 (验证日柱: 2000-01-01 应为 乙亥日)
    const c4 = computeAll({
      year: 2000, month: 1, day: 1, hour: 12, minute: 0, second: 0,
      tzOffsetHours: 8, longitudeEast: 116.4074, latitude: 39.9042,
      gender: 'male', applyChinaDST: false, southernMode: false,
    });
    console.log('用例 4 [2000-01-01 北京]:', '日柱期待 乙亥，得到', c4.pillars.day.stem + c4.pillars.day.branch);

    // 节气精度验证：立春 2024 应在公历 2024-02-04 16:27 (北京时间) 左右
    const terms2024 = global.SolarTerms.getTermsInYear(2024);
    const lichun24 = terms2024.find(t => t.name === '立春');
    console.log('节气精度 [2024立春]:', global.Julian.formatJD(lichun24.jd, 8, true), '(期待 ~2024-02-04 16:27)');

    console.groupEnd();
  }

  // 暴露给控制台调试
  global.BaZi = { computeAll, renderAll, state: () => state };
})(window);
