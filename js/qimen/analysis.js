/* ============================================================
 *  奇门遁甲分析引擎
 *  格局判断、宫位解读、用事建议
 * ============================================================ */
(function (global) {
  'use strict';

  const QM = global.QMConst;
  if (!QM) throw new Error('QMConst not loaded');

  // ===== 判断格局 =====
  function judgePatterns(plate) {
    const patterns = [];

    QM.PATTERNS.forEach(pattern => {
      try {
        if (pattern.condition(plate)) {
          patterns.push({
            name: pattern.name,
            effect: pattern.effect,
            tier: pattern.tier
          });
        }
      } catch (e) {
        // 忽略判断错误
      }
    });

    // 额外格局判断
    // 天盘三奇
    const sanqiPalaces = Object.entries(plate.palaces)
      .filter(([k, p]) => p.isSanqi)
      .map(([k, p]) => ({ key: k, ...p }));

    if (sanqiPalaces.length > 0) {
      sanqiPalaces.forEach(sp => {
        const qiName = QM.SANQI.find(q => q.stem === sp.heavenStem)?.name || sp.heavenStem;
        patterns.push({
          name: `${qiName}临${sp.trigram}宫`,
          effect: `${sp.heavenStem}奇临${sp.trigram}宫，${QM.SANQI.find(q => q.stem === sp.heavenStem)?.meaning || ''}`,
          tier: '吉格'
        });
      });
    }

    // 吉门吉星组合
    Object.entries(plate.palaces).forEach(([key, palace]) => {
      const goodGates = ['开门', '休门', '生门'];
      const goodStars = ['天心', '天辅', '天任', '天禽'];

      if (goodGates.includes(palace.gate) && goodStars.includes(palace.star)) {
        patterns.push({
          name: `${palace.gate}遇${palace.star}`,
          effect: `${palace.trigram}宫${palace.gate}配${palace.star}，大吉`,
          tier: '上格'
        });
      }

      // 凶门凶星组合
      const badGates = ['死门', '惊门', '伤门'];
      const badStars = ['天蓬', '天芮', '天柱', '天英'];

      if (badGates.includes(palace.gate) && badStars.includes(palace.star)) {
        patterns.push({
          name: `${palace.gate}遇${palace.star}`,
          effect: `${palace.trigram}宫${palace.gate}配${palace.star}，需谨慎`,
          tier: '下格'
        });
      }
    });

    return patterns;
  }

  // ===== 宫位解读 =====
  const PALACE_INTERPRETATIONS = {
    '坎': {
      direction: '北方',
      element: '水',
      meaning: '潜伏、隐秘、智慧',
      aspects: ['事业奠基', '暗中谋划', '积蓄力量']
    },
    '坤': {
      direction: '西南',
      element: '土',
      meaning: '包容、顺从、厚德载物',
      aspects: ['家庭', '人际', '合作']
    },
    '震': {
      direction: '东方',
      element: '木',
      meaning: '行动、冲动、突破',
      aspects: ['事业启动', '改革创新', '出行']
    },
    '巽': {
      direction: '东南',
      element: '木',
      meaning: '顺从、渗透、柔和',
      aspects: ['人际沟通', '商务合作', '文化传播']
    },
    '乾': {
      direction: '西北',
      element: '金',
      meaning: '刚健、领导、权威',
      aspects: ['事业发展', '官职升迁', '领导力']
    },
    '兑': {
      direction: '西方',
      element: '金',
      meaning: '喜悦、口舌、交际',
      aspects: ['口才表达', '社交娱乐', '协商谈判']
    },
    '艮': {
      direction: '东北',
      element: '土',
      meaning: '停止、稳固、坚守',
      aspects: ['守成', '学习进修', '不动产业']
    },
    '离': {
      direction: '南方',
      element: '火',
      meaning: '光明、热情、文采',
      aspects: ['名声', '文化事业', '考试晋升']
    }
  };

  // ===== 九星解读 =====
  const STAR_INTERPRETATIONS = {
    '天蓬': {
      nature: '凶星',
      meaning: '主盗贼、欺诈、智谋',
      good: '宜于谋略、隐蔽之事',
      bad: '不宜出行、投资',
      element: '水'
    },
    '天芮': {
      nature: '凶星',
      meaning: '主疾病、学习、问题',
      good: '宜于学习、求医',
      bad: '不宜开业、投资',
      element: '土'
    },
    '天冲': {
      nature: '吉星',
      meaning: '主冲动、行动、突破',
      good: '宜于进攻、突破、改革',
      bad: '不宜守成',
      element: '木'
    },
    '天辅': {
      nature: '吉星',
      meaning: '主辅助、教育、贵人',
      good: '宜于求学、求职、求助',
      bad: '无明显不宜',
      element: '木'
    },
    '天禽': {
      nature: '吉星',
      meaning: '主中正、稳定、权威',
      good: '宜于居中调停、稳定发展',
      bad: '无明显不宜',
      element: '土'
    },
    '天心': {
      nature: '吉星',
      meaning: '主心计、谋划、医疗',
      good: '宜于策划、求医、谋事',
      bad: '无明显不宜',
      element: '金'
    },
    '天柱': {
      nature: '凶星',
      meaning: '主破坏、变革、口舌',
      good: '宜于破旧立新、改革创新',
      bad: '不宜守成、稳定',
      element: '金'
    },
    '天任': {
      nature: '吉星',
      meaning: '主任劳任怨、稳定、忠诚',
      good: '宜于稳扎稳打、持久之事',
      bad: '不宜冒险',
      element: '土'
    },
    '天英': {
      nature: '凶星',
      meaning: '主英豪、名声、急躁',
      good: '宜于求名、文化事业',
      bad: '不宜急躁行事',
      element: '火'
    }
  };

  // ===== 八门解读 =====
  const GATE_INTERPRETATIONS = {
    '休门': {
      nature: '吉门',
      meaning: '主休息、养生、等待',
      good: '宜于休息、养生、等待时机',
      bad: '不宜急进、进攻',
      direction: '北方坎宫'
    },
    '生门': {
      nature: '吉门',
      meaning: '主生机、财富、生育',
      good: '宜于求财、开业、生育、新事业',
      bad: '无明显不宜',
      direction: '东北艮宫'
    },
    '伤门': {
      nature: '凶门',
      meaning: '主伤害、破坏、竞争',
      good: '宜于竞技、辩论、索债',
      bad: '不宜合作、婚嫁',
      direction: '东方震宫'
    },
    '杜门': {
      nature: '中平门',
      meaning: '主阻塞、隐藏、修炼',
      good: '宜于修炼、学习、隐藏',
      bad: '不宜出行、开业',
      direction: '东南巽宫'
    },
    '景门': {
      nature: '中平门',
      meaning: '主景象、文书、考试',
      good: '宜于考试、文书、谋划',
      bad: '不宜冒险',
      direction: '南方离宫'
    },
    '死门': {
      nature: '凶门',
      meaning: '主死亡、结束、固定',
      good: '宜于结束、了断、葬礼',
      bad: '不宜开业、出行、婚嫁',
      direction: '西南坤宫'
    },
    '惊门': {
      nature: '凶门',
      meaning: '主惊恐、口舌、是非',
      good: '宜于演说、辩论、法律',
      bad: '不宜合作、投资',
      direction: '西方兑宫'
    },
    '开门': {
      nature: '吉门',
      meaning: '主开放、事业、官职',
      good: '宜于开业、求职、出行、升迁',
      bad: '无明显不宜',
      direction: '西北乾宫'
    }
  };

  // ===== 八神解读 =====
  const GOD_INTERPRETATIONS = {
    '值符': {
      nature: '吉神',
      meaning: '主贵人、领导、权威',
      effect: '逢凶化吉，贵人相助'
    },
    '腾蛇': {
      nature: '凶神',
      meaning: '主虚惊、怪异、变化',
      effect: '多虚惊怪异之事'
    },
    '太阴': {
      nature: '吉神',
      meaning: '主阴私、隐蔽、女性',
      effect: '宜于暗中谋划'
    },
    '六合': {
      nature: '吉神',
      meaning: '主和合、婚姻、合作',
      effect: '宜于婚嫁、合作'
    },
    '白虎': {
      nature: '凶神',
      meaning: '主凶猛、争斗、血光',
      effect: '需防口舌争斗'
    },
    '玄武': {
      nature: '凶神',
      meaning: '主盗贼、暗昧、小人',
      effect: '需防小人欺诈'
    },
    '九地': {
      nature: '吉神',
      meaning: '主稳固、低调、防守',
      effect: '宜于低调行事、防守'
    },
    '九天': {
      nature: '吉神',
      meaning: '主高远、张扬、进攻',
      effect: '宜于张扬进取'
    }
  };

  // ===== 解读单个宫位 =====
  function interpretPalace(plate, palaceKey) {
    const palace = plate.palaces[palaceKey];
    if (!palace) return null;

    const info = PALACE_INTERPRETATIONS[palace.trigram];
    const starInfo = STAR_INTERPRETATIONS[palace.star];
    const gateInfo = GATE_INTERPRETATIONS[palace.gate];
    const godInfo = GOD_INTERPRETATIONS[palace.god];

    // 判断吉凶
    const isGoodGate = ['开门', '休门', '生门'].includes(palace.gate);
    const isBadGate = ['死门', '惊门', '伤门'].includes(palace.gate);
    const isGoodStar = ['天心', '天辅', '天任', '天禽'].includes(palace.star);
    const isBadStar = ['天蓬', '天芮', '天柱', '天英'].includes(palace.star);
    const isSanqi = palace.isSanqi;

    let overall = '平';
    if ((isGoodGate && isGoodStar) || (isGoodGate && isSanqi) || (isGoodStar && isSanqi)) {
      overall = '吉';
    } else if ((isBadGate && isBadStar) || (isBadGate && !isSanqi)) {
      overall = '凶';
    }

    return {
      trigram: palace.trigram,
      number: palace.number,
      direction: info?.direction,
      element: info?.element,
      meaning: info?.meaning,
      aspects: info?.aspects,
      earthStem: palace.earthStem,
      heavenStem: palace.heavenStem,
      star: palace.star,
      starInfo,
      gate: palace.gate,
      gateInfo,
      god: palace.god,
      godInfo,
      isSanqi,
      overall,
      analysis: generatePalaceAnalysis(palace, starInfo, gateInfo, godInfo)
    };
  }

  // ===== 生成宫位分析 =====
  function generatePalaceAnalysis(palace, starInfo, gateInfo, godInfo) {
    const lines = [];

    lines.push(`【${palace.trigram}宫】位于${PALACE_INTERPRETATIONS[palace.trigram]?.direction || ''}方，五行属${PALACE_INTERPRETATIONS[palace.trigram]?.element || ''}。`);

    if (palace.isSanqi) {
      const qiName = QM.SANQI.find(q => q.stem === palace.heavenStem)?.name || palace.heavenStem;
      lines.push(`天盘${qiName}(${palace.heavenStem})临宫，为三奇吉格。`);
    }

    lines.push(`九星${palace.star}临宫，${starInfo?.meaning || ''}。性质${starInfo?.nature || ''}，${starInfo?.good || ''}。`);
    lines.push(`八门${palace.gate}临宫，${gateInfo?.meaning || ''}。性质${gateInfo?.nature || ''}，${gateInfo?.good || ''}。`);
    lines.push(`八神${palace.god}临宫，${godInfo?.meaning || ''}。`);

    return lines;
  }

  // ===== 用事建议 =====
  const ACTIVITY_ADVICE = {
    '求财': {
      good: ['生门', '开门', '休门'],
      bad: ['死门', '伤门'],
      stars: ['天任', '天心', '天辅'],
      sanqi: true,
      advice: '宜临生门、开门，配吉星或三奇，主财运亨通。'
    },
    '求职': {
      good: ['开门', '生门'],
      bad: ['死门', '杜门'],
      stars: ['天心', '天辅', '天任'],
      sanqi: true,
      advice: '宜临开门，配吉星或三奇，主求职顺利。'
    },
    '婚嫁': {
      good: ['休门', '生门', '开门'],
      bad: ['死门', '伤门', '惊门'],
      stars: ['天心', '天辅', '天任', '天禽'],
      gods: ['六合', '太阴'],
      sanqi: true,
      advice: '宜临吉门，配吉星、吉神，主婚姻美满。'
    },
    '出行': {
      good: ['开门', '生门', '休门'],
      bad: ['死门', '杜门'],
      stars: ['天心', '天辅', '天任'],
      sanqi: true,
      advice: '宜临开门或生门，配吉星，主出行平安。'
    },
    '诉讼': {
      good: ['开门', '惊门'],
      bad: ['死门', '伤门'],
      stars: ['天心', '天冲'],
      gods: ['值符', '九天'],
      advice: '惊门虽凶，但宜于诉讼辩论；配吉神可胜诉。'
    },
    '开业': {
      good: ['开门', '生门'],
      bad: ['死门', '杜门', '伤门'],
      stars: ['天心', '天辅', '天任'],
      sanqi: true,
      advice: '宜临开门或生门，配吉星或三奇，主开业大吉。'
    },
    '考试': {
      good: ['景门', '开门', '生门'],
      bad: ['死门', '杜门'],
      stars: ['天辅', '天心', '天英'],
      sanqi: true,
      advice: '景门主文书考试，宜配吉星或三奇。'
    },
    '求医': {
      good: ['休门', '生门', '开门'],
      bad: ['死门', '伤门'],
      stars: ['天心', '天芮'],
      advice: '天心主医疗，天芮主疾病；临吉门可康复。'
    }
  };

  // ===== 分析用事 =====
  function analyzeActivity(plate, activity) {
    const advice = ACTIVITY_ADVICE[activity];
    if (!advice) return null;

    const result = {
      activity,
      goodPalaces: [],
      badPalaces: [],
      advice: advice.advice
    };

    Object.entries(plate.palaces).forEach(([key, palace]) => {
      const isGoodGate = advice.good?.includes(palace.gate);
      const isBadGate = advice.bad?.includes(palace.gate);
      const isGoodStar = advice.stars?.includes(palace.star);
      const hasSanqi = advice.sanqi && palace.isSanqi;
      const hasGoodGod = advice.gods?.includes(palace.god);

      if (isGoodGate && (isGoodStar || hasSanqi || hasGoodGod)) {
        result.goodPalaces.push({
          trigram: palace.trigram,
          direction: PALACE_INTERPRETATIONS[palace.trigram]?.direction,
          gate: palace.gate,
          star: palace.star,
          god: palace.god,
          reason: `${palace.gate}临${palace.trigram}宫，配${palace.star}、${palace.god}`
        });
      }

      if (isBadGate) {
        result.badPalaces.push({
          trigram: palace.trigram,
          direction: PALACE_INTERPRETATIONS[palace.trigram]?.direction,
          gate: palace.gate,
          reason: `${palace.gate}临${palace.trigram}宫，不宜此事宜`
        });
      }
    });

    return result;
  }

  // ===== 婚姻感情分析 =====
  function analyzeMarriage(plate) {
    const result = {
      overall: '平',
      advice: [],
      goodPalaces: [],
      warnings: []
    };

    // 找六合所在宫
    const liuhePalace = Object.entries(plate.palaces).find(([k, p]) => p.god === '六合');
    if (liuhePalace) {
      const [, palace] = liuhePalace;
      const isGoodGate = ['开门', '休门', '生门'].includes(palace.gate);
      const isBadGate = ['死门', '伤门', '惊门'].includes(palace.gate);

      if (isGoodGate && !isBadGate) {
        result.overall = '吉';
        result.goodPalaces.push({
          trigram: palace.trigram,
          gate: palace.gate,
          star: palace.star,
          meaning: `六合临${palace.trigram}宫配${palace.gate}，感情和顺`
        });
      }

      if (isBadGate) {
        result.overall = '凶';
        result.warnings.push(`六合临${palace.gate}，感情可能有波折`);
      }
    }

    // 找生门（主生育、感情生机）
    const shengmenPalace = Object.entries(plate.palaces).find(([k, p]) => p.gate === '生门');
    if (shengmenPalace) {
      const [, palace] = shengmenPalace;
      const isGoodStar = ['天心', '天辅', '天任', '天禽'].includes(palace.star);
      if (isGoodStar || palace.isSanqi) {
        result.advice.push(`生门临${palace.trigram}宫，配${palace.star}${palace.isSanqi ? '，又有三奇' : ''}，感情生机旺盛`);
      }
    }

    // 检查凶门凶星
    Object.entries(plate.palaces).forEach(([key, palace]) => {
      if (['死门', '伤门'].includes(palace.gate) && ['天蓬', '天芮'].includes(palace.star)) {
        result.warnings.push(`${palace.trigram}宫${palace.gate}配${palace.star}，需防感情问题`);
      }
    });

    return result;
  }

  // ===== 完整分析 =====
  function fullAnalysis(plate) {
    const patterns = judgePatterns(plate);
    const palaces = Object.keys(plate.palaces).reduce((m, k) => {
      m[k] = interpretPalace(plate, k);
      return m;
    }, {});
    const marriage = analyzeMarriage(plate);

    // 找最佳方位
    const goodPalaces = Object.entries(palaces)
      .filter(([k, p]) => p.overall === '吉')
      .map(([k, p]) => ({ trigram: p.trigram, direction: p.direction, gate: p.gate, star: p.star }));

    return {
      dun: plate.dun,
      ju: plate.ju,
      xuntou: plate.xuntou,
      zhiFuStar: plate.zhiFuStar,
      zhiShiGate: plate.zhiShiGate,
      patterns,
      palaces,
      marriage,
      goodPalaces,
      summary: generateSummary(patterns, goodPalaces)
    };
  }

  // ===== 生成摘要 =====
  function generateSummary(patterns, goodPalaces) {
    const lines = [];

    const goodPatterns = patterns.filter(p => ['上上格', '上格', '吉格'].includes(p.tier));
    const badPatterns = patterns.filter(p => ['下格', '凶格'].includes(p.tier));

    if (goodPatterns.length > 0) {
      lines.push(`吉格：${goodPatterns.map(p => p.name).join('、')}`);
    }
    if (badPatterns.length > 0) {
      lines.push(`凶格：${badPatterns.map(p => p.name).join('、')}`);
    }

    if (goodPalaces.length > 0) {
      lines.push(`有利方位：${goodPalaces.map(p => p.direction).join('、')}`);
    }

    return lines;
  }

  // 暴露 API
  global.QMAnalysis = {
    judgePatterns,
    interpretPalace,
    analyzeActivity,
    analyzeMarriage,
    fullAnalysis,
    PALACE_INTERPRETATIONS,
    STAR_INTERPRETATIONS,
    GATE_INTERPRETATIONS,
    GOD_INTERPRETATIONS,
    ACTIVITY_ADVICE
  };
})(window);
