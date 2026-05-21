/* ============================================================
 *  八字基础常量表（数据驱动，避免硬编码到逻辑里）
 * ============================================================ */
(function (global) {
  'use strict';

  const STEMS    = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
  const BRANCHES = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];

  const STEM_ELEMENTS    = ['木','木','火','火','土','土','金','金','水','水'];
  const STEM_YINYANG     = ['阳','阴','阳','阴','阳','阴','阳','阴','阳','阴'];

  const BRANCH_ELEMENTS  = ['水','土','木','木','土','火','火','土','金','金','土','水'];
  const BRANCH_YINYANG   = ['阳','阴','阳','阴','阳','阴','阳','阴','阳','阴','阳','阴'];
  const BRANCH_ZODIAC    = ['鼠','牛','虎','兔','龙','蛇','马','羊','猴','鸡','狗','猪'];

  // 地支藏干（顺序：本气、中气、余气）
  const HIDDEN_STEMS = {
    '子': ['癸'],
    '丑': ['己','癸','辛'],
    '寅': ['甲','丙','戊'],
    '卯': ['乙'],
    '辰': ['戊','乙','癸'],
    '巳': ['丙','戊','庚'],
    '午': ['丁','己'],
    '未': ['己','丁','乙'],
    '申': ['庚','壬','戊'],
    '酉': ['辛'],
    '戌': ['戊','辛','丁'],
    '亥': ['壬','甲'],
  };

  /* ---------- 关系规则数据 ---------- */

  // 天干五合（合化五行）
  const TIAN_GAN_HE = [
    { stems: ['甲','己'], product: '土' },
    { stems: ['乙','庚'], product: '金' },
    { stems: ['丙','辛'], product: '水' },
    { stems: ['丁','壬'], product: '木' },
    { stems: ['戊','癸'], product: '火' },
  ];

  // 天干相冲（仅四组，戊己居中不冲）
  const TIAN_GAN_CHONG = [
    ['甲','庚'], ['乙','辛'], ['丙','壬'], ['丁','癸']
  ];

  // 地支六合
  const LIU_HE = [
    { branches: ['子','丑'], product: '土' },
    { branches: ['寅','亥'], product: '木' },
    { branches: ['卯','戌'], product: '火' },
    { branches: ['辰','酉'], product: '金' },
    { branches: ['巳','申'], product: '水' },
    { branches: ['午','未'], product: '火/土' }, // 太阳/太阴
  ];

  // 地支六冲
  const LIU_CHONG = [
    ['子','午'], ['丑','未'], ['寅','申'], ['卯','酉'], ['辰','戌'], ['巳','亥']
  ];

  // 三合局（局神在中间，余两支为长生与墓库）
  const SAN_HE = [
    { branches: ['申','子','辰'], product: '水', leader: '子' },
    { branches: ['亥','卯','未'], product: '木', leader: '卯' },
    { branches: ['寅','午','戌'], product: '火', leader: '午' },
    { branches: ['巳','酉','丑'], product: '金', leader: '酉' },
  ];

  // 三会方
  const SAN_HUI = [
    { branches: ['寅','卯','辰'], product: '木' },
    { branches: ['巳','午','未'], product: '火' },
    { branches: ['申','酉','戌'], product: '金' },
    { branches: ['亥','子','丑'], product: '水' },
  ];

  // 三刑
  const SAN_XING_GROUPS = [
    { branches: ['寅','巳','申'], kind: '无恩之刑' },
    { branches: ['丑','戌','未'], kind: '恃势之刑' },
  ];
  const XIANG_XING = [['子','卯']]; // 无礼之刑（互刑）
  const ZI_XING    = ['辰','午','酉','亥']; // 自刑（与自身同支）

  // 六害（相穿）
  const LIU_HAI = [
    ['子','未'], ['丑','午'], ['寅','巳'], ['卯','辰'], ['申','亥'], ['酉','戌']
  ];

  // 五行生克
  const SHENG = { '木':'火', '火':'土', '土':'金', '金':'水', '水':'木' };
  const KE    = { '木':'土', '土':'水', '水':'火', '火':'金', '金':'木' };

  /* ---------- 神煞（基础几个） ---------- */
  // 天乙贵人：日干 -> 地支
  const TIAN_YI = {
    '甲': ['丑','未'], '戊': ['丑','未'], '庚': ['丑','未'],
    '乙': ['子','申'], '己': ['子','申'],
    '丙': ['亥','酉'], '丁': ['亥','酉'],
    '壬': ['卯','巳'], '癸': ['卯','巳'],
    '辛': ['寅','午'],
  };
  // 桃花（年支或日支 -> 桃花支）
  const TAO_HUA = {
    '申':'酉','子':'酉','辰':'酉',
    '亥':'子','卯':'子','未':'子',
    '寅':'卯','午':'卯','戌':'卯',
    '巳':'午','酉':'午','丑':'午',
  };
  // 驿马
  const YI_MA = {
    '申':'寅','子':'寅','辰':'寅',
    '亥':'巳','卯':'巳','未':'巳',
    '寅':'申','午':'申','戌':'申',
    '巳':'亥','酉':'亥','丑':'亥',
  };
  // 文昌
  const WEN_CHANG = {
    '甲':'巳','乙':'午','丙':'申','丁':'酉','戊':'申',
    '己':'酉','庚':'亥','辛':'子','壬':'寅','癸':'卯',
  };
  // 华盖
  const HUA_GAI = { '申':'辰','子':'辰','辰':'辰',
                    '亥':'未','卯':'未','未':'未',
                    '寅':'戌','午':'戌','戌':'戌',
                    '巳':'丑','酉':'丑','丑':'丑' };

  /* ---------- 索引工具 ---------- */
  const stemIdx   = s => STEMS.indexOf(s);
  const branchIdx = b => BRANCHES.indexOf(b);

  // 60 甲子序号 → 干支
  function ganzhiFromIndex(i) {
    i = ((i % 60) + 60) % 60;
    return STEMS[i % 10] + BRANCHES[i % 12];
  }
  function ganzhiToIndex(stem, branch) {
    const s = stemIdx(stem), b = branchIdx(branch);
    // 解 i mod 10 = s 且 i mod 12 = b，i in [0,60)
    for (let i = 0; i < 60; i++) {
      if (i % 10 === s && i % 12 === b) return i;
    }
    return -1;
  }

  function stemElement(stem)   { return STEM_ELEMENTS[stemIdx(stem)]; }
  function branchElement(b)    { return BRANCH_ELEMENTS[branchIdx(b)]; }
  function stemYinYang(stem)   { return STEM_YINYANG[stemIdx(stem)]; }

  global.BZConst = {
    STEMS, BRANCHES, STEM_ELEMENTS, STEM_YINYANG,
    BRANCH_ELEMENTS, BRANCH_YINYANG, BRANCH_ZODIAC, HIDDEN_STEMS,
    TIAN_GAN_HE, TIAN_GAN_CHONG,
    LIU_HE, LIU_CHONG, SAN_HE, SAN_HUI, SAN_XING_GROUPS, XIANG_XING, ZI_XING, LIU_HAI,
    SHENG, KE,
    TIAN_YI, TAO_HUA, YI_MA, WEN_CHANG, HUA_GAI,
    stemIdx, branchIdx, ganzhiFromIndex, ganzhiToIndex,
    stemElement, branchElement, stemYinYang,
  };
})(window);
