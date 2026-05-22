/* ============================================================
 *  命盘 SVG 渲染
 *  - 6 列：年 / 月 / 日 / 时 / 大运 / 流年
 *  - 每列：栏目名 / 十神 / 天干格 / 地支格 / 藏干 / 藏干十神
 *  - 提供 cellCenters() 用于关系线坐标查询
 * ============================================================ */
(function (global) {
  'use strict';

  const SVG_NS = 'http://www.w3.org/2000/svg';

  const COLUMNS = [
    { key: 'year',    label: '年柱' },
    { key: 'month',   label: '月柱' },
    { key: 'day',     label: '日柱' },
    { key: 'hour',    label: '时柱' },
    { key: 'dayun',   label: '大运' },
    { key: 'liunian', label: '流年' },
  ];

  // 几何参数
  const W = 800, H = 460;
  const MARGIN_X = 30;
  const COL_W = (W - MARGIN_X * 2) / 6;     // ~123
  const CELL_W = 90;
  const CELL_H = 75;
  const STEM_Y = 90;
  const BRANCH_Y = 195;
  const HIDDEN_Y = 280;
  const HEADER_Y = 25;
  const SHISHEN_Y = 50;

  function el(name, attrs, text) {
    const e = document.createElementNS(SVG_NS, name);
    if (attrs) Object.entries(attrs).forEach(([k, v]) => {
      if (v !== undefined && v !== null) e.setAttribute(k, v);
    });
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function colCenterX(i) {
    return MARGIN_X + COL_W * (i + 0.5);
  }

  // 五行 → 配色 class
  const ELEM_FILL = {
    '木': '#6fcf97', '火': '#eb5757', '土': '#d4b06a',
    '金': '#d6d6d6', '水': '#56ccf2',
  };

  function renderCell(cx, cy, char, elem, opts) {
    opts = opts || {};
    const g = el('g', { class: 'cell-group', 'data-key': opts.key, 'data-role': opts.role });
    const rect = el('rect', {
      x: cx - CELL_W/2, y: cy - CELL_H/2,
      width: CELL_W, height: CELL_H, rx: 6,
      class: `${opts.role === 'stem' ? 'cell-stem' : 'cell-branch'} ${opts.cls || ''}`,
    });
    g.appendChild(rect);

    const ch = el('text', {
      x: cx, y: cy + 4,
      class: opts.role === 'stem' ? 'cell-label-stem' : 'cell-label-branch',
      fill: ELEM_FILL[elem] || '#fff',
    }, char);
    g.appendChild(ch);

    if (opts.subtext) {
      g.appendChild(el('text', {
        x: cx, y: cy + CELL_H/2 - 5,
        class: 'cell-label-shishen',
      }, opts.subtext));
    }
    return g;
  }

  function clear(svg) {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
  }

  /**
   * 把 annotated chart + 当前 dayun/liunian 渲染到 SVG
   * 返回 { positions: [...], centers: {posKey: {stem:{x,y}, branch:{x,y}}} }
   */
  function render(svg, annotated, dayun, liunian) {
    clear(svg);
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

    const data = {
      year:    annotated.year,
      month:   annotated.month,
      day:     annotated.day,
      hour:    annotated.hour,
      dayun:   dayun   || null,
      liunian: liunian || null,
    };

    const centers = {};

    COLUMNS.forEach((col, i) => {
      const cx = colCenterX(i);
      const d = data[col.key];

      // 栏目名
      svg.appendChild(el('text', {
        x: cx, y: HEADER_Y, class: 'cell-label-header',
      }, col.label));

      if (!d) {
        svg.appendChild(el('text', {
          x: cx, y: BRANCH_Y, class: 'cell-label-header',
          'text-anchor': 'middle', fill: '#444',
        }, '—'));
        return;
      }

      // 十神（仅四柱有，且日柱固定为"日主"）
      const ss = d.shishen ? d.shishen.name : '';
      if (ss) {
        svg.appendChild(el('text', {
          x: cx, y: SHISHEN_Y, class: 'cell-label-shishen',
        }, ss));
      }

      // 天干格
      const stemCls = (col.key === 'day' ? 'day' : '') + (col.key === 'dayun' ? ' dayun' : '') + (col.key === 'liunian' ? ' liunian' : '');
      const stemElem = global.BZConst.stemElement(d.stem);
      svg.appendChild(renderCell(cx, STEM_Y, d.stem, stemElem,
        { role: 'stem', key: col.key, cls: stemCls }));

      // 地支格
      const branchElem = global.BZConst.branchElement(d.branch);
      svg.appendChild(renderCell(cx, BRANCH_Y, d.branch, branchElem,
        { role: 'branch', key: col.key, cls: stemCls }));

      // 藏干
      const cg = global.BZConst.HIDDEN_STEMS[d.branch] || [];
      const cgSS = d.cangganShishen || [];
      cg.forEach((cgStem, j) => {
        const offsetX = (j - (cg.length - 1) / 2) * 26;
        svg.appendChild(el('text', {
          x: cx + offsetX, y: HIDDEN_Y,
          'text-anchor': 'middle',
          fill: ELEM_FILL[global.BZConst.stemElement(cgStem)] || '#aaa',
          'font-size': 16, 'font-weight': 500,
        }, cgStem));
        if (cgSS[j]) {
          svg.appendChild(el('text', {
            x: cx + offsetX, y: HIDDEN_Y + 16,
            class: 'cell-label-canggan',
          }, cgSS[j].short || cgSS[j].name));
        }
      });

      centers[col.key] = {
        stem:   { x: cx, y: STEM_Y },
        branch: { x: cx, y: BRANCH_Y },
      };
    });

    return { centers, data };
  }

  global.ChartView = { render, COLUMNS, colCenterX };
})(window);
