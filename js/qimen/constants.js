/* ============================================================
 *  奇门遁甲常量定义
 *  来源：《奇门遁甲秘笈》《奇门遁甲全书》
 * ============================================================ */
(function (global) {
  'use strict';

  const QM = {};

  // ===== 九宫 =====
  QM.PALACES = [
    { key: 'kan', name: '坎一宫', number: 1, direction: '北', element: '水', trigram: '坎' },
    { key: 'kun', name: '坤二宫', number: 2, direction: '西南', element: '土', trigram: '坤' },
    { key: 'zhen', name: '震三宫', number: 3, direction: '东', element: '木', trigram: '震' },
    { key: 'xun', name: '巽四宫', number: 4, direction: '东南', element: '木', trigram: '巽' },
    { key: 'zhong', name: '中五宫', number: 5, direction: '中', element: '土', trigram: '中' },
    { key: 'qian', name: '乾六宫', number: 6, direction: '西北', element: '金', trigram: '乾' },
    { key: 'dui', name: '兑七宫', number: 7, direction: '西', element: '金', trigram: '兑' },
    { key: 'gen', name: '艮八宫', number: 8, direction: '东北', element: '土', trigram: '艮' },
    { key: 'li', name: '离九宫', number: 9, direction: '南', element: '火', trigram: '离' },
  ];

  // ===== 九星 =====
  QM.NINE_STARS = [
    { key: 'tianpeng', name: '天蓬', element: '水', nature: '凶', meaning: '盗贼、欺诈、暗昧、智谋' },
    { key: 'tianrui', name: '天芮', element: '土', nature: '凶', meaning: '疾病、问题、学习、柔弱' },
    { key: 'tianchong', name: '天冲', element: '木', nature: '吉', meaning: '冲动、冲突、行动、突破' },
    { key: 'tianfu', name: '天辅', element: '木', nature: '吉', meaning: '辅助、教育、贵人、文化' },
    { key: 'tianqin', name: '天禽', element: '土', nature: '吉', meaning: '中正、稳定、权威、协调' },
    { key: 'tianxin', name: '天心', element: '金', nature: '吉', meaning: '心计、谋划、医疗、贵人' },
    { key: 'tianzhu', name: '天柱', element: '金', nature: '凶', meaning: '破坏、变革、口舌、独断' },
    { key: 'tianren', name: '天任', element: '土', nature: '吉', meaning: '任劳任怨、稳定、忠诚' },
    { key: 'tianying', name: '天英', element: '火', nature: '凶', meaning: '英豪、名声、火灾、急躁' },
  ];

  // ===== 八门 =====
  QM.EIGHT_GATES = [
    { key: 'xiumen', name: '休门', element: '水', nature: '吉', meaning: '休息、养生、退休、等待', direction: '北' },
    { key: 'shengmen', name: '生门', element: '土', nature: '吉', meaning: '生机、财富、生育、新生', direction: '东北' },
    { key: 'shangmen', name: '伤门', element: '木', nature: '凶', meaning: '伤害、破坏、变动、竞争', direction: '东' },
    { key: 'dumen', name: '杜门', element: '木', nature: '中', meaning: '阻塞、隐藏、修炼、技术', direction: '东南' },
    { key: 'jingmen', name: '景门', element: '火', nature: '中', meaning: '景象、文书、考试、谋略', direction: '南' },
    { key: 'simen', name: '死门', element: '土', nature: '凶', meaning: '死亡、结束、固定、不变', direction: '西南' },
    { key: 'jingmen2', name: '惊门', element: '金', nature: '凶', meaning: '惊恐、口舌、是非、官司', direction: '西' },
    { key: 'kaimen', name: '开门', element: '金', nature: '吉', meaning: '开放、事业、官职、出行', direction: '西北' },
  ];

  // ===== 八神 =====
  QM.EIGHT_GODS = [
    { key: 'zhi fu', name: '值符', nature: '吉', meaning: '贵人、领导、权威、正道' },
    { key: 'teng she', name: '腾蛇', nature: '凶', meaning: '虚惊、怪异、变化、欺诈' },
    { key: 'tai yin', name: '太阴', nature: '吉', meaning: '阴私、隐蔽、女性、谋略' },
    { key: 'liu he', name: '六合', nature: '吉', meaning: '和合、婚姻、合作、成交' },
    { key: 'bai hu', name: '白虎', nature: '凶', meaning: '凶猛、争斗、血光、道路' },
    { key: 'xuan wu', name: '玄武', nature: '凶', meaning: '盗贼、暗昧、小人、欺骗' },
    { key: 'jiu di', name: '九地', nature: '吉', meaning: '稳固、低调、防守、积蓄' },
    { key: 'jiu tian', name: '九天', nature: '吉', meaning: '高远、张扬、进攻、志向' },
  ];

  // ===== 天干 =====
  QM.STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];

  // ===== 地支 =====
  QM.BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

  // ===== 三奇 =====
  QM.SANQI = [
    { stem: '乙', name: '日奇', meaning: '文官、贵人、柔和、谋略' },
    { stem: '丙', name: '月奇', meaning: '武官、权威、光明、刚强' },
    { stem: '丁', name: '星奇', meaning: '玄学、艺术、女性、灵感' },
  ];

  // ===== 六仪 =====
  QM.LIUYI = ['戊', '己', '庚', '辛', '壬', '癸'];

  // ===== 遁甲（六甲藏于六仪）=====
  QM.DUNJIA = {
    '甲子': '戊',
    '甲戌': '己',
    '甲申': '庚',
    '甲午': '辛',
    '甲辰': '壬',
    '甲寅': '癸',
  };

  // ===== 阴阳遁 =====
  // 根据节气确定用阴遁还是阳遁
  // 阳遁：冬至 → 芒种（顺布六仪）
  // 阴遁：夏至 → 大雪（逆布六仪）
  QM.YANG_DUN_TERMS = ['冬至', '小寒', '大寒', '立春', '雨水', '惊蛰', '春分', '清明', '谷雨', '立夏', '小满', '芒种'];
  QM.YIN_DUN_TERMS = ['夏至', '小暑', '大暑', '立秋', '处暑', '白露', '秋分', '寒露', '霜降', '立冬', '小雪', '大雪'];

  // ===== 局数表 =====
  // 根据节气和日干支确定局数
  QM.JU_TABLE = {
    '冬至': [1, 7, 4, 1, 7, 4, 1, 7, 4, 2, 8, 5], // 冬至上元、中元、下元
    '小寒': [2, 8, 5],
    '大寒': [3, 9, 6],
    '立春': [8, 5, 2],
    '雨水': [9, 6, 3],
    '惊蛰': [1, 7, 4],
    '春分': [3, 9, 6],
    '清明': [4, 1, 7],
    '谷雨': [5, 2, 8],
    '立夏': [4, 1, 7],
    '小满': [5, 2, 8],
    '芒种': [6, 3, 9],
    '夏至': [9, 3, 6],
    '小暑': [8, 2, 5],
    '大暑': [7, 1, 4],
    '立秋': [2, 5, 8],
    '处暑': [1, 4, 7],
    '白露': [9, 3, 6],
    '秋分': [7, 1, 4],
    '寒露': [6, 9, 3],
    '霜降': [5, 8, 2],
    '立冬': [6, 9, 3],
    '小雪': [5, 8, 2],
    '大雪': [4, 7, 1],
  };

  // ===== 宫位与九宫数对应 =====
  QM.PALACE_NUMBER = {
    '坎': 1, '坤': 2, '震': 3, '巽': 4, '中': 5,
    '乾': 6, '兑': 7, '艮': 8, '离': 9
  };

  // ===== 九星原始宫位 =====
  QM.STAR_ORIGINAL_PALACE = {
    '天蓬': 1, '天芮': 2, '天冲': 3, '天辅': 4, '天禽': 5,
    '天心': 6, '天柱': 7, '天任': 8, '天英': 9
  };

  // ===== 八门原始宫位 =====
  QM.GATE_ORIGINAL_PALACE = {
    '休门': 1, '生门': 8, '伤门': 3, '杜门': 4,
    '景门': 9, '死门': 2, '惊门': 7, '开门': 6
  };

  // ===== 格局定义 =====
  QM.PATTERNS = [
    {
      name: '青龙回首',
      condition: (plate) => plate.heavenPlate[1]?.stem === '戊' && plate.earthPlate[1]?.stem === '丙',
      effect: '大吉，百事皆宜，贵人相助',
      tier: '上上格'
    },
    {
      name: '飞鸟跌穴',
      condition: (plate) => plate.heavenPlate[1]?.stem === '丙' && plate.earthPlate[1]?.stem === '戊',
      effect: '大吉，求财求官皆利',
      tier: '上上格'
    },
    {
      name: '三奇得使',
      condition: (plate) => {
        const hps = plate.heavenPlate;
        return Object.values(hps).some(p => ['乙', '丙', '丁'].includes(p?.stem));
      },
      effect: '贵人助力，事业顺遂',
      tier: '上格'
    },
    {
      name: '吉门遇三奇',
      condition: (plate) => {
        return Object.entries(plate.palaces).some(([k, p]) => {
          const isGoodGate = ['开门', '休门', '生门'].includes(p.gate);
          const hasSanqi = ['乙', '丙', '丁'].includes(p.heavenStem);
          return isGoodGate && hasSanqi;
        });
      },
      effect: '遇事顺利，贵人扶持',
      tier: '上格'
    },
    {
      name: '凶门遇三奇',
      condition: (plate) => {
        return Object.entries(plate.palaces).some(([k, p]) => {
          const isBadGate = ['死门', '惊门', '伤门'].includes(p.gate);
          const hasSanqi = ['乙', '丙', '丁'].includes(p.heavenStem);
          return isBadGate && hasSanqi;
        });
      },
      effect: '逢凶化吉，险中有救',
      tier: '中格'
    },
    {
      name: '奇仪相合',
      condition: (plate) => {
        return Object.values(plate.palaces).some(p => p.heavenStem === p.earthStem);
      },
      effect: '天地盘干相合，诸事顺遂',
      tier: '中格'
    },
    {
      name: '门迫',
      condition: (plate) => {
        return Object.entries(plate.palaces).some(([k, p]) => {
          const gate = QM.EIGHT_GATES.find(g => g.name === p.gate);
          const palace = QM.PALACES.find(pal => pal.trigram === k || pal.key === k);
          if (!gate || !palace) return false;
          // 门迫：门克宫
          const gateElement = gate.element;
          const palaceElement = palace.element;
          return (gateElement === '木' && palaceElement === '土') ||
                 (gateElement === '土' && palaceElement === '水') ||
                 (gateElement === '水' && palaceElement === '火') ||
                 (gateElement === '火' && palaceElement === '金') ||
                 (gateElement === '金' && palaceElement === '木');
        });
      },
      effect: '门迫宫不利，主事情受阻',
      tier: '下格'
    },
    {
      name: '入墓',
      condition: (plate) => {
        return Object.values(plate.palaces).some(p => {
          return ['乙', '丙', '丁'].includes(p.heavenStem) && p.palaceNumber === 2;
        });
      },
      effect: '三奇入墓，威力减弱',
      tier: '下格'
    },
  ];

  // ===== 时辰旬头 =====
  function get旬头(stem, branch) {
    const stemIdx = QM.STEMS.indexOf(stem);
    const branchIdx = QM.BRANCHES.indexOf(branch);
    // 六甲旬头
    const旬头s = ['甲子', '甲戌', '甲申', '甲午', '甲辰', '甲寅'];
    const旬头Branches = [['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉'],
                         ['戌', '亥', '子', '丑', '寅', '卯', '辰', '巳', '午', '未'],
                         ['申', '酉', '戌', '亥', '子', '丑', '寅', '卯', '辰', '巳'],
                         ['午', '未', '申', '酉', '戌', '亥', '子', '丑', '寅', '卯'],
                         ['辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑'],
                         ['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']];
    for (let i = 0; i < 6; i++) {
      if (旬头Branches[i].includes(branch)) {
        return旬头s[i];
      }
    }
    return '甲子';
  }

  // ===== 根据旬头找旬首 =====
  function get旬首值符(xuntou) {
    return QM.DUNJIA[xuntou] || '戊';
  }

  QM.get旬头 = get旬头;
  QM.get旬首值符 = get旬首值符;

  global.QMConst = QM;
})(window);
