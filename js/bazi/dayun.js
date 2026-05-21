/* ============================================================
 *  大运起运 + 大运排布
 *
 *  方向规则：
 *    - 阳男 / 阴女 → 顺排（月柱后逐一推）
 *    - 阴男 / 阳女 → 逆排（月柱前逐一退）
 *
 *  起运岁数：3 天 = 1 岁
 *    顺排：从出生到下一个"节"的天数 ÷ 3
 *    逆排：从出生到上一个"节"的天数 ÷ 3
 *    (1 天 = 4 个月，1 时辰 = 10 天，这里用浮点年数统一表示)
 * ============================================================ */
(function (global) {
  'use strict';

  const C = global.BZConst;

  function buildDayun(jdUT, yearStem, monthStem, monthBranch, gender) {
    const yearYY  = C.stemYinYang(yearStem);
    const forward = (yearYY === '阳' && gender === 'male') ||
                    (yearYY === '阴' && gender === 'female');

    // 找上下一个"节"
    const ctx = global.SolarTerms.locateGanzhiContext(jdUT);
    // 当前所在节 = ctx.lastJie；下一节需要从节气表里找
    const yearTerms = ctx.allTermsForYear || [];
    // 收集相邻两年所有节
    const date = global.Julian.jdToDate(jdUT);
    const allJies = []
      .concat(global.SolarTerms.getTermsInYear(date.year - 1))
      .concat(global.SolarTerms.getTermsInYear(date.year))
      .concat(global.SolarTerms.getTermsInYear(date.year + 1))
      .filter(t => t.isJie)
      .sort((a, b) => a.jd - b.jd);

    let nextJie = null, prevJie = null;
    for (const t of allJies) {
      if (t.jd > jdUT && !nextJie) nextJie = t;
      if (t.jd <= jdUT) prevJie = t;
    }

    const referenceJD = forward ? nextJie.jd : prevJie.jd;
    const daysDiff = Math.abs(referenceJD - jdUT);
    const startAge = daysDiff / 3;  // 浮点年数
    const startAgeYears  = Math.floor(startAge);
    const startAgeMonths = Math.floor((startAge - startAgeYears) * 12);
    const startAgeDays   = Math.round(((startAge - startAgeYears) * 12 - startAgeMonths) * 30);

    // 起运 JD (UT)
    const startJD = jdUT + startAge * 365.2422;

    // 依次构造 10 步大运
    const list = [];
    const monthStemI = C.stemIdx(monthStem);
    const monthBranchI = C.branchIdx(monthBranch);
    const dir = forward ? 1 : -1;
    for (let i = 1; i <= 10; i++) {
      const si = ((monthStemI + dir * i) % 10 + 10) % 10;
      const bi = ((monthBranchI + dir * i) % 12 + 12) % 12;
      const beginAge = startAge + (i - 1) * 10;
      list.push({
        index: i,
        stem: C.STEMS[si],
        branch: C.BRANCHES[bi],
        startAge: beginAge,
        endAge: beginAge + 10,
        startJD: jdUT + beginAge * 365.2422,
      });
    }

    return {
      forward,
      startAge,                  // 浮点：精确起运岁数
      startAgeYears, startAgeMonths, startAgeDays,
      startJD,
      referenceJieJD: referenceJD,
      list,
    };
  }

  // 找当前年龄所在的大运
  function findCurrentDayun(dayun, ageYears) {
    if (ageYears < dayun.startAge) {
      return { phase: '童限', stem: '—', branch: '—' };
    }
    for (const d of dayun.list) {
      if (ageYears >= d.startAge && ageYears < d.endAge) return d;
    }
    return dayun.list[dayun.list.length - 1];
  }

  // 流年：基于"立春切年"，给定年龄返回当年干支
  function getLiunian(birthJdUT, ageYears) {
    // 出生命理年
    const birthYearJD = global.SolarTerms.locateGanzhiContext(birthJdUT).lastLichunJD;
    const birthYear = global.Julian.jdToDate(birthYearJD).year;
    const targetYear = birthYear + Math.floor(ageYears);
    const i = ((targetYear - global.Pillars.YEAR_ANCHOR) % 60 + 60) % 60;
    return {
      year: targetYear,
      stem: C.STEMS[i % 10],
      branch: C.BRANCHES[i % 12],
    };
  }

  global.DaYun = { buildDayun, findCurrentDayun, getLiunian };
})(window);
