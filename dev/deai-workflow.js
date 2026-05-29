export const meta = {
  name: 'sanzi-deai',
  description: '去 AI 味改造：把各页面 emoji 换成统一线性 SVG 图标、去内联 AI 样式，保持政务公文风一致，并过 Playwright 自检',
  phases: [{ title: 'Deai', detail: '每页一个 agent：emoji→图标 + 去 AI 味 + 自检' }],
}

const PREAMBLE = `「三资管理助手」原型正在做**去 AI 味 / 增政务庄重感**的视觉改造。设计系统(tokens.css/components.css/icons.css)已更新为「政务公文/档案编辑风」：衬线标题、近直角、扁平描边、深墨色调、统一细线图标。这些是全局自动生效的，你**不要改 CSS**。

你的任务：把指定页面里的**彩色 emoji 图标**替换为统一的线性 SVG 图标，并去掉个别内联 AI 味样式，使其与新标杆页一致。**不改文案、不改引用来源、不改布局结构与导航。**

【先读这些】
- dev/ICON-MAP.md  —— emoji→图标 的映射与规则（务必照它替换；→ ← ▾ ✓ ≤ ≥ 和 ①②③ 等序号保留）
- pc/home-entry.html 和 mobile/home-entry.html —— **已改造好的新标杆页**，照它的图标用法：如 \`<span class="navx__ico"><i class="ico ico-home"></i></span>\`、\`<i class="ico ico-shield trust-bar__ico"></i>\`、按钮内 \`<i class="ico ico-edit btn__ico"></i>\`
- 你负责的页面文件本身

【要做】
1. 把页面里所有 emoji 图标按 ICON-MAP 换成 \`<i class="ico ico-名称"></i>\`，放在原 emoji 位置；结论印章 .verdict-pill 内用 ico-check / ico-close。
2. 删除内联的大圆角像素值与 linear-gradient 渐变（改用 token / 组件类 / var(--grad-hero)，它已是实底）；不要内联写死颜色。
3. 其余一律不动（文字、引用、结构、导航、data- 属性）。

【自检：必须通过】在仓库根目录运行：
  node tools/verify-all.mjs <你的文件们>
读 stdout，必须全部 ✅ 通过(0 错误)。如有 ❌ 按提示修，最多 4 次。以 stdout 为准。
完成后用 StructuredOutput 返回。`

const SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['id', 'allPass', 'emojiLeft', 'summary'],
  properties: {
    id: { type: 'string' },
    allPass: { type: 'boolean', description: '所有文件 Playwright 自检是否 0 错误通过' },
    emojiLeft: { type: 'integer', description: '替换后残留的彩色 emoji 数量(应为0；保留的排版符号/序号不计)' },
    summary: { type: 'string' },
  },
}

const PAGES = [
  { id: 'qa-chat', files: 'pc/qa-chat.html mobile/qa-chat.html' },
  { id: 'threshold-lookup', files: 'pc/threshold-lookup.html mobile/threshold-lookup.html' },
  { id: 'process-guide', files: 'pc/process-guide.html mobile/process-guide.html' },
  { id: 'operation-cards', files: 'pc/operation-cards.html mobile/operation-cards.html' },
  { id: 'policy-explain', files: 'pc/policy-explain.html mobile/policy-explain.html' },
  { id: 'case-learning', files: 'pc/case-learning.html mobile/case-learning.html' },
  { id: 'search', files: 'pc/search.html mobile/search.html' },
  { id: 'media-library', files: 'pc/media-library.html mobile/media-library.html' },
  { id: 'my-history-fav', files: 'pc/my-history-fav.html mobile/my-history-fav.html' },
  { id: 'help-settings', files: 'pc/help-settings.html mobile/help-settings.html' },
  { id: 'plugin-demo', files: 'pc/plugin-demo.html mobile/plugin-demo.html' },
  { id: 'index', files: 'index.html' },
]

phase('Deai')
const results = await parallel(
  PAGES.map((p) => () =>
    agent(
      `${PREAMBLE}\n\n========== 你负责 ==========\nid = ${p.id}\n文件：${p.files}\n自检命令：node tools/verify-all.mjs ${p.files}\n\n现在开始：读 ICON-MAP 与标杆页 → 替换 emoji、去 AI 味 → 自检至通过 → 返回结构化结果(emojiLeft 用 grep 统计残留彩色 emoji 数)。`,
      { label: `deai:${p.id}`, phase: 'Deai', schema: SCHEMA }
    )
  )
)

return { pages: results.filter(Boolean) }
