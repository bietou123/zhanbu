/* ============================================================
 *  紫微斗数常量定义
 *  来源：《紫微斗数全书》《紫微斗数讲义》
 * ============================================================ */
(function (global) {
  'use strict';

  const ZW = {};

  // ===== 十二宫位 =====
  ZW.PALACES = [
    { key: 'ming', name: '命宫', short: '命' },
    { key: 'xiong', name: '兄弟宫', short: '兄' },
    { key: 'fuqi', name: '夫妻宫', short: '夫' },
    { key: 'zinv', name: '子女宫', short: '子' },
    { key: 'caifu', name: '财帛宫', short: '财' },
    { key: 'jibing', name: '疾厄宫', short: '疾' },
    { key: 'qianyi', name: '迁移宫', short: '迁' },
    { key: 'puve', name: '仆役宫', short: '仆' },
    { key: 'guanlu', name: '官禄宫', short: '官' },
    { key: 'tianzhai', name: '田宅宫', short: '田' },
    { key: 'fude', name: '福德宫', short: '福' },
    { key: 'fumu', name: '父母宫', short: '父' },
  ];

  // ===== 十四主星 =====
  ZW.MAJOR_STARS = [
    { key: 'ziwei', name: '紫微', element: '土', category: '帝星', nature: '尊贵、领导、解厄' },
    { key: 'tianji', name: '天机', element: '木', category: '善星', nature: '智慧、变化、谋略' },
    { key: 'taiyang', name: '太阳', element: '火', category: '中天星', nature: '光明、热情、外向' },
    { key: 'wuqu', name: '武曲', element: '金', category: '财星', nature: '刚毅、决断、财星' },
    { key: 'tiantong', name: '天同', element: '水', category: '福星', nature: '福气、懒散、享受' },
    { key: 'lianzhen', name: '廉贞', element: '火', category: '桃花', nature: '感情、囚星、变化' },
    { key: 'tianfu', name: '天府', element: '土', category: '财库', nature: '稳重、保守、财库' },
    { key: 'taiyin', name: '太阴', element: '水', category: '中天星', nature: '阴柔、财富、内敛' },
    { key: 'tanlang', name: '贪狼', element: '水/木', category: '桃花', nature: '欲望、才艺、社交' },
    { key: 'jumen', name: '巨门', element: '水', category: '暗星', nature: '口才、是非、怀疑' },
    { key: 'tianxiang', name: '天相', element: '水', category: '印星', nature: '印信、辅佐、公正' },
    { key: 'tianliang', name: '天梁', element: '土', category: '荫星', nature: '荫庇、老成、清高' },
    { key: 'qisha', name: '七杀', element: '金', category: '将星', nature: '权威、开创、孤独' },
    { key: 'pojun', name: '破军', element: '水', category: '耗星', nature: '变动、破坏、开创' },
  ];

  // ===== 六吉星 =====
  ZW.LUCKY_STARS = [
    { key: 'zuofu', name: '左辅', nature: '贵人、助力' },
    { key: 'youbi', name: '右弼', nature: '贵人、助力' },
    { key: 'wenchang', name: '文昌', nature: '文运、科甲' },
    { key: 'wenqu', name: '文曲', nature: '文艺、才情' },
    { key: 'tiankui', name: '天魁', nature: '阳贵人、大贵人' },
    { key: 'tianyue', name: '天钺', nature: '阴贵人、暗贵人' },
  ];

  // ===== 六煞星 =====
  ZW.BAD_STARS = [
    { key: 'qingyang', name: '擎羊', nature: '刑克、刚强、是非' },
    { key: 'tuoluo', name: '陀罗', nature: '拖延、纠缠、暗害' },
    { key: 'huoxing', name: '火星', nature: '突发、急躁、变动' },
    { key: 'lingxing', name: '铃星', nature: '阴火、隐忧、是非' },
    { key: 'dikong', name: '地空', nature: '空亡、损失、精神' },
    { key: 'dijie', name: '地劫', nature: '劫夺、破财、意外' },
  ];

  // ===== 四化 =====
  ZW.SIHUA = {
    lu: { name: '禄', meaning: '财富、福气、顺遂' },
    quan: { name: '权', meaning: '权力、掌控、进取' },
    ke: { name: '科', meaning: '名声、文运、贵人' },
    ji: { name: '忌', meaning: '执着、困扰、波折' },
  };

  // ===== 四化对应天干 =====
  ZW.SIHUA_BY_STEM = {
    '甲': { lu: '廉贞', quan: '破军', ke: '武曲', ji: '太阳' },
    '乙': { lu: '天机', quan: '天梁', ke: '紫微', ji: '太阴' },
    '丙': { lu: '天同', quan: '天机', ke: '文昌', ji: '廉贞' },
    '丁': { lu: '太阴', quan: '天同', ke: '天机', ji: '巨门' },
    '戊': { lu: '贪狼', quan: '太阴', ke: '右弼', ji: '天机' },
    '己': { lu: '武曲', quan: '贪狼', ke: '天梁', ji: '文曲' },
    '庚': { lu: '太阳', quan: '武曲', ke: '太阴', ji: '天同' },
    '辛': { lu: '巨门', quan: '太阳', ke: '文曲', ji: '文昌' },
    '壬': { lu: '天梁', quan: '紫微', ke: '左辅', ji: '武曲' },
    '癸': { lu: '破军', quan: '巨门', ke: '太阴', ji: '贪狼' },
  };

  // ===== 地支宫位顺序 =====
  ZW.BRANCH_ORDER = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

  // ===== 五行 =====
  ZW.ELEMENTS = ['木', '火', '土', '金', '水'];

  // ===== 五行相生相克 =====
  ZW.ELEMENT_SHENG = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' };
  ZW.ELEMENT_KE = { '木': '土', '土': '水', '水': '火', '火': '金', '金': '木' };

  // ===== 命宫安法 =====
  // 以出生时辰地支 + 月份 → 定命宫地支
  // 公式：命宫地支 = (月支序 - 时支序 + 1) mod 12，然后逆数到寅
  ZW.locateMingPalace = function(monthBranch, hourBranch) {
    const mIdx = ZW.BRANCH_ORDER.indexOf(monthBranch);
    const hIdx = ZW.BRANCH_ORDER.indexOf(hourBranch);
    // 命宫公式：从寅开始，月数减时数
    let mingIdx = (mIdx - hIdx + 12) % 12;
    return ZW.BRANCH_ORDER[mingIdx];
  };

  // ===== 身宫安法 =====
  // 身宫 = (月支 + 时支) mod 12
  ZW.locateShenPalace = function(monthBranch, hourBranch) {
    const mIdx = ZW.BRANCH_ORDER.indexOf(monthBranch);
    const hIdx = ZW.BRANCH_ORDER.indexOf(hourBranch);
    let shenIdx = (mIdx + hIdx) % 12;
    return ZW.BRANCH_ORDER[shenIdx];
  };

  // ===== 五行局 =====
  // 根据命宫纳音定局
  ZW.NAYIN_JU = {
    '子': { '金': '金四局', '木': '木三局', '水': '水二局', '火': '火六局', '土': '土五局' },
    '丑': { '金': '金四局', '木': '木三局', '水': '水二局', '火': '火六局', '土': '土五局' },
    '寅': { '金': '金四局', '木': '木三局', '水': '水二局', '火': '火六局', '土': '土五局' },
    '卯': { '金': '金四局', '木': '木三局', '水': '水二局', '火': '火六局', '土': '土五局' },
    '辰': { '金': '金四局', '木': '木三局', '水': '水二局', '火': '火六局', '土': '土五局' },
    '巳': { '金': '金四局', '木': '木三局', '水': '水二局', '火': '火六局', '土': '土五局' },
    '午': { '金': '金四局', '木': '木三局', '水': '水二局', '火': '火六局', '土': '土五局' },
    '未': { '金': '金四局', '木': '木三局', '水': '水二局', '火': '火六局', '土': '土五局' },
    '申': { '金': '金四局', '木': '木三局', '水': '水二局', '火': '火六局', '土': '土五局' },
    '酉': { '金': '金四局', '木': '木三局', '水': '水二局', '火': '火六局', '土': '土五局' },
    '戌': { '金': '金四局', '木': '木三局', '水': '水二局', '火': '火六局', '土': '土五局' },
    '亥': { '金': '金四局', '木': '木三局', '水': '水二局', '火': '火六局', '土': '土五局' },
  };

  // 简化五行局计算（根据命宫地支的五行属性）
  ZW.BRANCH_ELEMENT = {
    '子': '水', '丑': '土', '寅': '木', '卯': '木',
    '辰': '土', '巳': '火', '午': '火', '未': '土',
    '申': '金', '酉': '金', '戌': '土', '亥': '水'
  };

  ZW.getJu = function(mingBranch) {
    const elem = ZW.BRANCH_ELEMENT[mingBranch];
    const juMap = { '水': 2, '木': 3, '金': 4, '土': 5, '火': 6 };
    return { element: elem, ju: juMap[elem] };
  };

  // ===== 格局定义 =====
  ZW.PATTERNS = [
    {
      name: '紫府同宫格',
      condition: stars => stars.includes('紫微') && stars.includes('天府'),
      effect: '帝座逢库，富贵双全，领导才能出众',
      tier: '上上格'
    },
    {
      name: '紫府朝垣格',
      condition: (stars, palaces) => {
        return palaces.ming && palaces.ming.stars.includes('紫微') &&
               ['辰', '戌'].includes(palaces.ming.branch);
      },
      effect: '紫微在辰戌独坐，对面天府，主贵',
      tier: '上格'
    },
    {
      name: '机月同梁格',
      condition: stars => ['天机', '太阴', '天同', '天梁'].filter(s => stars.includes(s)).length >= 3,
      effect: '宜公职、策划、文职，稳重求财',
      tier: '中上格'
    },
    {
      name: '日月并明格',
      condition: (stars, palaces) => {
        if (!palaces.ming) return false;
        const branch = palaces.ming.branch;
        // 太阳在卯辰巳午为庙旺，太阴在酉戌亥子为庙旺
        const sunIdx = ZW.BRANCH_ORDER.indexOf(branch);
        return sunIdx >= 2 && sunIdx <= 5; // 简化判断
      },
      effect: '日月得地，事业光明，贵人多助',
      tier: '上格'
    },
    {
      name: '武贪守命格',
      condition: stars => stars.includes('武曲') && stars.includes('贪狼'),
      effect: '武贪同行，先贫后富，中年发达',
      tier: '中上格'
    },
    {
      name: '府相朝垣格',
      condition: stars => stars.includes('天府') && stars.includes('天相'),
      effect: '财印相逢，富贵可期',
      tier: '上格'
    },
    {
      name: '君臣庆会格',
      condition: stars => stars.includes('紫微') && stars.includes('天相'),
      effect: '君臣得位，事业顺遂',
      tier: '上格'
    },
    {
      name: '七杀朝斗格',
      condition: (stars, palaces) => {
        return stars.includes('七杀') && ['子', '午'].includes(palaces.ming?.branch);
      },
      effect: '七杀朝斗，权威出众，武职显达',
      tier: '上格'
    },
    {
      name: '廉贞文武格',
      condition: stars => stars.includes('廉贞') && (stars.includes('文昌') || stars.includes('文曲')),
      effect: '廉贞遇文昌，文武双全',
      tier: '中格'
    },
    {
      name: '科权禄夹格',
      condition: (stars, palaces, sihua) => {
        const huaCount = Object.values(sihua || {}).filter(s => s).length;
        return huaCount >= 2;
      },
      effect: '四化吉星会聚，功名显达',
      tier: '上格'
    },
    {
      name: '命无正曜格',
      condition: (stars, palaces) => {
        const majorInMing = ZW.MAJOR_STARS.filter(s => palaces.ming?.stars?.includes(s.name)).length;
        return majorInMing === 0;
      },
      effect: '命宫无主星，借对宫星曜，性格多变，需看大运',
      tier: '特殊格'
    },
    {
      name: '日月反背格',
      condition: (stars, palaces) => {
        if (!palaces.ming) return false;
        const branch = palaces.ming.branch;
        // 太阳在酉戌亥子为落陷，太阴在卯辰巳午为落陷
        const idx = ZW.BRANCH_ORDER.indexOf(branch);
        return idx >= 8 || idx <= 1; // 简化
      },
      effect: '日月无光，劳碌辛苦，晚运可成',
      tier: '下格'
    },
    {
      name: '马头带箭格',
      condition: stars => stars.includes('擎羊') && stars.includes('天马'),
      effect: '擎羊遇天马，奔波劳碌，需防是非',
      tier: '中下格'
    },
    {
      name: '刑囚夹印格',
      condition: (stars, palaces) => {
        return stars.includes('廉贞') && stars.includes('天相') &&
               (stars.includes('擎羊') || stars.includes('陀罗'));
      },
      effect: '刑囚夹印，多是非官非',
      tier: '下格'
    },
  ];

  // ===== 星曜庙旺利陷 =====
  ZW.STAR_STRENGTH = {
    '紫微': {庙: ['午', '巳', '辰'], 旺: ['卯', '寅'], 利: ['丑', '子'], 陷: ['亥', '戌']},
    '天机': {庙: ['丑', '寅'], 旺: ['卯'], 利: ['辰', '巳'], 陷: ['午', '未']},
    '太阳': {庙: ['卯', '辰', '巳', '午'], 旺: [], 利: ['寅', '未'], 陷: ['申', '酉', '戌', '亥', '子', '丑']},
    '武曲': {庙: ['辰', '戌', '丑', '未'], 旺: ['寅', '申'], 利: [], 陷: ['卯', '酉']},
    '天同': {庙: ['子', '丑'], 旺: ['寅', '卯'], 利: [], 陷: ['午', '未']},
    '廉贞': {庙: ['寅', '申'], 旺: [], 利: ['丑', '未'], 陷: ['巳', '亥']},
    '天府': {庙: ['戌', '辰'], 旺: ['子', '午'], 利: [], 陷: []},
    '太阴': {庙: ['酉', '戌', '亥', '子'], 旺: ['丑'], 利: ['寅'], 陷: ['卯', '辰', '巳', '午', '未', '申']},
    '贪狼': {庙: ['辰', '戌', '丑', '未'], 旺: ['寅', '申'], 利: [], 陷: []},
    '巨门': {庙: ['子', '午', '丑', '未'], 旺: [], 利: ['辰', '戌'], 陷: ['寅', '申']},
    '天相': {庙: ['卯', '酉'], 旺: ['辰', '戌', '丑', '未'], 利: [], 陷: []},
    '天梁': {庙: ['子', '午'], 旺: ['卯'], 利: [], 陷: ['酉']},
    '七杀': {庙: ['寅', '申', '子', '午'], 旺: [], 利: ['辰', '戌'], 陷: []},
    '破军': {庙: ['子', '午'], 旺: [], 利: ['寅', '申'], 陷: ['辰', '戌']},
  };

  // 获取星曜在某宫的亮度
  ZW.getStarBrightness = function(starName, branch) {
    const ss = ZW.STAR_STRENGTH[starName];
    if (!ss) return '平';
    if (ss.庙?.includes(branch)) return '庙';
    if (ss.旺?.includes(branch)) return '旺';
    if (ss.利?.includes(branch)) return '利';
    if (ss.陷?.includes(branch)) return '陷';
    return '平';
  };

  global.ZWConst = ZW;
})(window);
