// 节点环境自测：加载所有非 UI 文件，验证天文/排盘精度
// 用法：node test-node.js
const fs = require('fs');
const path = require('path');

const window = {};
const files = [
  'js/astro/julian.js',
  'js/astro/solar-longitude.js',
  'js/astro/solar-terms.js',
  'js/astro/solar-time.js',
  'js/bazi/constants.js',
  'js/bazi/pillars.js',
  'js/bazi/shishen.js',
  'js/bazi/dayun.js',
  'js/bazi/relations.js',
];
for (const f of files) {
  const src = fs.readFileSync(path.join(__dirname, f), 'utf8');
  new Function('window', src)(window);
}

const W = window;

function header(t) { console.log('\n=== ' + t + ' ==='); }
function row(...x) { console.log('  ' + x.join('  ')); }

/* -------- 节气精度 -------- */
header('节气精度（与权威数据对比）');
const expected2024 = {
  '小寒': '2024-01-06 04:49',
  '立春': '2024-02-04 16:27',
  '春分': '2024-03-20 11:06',
  '夏至': '2024-06-21 04:51',
  '秋分': '2024-09-22 20:43',
  '冬至': '2024-12-21 17:21',
};
const terms = W.SolarTerms.getTermsInYear(2024);
for (const t of terms) {
  if (expected2024[t.name]) {
    const got = W.Julian.formatJD(t.jd, 8, false);
    const diff = got === expected2024[t.name] ? 'OK' : `期待 ${expected2024[t.name]}`;
    row(t.name, '计算:', got, '✓', diff);
  }
}

/* -------- 均时差 -------- */
header('均时差精度');
// 2024-02-11 EoT 约 -14.2 min；2024-11-03 约 +16.4 min
const jdFeb = W.Julian.dateToJD(2024, 2, 11, 0, 0, 0);
const jdNov = W.Julian.dateToJD(2024, 11, 3, 0, 0, 0);
row('2024-02-11 EoT:', W.SolarTime.equationOfTimeMinutes(jdFeb).toFixed(2), 'min', '(期待 ≈ -14.2)');
row('2024-11-03 EoT:', W.SolarTime.equationOfTimeMinutes(jdNov).toFixed(2), 'min', '(期待 ≈ +16.4)');

/* -------- 立春边缘 · 乌鲁木齐 -------- */
header('用例 1 · 1989-02-04 03:00 BJT @乌鲁木齐 (立春前 1.5h)');
// 1989 立春 = 1989-02-04 04:27:36 BJT (紫金山天文台)
const c1 = W.SolarTime.resolveBirthTime({
  year: 1989, month: 2, day: 4, hour: 3, minute: 0, second: 0,
  tzOffsetHours: 8, longitudeEast: 87.6168, applyChinaDST: true,
});
const ctx1 = W.SolarTerms.locateGanzhiContext(c1.jdUT);
row('立春 1989 (北京时):', W.Julian.formatJD(ctx1.lastLichunJD, 8, true));
const p1 = W.Pillars.buildFourPillars(c1.jdUT, c1.jdLAT);
const realSolar = W.Julian.jdToDate(c1.jdLAT);
row('真太阳时:', `${realSolar.year}-${String(realSolar.month).padStart(2,'0')}-${String(realSolar.day).padStart(2,'0')} ${String(realSolar.hour).padStart(2,'0')}:${String(realSolar.minute).padStart(2,'0')}:${String(realSolar.second).padStart(2,'0')}`);
row('八字:', p1.ganzhiString);
row('期待 年柱: 戊辰（立春前仍属 1988 命理年）');

/* -------- 立春边缘 · 立春后 -------- */
header('用例 2 · 1989-02-04 09:25 BJT @乌鲁木齐 (立春后)');
const c2 = W.SolarTime.resolveBirthTime({
  year: 1989, month: 2, day: 4, hour: 9, minute: 25, second: 0,
  tzOffsetHours: 8, longitudeEast: 87.6168, applyChinaDST: true,
});
const p2 = W.Pillars.buildFourPillars(c2.jdUT, c2.jdLAT);
row('八字:', p2.ganzhiString);
row('期待 年柱: 己巳（立春已过）');

