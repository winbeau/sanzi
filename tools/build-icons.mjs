// 生成 shared/icons.css —— 统一的细线描边 SVG 图标系统（替换 emoji）
// 用法: node tools/build-icons.mjs
// 用 mask-image，图标颜色继承 currentColor；页面用 <i class="ico ico-home"></i>
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// 每个图标的内部 SVG 标记（viewBox 0 0 24 24，描边风格）
const ICONS = {
  home: "<path d='M3 11l9-7 9 7'/><path d='M5 10v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9'/>",
  chat: "<path d='M4 5h16v11H9l-5 4z'/><path d='M8 9h8 M8 12h5'/>",
  calc: "<rect x='5' y='3' width='14' height='18' rx='1'/><path d='M8 7h8 M8 12h0 M12 12h0 M16 12h0 M8 16h0 M12 16h0 M16 16h0'/>",
  steps: "<path d='M3 20h4v-4h4v-4h4v-4h4V4'/>",
  cards: "<rect x='3' y='8' width='13' height='12' rx='1'/><path d='M7 4h13a1 1 0 0 1 1 1v11'/>",
  book: "<path d='M5 4h11a1 1 0 0 1 1 1v15H7a2 2 0 0 0-2 2z'/><path d='M5 18a2 2 0 0 1 2-2h10'/>",
  docs: "<rect x='8' y='8' width='12' height='13' rx='1'/><path d='M4 16V4a1 1 0 0 1 1-1h9'/>",
  doc: "<path d='M6 3h8l4 4v14H6z'/><path d='M14 3v4h4 M9 13h6 M9 17h4'/>",
  scale: "<path d='M12 4v16 M8 20h8 M5 8h14'/><path d='M5 8l-2 5a3 3 0 0 0 6 0z M19 8l-2 5a3 3 0 0 0 6 0z'/>",
  search: "<circle cx='11' cy='11' r='7'/><path d='M21 21l-4.5-4.5'/>",
  video: "<rect x='3' y='6' width='13' height='12' rx='1'/><path d='M16 10l5-3v10l-5-3z'/>",
  play: "<path d='M8 5v14l11-7z'/>",
  star: "<path d='M12 3l2.6 5.6 6.1.6-4.6 4.1 1.4 6L12 16.9 6.5 19.3l1.4-6L3.3 9.2l6.1-.6z'/>",
  settings: "<circle cx='12' cy='12' r='3'/><path d='M12 2v3 M12 19v3 M2 12h3 M19 12h3 M5 5l2 2 M17 17l2 2 M19 5l-2 2 M7 17l-2 2'/>",
  palette: "<path d='M12 3a9 9 0 1 0 0 18 2 2 0 0 0 2-2 2 2 0 0 1 2-2h1a4 4 0 0 0 4-4 9 9 0 0 0-9-8z'/><path d='M7 13h0 M9 8h0 M15 8h0'/>",
  font: "<path d='M4 19l6-14 6 14 M7 13h6 M16 10h4 M18 10v9'/>",
  pin: "<path d='M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11z'/><circle cx='12' cy='10' r='2.5'/>",
  user: "<circle cx='12' cy='8' r='4'/><path d='M4 20a8 8 0 0 1 16 0'/>",
  users: "<circle cx='9' cy='8' r='3.5'/><path d='M2.5 20a6.5 6.5 0 0 1 13 0 M16 5a3.5 3.5 0 0 1 0 7 M17.5 20h4a5.5 5.5 0 0 0-4-5.3'/>",
  help: "<circle cx='12' cy='12' r='9'/><path d='M9.5 9.2a2.5 2.5 0 1 1 3.6 2.3c-.9.5-1.1 1.1-1.1 2 M12 17h0'/>",
  attach: "<path d='M20 11l-8.5 8.5a4.5 4.5 0 0 1-6.4-6.4l8.6-8.6a3 3 0 0 1 4.3 4.3l-8.6 8.6a1.5 1.5 0 0 1-2.2-2.2l7.8-7.8'/>",
  time: "<circle cx='12' cy='12' r='9'/><path d='M12 7v5l3.5 2.2'/>",
  calendar: "<rect x='4' y='6' width='16' height='14' rx='1'/><path d='M4 10h16 M8 3v4 M16 3v4'/>",
  download: "<path d='M12 4v11 M8 11l4 4 4-4 M5 20h14'/>",
  upload: "<path d='M12 20V9 M8 13l4-4 4 4 M5 4h14'/>",
  receipt: "<path d='M6 3h12v18l-2-1.4-2 1.4-2-1.4L10 21l-2-1.4L6 21z'/><path d='M9 8h6 M9 12h6 M9 16h3'/>",
  money: "<circle cx='12' cy='12' r='9'/><path d='M8 8l4 4 4-4 M12 12v5 M9 13h6 M9 16h6'/>",
  card: "<rect x='3' y='6' width='18' height='12' rx='1'/><path d='M3 10h18 M6 15h4'/>",
  bank: "<path d='M3 9l9-5 9 5 M4 10h16 M3 20h18'/><path d='M6 10v8 M10 10v8 M14 10v8 M18 10v8'/>",
  crop: "<path d='M12 21v-8'/><path d='M12 13c0-3.3 2.2-5.5 5.5-5.5 0 3.3-2.2 5.5-5.5 5.5z'/><path d='M12 13c0-3.3-2.2-5.5-5.5-5.5 0 3.3 2.2 5.5 5.5 5.5z'/>",
  vote: "<path d='M4 10l8-5 8 5v1H4z'/><path d='M5 11v9h14v-9 M9 14l2 2 4-4'/>",
  announce: "<path d='M4 10v4h3l7 4V6l-7 4z'/><path d='M18 9a4 4 0 0 1 0 6'/>",
  eye: "<path d='M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z'/><circle cx='12' cy='12' r='3'/>",
  shield: "<path d='M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6z'/><path d='M9 12l2 2 4-4'/>",
  refresh: "<path d='M4 12a8 8 0 0 1 13.7-5.6L20 8 M20 4v4h-4 M20 12a8 8 0 0 1-13.7 5.6L4 16 M4 20v-4h4'/>",
  edit: "<path d='M4 20h4L19 9l-4-4L4 16z'/><path d='M14 6l4 4'/>",
  sound: "<path d='M4 9v6h4l5 4V5L8 9z'/><path d='M16 9a4 4 0 0 1 0 6 M18.5 6.5a8 8 0 0 1 0 11'/>",
  audio: "<path d='M5 13a7 7 0 0 1 14 0'/><path d='M5 13v4a2 2 0 0 0 2 2h1v-7H7a2 2 0 0 0-2 1z M19 13v4a2 2 0 0 1-2 2h-1v-7h1a2 2 0 0 1 2 1z'/>",
  globe: "<circle cx='12' cy='12' r='9'/><path d='M3 12h18 M12 3c3 3 3 15 0 18 M12 3c-3 3-3 15 0 18'/>",
  chart: "<path d='M4 20V11 M10 20V5 M16 20v-7 M21 20H3'/>",
  puzzle: "<path d='M9 4h6v2.5a2 2 0 1 1 0 4V13h2.5a2 2 0 1 0 0 4H15v3H9v-3H6.5a2 2 0 1 1 0-4H9V10.5a2 2 0 1 0 0-4z'/>",
  desktop: "<rect x='3' y='4' width='18' height='12' rx='1'/><path d='M9 20h6 M12 16v4'/>",
  mobile: "<rect x='7' y='3' width='10' height='18' rx='2'/><path d='M10 18h4'/>",
  building: "<path d='M5 21V5l8-2v18 M13 21V9l6 2v10 M3 21h18 M8 8h0 M8 12h0 M8 16h0'/>",
  bell: "<path d='M6 9a6 6 0 0 1 12 0c0 5 2 7 2 7H4s2-2 2-7z'/><path d='M10 20a2 2 0 0 0 4 0'/>",
  briefcase: "<rect x='4' y='8' width='16' height='12' rx='1'/><path d='M9 8V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2 M4 13h16'/>",
  phone: "<path d='M5 4h4l2 5-2.5 1.8a12 12 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z'/>",
  mail: "<rect x='3' y='6' width='18' height='12' rx='1'/><path d='M3.5 7l8.5 6 8.5-6'/>",
  build: "<path d='M6 21V7l6-3 6 3v14 M3 21h18 M9 11h6 M9 15h6'/>",
  bookmark: "<path d='M7 4h10v16l-5-4-5 4z'/>",
  folder: "<path d='M3 7a1 1 0 0 1 1-1h5l2 2h9a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z'/>",
  archive: "<rect x='3' y='6' width='18' height='4' rx='1'/><path d='M5 10v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9 M10 14h4'/>",
  send: "<path d='M4 11l16-7-7 16-2.5-6.5z'/>",
  check: "<path d='M5 12.5l4.5 4.5L19 6.5'/>",
  close: "<path d='M6 6l12 12 M18 6L6 18'/>",
  ban: "<circle cx='12' cy='12' r='9'/><path d='M6 6l12 12'/>",
  warn: "<path d='M12 4l9 16H3z'/><path d='M12 10v4 M12 17h0'/>",
  bulb: "<path d='M9 18h6 M10 21h4'/><path d='M12 3a6 6 0 0 1 4 10.5c-.7.7-1 1.5-1 2.5H9c0-1-.3-1.8-1-2.5A6 6 0 0 1 12 3z'/>",
  external: "<path d='M14 5h5v5 M19 5l-9 9 M12 5H6a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-6'/>",
  plus: "<path d='M12 5v14 M5 12h14'/>",
  contract: "<path d='M6 3h8l4 4v14H6z'/><path d='M14 3v4h4 M9 12l2 2 4-4'/>",
  handshake: "<path d='M7 11l3-3 2 1.5L14 8l3 3 M4 11l3 3 2-1 2 2 2-2 2 1 3-3'/>",
  field: "<path d='M3 20h18 M6 20V9l6-4 6 4v11 M9 20v-5h6v5'/>",
};

