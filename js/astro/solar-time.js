/* ============================================================
 *  真太阳时引擎 (Local Apparent Time / Solar Time)
 *  - 真太阳时 = UT + 经度修正 + 均时差(Equation of Time)
 *  - 均时差用 Meeus 闭式（精度约 ±2 秒），无需查表
 *
 *  关键澄清（八字排盘常见误区）：
 *    - 节气时刻是「世界时」事件，全球同时发生 → 年柱/月柱用 UT/北京时
 *    - 时辰（子丑寅卯…）按真太阳时切分 → 时柱用真太阳时
 *    - 日柱从「子时」(23:00 真太阳时) 起算（采用「晚子时算次日」流派）
 *
 *  夏令时：附带中国 1986-1991 DST 数据；其他地区需要使用方自行处理
 * ============================================================ */
(function (global) {
  'use strict';

  const { DEG2RAD } = global.SolarLong;

  /**
   * 均时差 (Equation of Time), 单位：分钟
   *   值 > 0 时表示真太阳时比平太阳时「快」
   *   一年中范围约 -14 ~ +16 分钟
   */
  function equationOfTimeMinutes(jdUT) {
    const T = (jdUT - 2451545.0) / 36525.0;
    const L0_deg = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
    const M_deg = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
    const L0 = ((L0_deg % 360) + 360) % 360 * DEG2RAD;
    const M = M_deg * DEG2RAD;
    const e = 0.016708634 - 0.000042037 * T - 0.0000001267 * T * T;
    const epsilon = global.SolarLong.obliquity(jdUT) * DEG2RAD;
    const y = Math.tan(epsilon / 2) ** 2;

    const E_rad = y * Math.sin(2 * L0)
                - 2 * e * Math.sin(M)
                + 4 * e * y * Math.sin(M) * Math.cos(2 * L0)
                - 0.5 * y * y * Math.sin(4 * L0)
                - 1.25 * e * e * Math.sin(2 * M);

    // 1 rad of hour angle = 12*60/π minutes
    return E_rad * (720 / Math.PI);
  }

  /**
   * 把 UT 的 JD 转换为「真太阳时」对应的 JD
   *   - jdToDate(jdLAT) 得到的年月日时分秒就是真太阳时
   * @param {number} jdUT
   * @param {number} longitudeEast - 东经为正，西经为负
   */
  function toLocalApparentJD(jdUT, longitudeEast) {
    const lngFracDays = longitudeEast / 360;             // 360°=24h=1d
    const eotDays = equationOfTimeMinutes(jdUT) / 1440;  // 1440 min/day
    return jdUT + lngFracDays + eotDays;
  }

  /**
   * 中国夏令时表 (1986-1991)
   * 数据来源：国务院公告（已废止），节假日不调整时间
   * 区间内日期需要 -1 小时换回 CST
   */
  const CHINA_DST = [
    { startUTC: [1986, 5, 4, 2], endUTC: [1986, 9, 14, 2] },
    { startUTC: [1987, 4, 12, 2], endUTC: [1987, 9, 13, 2] },
    { startUTC: [1988, 4, 10, 2], endUTC: [1988, 9, 11, 2] },
    { startUTC: [1989, 4, 16, 2], endUTC: [1989, 9, 17, 2] },
    { startUTC: [1990, 4, 15, 2], endUTC: [1990, 9, 16, 2] },
    { startUTC: [1991, 4, 14, 2], endUTC: [1991, 9, 15, 2] },
  ];

  /**
   * 判断某个北京时间是否处于中国历史夏令时区间
   * @param {number} year, month, day, hour - 北京时间
   * @returns {boolean}
   */
  function isInChinaDST(year, month, day, hour) {
    const probe = global.Julian.dateToJD(year, month, day, hour, 0, 0);
    for (const r of CHINA_DST) {
      const s = global.Julian.dateToJD(...r.startUTC, 0, 0);
      const e = global.Julian.dateToJD(...r.endUTC, 0, 0);
      if (probe >= s && probe < e) return true;
    }
    return false;
  }

  /**
   * 一次性把用户输入处理为 JD (UT) + 真太阳时 JD + 诊断信息
   * @param {object} input
   *   year, month, day, hour, minute, second  -- 当地标准时（钟表时间）
   *   tzOffsetHours                          -- 当地时区相对 UT (e.g. 8 for CST)
   *   longitudeEast                          -- 经度
   *   applyChinaDST                          -- 是否检查中国 1986-1991 DST
   */
  function resolveBirthTime(input) {
    let { year, month, day, hour, minute, second, tzOffsetHours, longitudeEast } = input;
    second = second || 0;

    const diag = { dstApplied: false };

    // 中国 DST 修正：钟表上的"夏令时1点"实际是CST的0点
    if (input.applyChinaDST && isInChinaDST(year, month, day, hour)) {
      hour -= 1;
      if (hour < 0) { hour += 24; day -= 1; }
      diag.dstApplied = true;
    }

    const jdUT = global.Julian.localToJD_UT(year, month, day, hour, minute, second, tzOffsetHours);
    const jdLAT = toLocalApparentJD(jdUT, longitudeEast);
    const eotMin = equationOfTimeMinutes(jdUT);

    // 当地标准时与真太阳时的总差值 (分钟)
    const standardMeridian = tzOffsetHours * 15;  // CST=120°
    const lngCorrectMin = (longitudeEast - standardMeridian) * 4;
    const totalDeltaMin = lngCorrectMin + eotMin;

    diag.standardMeridianDeg = standardMeridian;
    diag.lngCorrectMin = lngCorrectMin;
    diag.eotMin = eotMin;
    diag.totalDeltaMin = totalDeltaMin;
    diag.jdUT = jdUT;
    diag.jdLAT = jdLAT;
    diag.localApparentDate = global.Julian.jdToDate(jdLAT);

    return { jdUT, jdLAT, diag };
  }

  global.SolarTime = {
    equationOfTimeMinutes,
    toLocalApparentJD,
    isInChinaDST,
    resolveBirthTime,
    CHINA_DST,
  };
})(window);
