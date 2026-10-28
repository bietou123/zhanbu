/* ============================================================
 *  紫微斗数分析引擎
 *  格局判断、宫位解读、四化飞星
 * ============================================================ */
(function (global) {
  'use strict';

  const ZW = global.ZWConst;
  if (!ZW) throw new Error('ZWConst not loaded');

  // ===== 判断格局 =====
  function judgePatterns(chart) {
    const patterns = [];
    const palaces = chart.palaces;
    const mingPalace = palaces.ming;
    const mingStars = mingPalace.stars;
    const mingBranch = mingPalace.branch;

    ZW.PATTERNS.forEach(pattern => {
      try {
        let matched = false;
        if (pattern.condition.length === 1) {
          matched = pattern.condition(mingStars);
        } else if (pattern.condition.length === 2) {
          matched = pattern.condition(mingStars, palaces);
        } else if (pattern.condition.length === 3) {
          matched = pattern.condition(mingStars, palaces, chart.sihua);
        }

        if (matched) {
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

    return patterns;
  }

  // ===== 宫位解读 =====
  const PALACE_INTERPRETATIONS = {
    ming: {
      title: '命宫',
      meaning: '代表自我、性格、外在形象、人生格局',
      aspects: ['性格特质', '外在形象', '人生格局', '主要运势'],
      keyStars: {
        '紫微': {
          effect: '帝星坐命，天生有领导气质，自尊心强，喜掌权',
          strengths: ['领导才能', '组织能力', '贵人运'],
          weaknesses: ['傲慢', '固执', '好面子']
        },
        '天机': {
          effect: '善星坐命，聪明机智，善于谋略，思维活跃',
          strengths: ['智慧', '策划能力', '应变力'],
          weaknesses: ['多虑', '优柔寡断', '想太多']
        },
        '太阳': {
          effect: '中天星坐命，热情开朗，积极向上，有奉献精神',
          strengths: ['热情', '正义感', '社交能力'],
          weaknesses: ['冲动', '急躁', '过于理想化']
        },
        '武曲': {
          effect: '财星坐命，刚毅果断，善于理财，事业心强',
          strengths: ['决断力', '理财能力', '执行力'],
          weaknesses: ['孤傲', '固执', '缺乏柔情']
        },
        '天同': {
          effect: '福星坐命，性情温和，知足常乐，享受人生',
          strengths: ['人缘好', '乐观', '享受生活'],
          weaknesses: ['懒散', '缺乏进取', '优柔寡断']
        },
        '廉贞': {
          effect: '桃花星坐命，感情丰富，多才多艺，变化多端',
          strengths: ['艺术天赋', '社交魅力', '适应力'],
          weaknesses: ['感情波折', '情绪化', '是非多']
        },
        '天府': {
          effect: '财库星坐命，稳重保守，善于守成，衣食丰足',
          strengths: ['稳重', '理财', '管理能力'],
          weaknesses: ['保守', '缺乏冒险精神', '安于现状']
        },
        '太阴': {
          effect: '中天星坐命，阴柔内敛，感情细腻，有艺术气质',
          strengths: ['直觉力', '艺术天赋', '细腻'],
          weaknesses: ['情绪化', '缺乏主见', '阴晴不定']
        },
        '贪狼': {
          effect: '桃花星坐命，多才多艺，社交能力强，欲望旺盛',
          strengths: ['才艺', '社交', '适应力'],
          weaknesses: ['贪欲', '浮躁', '感情复杂']
        },
        '巨门': {
          effect: '暗星坐命，口才出众，善于表达，多疑善虑',
          strengths: ['口才', '分析力', '研究精神'],
          weaknesses: ['多疑', '是非', '口舌']
        },
        '天相': {
          effect: '印星坐命，公正稳重，善于辅佐，人缘好',
          strengths: ['公正', '协调力', '人缘'],
          weaknesses: ['缺乏主见', '随波逐流', '优柔寡断']
        },
        '天梁': {
          effect: '荫星坐命，老成稳重，有长者风范，清高正直',
          strengths: ['稳重', '智慧', '贵人运'],
          weaknesses: ['清高', '孤傲', '不合群']
        },
        '七杀': {
          effect: '将星坐命，权威果断，开创力强，独立性强',
          strengths: ['领导力', '决断力', '开创力'],
          weaknesses: ['孤独', '刚硬', '冲动']
        },
        '破军': {
          effect: '耗星坐命，变动性强，破旧立新，开创力强',
          strengths: ['开创力', '变革', '独立'],
          weaknesses: ['破坏性', '不稳定', '耗财']
        }
      }
    },
    xiong: {
      title: '兄弟宫',
      meaning: '代表兄弟姐妹关系、合作伙伴、平辈人际',
      aspects: ['兄弟关系', '合作运势', '平辈人缘']
    },
    fuqi: {
      title: '夫妻宫',
      meaning: '代表婚姻感情、配偶特征、恋爱模式',
      aspects: ['婚姻运势', '配偶特征', '恋爱模式', '感情发展']
    },
    zinv: {
      title: '子女宫',
      meaning: '代表子女关系、下属晚辈、创造力',
      aspects: ['子女关系', '下属运势', '创造力', '后代发展']
    },
    caifu: {
      title: '财帛宫',
      meaning: '代表财富运势、理财能力、收入来源',
      aspects: ['财富运势', '理财能力', '收入来源', '消费观']
    },
    jibing: {
      title: '疾厄宫',
      meaning: '代表健康状况、疾病隐患、身体特质',
      aspects: ['健康状况', '疾病隐患', '体质特征', '养生建议']
    },
    qianyi: {
      title: '迁移宫',
      meaning: '代表外出运势、社会形象、人际关系',
      aspects: ['外出运势', '社会形象', '人际交往', '发展机遇']
    },
    puve: {
      title: '仆役宫',
      meaning: '代表朋友关系、下属员工、人际网络',
      aspects: ['朋友关系', '下属运势', '人际网络', '社交能力']
    },
    guanlu: {
      title: '官禄宫',
      meaning: '代表事业发展、学业运势、社会地位',
      aspects: ['事业发展', '学业运势', '社会地位', '职业方向']
    },
    tianzhai: {
      title: '田宅宫',
      meaning: '代表不动产、家庭环境、祖业遗产',
      aspects: ['不动产', '家庭环境', '祖业遗产', '居住运势']
    },
    fude: {
      title: '福德宫',
      meaning: '代表精神世界、内心感受、享受能力',
      aspects: ['精神世界', '内心感受', '享受能力', '人生观']
    },
    fumu: {
      title: '父母宫',
      meaning: '代表与父母关系、长辈缘、贵人运',
      aspects: ['父母关系', '长辈缘', '贵人运', '家庭背景']
    }
  };

  // ===== 解读单个宫位 =====
  function interpretPalace(chart, palaceKey) {
    const palace = chart.palaces[palaceKey];
    if (!palace) return null;

    const info = PALACE_INTERPRETATIONS[palaceKey];
    const interpretation = {
      palace: palace.name,
      branch: palace.branch,
      meaning: info?.meaning || '',
      stars: palace.stars,
      brightness: palace.brightness,
      sihua: palace.sihua,
      analysis: []
    };

    // 分析主星
    const majorInPalace = ZW.MAJOR_STARS.filter(s => palace.stars.includes(s.name));
    majorInPalace.forEach(star => {
      const starInfo = info?.keyStars?.[star.name];
      if (starInfo) {
        interpretation.analysis.push({
          type: '主星',
          star: star.name,
          effect: starInfo.effect,
          strengths: starInfo.strengths,
          weaknesses: starInfo.weaknesses
        });
      }
    });

    // 分析吉星
    const luckyInPalace = ZW.LUCKY_STARS.filter(s => palace.stars.includes(s.name));
    luckyInPalace.forEach(star => {
      interpretation.analysis.push({
        type: '吉星',
        star: star.name,
        effect: star.nature
      });
    });

    // 分析煞星
    const badInPalace = ZW.BAD_STARS.filter(s => palace.stars.includes(s.name));
    badInPalace.forEach(star => {
      interpretation.analysis.push({
        type: '煞星',
        star: star.name,
        effect: star.nature,
        warning: true
      });
    });

    // 分析四化
    palace.sihua.forEach(sh => {
      interpretation.analysis.push({
        type: '四化',
        star: sh.star,
        hua: sh.hua,
        effect: ZW.SIHUA[sh.hua.toLowerCase()]?.meaning || ''
      });
    });

    return interpretation;
  }

  // ===== 四化飞星解读 =====
  function interpretSihua(chart) {
    const result = {
      lu: [], // 化禄
      quan: [], // 化权
      ke: [], // 化科
      ji: []  // 化忌
    };

    Object.entries(chart.sihua).forEach(([branch, huas]) => {
      huas.forEach(h => {
        const palaceKey = Object.keys(chart.palaces).find(k =>
          chart.palaces[k].branch === branch
        );
        const palaceName = chart.palaces[palaceKey]?.name || branch;

        if (h.hua === '禄') {
          result.lu.push({
            star: h.star,
            palace: palaceName,
            branch: branch,
            meaning: `${h.star}化禄入${palaceName}，主该宫位财富、福气增强`
          });
        } else if (h.hua === '权') {
          result.quan.push({
            star: h.star,
            palace: palaceName,
            branch: branch,
            meaning: `${h.star}化权入${palaceName}，主该宫位权力、掌控力增强`
          });
        } else if (h.hua === '科') {
          result.ke.push({
            star: h.star,
            palace: palaceName,
            branch: branch,
            meaning: `${h.star}化科入${palaceName}，主该宫位名声、贵人运增强`
          });
        } else if (h.hua === '忌') {
          result.ji.push({
            star: h.star,
            palace: palaceName,
            branch: branch,
            meaning: `${h.star}化忌入${palaceName}，主该宫位有执着、困扰、波折`
          });
        }
      });
    });

    return result;
  }

  // ===== 综合性格分析 =====
  function analyzePersonality(chart) {
    const mingInterp = interpretPalace(chart, 'ming');
    const fudeInterp = interpretPalace(chart, 'fude');

    const traits = [];
    const strengths = [];
    const weaknesses = [];

    // 从命宫提取性格特质
    mingInterp?.analysis?.forEach(a => {
      if (a.strengths) strengths.push(...a.strengths);
      if (a.weaknesses) weaknesses.push(...a.weaknesses);
      if (a.effect) traits.push(a.effect);
    });

    // 从福德宫提取内心世界
    const innerWorld = fudeInterp?.analysis?.map(a => a.effect).filter(Boolean) || [];

    return {
      traits,
      strengths: [...new Set(strengths)],
      weaknesses: [...new Set(weaknesses)],
      innerWorld,
      mingPalace: mingInterp
    };
  }

  // ===== 事业分析 =====
  function analyzeCareer(chart) {
    const guanluInterp = interpretPalace(chart, 'guanlu');
    const caifuInterp = interpretPalace(chart, 'caifu');

    const careerDirection = [];
    const suitableIndustries = [];

    // 根据官禄宫主星判断事业方向
    guanluInterp?.stars?.forEach(star => {
      if (star === '紫微') careerDirection.push('领导管理、行政公职');
      if (star === '天机') careerDirection.push('策划咨询、技术研发');
      if (star === '太阳') careerDirection.push('教育传媒、公共服务');
      if (star === '武曲') careerDirection.push('金融财务、实业经营');
      if (star === '天同') careerDirection.push('服务行业、休闲产业');
      if (star === '廉贞') careerDirection.push('艺术娱乐、公关营销');
      if (star === '天府') careerDirection.push('财务管理、企业经营');
      if (star === '太阴') careerDirection.push('房地产、餐饮、艺术');
      if (star === '贪狼') careerDirection.push('演艺娱乐、营销公关');
      if (star === '巨门') careerDirection.push('口才相关、律师讲师');
      if (star === '天相') careerDirection.push('行政助理、公共服务');
      if (star === '天梁') careerDirection.push('教育咨询、医疗保健');
      if (star === '七杀') careerDirection.push('军警司法、创业开拓');
      if (star === '破军') careerDirection.push('变革创新、开拓市场');
    });

    return {
      careerDirection,
      suitableIndustries,
      guanluPalace: guanluInterp,
      caifuPalace: caifuInterp
    };
  }

  // ===== 婚姻分析 =====
  function analyzeMarriage(chart) {
    const fuqiInterp = interpretPalace(chart, 'fuqi');
    const zinvInterp = interpretPalace(chart, 'zinv');

    const spouseTraits = [];
    const marriageAdvice = [];

    // 根据夫妻宫主星判断配偶特征
    fuqiInterp?.stars?.forEach(star => {
      if (star === '紫微') spouseTraits.push('配偶有贵气，可能从事管理或公职');
      if (star === '天机') spouseTraits.push('配偶聪明机智，善于思考');
      if (star === '太阳') spouseTraits.push('配偶热情开朗，事业心强');
      if (star === '武曲') spouseTraits.push('配偶刚毅果断，善于理财');
      if (star === '天同') spouseTraits.push('配偶温和善良，享受生活');
      if (star === '廉贞') spouseTraits.push('配偶有艺术气质，感情丰富');
      if (star === '天府') spouseTraits.push('配偶稳重保守，家境殷实');
      if (star === '太阴') spouseTraits.push('配偶温柔细腻，有艺术气质');
      if (star === '贪狼') spouseTraits.push('配偶多才多艺，社交能力强');
      if (star === '巨门') spouseTraits.push('配偶口才好，但有口舌之虑');
      if (star === '天相') spouseTraits.push('配偶公正稳重，善于协调');
      if (star === '天梁') spouseTraits.push('配偶老成稳重，有长者风范');
      if (star === '七杀') spouseTraits.push('配偶果断刚毅，事业心强');
      if (star === '破军') spouseTraits.push('配偶变化多端，追求自由');
    });

    // 检查煞星
    if (fuqiInterp?.stars?.includes('擎羊')) {
      marriageAdvice.push('注意感情中的冲突和争执');
    }
    if (fuqiInterp?.stars?.includes('陀罗')) {
      marriageAdvice.push('感情可能有拖延和纠结');
    }
    if (fuqiInterp?.stars?.includes('地空') || fuqiInterp?.stars?.includes('地劫')) {
      marriageAdvice.push('感情可能有不切实际的期待');
    }

    return {
      spouseTraits,
      marriageAdvice,
      fuqiPalace: fuqiInterp,
      zinvPalace: zinvInterp
    };
  }

  // ===== 财运分析 =====
  function analyzeWealth(chart) {
    const caifuInterp = interpretPalace(chart, 'caifu');
    const tianzhaiInterp = interpretPalace(chart, 'tianzhai');

    const wealthLevel = '中等'; // 简化判断
    const wealthSource = [];

    // 根据财帛宫主星判断财运来源
    caifuInterp?.stars?.forEach(star => {
      if (star === '武曲' || star === '太阴') wealthSource.push('正财收入稳定');
      if (star === '天府') wealthSource.push('善于守财，理财有道');
      if (star === '贪狼') wealthSource.push('偏财运，宜投资');
      if (star === '破军') wealthSource.push('财运波动，大起大落');
    });

    return {
      wealthLevel,
      wealthSource,
      caifuPalace: caifuInterp,
      tianzhaiPalace: tianzhaiInterp
    };
  }

  // ===== 完整分析 =====
  function fullAnalysis(chart) {
    return {
      patterns: judgePatterns(chart),
      personality: analyzePersonality(chart),
      career: analyzeCareer(chart),
      marriage: analyzeMarriage(chart),
      wealth: analyzeWealth(chart),
      sihua: interpretSihua(chart),
      palaces: Object.keys(chart.palaces).reduce((m, k) => {
        m[k] = interpretPalace(chart, k);
        return m;
      }, {})
    };
  }

  // 暴露 API
  global.ZWAnalysis = {
    judgePatterns,
    interpretPalace,
    interpretSihua,
    analyzePersonality,
    analyzeCareer,
    analyzeMarriage,
    analyzeWealth,
    fullAnalysis,
    PALACE_INTERPRETATIONS
  };
})(window);
