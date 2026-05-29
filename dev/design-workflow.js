export const meta = {
  name: 'sanzi-design',
  description: '多 agent 分工设计三资管理助手 11 个页面(PC+移动各一套)，每页自检 Playwright 布局并修复至通过',
  phases: [
    { title: 'Design', detail: '每页一个 agent：设计 PC+移动 两套并自检修复' },
  ],
}

const PREAMBLE = `你是资深前端/UI 工程师，为「三资管理助手」(面向村三资专干的智能问答工具)设计**纯静态 HTML 原型页面**。
使用对象数字素养低、年龄偏大，所以要：极简、超大字、高对比、口语化、强引导、结论先行、处处标引用来源、严防幻觉。

【开工前必读】请先用 Read 读这些文件（它们是设计系统与标杆页，你必须复用，不要另起炉灶）：
- dev/DESIGN-CONTRACT.md  （设计契约：铁律、统一导航清单、组件速查、自检与交付要求 —— 严格遵守）
- dev/CONTENT-PACK.md     （内容素材包：权威引用、红线、流程、阈值、案例、选题 —— 用它填充真实可信内容）
- shared/tokens.css, shared/components.css, shared/app.js  （令牌/组件/交互）
- pc/home-entry.html, mobile/home-entry.html  （PC 与移动标杆页：照抄外壳结构与 <head>、导航清单）

【硬性要求】
- 只用语义化 CSS 变量，绝不写死品牌色；正文≥18px(--fs-500)、按钮≥20px(--fs-600)；移动端关键按钮用 .btn--lg(≥56px)。
- <head> 与导航必须与标杆页一致（PC 侧栏 11 项 + 版本预览；移动底部 5 tab；非 tab 页移动端顶栏左上放 ← 返回 home-entry.html）。当前页对应导航项加 --active。
- 每个“结论/政策/数字”旁配 .src 引用来源（用 CONTENT-PACK 里的真实法规名+条款+日期）；阈值/时限处放 .alert--warn “以本县市最新制度为准”；办理动作用 .btn--external “去主系统办理”；合适处放 .fallback 兜底卡。
- 任何元素不得横向溢出视口；不要用负 margin/固定高度造成文字重叠。

【自检：必须做到通过】在仓库根目录运行：
  node tools/verify-all.mjs pc/<id>.html mobile/<id>.html
读 stdout，必须两页都“✅ 通过(0 错误)”。若 ❌：横向溢出→查固定宽度/grid 列；文本块重叠→查负 margin/绝对定位/裁剪。改完重跑，最多迭代 4 次。以 stdout 为准，不要读 report.json。

【交付】写出 pc/<id>.html 与 mobile/<id>.html 两个文件。然后用 StructuredOutput 返回结果。
`

const RESULT_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['id', 'pcPass', 'mobilePass', 'summary', 'issuesFixed'],
  properties: {
    id: { type: 'string' },
    pcPass: { type: 'boolean' },
    mobilePass: { type: 'boolean' },
    summary: { type: 'string', description: '该页一句话说明(中文)' },
    issuesFixed: { type: 'array', items: { type: 'string' }, description: '自检中发现并修复的问题' },
  },
}

