(() => {
  const canvas = document.querySelector('#raytracer-canvas');
  if (!canvas) return;
  const control = document.querySelector('#reflectivity');
  const output = document.querySelector('#reflectivity-output');
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const add = (a,b) => a.map((v,i) => v+b[i]);
  const sub = (a,b) => a.map((v,i) => v-b[i]);
  const mul = (a,n) => a.map(v => v*n);
  const dot = (a,b) => a.reduce((n,v,i) => n+v*b[i],0);
  const norm = a => { const n=Math.hypot(...a); return mul(a,1/n); };
  const mix = (a,b,t) => add(mul(a,1-t),mul(b,t));
  const clamp = n => Math.max(0,Math.min(1,n));
  const scene = [
    {type:'sphere', c:[0,0.65,-2.0], r:.78, color:[.86,.52,.34], shine:.45},
    {type:'sphere', c:[0,-.35,-2.0], r:.64, color:[.72,.35,.22], shine:.18},
    {type:'sphere', c:[-.29,.82,-1.37], r:.12, color:[.10,.06,.04], shine:.8},
    {type:'sphere', c:[.29,.82,-1.37], r:.12, color:[.10,.06,.04], shine:.8},
    {type:'sphere', c:[0,.52,-1.29], r:.08, color:[.94,.58,.53], shine:.2},
    {type:'tri', a:[-.62,1.13,-2.02], b:[-.38,1.88,-1.93], c:[-.05,1.21,-1.95], color:[.92,.58,.38], shine:.35},
    {type:'tri', a:[.62,1.13,-2.02], b:[.38,1.88,-1.93], c:[.05,1.21,-1.95], color:[.92,.58,.38], shine:.35}
  ];
  function hitSphere(o,d,s) { const oc=sub(o,s.c), b=dot(oc,d), c=dot(oc,oc)-s.r*s.r, h=b*b-c; if(h<0)return null; const t=-b-Math.sqrt(h); if(t<.001)return null; const p=add(o,mul(d,t)); return {t,p,n:norm(sub(p,s.c)),...s}; }
  function hitTri(o,d,s) { const e1=sub(s.b,s.a),e2=sub(s.c,s.a),p=[d[1]*e2[2]-d[2]*e2[1],d[2]*e2[0]-d[0]*e2[2],d[0]*e2[1]-d[1]*e2[0]],det=dot(e1,p); if(Math.abs(det)<1e-5)return null; const inv=1/det,tv=sub(o,s.a),u=dot(tv,p)*inv;if(u<0||u>1)return null; const q=[tv[1]*e1[2]-tv[2]*e1[1],tv[2]*e1[0]-tv[0]*e1[2],tv[0]*e1[1]-tv[1]*e1[0]],v=dot(d,q)*inv;if(v<0||u+v>1)return null;const t=dot(e2,q)*inv;if(t<.001)return null;return {t,p:add(o,mul(d,t)),n:norm([e1[1]*e2[2]-e1[2]*e2[1],e1[2]*e2[0]-e1[0]*e2[2],e1[0]*e2[1]-e1[1]*e2[0]]),...s}; }
  function trace(o,d,depth,reflect) { let nearest=null; for(const s of scene){const h=s.type==='sphere'?hitSphere(o,d,s):hitTri(o,d,s);if(h&&(!nearest||h.t<nearest.t))nearest=h;} const planeT=(-1-o[1])/d[1]; if(planeT>.001&&(!nearest||planeT<nearest.t))nearest={t:planeT,p:add(o,mul(d,planeT)),n:[0,1,0],plane:true}; if(!nearest) return [0.045+.16*Math.max(d[1],0),.07+.13*Math.max(d[1],0),.12+.20*Math.max(d[1],0)]; if(nearest.plane){ const base=((Math.floor(nearest.p[0]) + Math.floor(nearest.p[2]))%2===0)?[.16,.18,.22]:[.055,.07,.10]; const reflected=trace(add(nearest.p,[0,.004,0]),norm([d[0],-d[1],d[2]]),depth+1,reflect); return mix(base,reflected,reflect*.78); } const light=norm([-3,5,3]), diffuse=Math.max(0,dot(nearest.n,light)), view=mul(d,-1), half=norm(add(light,view)), spec=Math.pow(Math.max(0,dot(nearest.n,half)),38)*nearest.shine; let color=add(mul(nearest.color,.2+.8*diffuse),[spec,spec,spec]); if(depth<1&&nearest.shine>.3){const r=norm(sub(d,mul(nearest.n,2*dot(d,nearest.n))));color=mix(color,trace(add(nearest.p,mul(nearest.n,.004)),r,depth+1,reflect),nearest.shine*.22);} return color; }
  function render() { const reflect=Number(control.value), img=ctx.createImageData(W,H), cam=[0,.55,4.6], aspect=W/H; for(let y=0;y<H;y++)for(let x=0;x<W;x++){const u=(x/W-.5)*2*aspect,v=(.5-y/H)*2,d=norm([u,v*.8,-1.65]),c=trace(cam,d,0,reflect),i=(y*W+x)*4; img.data[i]=255*Math.pow(clamp(c[0]),.4545);img.data[i+1]=255*Math.pow(clamp(c[1]),.4545);img.data[i+2]=255*Math.pow(clamp(c[2]),.4545);img.data[i+3]=255;}ctx.putImageData(img,0,0);output.textContent=`${Math.round(reflect*100)}%`; }
  control.addEventListener('input',render); render();
})();
