// 三资管理助手 —— 布局检查核心模块
// 使用 Playwright 渲染单个 HTML 页面，检测：横向溢出、元素超出视口、
// 内容被裁剪(盖住)、静态元素互相重叠(盖住)、元素跑到屏幕外(错位)、
// 移动端点击目标过小、缺少 viewport meta、控制台报错。
import { chromium } from 'playwright';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const TOL = 2; // 像素容差

// 在页面上下文里执行的检查函数（被序列化注入）
function inPageChecks(opts) {
  const TOL = opts.tol;
  const isMobile = opts.isMobile;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const findings = [];
  const add = (level, type, msg, el) => {
    findings.push({
      level, type, msg,
      selector: el ? cssPath(el) : null,
      rect: el ? roundRect(el.getBoundingClientRect()) : null,
    });
  };
  const roundRect = (r) => ({
    x: Math.round(r.x), y: Math.round(r.y),
    w: Math.round(r.width), h: Math.round(r.height),
    right: Math.round(r.right), bottom: Math.round(r.bottom),
  });
  function cssPath(el) {
    const parts = [];
    let cur = el;
    while (cur && cur.nodeType === 1 && parts.length < 5) {
      let sel = cur.nodeName.toLowerCase();
      if (cur.id) { sel += '#' + cur.id; parts.unshift(sel); break; }
      if (cur.className && typeof cur.className === 'string') {
        const c = cur.className.trim().split(/\s+/).slice(0, 2).join('.');
        if (c) sel += '.' + c;
      }
      const parent = cur.parentNode;
      if (parent && parent.nodeType === 1) {
        const sibs = Array.from(parent.children).filter((s) => s.nodeName === cur.nodeName);
        if (sibs.length > 1) sel += `:nth-of-type(${sibs.indexOf(cur) + 1})`;
      }
      parts.unshift(sel);
      cur = cur.parentNode;
    }
    return parts.join(' > ');
  }
  const isVisible = (el) => {
    const s = getComputedStyle(el);
    if (s.display === 'none' || s.visibility === 'hidden' || parseFloat(s.opacity) === 0) return false;
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return false;
    return true;
  };
  const docEl = document.documentElement;

  // 1) 页面级横向溢出
  if (docEl.scrollWidth > vw + TOL) {
    add('error', 'h-overflow-page',
      `页面出现横向滚动：scrollWidth=${docEl.scrollWidth} > 视口宽度 ${vw}（布局被撑破/错位）`, null);
  }

  const all = Array.from(document.querySelectorAll('body *')).filter(isVisible);

  // 横向可滚动祖先（轮播/横滑 chips 等）：其内容本就允许超出，不算越界
  const inScrollX = (el) => {
    let cur = el.parentElement;
    while (cur && cur !== document.body && cur.nodeType === 1) {
      const ox = getComputedStyle(cur).overflowX;
      if (ox === 'auto' || ox === 'scroll') return true;
      cur = cur.parentElement;
    }
    return false;
  };

  // 2) 元素右边界超出视口
  for (const el of all) {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    if (s.position === 'fixed') continue; // 固定层(如顶栏)允许贴边
    if (inScrollX(el)) continue;          // 横滑容器内的内容允许超出
    if (r.right > vw + TOL && r.width <= vw + TOL && r.width > 4) {
      // 仅当元素本身不比视口宽（否则是其内容问题）且确实越界
      add('error', 'el-overflow-right',
        `元素超出视口右侧 ${Math.round(r.right - vw)}px`, el);
    }
  }

  // 3) 内容被裁剪（overflow:hidden 且内容更大 → 文字/图标被盖住）
  for (const el of all) {
    const s = getComputedStyle(el);
    const clipX = (s.overflowX === 'hidden' || s.overflow === 'hidden');
    const clipY = (s.overflowY === 'hidden' || s.overflow === 'hidden');
    if (clipX && el.scrollWidth > el.clientWidth + 4) {
      add('warning', 'content-clip-x', `横向内容被裁剪 (scrollW ${el.scrollWidth} > clientW ${el.clientWidth})`, el);
    }
    if (clipY && el.scrollHeight > el.clientHeight + 4 && el.clientHeight > 0) {
      // 仅对明显应展示完整内容的元素告警
      const tag = el.nodeName.toLowerCase();
      if (['button', 'a', 'h1', 'h2', 'h3', 'label', 'span', 'li'].includes(tag)) {
        add('warning', 'content-clip-y', `纵向内容被裁剪 (scrollH ${el.scrollHeight} > clientH ${el.clientHeight})`, el);
      }
    }
  }

  // 4) 静态文本块互相重叠（盖住）。保守策略：只看带直接文本、静态定位、非嵌套的块。
  //    关键：排除处于 fixed/sticky/absolute 容器内的元素（底部Tab栏、悬浮助手、吸顶栏、下拉层），
  //    它们本就应浮在内容之上，不算冲突。
  const hasDirectText = (el) => Array.from(el.childNodes).some(
    (n) => n.nodeType === 3 && n.textContent.trim().length > 1);
  const inFloatingContext = (el) => {
    let cur = el;
    while (cur && cur !== document.body && cur.nodeType === 1) {
      const p = getComputedStyle(cur).position;
      if (p === 'fixed' || p === 'sticky' || p === 'absolute') return true;
      cur = cur.parentElement;
    }
    return false;
  };
  const staticBlocks = all.filter((el) => {
    const s = getComputedStyle(el);
    if (s.position === 'absolute' || s.position === 'fixed' || s.position === 'sticky') return false;
    if (parseFloat(s.opacity) < 1) return false;
    if (inFloatingContext(el)) return false;
    return hasDirectText(el);
  });
  const seenPairs = new Set();
  for (let i = 0; i < staticBlocks.length; i++) {
    for (let j = i + 1; j < staticBlocks.length; j++) {
      const a = staticBlocks[i], b = staticBlocks[j];
      if (a.contains(b) || b.contains(a)) continue;
      const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
      const ix = Math.max(0, Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left));
      const iy = Math.max(0, Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top));
      const inter = ix * iy;
      if (inter <= 0) continue;
      const smaller = Math.min(ra.width * ra.height, rb.width * rb.height);
      if (smaller <= 0) continue;
      if (inter / smaller > 0.35) {
        const key = [i, j].join('-');
        if (seenPairs.has(key)) continue;
        seenPairs.add(key);
        add('error', 'overlap',
          `两个文本块重叠 ${Math.round((inter / smaller) * 100)}%（疑似盖住）：与 ${cssPath(b)}`, a);
      }
    }
  }

  // 5) 元素跑到屏幕外（错位）。排除可能的抽屉/弹层(transform/aria-hidden)
  for (const el of all) {
    const s = getComputedStyle(el);
    if (s.transform && s.transform !== 'none') continue;
    if (el.getAttribute('aria-hidden') === 'true') continue;
    if (inScrollX(el)) continue;   // 横滑容器内的内容滚出视口属正常
    const r = el.getBoundingClientRect();
    if (r.width < 8 || r.height < 8) continue;
    if (r.right < -TOL || r.left > vw + TOL) {
      add('warning', 'off-screen-x', `元素位于视口水平范围之外（疑似错位）`, el);
    }
  }

  // 6) 移动端点击目标过小（< 40px）
  if (isMobile) {
    const tappable = Array.from(document.querySelectorAll(
      'button, a[href], input:not([type=hidden]), select, textarea, [role=button], [onclick]'))
      .filter(isVisible);
    for (const el of tappable) {
      const r = el.getBoundingClientRect();
      // 行内文字链接不算
      const s = getComputedStyle(el);
      if (el.nodeName.toLowerCase() === 'a' && s.display.includes('inline')) continue;
      if (r.width < 40 || r.height < 40) {
        add('warning', 'small-tap', `点击目标偏小 ${Math.round(r.width)}x${Math.round(r.height)} (<40px)`, el);
      }
    }
    if (!document.querySelector('meta[name=viewport]')) {
      add('error', 'no-viewport-meta', '移动端页面缺少 <meta name="viewport">', null);
    }
  }

  return {
    findings,
    meta: {
      scrollWidth: docEl.scrollWidth,
      scrollHeight: docEl.scrollHeight,
      viewport: { w: vw, h: vh },
      elementCount: all.length,
    },
  };
}

