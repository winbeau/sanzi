# 三资管理助手 · 设计契约（页面 agent 必读）

你要产出**纯静态 HTML 原型页面**（PC + 移动各一套），严格复用既有共享设计系统，保证 24 个页面**风格完全一致**。

## 0. 开工前必读这 5 个文件（它们是设计系统 + 标杆页）
- `shared/tokens.css` —— 设计令牌与三套主题变量
- `shared/components.css` —— 全部组件类（你只能组合这些类，不要发明新组件样式）
- `shared/app.js` —— 交互（主题/字号、引用折叠、分段Tab、勾选、悬浮助手开合）
- `pc/home-entry.html` —— **PC 标杆页**：照抄它的 `pc-shell / pc-sidenav / pc-topbar / pc-content` 结构与 `<head>`
- `mobile/home-entry.html` —— **移动标杆页**：照抄它的 `m-shell / m-topbar / m-main / m-tabbar` 结构与 `<head>`

## 1. 铁律
1. **只用语义化 CSS 变量**（如 `var(--c-primary)`），**绝不写死品牌色十六进制**。允许写少量布局相关的内联 style（grid 列数、间距用 `var(--sp-*)`、宽度等），但颜色一律用变量，这样三套主题才能自动切换。
2. **适老化大字**：正文用默认 `--fs-500`(18px)，按钮 `--fs-600`(20px)，关键结论加粗放大。不要出现密集小灰字。
3. **HTML 结构与 `<head>` 照标杆页**：每页 `<head>` 必含
   ```html
   <meta charset="utf-8">
   <meta name="viewport" content="width=device-width, initial-scale=1">
   <link rel="stylesheet" href="../shared/tokens.css">
   <link rel="stylesheet" href="../shared/components.css">
   <script src="../shared/app.js"></script>
   ```
   `<html lang="zh-CN" data-theme="green">`。
4. **导航必须与标杆页完全一致**（见 §2），当前页对应项加 `--active`。
5. **防幻觉是产品灵魂**：任何“结论/政策/数字”旁必须有 `.src` 引用来源标签（文件名+条款+生效日期）；涉及金额阈值/时限处放 `.alert--warn`“以本县市最新制度为准”；该页若涉及“查不到”的情形，要展示 `.fallback` 兜底卡。
6. **边界感**：凡是“真正办理（报账/签合同/交易/审批）”的按钮，一律用 `.btn--external`（文案“去主系统办理”），不要做成像能在本助手内完成。
7. 文案口语化、结论先行（先“能/不能、对/错”，再展开）。内容是**原型示例数据**，用真实法规名/条款/日期（见 CONTENT-PACK），但不夸大为权威。
8. 触控目标 ≥ 48px（移动端关键按钮 ≥ 56px，用 `.btn--lg`）。不要让任何元素横向溢出视口。

## 2. 统一导航清单（照抄）
**PC 侧边栏 `.navx`（11 项，顺序固定）**：首页 home-entry｜智能问答 qa-chat｜阈值速查 threshold-lookup｜流程指引 process-guide｜操作卡片 operation-cards｜政策解读 policy-explain｜案例学习 case-learning｜知识检索 search｜视频音频 media-library｜我的收藏 my-history-fav｜帮助设置 help-settings。底部再放“版本预览 → ../index.html”。图标沿用标杆页 emoji。

**移动底部 `.m-tabbar`（5 项固定）**：🏠首页 home-entry｜🪜流程 process-guide｜🔢速查 threshold-lookup｜⚖️案例 case-learning｜⭐我的 my-history-fav。其它页面（问答/政策/检索/视频/帮助/插件演示）从首页卡片或顶栏进入，移动端顶栏左侧放返回箭头 `←`（`<a class="iconbtn" href="home-entry.html">←</a>`），标题居中。当前页若属于 5 个 tab 之一则高亮该 tab，否则不高亮。

## 3. 组件速查（详见 components.css）
- 按钮：`.btn .btn--primary/--accent/--danger/--ghost/--soft/--external/--block/--lg/--sm`
- 卡片/区块：`.card .card--pad`，`.sect .sect__head .sect__title .sect__more`
- 首页大方块：`.qgrid` + `.qcard`(含 `.qcard__ico`)
- 对话：`.chat .msg .msg--user/--bot .msg__avatar .bubble`；三段式 `.answer__verdict`+`.verdict-pill--yes/no/caution`、`.answer__seg .answer__seg-title`、`.answer__jump`、追问 `.suggest`
- 引用：`.src`(含 `.src__ico/__name/__meta`)；折叠组 `.src-list[data-collapsed] .src-list__head/__body`
- 兜底：`.fallback`
- 提示：`.alert .alert--warn/--danger/--info`
- 步骤：`.steps .step .step__rail .step__no .step__line .step__body .step__title .step__meta`+`.metachip--who/--time`；进度 `.progress .progress__bar`
- 清单：`.check .check__item(.--done) .check__box`
- 速查结果：`.result .result__head .result__body`，键值 `.kv .kv__k .kv__v`
- 分段Tab：`.seg .seg__btn(.--active)`，配合 `data-seg="组名" data-target="面板名"` 与面板 `data-panel-group="组名" data-panel="面板名"`
- 案例：`.case`，正反 `.compare .compare__col--bad/--good .compare__label`
- 视频：`.vcard .vcard__cover .vcard__play .vcard__dur .vcard__body .vcard__title`，`.player`
- 标签徽标：`.chip(.--active) .chips(.--scroll)`，`.badge--date/--region/--new/--level`，`.tag--risk/--ok`
- 输入：`.input .textarea`，大提问框 `.askbar .askbar__input .mic .send`
- 角色地区：`.rolechip`
- 设置：`.setrow .switch`；主题/字号选择：`.theme-pick .swatch`（带 `data-theme-swatch="green|blue|red"`）、`[data-font-opt="normal|large"]`
- 悬浮助手：`.fab(.--round)`（`data-assist-open`）、`.assist`（`#assist`，默认加 `u-hide`，`data-assist-close`）、移动抽屉 `.sheet .sheet__grip`、遮罩 `#assist-mask.sheet-mask.u-hide`

## 4. 自检（必须做，直到通过）
写完后运行（在仓库根目录）：
```
node tools/verify-all.mjs pc/<id>.html mobile/<id>.html
```
读 **stdout**：必须两页都 `✅ 通过`（0 错误）。若有 `❌`，按提示修（最常见：元素横向溢出→检查固定宽度/grid；文本块重叠→检查负 margin/绝对定位/固定高度裁剪）。改完重跑，最多迭代 4 次。**不要依赖 report.json（多页并发会被覆盖），以 stdout 为准。**

## 5. 交付
产出 `pc/<id>.html` 与 `mobile/<id>.html` 两个文件。返回：最终是否通过、各页一句话说明、遇到并修复的问题。
