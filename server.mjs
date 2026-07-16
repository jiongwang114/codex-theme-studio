import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { mkdir, readFile, readdir, writeFile, appendFile, stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)));
const themeRoot = join(root, 'data', 'themes');
const coreCli = join(root, 'node_modules', '@codedrobe', 'core', 'bin', 'codedrobe.mjs');
const heigeApplyScript = join(root, 'scripts', 'apply-heige-ui.ps1');
const heigeLog = join(root, 'data', 'heige-apply.log');
const heigeThemeIds = new Set(['miku-488137', 'genshin-night', 'genshin-dawn', 'wuthering-echo', 'wuthering-tide', 'naruto-hokage', 'naruto-sasuke', 'deepspace-dawn', 'deepspace-star', 'dalao-dianyan']);
const port = Number(process.env.PORT || 4173);
const mime = { '.css':'text/css; charset=utf-8', '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.json':'application/json; charset=utf-8', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.webp':'image/webp', '.svg':'image/svg+xml' };

function send(res, status, body, type = 'application/json; charset=utf-8') { res.writeHead(status, { 'content-type': type, 'cache-control':'no-store' }); res.end(typeof body === 'string' ? body : JSON.stringify(body)); }
function runCore(args) {
  return new Promise((resolveRun) => {
    const child = spawn(process.execPath, [coreCli, ...args], { windowsHide: true });
    let output = ''; child.stdout.on('data', d => output += d); child.stderr.on('data', d => output += d);
    child.on('error', error => resolveRun({ ok:false, output:error.message }));
    child.on('close', code => resolveRun({ ok:code === 0, output:output.trim(), code }));
  });
}
function runHeiGe(theme) {
  return new Promise((resolveRun) => {
    const child = spawn('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', heigeApplyScript, '-Theme', theme], { windowsHide: true });
    let output = ''; child.stdout.on('data', d => output += d); child.stderr.on('data', d => output += d);
    child.on('error', async error => { await appendFile(heigeLog, `${new Date().toISOString()} ERROR ${error.message}\n`); resolveRun({ ok:false, output:error.message }); });
    child.on('close', async code => { await appendFile(heigeLog, `${new Date().toISOString()} EXIT ${code}\n${output.trim()}\n`); resolveRun({ ok:code === 0, output:output.trim(), code }); });
  });
}
function safeId(value) { return String(value || '').toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 48) || `theme-${Date.now()}`; }
function validColors(colors) { return Array.isArray(colors) && colors.length === 4 && colors.every(c => /^#[0-9a-f]{6}$/i.test(c)); }
function modeFor(color) { const value = Number.parseInt(color.slice(1), 16); const red = value >> 16; const green = (value >> 8) & 255; const blue = value & 255; return (red * 299 + green * 587 + blue * 114) / 1000 > 150 ? 'light' : 'dark'; }
function cssFor(colors) {
  const [bg, surface, accent, text] = colors;
  const mode = modeFor(bg);
  return `html.codedrobe-host-codex {\n  color-scheme: ${mode} !important;\n  --studio-bg: ${bg};\n  --studio-surface: ${surface};\n  --studio-accent: ${accent};\n  --studio-text: ${text};\n  --studio-border: color-mix(in srgb, var(--studio-text) 18%, transparent);\n  --color-token-bg-primary: var(--studio-bg) !important;\n  --color-token-bg-secondary: color-mix(in srgb, var(--studio-surface) 76%, var(--studio-bg)) !important;\n  --color-token-main-surface-primary: var(--studio-surface) !important;\n  --color-token-side-bar-background: color-mix(in srgb, var(--studio-bg) 88%, #000) !important;\n  --color-token-foreground: var(--studio-text) !important;\n  --color-token-text-primary: var(--studio-text) !important;\n  --color-token-text-secondary: color-mix(in srgb, var(--studio-text) 66%, transparent) !important;\n  --color-token-primary: var(--studio-accent) !important;\n  --color-token-focus-border: var(--studio-accent) !important;\n}\nhtml.codedrobe-host-codex body { background: radial-gradient(circle at 88% 2%, color-mix(in srgb, var(--studio-accent) 38%, transparent), transparent 34%), linear-gradient(145deg, var(--studio-bg), color-mix(in srgb, var(--studio-surface) 62%, var(--studio-bg))) !important; color: var(--studio-text) !important; }\nhtml.codedrobe-host-codex aside.app-shell-left-panel { background: linear-gradient(180deg, color-mix(in srgb, var(--studio-bg) 88%, transparent), color-mix(in srgb, var(--studio-surface) 62%, var(--studio-bg))) !important; border-right: 1px solid var(--studio-border) !important; }\nhtml.codedrobe-host-codex main.main-surface { background: linear-gradient(135deg, color-mix(in srgb, var(--studio-surface) 90%, transparent), color-mix(in srgb, var(--studio-bg) 54%, transparent)) !important; border-left: 1px solid var(--studio-border) !important; }\nhtml.codedrobe-host-codex :is(main.main-surface > header, header.app-header-tint) { background: color-mix(in srgb, var(--studio-surface) 86%, transparent) !important; border-bottom: 1px solid var(--studio-border) !important; }\nhtml.codedrobe-host-codex [role='main'] { background: transparent !important; }\nhtml.codedrobe-host-codex .composer-surface-chrome { background: color-mix(in srgb, var(--studio-surface) 92%, var(--studio-bg)) !important; border: 1px solid var(--studio-border) !important; box-shadow: 0 12px 30px color-mix(in srgb, var(--studio-bg) 55%, transparent) !important; }\nhtml.codedrobe-host-codex :is(button, a, input, textarea, [contenteditable='true']):focus-visible { outline: 2px solid var(--studio-accent) !important; outline-offset: 2px !important; }\nhtml.codedrobe-host-codex :is(a, button, input, textarea, [contenteditable='true']) { accent-color: var(--studio-accent); }\n`;
}
async function bodyOf(req) { let raw=''; for await (const chunk of req) { raw += chunk; if (raw.length > 12_000_000) throw new Error('图片不能超过 8 MB'); } return JSON.parse(raw || '{}'); }
async function listThemes() { await mkdir(themeRoot, { recursive:true }); const entries = await readdir(themeRoot, { withFileTypes:true }); const themes=[]; for (const entry of entries) { if (!entry.isDirectory()) continue; try { themes.push(JSON.parse(await readFile(join(themeRoot, entry.name, 'metadata.json'), 'utf8'))); } catch {} } return themes.sort((a,b) => b.createdAt.localeCompare(a.createdAt)); }
async function ensurePresets() {
  const presets = [
    { id:'aurora', name:'Northern Lights', scheme:'Aurora dark', image:'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=900&q=85', colors:['#12232c','#326272','#76bca8','#dcefe7'] },
    { id:'relay', name:'Signal Relay', scheme:'Signal dark', image:'https://images.unsplash.com/photo-1519608487953-e999c86e7454?auto=format&fit=crop&w=900&q=85', colors:['#22151a','#6e2c39','#dd805c','#f1d8bd'] },
    { id:'paper', name:'Paper Routine', scheme:'Paper light', image:'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=900&q=85', colors:['#e9e5dc','#c5b9a7','#657c70','#222b2d'] },
    { id:'horizon', name:'Blue Hour', scheme:'Blue hour', image:'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=900&q=85', colors:['#121a2e','#31547c','#83a8bd','#e5e2cc'] }
  ];
  for (const preset of presets) { const dir=join(themeRoot,preset.id); try { await stat(join(dir,'metadata.json')); continue; } catch {} await mkdir(dir,{recursive:true}); const manifest={schemaVersion:1,id:preset.id,displayName:preset.name,version:'1.0.0',targets:{codex:{css:'codex.css',options:{rendererProfile:'codex-theme-v1',baseTheme:{mode:'dark',accent:preset.colors[2],ink:preset.colors[3],surface:preset.colors[1]}}}}}; const metadata={...preset, meta:'内置预设 · 可逆注入', source:`/data/themes/${preset.id}`, packagePath:join(dir,`${preset.id}.codedrobe-theme`), createdAt:'2026-07-16T00:00:00.000Z', isPreset:true}; await Promise.all([writeFile(join(dir,'theme.json'),JSON.stringify(manifest,null,2)),writeFile(join(dir,'codex.css'),cssFor(preset.colors)),writeFile(join(dir,'metadata.json'),JSON.stringify(metadata,null,2))]); }
}
async function refreshPresets() {
  const presets = [
    { id:'aurora', name:'Northern Lights', scheme:'Aurora dark', image:'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=900&q=85', colors:['#12232c','#326272','#76bca8','#dcefe7'] },
    { id:'relay', name:'Signal Relay', scheme:'Signal dark', image:'https://images.unsplash.com/photo-1519608487953-e999c86e7454?auto=format&fit=crop&w=900&q=85', colors:['#22151a','#6e2c39','#dd805c','#f1d8bd'] },
    { id:'paper', name:'Paper Routine', scheme:'Paper light', image:'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=900&q=85', colors:['#e9e5dc','#c5b9a7','#657c70','#222b2d'] },
    { id:'horizon', name:'Blue Hour', scheme:'Blue hour', image:'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=900&q=85', colors:['#121a2e','#31547c','#83a8bd','#e5e2cc'] }
  ];
  for (const preset of presets) {
    const directory = join(themeRoot, preset.id);
    const manifest = {
      schemaVersion: 1,
      id: preset.id,
      displayName: preset.name,
      version: '1.1.0',
      targets: { codex: { css: 'codex.css', options: { rendererProfile: 'codex-theme-v1', baseTheme: { mode: modeFor(preset.colors[0]), accent: preset.colors[2], ink: preset.colors[3], surface: preset.colors[1] } } } }
    };
    const metadata = { ...preset, meta: 'Built-in preset - reversible injection', source: `/data/themes/${preset.id}`, packagePath: join(directory, `${preset.id}.codedrobe-theme`), createdAt: '2026-07-16T00:00:00.000Z', isPreset: true };
    await mkdir(directory, { recursive: true });
    await Promise.all([
      writeFile(join(directory, 'theme.json'), JSON.stringify(manifest, null, 2)),
      writeFile(join(directory, 'codex.css'), cssFor(preset.colors)),
      writeFile(join(directory, 'metadata.json'), JSON.stringify(metadata, null, 2))
    ]);
  }
}
async function createTheme(payload) {
  if (!payload.image || !validColors(payload.colors)) throw new Error('缺少有效图片或配色');
  const match = String(payload.image).match(/^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/);
  if (!match) throw new Error('只支持 PNG、JPG 和 WebP 图片');
  const bytes = Buffer.from(match[2], 'base64'); if (bytes.length > 8 * 1024 * 1024) throw new Error('图片不能超过 8 MB');
  const id = `${safeId(payload.name)}-${Date.now().toString(36)}`; const directory = join(themeRoot, id); const extension = { 'image/png':'png', 'image/jpeg':'jpg', 'image/webp':'webp' }[match[1]];
  await mkdir(join(directory, 'assets'), { recursive:true }); await writeFile(join(directory, `assets/hero.${extension}`), bytes);
  const theme = { schemaVersion:1, id, displayName:String(payload.name || '未命名主题').slice(0,32), version:'1.0.0', images:{ hero:`assets/hero.${extension}` }, targets:{ codex:{ css:'codex.css', options:{ rendererProfile:'codex-theme-v1', baseTheme:{ mode:'dark', accent:payload.colors[2], ink:payload.colors[3], surface:payload.colors[1] } } } } };
  const metadata = { id, name:theme.displayName, colors:payload.colors, scheme:'Custom image', image:`/data/themes/${id}/assets/hero.${extension}`, source:`/data/themes/${id}`, packagePath:join(directory, `${id}.codedrobe-theme`), createdAt:new Date().toISOString() };
  await Promise.all([writeFile(join(directory, 'theme.json'), JSON.stringify(theme,null,2)), writeFile(join(directory, 'codex.css'), cssFor(payload.colors)), writeFile(join(directory, 'metadata.json'), JSON.stringify(metadata,null,2))]);
  return metadata;
}
async function packageTheme(theme) { const source = join(themeRoot, theme.id, 'theme.json'); const result = await runCore(['theme','pack',source,'--output',theme.packagePath,'--force']); if (!result.ok) throw new Error(result.output || '主题打包失败'); return result; }
async function applyTheme(id, restartExisting = false) { const theme=(await listThemes()).find(t=>t.id===id); if (!theme) throw new Error('找不到该主题'); await packageTheme(theme); const probe=await runCore(['probe','--app','codex','--theme',theme.packagePath]); if (!probe.ok && !restartExisting) throw new Error(`兼容性检查未通过：${probe.output}`); const args=['apply','--app','codex','--theme',theme.packagePath]; if (restartExisting) args.push('--restart-existing'); const applied=await runCore(args); if (!applied.ok) throw new Error(applied.output || '应用主题失败'); const screenshot=join(themeRoot,theme.id,'preview.png'); const verified=await runCore(['verify','--app','codex','--theme',theme.packagePath,'--screenshot',screenshot]); if (!verified.ok) throw new Error(`主题已注入，但视觉验证未通过：${verified.output}`); return { theme, output:applied.output, screenshot:`/data/themes/${theme.id}/preview.png` }; }
async function serveFile(req,res) { const pathname = new URL(req.url,'http://local').pathname; const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\//,''); const file = normalize(join(root, relative)); if (!file.startsWith(root)) return send(res,403,{error:'无效路径'}); try { const info=await stat(file); if (!info.isFile()) throw new Error(); res.writeHead(200,{'content-type':mime[extname(file)] || 'application/octet-stream'}); createReadStream(file).pipe(res); } catch { send(res,404,'Not found','text/plain; charset=utf-8'); } }
const server=createServer(async (req,res) => { try {
  const url=new URL(req.url,'http://local');
  if (req.method==='GET' && url.pathname==='/api/themes') return send(res,200,{themes:await listThemes()});
  if (req.method==='GET' && url.pathname==='/api/status') { const result=await runCore(['detect','--app','codex','--json']); return send(res,200,{ready:result.ok, detail:result.output}); }
  if (req.method==='POST' && url.pathname==='/api/themes') return send(res,201,{theme:await createTheme(await bodyOf(req))});
  if (req.method==='POST' && url.pathname==='/api/heige/apply') { const payload=await bodyOf(req); const theme=heigeThemeIds.has(payload.theme) ? payload.theme : 'miku-488137'; const result=await runHeiGe(theme); if (!result.ok) throw new Error(result.output || 'HeiGe UI 应用失败'); return send(res,200,{output:result.output}); }
  if (req.method==='POST' && url.pathname.startsWith('/api/apply/')) { const payload=await bodyOf(req); return send(res,200,await applyTheme(decodeURIComponent(url.pathname.slice('/api/apply/'.length)), payload.restartExisting === true)); }
  if (req.method==='POST' && url.pathname==='/api/restore') { const result=await runCore(['restore','--app','codex']); if (!result.ok) throw new Error(result.output || '恢复原生失败'); return send(res,200,{output:result.output}); }
  return serveFile(req,res);
} catch (error) { send(res,400,{error:error.message || '请求失败'}); } });
await mkdir(themeRoot,{recursive:true}); await ensurePresets(); await refreshPresets(); server.listen(port,()=>console.log(`Theme Studio: http://localhost:${port}`));