export async function verifyFile(filePath, opts = {}) {
  const { width = 1440, height = 900, isMobile = false, screenshotPath = null } = opts;
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const consoleErrors = [];
  const failedRequests = [];
  let result;
  let result_httpStatus = null;
  try {
    const context = await browser.newContext({
      viewport: { width, height },
      deviceScaleFactor: isMobile ? 2 : 1,
      isMobile,
      hasTouch: isMobile,
      userAgent: isMobile
        ? 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Mobile Safari/537.36'
        : undefined,
    });
    const page = await context.newPage();
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
    page.on('pageerror', (e) => consoleErrors.push(String(e)));
    page.on('requestfailed', (r) => {
      const u = r.url();
      if (!u.startsWith('data:')) failedRequests.push(`${u} (${r.failure()?.errorText || '?'})`);
    });
    const isUrl = /^https?:\/\//.test(filePath);
    const url = isUrl ? filePath : pathToFileURL(path.resolve(filePath)).href;
    const resp = await page.goto(url, { waitUntil: 'load', timeout: 45000 });
    result_httpStatus = resp ? resp.status() : null;
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    await page.evaluate(() => document.fonts && document.fonts.ready).catch(() => {});
    await page.waitForTimeout(400);
    const checks = await page.evaluate(inPageChecks, { tol: TOL, isMobile });
    if (screenshotPath) {
      // (a) 视口代表图：吸顶/吸底/悬浮元素位置真实，最接近真机一屏所见
      await page.screenshot({ path: screenshotPath.replace(/\.png$/, '.viewport.png'), fullPage: false });
      // (b) 整页内容图：把吸底Tab栏转入文档流、收紧预留空白、隐藏临时浮层，便于审阅全部内容
      await page.addStyleTag({ content: `
        .m-tabbar{position:static!important;box-shadow:none!important;border-top:1px solid var(--c-border)!important}
        .m-main{padding-bottom:16px!important}
        .fab,.assist,.assist-panel,.sheet,.sheet-mask{display:none!important}
      ` });
      await page.screenshot({ path: screenshotPath, fullPage: true });
    }
    const findings = checks.findings;
    // 网络/控制台问题并入
    for (const e of consoleErrors.slice(0, 5)) findings.push({ level: 'warning', type: 'console-error', msg: e, selector: null, rect: null });
    for (const f of failedRequests.slice(0, 5)) findings.push({ level: 'warning', type: 'request-failed', msg: f, selector: null, rect: null });
    const errors = findings.filter((f) => f.level === 'error');
    const warnings = findings.filter((f) => f.level === 'warning');
    result = {
      file: filePath,
      httpStatus: result_httpStatus,
      viewport: `${width}x${height}`,
      isMobile,
      pass: errors.length === 0,
      errorCount: errors.length,
      warningCount: warnings.length,
      meta: checks.meta,
      findings,
    };
  } finally {
    await browser.close();
  }
  return result;
}
