// view2d.js — the (hkl) plane viewed face-on: atoms lying in/near the plane.
import { planeNormalCart, frameForPlane, directionCart, atomsInRadius, V } from './xtal.js';

export class View2D {
  constructor(cv){ this.cv=cv; this.g=cv.getContext('2d'); this.scale=null; }
  resize(){ const dpr=window.devicePixelRatio||1,r=this.cv.getBoundingClientRect();
    this.cv.width=r.width*dpr; this.cv.height=r.height*dpr; this.g.setTransform(dpr,0,0,dpr,0,0);
    this.w=r.width; this.h=r.height; }
  setState(s){ this.state=s; this.draw(); }

  draw(){
    if(!this.state)return; const s=this.state, g=this.g;
    this.resize();
    g.clearRect(0,0,this.w,this.h);
    if(!s.hkl.some(x=>x!==0)){ g.fillStyle='#8b97a8'; g.font='13px system-ui'; g.fillText('(hkl)을 입력하세요',16,24); return; }
    const N=planeNormalCart(s.L,s.hkl);
    const a=Math.max(V.len(s.L[0]),V.len(s.L[1]),V.len(s.L[2]));
    const inPlaneDir=s.uvw.some(x=>x!==0)?directionCart(s.L,s.uvw):null;
    const F=frameForPlane(N,inPlaneDir);
    const nhat=F[2]; const R=a*3.2, slab=a*0.35;
    const atoms=atomsInRadius(s.L,s.motif,R);
    const inSlab=atoms.filter(p=>Math.abs(V.dot(p,nhat))<=slab);
    // project to plane coords
    const P=inSlab.map(p=>[V.dot(p,F[0]),V.dot(p,F[1])]);
    // fit scale
    let mx=1; for(const q of P) mx=Math.max(mx,Math.abs(q[0]),Math.abs(q[1]));
    const sc=(Math.min(this.w,this.h)/2-16)/mx, cx=this.w/2, cy=this.h/2;
    // grid subtle
    for(const q of P){
      const x=cx+q[0]*sc, y=cy-q[1]*sc;
      g.beginPath(); g.arc(x,y,Math.max(4,0.16*a*sc),0,7);
      g.fillStyle='rgba(215,168,110,.92)'; g.fill();
      g.strokeStyle='rgba(0,0,0,.25)'; g.lineWidth=1; g.stroke();
    }
    // in-plane direction arrow (if it lies in plane)
    if(inPlaneDir){
      const d2=[V.dot(inPlaneDir,F[0]),V.dot(inPlaneDir,F[1])];
      const L2=Math.hypot(d2[0],d2[1]);
      if(L2>1e-6){ const ux=d2[0]/L2, uy=d2[1]/L2, len=Math.min(this.w,this.h)*0.32;
        g.strokeStyle='#50e68c'; g.lineWidth=2.5;
        g.beginPath(); g.moveTo(cx,cy); g.lineTo(cx+ux*len,cy-uy*len); g.stroke();
        // arrowhead
        const ax=cx+ux*len, ay=cy-uy*len, hx=-uy, hy=ux;
        g.beginPath(); g.moveTo(ax,ay); g.lineTo(ax-ux*10+hx*6,ay+uy*10-hy*6);
        g.lineTo(ax-ux*10-hx*6,ay+uy*10+hy*6); g.closePath(); g.fillStyle='#50e68c'; g.fill();
      }
    }
    g.fillStyle='#8b97a8'; g.font='12px system-ui';
    g.fillText(`(${s.hkl.join('')}) 면 정면도 · 이 면에 놓인 원자 배열`,12,this.h-12);
  }
}
