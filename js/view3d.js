// view3d.js — three.js: unit cell + atoms + (hkl) plane + [uvw] arrow + axes.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { cellAtoms, cellCorners, CELL_EDGES, planeNormalCart, planeCellPolygon,
         directionCart, intercepts, V } from './xtal.js';

export class View3D {
  constructor(el){
    this.el=el;
    this.scene=new THREE.Scene(); this.scene.background=new THREE.Color(0x0b0e14);
    this.renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
    this.renderer.setPixelRatio(window.devicePixelRatio); el.appendChild(this.renderer.domElement);
    this.camera=new THREE.PerspectiveCamera(45,1,0.01,1000); this.camera.position.set(10,7,12);
    this.controls=new OrbitControls(this.camera,this.renderer.domElement);
    this.controls.enableDamping=false; this.controls.addEventListener('change',()=>this.render());
    this.scene.add(new THREE.AmbientLight(0xffffff,0.8));
    const dl=new THREE.DirectionalLight(0xffffff,0.8); dl.position.set(6,10,8); this.scene.add(dl);
    this.g=new THREE.Group(); this.scene.add(this.g);
    this.show={atoms:true,plane:true,dir:true};
  }
  render(){ this.renderer.render(this.scene,this.camera); }
  resize(){ const r=this.el.getBoundingClientRect(); this.renderer.setSize(r.width,Math.max(1,r.height));
    this.camera.aspect=r.width/Math.max(1,r.height); this.camera.updateProjectionMatrix(); this.render(); }

  setState(s){ this.state=s; this.build(); }

  _clear(){ while(this.g.children.length){const c=this.g.children.pop();c.geometry?.dispose?.();c.material?.dispose?.();this.g.remove(c);} }

  build(){
    const s=this.state; this._clear();
    const L=s.L, a=Math.max(V.len(L[0]),V.len(L[1]),V.len(L[2]));
    // center the cell at origin for nicer rotation
    const ctr=cellCorners(L).reduce((p,q)=>V.add(p,q),[0,0,0]).map(x=>x/8);
    const off=new THREE.Vector3(-ctr[0],-ctr[1],-ctr[2]);
    this.g.position.copy(off);

    // cell edges
    const C=cellCorners(L);
    const eg=new THREE.BufferGeometry(); const ep=[];
    for(const [i,j] of CELL_EDGES){ ep.push(...C[i],...C[j]); }
    eg.setAttribute('position',new THREE.Float32BufferAttribute(ep,3));
    this.g.add(new THREE.LineSegments(eg,new THREE.LineBasicMaterial({color:0x5b6675})));

    // axis vectors a1,a2,a3 (from origin corner C[0]=origin)
    const axcol=[0xe06666,0x6ee06e,0x6ea8fe];
    for(let k=0;k<3;k++){ this._arrow([0,0,0],L[k],axcol[k],0.04*a); }

    // atoms
    if(this.show.atoms){
      const at=cellAtoms(L,s.motif);
      const rad=0.16*a;
      const geo=new THREE.SphereGeometry(rad,20,16);
      const mat=new THREE.MeshStandardMaterial({color:0xd7a86e,roughness:0.4,metalness:0.1});
      const mesh=new THREE.InstancedMesh(geo,mat,at.length); const m=new THREE.Matrix4();
      at.forEach((p,i)=>{m.makeTranslation(p[0],p[1],p[2]);mesh.setMatrixAt(i,m);});
      mesh.instanceMatrix.needsUpdate=true; this.g.add(mesh);
    }

    // (hkl) plane polygon
    if(this.show.plane && s.hkl.some(x=>x!==0)){
      const N=planeNormalCart(L,s.hkl);
      const poly=planeCellPolygon(L,N,1);   // N·x = 1 → plane through intercepts
      if(poly.length>=3){
        const g=new THREE.BufferGeometry();
        const verts=[]; const ctrP=poly.reduce((p,q)=>V.add(p,q),[0,0,0]).map(x=>x/poly.length);
        for(let i=0;i<poly.length;i++){const j=(i+1)%poly.length;
          verts.push(...ctrP,...poly[i],...poly[j]);}
        g.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));
        g.computeVertexNormals();
        this.g.add(new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:0x50a0ff,transparent:true,opacity:0.32,side:THREE.DoubleSide})));
        // outline
        const og=new THREE.BufferGeometry(); const op=[];
        for(let i=0;i<poly.length;i++){const j=(i+1)%poly.length;op.push(...poly[i],...poly[j]);}
        og.setAttribute('position',new THREE.Float32BufferAttribute(op,3));
        this.g.add(new THREE.LineSegments(og,new THREE.LineBasicMaterial({color:0x8fc6ff})));
      }
      // intercept markers
      for(const q of intercepts(L,s.hkl)){ if(!q)continue;
        const sm=new THREE.Mesh(new THREE.SphereGeometry(0.09*a,12,10),new THREE.MeshBasicMaterial({color:0x50a0ff}));
        sm.position.set(q[0],q[1],q[2]); this.g.add(sm); }
    }

    // [uvw] direction arrow
    if(this.show.dir && s.uvw.some(x=>x!==0)){
      this._arrow([0,0,0],directionCart(L,s.uvw),0x50e68c,0.05*a,true);
    }
    this.render();
  }

  _arrow(from,to,color,headScale,thick){
    const f=new THREE.Vector3(...from),t=new THREE.Vector3(...to);
    const dir=t.clone().sub(f); const len=dir.length(); if(len<1e-6)return;
    const ah=new THREE.ArrowHelper(dir.clone().normalize(),f,len,color,Math.max(len*0.14,headScale*3),Math.max(len*0.07,headScale*1.6));
    this.g.add(ah);
  }

  toggle(k,v){ this.show[k]=v; this.build(); }
}
