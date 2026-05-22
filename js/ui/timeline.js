/* ============================================================
 *  流年按钮组 — 取代滑动条
 *  - 每个按钮显示一个流年的干支 + 年份
 *  - 点击即跳转到该年龄的命盘推演
 *  - 按钮仅在出生数据变化时重建
 * ============================================================ */
(function (global) {
  'use strict';

  let _birthJdUT = null;

  /**
   * 确保按钮组已创建（jdUT 不变则跳过重建）
   * @param {HTMLElement} container
   * @param {number} birthJdUT
   */
  function ensureButtons(container, birthJdUT) {
    if (_birthJdUT === birthJdUT && container.children.length > 0) return;
    _birthJdUT = birthJdUT;
    container.innerHTML = '';
    for (let age = 0; age <= 120; age++) {
      const ln = global.DaYun.getLiunian(birthJdUT, age);
      const btn = document.createElement('button');
      btn.className = 'year-btn';
      btn.dataset.age = age;
      btn.title = `${ln.year}年 ${ln.stem}${ln.branch} · ${age}岁`;
      btn.innerHTML = `<span class="y-sb">${ln.stem}${ln.branch}</span><span class="y-num">${ln.year}</span>`;
      btn.addEventListener('click', () => {
        setActive(container, age);
        const cb = container._onChange;
        if (cb) cb(age);
      });
      container.appendChild(btn);
    }
  }

  /**
   * 高亮指定年龄的按钮并滚动到可见位置
   */
  function setActive(container, age) {
    container.querySelectorAll('.year-btn').forEach(b => {
      b.classList.toggle('active', +b.dataset.age === age);
    });
    const active = container.querySelector('.year-btn.active');
    if (active) {
      active.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }

  /**
   * 注册按钮点击回调
   */
  function onChange(container, fn) {
    container._onChange = fn;
  }

  global.Timeline = { ensureButtons, setActive, onChange };
})(window);
