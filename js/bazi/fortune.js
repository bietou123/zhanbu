/* ============================================================
 *  命理分析引擎 fortune.js
 *
 *  分析框架：
 *    强弱判定 → 取格局 → 取用神 → 各维度描述
 *
 *  规则来源（每条结论都标注出处）：
 *    《子平真诠》沈孝瞻        — 格局论核心
 *    《滴天髓》刘伯温/任铁樵     — 旺衰强弱、用神平衡
 *    《穷通宝鉴》余春台          — 调候用神（月令喜忌）
 *    《渊海子平》徐大升          — 综合体系、五行喜忌
 *    《三命通会》万民英          — 通论、神煞、十神性格
 *
 *  ⚠ 本引擎仅作传统命理学研究与文化探讨，不构成任何吉凶预测或决策依据。
 * ============================================================ */
(function (global) {
  'use strict';

  const C = global.BZConst;

  /* ============================================================
   *  Part 1 · 强弱判定（滴天髓·体用 + 子平真诠·身强弱）
   * ============================================================ */
  function computeStrength(ann) {
    const ds = ann.dayMaster;
    const dsElem = C.stemElement(ds);
    const details = [];
    let score = 0;

    // 1. 月令 (权重最大) ——《子平真诠》: "用神专取月令"
    const monthBranch = ann.month.branch;
    const monthQi = C.HIDDEN_STEMS[monthBranch][0]; // 本气
    const monthQiElem = C.stemElement(monthQi);
    const monthShishen = global.ShiShen.getShiShen(ds, monthQi);
    let monthScore = 0;
    if (['比肩','劫财'].includes(monthShishen))     monthScore = 3;
    else if (['正印','偏印'].includes(monthShishen)) monthScore = 2;
    else if (['食神','伤官'].includes(monthShishen)) monthScore = -2;
    else if (['正财','偏财'].includes(monthShishen)) monthScore = -2;
    else if (['正官','七杀'].includes(monthShishen)) monthScore = -2;
    score += monthScore;
    details.push(`月令${monthBranch}本气${monthQi}(${monthShishen}) ${monthScore >= 0 ? '+' : ''}${monthScore}`);

    // 2. 其他天干 (年/月/时干)
    [['年',ann.year.stem],['月',ann.month.stem],['时',ann.hour.stem]].forEach(([pos, st]) => {
      const ss = global.ShiShen.getShiShen(ds, st);
      let s = 0;
      if (['比肩','劫财','正印','偏印'].includes(ss)) s = 1;
      else if (ss !== '?') s = -1;
      score += s;
      details.push(`${pos}干${st}(${ss}) ${s >= 0 ? '+' : ''}${s}`);
    });

    // 3. 日支 (坐下) — 加权
    const dayBranchQi = C.HIDDEN_STEMS[ann.day.branch][0];
    const dayBranchSS = global.ShiShen.getShiShen(ds, dayBranchQi);
    let dayBranchScore = 0;
    if (['比肩','劫财'].includes(dayBranchSS))      dayBranchScore = 2;
    else if (['正印','偏印'].includes(dayBranchSS)) dayBranchScore = 1;
    else                                              dayBranchScore = -1;
    score += dayBranchScore;
    details.push(`日支${ann.day.branch}藏${dayBranchQi}(${dayBranchSS}) ${dayBranchScore >= 0 ? '+' : ''}${dayBranchScore}`);

    // 4. 年/时支藏干 (本气) — 半分
    [['年',ann.year.branch],['时',ann.hour.branch]].forEach(([pos, br]) => {
      const qi = C.HIDDEN_STEMS[br][0];
      const ss = global.ShiShen.getShiShen(ds, qi);
      let s = 0;
      if (['比肩','劫财','正印','偏印'].includes(ss)) s = 1;
      else s = -1;
      score += s;
      details.push(`${pos}支${br}藏${qi}(${ss}) ${s >= 0 ? '+' : ''}${s}`);
    });

    // 阈值（综合《滴天髓》体用论 + 实务）
    let level, label;
    if (score >= 6)       { level = 'extreme-strong'; label = '极旺/专旺'; }
    else if (score >= 3)  { level = 'strong';         label = '偏旺/身强'; }
    else if (score >= -2) { level = 'balanced';       label = '中和'; }
    else if (score >= -5) { level = 'weak';           label = '偏弱/身弱'; }
    else                  { level = 'extreme-weak';   label = '极弱/从弱'; }

    return { score, level, label, details, dayElement: dsElem, monthBranch, monthQi };
  }

  /* ============================================================
   *  Part 2 · 格局判定（子平真诠·八格）
   * ============================================================ */
  function judgePattern(ann) {
    const ds = ann.dayMaster;
    const monthBranch = ann.month.branch;
    const monthQi = C.HIDDEN_STEMS[monthBranch][0];

    // 比/劫居月令 → 建禄/月刃格（不入八格）
    const monthQiSS = global.ShiShen.getShiShen(ds, monthQi);
    if (monthQiSS === '比肩') {
      return { name: '建禄格', basis: '月支本气为比肩',
               gist: '身根深厚，宜行食伤、财、官运。',
               source: '《子平真诠·论建禄月刃》' };
    }
    if (monthQiSS === '劫财') {
      return { name: '月刃格', basis: '月支本气为劫财(羊刃)',
               gist: '性烈刚强，宜见七杀制伏（杀刃格），忌再见劫财。',
               source: '《子平真诠·论建禄月刃》' };
    }

    // 月令本气透干者优先取格
    const transparent = [ann.year.stem, ann.month.stem, ann.hour.stem].some(s => s === monthQi);
    const ssName = monthQiSS;
    const patternMap = {
      '正官': { name: '正官格', gist: '宜见印生身、忌伤官见官；身旺财官两旺为佳。',          source: '《子平真诠·论正官》' },
      '七杀': { name: '七杀格', gist: '宜食神制杀（食神制杀格），或印化杀，忌身弱受克。',       source: '《子平真诠·论七杀》' },
      '正财': { name: '正财格', gist: '身旺财旺为佳，最忌劫财夺财，喜食伤生财。',               source: '《子平真诠·论正财》' },
      '偏财': { name: '偏财格', gist: '主财源广、人缘旺，喜身强能任，忌身弱破财。',             source: '《子平真诠·论偏财》' },
      '食神': { name: '食神格', gist: '主聪明慧黠，宜身强财旺，忌枭神夺食。',                   source: '《子平真诠·论食神》' },
      '伤官': { name: '伤官格', gist: '才华横溢但易招忌，宜伤官配印（伤官佩印），忌伤官见官。',    source: '《子平真诠·论伤官》' },
      '正印': { name: '正印格', gist: '主聪明文雅、得长辈助力，喜官杀生印，忌正财破印。',         source: '《子平真诠·论正印》' },
      '偏印': { name: '偏印格', gist: '主思维独特、偏门技艺，最忌枭神夺食。',                   source: '《子平真诠·论偏印》' },
    };

    if (patternMap[ssName]) {
      return {
        ...patternMap[ssName],
        basis: transparent ? `月支${monthBranch}本气${monthQi}透出天干` : `月支${monthBranch}本气取${ssName}格`,
        transparent,
      };
    }

    return { name: '杂气格', basis: `月支${monthBranch}本气${monthQi}`,
             gist: '需视具体十神组合而定。', source: '《子平真诠》' };
  }

  /* ============================================================
   *  Part 3 · 用神选取
   *    平衡法（身旺取克泄耗 / 身弱取生扶）+ 调候法（穷通宝鉴）
   * ============================================================ */
  // 简化的"日干+月令"调候用神查询表（《穷通宝鉴》核心）
  const DIAOHOU = {
    // 寅卯月 (春)
    '甲_寅':'丙癸', '甲_卯':'庚丙', '甲_辰':'庚丁壬', '甲_巳':'癸丁', '甲_午':'癸丁', '甲_未':'癸丁',
    '甲_申':'庚丁壬', '甲_酉':'庚丁丙', '甲_戌':'庚甲壬', '甲_亥':'庚丁戊', '甲_子':'丁庚', '甲_丑':'丁庚丙',
    '乙_寅':'丙癸', '乙_卯':'丙癸', '乙_辰':'癸丙', '乙_巳':'癸', '乙_午':'癸丙', '乙_未':'癸丙',
    '乙_申':'丙癸己', '乙_酉':'癸丙丁', '乙_戌':'癸辛', '乙_亥':'丙戊', '乙_子':'丙', '乙_丑':'丙',
    '丙_寅':'壬庚', '丙_卯':'壬己', '丙_辰':'壬甲', '丙_巳':'壬庚癸', '丙_午':'壬庚', '丙_未':'壬庚',
    '丙_申':'壬', '丙_酉':'壬癸', '丙_戌':'甲壬', '丙_亥':'甲戊庚壬', '丙_子':'壬戊己', '丙_丑':'壬甲',
    '丁_寅':'甲庚', '丁_卯':'庚甲', '丁_辰':'甲庚', '丁_巳':'甲庚', '丁_午':'壬庚癸', '丁_未':'甲壬庚',
    '丁_申':'甲庚丙戊', '丁_酉':'甲庚丙戊', '丁_戌':'甲庚戊', '丁_亥':'甲庚', '丁_子':'甲庚', '丁_丑':'甲庚',
    '戊_寅':'丙甲癸', '戊_卯':'丙甲癸', '戊_辰':'甲丙癸', '戊_巳':'甲丙癸', '戊_午':'壬甲丙', '戊_未':'癸丙甲',
    '戊_申':'丙癸甲', '戊_酉':'丙癸', '戊_戌':'甲丙癸', '戊_亥':'甲丙', '戊_子':'丙甲', '戊_丑':'丙甲',
    '己_寅':'丙庚甲', '己_卯':'甲癸丙', '己_辰':'丙癸甲', '己_巳':'癸丙', '己_午':'癸丙', '己_未':'癸丙',
    '己_申':'丙癸', '己_酉':'丙癸', '己_戌':'甲丙癸', '己_亥':'丙甲戊', '己_子':'丙甲戊', '己_丑':'丙甲戊',
    '庚_寅':'丙甲壬', '庚_卯':'丁甲庚丙', '庚_辰':'甲丁壬癸', '庚_巳':'壬戊丙', '庚_午':'壬癸', '庚_未':'丁甲',
    '庚_申':'丁甲', '庚_酉':'丁甲丙', '庚_戌':'甲壬', '庚_亥':'丁丙', '庚_子':'丁丙甲', '庚_丑':'丙丁甲',
    '辛_寅':'己壬庚', '辛_卯':'壬甲', '辛_辰':'壬甲', '辛_巳':'壬甲癸', '辛_午':'壬己癸', '辛_未':'壬庚甲',
    '辛_申':'壬甲戊', '辛_酉':'壬甲', '辛_戌':'壬甲', '辛_亥':'壬丙', '辛_子':'丙戊壬甲', '辛_丑':'丙壬戊',
    '壬_寅':'庚丙戊', '壬_卯':'戊辛庚', '壬_辰':'甲庚', '壬_巳':'壬庚癸辛', '壬_午':'癸庚辛', '壬_未':'辛甲',
    '壬_申':'戊丁', '壬_酉':'甲庚', '壬_戌':'甲丙', '壬_亥':'戊丙庚', '壬_子':'戊丙', '壬_丑':'丙丁甲',
    '癸_寅':'辛丙', '癸_卯':'庚辛', '癸_辰':'丙辛甲', '癸_巳':'辛', '癸_午':'庚壬癸辛', '癸_未':'庚辛壬癸',
    '癸_申':'丁', '癸_酉':'辛丙', '癸_戌':'辛甲壬癸', '癸_亥':'庚辛戊丁', '癸_子':'丙辛', '癸_丑':'丙丁',
  };

  function selectYongShen(ann, strength) {
    const ds = ann.dayMaster;
    const dsElem = C.stemElement(ds);
    const monthBranch = ann.month.branch;
    const monthQiElem = C.stemElement(C.HIDDEN_STEMS[monthBranch][0]);

    // 调候用神（穷通宝鉴）
    const diaohouKey = `${ds}_${monthBranch}`;
    const diaohouStems = (DIAOHOU[diaohouKey] || '').split('');
    const diaohouElems = [...new Set(diaohouStems.map(s => C.stemElement(s)))];

    // 平衡用神（滴天髓）
    let balanceElems = [];
    let balanceReason = '';
    if (strength.level === 'extreme-strong' || strength.level === 'strong') {
      // 旺者宜泄宜克
      balanceElems = [C.SHENG[dsElem], C.KE[dsElem]];
      balanceReason = '身旺取食伤泄秀、财官克耗为用';
    } else if (strength.level === 'extreme-weak' || strength.level === 'weak') {
      // 弱者宜生宜扶
      const sheng = Object.entries(C.SHENG).find(([k, v]) => v === dsElem)[0]; // 生我者
      balanceElems = [sheng, dsElem];
      balanceReason = '身弱取印星生身、比劫扶身为用';
    } else {
      balanceElems = diaohouElems.slice(0, 2);
      balanceReason = '日主中和，专取月令调候为用';
    }

    return {
      primary: balanceElems,
      diaohou: diaohouElems,
      diaohouStems,
      balanceReason,
      source: strength.level === 'balanced'
        ? '《穷通宝鉴》调候用神 + 《滴天髓》体用论'
        : '《滴天髓·体用》《子平真诠·用神》',
    };
  }

  /* ============================================================
   *  Part 4 · 五行能量统计（带本气/中气/余气权重）
   * ============================================================ */
  function elementBalance(ann) {
    const stems = [ann.year.stem, ann.month.stem, ann.day.stem, ann.hour.stem];
    const branches = [ann.year.branch, ann.month.branch, ann.day.branch, ann.hour.branch];
    const count = { '木':0, '火':0, '土':0, '金':0, '水':0 };
    stems.forEach(s => count[C.stemElement(s)] += 1.0);
    branches.forEach(b => {
      (C.HIDDEN_STEMS[b] || []).forEach((cg, i) => {
        count[C.stemElement(cg)] += [1.2, 0.6, 0.3][i] || 0.3;
      });
    });
    const sorted = Object.entries(count).sort((a, b) => b[1] - a[1]);
    const deficiency = Object.entries(count).filter(([k, v]) => v < 0.5).map(([k]) => k);
    const excess     = Object.entries(count).filter(([k, v]) => v >= 4).map(([k]) => k);
    return { count, sorted, deficiency, excess, dominant: sorted[0][0] };
  }

  /* ============================================================
   *  Part 5 · 性格（日干本质 + 强弱 + 主要十神）
   *  来源：《滴天髓·天干论》《三命通会·论十干所属》
   * ============================================================ */
  const STEM_CHARACTER = {
    '甲': { core: '参天大树，正直进取', traits: ['有主见','开拓','刚直','偶有固执','怕委曲求全'],
            metaphor: '甲为栋梁之木，宁折不弯', source: '《滴天髓》：甲木参天，脱胎要火',
            strengths: ['领导力强','原则性高','执行力佳','值得信赖','心胸开阔'],
            weaknesses: ['偶显固执','不善变通','过于直接易得罪人','耐心不足'],
            color: '青绿', direction: '东', season: '春' },
    '乙': { core: '藤萝花草，柔韧灵巧', traits: ['温和','适应力强','善协调','有韧性','偶显依赖'],
            metaphor: '乙为花草藤萝，刚柔并济', source: '《滴天髓》：乙木虽柔，刲羊解牛',
            strengths: ['情商高','善察人意','有艺术感','韧劲足','人际圆融'],
            weaknesses: ['决断力不足','易随波逐流','内心敏感','缺乏主见时易摇摆'],
            color: '翠绿', direction: '东', season: '春' },
    '丙': { core: '太阳光辉，热情豪迈', traits: ['外向','慷慨','行动力强','急躁','开朗'],
            metaphor: '丙为太阳，一照千里', source: '《滴天髓》：丙火猛烈，欺霜侮雪',
            strengths: ['热情感染力强','慷慨大方','行动力强','光明磊落','善结交朋友'],
            weaknesses: ['脾气直急','缺乏耐心','易得罪人','虎头蛇尾'],
            color: '朱红', direction: '南', season: '夏' },
    '丁': { core: '灯烛之火，细腻深思', traits: ['内敛','温和','体贴','观察入微','偶显多虑'],
            metaphor: '丁为灯烛，照人于暗', source: '《滴天髓》：丁火柔中，内性昭融',
            strengths: ['思虑周密','体贴入微','有人文关怀','适合精细工作','善于陪伴'],
            weaknesses: ['想得太多','易忧郁','缺乏霸气','决断慢'],
            color: '玫红', direction: '南', season: '夏' },
    '戊': { core: '城墙厚土，稳重宽厚', traits: ['踏实','可靠','包容','保守','重信用'],
            metaphor: '戊为高山堤岸，承载万物', source: '《滴天髓》：戊土固重，既中且正',
            strengths: ['稳重可靠','值得托付','胸怀宽广','有定力','是非分明'],
            weaknesses: ['偏保守','反应慢','偶显固执','变通不足'],
            color: '土黄', direction: '中', season: '四季' },
    '己': { core: '田园湿土，柔顺包容', traits: ['温厚','灵活','善积累','内敛','体贴'],
            metaphor: '己为田土，孕育万物', source: '《滴天髓》：己土卑湿，中正蓄藏',
            strengths: ['包容力强','善于经营','耐性好','内敛持重','贵人缘佳'],
            weaknesses: ['优柔寡断','内心戏多','易被牵着走','缺乏锋芒'],
            color: '米黄', direction: '中', season: '四季' },
    '庚': { core: '顽铁刀剑，刚毅决断', traits: ['果断','重义气','直率','好胜','偶显冲动'],
            metaphor: '庚为顽金，需火炼方成器', source: '《滴天髓》：庚金带煞，刚健为最',
            strengths: ['果敢决断','重义讲信','行动力强','有领袖气质','原则性强'],
            weaknesses: ['过于刚硬','易冲动','口直心快','不够柔软'],
            color: '白', direction: '西', season: '秋' },
    '辛': { core: '珠玉首饰，精致敏感', traits: ['细腻','爱美','重品味','敏感','有审美'],
            metaphor: '辛为珠玉，喜润忌火', source: '《滴天髓》：辛金软弱，温润而清',
            strengths: ['品味出众','气质好','心思缜密','审美佳','适合精细行业'],
            weaknesses: ['玻璃心','爱面子','易记仇','过分挑剔'],
            color: '银白', direction: '西', season: '秋' },
    '壬': { core: '江河大水，智慧奔放', traits: ['思维快','变通','不拘小节','胸怀广','偶失专一'],
            metaphor: '壬为汪洋，能容百川', source: '《滴天髓》：壬水通河，能泄金气',
            strengths: ['头脑灵活','善于变通','胸怀宽阔','学习力强','有远见'],
            weaknesses: ['不够专注','变化多端','偶显浮夸','缺乏持久力'],
            color: '玄黑', direction: '北', season: '冬' },
    '癸': { core: '雨露涓流，柔静深思', traits: ['内秀','细致','善思考','温柔','偶显多疑'],
            metaphor: '癸为雨露，润物无声', source: '《滴天髓》：癸水至弱，达于天津',
            strengths: ['细腻聪慧','善于洞察','有研究精神','气质优雅','悟性高'],
            weaknesses: ['易多疑','想得过深','缺乏行动力','情绪化'],
            color: '深蓝', direction: '北', season: '冬' },
  };

  // 十神组合 → 性格综合
  function analyzeShishenComposition(ann) {
    const ds = ann.dayMaster;
    const stems = [ann.year.stem, ann.month.stem, ann.hour.stem];
    const ssArr = stems.map(s => global.ShiShen.getShiShen(ds, s));

    const has = ss => ssArr.includes(ss);
    const count = ss => ssArr.filter(x => x === ss).length;

    const lines = [];
    // 关键组合
    if (has('正官') && has('正印')) lines.push('**官印相生**：贵气格局，得长辈/领导提拔，宜公职、学术');
    if (has('七杀') && has('食神')) lines.push('**食神制杀**：有威信能服众，逆境中反成长，宜军警/管理岗');
    if (has('伤官') && has('正印')) lines.push('**伤官佩印**：才华+涵养兼备，宜文化/创意/教育');
    if (has('伤官') && has('正官')) lines.push('⚠ **伤官见官**：易招是非口舌，需谨言慎行（身强者可化）');
    if (has('正财') && has('正官')) lines.push('**财官双美**：财源稳定+地位上升通道双全');
    if (count('比肩') + count('劫财') >= 2) lines.push('**比劫重重**：朋友多、合作机会多，但财物易破耗，宜防被劫财');
    if (has('食神') && has('正财')) lines.push('**食神生财**：靠口才/才艺/创意致富，财源活络');
    if (has('七杀') && has('正官')) lines.push('**官杀混杂**：多重压力源，宜留官去杀或留杀去官');
    if (count('正印') + count('偏印') >= 2) lines.push('**印星多**：注重精神/学问，物质欲望淡，宜文化研究');
    if (count('正财') + count('偏财') === 0 && count('正官') + count('七杀') === 0) {
      lines.push('**无财无官**：宜走食伤生财之路，靠才艺技能立足，公职路较窄');
    }

    return { lines, ssDistribution: ssArr };
  }

  function describePersonality(ann, strength, pattern) {
    const ds = ann.dayMaster;
    const base = STEM_CHARACTER[ds];

    const modifiers = [];
    if (strength.level === 'extreme-strong' || strength.level === 'strong') {
      modifiers.push('日主强旺，主观意志强、自主性高，凡事愿亲力亲为，需防自我中心');
      modifiers.push('遇事能扛能担，对自己要求高，对他人也容易要求高');
    } else if (strength.level === 'extreme-weak' || strength.level === 'weak') {
      modifiers.push('日主偏弱，性格中带柔顺敏感的一面，凡事易受外界影响，宜借力他人');
      modifiers.push('内心戏丰富，对压力承受较弱，需要支持系统（家庭/伴侣/团队）');
    } else {
      modifiers.push('日主中和，性情较稳，行事进退有度');
      modifiers.push('心态平衡，遇事不易极端，可塑性强');
    }

    // 主要十神倾向
    const stems = [ann.year.stem, ann.month.stem, ann.hour.stem];
    const ssCount = {};
    stems.forEach(s => {
      const ss = global.ShiShen.getShiShen(ds, s);
      ssCount[ss] = (ssCount[ss] || 0) + 1;
    });
    const dominant = Object.entries(ssCount).sort((a, b) => b[1] - a[1])[0];
    if (dominant && dominant[1] >= 2) {
      const ssTrait = {
        '比肩':'重朋友义气、有合作精神，但财物易破耗', '劫财':'敢拼敢闯、行动力强，需防冲动破财',
        '食神':'乐观豁达、有口福才艺，气质温和','伤官':'才华横溢、表现欲强，但易招是非',
        '正财':'勤勉务实、重视积累，理财稳健','偏财':'人缘佳、机变灵活，财来财去',
        '正官':'重纪律责任、循规蹈矩，宜从公职','七杀':'果敢有威、能成大事，但带冲劲',
        '正印':'文雅好学、得长辈助力，慢热稳重','偏印':'思维独特、偏门技艺，常有奇想',
      }[dominant[0]];
      if (ssTrait) modifiers.push(`命中${dominant[0]}重(${dominant[1]}见)：${ssTrait}`);
    }

    // 处事风格（印星 vs 食伤）
    const stemsAll = [ann.year.stem, ann.month.stem, ann.hour.stem];
    const yinCount = stemsAll.filter(s => ['正印','偏印'].includes(global.ShiShen.getShiShen(ds, s))).length;
    const shiShangCount = stemsAll.filter(s => ['食神','伤官'].includes(global.ShiShen.getShiShen(ds, s))).length;
    let workStyle;
    if (yinCount > shiShangCount) workStyle = '思维型：行动前必三思，注重积累与学习，决策稳慎但偶失先机';
    else if (shiShangCount > yinCount) workStyle = '表达型：思路活跃、表达力强、创造力佳，但需防言多必失';
    else workStyle = '均衡型：既能沉淀也能输出，遇事张弛有度';

    return {
      core: base.core, traits: base.traits, metaphor: base.metaphor,
      modifiers, strengths: base.strengths, weaknesses: base.weaknesses,
      workStyle,
      attr: { color: base.color, direction: base.direction, season: base.season },
      sources: [base.source, '《三命通会·论十干》', '《子平真诠》'],
    };
  }

  /* ============================================================
   *  Part 6 · 事业（用神五行 → 行业）
   * ============================================================ */
  const ELEMENT_INDUSTRY = {
    '木': ['教育/培训','文化出版','木材/家具','服装/纺织','医疗/中药','植物/园艺','文创设计'],
    '火': ['电子/电气','互联网/通讯','广告/媒体','餐饮/能源','化工','演艺/直播','装饰美容'],
    '土': ['房地产/建筑','农牧业','陶瓷/矿产','物流仓储','咨询管理','保险','公共事务'],
    '金': ['金融/银行','机械/汽车','五金/珠宝','法律/司法','军警','医疗器械','精密制造'],
    '水': ['物流/贸易','水产/海运','旅游','流体行业(酒水/饮料)','信息/数据','咨询','流动销售'],
  };

  function analyzeCareer(ann, strength, yongShen, pattern) {
    const ds = ann.dayMaster;
    const stemsAll = [ann.year.stem, ann.month.stem, ann.hour.stem];

    const recommended = [];
    yongShen.primary.forEach(e => {
      ELEMENT_INDUSTRY[e].forEach(ind => recommended.push({ elem: e, industry: ind }));
    });
    const dedup = Array.from(new Map(recommended.map(r => [r.industry, r])).values()).slice(0, 12);

    // 公职 vs 创业倾向（官印 vs 食伤财）
    const guanCount = stemsAll.filter(s => ['正官','七杀'].includes(global.ShiShen.getShiShen(ds, s))).length;
    const yinCount  = stemsAll.filter(s => ['正印','偏印'].includes(global.ShiShen.getShiShen(ds, s))).length;
    const caiCount  = stemsAll.filter(s => ['正财','偏财'].includes(global.ShiShen.getShiShen(ds, s))).length;
    const ssCount   = stemsAll.filter(s => ['食神','伤官'].includes(global.ShiShen.getShiShen(ds, s))).length;

    let pathSuggestion;
    if (guanCount >= 1 && yinCount >= 1) {
      pathSuggestion = '【官印格】最宜公职、体制内、教育、医疗、研究机构 — 官印相生有贵气';
    } else if (caiCount >= 2 && ssCount >= 1) {
      pathSuggestion = '【食伤生财】最宜创业、自由职业、技术变现、内容/创意致富';
    } else if (caiCount >= 2 && guanCount === 0) {
      pathSuggestion = '【财旺无官】宜实业经营、商贸、销售，自己当家做主';
    } else if (ssCount >= 2 && caiCount === 0) {
      pathSuggestion = '【食伤无财】宜技术/学术/艺术专精，靠口才/才艺立身，不直接做生意';
    } else if (guanCount >= 2) {
      pathSuggestion = '【官杀重】宜军警/法律/纪检/管理岗，受得了压力者可成大器';
    } else {
      pathSuggestion = '【格局平和】宜专精一域，靠专业能力立足';
    }

    // 团队 vs 独立（比劫多寡）
    const bikeCount = stemsAll.filter(s => ['比肩','劫财'].includes(global.ShiShen.getShiShen(ds, s))).length;
    const teamStyle = bikeCount >= 2 ?
      '比劫旺：人脉广、合作机会多，但也易因伙伴关系生波折，宜明定分工/股权' :
      bikeCount === 0 ?
      '独行型：朋友少、独立性强，宜单干或做团队领导者，不宜合伙' :
      '平衡型：合作独立皆可，关键看大运配合';

    // 晋升机会（官星状态）
    let promotion;
    if (guanCount >= 1) {
      if (yinCount >= 1) promotion = '官印相生：晋升路径清晰，常得贵人提拔，宜守正勿钻营';
      else if (caiCount >= 1) promotion = '财官齐见：财养官，靠资源/业绩争取晋升';
      else promotion = '有官无印：升职后需补"印"（学习/认证），否则后继乏力';
    } else {
      promotion = '原局无显官星：体制内晋升较慢，宜走专业技术路线或自创平台';
    }

    // 职业陷阱（基于忌神）
    const jiElems = ['木','火','土','金','水'].filter(e => !yongShen.primary.includes(e));
    const trapInds = [];
    if (jiElems.length > 0) {
      jiElems.slice(0, 2).forEach(e => trapInds.push(`忌${e}：避开 ${ELEMENT_INDUSTRY[e].slice(0, 3).join('/')} 等行业`));
    }

    const guidance = [];
    guidance.push(`格局：${pattern.name}（${pattern.gist}）`);
    if (strength.level === 'strong' || strength.level === 'extreme-strong') {
      guidance.push('身强者宜从事开拓性、有压力挑战的工作，发挥主导力');
    } else if (strength.level === 'weak' || strength.level === 'extreme-weak') {
      guidance.push('身弱者宜借势成事，从事合作型或依托平台/团队的工作更宜');
    } else {
      guidance.push('中和者适应面广，专精一域则更易出成绩');
    }

    return {
      recommended: dedup, guidance, pattern: pattern.name,
      pathSuggestion, teamStyle, promotion, trapInds,
      sources: ['《子平真诠·论格局》','《渊海子平·五行喜忌》',pattern.source],
    };
  }

  /* ============================================================
   *  Part 7 · 感情/婚姻
   *    男看妻星(正财) 妻宫(日支)
   *    女看夫星(正官/七杀) 夫宫(日支)
   * ============================================================ */
  function analyzeMarriage(ann, gender) {
    const ds = ann.dayMaster;
    const dsElem = C.stemElement(ds);
    const isMale = gender === 'male';

    // 配偶星五行
    const spouseStarElem = isMale ? C.KE[dsElem] : Object.entries(C.KE).find(([k, v]) => v === dsElem)[0];
    const spouseStarName = isMale ? '正/偏财' : '正官/七杀';

    // 在八字中寻找配偶星
    const allStems = [ann.year.stem, ann.month.stem, ann.hour.stem];
    const found = allStems.filter(s => C.stemElement(s) === spouseStarElem);

    // 日支 = 配偶宫
    const spousePalace = ann.day.branch;
    const palaceElem = C.branchElement(spousePalace);
    const palaceSS = global.ShiShen.getShiShen(ds, C.HIDDEN_STEMS[spousePalace][0]);

    const points = [];
    if (found.length === 0) {
      points.push(`命中无显见${spouseStarName}，配偶星藏于地支，姻缘多隐而后显`);
    } else if (found.length >= 2) {
      points.push(`命中${spouseStarName}两见以上，感情多波折或选择多`);
    } else {
      points.push(`命中${spouseStarName}有现，姻缘较为清晰`);
    }

    // 日支与配偶宫
    const palaceCharMap = {
      '比肩':'配偶宫为比劫，伴侣性情与己相近，宜平等相处',
      '劫财':'配偶宫为劫财，需防因财生隙',
      '食神':'配偶宫为食神，伴侣温和体贴，家庭氛围轻松',
      '伤官':'配偶宫为伤官，伴侣个性强、有才华，需互相包容',
      '正财':'配偶宫为正财，男命主贤妻，女命家计稳健',
      '偏财':'配偶宫为偏财，伴侣活泼有人缘',
      '正官':'配偶宫为正官，女命主良缘正配，男命子嗣可期',
      '七杀':'配偶宫为七杀，伴侣个性强烈，需注意冲突',
      '正印':'配偶宫为正印，伴侣文雅可依靠，家庭温馨',
      '偏印':'配偶宫为偏印，相处偶感疏离，宜多沟通',
    };
    if (palaceCharMap[palaceSS]) points.push(palaceCharMap[palaceSS]);

    // 日支被冲 → 婚姻易动
    const palaceChong = C.LIU_CHONG.some(p => p.includes(spousePalace) &&
      [ann.year.branch, ann.month.branch, ann.hour.branch].some(b => p.includes(b) && b !== spousePalace));
    if (palaceChong) points.push('⚠ 日支(夫妻宫)受冲，主婚姻有波动、聚少离多或晚婚');
    // 日支与时支六合 → 感情和睦
    if (C.LIU_HE.some(r => r.branches.includes(spousePalace) && r.branches.includes(ann.hour.branch))) {
      points.push('日时支六合，夫妻宫与子女宫和谐，家庭氛围佳');
    }

    // ============ 桃花详细 ============
    const allBranches = [ann.year.branch, ann.month.branch, ann.day.branch, ann.hour.branch];
    const taohuaY = C.TAO_HUA[ann.year.branch];
    const taohuaD = C.TAO_HUA[ann.day.branch];
    const peachPoints = [];
    if (allBranches.includes(taohuaY)) {
      const pos = ['年','月','日','时'][allBranches.indexOf(taohuaY)];
      peachPoints.push(`年支桃花在${pos}支(${taohuaY})${pos === '日' || pos === '时' ? '：内桃花，主夫妻恩爱' : '：外桃花，异性缘旺'}`);
    }
    if (taohuaD !== taohuaY && allBranches.includes(taohuaD)) {
      const pos = ['年','月','日','时'][allBranches.indexOf(taohuaD)];
      peachPoints.push(`日支桃花在${pos}支(${taohuaD})`);
    }
    if (peachPoints.length === 0) peachPoints.push('命无明显桃花，感情发展较平实');

    // ============ 伴侣特征 ============
    const spouseTraits = [];
    const spouseElemTraits = {
      '木': '身材高瘦/挺拔，性格直率，多从事文教/医疗/木业',
      '火': '气色红润、热情外向，多从事电子/媒体/餐饮',
      '土': '身材敦实、稳重诚信，多从事地产/农业/管理',
      '金': '五官清秀、气质冷静，多从事金融/法律/技术',
      '水': '聪明灵活、思维敏捷，多从事贸易/物流/服务',
    };
    spouseTraits.push(spouseElemTraits[spouseStarElem]);
    // 看配偶星所在柱
    const spouseStarPos = ['年','月','时'].filter((_, i) =>
      C.stemElement(allStems[i]) === spouseStarElem);
    if (spouseStarPos.length) {
      const posDesc = { '年':'年柱(出现早/年长一些)', '月':'月柱(同辈/工作相识)', '时':'时柱(晚婚/年纪小一些)' };
      spouseTraits.push(`配偶星出现在${spouseStarPos.map(p => posDesc[p]).join('、')}`);
    }

    // ============ 婚期判断 ============
    const marriageWindow = [];
    if (isMale) {
      marriageWindow.push('男命婚期通常出现在：① 财星到位的大运 ② 日支被合住的流年 ③ 食神生财之年');
    } else {
      marriageWindow.push('女命婚期通常出现在：① 官杀到位的大运 ② 日支被合住的流年 ③ 财生官之年');
    }
    if (palaceChong) marriageWindow.push('⚠ 夫妻宫受原局冲，宜晚婚（30岁后）以缓刑冲');
    if (peachPoints.length && peachPoints[0].indexOf('内桃花') >= 0) marriageWindow.push('内桃花主早恋成家');

    // ============ 相处建议 ============
    const adviceMap = {
      '木': '伴侣偏直率，宜以柔克刚，多沟通',
      '火': '伴侣热情但易冲动，宜以冷静中和',
      '土': '伴侣稳重但保守，宜带其多体验新事物',
      '金': '伴侣果断但偏硬，宜温柔包容',
      '水': '伴侣聪明但善变，宜给其空间',
    };
    const advice = [adviceMap[spouseStarElem]];

    return {
      spouseStarName, spouseStarElem, found: found.length,
      spousePalace, palaceSS, palaceChong,
      points, peachPoints, spouseTraits, marriageWindow, advice,
      sources: ['《渊海子平·六亲论》','《三命通会·论妻财》','《子平真诠·论六亲》','《神峰通考·桃花》'],
    };
  }

  /* ============================================================
   *  Part 8 · 财运
   * ============================================================ */
  function analyzeWealth(ann, strength) {
    const ds = ann.dayMaster;
    const dsElem = C.stemElement(ds);
    const wealthElem = C.KE[dsElem];

    // 财星分布
    const stemsAll = [ann.year.stem, ann.month.stem, ann.hour.stem];
    const hiddenAll = [].concat(...[ann.year.branch, ann.month.branch, ann.day.branch, ann.hour.branch]
                                     .map(b => C.HIDDEN_STEMS[b]));

    // 区分正/偏财
    let zhengCaiCount = 0, pianCaiCount = 0;
    [...stemsAll, ...hiddenAll].forEach(s => {
      const ss = global.ShiShen.getShiShen(ds, s);
      if (ss === '正财') zhengCaiCount++;
      else if (ss === '偏财') pianCaiCount++;
    });

    const points = [];
    points.push(`命中财星(${wealthElem}) — 正财${zhengCaiCount}处、偏财${pianCaiCount}处`);

    if (strength.level === 'strong' || strength.level === 'extreme-strong') {
      if (zhengCaiCount + pianCaiCount >= 2) {
        points.push('身强财旺：主自身能任财，财源较稳，宜实业、投资');
      } else {
        points.push('身强财弱：能力有余但财源欠缺，宜借食伤生财，靠才艺技术挣钱');
      }
    } else if (strength.level === 'weak' || strength.level === 'extreme-weak') {
      if (zhengCaiCount + pianCaiCount >= 3) {
        points.push('身弱财多：财多身弱，反为财所累，宜稳健不冒进，忌投机');
      } else {
        points.push('身弱财不旺：宜先扶身（取印比之运），财运随大运转');
      }
    } else {
      points.push('身财平衡：财运稳健，宜按步取财');
    }

    // ============ 财源类型 ============
    let source;
    if (zhengCaiCount > pianCaiCount * 2) {
      source = '【正财为主】财源稳定 — 工资/固定收入/合同型回报为主，宜守不宜攻';
    } else if (pianCaiCount > zhengCaiCount * 2) {
      source = '【偏财为主】财源活泛 — 副业/投资/商机/意外财较多，但波动大';
    } else if (zhengCaiCount && pianCaiCount) {
      source = '【正偏财兼有】既有固定收入又有外快机会，财源多元化';
    } else if (zhengCaiCount + pianCaiCount === 0) {
      source = '【命无显财】财不外露，需靠食伤(才艺/技术)间接生财';
    } else {
      source = `【${zhengCaiCount ? '正财' : '偏财'}单透】单一财源，宜专精`;
    }

    // ============ 消耗模式（破财预警） ============
    const leaks = [];
    const bikeCount = [...stemsAll, ...hiddenAll].filter(s => ['比肩','劫财'].includes(global.ShiShen.getShiShen(ds, s))).length;
    if (bikeCount >= 3) leaks.push('比劫重叠：兄弟朋友/合伙人易耗财，宜分账清晰、慎合伙');
    const guanShaCount = [...stemsAll, ...hiddenAll].filter(s => ['正官','七杀'].includes(global.ShiShen.getShiShen(ds, s))).length;
    if (guanShaCount >= 3 && strength.level.includes('weak')) leaks.push('身弱官杀重：财耗于压力性支出(房贷/医疗/法律)，宜控制');
    if (leaks.length === 0) leaks.push('原局无明显破财结构，正常理财即可');

    // ============ 食伤生财 ============
    const foodElem = C.SHENG[dsElem];
    const hasFoodGen = stemsAll.some(s => C.stemElement(s) === foodElem) ||
                       hiddenAll.some(s => C.stemElement(s) === foodElem);
    const generationLine = hasFoodGen
      ? '有食伤生财：财来源活，宜以才艺/技术/创意致富，靠"输出"赚钱'
      : '无食伤生财：财靠正职/积累，不宜走"创作变现"路线';

    // ============ 致富方式建议 ============
    let method;
    if (strength.level.includes('strong') && (zhengCaiCount + pianCaiCount) >= 2) {
      method = '上策：自立门户、亲自掌财，可走实业/投资/资源整合';
    } else if (strength.level.includes('strong')) {
      method = '上策：以技术/才艺为依托，先打磨能力，再变现';
    } else if (strength.level.includes('weak') && (zhengCaiCount + pianCaiCount) >= 2) {
      method = '上策：依托大平台/与有印星贵人合作，避免独自操盘';
    } else {
      method = '上策：积少成多、稳步发展，避免一夜暴富心态';
    }

    return {
      points, wealthElem, zhengCaiCount, pianCaiCount,
      source, leaks, generationLine, method,
      sources: ['《渊海子平·论财》','《子平真诠·论财》','《滴天髓·财》'],
    };
  }

  /* ============================================================
   *  Part 9 · 健康（五行偏枯 → 脏腑提示）
   *  来源：《黄帝内经·五行对应脏腑》《渊海子平·疾病论》
   * ============================================================ */
  const ELEMENT_ORGAN = {
    '木': '肝胆、神经、筋骨',
    '火': '心脏、小肠、血液、视力',
    '土': '脾胃、消化、肌肉',
    '金': '肺、大肠、呼吸、皮肤',
    '水': '肾、膀胱、泌尿、骨髓',
  };

  // 五行 → 调养建议
  const ELEMENT_REMEDY = {
    '木': {
      diet: '宜青色食物（菠菜/西兰花/猕猴桃），疏肝理气；忌过度饮酒、熬夜',
      sport: '宜舒展类（瑜伽/拉伸/快走），舒筋活络；忌过度久坐',
      mood: '木主怒，宜常出户外、亲近绿植，避免长期憋闷生气',
    },
    '火': {
      diet: '宜红色食物（番茄/红枣/枸杞），养心安神；忌过辣过咸',
      sport: '宜有氧（慢跑/游泳/球类），促进血液循环；忌剧烈对抗运动',
      mood: '火主喜，宜适度社交，避免大喜大怒，保持心境平和',
    },
    '土': {
      diet: '宜黄色食物（南瓜/小米/玉米），健脾养胃；忌生冷、暴饮暴食',
      sport: '宜规律性运动（太极/散步/八段锦），不在求强；忌剧烈',
      mood: '土主思，宜避免过度思虑，多动手做实事少空想',
    },
    '金': {
      diet: '宜白色食物（白萝卜/银耳/百合/梨），润肺养颜；忌辛辣燥热',
      sport: '宜呼吸训练（瑜伽/冥想/慢跑），增强肺活量；空气好的地方运动',
      mood: '金主悲，宜避免过度忧虑/悲伤，多接触阳光与温暖人群',
    },
    '水': {
      diet: '宜黑色食物（黑芝麻/黑豆/黑米/海带），滋肾乌发；忌过咸',
      sport: '宜温和持久型（游泳/慢跑/骑行），强肾固本；冬季宜室内',
      mood: '水主恐，宜避免长期压力/恐惧情绪，多寻安全感来源',
    },
  };

  function analyzeHealth(ann, balance, yongShen) {
    const points = [];
    const remedies = [];
    if (balance.deficiency.length > 0) {
      balance.deficiency.forEach(e => {
        points.push(`五行${e}偏弱：${ELEMENT_ORGAN[e]} 系统宜多养护`);
        remedies.push({ elem: e, type: '补', ...ELEMENT_REMEDY[e] });
      });
    }
    if (balance.excess.length > 0) {
      balance.excess.forEach(e => {
        points.push(`五行${e}偏旺：${ELEMENT_ORGAN[e]} 易因偏亢生疾`);
      });
    }
    if (points.length === 0) points.push('五行较均衡，健康基础良好');

    // 季节注意
    const dsElem = C.stemElement(ann.dayMaster);
    const seasonMap = {
      '木': '春季当令身体精神俱佳；秋季金克木，易疲劳/筋骨不适，宜静养',
      '火': '夏季当令活力充沛；冬季水克火，易畏寒/心血管不适，宜温补',
      '土': '四季中转月（辰戌丑未月）较舒；春季木克土，易脾胃不适',
      '金': '秋季当令；夏季火克金，易呼吸/皮肤问题，宜清淡',
      '水': '冬季当令；长夏（夏末初秋）土克水，易泌尿/腰背不适',
    };
    const seasonalNote = seasonMap[dsElem];

    return { points, remedies, seasonalNote, sources: ['《黄帝内经·五行》','《渊海子平·论疾病》'] };
  }

  /* ============================================================
   *  Part 10 · 流年综合分析（增强版）
   * ============================================================ */
  function analyzeLiunian(ann, dayun, liunian, yongShen, strength) {
    const ds = ann.dayMaster;
    const lnStemSS = global.ShiShen.getShiShen(ds, liunian.stem);
    const lnBranchQi = C.HIDDEN_STEMS[liunian.branch][0];
    const lnBranchSS = global.ShiShen.getShiShen(ds, lnBranchQi);
    const lnStemElem = C.stemElement(liunian.stem);
    const lnBranchElem = C.branchElement(liunian.branch);

    // 是否为喜用
    const lnIsYongStem  = yongShen.primary.includes(lnStemElem);
    const lnIsYongBranch = yongShen.primary.includes(lnBranchElem);
    let tier;
    if (lnIsYongStem && lnIsYongBranch)       tier = { label: '上吉', tone: 'good' };
    else if (lnIsYongStem || lnIsYongBranch)   tier = { label: '吉', tone: 'good' };
    else if (yongShen.primary.length && !lnIsYongStem && !lnIsYongBranch) {
      const yongElem = yongShen.primary[0];
      if (C.KE[lnStemElem] === yongElem || C.KE[lnBranchElem] === yongElem) tier = { label: '凶', tone: 'bad' };
      else tier = { label: '平', tone: 'neutral' };
    } else tier = { label: '平', tone: 'neutral' };

    const lines = [];
    lines.push(`流年 ${liunian.stem}${liunian.branch}：天干${lnStemSS}临地支${lnBranchSS}，五行${lnStemElem}${lnBranchElem}`);

    const ssMeaning = {
      '比肩':'同辈互动多，宜合作；防破财',
      '劫财':'竞争压力大，需防小人破财',
      '食神':'有口福、有才艺发挥，心情舒畅',
      '伤官':'才华彰显但易招是非，宜低调',
      '正财':'正财稳进，工作回报佳',
      '偏财':'偏门进财、人缘广，机会多',
      '正官':'事业贵人现，有晋升或考试机',
      '七杀':'压力骤增，宜化为动力；防意外',
      '正印':'长辈/学业/文书有助力',
      '偏印':'宜深造/学习偏门技艺，防情绪起伏',
    };
    if (ssMeaning[lnStemSS]) lines.push(`流年天干${liunian.stem}主：${ssMeaning[lnStemSS]}`);

    // 与四柱关系
    const positions = global.Relations.chartToPositions(ann, null, liunian);
    const allRels = global.Relations.analyzeRelations(positions);
    const lnRels = allRels.filter(r => {
      const ms = r.members || [r.a, r.b];
      return ms.some(m => m && m.key === 'liunian');
    });
    lnRels.forEach(r => {
      if (r.suppressed) return;
      const tag = r.kind === 'he' || r.kind === 'sanhe' ? '合' : (r.kind === 'chong' ? '冲' : r.kind === 'xing' ? '刑' : '害');
      lines.push(`流年与原局：${r.desc} → ${tag === '合' ? '关系顺遂' : tag === '冲' ? '事多变动' : tag === '刑' ? '宜防口舌官非' : '小有摩擦'}`);
    });

    // ============ 各维度运势细分 ============
    const subAspects = {};
    // 事业运
    if (['正官','七杀'].includes(lnStemSS)) {
      subAspects.career = ['七杀'].includes(lnStemSS) ? '事业压力大、考验多，能挺住则上一台阶' : '事业贵人到位，有晋升/合作机会';
    } else if (['食神','伤官'].includes(lnStemSS)) {
      subAspects.career = '才华表现年，宜专注作品/项目，避免与上级冲突';
    } else if (['正印','偏印'].includes(lnStemSS)) {
      subAspects.career = '学习/进修/调岗之年，宜充电不宜激进';
    } else if (['正财','偏财'].includes(lnStemSS)) {
      subAspects.career = '业务/销售年，财源在外，宜走动谈合作';
    } else {
      subAspects.career = '同辈关系活跃，宜合作或团队作战';
    }

    // 财运
    if (['正财','偏财'].includes(lnStemSS) || ['正财','偏财'].includes(lnBranchSS)) {
      subAspects.wealth = (strength.level.includes('strong'))
        ? '财星临门，身能任财，主进财 — 正业偏业兼旺'
        : '财来需谨慎，身弱财多反易破，宜稳健';
    } else if (['比肩','劫财'].includes(lnStemSS)) {
      subAspects.wealth = '⚠ 比劫年，主财物易破或被分，慎借贷/合伙投资';
    } else {
      subAspects.wealth = '财运平稳，按部就班即可';
    }

    // 感情运
    const hasHe = lnRels.some(r => r.kind === 'he' && !r.suppressed && (r.a && r.b && (r.a.key === 'day' || r.b.key === 'day')));
    const hasDayChong = lnRels.some(r => r.kind === 'chong' && !r.suppressed && (r.a && r.b && (r.a.key === 'day' || r.b.key === 'day')));
    if (hasHe) subAspects.love = '流年合到日支，主感情升温/有发展机会，未婚者宜把握';
    else if (hasDayChong) subAspects.love = '⚠ 流年冲日支，感情易动荡，已婚者宜多沟通，未婚者宜慎选';
    else if (C.TAO_HUA[ann.year.branch] === liunian.branch || C.TAO_HUA[ann.day.branch] === liunian.branch) {
      subAspects.love = '流年带桃花，异性缘旺、人际活络';
    } else subAspects.love = '感情运平稳，无明显波澜';

    // 健康运
    const lnKeMe = C.KE[lnStemElem] === C.stemElement(ds) || C.KE[lnBranchElem] === C.stemElement(ds);
    if (lnKeMe && strength.level.includes('weak')) {
      subAspects.health = '⚠ 流年克身且身弱，注意休息，宜定期体检';
    } else if (lnRels.some(r => r.kind === 'chong' && !r.suppressed)) {
      subAspects.health = '流年冲动，宜防意外/交通/急性疾病';
    } else {
      subAspects.health = '健康基本平稳';
    }

    // ============ 月份提示（12 流月概况 — 看流月十神） ============
    const monthlyHints = [];
    const monthBranches = ['寅','卯','辰','巳','午','未','申','酉','戌','亥','子','丑'];
    const monthNames    = ['正月','二月','三月','四月','五月','六月','七月','八月','九月','十月','冬月','腊月'];
    monthBranches.forEach((mb, i) => {
      const qi = C.HIDDEN_STEMS[mb][0];
      const ss = global.ShiShen.getShiShen(ds, qi);
      const elem = C.branchElement(mb);
      const isYong = yongShen.primary.includes(elem);
      monthlyHints.push({ month: monthNames[i], branch: mb, shishen: ss,
                          tone: isYong ? 'good' : (C.KE[elem] === C.stemElement(ds) ? 'bad' : 'neutral') });
    });

    // 综合建议
    const advice = [];
    if (tier.tone === 'good') {
      advice.push('整体走势有利，宜主动出击、把握机会');
      advice.push('上半年宜规划布局，下半年宜兑现');
    } else if (tier.tone === 'bad') {
      advice.push('运势承压，宜守不宜攻，多协调少冒进');
      advice.push('忌大额投资、远行、签新约；宜补元气（用神五行的食物/方位/颜色）');
    } else {
      advice.push('平稳之年，按部就班即可，宜储备实力');
      advice.push('适合调整、学习、修复，不宜大动作');
    }

    return {
      tier, lines, advice, lnRels, subAspects, monthlyHints,
      lnStemSS, lnBranchSS,
      sources: ['《滴天髓·岁运》','《子平真诠·论行运》','《三命通会·岁君》'],
    };
  }

  /* ============================================================
   *  对外
   * ============================================================ */
  global.Fortune = {
    computeStrength, judgePattern, selectYongShen,
    elementBalance, describePersonality, analyzeShishenComposition,
    analyzeCareer, analyzeMarriage, analyzeWealth, analyzeHealth,
    analyzeLiunian,
    CITATIONS: {
      '子平真诠': '清·沈孝瞻著，格局论核心',
      '滴天髓':   '相传刘伯温撰、任铁樵注，论体用旺衰',
      '穷通宝鉴': '清·余春台辑，调候用神之祖',
      '渊海子平': '宋·徐大升撰，命理体系奠基',
      '三命通会': '明·万民英撰，命理大全',
    },
  };
})(window);
