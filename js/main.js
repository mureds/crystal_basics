// main.js — UI for the crystal structure / Miller index visualizer.
import { MOTIFS, latticeFor } from './xtal.js';
import { View3D } from './view3d.js';
import { View2D } from './view2d.js';

const $=(id)=>document.getElementById(id);
const parseVec=(id,def)=>{const v=$(id).value.split(/[\s,]+/).map(Number).filter(x=>!Number.isNaN(x));return v.length===3?v:def;};

const v3=new View3D($('view3d'));
const v2=new View2D($('cv2d'));

const DEF={SC:{a:3.6,c:3.6},BCC:{a:2.87,c:2.87},FCC:{a:3.615,c:3.615},HCP:{a:3.2,c:5.2}};

function readState(){
  const kind=$('struct').value;
  const a=parseFloat($('a').value)||DEF[kind].a;
  const c=parseFloat($('c').value)||DEF[kind].c;
  return { kind, motif:MOTIFS[kind], L:latticeFor(kind,a,c),
    hkl:parseVec('hkl',[1,1,1]), uvw:parseVec('uvw',[1,0,0]) };
}
function refresh(){ const s=readState(); v3.setState(s); v2.setState(s);
  $('r-struct').textContent=s.kind;
  $('r-hkl').textContent='('+$('hkl').value.trim().replace(/\s+/g,' ')+')';
  $('r-uvw').textContent='['+$('uvw').value.trim().replace(/\s+/g,' ')+']';
}
function resizeAll(){ v3.resize(); v2.resize(); v2.draw(); }
window.addEventListener('resize',resizeAll);

// struct change → update defaults + show/hide c
$('struct').addEventListener('change',()=>{ const k=$('struct').value;
  $('a').value=DEF[k].a; $('c').value=DEF[k].c;
  $('c-wrap').style.display = k==='HCP'?'':'none';
  refresh(); });
['a','c','hkl','uvw'].forEach(id=>$(id).addEventListener('input',refresh));

// presets
$('planePreset').addEventListener('change',e=>{ if(e.target.value){$('hkl').value=e.target.value;refresh();} });
$('dirPreset').addEventListener('change',e=>{ if(e.target.value){$('uvw').value=e.target.value;refresh();} });
for(const k of ['atoms','plane','dir']) $('tg-'+k).addEventListener('change',e=>v3.toggle(k,e.target.checked));

// tabs
for(const b of document.querySelectorAll('.tab')) b.addEventListener('click',()=>{
  document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
  document.querySelectorAll('.panel').forEach(x=>x.classList.remove('active'));
  b.classList.add('active'); $(b.dataset.t).classList.add('active'); resizeAll(); });

// init
$('struct').value='FCC'; $('a').value=DEF.FCC.a; $('c').value=DEF.FCC.c; $('c-wrap').style.display='none';
refresh();
requestAnimationFrame(()=>{ resizeAll(); requestAnimationFrame(resizeAll); });
window.addEventListener('load',resizeAll);
