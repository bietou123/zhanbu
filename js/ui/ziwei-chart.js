/* ============================================================
 *  紫微斗数命盘 SVG 渲染
 *  - 十二宫按地支顺序排列（顺时针）
 *  - 显示：宫位名、地支、主星、吉煞星、四化
 * ============================================================ */
(function (global) {
  'use strict';

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const ZW = global.ZWConst;

  // 几何参数
  const W = 720, H = 720;
  const CENTER_X = 360, CENTER_Y = 360;
  const RADIUS = 320;
  const INNER_RADIUS = 160;

  function el(name, attrs, text) {
    const e = document.createElementNS(SVG_NS, name);
    if (attrs) Object.entries(attrs).forEach(([k, v]) => {
      if (v !== undefined && v !== null) e.setAttribute(k, v);
    });
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function clear(svg) {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
  }

  // 五行配色
  const ELEM_COLORS = {
    '木': '#6fcf97', '火': '#eb5757', '土': '#d4b06a',
    '金': '#d6d6d6', '水': '#56ccf2',
  };

  // 四化配色
  const SIHUA_COLORS = {
    '禄': '#4cd28c',
    '权': '#66b0ff',
    '科': '#9c9cff',
    '忌': '#ff5d6c'
  };

  // 星曜类型配色
  function getStarColor(starName) {
    const majorStar = ZW?.MAJOR_STARS?.find(s => s.name === starName);
    if (majorStar) {
      return ELEM_COLORS[majorStar.element?.split('/')[0]] || '#d4b06a';
    }
    const luckyStar = ZW?.LUCKY_STARS?.find(s => s.name === starName);
    if (luckyStar) return '#4cd28c';
    const badStar = ZW?.BAD_STARS?.find(s => s.name === starName);
    if (badStar) return '#ff5d6c';
    return '#8a93a3';
  }

  /**
   * 计算十二宫位置（从子位开始，顺时针）
   * 子在正下方，丑在左下，寅在左边...（逆时针排列地支，但宫位顺时针）
   */
  function calculatePalacePositions() {
    const positions = [];
    // 子在底部(270°)，顺时针排列
    // 实际紫微斗数盘：子在正下方开始，逆时针排列
    const startAngle = Math.PI / 2; // 从底部开始

    for (let i = 0; i < 12; i++) {
      // 地支从子开始，逆时针排列
      const angle = startAngle - (i * Math.PI / 6);
      positions.push({
        branch: ZW?.BRANCH_ORDER?.[i] || ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'][i],
        angle: angle,
        innerAngle: angle - Math.PI / 12, // 宫格中心角度
      });
    }
    return positions;
  }

  /**
   * 渲染紫微斗数命盘
   */
  function render(svg, chart, analysis) {
    clear(svg);
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

    if (!chart || !chart.palaces) {
      svg.appendChild(el('text', {
        x: CENTER_X, y: CENTER_Y,
        'text-anchor': 'middle', fill: '#666', 'font-size': 16
      }, '请先排盘'));
      return { centers: {} };
    }

    const centers = {};
    const positions = calculatePalacePositions();
    const branchOrder = ZW?.BRANCH_ORDER || ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];

    // 找到命宫位置
    const mingBranch = chart.mingBranch;
    const mingIdx = branchOrder.indexOf(mingBranch);

    // 绘制外圈（地支标记）
    branchOrder.forEach((branch, i) => {
      const pos = positions[i];
      const x = CENTER_X + RADIUS * Math.cos(pos.angle);
      const y = CENTER_Y + RADIUS * Math.sin(pos.angle);

      // 地支标签
      svg.appendChild(el('text', {
        x: CENTER_X + (RADIUS + 20) * Math.cos(pos.angle),
        y: CENTER_Y + (RADIUS + 20) * Math.sin(pos.angle) + 4,
        'text-anchor': 'middle', fill: '#666', 'font-size': 12
      }, branch));
    });

    // 绘制十二宫格
    ZW?.PALACES?.forEach((palaceDef, idx) => {
      // 宫位从命宫开始，顺时针排列
      const branchIdx = (mingIdx + idx) % 12;
      const branch = branchOrder[branchIdx];
      const pos = positions[branchIdx];
      const palace = chart.palaces[palaceDef.key];

      if (!palace) return;

      // 计算宫格中心位置
      const cellRadius = (RADIUS - INNER_RADIUS) / 2;
      const cellDist = INNER_RADIUS + cellRadius;
      const cellAngle = pos.angle;

      // 修正：让宫格在正确的位置
      // 宫格应该按命宫位置排列
      const angleOffset = -Math.PI / 2; // 从顶部开始
      const adjustedAngle = angleOffset - (idx * Math.PI / 6);
      const cx = CENTER_X + cellDist * Math.cos(adjustedAngle);
      const cy = CENTER_Y + cellDist * Math.sin(adjustedAngle);

      centers[palaceDef.key] = { x: cx, y: cy, branch: palace.branch };

      // 绘制宫格背景
      const g = el('g', { class: 'zw-palace', 'data-palace': palaceDef.key });
      g.appendChild(el('rect', {
        x: cx - 58, y: cy - 58,
        width: 116, height: 116, rx: 4,
        fill: '#1a1f28', stroke: '#2a3038', 'stroke-width': 1
      }));

      // 宫位名称
      g.appendChild(el('text', {
        x: cx - 50, y: cy - 42,
        fill: '#d4b06a', 'font-size': 11, 'font-weight': 600
      }, palaceDef.name));

      // 地支
      g.appendChild(el('text', {
        x: cx + 45, y: cy - 42,
        fill: '#66b0ff', 'font-size': 10
      }, palace.branch));

      // 主星（最多显示3颗）
      const majorStars = palace.stars.filter(s =>
        ZW?.MAJOR_STARS?.some(ms => ms.name === s)
      ).slice(0, 3);

      majorStars.forEach((star, si) => {
        const brightness = palace.brightness?.find(b => b.star === star)?.brightness || '平';
        const sihua = palace.sihua?.find(s => s.star === star);

        let color = getStarColor(star);
        if (brightness === '陷') color = '#ff5d6c';
        if (brightness === '庙') color = '#4cd28c';

        const text = el('text', {
          x: cx - 48, y: cy - 20 + si * 16,
          fill: color, 'font-size': 13, 'font-weight': 600
        }, star + (brightness !== '平' ? brightness : ''));

        // 四化标记
        if (sihua) {
          text.setAttribute('fill', SIHUA_COLORS[sihua.hua] || color);
        }
        g.appendChild(text);
      });

      // 吉星煞星（显示在下半部分）
      const otherStars = palace.stars.filter(s =>
        !ZW?.MAJOR_STARS?.some(ms => ms.name === s)
      ).slice(0, 4);

      const otherText = otherStars.map(s => {
        const isLucky = ZW?.LUCKY_STARS?.some(ls => ls.name === s);
        const isBad = ZW?.BAD_STARS?.some(bs => bs.name === s);
        if (isLucky) return `<span style="color:#4cd28c">${s}</span>`;
        if (isBad) return `<span style="color:#ff5d6c">${s}</span>`;
        return s;
      }).join(' ');

      if (otherStars.length > 0) {
        g.appendChild(el('text', {
          x: cx - 48, y: cy + 35,
          fill: '#8a93a3', 'font-size': 9
        }, otherStars.slice(0, 4).join(' ')));
      }

      // 四化标记（如有）
      if (palace.sihua && palace.sihua.length > 0) {
        const sihuaText = palace.sihua.map(s => s.hua).join('');
        g.appendChild(el('text', {
          x: cx + 35, y: cy + 48,
          fill: SIHUA_COLORS[palace.sihua[0]?.hua] || '#d4b06a',
          'font-size': 10, 'font-weight': 600
        }, sihuaText));
      }

      svg.appendChild(g);
    });

    // 绘制中心信息
    const centerG = el('g', { class: 'zw-center' });

    // 中心圆
    centerG.appendChild(el('circle', {
      cx: CENTER_X, cy: CENTER_Y, r: INNER_RADIUS - 10,
      fill: '#0f1216', stroke: '#d4b06a', 'stroke-width': 2
    }));

    // 局数
    centerG.appendChild(el('text', {
      x: CENTER_X, y: CENTER_Y - 30,
      'text-anchor': 'middle', fill: '#d4b06a',
      'font-size': 14, 'font-weight': 600
    }, `${chart.ju || 5}局`));

    // 五行
    centerG.appendChild(el('text', {
      x: CENTER_X, y: CENTER_Y - 10,
      'text-anchor': 'middle', fill: ELEM_COLORS[chart.element] || '#fff',
      'font-size': 12
    }, chart.element || ''));

    // 命宫地支
    centerG.appendChild(el('text', {
      x: CENTER_X, y: CENTER_Y + 15,
      'text-anchor': 'middle', fill: '#66b0ff',
      'font-size': 20, 'font-weight': 600
    }, mingBranch || ''));

    // 身宫
    if (chart.shenPalaceKey) {
      centerG.appendChild(el('text', {
        x: CENTER_X, y: CENTER_Y + 40,
        'text-anchor': 'middle', fill: '#8a93a3',
        'font-size': 10
      }, `身宫: ${chart.shenBranch || ''}`));
    }

    svg.appendChild(centerG);

    // 图例
    const legendY = H - 25;
    const legends = [
      { text: '庙', color: '#4cd28c' },
      { text: '旺', color: '#66b0ff' },
      { text: '禄', color: '#4cd28c' },
      { text: '权', color: '#66b0ff' },
      { text: '科', color: '#9c9cff' },
      { text: '忌', color: '#ff5d6c' },
    ];

    legends.forEach((leg, i) => {
      svg.appendChild(el('text', {
        x: 60 + i * 50, y: legendY,
        fill: leg.color, 'font-size': 11
      }, leg.text));
    });

    return { centers, chart };
  }

  /**
   * 渲染简化版紫微命盘（用于 tab 内容）
   */
  function renderSimple(container, chart, analysis) {
    if (!chart || !chart.palaces) {
      container.innerHTML = '<p style="color:var(--muted)">请先排盘</p>';
      return;
    }

    const branchOrder = ZW?.BRANCH_ORDER || ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
    const mingIdx = branchOrder.indexOf(chart.mingBranch);

    let html = `<div class="ziwei-chart-simple">`;
    html += `<div class="ziwei-chart-info">`;
    html += `<span class="ju">${chart.ju || 5}局</span>`;
    html += `<span class="element" style="color:${ELEM_COLORS[chart.element]}">${chart.element || ''}</span>`;
    html += `<span class="ming">命宫: ${chart.mingBranch}</span>`;
    html += `<span class="shen">身宫: ${chart.shenBranch || ''}</span>`;
    html += `</div>`;

    html += `<div class="ziwei-palaces">`;
    ZW?.PALACES?.forEach((palaceDef, idx) => {
      const palace = chart.palaces[palaceDef.key];
      if (!palace) return;

      const majorStars = palace.stars.filter(s =>
        ZW?.MAJOR_STARS?.some(ms => ms.name === s)
      ).slice(0, 3);

      const otherStars = palace.stars.filter(s =>
        !ZW?.MAJOR_STARS?.some(ms => ms.name === s)
      ).slice(0, 3);

      html += `<div class="zw-palace-card">`;
      html += `<div class="zw-palace-header">`;
      html += `<span class="zw-palace-name">${palaceDef.name}</span>`;
      html += `<span class="zw-palace-branch">${palace.branch}</span>`;
      html += `</div>`;
      html += `<div class="zw-palace-stars">`;

      majorStars.forEach(star => {
        const brightness = palace.brightness?.find(b => b.star === star)?.brightness || '平';
        const sihua = palace.sihua?.find(s => s.star === star);
        let color = brightness === '庙' ? 'var(--he)' : brightness === '陷' ? 'var(--chong)' : 'var(--text)';
        if (sihua) color = SIHUA_COLORS[sihua.hua];
        html += `<span class="zw-star major" style="color:${color}">${star}${brightness !== '平' ? brightness : ''}</span>`;
      });

      otherStars.forEach(star => {
        const isLucky = ZW?.LUCKY_STARS?.some(ls => ls.name === s);
        const isBad = ZW?.BAD_STARS?.some(bs => bs.name === star);
        const color = isLucky ? 'var(--he)' : isBad ? 'var(--chong)' : 'var(--muted)';
        html += `<span class="zw-star" style="color:${color}">${star}</span>`;
      });

      html += `</div>`;
      if (palace.sihua && palace.sihua.length > 0) {
        html += `<div class="zw-palace-sihua">`;
        palace.sihua.forEach(s => {
          html += `<span style="color:${SIHUA_COLORS[s.hua]}">${s.star}化${s.hua}</span>`;
        });
        html += `</div>`;
      }
      html += `</div>`;
    });
    html += `</div></div>`;

    container.innerHTML = html;
  }

  global.ZWChart = { render, renderSimple, ELEM_COLORS, SIHUA_COLORS };
})(window);
