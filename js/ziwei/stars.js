/* ============================================================
 *  紫微斗数安星算法
 *  来源：《紫微斗数全书》《安星诀》
 * ============================================================ */
(function (global) {
  'use strict';

  const ZW = global.ZWConst;
  if (!ZW) throw new Error('ZWConst not loaded');

  // ===== 紫微星安法 =====
  // 以出生日和五行局定紫微星位置
  // 公式：紫微星位置 = (生日 + 局数 - 1) / 局数 的余数对应地支
  function locateZiwei(day, ju) {
    // 紫微星起寅宫，顺数
    // 算法：从寅宫起，每局数为一宫
    let pos = Math.floor((day + ju - 1) / ju);
    pos = pos % 12;
    const branches = ZW.BRANCH_ORDER;
    // 从寅开始（寅是索引2）
    const resultIdx = (2 + pos) % 12;
    return branches[resultIdx];
  }

  // ===== 天府星安法 =====
  // 天府与紫微相对，以寅申为轴
  function locateTianfu(ziweiBranch) {
    const ziIdx = ZW.BRANCH_ORDER.indexOf(ziweiBranch);
    // 天府在寅申轴对称位置
    // 寅(2)与申(8)为轴，紫微在x，天府在对称位置
    // 简化：天府 = (14 - ziIdx) % 12
    const tfIdx = (14 - ziIdx) % 12;
    return ZW.BRANCH_ORDER[tfIdx];
  }

  // ===== 主星安法 =====
  // 根据紫微位置，安十四主星
  function placeMajorStars(ziweiBranch, tianfuBranch) {
    const ziIdx = ZW.BRANCH_ORDER.indexOf(ziweiBranch);
    const tfIdx = ZW.BRANCH_ORDER.indexOf(tianfuBranch);

    const stars = {};

    // 紫微系（以紫微为起点，顺时针）
    const ziweiSeries = [
      { name: '紫微', offset: 0 },
      { name: '天机', offset: 1 },
      { name: '太阳', offset: 3 },
      { name: '武曲', offset: 4 },
      { name: '天同', offset: 5 },
      { name: '廉贞', offset: 8 },
    ];

    ziweiSeries.forEach(s => {
      const idx = (ziIdx + s.offset) % 12;
      const branch = ZW.BRANCH_ORDER[idx];
      if (!stars[branch]) stars[branch] = [];
      stars[branch].push(s.name);
    });

    // 天府系（以天府为起点，顺时针）
    const tianfuSeries = [
      { name: '天府', offset: 0 },
      { name: '太阴', offset: 1 },
      { name: '贪狼', offset: 2 },
      { name: '巨门', offset: 3 },
      { name: '天相', offset: 4 },
      { name: '天梁', offset: 5 },
      { name: '七杀', offset: 6 },
      { name: '破军', offset: 10 },
    ];

    tianfuSeries.forEach(s => {
      const idx = (tfIdx + s.offset) % 12;
      const branch = ZW.BRANCH_ORDER[idx];
      if (!stars[branch]) stars[branch] = [];
      stars[branch].push(s.name);
    });

    return stars;
  }

  // ===== 安六吉星 =====
  function placeLuckyStars(yearBranch, hourBranch) {
    const stars = {};
    const branches = ZW.BRANCH_ORDER;

    // 左辅右弼：以出生月为基准
    // 左辅起辰宫顺行至月，右弼起戌宫逆行至月
    // 简化：左辅在命宫三方，右弼在对宫
    const zuofuPos = (2 + 3) % 12; // 辰宫
    const youbiPos = (10 + 3) % 12; // 戌宫
    if (!stars[branches[zuofuPos]]) stars[branches[zuofuPos]] = [];
    stars[branches[zuofuPos]].push('左辅');
    if (!stars[branches[yobiPos]]) stars[branches[yobiPos]] = [];
    stars[branches[yobiPos]].push('右弼');

    // 文昌文曲：以出生时辰为基准
    // 文昌起巳宫逆行至时，文曲起丑宫顺行至时
    const hourIdx = branches.indexOf(hourBranch);
    const wenchangIdx = (5 - hourIdx + 12) % 12; // 巳宫起逆行
    const wenquIdx = (1 + hourIdx) % 12; // 丑宫起顺行
    if (!stars[branches[wenchangIdx]]) stars[branches[wenchangIdx]] = [];
    stars[branches[wenchangIdx]].push('文昌');
    if (!stars[branches[wenquIdx]]) stars[branches[wenquIdx]] = [];
    stars[branches[wenquIdx]].push('文曲');

    // 天魁天钺：以出生年干为基准
    // 甲戊庚：丑未 乙己：子申 丙丁：亥酉 壬癸：卯巳 辛：午寅
    // 这里用年支简化
    const kuiyueByYear = {
      '子': { kui: '丑', yue: '未' },
      '丑': { kui: '子', yue: '申' },
      '寅': { kui: '丑', yue: '未' },
      '卯': { kui: '亥', yue: '酉' },
      '辰': { kui: '亥', yue: '酉' },
      '巳': { kui: '卯', yue: '巳' },
      '午': { kui: '卯', yue: '巳' },
      '未': { kui: '午', yue: '寅' },
      '申': { kui: '午', yue: '寅' },
      '酉': { kui: '丑', yue: '未' },
      '戌': { kui: '丑', yue: '未' },
      '亥': { kui: '子', yue: '申' },
    };
    const ky = kuiyueByYear[yearBranch] || { kui: '丑', yue: '未' };
    if (!stars[ky.kui]) stars[ky.kui] = [];
    stars[ky.kui].push('天魁');
    if (!stars[ky.yue]) stars[ky.yue] = [];
    stars[ky.yue].push('天钺');

    return stars;
  }

  // ===== 安六煞星 =====
  function placeBadStars(yearBranch, hourBranch) {
    const stars = {};
    const branches = ZW.BRANCH_ORDER;
    const yearIdx = branches.indexOf(yearBranch);
    const hourIdx = branches.indexOf(hourBranch);

    // 擎羊陀罗：以出生年为基准
    // 子年擎羊在丑、陀罗在寅；顺行
    const qingyangIdx = (yearIdx + 1) % 12;
    const tuoluoIdx = (yearIdx + 2) % 12;
    if (!stars[branches[qingyangIdx]]) stars[branches[qingyangIdx]] = [];
    stars[branches[qingyangIdx]].push('擎羊');
    if (!stars[branches[tuoluoIdx]]) stars[branches[tuoluoIdx]] = [];
    stars[branches[tuoluoIdx]].push('陀罗');

    // 火星铃星：以出生年和时辰为基准
    // 简化：火星在命宫前二位，铃星在命宫后二位
    const huoxingIdx = (hourIdx + 2) % 12;
    const lingxingIdx = (hourIdx - 2 + 12) % 12;
    if (!stars[branches[huoxingIdx]]) stars[branches[huoxingIdx]] = [];
    stars[branches[huoxingIdx]].push('火星');
    if (!stars[branches[lingxingIdx]]) stars[branches[lingxingIdx]] = [];
    stars[branches[lingxingIdx]].push('铃星');

    // 地空地劫：以出生时辰为基准
    // 地空起亥宫逆行至时，地劫起亥宫顺行至时
    const dikongIdx = (11 - hourIdx + 12) % 12; // 亥宫起逆行
    const dijieIdx = (11 + hourIdx) % 12; // 亥宫起顺行
    if (!stars[branches[dikongIdx]]) stars[branches[dikongIdx]] = [];
    stars[branches[dikongIdx]].push('地空');
    if (!stars[branches[dijieIdx]]) stars[branches[dijieIdx]] = [];
    stars[branches[dijieIdx]].push('地劫');

    return stars;
  }

  // ===== 安四化 =====
  function computeSihua(yearStem, majorStarsByBranch) {
    const sihuaMap = ZW.SIHUA_BY_STEM[yearStem];
    if (!sihuaMap) return {};

    const result = {};
    Object.entries(majorStarsByBranch).forEach(([branch, stars]) => {
      stars.forEach(star => {
        if (sihuaMap.lu === star) {
          if (!result[branch]) result[branch] = [];
          result[branch].push({ star, hua: '禄' });
        }
        if (sihuaMap.quan === star) {
          if (!result[branch]) result[branch] = [];
          result[branch].push({ star, hua: '权' });
        }
        if (sihuaMap.ke === star) {
          if (!result[branch]) result[branch] = [];
          result[branch].push({ star, hua: '科' });
        }
        if (sihuaMap.ji === star) {
          if (!result[branch]) result[branch] = [];
          result[branch].push({ star, hua: '忌' });
        }
      });
    });

    return result;
  }

  // ===== 安杂曜 =====
  function placeMinorStars(yearBranch, monthBranch, hourBranch) {
    const stars = {};
    const branches = ZW.BRANCH_ORDER;

    // 天马：以出生年为基准，在申子辰年为寅，寅午戌年为申，巳酉丑年为亥，亥卯未年为巳
    const tianmaByYear = {
      '子': '寅', '申': '寅', '辰': '寅',
      '寅': '申', '午': '申', '戌': '申',
      '巳': '亥', '酉': '亥', '丑': '亥',
      '亥': '巳', '卯': '巳', '未': '巳',
    };
    const tianma = tianmaByYear[yearBranch] || '寅';
    if (!stars[tianma]) stars[tianma] = [];
    stars[tianma].push('天马');

    // 红鸾天喜：以出生年为基准
    // 红鸾起卯宫逆行至年支，天喜在对宫
    const yearIdx = branches.indexOf(yearBranch);
    const hongluanIdx = (4 - yearIdx + 12) % 12; // 卯宫起逆行
    const tianxiIdx = (hongluanIdx + 6) % 12;
    if (!stars[branches[hongluanIdx]]) stars[branches[hongluanIdx]] = [];
    stars[branches[hongluanIdx]].push('红鸾');
    if (!stars[branches[tianxiIdx]]) stars[branches[tianxiIdx]] = [];
    stars[branches[tianxiIdx]].push('天喜');

    // 天哭天虚：以出生年为基准
    const tikuxuIdx = (yearIdx + 8) % 12;
    const tianxuIdx = (yearIdx + 4) % 12;
    if (!stars[branches[tikuxuIdx]]) stars[branches[tikuxuIdx]] = [];
    stars[branches[tikuxuIdx]].push('天哭');
    if (!stars[branches[tianxuIdx]]) stars[branches[tianxuIdx]] = [];
    stars[branches[tianxuIdx]].push('天虚');

    // 孤辰寡宿
    const guchenIdx = (yearIdx + 1) % 12;
    const guasuIdx = (yearIdx + 9) % 12;
    if (!stars[branches[guchenIdx]]) stars[branches[guchenIdx]] = [];
    stars[branches[guchenIdx]].push('孤辰');
    if (!stars[branches[guasuIdx]]) stars[branches[guasuIdx]] = [];
    stars[branches[guasuIdx]].push('寡宿');

    return stars;
  }

  // ===== 合并所有星曜 =====
  function mergeStars(...allStars) {
    const result = {};
    allStars.forEach(ss => {
      Object.entries(ss).forEach(([branch, stars]) => {
        if (!result[branch]) result[branch] = [];
        result[branch].push(...stars);
      });
    });
    return result;
  }

  // ===== 构建完整命盘 =====
  function buildChart(input) {
    const { year, month, day, hour, yearStem, yearBranch, monthBranch, hourBranch, gender } = input;

    // 计算五行局
    const { element, ju } = ZW.getJu(hourBranch);

    // 安命宫
    const mingBranch = ZW.locateMingPalace(monthBranch, hourBranch);
    const shenBranch = ZW.locateShenPalace(monthBranch, hourBranch);

    // 安紫微天府
    const ziweiBranch = locateZiwei(day, ju);
    const tianfuBranch = locateTianfu(ziweiBranch);

    // 安主星
    const majorStars = placeMajorStars(ziweiBranch, tianfuBranch);

    // 安六吉星
    const luckyStars = placeLuckyStars(yearBranch, hourBranch);

    // 安六煞星
    const badStars = placeBadStars(yearBranch, hourBranch);

    // 安杂曜
    const minorStars = placeMinorStars(yearBranch, monthBranch, hourBranch);

    // 合并所有星曜
    const allStars = mergeStars(majorStars, luckyStars, badStars, minorStars);

    // 计算四化
    const sihua = computeSihua(yearStem, majorStars);

    // 构建十二宫
    const palaces = {};
    const mingIdx = ZW.BRANCH_ORDER.indexOf(mingBranch);

    ZW.PALACES.forEach((palace, i) => {
      const branchIdx = (mingIdx + i) % 12;
      const branch = ZW.BRANCH_ORDER[branchIdx];
      palaces[palace.key] = {
        name: palace.name,
        short: palace.short,
        branch: branch,
        stars: allStars[branch] || [],
        sihua: (sihua[branch] || []),
        brightness: (allStars[branch] || []).map(s => ({
          star: s,
          brightness: ZW.getStarBrightness(s, branch)
        }))
      };
    });

    // 身宫位置
    const shenIdx = ZW.BRANCH_ORDER.indexOf(shenBranch);
    const shenPalaceKey = ZW.PALACES[(shenIdx - mingIdx + 12) % 12]?.key;

    return {
      mingBranch,
      shenBranch,
      shenPalaceKey,
      ju,
      element,
      gender,
      palaces,
      sihua,
      rawStars: allStars,
      ziweiBranch,
      tianfuBranch,
    };
  }

  // 暴露 API
  global.ZWStars = {
    locateZiwei,
    locateTianfu,
    placeMajorStars,
    placeLuckyStars,
    placeBadStars,
    placeMinorStars,
    computeSihua,
    mergeStars,
    buildChart,
  };
})(window);
