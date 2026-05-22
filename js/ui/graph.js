/* ============================================================
 *  关系连线 SVG 绘制 + 高亮交互
 *  - 二元关系: 二次贝塞尔曲线 (一个控制点)
 *  - 三元关系(三合/三会/三刑): 三条短线汇聚到中心点
 *  - 不同关系类型用不同 stroke 颜色 + 虚线样式（在 CSS 中定义）
 *  - 鼠标悬浮显示 tooltip
 *  - 控制点放在所有节点 y 的下方约 80-160 处，避免线穿过格子
 * ============================================================ */
(function (global) {
  'use strict';

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const BRANCH_BASE_Y = 360;   // 控制点基准（命盘高度 460，留余地）
  const STEM_BASE_Y   = -20;   // 天干合冲走上方
  const TOOLTIP = () => document.getElementById('tooltip');

  function el(name, attrs, text) {
    const e = document.createElementNS(SVG_NS, name);
    if (attrs) Object.entries(attrs).forEach(([k, v]) => {
      if (v !== undefined && v !== null) e.setAttribute(k, v);
    });
    if (text !== undefined) e.textContent = text;
    return e;
  }

  // 二次贝塞尔曲线 path d
  function quadPath(p1, p2, ctrlY) {
    const midX = (p1.x + p2.x) / 2;
    return `M ${p1.x},${p1.y} Q ${midX},${ctrlY} ${p2.x},${p2.y}`;
  }

  // 二元关系：自动避让，按列距给控制点不同偏移
  function depth(distance) {
    // 列距越大控制点越远
    return Math.min(80 + distance / 5, 140);
  }

  /**
   * 绘制所有关系
   * @param {SVGElement} svg
   * @param {object} centers - chart.render() 的返回值
   * @param {Array} relations - relations.analyzeRelations() 的返回
   */
  function drawRelations(svg, centers, relations) {
    // 清掉已有关系线（保留命盘格子）
    Array.from(svg.querySelectorAll('.rel-line, .rel-label, .rel-hit')).forEach(n => n.remove());

    // 按地支/天干分两组，分上下方
    relations.forEach((r, idx) => {
      if (r.suppressed) {
        drawOneRelation(svg, centers, r, idx, true);
      } else {
        drawOneRelation(svg, centers, r, idx, false);
      }
    });
  }

  function getCellCenter(centers, posKey, role) {
    return centers[posKey] && centers[posKey][role];
  }

  function drawOneRelation(svg, centers, r, idx, suppressed) {
    const role = (r.type === 'tianganhe' || r.type === 'ganchong') ? 'stem' : 'branch';
    const colorClass = relTypeToClass(r);

    // 收集点
    let pts = [];
    if (r.members) {
      pts = r.members.map(m => getCellCenter(centers, m.key, role)).filter(Boolean);
    } else if (r.a && r.b) {
      pts = [getCellCenter(centers, r.a.key, role), getCellCenter(centers, r.b.key, role)].filter(Boolean);
    }
    if (pts.length < 2) return;

    if (pts.length === 2) {
      // 二元
      const distance = Math.abs(pts[1].x - pts[0].x);
      const ctrlY = role === 'stem' ? STEM_BASE_Y - depth(distance) * 0.4 : BRANCH_BASE_Y + depth(distance) * 0.6;
      const path = el('path', {
        d: quadPath(pts[0], pts[1], ctrlY),
        class: `rel-line ${colorClass} ${suppressed ? 'dim' : ''}`,
        'data-desc': r.desc + (r.note ? ` · ${r.note}` : ''),
      });
      attachHover(svg, path, r);
      svg.appendChild(path);
    } else {
      // 三元：汇聚到几何中点
      const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
      const cy = role === 'stem' ? STEM_BASE_Y : BRANCH_BASE_Y;
      pts.forEach(p => {
        const ctrlY = (p.y + cy) / 2;
        const d = `M ${p.x},${p.y} Q ${(p.x + cx) / 2},${ctrlY} ${cx},${cy}`;
        const path = el('path', {
          d, class: `rel-line ${colorClass} ${suppressed ? 'dim' : ''}`,
          'data-desc': r.desc + (r.note ? ` · ${r.note}` : ''),
        });
        attachHover(svg, path, r);
        svg.appendChild(path);
      });
      // 中心标签
      if (r.product) {
        svg.appendChild(el('text', {
          x: cx, y: cy + 4,
          'text-anchor': 'middle',
          class: 'rel-label',
          fill: '#fff', 'font-size': 11,
        }, r.product));
      }
    }
  }

  function relTypeToClass(r) {
    if (r.type === 'tianganhe') return 'rel-tianhe';
    if (r.type === 'ganchong')  return 'rel-chong';
    if (r.kind === 'he')        return 'rel-he';
    if (r.kind === 'chong')     return 'rel-chong';
    if (r.kind === 'xing')      return 'rel-xing';
    if (r.kind === 'hai')       return 'rel-hai';
    if (r.kind === 'sanhe' || r.kind === 'sanhe-half' || r.kind === 'sanhui') return 'rel-sanhe';
    return 'rel-he';
  }

  function attachHover(svg, path, r) {
    path.addEventListener('mouseenter', e => {
      const t = TOOLTIP();
      if (!t) return;
      t.hidden = false;
      t.textContent = (r.suppressed ? '⊘ ' : '') + (r.subtype || '') + ' · ' + r.desc
                      + (r.note ? `\n${r.note}` : '');
      const rect = svg.getBoundingClientRect();
      const wrapRect = svg.parentElement.getBoundingClientRect();
      t.style.left = (e.clientX - wrapRect.left + 10) + 'px';
      t.style.top  = (e.clientY - wrapRect.top + 10) + 'px';
      // 同类暗化
      Array.from(svg.querySelectorAll('.rel-line')).forEach(p => {
        if (p !== path) p.classList.add('dim');
      });
    });
    path.addEventListener('mousemove', e => {
      const t = TOOLTIP();
      const wrapRect = svg.parentElement.getBoundingClientRect();
      t.style.left = (e.clientX - wrapRect.left + 10) + 'px';
      t.style.top  = (e.clientY - wrapRect.top + 10) + 'px';
    });
    path.addEventListener('mouseleave', () => {
      const t = TOOLTIP();
      if (t) t.hidden = true;
      Array.from(svg.querySelectorAll('.rel-line')).forEach(p => {
        // 恢复 suppressed 的 dim
        const desc = p.getAttribute('data-desc') || '';
        const isSup = /⊘|合化解冲|被.+并入/.test(desc) || p.classList.contains('was-dim');
        if (!isSup) p.classList.remove('dim');
      });
    });
  }

  global.GraphView = { drawRelations };
})(window);
