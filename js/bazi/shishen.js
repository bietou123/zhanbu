/* ============================================================
 *  十神 (Ten Gods)
 *  - 以"日主"(日干) 为基准，比较其他天干/藏干的五行 + 阴阳
 *
 *    我之比者 → 比肩(同性) / 劫财(异性)
 *    我所生者 → 食神(同性) / 伤官(异性)
 *    我所克者 → 偏财(同性) / 正财(异性)
 *    克我者   → 七杀(同性) / 正官(异性)
 *    生我者   → 偏印(同性) / 正印(异性)
 * ============================================================ */
(function (global) {
  'use strict';

  const C = global.BZConst;

  function getShiShen(dayStem, otherStem) {
    if (!dayStem || !otherStem) return '';
    const dayElem  = C.stemElement(dayStem);
    const othElem  = C.stemElement(otherStem);
    const sameYY   = C.stemYinYang(dayStem) === C.stemYinYang(otherStem);

    if (dayElem === othElem) return sameYY ? '比肩' : '劫财';
    if (C.SHENG[dayElem] === othElem) return sameYY ? '食神' : '伤官';
    if (C.KE[dayElem]    === othElem) return sameYY ? '偏财' : '正财';
    if (C.KE[othElem]    === dayElem) return sameYY ? '七杀' : '正官';
    if (C.SHENG[othElem] === dayElem) return sameYY ? '偏印' : '正印';
    return '?';
  }

  // 简称（便于UI）
  const SHORT = {
    '比肩':'比','劫财':'劫','食神':'食','伤官':'伤',
    '偏财':'才','正财':'财','七杀':'杀','正官':'官',
    '偏印':'枭','正印':'印',
  };

  function annotateChart(pillars) {
    const ds = pillars.dayMaster;
    const annotate = (stem) => ({ name: getShiShen(ds, stem), short: SHORT[getShiShen(ds, stem)] || '' });

    return {
      year:  { ...pillars.year,  shishen: annotate(pillars.year.stem),
               cangganShishen: C.HIDDEN_STEMS[pillars.year.branch].map(annotate) },
      month: { ...pillars.month, shishen: annotate(pillars.month.stem),
               cangganShishen: C.HIDDEN_STEMS[pillars.month.branch].map(annotate) },
      day:   { ...pillars.day,   shishen: { name: '日主', short: '主' },
               cangganShishen: C.HIDDEN_STEMS[pillars.day.branch].map(annotate) },
      hour:  { ...pillars.hour,  shishen: annotate(pillars.hour.stem),
               cangganShishen: C.HIDDEN_STEMS[pillars.hour.branch].map(annotate) },
      dayMaster: ds,
    };
  }

  /* ---------- 神煞 (基础) ---------- */
  function computeShenSha(pillars) {
    const result = [];
    const ds = pillars.day.stem;
    const branches = [pillars.year.branch, pillars.month.branch, pillars.day.branch, pillars.hour.branch];
    const labels = ['年支','月支','日支','时支'];

    // 天乙贵人
    const tianyi = C.TIAN_YI[ds] || [];
    branches.forEach((b, i) => {
      if (tianyi.includes(b)) result.push({ name: '天乙贵人', at: labels[i], branch: b });
    });
    // 桃花、驿马、华盖：从年支/日支起
    const sources = [{ from: pillars.year.branch, label: '年' },
                     { from: pillars.day.branch,  label: '日' }];
    sources.forEach(src => {
      const tao = C.TAO_HUA[src.from];
      const yi  = C.YI_MA[src.from];
      const hua = C.HUA_GAI[src.from];
      branches.forEach((b, i) => {
        if (b === tao) result.push({ name: `桃花(${src.label})`, at: labels[i], branch: b });
        if (b === yi)  result.push({ name: `驿马(${src.label})`, at: labels[i], branch: b });
        if (b === hua) result.push({ name: `华盖(${src.label})`, at: labels[i], branch: b });
      });
    });
    // 文昌：日干 → 地支
    const wc = C.WEN_CHANG[ds];
    branches.forEach((b, i) => {
      if (b === wc) result.push({ name: '文昌', at: labels[i], branch: b });
    });
    return result;
  }

  global.ShiShen = {
    getShiShen, SHORT, annotateChart, computeShenSha,
  };
})(window);
