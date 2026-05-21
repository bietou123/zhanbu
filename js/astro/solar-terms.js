/* ============================================================
 *  二十四节气精确时刻计算
 *  - 节气定义：太阳视黄经达到特定值 (315°=立春, 0°=春分, 等)
 *  - 用牛顿/直接迭代法求解 λ(JD) = target，2-4 步即可收敛到 < 1 秒
 *  - 关键点：日λ变化率约为 360/365.2422 ≈ 0.9856°/天
 *  - 区分"节"(月柱切换) 和"气"(无月柱意义)
 *
 *  排盘的两个关键节气切换：
 *    - 年柱切换：立春 (315°)
 *    - 月柱切换：12 个"节"(每隔 30°，从 315° 起)
 * ============================================================ */
(function (global) {
  'use strict';

  // 24 节气按公历年份内时间顺序（不是黄经顺序！）
  // 公历年初 = 小寒(285°) -> 大寒(300°) -> 立春(315°) -> ... -> 冬至(270°)
  // 黄经顺序：285 300 315 330 345 0 15 30 45 60 75 90 105 120 135 150 165 180 195 210 225 240 255 270
  const SOLAR_TERMS = [
    { name: '小寒', long: 285, isJie: true,  approxDay: 6   }, // 1月
    { name: '大寒', long: 300, isJie: false, approxDay: 20  },
    { name: '立春', long: 315, isJie: true,  approxDay: 35  }, // 2月
    { name: '雨水', long: 330, isJie: false, approxDay: 50  },
    { name: '惊蛰', long: 345, isJie: true,  approxDay: 65  }, // 3月
    { name: '春分', long: 0,   isJie: false, approxDay: 80  },
    { name: '清明', long: 15,  isJie: true,  approxDay: 95  }, // 4月
    { name: '谷雨', long: 30,  isJie: false, approxDay: 110 },
    { name: '立夏', long: 45,  isJie: true,  approxDay: 125 }, // 5月
    { name: '小满', long: 60,  isJie: false, approxDay: 141 },
    { name: '芒种', long: 75,  isJie: true,  approxDay: 156 }, // 6月
    { name: '夏至', long: 90,  isJie: false, approxDay: 172 },
    { name: '小暑', long: 105, isJie: true,  approxDay: 188 }, // 7月
    { name: '大暑', long: 120, isJie: false, approxDay: 204 },
    { name: '立秋', long: 135, isJie: true,  approxDay: 220 }, // 8月
    { name: '处暑', long: 150, isJie: false, approxDay: 236 },
    { name: '白露', long: 165, isJie: true,  approxDay: 251 }, // 9月
    { name: '秋分', long: 180, isJie: false, approxDay: 267 },
    { name: '寒露', long: 195, isJie: true,  approxDay: 282 }, // 10月
    { name: '霜降', long: 210, isJie: false, approxDay: 297 },
    { name: '立冬', long: 225, isJie: true,  approxDay: 312 }, // 11月
    { name: '小雪', long: 240, isJie: false, approxDay: 327 },
    { name: '大雪', long: 255, isJie: true,  approxDay: 342 }, // 12月
    { name: '冬至', long: 270, isJie: false, approxDay: 356 },
  ];

  // 12 节对应的月支（寅月 = 立春后；丑月 = 小寒后；子月 = 大雪后）
  const JIE_TO_MONTH_BRANCH = {
    '小寒': '丑',
    '立春': '寅',
    '惊蛰': '卯',
    '清明': '辰',
    '立夏': '巳',
    '芒种': '午',
    '小暑': '未',
    '立秋': '申',
    '白露': '酉',
    '寒露': '戌',
    '立冬': '亥',
    '大雪': '子',
  };

  // 把一个度数差缩到 [-180, 180]，处理跨年时 0°/360° 的奇异
  function angleDiff(target, current) {
    let d = target - current;
    while (d > 180)  d -= 360;
    while (d < -180) d += 360;
    return d;
  }

  /**
   * 通过迭代求解：太阳视黄经达到 targetLongitude 时的 JD (UT)
   * @param {number} targetLongitude - 目标黄经 (度)
   * @param {number} initialJD - 初始估计 JD
   * @param {number} tol - 容差 (度)，1e-6 度 ≈ 0.024 秒
   * @returns {number} 收敛后的 JD
   */
  function solveSolarTermJD(targetLongitude, initialJD, tol) {
    tol = tol || 1e-7;
    let jd = initialJD;
    for (let iter = 0; iter < 12; iter++) {
      const curr = global.SolarLong.apparentLongitude(jd);
      const diff = angleDiff(targetLongitude, curr);
      if (Math.abs(diff) < tol) return jd;
      // 太阳运动速度约 0.9856°/天；用更精确的值 365.2422/360
      jd += diff * (365.2422 / 360);
    }
    return jd; // 12 步还没收敛，返回最近一次（理论上不会发生）
  }

  /**
   * 给定公历年份，返回该年所有 24 节气的精确 JD (UT) 列表
   * @param {number} year - 公历年
   * @returns {Array<{name, long, isJie, jd}>}
   */
  function getTermsInYear(year) {
    const yearStartJD = global.Julian.dateToJD(year, 1, 1, 0, 0, 0);
    return SOLAR_TERMS.map(t => {
      const initJD = yearStartJD + t.approxDay;
      const jd = solveSolarTermJD(t.long, initJD);
      return { name: t.name, long: t.long, isJie: t.isJie, jd };
    });
  }

  /**
   * 给定一个 JD (UT)，返回当时所在的"月柱节气"
   *   - 即不晚于该时刻的最近一个"节"
   *   - 注意年份要回溯，因为可能落在跨年节(小寒/立春)前后
   * @param {number} jdUT
   * @returns {{name, jd, monthBranch, ganzhiYearJD}}
   *   ganzhiYearJD: 当前命理"年"对应的立春 JD
   */
  function locateGanzhiContext(jdUT) {
    // 先猜测公历年
    const date = global.Julian.jdToDate(jdUT);
    let year = date.year;

    // 拿当年节气 + 上一年 12 月（小寒/大寒/冬至）以处理年初情况
    let terms = getTermsInYear(year);
    let prevTerms = getTermsInYear(year - 1);
    let nextTerms = getTermsInYear(year + 1);

    // 合并相邻 3 年节气，按 jd 排序
    const merged = [...prevTerms, ...terms, ...nextTerms].sort((a, b) => a.jd - b.jd);

    // 找最近且不晚于 jdUT 的"节"
    let lastJie = null;
    for (const t of merged) {
      if (t.jd <= jdUT && t.isJie) lastJie = t;
      if (t.jd > jdUT) break;
    }

    // 找当前命理年所对应的"立春" - 即不晚于 jdUT 的最近立春
    let lastLichun = null;
    for (const t of merged) {
      if (t.name === '立春' && t.jd <= jdUT) lastLichun = t;
      if (t.jd > jdUT && lastLichun) break;
    }
    // 下一个立春（用于流年判定）
    let nextLichun = null;
    for (const t of merged) {
      if (t.name === '立春' && t.jd > jdUT) { nextLichun = t; break; }
    }

    return {
      lastJie,
      monthBranch: lastJie ? JIE_TO_MONTH_BRANCH[lastJie.name] : null,
      lastLichunJD: lastLichun ? lastLichun.jd : null,
      nextLichunJD: nextLichun ? nextLichun.jd : null,
      allTermsForYear: terms,
    };
  }

  /**
   * 找指定 JD 所在"命理年"对应的公历年份
   *   - 命理年从立春到下一个立春
   *   - 例：1989-02-04 14:00 立春，那么 1989-02-04 13:00 仍属于 1988 命理年
   */
  function getGanzhiYear(jdUT) {
    const ctx = locateGanzhiContext(jdUT);
    const date = global.Julian.jdToDate(ctx.lastLichunJD);
    return date.year;
  }

  global.SolarTerms = {
    SOLAR_TERMS,
    JIE_TO_MONTH_BRANCH,
    getTermsInYear,
    solveSolarTermJD,
    locateGanzhiContext,
    getGanzhiYear,
  };
})(window);
