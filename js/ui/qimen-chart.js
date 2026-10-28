/* ============================================================
 *  奇门遁甲九宫盘 SVG 渲染
 *  - 3x3 九宫格布局
 *  - 显示：天盘干/地盘干、八门、九星、八神
 * ============================================================ */
(function (global) {
  'use strict';

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const QM = global.QMConst;

  // 几何参数
  const W = 600, H = 620;
  const CELL_W = 180, CELL_H = 180;
  const START_X = 30, START_Y = 60;
  const GAP = 2;

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

  // 门配色
  const GATE_COLORS = {
    '开门': '#4cd28c', '休门': '#4cd28c', '生门': '#4cd28c',
    '伤门': '#ff5d6c', '杜门': '#8a93a3', '景门': '#d4b06a',
    '死门': '#ff5d6c', '惊门': '#ff5d6c'
  };

  // 星配色
  const STAR_COLORS = {
    '天心': '#4cd28c', '天辅': '#4cd28c', '天任': '#4cd28c', '天禽': '#4cd28c',
    '天冲': '#66b0ff', '天英': '#d4b06a',
    '天蓬': '#ff5d6c', '天芮': '#ff5d6c', '天柱': '#ff5d6c'
  };

  // 三奇配色
  const SANQI_COLORS = {
    '乙': '#4cd28c', '丙': '#eb5757', '丁': '#9c9cff'
  };

  // 九宫位置映射（洛书顺序：4-9-2 / 3-5-7 / 8-1-6）
  // 实际显示位置：
  // 离(9)  坤(2)  兑(7)
  // 巽(4)  中(5)  乾(6)
  // 艮(8)  坎(1)  震(3)
  const PALACE_LAYOUT = [
    ['li', '离', 9],    ['kun', '坤', 2],    ['dui', '兑', 7],
    ['xun', '巽', 4],   ['zhong', '中', 5],  ['qian', '乾', 6],
    ['gen', '艮', 8],   ['kan', '坎', 1],    ['zhen', '震', 3]
  ];

  // 方位映射
  const DIRECTION_MAP = {
    '坎': '北', '坤': '西南', '震': '东', '巽': '东南',
    '中': '中', '乾': '西北', '兑': '西', '艮': '东北', '离': '南'
  };

  /**
   * 渲染奇门遁甲九宫盘
   */
  function render(svg, plate, analysis) {
    clear(svg);
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

    if (!plate || !plate.palaces) {
      svg.appendChild(el('text', {
        x: W/2, y: H/2,
        'text-anchor': 'middle', fill: '#666', 'font-size': 16
      }, '请先排盘'));
      return { centers: {} };
    }

    const centers = {};

    // 标题栏
    const titleG = el('g', { class: 'qm-title' });
    titleG.appendChild(el('rect', {
      x: 0, y: 0, width: W, height: 50,
      fill: '#1a1f28'
    }));
    titleG.appendChild(el('text', {
      x: W/2, y: 22,
      'text-anchor': 'middle', fill: '#d4b06a',
      'font-size': 16, 'font-weight': 600
    }, `${plate.dun?.name || ''}${plate.ju || 1}局`));
    titleG.appendChild(el('text', {
      x: W/2, y: 40,
      'text-anchor': 'middle', fill: '#8a93a3',
      'font-size': 11
    }, `值符:${plate.zhiFuStar || ''} 值使:${plate.zhiShiGate || ''}`));
    svg.appendChild(titleG);

    // 渲染九宫
    PALACE_LAYOUT.forEach(([key, name, num], idx) => {
      const row = Math.floor(idx / 3);
      const col = idx % 3;
      const x = START_X + col * (CELL_W + GAP);
      const y = START_Y + row * (CELL_H + GAP);
      const cx = x + CELL_W / 2;
      const cy = y + CELL_H / 2;

      centers[key] = { x: cx, y: cy };

      const palace = plate.palaces[key];
      const isGoodGate = ['开门', '休门', '生门'].includes(palace?.gate);
      const isBadGate = ['死门', '伤门', '惊门'].includes(palace?.gate);
      const isGoodStar = ['天心', '天辅', '天任', '天禽'].includes(palace?.star);
      const isBadStar = ['天蓬', '天芮', '天柱'].includes(palace?.star);
      const isSanqi = palace?.isSanqi;

      const g = el('g', { class: 'qm-palace', 'data-palace': key });

      // 宫格背景
      let bgColor = '#181c22';
      let borderColor = '#2a3038';
      if (isGoodGate && isGoodStar) {
        bgColor = 'rgba(76, 210, 140, 0.08)';
        borderColor = '#4cd28c';
      } else if (isBadGate && isBadStar) {
        bgColor = 'rgba(255, 93, 108, 0.08)';
        borderColor = '#ff5d6c';
      } else if (isSanqi) {
        bgColor = 'rgba(76, 210, 140, 0.05)';
        borderColor = '#4cd28c';
      }

      g.appendChild(el('rect', {
        x: x, y: y, width: CELL_W, height: CELL_H, rx: 4,
        fill: bgColor, stroke: borderColor, 'stroke-width': key === 'zhong' ? 2 : 1
      }));

      // 宫名和编号
      g.appendChild(el('text', {
        x: x + 10, y: y + 18,
        fill: '#d4b06a', 'font-size': 12, 'font-weight': 600
      }, name));
      g.appendChild(el('text', {
        x: x + CELL_W - 20, y: y + 18,
        fill: '#8a93a3', 'font-size': 11
      }, String(num)));

      // 方位
      g.appendChild(el('text', {
        x: x + CELL_W - 30, y: y + CELL_H - 8,
        fill: '#666', 'font-size': 9
      }, DIRECTION_MAP[name] || ''));

      if (key === 'zhong') {
        // 中五宫特殊处理
        g.appendChild(el('text', {
          x: cx, y: cy + 5,
          'text-anchor': 'middle', fill: '#8a93a3',
          'font-size': 12
        }, '中五宫'));
        g.appendChild(el('text', {
          x: cx, y: cy + 25,
          'text-anchor': 'middle', fill: '#666',
          'font-size': 10
        }, '禽星寄宫'));
        svg.appendChild(g);
        return;
      }

      if (!palace) {
        svg.appendChild(g);
        return;
      }

      // 天盘干 / 地盘干
      const heavenStem = palace.heavenStem || '';
      const earthStem = palace.earthStem || '';
      const heavenColor = isSanqi ? (SANQI_COLORS[heavenStem] || '#fff') : '#fff';
      const earthColor = '#8a93a3';

      // 天盘干（较大）
      g.appendChild(el('text', {
        x: cx - 30, y: y + 50,
        fill: heavenColor, 'font-size': 28, 'font-weight': 600
      }, heavenStem));

      // 地盘干（较小）
      g.appendChild(el('text', {
        x: cx - 30, y: y + 75,
        fill: earthColor, 'font-size': 16
      }, earthStem));

      // 八门
      const gateColor = GATE_COLORS[palace.gate] || '#fff';
      g.appendChild(el('text', {
        x: cx + 25, y: y + 55,
        fill: gateColor, 'font-size': 14, 'font-weight': 600
      }, palace.gate || ''));

      // 九星
      const starColor = STAR_COLORS[palace.star] || '#66b0ff';
      g.appendChild(el('text', {
        x: cx + 25, y: y + 78,
        fill: starColor, 'font-size': 11
      }, palace.star || ''));

      // 八神
      g.appendChild(el('text', {
        x: cx, y: y + CELL_H - 25,
        'text-anchor': 'middle', fill: '#d4b06a',
        'font-size': 11
      }, palace.god || ''));

      // 三奇标记
      if (isSanqi) {
        const qiName = { '乙': '日奇', '丙': '月奇', '丁': '星奇' }[heavenStem];
        g.appendChild(el('text', {
          x: x + 8, y: y + CELL_H - 8,
          fill: SANQI_COLORS[heavenStem], 'font-size': 9
        }, qiName || ''));
      }

      svg.appendChild(g);
    });

    // 图例
    const legendY = H - 15;
    const legends = [
      { text: '吉门', color: '#4cd28c' },
      { text: '凶门', color: '#ff5d6c' },
      { text: '三奇', color: '#9c9cff' },
    ];

    legends.forEach((leg, i) => {
      svg.appendChild(el('rect', {
        x: 30 + i * 80, y: legendY - 10,
        width: 10, height: 10, rx: 2,
        fill: leg.color
      }));
      svg.appendChild(el('text', {
        x: 45 + i * 80, y: legendY - 1,
        fill: '#8a93a3', 'font-size': 10
      }, leg.text));
    });

    return { centers, plate };
  }

  /**
   * 渲染简化版奇门盘（用于 tab 内容）
   */
  function renderSimple(container, plate, analysis) {
    if (!plate || !plate.palaces) {
      container.innerHTML = '<p style="color:var(--muted)">请先排盘</p>';
      return;
    }

    let html = `<div class="qimen-chart-simple">`;
    html += `<div class="qimen-chart-info">`;
    html += `<span class="dun">${plate.dun?.name || ''}${plate.ju || 1}局</span>`;
    html += `<span class="zhifu">值符: ${plate.zhiFuStar || ''}</span>`;
    html += `<span class="zhishi">值使: ${plate.zhiShiGate || ''}</span>`;
    html += `</div>`;

    html += `<div class="qimen-jiugong-simple">`;

    PALACE_LAYOUT.forEach(([key, name, num]) => {
      const palace = plate.palaces[key];
      const isGoodGate = ['开门', '休门', '生门'].includes(palace?.gate);
      const isBadGate = ['死门', '伤门', '惊门'].includes(palace?.gate);
      const borderClass = isGoodGate ? 'good' : isBadGate ? 'bad' : '';

      html += `<div class="qm-cell ${borderClass}">`;
      html += `<div class="qm-cell-header">`;
      html += `<span class="qm-name">${name}</span>`;
      html += `<span class="qm-num">${num}</span>`;
      html += `</div>`;

      if (key === 'zhong') {
        html += `<div class="qm-center">中五宫</div>`;
      } else if (palace) {
        const heavenColor = palace.isSanqi ? (SANQI_COLORS[palace.heavenStem] || '#fff') : 'var(--text)';
        html += `<div class="qm-stems">`;
        html += `<span class="qm-heaven" style="color:${heavenColor}">${palace.heavenStem}</span>`;
        html += `<span class="qm-earth">${palace.earthStem}</span>`;
        html += `</div>`;
        html += `<div class="qm-gate" style="color:${GATE_COLORS[palace.gate] || 'var(--text)'}">${palace.gate}</div>`;
        html += `<div class="qm-star">${palace.star}</div>`;
        html += `<div class="qm-god">${palace.god}</div>`;
      }

      html += `</div>`;
    });

    html += `</div></div>`;
    container.innerHTML = html;
  }

  global.QMChart = { render, renderSimple, GATE_COLORS, STAR_COLORS, SANQI_COLORS, PALACE_LAYOUT };
})(window);
