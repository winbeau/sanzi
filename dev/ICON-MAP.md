# Emoji → 线性图标 映射（去 AI 味改造必读）

把页面里的**彩色 emoji 图标**全部换成统一的细线 SVG 图标：`<i class="ico ico-名称"></i>`（图标在 shared/icons.css，已通过 components.css 自动引入，无需改 head）。
图标颜色继承父级文字色，尺寸随字号(1em)。放在原 emoji 所在位置即可。

## 保留（不要替换，它们是干净的排版符号，不是 AI 味）
`→  ←  ▾  ✓  ≤  ≥` 以及圆圈序号 `① ② ③ ④ ⑤ ⑥ ⑦`。
（`▶` 播放键请替换为 `<i class="ico ico-play"></i>`；`✕ ✗ ✖` 关闭替换为 `<i class="ico ico-close"></i>`）

## 映射表（emoji → ico 名）
- 🏠 home｜💬 chat｜🔢🧮 calc｜🪜 steps｜🗂📂 folder｜📦 archive｜🃏 cards｜🗂️ cards(导航“操作卡片”用 ico-cards)
- 📖📗📕📙📘 book｜📚 docs｜📄 doc｜📑📋 doc｜🧾 receipt｜📝✏✏️ edit
- ⚖ scale｜🔍🔎 search｜🎬📹 video｜▶ play｜⭐ star｜⚙ settings｜🎨 palette｜🔠 font
- 📍 pin｜👤🧑 user｜👥 users｜❓🤔🛟 help｜📎 attach｜⏱🕒 time｜📅🗓 calendar
- ⬇ download｜📤 upload｜💰💵 money｜💳 card｜🏦 bank｜🌾 crop｜🗳 vote
- 📣📢 announce｜👀 eye｜🛡 shield｜🔁🔄 refresh｜🔊 sound｜🎧 audio｜🌐 globe
- 📊 chart｜🧩 puzzle｜🖥 desktop｜📱 mobile｜🏛🏙 building｜🔔 bell｜💼 briefcase
- 📞 phone｜✉ mail｜🤝 handshake｜🏗🧱 build｜📌 bookmark｜💡 bulb｜⚠ warn｜💔 warn
- 🚫📵 ban｜✅👍 check｜❌👎 close

## 特殊位置
- **结论印章 .verdict-pill**：把内部 emoji 换成 `<i class="ico ico-check"></i>`(可办/能) 或 `<i class="ico ico-close"></i>`(不可办/不能)，置于文字前；没有 emoji 的保持纯文字即可。
- **导航 .navx__ico / .m-tab__ico / .qcard__ico / .trust-bar__ico / .alert__ico / .rolechip__ico / .src__ico / .step 等**：原本放 emoji 的 span 里改放 `<i class="ico ico-名称"></i>`。例：`<span class="navx__ico"><i class="ico ico-home"></i></span>`。
- **按钮内**：`<i class="ico ico-名称 btn__ico"></i>`。
- 找不到贴切图标时，就近选一个语义最接近的（宁可少放图标，也不要用 emoji）。允许去掉纯装饰性 emoji（如标题里的 emoji）只留文字。

## 顺带去 AI 味（轻量）
- 若页面内联写了 `border-radius` 较大的像素值或渐变 `linear-gradient(...)`：删除/改用 `var(--grad-hero)`(已是实底) 或组件类；圆角统一靠 token，不要内联大圆角。
- 标题已由 components.css 自动用衬线体，无需改。
- 不要改动文案、引用来源、布局结构与导航；只做“emoji→图标 + 去内联 AI 样式”。
