// xtal.js — crystallography engine: lattices, Miller planes & directions.
// Arbitrary lattice matrix (rows = a1,a2,a3). Plane normals via reciprocal
// lattice (correct for hexagonal too). Dependency-free.

export const V = {
  add:(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]],
  sub:(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],
  scale:(a,s)=>[a[0]*s,a[1]*s,a[2]*s],
  dot:(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],
  cross:(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],
  len:(a)=>Math.hypot(a[0],a[1],a[2]),
  norm:(a)=>{const l=V.len(a)||1;return [a[0]/l,a[1]/l,a[2]/l];},
};

// Fractional motifs in the conventional cell.
export const MOTIFS = {
  SC:[[0,0,0]],
  BCC:[[0,0,0],[0.5,0.5,0.5]],
  FCC:[[0,0,0],[0.5,0.5,0],[0.5,0,0.5],[0,0.5,0.5]],
  HCP:[[0,0,0],[1/3,2/3,0.5]],
};

export function cubicLattice(a){return [[a,0,0],[0,a,0],[0,0,a]];}
export function hexLattice(a,c){return [[a,0,0],[-a/2,a*Math.sqrt(3)/2,0],[0,0,c]];}
export function latticeFor(kind,a,c){return kind==='HCP'?hexLattice(a,c):cubicLattice(a);}

export function inv3(M){
  const [a,b,c]=M[0],[d,e,f]=M[1],[g,h,i]=M[2];
  const A=e*i-f*h,B=-(d*i-f*g),C=d*h-e*g,det=a*A+b*B+c*C;
  if(Math.abs(det)<1e-12)return [[1,0,0],[0,1,0],[0,0,1]];
  const v=1/det;
  return [[A*v,-(b*i-c*h)*v,(b*f-c*e)*v],
          [B*v,(a*i-c*g)*v,-(a*f-c*d)*v],
          [C*v,-(a*h-b*g)*v,(a*e-b*d)*v]];
}

// direction [uvw] in cartesian = u a1 + v a2 + w a3
export function directionCart(L,uvw){
  return [uvw[0]*L[0][0]+uvw[1]*L[1][0]+uvw[2]*L[2][0],
          uvw[0]*L[0][1]+uvw[1]*L[1][1]+uvw[2]*L[2][1],
          uvw[0]*L[0][2]+uvw[1]*L[1][2]+uvw[2]*L[2][2]];
}
// plane (hkl) normal (cartesian) = reciprocal vector; N·(a_i/idx_i)=1
export function planeNormalCart(L,hkl){
  const Li=inv3(L);
  return [hkl[0]*Li[0][0]+hkl[1]*Li[1][0]+hkl[2]*Li[2][0],
          hkl[0]*Li[0][1]+hkl[1]*Li[1][1]+hkl[2]*Li[2][1],
          hkl[0]*Li[0][2]+hkl[1]*Li[1][2]+hkl[2]*Li[2][2]];
}

// Atoms of one conventional cell (corners + faces/centers shared), cartesian.
export function cellAtoms(L,motif){
  const seen=new Set(),out=[];
  const push=(f)=>{
    if(f.some(x=>x<-1e-6||x>1+1e-6))return;
    const k=f.map(x=>Math.round(x*1000)).join(',');
    if(seen.has(k))return; seen.add(k);
    out.push([f[0]*L[0][0]+f[1]*L[1][0]+f[2]*L[2][0],
              f[0]*L[0][1]+f[1]*L[1][1]+f[2]*L[2][1],
              f[0]*L[0][2]+f[1]*L[1][2]+f[2]*L[2][2]]);
  };
  for(const m of motif)
    for(let i=0;i<2;i++)for(let j=0;j<2;j++)for(let k=0;k<2;k++)
      push([m[0]+i,m[1]+j,m[2]+k]);
  return out;
}

// 8 corners of the (possibly non-orthogonal) cell.
export function cellCorners(L){
  const c=[];
  for(let i=0;i<2;i++)for(let j=0;j<2;j++)for(let k=0;k<2;k++)
    c.push([i*L[0][0]+j*L[1][0]+k*L[2][0],
            i*L[0][1]+j*L[1][1]+k*L[2][1],
            i*L[0][2]+j*L[1][2]+k*L[2][2]]);
  return c;   // index = i*4+j*2+k
}
// 12 edges as corner-index pairs (differ in exactly one bit).
export const CELL_EDGES=(()=>{
  const e=[];for(let x=0;x<8;x++)for(let y=x+1;y<8;y++){
    const d=x^y; if(d===1||d===2||d===4)e.push([x,y]);}
  return e;
})();

// Intersection polygon of plane {x: N·x = d} with the cell parallelepiped.
export function planeCellPolygon(L,N,d){
  const C=cellCorners(L),pts=[];
  for(const [i,j] of CELL_EDGES){
    const p=C[i],q=C[j],dp=V.dot(N,p)-d,dq=V.dot(N,q)-d;
    if(Math.abs(dp)<1e-9){pts.push(p);continue;}
    if(dp*dq<0){const t=dp/(dp-dq);pts.push(V.add(p,V.scale(V.sub(q,p),t)));}
  }
  // dedup
  const uniq=[];for(const p of pts){if(!uniq.some(u=>V.len(V.sub(u,p))<1e-6))uniq.push(p);}
  if(uniq.length<3)return uniq;
  // order around centroid within the plane
  const ctr=uniq.reduce((s,p)=>V.add(s,p),[0,0,0]).map(x=>x/uniq.length);
  const n=V.norm(N);let e1=V.sub(uniq[0],ctr);e1=V.norm(V.sub(e1,V.scale(n,V.dot(e1,n))));
  const e2=V.cross(n,e1);
  uniq.sort((p,q)=>{
    const a=Math.atan2(V.dot(V.sub(p,ctr),e2),V.dot(V.sub(p,ctr),e1));
    const b=Math.atan2(V.dot(V.sub(q,ctr),e2),V.dot(V.sub(q,ctr),e1));
    return a-b;
  });
  return uniq;
}

// Axis intercepts of (hkl): fractional 1/idx along each lattice vector (∞ if 0).
export function intercepts(L,hkl){
  return hkl.map((idx,i)=> idx===0 ? null : V.scale(L[i],1/idx));
}

// Frame {e1,e2,n} for viewing a plane face-on (n from cartesian normal).
export function frameForPlane(N,inPlane){
  const n=V.norm(N);
  let x=inPlane?V.sub(inPlane,V.scale(n,V.dot(inPlane,n))):null;
  if(!x||V.len(x)<1e-6){const s=Math.abs(n[0])<0.9?[1,0,0]:[0,1,0];x=V.sub(s,V.scale(n,V.dot(s,n)));}
  x=V.norm(x);return [x,V.cross(n,x),n];
}

// Atoms of several cells within radius R (for the 2D plane net).
export function atomsInRadius(L,motif,R){
  const out=[],nmax=6;
  for(let i=-nmax;i<=nmax;i++)for(let j=-nmax;j<=nmax;j++)for(let k=-nmax;k<=nmax;k++)
    for(const m of motif){
      const f=[i+m[0],j+m[1],k+m[2]];
      const p=[f[0]*L[0][0]+f[1]*L[1][0]+f[2]*L[2][0],
               f[0]*L[0][1]+f[1]*L[1][1]+f[2]*L[2][1],
               f[0]*L[0][2]+f[1]*L[1][2]+f[2]*L[2][2]];
      if(V.len(p)<=R)out.push(p);
    }
  return out;
}
