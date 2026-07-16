const themeGrid = document.querySelector('#themeGrid');
const activeSwatches = document.querySelector('#activeSwatches');
const preview = document.querySelector('#codexPreview');
const toast = document.querySelector('#toast');
const dialog = document.querySelector('#creatorDialog');
const imageInput = document.querySelector('#imageInput');
const saveTheme = document.querySelector('#saveTheme');
const themeName = document.querySelector('#themeName');
let uploadedImage = null;
let activeId = 'aurora';

const themes = [
  { id:'aurora', name:'Northern Lights', meta:'深色 · 玻璃面板', scheme:'Aurora dark', image:'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=900&q=85', colors:['#12232c','#326272','#76bca8','#dcefe7'] },
  { id:'relay', name:'Signal Relay', meta:'暗红 · 高对比', scheme:'Signal dark', image:'https://images.unsplash.com/photo-1519608487953-e999c86e7454?auto=format&fit=crop&w=900&q=85', colors:['#22151a','#6e2c39','#dd805c','#f1d8bd'] },
  { id:'paper', name:'Paper Routine', meta:'浅色 · 克制留白', scheme:'Paper light', image:'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=900&q=85', colors:['#e9e5dc','#c5b9a7','#657c70','#222b2d'] },
  { id:'horizon', name:'Blue Hour', meta:'深蓝 · 极简', scheme:'Blue hour', image:'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=900&q=85', colors:['#121a2e','#31547c','#83a8bd','#e5e2cc'] }
];

function readableText(hex) { const v = parseInt(hex.slice(1),16); const r=v>>16,g=(v>>8)&255,b=v&255; return ((r*299+g*587+b*114)/1000)>142 ? '#15202c' : '#f1f6fb'; }
function renderGrid(){ themeGrid.innerHTML = themes.map(t => `<button class="theme-card ${t.id===activeId?'selected':''}" data-id="${t.id}" type="button"><div class="theme-image" style="background-image:url('${t.image}')"><span class="theme-badge">${t.id===activeId?'已应用':'主题包'}</span></div><div class="theme-info"><h3>${t.name}</h3><p>${t.meta}</p><span class="theme-dots">${t.colors.map(c=>`<i style="background:${c}"></i>`).join('')}</span></div></button>`).join(''); document.querySelector('#themeCount').textContent=themes.length; document.querySelectorAll('.theme-card').forEach(b=>b.onclick=()=>applyTheme(b.dataset.id)); }
function applyTheme(id){ const t=themes.find(x=>x.id===id); if(!t)return; activeId=id; document.querySelector('#activeName').textContent=t.name; document.querySelector('#previewTitle').textContent=t.name; document.querySelector('#activeMeta').textContent=`${t.meta} · 最后使用于刚刚`; document.querySelector('#schemeLabel').textContent=t.scheme; activeSwatches.innerHTML=t.colors.map(c=>`<span style="background:${c}"></span>`).join(''); preview.style.backgroundImage=`linear-gradient(135deg, ${t.colors[0]}d9, ${t.colors[1]}88), url('${t.image}')`; preview.style.backgroundSize='cover'; preview.style.backgroundPosition='center'; preview.style.color=readableText(t.colors[3]); document.documentElement.style.setProperty('--accent',t.colors[2]); document.documentElement.style.setProperty('--accent-ink',readableText(t.colors[2])); renderGrid(); notify(`${t.name} 已应用到预览`); }
function notify(message){toast.textContent=message;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),2100)}
document.querySelector('#newTheme').onclick=()=>dialog.showModal();
document.querySelector('#panelApply').onclick=()=>applyTheme(activeId);
document.querySelector('#reapplyTheme').onclick=()=>applyTheme(activeId);
document.querySelector('#restoreTheme').onclick=()=>{ activeId='aurora'; applyTheme('aurora'); notify('已恢复为原生外观预览'); };
function paletteFromImage(file){const reader=new FileReader();reader.onload=e=>{uploadedImage=e.target.result;const img=new Image();img.onload=()=>{const c=document.createElement('canvas'),ctx=c.getContext('2d');c.width=40;c.height=40;ctx.drawImage(img,0,0,40,40);const data=ctx.getImageData(0,0,40,40).data;let r=0,g=0,b=0,n=0;for(let i=0;i<data.length;i+=16){r+=data[i];g+=data[i+1];b+=data[i+2];n++}const base=[r/n,g/n,b/n].map(v=>Math.round(v));const hex=(a)=>'#'+a.map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('');const colors=[hex(base.map(v=>v*.28)),hex(base.map(v=>v*.68+36)),hex([base[1]+20,base[2]+5,base[0]+40]),hex(base.map(v=>255-v*.28))];document.querySelector('#generatedPalette').innerHTML=colors.map(x=>`<span style="background:${x}"></span>`).join('')+'<small>已从图片提取配色</small>';saveTheme.disabled=false;saveTheme.dataset.colors=JSON.stringify(colors)};img.src=uploadedImage};reader.readAsDataURL(file)}
imageInput.onchange=e=>e.target.files[0]&&paletteFromImage(e.target.files[0]);
const dropZone=document.querySelector('#dropZone');['dragenter','dragover'].forEach(evt=>dropZone.addEventListener(evt,e=>{e.preventDefault();dropZone.classList.add('dragging')}));['dragleave','drop'].forEach(evt=>dropZone.addEventListener(evt,e=>{e.preventDefault();dropZone.classList.remove('dragging')}));dropZone.addEventListener('drop',e=>e.dataTransfer.files[0]&&paletteFromImage(e.dataTransfer.files[0]));
saveTheme.onclick=()=>{const name=themeName.value.trim()||'未命名主题';const colors=JSON.parse(saveTheme.dataset.colors);themes.unshift({id:`custom-${Date.now()}`,name,meta:'自定义图片 · 自动取色',scheme:'Custom image',image:uploadedImage,colors});dialog.close();applyTheme(themes[0].id);uploadedImage=null;themeName.value='';saveTheme.disabled=true;notify(`${name} 已创建并应用`)};
applyTheme(activeId);
