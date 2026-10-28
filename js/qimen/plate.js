/* ============================================================
 *  奇门遁甲排盘算法
 *  来源：《奇门遁甲秘笈》《奇门遁甲全书》
 *  采用时家奇门转盘法
 * ============================================================ */
(function (global) {
  'use strict';

  const QM = global.QMConst;
  if (!QM) throw new Error('QMConst not loaded');

  // ===== 确定阴阳遁 =====
  function determineDun(termName) {
    if (QM.YANG_DUN_TERMS.includes(termName)) {
      return { type: 'yang', name: '阳遁' };
    } else if (QM.YIN_DUN_TERMS.includes(termName)) {
      return { type: 'yin', name: '阴遁' };
    }
    return { type: 'yang', name: '阳遁' }; // 默认阳遁
  }

  // ===== 确定局数 =====
  // 根据节气和元确定局数
  function determineJu(termName, dayBranch) {
    const juTable = QM.JU_TABLE[termName];
    if (!juTable) return 1;

    // 简化：根据日支确定上中下元
    const branchIdx = QM.BRANCHES.indexOf(dayBranch);
    // 子午卯酉为上元，寅申巳亥为中元，辰戌丑未为下元
    const yuans = [0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1]; // 上中下循环
    const yuanIdx = yuans[branchIdx % 12];

    return juTable[yuanIdx] || juTable[0] || 1;
  }

  // ===== 布六仪三奇 =====
  function placeLiuyiSanqi(ju, dunType) {
    const liuyi = ['戊', '己', '庚', '辛', '壬', '癸'];
    const sanqi = ['乙', '丙', '丁'];

    // 九宫顺序：1-8-3-4-9-2-7-6（洛书顺序，中宫5不入盘）
    const palaceOrder = [1, 8, 3, 4, 9, 2, 7, 6];

    // 地盘排布
    const earthPlate = {};

    if (dunType === 'yang') {
      // 阳遁：顺布六仪，逆布三奇
      let startIdx = ju - 1;
      liuyi.forEach((yi, i) => {
        const palaceNum = palaceOrder[(startIdx + i) % 9];
        earthPlate[palaceNum] = { stem: yi, type: 'liuyi' };
      });
      sanqi.forEach((qi, i) => {
        const palaceNum = palaceOrder[(startIdx + 6 + i) % 9];
        earthPlate[palaceNum] = { stem: qi, type: 'sanqi' };
      });
    } else {
      // 阴遁：逆布六仪，顺布三奇
      let startIdx = ju - 1;
      liuyi.forEach((yi, i) => {
        const palaceNum = palaceOrder[(startIdx - i + 9) % 9];
        earthPlate[palaceNum] = { stem: yi, type: 'liuyi' };
      });
      sanqi.forEach((qi, i) => {
        const palaceNum = palaceOrder[(startIdx - 6 - i + 9) % 9];
        earthPlate[palaceNum] = { stem: qi, type: 'sanqi' };
      });
    }

    return earthPlate;
  }

  // ===== 找值符值使 =====
  function findZhiFuZhiShi(earthPlate, hourStem, hourBranch) {
    // 旬头
    const xuntou = QM.get旬头(hourStem, hourBranch);
    // 旬首（六仪）
    const xunshou = QM.get旬首值符(xuntou);

    // 找旬首所在宫
    let zhiFuPalace = 1;
    Object.entries(earthPlate).forEach(([num, info]) => {
      if (info.stem === xunshou) {
        zhiFuPalace = parseInt(num);
      }
    });

    // 值使门原始宫位
    const gatePalaces = { 1: '休门', 8: '生门', 3: '伤门', 4: '杜门', 9: '景门', 2: '死门', 7: '惊门', 6: '开门' };

    return {
      zhiFuPalace,
      zhiFuStar: Object.keys(QM.STAR_ORIGINAL_PALACE).find(k => QM.STAR_ORIGINAL_PALACE[k] === zhiFuPalace) || '天蓬',
      zhiShiGate: gatePalaces[zhiFuPalace] || '开门',
      xuntou,
      xunshou
    };
  }

  // ===== 布天盘 =====
  function placeHeavenPlate(earthPlate, hourStem, zhiFuPalace, dunType) {
    const heavenPlate = {};
    const palaceOrder = [1, 8, 3, 4, 9, 2, 7, 6];

    // 找时干所在宫
    let hourStemPalace = 1;
    Object.entries(earthPlate).forEach(([num, info]) => {
      if (info.stem === hourStem) {
        hourStemPalace = parseInt(num);
      }
    });

    // 天盘 = 值符随时干落宫
    // 计算旋转偏移
    const zhiFuIdx = palaceOrder.indexOf(zhiFuPalace);
    const hourIdx = palaceOrder.indexOf(hourStemPalace);
    const offset = (hourIdx - zhiFuIdx + 9) % 9;

    // 天盘布列
    palaceOrder.forEach((num, i) => {
      const sourceIdx = (i - offset + 9) % 9;
      const sourceNum = palaceOrder[sourceIdx];
      if (earthPlate[sourceNum]) {
        heavenPlate[num] = { ...earthPlate[sourceNum] };
      }
    });

    return { heavenPlate, hourStemPalace };
  }

  // ===== 布九星 =====
  function placeNineStars(zhiFuPalace, hourStemPalace, dunType) {
    const stars = {};
    const starOrder = ['天蓬', '天芮', '天冲', '天辅', '天禽', '天心', '天柱', '天任', '天英'];
    const palaceOrder = [1, 8, 3, 4, 9, 2, 7, 6];

    // 值符随时干落宫
    const zhiFuIdx = palaceOrder.indexOf(zhiFuPalace);
    const hourIdx = palaceOrder.indexOf(hourStemPalace);
    const offset = (hourIdx - zhiFuIdx + 9) % 9;

    palaceOrder.forEach((num, i) => {
      const starIdx = (i - offset + 9) % 9;
      stars[num] = starOrder[starIdx];
    });

    return stars;
  }

  // ===== 布八门 =====
  function placeEightGates(zhiShiGate, zhiFuPalace, hourBranch, dunType) {
    const gates = {};
    const gateOrder = ['休门', '生门', '伤门', '杜门', '景门', '死门', '惊门', '开门'];
    const palaceOrder = [1, 8, 3, 4, 9, 2, 7, 6];

    // 值使随时支落宫
    const branchIdx = QM.BRANCHES.indexOf(hourBranch);
    const zhiShiIdx = gateOrder.indexOf(zhiShiGate);
    const hourPalaceIdx = (zhiShiIdx + branchIdx) % 8;

    // 值使落宫
    const zhiShiPalace = palaceOrder[hourPalaceIdx];

    // 八门布列
    const gateOriginalPalaces = [1, 8, 3, 4, 9, 2, 7, 6]; // 休生伤杜景死惊开原始宫
    const zhiShiOriginalIdx = gateOrder.indexOf(zhiShiGate);
    const zhiShiOriginalPalace = gateOriginalPalaces[zhiShiOriginalIdx];
    const offset = (palaceOrder.indexOf(zhiShiPalace) - palaceOrder.indexOf(zhiShiOriginalPalace) + 8) % 8;

    gateOrder.forEach((gate, i) => {
      const originalPalace = gateOriginalPalaces[i];
      const newPalaceIdx = (palaceOrder.indexOf(originalPalace) + offset) % 8;
      gates[palaceOrder[newPalaceIdx]] = gate;
    });

    return { gates, zhiShiPalace };
  }

  // ===== 布八神 =====
  function placeEightGods(zhiFuPalace, hourStemPalace, dunType) {
    const gods = {};
    const godOrder = ['值符', '腾蛇', '太阴', '六合', '白虎', '玄武', '九地', '九天'];
    const palaceOrder = [1, 8, 3, 4, 9, 2, 7, 6];

    // 值符随时干落宫
    const zhiFuIdx = palaceOrder.indexOf(zhiFuPalace);
    const hourIdx = palaceOrder.indexOf(hourStemPalace);
    const offset = (hourIdx - zhiFuIdx + 8) % 8;

    palaceOrder.forEach((num, i) => {
      const godIdx = (i - offset + 8) % 8;
      gods[num] = godOrder[godIdx];
    });

    return gods;
  }

  // ===== 构建完整奇门盘 =====
  function buildPlate(input) {
    const { termName, dayBranch, hourStem, hourBranch } = input;

    // 确定阴阳遁
    const dun = determineDun(termName);

    // 确定局数
    const ju = determineJu(termName, dayBranch);

    // 布地盘
    const earthPlate = placeLiuyiSanqi(ju, dun.type);

    // 找值符值使
    const { zhiFuPalace, zhiFuStar, zhiShiGate, xuntou, xunshou } = findZhiFuZhiShi(earthPlate, hourStem, hourBranch);

    // 布天盘
    const { heavenPlate, hourStemPalace } = placeHeavenPlate(earthPlate, hourStem, zhiFuPalace, dun.type);

    // 布九星
    const nineStars = placeNineStars(zhiFuPalace, hourStemPalace, dun.type);

    // 布八门
    const { gates, zhiShiPalace } = placeEightGates(zhiShiGate, zhiFuPalace, hourBranch, dun.type);

    // 布八神
    const eightGods = placeEightGods(zhiFuPalace, hourStemPalace, dun.type);

    // 构建九宫数据
    const palaces = {};
    const palaceMap = { 1: 'kan', 2: 'kun', 3: 'zhen', 4: 'xun', 5: 'zhong', 6: 'qian', 7: 'dui', 8: 'gen', 9: 'li' };
    const trigramMap = { 1: '坎', 2: '坤', 3: '震', 4: '巽', 5: '中', 6: '乾', 7: '兑', 8: '艮', 9: '离' };

    [1, 2, 3, 4, 6, 7, 8, 9].forEach(num => {
      const key = palaceMap[num];
      palaces[key] = {
        number: num,
        trigram: trigramMap[num],
        earthStem: earthPlate[num]?.stem || '',
        heavenStem: heavenPlate[num]?.stem || '',
        star: nineStars[num] || '',
        gate: gates[num] || '',
        god: eightGods[num] || '',
        isSanqi: ['乙', '丙', '丁'].includes(heavenPlate[num]?.stem || '')
      };
    });

    return {
      dun,
      ju,
      xuntou,
      xunshou,
      zhiFuStar,
      zhiShiGate,
      zhiFuPalace,
      zhiShiPalace,
      earthPlate,
      heavenPlate,
      nineStars,
      gates,
      eightGods,
      palaces
    };
  }

  // 暴露 API
  global.QMPlate = {
    determineDun,
    determineJu,
    placeLiuyiSanqi,
    findZhiFuZhiShi,
    placeHeavenPlate,
    placeNineStars,
    placeEightGates,
    placeEightGods,
    buildPlate
  };
})(window);
