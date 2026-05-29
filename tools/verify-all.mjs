// 批量布局检查：扫描 pc/ (1440x900) 与 mobile/ (390x844) 下所有 .html，
// 逐页用 Playwright 渲染、截图、检测布局冲突，输出汇总报告。
// 用法:
//   node tools/verify-all.mjs                 # 检查全部
//   node tools/verify-all.mjs pc/qa-chat.html # 检查单个文件(视口按所在目录推断)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifyFile } from './verify-core.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SHOTS = path.join(ROOT, 'tools', 'report', 'screenshots');
const REPORT = path.join(ROOT, 'tools', 'report', 'report.json');

const VIEWPORTS = {
  pc: { width: 1440, height: 900, isMobile: false },
  mobile: { width: 390, height: 844, isMobile: true },
};

function listHtml(dir) {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) return [];
  return fs.readdirSync(abs).filter((f) => f.endsWith('.html')).sort().map((f) => path.join(dir, f));
}

function vpFor(relFile) {
  return relFile.startsWith('mobile') ? VIEWPORTS.mobile : VIEWPORTS.pc;
}

async function main() {
  fs.mkdirSync(SHOTS, { recursive: true });
  const argFiles = process.argv.slice(2);
  const files = argFiles.length
    ? argFiles.map((f) => path.relative(ROOT, path.resolve(f)))
    : [...listHtml('pc'), ...listHtml('mobile')];

  if (!files.length) { console.log('未找到 HTML 文件 (pc/ 或 mobile/ 为空)'); return; }

  const results = [];
  for (const rel of files) {
    const vp = vpFor(rel);
    const shot = path.join(SHOTS, rel.replace(/[\/]/g, '__').replace('.html', '.png'));
    process.stdout.write(`检查 ${rel} @ ${vp.width}x${vp.height} ... `);
    try {
      const r = await verifyFile(path.join(ROOT, rel), { ...vp, screenshotPath: shot });
      r.screenshot = path.relative(ROOT, shot);
      results.push(r);
      console.log(r.pass ? `✅ 通过 (warn ${r.warningCount})` : `❌ ${r.errorCount} 个错误, ${r.warningCount} 个警告`);
    } catch (e) {
      console.log(`💥 渲染失败: ${e.message}`);
      results.push({ file: rel, pass: false, errorCount: 1, warningCount: 0, findings: [{ level: 'error', type: 'render-fail', msg: e.message }] });
    }
  }

  fs.mkdirSync(path.dirname(REPORT), { recursive: true });
  fs.writeFileSync(REPORT, JSON.stringify({ generatedFiles: files.length, results }, null, 2));

  const failed = results.filter((r) => !r.pass);
  console.log('\n================ 汇总 ================');
  console.log(`页面总数: ${results.length}  通过: ${results.length - failed.length}  失败: ${failed.length}`);
  for (const r of failed) {
    console.log(`\n❌ ${r.file} (${r.viewport || ''})`);
    for (const f of (r.findings || []).filter((x) => x.level === 'error').slice(0, 12)) {
      console.log(`   - [${f.type}] ${f.msg}${f.selector ? `  @ ${f.selector}` : ''}`);
    }
  }
  console.log(`\n报告: ${path.relative(ROOT, REPORT)}`);
  console.log(`截图: ${path.relative(ROOT, SHOTS)}/`);
  process.exitCode = failed.length ? 1 : 0;
}

main();
