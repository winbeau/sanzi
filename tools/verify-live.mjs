// 线上 GitHub Pages 站点核验：对已部署的真实 URL 逐页检测
//   - 主文档 HTTP 状态(应为 200)
//   - 失败的资源请求(尤其 .css/.js —— /sanzi/ 基路径下最易出问题)
//   - 控制台报错
//   - 复用本地同款布局检查(横向溢出/重叠/越界…)
//   - 验证共享样式确实生效(body 背景不是默认白)
// 用法:
//   node tools/verify-live.mjs                         # 默认站点，全部页面
//   node tools/verify-live.mjs https://winbeau.github.io/sanzi/ pc/qa-chat.html mobile/qa-chat.html
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { verifyFile } from './verify-core.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SHOTS = path.join(ROOT, 'tools', 'report', 'live');

const DEFAULT_BASE = 'https://winbeau.github.io/sanzi/';
const IDS = ['home-entry','qa-chat','threshold-lookup','process-guide','operation-cards','policy-explain','case-learning','search','media-library','my-history-fav','help-settings','plugin-demo'];

function allPages() {
  const list = ['index.html'];
  for (const id of IDS) { list.push('pc/' + id + '.html'); list.push('mobile/' + id + '.html'); }
  return list;
}

function vpFor(rel) {
  return rel.startsWith('mobile') ? { width: 390, height: 844, isMobile: true } : { width: 1440, height: 900, isMobile: false };
}

async function cssApplied(url, isMobile) {
  // 单独再开一页，确认共享样式已加载：body 背景应被 tokens.css 改成非纯白
  const b = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  try {
    const ctx = await b.newContext({ viewport: { width: isMobile ? 390 : 1440, height: isMobile ? 844 : 900 } });
    const p = await ctx.newPage();
    await p.goto(url, { waitUntil: 'load', timeout: 45000 });
    await p.waitForTimeout(400);
    return await p.evaluate(() => {
      const bg = getComputedStyle(document.body).backgroundColor;
      const ff = getComputedStyle(document.body).fontFamily;
      return { bg, ff, hasVar: !!getComputedStyle(document.documentElement).getPropertyValue('--c-primary').trim() };
    });
  } finally { await b.close(); }
}

async function main() {
  fs.mkdirSync(SHOTS, { recursive: true });
  const args = process.argv.slice(2);
  let base = DEFAULT_BASE;
  let pages = [];
  for (const a of args) {
    if (/^https?:\/\//.test(a)) base = a.endsWith('/') ? a : a + '/';
    else pages.push(a);
  }
  if (!pages.length) pages = allPages();

  const results = [];
  for (const rel of pages) {
    const url = base + rel;
    const vp = vpFor(rel);
    const shot = path.join(SHOTS, rel.replace(/[\/]/g, '__').replace('.html', '.png'));
    process.stdout.write(`核验 ${url} ... `);
    try {
      const r = await verifyFile(url, { ...vp, screenshotPath: shot });
      // 资源失败里挑出关键的 css/js
      const assetFails = (r.findings || []).filter(f => f.type === 'request-failed' && /\.(css|js)(\?|$)/.test(f.msg));
      const css = await cssApplied(url, vp.isMobile);
      const styleOk = css.hasVar && css.bg && css.bg !== 'rgba(0, 0, 0, 0)' && css.bg.replace(/\s/g,'') !== 'rgb(255,255,255)';
      const ok = r.pass && (r.httpStatus === 200) && assetFails.length === 0 && styleOk;
      results.push({ rel, url, httpStatus: r.httpStatus, layoutPass: r.pass, errorCount: r.errorCount, assetFails: assetFails.map(f=>f.msg), styleOk, css, ok, findings: r.findings });
      console.log(ok ? `✅ ${r.httpStatus} 样式${styleOk?'已加载':'未加载?'} 布局✅` : `❌ status=${r.httpStatus} layout=${r.pass} 资源失败=${assetFails.length} 样式=${styleOk}`);
    } catch (e) {
      results.push({ rel, url, ok: false, error: e.message });
      console.log(`💥 ${e.message}`);
    }
  }

  fs.writeFileSync(path.join(SHOTS, 'live-report.json'), JSON.stringify({ base, results }, null, 2));
  const bad = results.filter(r => !r.ok);
  console.log('\n================ 线上核验汇总 ================');
  console.log(`站点: ${base}`);
  console.log(`页面 ${results.length} | 正常 ${results.length - bad.length} | 异常 ${bad.length}`);
  for (const r of bad) {
    console.log(`\n❌ ${r.rel}`);
    if (r.error) { console.log(`   渲染异常: ${r.error}`); continue; }
    if (r.httpStatus !== 200) console.log(`   HTTP ${r.httpStatus}`);
    if (!r.styleOk) console.log(`   共享样式疑似未加载: bg=${r.css?.bg} hasVar=${r.css?.hasVar}`);
    (r.assetFails||[]).forEach(m => console.log(`   资源失败: ${m}`));
    (r.findings||[]).filter(f=>f.level==='error').slice(0,6).forEach(f => console.log(`   布局: [${f.type}] ${f.msg}`));
  }
  console.log(`\n报告: ${path.relative(ROOT, path.join(SHOTS,'live-report.json'))}`);
  process.exitCode = bad.length ? 1 : 0;
}

main();