// emoji → 图标名 映射（供页面 agent 参考；这里只用于在 css 里加注释）
function enc(svg) {
  return svg.replace(/\n/g, '').replace(/#/g, '%23').replace(/</g, '%3C').replace(/>/g, '%3E')
    .replace(/"/g, "'").replace(/\s+/g, ' ').replace(/ /g, '%20');
}
const HEAD = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='#000' stroke-width='1.9' stroke-linecap='round' stroke-linejoin='round'>";

let css = `/* ============================================================
   三资管理助手 · 图标系统（自动生成，请勿手改；改 tools/build-icons.mjs）
   细线描边、单色、继承 currentColor —— 替代 emoji，去 AI 味、增政务感
   用法: <i class="ico ico-home"></i>   尺寸随字号(1em)，可加 .ico--lg 等
   ============================================================ */
.ico{display:inline-block;width:1em;height:1em;flex:none;vertical-align:-0.14em;
  background-color:currentColor;
  -webkit-mask-position:center;mask-position:center;
  -webkit-mask-size:contain;mask-size:contain;
  -webkit-mask-repeat:no-repeat;mask-repeat:no-repeat;}
.ico--lg{width:1.4em;height:1.4em;}
.ico--xl{width:1.8em;height:1.8em;}
`;
for (const [name, inner] of Object.entries(ICONS)) {
  const uri = `url("data:image/svg+xml,${enc(HEAD + inner + '</svg>')}")`;
  css += `.ico-${name}{-webkit-mask-image:${uri};mask-image:${uri};}\n`;
}

fs.writeFileSync(path.join(ROOT, 'shared', 'icons.css'), css);
console.log(`生成 shared/icons.css：${Object.keys(ICONS).length} 个图标`);
