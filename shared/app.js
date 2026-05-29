/* ============================================================
   三资管理助手 · 共享交互脚本（无依赖）
   - 主题/字号：URL ?theme= / ?font= 优先，其次 localStorage，再默认
   - 跨页持久化：切换后写入 localStorage，所有页面一致
   - 轻交互：引用折叠、分段/Tab、勾选清单、卡片翻转、悬浮助手开合
   ============================================================ */
(function () {
  var THEMES = ['green', 'blue', 'red'];
  var FONTS = ['normal', 'large'];

  function qs(name) {
    var m = new RegExp('[?&]' + name + '=([^&]+)').exec(location.search);
    return m ? decodeURIComponent(m[1]) : null;
  }
  function getStore(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function setStore(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  function resolveTheme() {
    var t = qs('theme') || getStore('sanzi-theme') || 'green';
    return THEMES.indexOf(t) >= 0 ? t : 'green';
  }
  function resolveFont() {
    var f = qs('font') || getStore('sanzi-font') || 'normal';
    return FONTS.indexOf(f) >= 0 ? f : 'normal';
  }

  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    document.querySelectorAll('[data-theme-swatch]').forEach(function (el) {
      el.classList.toggle('swatch--active', el.getAttribute('data-theme-swatch') === t);
    });
  }
  function applyFont(f) {
    document.documentElement.setAttribute('data-fontscale', f === 'large' ? 'large' : '');
    document.querySelectorAll('[data-font-opt]').forEach(function (el) {
      el.classList.toggle('seg__btn--active', el.getAttribute('data-font-opt') === f);
    });
  }

  // 立即应用（避免闪烁）——本函数在 <head> 末尾或 body 顶部尽早调用
  var THEME = resolveTheme();
  var FONT = resolveFont();
  applyTheme(THEME);
  applyFont(FONT);

  window.SanziUI = {
    setTheme: function (t) {
      if (THEMES.indexOf(t) < 0) return;
      THEME = t; setStore('sanzi-theme', t); applyTheme(t);
      // 同步给页面内的预览 iframe（决策页用）
      document.querySelectorAll('iframe[data-preview]').forEach(function (f) {
        try { syncIframe(f); } catch (e) {}
      });
    },
    setFont: function (f) {
      FONT = (f === 'large') ? 'large' : 'normal';
      setStore('sanzi-font', FONT); applyFont(FONT);
      document.querySelectorAll('iframe[data-preview]').forEach(function (f2) {
        try { syncIframe(f2); } catch (e) {}
      });
    },
    theme: function () { return THEME; },
    font: function () { return FONT; }
  };

  function syncIframe(frame) {
    var base = frame.getAttribute('data-preview');
    frame.src = base + (base.indexOf('?') >= 0 ? '&' : '?') + 'theme=' + THEME + '&font=' + FONT;
  }

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    // 决策页：初始化预览 iframe
    document.querySelectorAll('iframe[data-preview]').forEach(syncIframe);

    // 引用折叠
    document.addEventListener('click', function (e) {
      var head = e.target.closest('.src-list__head');
      if (head) {
        var box = head.closest('.src-list');
        box.setAttribute('data-collapsed', box.getAttribute('data-collapsed') === 'true' ? 'false' : 'true');
      }
    });

    // 分段控件 / Tab：data-seg 组内互斥；可选 data-target 切换面板
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-seg]');
      if (!btn) return;
      var group = btn.getAttribute('data-seg');
      document.querySelectorAll('[data-seg="' + group + '"]').forEach(function (b) {
        b.classList.toggle('seg__btn--active', b === btn);
      });
      var target = btn.getAttribute('data-target');
      if (target) {
        document.querySelectorAll('[data-panel-group="' + group + '"]').forEach(function (p) {
          p.classList.toggle('u-hide', p.getAttribute('data-panel') !== target);
        });
      }
    });

    // 勾选清单
    document.addEventListener('click', function (e) {
      var item = e.target.closest('.check__item');
      if (item) {
        item.classList.toggle('check__item--done');
        var box = item.querySelector('.check__box');
        if (box) box.textContent = item.classList.contains('check__item--done') ? '✓' : '';
      }
    });

    // 卡片翻转（操作卡正反面）data-flip 切换 .is-flipped
    document.addEventListener('click', function (e) {
      var f = e.target.closest('[data-flip]');
      if (f) {
        var card = f.closest('.flip') || document.getElementById(f.getAttribute('data-flip'));
        if (card) card.classList.toggle('is-flipped');
      }
    });

    // 主题/字号选择器
    document.querySelectorAll('[data-theme-swatch]').forEach(function (el) {
      el.addEventListener('click', function () { window.SanziUI.setTheme(el.getAttribute('data-theme-swatch')); });
    });
    document.querySelectorAll('[data-font-opt]').forEach(function (el) {
      el.addEventListener('click', function () { window.SanziUI.setFont(el.getAttribute('data-font-opt')); });
    });

    // 悬浮助手开合：data-assist-open / data-assist-close 控制 #assist 显隐
    document.addEventListener('click', function (e) {
      if (e.target.closest('[data-assist-open]')) {
        var a = document.getElementById('assist'); if (a) a.classList.remove('u-hide');
        var m = document.getElementById('assist-mask'); if (m) m.classList.remove('u-hide');
      }
      if (e.target.closest('[data-assist-close]') || e.target.id === 'assist-mask') {
        var a2 = document.getElementById('assist'); if (a2) a2.classList.add('u-hide');
        var m2 = document.getElementById('assist-mask'); if (m2) m2.classList.add('u-hide');
      }
    });

    // 阻止原型里空链接跳动
    document.querySelectorAll('a[href="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) { e.preventDefault(); });
    });
  });
})();
