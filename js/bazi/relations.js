/* ============================================================
 *  关系规则引擎（刑冲合害化）
 *
 *  设计思路：
 *    1) 把命盘里所有「在场的字」组织成 positions 数组
 *       （年/月/日/时 4 个，再加大运/流年的动态字 0-2 个）
 *    2) 数据驱动地扫描每条规则，产出 candidate relations
 *    3) 用一个优先级处理阶段处理"合解冲""贪合""三合优于六合"等
 *
 *  优先级（高 → 低）：
 *    三会 > 三合 > 六合 > 半合 > 六冲 > 三刑 > 六害 > 自刑
 *    "合解冲"：被合的字所参与的冲被标记为 suppressed
 *
 *  注：本引擎追求"实战常见判定"，不囊括所有流派细则
 * ============================================================ */
(function (global) {
  'use strict';

  const C = global.BZConst;

  /**
   * @typedef {object} Position
   * @property {string} key   - 唯一 id，如 "year", "month", "dayun"
   * @property {string} label - 显示标签
   * @property {string} stem
   * @property {string} branch
   */

  function pairKey(a, b) {
    return [a, b].sort().join('|');
  }

  function findAllPairs(positions, predicate) {
    const out = [];
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const r = predicate(positions[i], positions[j]);
        if (r) out.push({ a: positions[i], b: positions[j], ...r });
      }
    }
    return out;
  }

  function findAllTriples(positions, predicate) {
    const out = [];
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        for (let k = j + 1; k < positions.length; k++) {
          const r = predicate(positions[i], positions[j], positions[k]);
          if (r) out.push({ a: positions[i], b: positions[j], c: positions[k], ...r });
        }
      }
    }
    return out;
  }

  /* ------------------------------------------------------------
   *  各类关系的检测器
   * ------------------------------------------------------------ */
  function detectTianGanHe(positions) {
    return findAllPairs(positions, (a, b) => {
      for (const rule of C.TIAN_GAN_HE) {
        if (rule.stems.includes(a.stem) && rule.stems.includes(b.stem) && a.stem !== b.stem) {
          return { type: 'tianganhe', kind: 'he', subtype: '天干五合',
                   product: rule.product, desc: `${a.stem}${b.stem}合化${rule.product}` };
        }
      }
      return null;
    });
  }

  function detectTianGanChong(positions) {
    return findAllPairs(positions, (a, b) => {
      for (const pair of C.TIAN_GAN_CHONG) {
        if (pair.includes(a.stem) && pair.includes(b.stem) && a.stem !== b.stem) {
          return { type: 'ganchong', kind: 'chong', subtype: '天干相冲',
                   desc: `${a.stem}${b.stem}相冲` };
        }
      }
      return null;
    });
  }

  function detectLiuHe(positions) {
    return findAllPairs(positions, (a, b) => {
      for (const rule of C.LIU_HE) {
        if (rule.branches.includes(a.branch) && rule.branches.includes(b.branch)
            && a.branch !== b.branch) {
          return { type: 'liuhe', kind: 'he', subtype: '六合',
                   product: rule.product, desc: `${a.branch}${b.branch}六合(化${rule.product})` };
        }
      }
      return null;
    });
  }

  function detectLiuChong(positions) {
    return findAllPairs(positions, (a, b) => {
      for (const pair of C.LIU_CHONG) {
        if (pair.includes(a.branch) && pair.includes(b.branch) && a.branch !== b.branch) {
          return { type: 'liuchong', kind: 'chong', subtype: '六冲',
                   desc: `${a.branch}${b.branch}相冲` };
        }
      }
      return null;
    });
  }

  function detectLiuHai(positions) {
    return findAllPairs(positions, (a, b) => {
      for (const pair of C.LIU_HAI) {
        if (pair.includes(a.branch) && pair.includes(b.branch) && a.branch !== b.branch) {
          return { type: 'liuhai', kind: 'hai', subtype: '相害',
                   desc: `${a.branch}${b.branch}相害` };
        }
      }
      return null;
    });
  }

  function detectSanHe(positions) {
    const out = [];
    for (const rule of C.SAN_HE) {
      const hits = positions.filter(p => rule.branches.includes(p.branch));
      // 去重(同一字可能在多位置)
      const uniqBranches = new Set(hits.map(h => h.branch));
      if (uniqBranches.size === 3) {
        out.push({ members: hits, kind: 'sanhe', subtype: '三合局',
                   type: 'sanhe', product: rule.product, leader: rule.leader,
                   desc: `${rule.branches.join('')}三合${rule.product}局` });
      } else if (uniqBranches.size === 2 && hits.some(h => h.branch === rule.leader)) {
        // 半三合（含中神才算）
        out.push({ members: hits, kind: 'sanhe-half', subtype: '半三合',
                   type: 'sanhe-half', product: rule.product, leader: rule.leader,
                   desc: `${hits.map(h => h.branch).join('')}半三合${rule.product}` });
      }
    }
    return out;
  }

  function detectSanHui(positions) {
    const out = [];
    for (const rule of C.SAN_HUI) {
      const hits = positions.filter(p => rule.branches.includes(p.branch));
      const uniqBranches = new Set(hits.map(h => h.branch));
      if (uniqBranches.size === 3) {
        out.push({ members: hits, kind: 'sanhui', subtype: '三会方',
                   type: 'sanhui', product: rule.product,
                   desc: `${rule.branches.join('')}三会${rule.product}方` });
      }
    }
    return out;
  }

  function detectSanXing(positions) {
    const out = [];
    for (const rule of C.SAN_XING_GROUPS) {
      const hits = positions.filter(p => rule.branches.includes(p.branch));
      const uniqBranches = new Set(hits.map(h => h.branch));
      if (uniqBranches.size === 3) {
        out.push({ members: hits, kind: 'xing', subtype: '三刑',
                   type: 'sanxing', xingKind: rule.kind,
                   desc: `${rule.branches.join('')}三刑(${rule.kind})` });
      }
    }
    // 子卯互刑
    const childCount = positions.filter(p => p.branch === '子').length;
    const rabbitCount = positions.filter(p => p.branch === '卯').length;
    if (childCount && rabbitCount) {
      const hits = positions.filter(p => p.branch === '子' || p.branch === '卯');
      out.push({ members: hits, kind: 'xing', subtype: '相刑',
                 type: 'xiangxing', desc: '子卯相刑(无礼之刑)' });
    }
    // 自刑：同支重复
    for (const b of C.ZI_XING) {
      const same = positions.filter(p => p.branch === b);
      if (same.length >= 2) {
        out.push({ members: same.slice(0, 2), kind: 'xing', subtype: '自刑',
                   type: 'zixing', desc: `${b}${b}自刑` });
      }
    }
    return out;
  }

  /* ------------------------------------------------------------
   *  优先级解析（"合解冲"等）
   * ------------------------------------------------------------ */
  function applyPriority(relations) {
    // 收集所有"被合"的 position key
    const heInvolved = new Set();
    relations.forEach(r => {
      if ((r.kind === 'he' || r.kind === 'sanhe' || r.kind === 'sanhui' || r.kind === 'sanhe-half')
          && !r.suppressed) {
        const ms = r.members || [r.a, r.b];
        ms.forEach(m => heInvolved.add(m.key));
      }
    });

    relations.forEach(r => {
      if (r.kind === 'chong' && r.type === 'liuchong') {
        const ms = [r.a, r.b];
        const involved = ms.some(m => heInvolved.has(m.key));
        if (involved) {
          r.suppressed = true;
          r.note = '合化解冲（贪合忘冲）';
        }
      }
    });

    // 三合 / 三会 抑制其中的六合（局成则忽略单字小合）
    relations.forEach(r => {
      if ((r.kind === 'sanhe' || r.kind === 'sanhui') && !r.suppressed) {
        const branches = new Set((r.members || []).map(m => m.branch));
        relations.forEach(s => {
          if (s !== r && s.kind === 'he' && s.type === 'liuhe') {
            if (branches.has(s.a.branch) && branches.has(s.b.branch)) {
              s.suppressed = true;
              s.note = `被${r.subtype}并入`;
            }
          }
        });
      }
    });

    return relations;
  }

  /* ------------------------------------------------------------
   *  对外主函数：返回所有关系
   * ------------------------------------------------------------ */
  function analyzeRelations(positions) {
    const all = [
      ...detectTianGanHe(positions),
      ...detectTianGanChong(positions),
      ...detectSanHui(positions),
      ...detectSanHe(positions),
      ...detectLiuHe(positions),
      ...detectLiuChong(positions),
      ...detectSanXing(positions),
      ...detectLiuHai(positions),
    ];
    applyPriority(all);
    return all;
  }

  /**
   * 把一个四柱 + 可选的大运/流年 转成 positions 数组
   */
  function chartToPositions(annotated, dayun, liunian) {
    const ps = [
      { key: 'year',  label: '年柱', stem: annotated.year.stem,  branch: annotated.year.branch },
      { key: 'month', label: '月柱', stem: annotated.month.stem, branch: annotated.month.branch },
      { key: 'day',   label: '日柱', stem: annotated.day.stem,   branch: annotated.day.branch },
      { key: 'hour',  label: '时柱', stem: annotated.hour.stem,  branch: annotated.hour.branch },
    ];
    if (dayun)   ps.push({ key: 'dayun',   label: '大运', stem: dayun.stem,   branch: dayun.branch });
    if (liunian) ps.push({ key: 'liunian', label: '流年', stem: liunian.stem, branch: liunian.branch });
    return ps;
  }

  global.Relations = {
    analyzeRelations, chartToPositions,
    detectTianGanHe, detectTianGanChong,
    detectLiuHe, detectLiuChong, detectLiuHai,
    detectSanHe, detectSanHui, detectSanXing,
  };
})(window);