/* -------- 立春 2 分钟之内的边缘案例 -------- */
header('用例 3 · 立春前 2 分钟 vs 立春后 2 分钟');
const cBefore = W.SolarTime.resolveBirthTime({
  year: 1989, month: 2, day: 4, hour: 4, minute: 25, second: 0,
  tzOffsetHours: 8, longitudeEast: 87.6168, applyChinaDST: true,
});
const cAfter = W.SolarTime.resolveBirthTime({
  year: 1989, month: 2, day: 4, hour: 4, minute: 30, second: 0,
  tzOffsetHours: 8, longitudeEast: 87.6168, applyChinaDST: true,
});
row('立春前 (04:25 BJT):', W.Pillars.buildFourPillars(cBefore.jdUT, cBefore.jdLAT).ganzhiString, '— 年柱期待 戊辰');
row('立春后 (04:30 BJT):', W.Pillars.buildFourPillars(cAfter.jdUT, cAfter.jdLAT).ganzhiString, '— 年柱期待 己巳');

/* -------- 日柱锚点（权威万年历回归测试） -------- */
header('日柱回归测试（外部万年历权威值对照）');
const dayCases = [
  // [year, month, day, expectedGanzhi, source]
  [2008, 8, 8,   '庚辰', '水墨先生（奥运开幕日）'],
  [1949, 10, 1,  '甲子', '历史档案（开国大典）'],
  [2000, 1, 1,   '戊午', '水墨先生'],
  [1976, 9, 9,   '甲子', '水墨先生（毛泽东逝世）'],
];
for (const [y, m, d, expected, src] of dayCases) {
  const t = W.SolarTime.resolveBirthTime({
    year: y, month: m, day: d, hour: 12, minute: 0, second: 0,
    tzOffsetHours: 8, longitudeEast: 120.0, applyChinaDST: false,
  });
  const p = W.Pillars.buildFourPillars(t.jdUT, t.jdLAT);
  const got = p.day.stem + p.day.branch;
  row(`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`.padEnd(12),
      '我:', got, '权威:', expected, got === expected ? '✓' : '✗ 不一致！', `(${src})`);
}

/* -------- DST 测试 -------- */
header('夏令时验证');
row('1989-06-01 11:00 BJT 是否在 DST 内:', W.SolarTime.isInChinaDST(1989, 6, 1, 11));
row('1989-02-04 09:25 BJT 是否在 DST 内:', W.SolarTime.isInChinaDST(1989, 2, 4, 9));

/* -------- 大运 -------- */
header('大运（用例 1：戊辰年男命）');
const dy1 = W.DaYun.buildDayun(c1.jdUT, p1.year.stem, p1.month.stem, p1.month.branch, 'male');
row('方向:', dy1.forward ? '顺行' : '逆行');
row('起运:', `${dy1.startAgeYears}岁${dy1.startAgeMonths}月${dy1.startAgeDays}日`);
row('前 5 步:', dy1.list.slice(0, 5).map(d => `${d.stem}${d.branch}(${Math.floor(d.startAge)}岁起)`).join(' '));

/* -------- 关系引擎 -------- */
header('关系引擎自测');
const annotated = W.ShiShen.annotateChart(p1);
const ln = W.DaYun.getLiunian(c1.jdUT, 35);
const cdy = W.DaYun.findCurrentDayun(dy1, 35);
row('当前流年:', `${ln.year} ${ln.stem}${ln.branch}`);
row('当前大运:', `${cdy.stem}${cdy.branch}`);
const positions = W.Relations.chartToPositions(annotated, cdy, ln);
const rels = W.Relations.analyzeRelations(positions);
console.log('  全部关系:');
rels.forEach(r => console.log('   ', r.suppressed ? '⊘' : '✓', r.subtype, '·', r.desc, r.note ? `[${r.note}]` : ''));

console.log('\n完成。');
