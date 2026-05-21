/* ============================================================
 *  时间轴控制（流年滑动）
 *  - 防抖：拖动时合并连续更新
 *  - 大运随年龄自动定位
 * ============================================================ */
(function (global) {
  'use strict';

  function debounce(fn, ms) {
    let t = null;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  }

  /**
   * @param {HTMLInputElement} input
   * @param {HTMLElement} readout
   * @param {function(age)} onChange - 每次滑动触发（已防抖）
   */
  function bind(input, readout, onChange) {
    const dch = debounce(age => onChange(age), 30);
    input.addEventListener('input', e => {
      const age = Number(e.target.value);
      readout.textContent = `年龄 ${age} 岁`;
      dch(age);
    });
  }

  global.Timeline = { bind, debounce };
})(window);
