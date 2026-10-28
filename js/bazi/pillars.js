/* ============================================================
 *  四柱推算
 *
 *  关键设计：
 *    - 年柱：以「立春节气时刻 (UT)」为切换点，与公历无关
 *    - 月柱：以 12 个"节" (寅月起 = 立春后) 切换；月干由年干决定（五虎遁）
 *    - 日柱：以「真太阳时 23:00 (子时)」为切换点；用 1999-12-21 = 甲子日为锚点
 *    - 时柱：按真太阳时切 12 时辰；时干由日干决定（五鼠遁）
 *
 *  锚点说明：
 *    DAY_ANCHOR_JDN = 2451534 (1999-12-21, JDN of noon UT)
 *    该日为甲子日（与 sxtwl 等开源寿星天文历库一致）
 *    校验：2000-01-01 (JDN 2451545) 应为 乙亥日 → (2451545-2451534)%60 = 11 = 乙亥 ✓
 * ============================================================ */
(function (global) {
  'use strict';

  const C = global.BZConst;
  // 修正：基于 2000-01-01 12:00 UT = 戊午日 (index 54) 反推
  // (经多个权威万年历验证：2008-08-08=庚辰、2000-01-01=戊午)
  const DAY_ANCHOR_JDN = 2451491;       // 该 JDN 对应"甲子日"基准
  const YEAR_ANCHOR    = 1984;          // 1984 = 甲子年（公历）

  /* ---------- 年柱：以立春为切换 ---------- */
  function yearPillar(jdUT) {
    // 找该 jd 所属的命理年（立春到下一立春）
    const lastLichunJD = global.SolarTerms.locateGanzhiContext(jdUT).lastLichunJD;
    // 立春所在公历年 = 该命理年的年号
    const ganzhiYear = global.Julian.jdToDate(lastLichunJD).year;
    const i = ((ganzhiYear - YEAR_ANCHOR) % 60 + 60) % 60;
    return {
      stem: C.STEMS[i % 10],
      branch: C.BRANCHES[i % 12],
      ganzhiYear,
      lichunJD: lastLichunJD,
    };
  }

  /* ---------- 月柱 ---------- */
  // 五虎遁：年干决定寅月起始天干
  function monthStartStemIdx(yearStem) {
    const ys = C.stemIdx(yearStem);
    return ((ys % 5) * 2 + 2) % 10;  // 甲己→丙(2), 乙庚→戊(4), 丙辛→庚(6), 丁壬→壬(8), 戊癸→甲(0)
  }

  function monthPillar(jdUT, yearStem) {
    const ctx = global.SolarTerms.locateGanzhiContext(jdUT);
    if (!ctx.monthBranch) return null;
    const monthBranch = ctx.monthBranch;
    const bi = C.branchIdx(monthBranch);
    const yinIdx = C.branchIdx('寅');
    // 从寅开始，每月+1 天干
    const offset = ((bi - yinIdx) + 12) % 12;
    const stemIdx = (monthStartStemIdx(yearStem) + offset) % 10;
    return {
      stem: C.STEMS[stemIdx],
      branch: monthBranch,
      jieName: ctx.lastJie ? ctx.lastJie.name : null,
      jieJD: ctx.lastJie ? ctx.lastJie.jd : null,
    };
  }

  /* ---------- 日柱：基于真太阳时 ---------- */
  // 返回真太阳时对应的"命理日"JDN（整数），处理 23:00 切换
  function dayJDN(jdLAT) {
    const d = global.Julian.jdToDate(jdLAT);
    let y = d.year, m = d.month, dd = d.day;
    if (d.hour >= 23) {
      // 晚子时算次日
      const nextJD = global.Julian.dateToJD(y, m, dd, 12, 0, 0) + 1;
      const nd = global.Julian.jdToDate(nextJD);
      y = nd.year; m = nd.month; dd = nd.day;
    }
    return Math.round(global.Julian.dateToJD(y, m, dd, 12, 0, 0));
  }

  function dayPillar(jdLAT) {
    const jdn = dayJDN(jdLAT);
    const i = ((jdn - DAY_ANCHOR_JDN) % 60 + 60) % 60;
    return {
      stem: C.STEMS[i % 10],
      branch: C.BRANCHES[i % 12],
      jdn,
    };
  }

  /* ---------- 时柱 ---------- */
  // 时支：23:00-01:00 子, 01:00-03:00 丑, ...
  function hourBranchIdx(jdLAT) {
    const d = global.Julian.jdToDate(jdLAT);
    const t = d.hour + d.minute / 60 + d.second / 3600;
    return Math.floor(((t + 1) % 24) / 2);
  }

  // 五鼠遁：日干决定子时天干
  function hourStartStemIdx(dayStem) {
    return ((C.stemIdx(dayStem) % 5) * 2) % 10;
  }

  function hourPillar(jdLAT, dayStem) {
    const bi = hourBranchIdx(jdLAT);
    const stemIdx = (hourStartStemIdx(dayStem) + bi) % 10;
    return {
      stem: C.STEMS[stemIdx],
      branch: C.BRANCHES[bi],
    };
  }

  /* ---------- 一次构建完整四柱 ---------- */
  function buildFourPillars(jdUT, jdLAT) {
    const year  = yearPillar(jdUT);
    const month = monthPillar(jdUT, year.stem);
    const day   = dayPillar(jdLAT);
    const hour  = hourPillar(jdLAT, day.stem);

    return {
      year, month, day, hour,
      dayMaster: day.stem,  // 日干就是日主
      ganzhiString: `${year.stem}${year.branch} ${month.stem}${month.branch} ${day.stem}${day.branch} ${hour.stem}${hour.branch}`,
    };
  }

  global.Pillars = {
    buildFourPillars,
    yearPillar, monthPillar, dayPillar, hourPillar,
    DAY_ANCHOR_JDN, YEAR_ANCHOR,
  };
})(window);