const PAGES = [
  {
    id: 'qa-chat', name: '智能问答对话页',
    spec: `目的：核心交付页，承载多轮对话与三段式答案（结论→流程→操作），每条答案带引用来源与“未找到”兜底。
核心元素：对话气泡流(.chat/.msg/.bubble)；助手答用 .answer__verdict + verdict-pill（能/不能/需注意）、两个 .answer__seg（“该怎么办”流程、“系统里怎么点”操作）、.answer__jump 跳转按钮（看流程/看政策/看案例/看视频/去主系统办理）、.src-list 可折叠引用；至少出现 1 次 .fallback 兜底卡（演示某个查不到的问题）；底部吸底输入栏(.askbar + 语音.mic)，上方一排 .suggest 追问气泡；助手气泡可带“朗读/收藏”小图标(.iconbtn)。
PC：左侧标准侧栏(11项,“智能问答”active)；主区对话居中(max-width≈820)；可在右侧加一窄“相关推荐”悬浮列(可选)。
移动：标准 m-shell，顶栏左 ← 返回、标题“智能问答”、底部不放 tab 也可（用 m-tabbar 高亮无）——按契约：非tab页仍保留底部 m-tabbar，但顶栏左上放 ←；对话流全屏，输入栏吸底（注意不要被 m-tabbar 盖住，可让输入栏在 tabbar 之上：放在 m-main 内底部并预留空间，或在移动端隐藏 tabbar 仅此页可加 class）。引用默认折叠为“查看依据(N)”。跳转按钮做成横向可滑 .chips--scroll。
内容：用 CONTENT-PACK E 节的问答（至少做 2–3 轮：如“招待餐费能不能报”“多少钱要上会→引导去速查”“白条能不能入账”），引用用 A 节法规。`,
  },
  {
    id: 'threshold-lookup', name: '阈值/权限速查',
    spec: `目的：解决最高频最易错的金额型规则：选事项类型+输入金额→自动判定审批路径/是否上会/是否进场/是否招投标。
核心元素：事项类型选择(用 .chip 或 .seg：资产购建/资产处置/资源发包/工程建设/现金资金/合同)；金额输入(.input 大号，旁注“元”)；“查一查”主按钮；结果卡 .result（result__head 给一句话结论，result__body 用 .kv 列出：决策程序/表决比例/是否进场/是否备案）；结果区放 .alert--warn “以本县市最新制度为准”；底部“看完整流程”(.btn--soft 链 process-guide)与“去问助手”(链 qa-chat)。可预置一个示例结果（资产处置 8000 元）默认展示，便于看效果。
PC：侧栏“阈值速查”active；左条件区(类型+金额)，右大结果卡；可并排“国家通用版/本地差异”。
移动：竖向 选类型→填金额→出结果；金额输入大；强提示醒目色条置于结果上方。底部 m-tabbar “速查”active。
内容：用 CONTENT-PACK D 节阈值表（中方县2025示例），引用 A 节与“本县细则”。`,
  },
  {
    id: 'process-guide', name: '流程指引（分步向导）',
    spec: `目的：把高频业务做成 step-by-step 向导，标注每步签字角色/材料/时限，只导引不执行。
核心元素：顶部流程切换(.seg 或 .chips：报销七步/银农直联六步/四议两公开六步/清产核资九步)；进度条 .progress（第几步）；纵向 .steps/.step（编号+一句话动作+ .step__meta 角色/材料/时限 metachip）；右侧或下方 .check 合规检查清单（如票据六有、公示天数、表决比例、备案时限，可勾选）；每个流程底部“去主系统办理”.btn--external 与“超权限请上报乡镇”.alert--warn；相关视频/案例跳转。默认展示“报销七步签字链”。
PC：侧栏“流程指引”active；左流程目录(.navx 样式或 .chips 竖排)，右步骤主区；检查清单作右侧 .card 边栏。
移动：顶部流程切换下拉/chips，步骤卡纵向全宽，进度条吸顶；检查清单可在下方。底部 m-tabbar “流程”active。
内容：用 CONTENT-PACK C 节全部流程，引用 A 节。`,
  },
  {
    id: 'operation-cards', name: '操作卡片专题',
    spec: `目的：各核心动作的速查卡片库（正面步骤 / 背面注意红线材料），供快速翻查照做。
核心元素：顶部标签筛选 .chips--scroll（资金/资产/资源/合同/财务公开/成员股权）；卡片网格(.card)：资产盘点、清产核资九步、资源台账六步、报销票据六有、银农直联六步、村务卡使用、财务公开三要素、成员认定三公示、承包租赁招标；每张卡可“翻转”看背面(用 .flip + data-flip + is-flipped，或简单用 .seg 正反切换)；每卡 .src 来源 + “看视频/下载模板”入口。
PC：侧栏“操作卡片”active；3–4 列卡片网格(.qgrid 自定义列)；点击展开详情。
移动：单列大卡，2列筛选 chips；点进全屏详情，正反用 .seg 切换。底部 m-tabbar 不高亮（非 tab），顶栏左 ←。
内容：用 CONTENT-PACK C 流程要点 + B 红线，引用 A 节。`,
  },
  {
    id: 'policy-explain', name: '政策与制度解读',
    spec: `目的：按效力层级分层展示三资法规，口语化解读+原文对照+生效日期，作为问答依据底座。
核心元素：左/上 效力层级分组（国家法律→部门规章→省市意见→县乡细则）；法规条目卡：名称 + .badge--date 生效徽标 + 一句话大白话摘要；详情：大白话解读 + 原文折叠(.src-list 或 details)；专题入口 .qcard（四议两公开/财务公开/成员身份与股权/非生产性开支红线/清产核资）；每条 .src 来源链接 + .badge--region 适用地区。默认展开《农村集体经济组织法》。
PC：侧栏“政策解读”active；左分层目录，中条目列表，右详情；生效日期徽标醒目。
移动：顶部分层折叠/chips，条目竖列点进详情；原文默认折叠、解读在前；专题大按钮。顶栏左 ←。
内容：用 CONTENT-PACK A 节 1–8 与 G 节，引用务必带生效日期。`,
  },
  {
    id: 'case-learning', name: '案例学习（违规警示+示范）',
    spec: `目的：用真实违纪案例警示 + 优秀做法示范，正反对照强化红线，提供风险自查。
核心元素：顶部 10 类违纪手法分类 .chips--scroll；案例卡 .case 四段式（违纪事实/问题类型/处理结果/涉及条款，带 .src 出处，问题类型用 .tag--risk）；进入详情是 .compare 正反对照（左 bad 错误做法+处分，右 good 示范做法+正确流程）；“风险自查问题库”入口（用 .check 清单做一个小自测，勾选后给整改建议 .alert）。
PC：侧栏“案例学习”active；左分类，中案例卡列表，右/详情 .compare 分栏；自查作为一个 .card 区块或 .seg Tab。
移动：分类 chips 横滑，案例卡竖列，详情 .compare 上下分段色块；自查清单逐项可勾选。底部 m-tabbar “案例”active。
内容：用 CONTENT-PACK F 节案例（至少 4 个）+ 吉林数据，引用 A、B 节。`,
  },
  {
    id: 'search', name: '知识库统一检索',
    spec: `目的：自然语言/关键词跨法规/流程/案例/视频检索，结果带来源，可一键转问答追问。
核心元素：大号搜索框 .askbar(或 .input+按钮) + 语音；热门/动作型问句建议 .suggest（盘亏怎么核销/村务卡能刷多少/合同写哪些条款/多少钱上会）；结果列表按类型分组（用 .seg 切换 全部/政策/流程/案例/视频，配 data-seg/data-target/data-panel）：每条结果 .card 带类型 .tag + .src 来源 + “去问助手追问”“看操作卡”入口；顶部 .alert--warn 适用地区/以本县市最新为准。给出一组示例搜索结果（搜“报销”）。
PC：侧栏“知识检索”active；顶部搜索框，下方分组结果（左类型筛选可用 .seg，右结果列表）。
移动：搜索框+语音置顶，结果分组用 .seg 分段；结果大卡可点。顶栏左 ←。
内容：综合 CONTENT-PACK 各节，引用 A 节。`,
  },
  {
    id: 'media-library', name: '学习视频/音频',
    spec: `目的：高频易错操作的短视频/音频学习，大字幕、误区警示，三联跳转操作卡/问答/依据。
核心元素：分类筛选 .chips（资金/资产/资源/合同/财务公开）；视频卡网格 .vcard（封面 .vcard__cover + ▶ + 时长 + 标题）；一个“正在播放”区 .player（占位）+ 要点摘要(.check 或列表) + 配套“看操作卡/去问助手/看依据”跳转 + 倍速/纯音频/字号按钮(.seg/.chip)。
PC：侧栏“视频音频”active；上方大 .player + 右侧播放列表，下方相关 .vcard 推荐。
移动：顶部 .player 全宽，下方竖列 .vcard 列表；字幕大、可放大。顶栏左 ←。
内容：用 CONTENT-PACK H 节选题（封面标题+时长），引用 A 节作为视频依据。`,
  },
  {
    id: 'my-history-fav', name: '我的（历史与收藏）',
    spec: `目的：归档问答历史、收藏常用流程/速查/案例/视频，便于复用，对冲人员流动。
核心元素：顶部 .seg 切换“历史问答 / 我的收藏”；历史列表：每条 .card（问题 + 时间 + “再次提问”.btn--soft）；收藏分组 .chips（常用流程/速查/案例/视频）+ 收藏卡列表，每条带“打开/导出/取消收藏”；离线可查标记 .badge；顶部一个用户信息条(.rolechip 角色+地区)。给出示例历史与收藏数据。
PC：侧栏“我的收藏”active；左分组(历史/收藏)，右条目列表+预览。
移动：上方 .seg 切历史/收藏，竖列卡片，操作按钮大。底部 m-tabbar “我的”active。
内容：复用前述问答/流程/案例标题作为示例条目。`,
  },
  {
    id: 'help-settings', name: '帮助与设置（适老化/角色/地区/边界）',
    spec: `目的：新手引导、适老化设置、角色与地区选择、产品边界与防幻觉说明、转人工入口。
核心元素：① 主题选择 .theme-pick（3 个 .swatch 带 data-theme-swatch=green/blue/red，每个显示3个色点+名称）；② 字号 .seg（data-font-opt=normal/large，“标准/大字”）；③ 语音播报开关等 .setrow + .switch；④ 角色选择(.chips：村报账员/三资专干/村会计/村干部) + 地区(.rolechip/选择器)；⑤ 新手引导“怎么问/看不懂怎么办”图文 .card；⑥ 产品边界说明(.alert--info：解释器非执行器) + 防幻觉机制说明(.alert--info：处处标依据/未找到不编造) + 引用机制；⑦ 转人工/留言反馈入口 .btn + 联系乡镇农经站指引。
PC：侧栏“帮助设置”active；左设置分组导航(.navx 或 .seg)，右表单。
移动：竖向设置列表，大行高大开关；角色/地区全屏选择器；引导可跳过分步卡。顶栏左 ←。
注意：主题/字号选择器要带正确的 data 属性，app.js 会接管切换并持久化。
内容：用 CONTENT-PACK B（边界）、J（角色地区）。`,
  },
  {
    id: 'plugin-demo', name: '悬浮助手插件演示（嵌入主系统）',
    spec: `目的：演示“全局插件、就地提问、深链回办理”——在一个【模拟三资主系统】的业务页右下角嵌入可唤醒的悬浮助手。这是体现“像插件全局可用”的关键页。
核心元素：
- 模拟主系统外壳：顶部用 .mock-top（深色，logo“XX县农村集体三资管理平台”+ 几个 .mock-tab，其中“报账填报”active）；主体是一个【报账单填报】表单，用 .mock-form-row（左 .mock-form-row__label 右控件）：报账日期、事由、开支类型(下拉，含“非生产性开支-招待费”)、金额、附件(发票)上传占位、经办人；底部一个“提交审批”按钮(普通 .btn--primary，属于主系统)。整体要让人一看就知道这是“别的系统”，助手是浮在上面的插件。
- 悬浮助手：右下角 .fab “🎤 问助手”(data-assist-open)；点开 .assist 面板(#assist，默认不带 u-hide 让它在原型里就展开可见，方便截图)：assist__head 标题“三资管理助手 · 就地帮您看”，assist__body 里放一条上下文相关的三段式答案——演示“用户在填‘招待费’这步，问‘这个能不能报’”：.answer__verdict（不能直接报）+ 简短流程 + .src 引用 + .btn--external “去主系统对应步骤办理”；assist__foot 放一个 .askbar 迷你输入。
- 用 .alert--info 一句话点明：“助手只读取当前页信息做解释与合规提醒，不替你提交。”
PC：直接用模拟外壳铺满（不用 pc-shell 侧栏，因为这是“别的系统”页面）；.fab 固定右下、.assist 浮于其上。
移动：模拟主系统的移动表单(全屏)，底部 .fab--round 圆按钮；点开用 .sheet 底部抽屉(配 .sheet-mask)呈现助手会话（抽屉里同样的三段式答案+引用+去办理）。为截图可见，移动端可让 .sheet 默认展开(不加 u-hide)。
内容：用 CONTENT-PACK E1（招待餐费）与 B（边界），引用 A2 财务制度。
注意：本页 .fab/.assist/.sheet 在“整页内容截图”里会被隐藏，但“视口截图”(.viewport.png)会展示——这是正常的，确保 verify 两端都通过即可。`,
  },
]

phase('Design')
const results = await parallel(
  PAGES.map((p) => () =>
    agent(
      `${PREAMBLE}\n\n========== 你负责的页面 ==========\n【${p.name}】 id = ${p.id}\n${p.spec}\n\n现在开始：先 Read 必读文件，再写 pc/${p.id}.html 和 mobile/${p.id}.html，然后运行 node tools/verify-all.mjs pc/${p.id}.html mobile/${p.id}.html 自检并修复至两页通过，最后返回结构化结果。`,
      { label: `design:${p.id}`, phase: 'Design', schema: RESULT_SCHEMA }
    )
  )
)

return { pages: results.filter(Boolean) }
