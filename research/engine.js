/* Shared by both portfolios. The page defines PROJECTS, GROUPS, SECTIONS
   and ELSEWHERE before loading this. Edit here, then copy to
   ~/works-portfolio/engine.js. */
(function(){
"use strict";
var reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
var MONO='9px "SF Mono", ui-monospace, Menlo, monospace';
var P=window.PROJECTS||[],G=window.GROUPS||[],SEC=window.SECTIONS||[],ELSE=window.ELSEWHERE||[];
/* page tone: a dark page sets --ink-rgb to near-white and --lift to 1 */
var CS=getComputedStyle(document.documentElement),INK=CS.getPropertyValue('--ink-rgb').trim()||'11,11,12',
    LIFT=parseFloat(CS.getPropertyValue('--lift'))||0;
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

/* ============================================================
   SOFTWARE 3D — lifted from the JS Entertainment site, plus a
   small kit of parts so every project gets its own object.
   ============================================================ */
function cuboid(w,h,d){var x=w/2,y=h/2,z=d/2;
  return {v:[[-x,-y,-z],[x,-y,-z],[x,y,-z],[-x,y,-z],[-x,-y,z],[x,-y,z],[x,y,z],[-x,y,z]],
          f:[[0,1,2,3],[5,4,7,6],[4,0,3,7],[1,5,6,2],[4,5,1,0],[3,2,6,7]]};}
function octa(r){return {v:[[r,0,0],[-r,0,0],[0,r,0],[0,-r,0],[0,0,r],[0,0,-r]],
  f:[[0,2,4],[2,1,4],[1,3,4],[3,0,4],[2,0,5],[1,2,5],[3,1,5],[0,3,5]]};}
function icosa(r){
  var t=(1+Math.sqrt(5))/2,v=[];
  [[-1,t,0],[1,t,0],[-1,-t,0],[1,-t,0],[0,-1,t],[0,1,t],[0,-1,-t],[0,1,-t],[t,0,-1],[t,0,1],[-t,0,-1],[-t,0,1]]
    .forEach(function(p){var l=Math.hypot(p[0],p[1],p[2]);v.push([p[0]/l*r,p[1]/l*r,p[2]/l*r]);});
  return {v:v,f:[[0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],[1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],
    [3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],[4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]]};}
function torus(R,r,maj,min){
  var v=[],f=[],i,j;
  for(i=0;i<maj;i++){var u=i/maj*6.2832,cu=Math.cos(u),su=Math.sin(u);
    for(j=0;j<min;j++){var t=j/min*6.2832,rr=R+r*Math.cos(t);v.push([cu*rr,r*Math.sin(t),su*rr]);}}
  for(i=0;i<maj;i++)for(j=0;j<min;j++)
    f.push([i*min+j,i*min+(j+1)%min,((i+1)%maj)*min+(j+1)%min,((i+1)%maj)*min+j]);
  return {v:v,f:f,R:R};}
function prism(n,r,h){
  var v=[],f=[],top=[],bot=[],i;
  for(i=0;i<n;i++){var a=i/n*6.2832;v.push([Math.cos(a)*r,-h/2,Math.sin(a)*r]);}
  for(i=0;i<n;i++){var b=i/n*6.2832;v.push([Math.cos(b)*r,h/2,Math.sin(b)*r]);}
  for(i=0;i<n;i++){var j=(i+1)%n;f.push([i,j,n+j,n+i]);bot.push(n-1-i);top.push(n+i);}
  f.push(bot,top);return {v:v,f:f};}
function cone(n,r,h){
  var v=[[0,h/2,0]],f=[],base=[],i;
  for(i=0;i<n;i++){var a=i/n*6.2832;v.push([Math.cos(a)*r,-h/2,Math.sin(a)*r]);}
  for(i=0;i<n;i++){f.push([0,1+i,1+(i+1)%n]);base.push(n-i);}
  f.push(base);return {v:v,f:f};}
/* full sphere, or with ymax a bowl open above that height */
function sphere(r,lat,lon,ymax){
  var v=[],f=[],rings=[],i,j,full=ymax==null,t0=full?0:Math.acos(Math.max(-1,Math.min(1,ymax/r)));
  if(full)v.push([0,r,0]);
  for(i=full?1:0;i<lat;i++){var th=t0+(Math.PI-t0)*i/lat,y=r*Math.cos(th),s=r*Math.sin(th),ring=[];
    for(j=0;j<lon;j++){var a=j/lon*6.2832;ring.push(v.length);v.push([Math.cos(a)*s,y,Math.sin(a)*s]);}
    rings.push(ring);}
  var sp=v.length;v.push([0,-r,0]);
  if(full)for(j=0;j<lon;j++)f.push([0,rings[0][(j+1)%lon],rings[0][j]]);
  for(i=0;i<rings.length-1;i++)for(j=0;j<lon;j++)
    f.push([rings[i][j],rings[i][(j+1)%lon],rings[i+1][(j+1)%lon],rings[i+1][j]]);
  var L=rings[rings.length-1];for(j=0;j<lon;j++)f.push([L[j],L[(j+1)%lon],sp]);
  return {v:v,f:f};}
function geo(r){
  var b=icosa(1),v=b.v.slice(),cache={},f=[];
  function mid(a,c){var k=a<c?a+'_'+c:c+'_'+a;if(cache[k]!=null)return cache[k];
    var p=v[a],q=v[c];v.push(norm([(p[0]+q[0])/2,(p[1]+q[1])/2,(p[2]+q[2])/2]));return cache[k]=v.length-1;}
  b.f.forEach(function(t){var a=mid(t[0],t[1]),bb=mid(t[1],t[2]),c=mid(t[2],t[0]);
    f.push([t[0],a,c],[t[1],bb,a],[t[2],c,bb],[a,bb,c]);});
  return {v:v.map(function(p){var n=norm(p);return [n[0]*r,n[1]*r,n[2]*r];}),f:f};}

function rot(p,rx,ry){
  var x=p[0],y=p[1],z=p[2],c1=Math.cos(rx),s1=Math.sin(rx),y1=y*c1-z*s1,z1=y*s1+z*c1;
  var c2=Math.cos(ry),s2=Math.sin(ry);return [x*c2+z1*s2,y1,-x*s2+z1*c2];}
function rotz(p,a){var c=Math.cos(a),s=Math.sin(a);return [p[0]*c-p[1]*s,p[0]*s+p[1]*c,p[2]];}
function sub(a,b){return [a[0]-b[0],a[1]-b[1],a[2]-b[2]];}
function cross(a,b){return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];}
function dot(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2];}
function norm(a){var l=Math.hypot(a[0],a[1],a[2])||1;return [a[0]/l,a[1]/l,a[2]/l];}
var ENV=[[0,[34,36,38]],[.20,[70,73,75]],[.38,[142,145,145]],[.48,[194,196,194]],[.53,[199,200,198]],
         [.62,[164,166,166]],[.74,[100,103,105]],[.88,[150,152,152]],[1,[178,180,178]]];
function env(u){u=u<0?0:u>1?1:u;
  for(var i=1;i<ENV.length;i++){if(u<=ENV[i][0]){var a=ENV[i-1],b=ENV[i],t=(u-a[0])/(b[0]-a[0]||1);
    return [a[1][0]+(b[1][0]-a[1][0])*t,a[1][1]+(b[1][1]-a[1][1])*t,a[1][2]+(b[1][2]-a[1][2])*t];}}
  return ENV[ENV.length-1][1];}
/* outward normals, computed once per part in its own space */
function prep(mesh){
  if(mesh.nrm)return mesh;mesh.nrm=[];
  for(var i=0;i<mesh.f.length;i++){
    var f=mesh.f[i],k,cen=[0,0,0];
    for(k=0;k<f.length;k++){cen[0]+=mesh.v[f[k]][0];cen[1]+=mesh.v[f[k]][1];cen[2]+=mesh.v[f[k]][2];}
    cen[0]/=f.length;cen[1]/=f.length;cen[2]/=f.length;
    var n=norm(cross(sub(mesh.v[f[1]],mesh.v[f[0]]),sub(mesh.v[f[2]],mesh.v[f[0]]))),ref;
    if(mesh.R){var l=Math.hypot(cen[0],cen[2])||1;ref=[cen[0]-mesh.R*cen[0]/l,cen[1],cen[2]-mesh.R*cen[2]/l];}
    else ref=cen;
    if(dot(n,ref)<0)n=[-n[0],-n[1],-n[2]];
    mesh.nrm.push(n);}
  return mesh;}
/* parts: {m, t:[x,y,z], rx, ry, rz} — normals are fixed before the move */
function merge(parts){
  var out={v:[],f:[],nrm:[]};
  parts.forEach(function(q){
    var m=prep(q.m),base=out.v.length,t=q.t||[0,0,0];
    function T(p){if(q.rz)p=rotz(p,q.rz);if(q.rx||q.ry)p=rot(p,q.rx||0,q.ry||0);return p;}
    m.v.forEach(function(p){p=T(p);out.v.push([p[0]+t[0],p[1]+t[1],p[2]+t[2]]);});
    m.f.forEach(function(f){out.f.push(f.map(function(i){return i+base;}));});
    m.nrm.forEach(function(n){out.nrm.push(T(n));});});
  return out;}
function fit(m,R){var mx=0;m.v.forEach(function(p){mx=Math.max(mx,Math.hypot(p[0],p[1],p[2]));});
  var k=R/mx;m.v=m.v.map(function(p){return [p[0]*k,p[1]*k,p[2]*k];});return m;}

var H=Math.PI/2;
var EM={
  icosa:function(){return icosa(1);},
  octa:function(){return octa(1);},
  torus:function(){return torus(1.02,.27,72,26);},
  cone:function(){return cone(36,.85,1.7);},
  moon:function(){return sphere(1,12,24);},
  ball:function(){return geo(1);},
  coin:function(){return merge([{m:prism(40,1,.2),rx:H}]);},
  stack:function(){var p=[],i,tw=[0,.14,-.1,.08,-.05];
    for(i=0;i<5;i++)p.push({m:cuboid(1.7,.16,1.1),t:[0,-.56+i*.28,0],ry:tw[i]});return merge(p);},
  column:function(){return merge([{m:cuboid(1.05,.18,1.05),t:[0,-.92,0]},{m:prism(18,.32,1.66)},{m:cuboid(1.05,.18,1.05),t:[0,.92,0]}]);},
  links:function(){return merge([{m:torus(.6,.13,48,14),t:[-.38,0,0]},{m:torus(.6,.13,48,14),t:[.38,0,0],rx:H}]);},
  drop:function(){var r=.62,d=1.6*r,yt=r*r/d,rt=Math.sqrt(r*r-yt*yt),h=d-yt;
    return merge([{m:sphere(r,10,24,yt)},{m:cone(24,rt,h),t:[0,yt+h/2,0]}]);},
  candle:function(){return merge([{m:cuboid(.55,1.2,.55)},{m:cuboid(.09,.4,.09),t:[0,.8,0]},{m:cuboid(.09,.36,.09),t:[0,-.78,0]}]);},
  frame:function(){return merge([{m:cuboid(1.8,.22,.22),t:[0,.79,0]},{m:cuboid(1.8,.22,.22),t:[0,-.79,0]},
    {m:cuboid(.22,1.36,.22),t:[-.79,0,0]},{m:cuboid(.22,1.36,.22),t:[.79,0,0]}]);},
  steps:function(){return merge([{m:cuboid(1.8,.3,1.8),t:[0,-.6,0]},{m:cuboid(1.32,.3,1.32),t:[0,-.3,0]},
    {m:cuboid(.86,.3,.86)},{m:cuboid(.42,.3,.42),t:[0,.3,0]}]);},
  lens:function(){return merge([{m:prism(36,.95,.5),rx:H,t:[0,0,-.2]},{m:prism(36,.62,.5),rx:H,t:[0,0,.3]}]);},
  form:function(){return merge([{m:cone(28,.72,1.45),t:[0,-.3,0]},{m:sphere(.3,8,16),t:[0,.72,0]}]);},
  reel:function(){var p=[{m:torus(.9,.11,56,12),rx:H},{m:prism(20,.2,.24),rx:H}];
    [0,1,2].forEach(function(i){p.push({m:cuboid(1.7,.09,.09),rz:i*Math.PI/3});});return merge(p);},
  phone:function(){return merge([{m:cuboid(.9,1.6,.14)},{m:cuboid(.78,1.44,.02),t:[0,0,.08]}]);}
};

var LIGHT=norm([-.42,.74,.52]);
/* on paper every face stays below the page tone; on black the ramp is lifted so no face sinks into it */
function shade(n){var c=env(.5+.5*n[1]*0.98+n[2]*.10),spec=Math.pow(Math.max(0,dot(n,LIGHT)),26),cap=LIFT?236:212;
  function ch(v){v=v+spec*130;return Math.min(cap,(LIFT?v*.8+50:v)|0);}
  return 'rgb('+ch(c[0])+','+ch(c[1])+','+ch(c[2])+')';}
function scene(x,W,H,items){
  var faces=[],i,j,k;
  for(i=0;i<items.length;i++){
    var mesh=prep(items[i].m),o=items[i].o,D=o.dist||4.2,cx=W/2+(o.ox||0),cy=H/2+(o.oy||0),sc=o.scale;
    var pv=mesh.v.map(function(p){return rot(p,o.rx,o.ry);});
    for(j=0;j<mesh.f.length;j++){
      var n=rot(mesh.nrm[j],o.rx,o.ry);if(n[2]<=0)continue;
      var f=mesh.f[j],pts=[],zs=0;
      for(k=0;k<f.length;k++){var pp=pv[f[k]],sf=D/(D+pp[2]);pts.push([cx+pp[0]*sf*sc,cy-pp[1]*sf*sc]);zs+=pp[2];}
      faces.push({p:pts,n:n,z:zs/f.length});}}
  faces.sort(function(a,b){return b.z-a.z;});
  for(i=0;i<faces.length;i++){
    var fc=faces[i],col=shade(fc.n),Q=fc.p;
    x.beginPath();x.moveTo(Q[0][0],Q[0][1]);for(k=1;k<Q.length;k++)x.lineTo(Q[k][0],Q[k][1]);
    x.closePath();x.fillStyle=col;x.fill();x.strokeStyle=col;x.lineWidth=1;x.stroke();}}
function contact(x,cx,cy,w,h,s){
  var g=x.createRadialGradient(cx,cy,1,cx,cy,w);
  g.addColorStop(0,'rgba('+INK+','+s+')');g.addColorStop(.45,'rgba('+INK+','+s*.42+')');g.addColorStop(1,'rgba('+INK+',0)');
  x.save();x.translate(cx,cy);x.scale(1,h/w);x.translate(-cx,-cy);x.fillStyle=g;x.beginPath();x.arc(cx,cy,w,0,6.2832);x.fill();x.restore();}

/* one sizing + visibility helper for every canvas */
var all=[];
function track(cv,st){
  st.x=cv.getContext('2d');
  st.rs=function(){var d=Math.min(devicePixelRatio||1,2);st.W=cv.clientWidth;st.H=cv.clientHeight;
    cv.width=Math.round(st.W*d);cv.height=Math.round(st.H*d);st.x.setTransform(d,0,0,d,0,0);};
  st.rs();
  new IntersectionObserver(function(es){es.forEach(function(e){st.vis=e.isIntersecting;});},{threshold:.04}).observe(cv);
  all.push(st);return st;}
function refresh(){all.forEach(function(s){s.rs();s.draw();});}
addEventListener('resize',refresh);

/* thin shapes get a bit more size; flat ones sway instead of spinning, so they never sit edge-on */
var GROW={links:1.35,candle:1.25,steps:1.2,column:1.1},FLAT={coin:1,phone:1,frame:1,lens:1,reel:1};
function emblem(cv){
  var k=cv.dataset.em,m=fit(EM[k](),1.15*(GROW[k]||1)),big=!!cv.dataset.big,flat=!!FLAT[k];
  var st=track(cv,{t:big?2:Math.random()*20,draw:function(){
    var x=st.x,W=st.W,H=st.H;if(!W)return;
    var sc=Math.min(W,H)*(big?.27:.25),rx=-.24+Math.sin(st.t*.7)*.09,ry=flat?.35+Math.sin(st.t*1.6)*.7:st.t*2.1;
    x.clearRect(0,0,W,H);
    contact(x,W/2,H/2+sc*1.32,sc*1.05,sc*.13,.2);
    scene(x,W,H,[{m:m,o:{rx:rx,ry:ry,scale:sc}}]);
  },step:function(){st.t+=.0036;}});
}

/* ============================================================
   CARDS + CASE PAGES, rendered from PROJECTS
   ============================================================ */
function groupOf(p){for(var i=0;i<G.length;i++)if(G[i].id===p.g)return G[i];return {id:'top',label:'Home'};}
function card(p){
  var art=p.img?'<img src="'+esc(p.img)+'" alt="" loading="lazy">':'<canvas data-em="'+p.shape+'"></canvas>';
  return '<a class="card" href="#v-'+p.id+'"><div class="art">'+art+'<div class="no">'+p.no+'</div>'+
    '<div class="st'+(p.live?' live':'')+'">'+esc(p.st)+'</div>'+(p.play?'<div class="play">▶ '+esc(p.play)+'</div>':'')+'</div>'+
    '<div class="bd"><div class="nm">'+esc(p.name)+'</div><div class="dis">'+esc(p.dis)+'</div>'+
    (p.kpi?'<div class="kpi"><b>'+esc(p.kpi[0])+'</b><span>'+esc(p.kpi[1])+'</span></div>':'')+
    '<p class="tx">'+esc(p.tx)+'</p><div class="tk">'+esc(p.tk)+'</div><div class="go">Open case <span>→</span></div></div></a>';}

function wrap(f,inner){
  return '<figure class="fg">'+(f.title?'<figcaption class="fg-t">'+esc(f.title)+'</figcaption>':'')+inner+
    (f.note?'<p class="fg-n">'+esc(f.note)+'</p>':'')+'</figure>';}
function pct(v,mn,mx){return (v-mn)/(mx-mn)*100;}
function axis(f){
  if(!f.ticks)return '';
  return '<div class="dax"><span></span><div>'+f.ticks.map(function(t){
    return '<s style="left:'+pct(t[0],f.min,f.max)+'%">'+esc(t[1])+'</s>';}).join('')+'</div></div>';}
function fig(f){
  var mn=f.min||0,mx=f.max;
  if(f.type==='bars'){
    var z=pct(0,mn,mx);
    return wrap(f,'<div class="bars">'+f.rows.map(function(r){
      var v=pct(r[1],mn,mx),l=Math.min(z,v),w=Math.abs(v-z);
      return '<div class="brw"><span class="bl">'+esc(r[0])+'</span><span class="bt">'+(mn<0?'<i class="z" style="left:'+z+'%"></i>':'')+
        '<i class="b'+(r[3]?' hi':'')+'" style="left:'+l+'%;width:'+w+'%"></i></span><span class="bv">'+esc(r[2])+'</span></div>';}).join('')+'</div>');}
  if(f.type==='pairs'){
    var z2=mn<0?'<i class="z" style="left:'+pct(0,mn,mx)+'%"></i>':'';
    return wrap(f,'<div class="key"><span><i class="dot-o"></i>'+esc(f.a)+'</span><span><i class="dot-f"></i>'+esc(f.b)+'</span></div>'+
      '<div class="dumb">'+f.rows.map(function(r){
        var a=pct(r[1],mn,mx),b=pct(r[2],mn,mx);
        return '<div class="dr"><div class="dl"><b>'+esc(r[0])+'</b><span>'+esc(r[3])+'</span></div><div class="dt">'+z2+
          '<i class="ln" style="left:'+Math.min(a,b)+'%;width:'+Math.abs(a-b)+'%"></i><i class="p dot-o" style="left:'+a+'%"></i>'+
          '<i class="p dot-f" style="left:'+b+'%"></i></div></div>';}).join('')+'</div>'+axis(f));}
  if(f.type==='table'){
    return wrap(f,'<div class="tablewrap"><table class="tbl"><thead><tr>'+f.head.map(function(h,i){
      return '<th'+(i&&f.num?' class="n"':'')+'>'+esc(h)+'</th>';}).join('')+'</tr></thead><tbody>'+
      f.rows.map(function(r,ri){return '<tr'+(ri===f.hi?' class="hi"':'')+'>'+r.map(function(c,i){
        return '<td'+(i&&f.num?' class="n"':'')+'>'+esc(c)+'</td>';}).join('')+'</tr>';}).join('')+'</tbody></table></div>');}
  if(f.type==='shot'){
    return wrap(f,'<div class="shot"><div class="shot-bar"><span>'+esc(f.cap)+'</span><i><b></b><b></b><b></b></i></div>'+
      '<img src="'+esc(f.src)+'" alt="'+esc(f.cap)+'" loading="lazy"></div>');}
  if(f.type==='gallery'){
    return wrap(f,'<div class="gal">'+f.items.map(function(it){
      return '<figure'+(it[2]?' class="w"':'')+'><img src="'+esc(it[0])+'" alt="'+esc(it[1])+'" loading="lazy"><figcaption>'+esc(it[1])+'</figcaption></figure>';}).join('')+'</div>');}
  if(f.type==='video'){
    return wrap(f,'<div class="vid"><video controls playsinline preload="none" poster="'+esc(f.poster)+'" src="'+esc(f.src)+'"></video>'+
      (f.cap?'<figcaption>'+esc(f.cap)+'</figcaption>':'')+'</div>');}
  return '';}
function block(c){
  if(typeof c==='string')return '<p>'+esc(c)+'</p>';
  if(Array.isArray(c))return '<ul class="v-list">'+c.map(function(s){return '<li>'+esc(s)+'</li>';}).join('')+'</ul>';
  if(c.paras)return c.paras.map(function(s){return '<p>'+esc(s)+'</p>';}).join('');
  if(c.figs)return c.figs.map(fig).join('');
  if(c.links)return '<div class="v-links">'+c.links.map(function(l){
    var ext=/^https?:/.test(l[1]);
    return '<a href="'+esc(l[1])+'"'+(ext?' target="_blank" rel="noopener"':'')+(l[2]?' class="ghost"':'')+'>'+esc(l[0])+' <span>'+(ext?'↗':'→')+'</span></a>';}).join('')+'</div>';
  return '';}
function view(p,i){
  var g=groupOf(p),prev=P[(i-1+P.length)%P.length],next=P[(i+1)%P.length];
  var h='<article class="view" id="v-'+p.id+'" hidden aria-label="'+esc(p.name)+'">'+
    '<div class="v-top"><a href="#'+g.id+'">← '+esc(g.label)+'</a><span>'+String(i+1).padStart(2,'0')+' / '+String(P.length).padStart(2,'0')+'</span></div>'+
    '<header class="v-head"><div><div class="eyebrow">'+esc(g.label)+' · '+p.no+'</div><h1>'+esc(p.name)+'</h1>'+
    '<div class="v-dis">'+esc(p.dis)+'</div><p class="v-lede">'+esc(p.lede||p.tx)+'</p></div>'+
    '<div class="v-art">'+(p.hero?'<img src="'+esc(p.hero)+'" alt="">':'<canvas data-em="'+p.shape+'" data-big="1"></canvas>')+
    '<i class="cm tl"></i><i class="cm tr"></i><i class="cm bl"></i><i class="cm br"></i><div class="st'+(p.live?' live':'')+'">'+esc(p.st)+'</div></div></header>';
  if(p.meta)h+='<dl class="v-meta">'+p.meta.map(function(m){return '<div><dt>'+esc(m[0])+'</dt><dd>'+esc(m[1])+'</dd></div>';}).join('')+'</dl>';
  if(p.kpis)h+='<div class="v-kpis" style="--n:'+p.kpis.length+'">'+p.kpis.map(function(k){
    return '<div class="stat"><b>'+esc(k[0])+'</b><span>'+esc(k[1])+'</span></div>';}).join('')+'</div>';
  (p.rows||[]).forEach(function(r){h+='<div class="v-row"><h2>'+esc(r[0])+'</h2><div class="v-body">'+block(r[1])+'</div></div>';});
  h+='<nav class="v-pn" aria-label="More work"><a href="#v-'+prev.id+'"><span>← Previous</span><b>'+esc(prev.name)+'</b></a>'+
    '<a href="#v-'+next.id+'"><span>Next →</span><b>'+esc(next.name)+'</b></a></nav></article>';
  return h;}

G.forEach(function(g){var el=document.getElementById(g.grid);if(el)el.innerHTML=P.filter(function(p){return p.g===g.id;}).map(card).join('');});
var vroot=document.getElementById('views');
vroot.innerHTML=P.map(view).join('');
document.querySelectorAll('canvas[data-em]').forEach(emblem);

/* ---------- index menu ---------- */
var menu=document.getElementById('menu'),ixbtn=document.getElementById('ixbtn');
menu.innerHTML='<div class="m-in" style="--mc:'+(G.length>2?2:G.length)+'"><div class="m-col"><div class="m-h">Sections</div>'+
  SEC.map(function(s){return '<a class="m-big" href="#'+s[0]+'">'+esc(s[1])+'</a>';}).join('')+
  (ELSE.length?'<div class="m-h">Elsewhere</div>'+ELSE.map(function(l){
    return '<a class="m-p" href="'+esc(l[1])+'" target="_blank" rel="noopener"><s>↗</s>'+esc(l[0])+'</a>';}).join(''):'')+'</div>'+
  (function(){var cols=[[],[]];G.forEach(function(g,i){cols[G.length>2?i%2:i].push(g);});
    return cols.filter(function(c){return c.length;}).map(function(c){return '<div class="m-col">'+c.map(function(g){
      return '<div class="m-h">'+esc(g.label)+'</div>'+P.filter(function(p){return p.g===g.id;}).map(function(p){
        return '<a class="m-p" href="#v-'+p.id+'"><s>'+p.no+'</s>'+esc(p.name)+'<em>'+esc(p.st)+'</em></a>';}).join('');}).join('')+'</div>';}).join('');})()+
  '</div>';
function setMenu(open){
  menu.hidden=!open;ixbtn.setAttribute('aria-expanded',open);ixbtn.lastChild.textContent=open?'Close':'Index';
  document.body.classList.toggle('menu-open',open);
  if(open){var a=menu.querySelector('a');if(a)a.focus();}}
ixbtn.addEventListener('click',function(){setMenu(menu.hidden);});
menu.addEventListener('click',function(e){if(e.target.closest('a'))setMenu(false);});
addEventListener('keydown',function(e){if(e.key==='Escape'&&!menu.hidden){setMenu(false);ixbtn.focus();}});

/* ---------- routing: #v-<id> opens a case page, anything else is home ---------- */
var home=document.getElementById('home');
function route(){
  var h=location.hash.slice(1),v=h.indexOf('v-')===0?document.getElementById(h):null;
  home.hidden=!!v;
  [].forEach.call(vroot.children,function(el){el.hidden=el!==v;});
  refresh();
  if(v)window.scrollTo({top:0,behavior:'instant'});
  else if(h){var t=document.getElementById(h);if(t)t.scrollIntoView({behavior:'instant'});}
  ui();}
addEventListener('hashchange',route);

/* ============================================================
   HERO + METHOD PLATES
   ============================================================ */
(function(){
  var cv=document.getElementById('stage');if(!cv)return;
  var SOLID=icosa(1.05),RING=torus(1.66,.085,96,22),mx=0,my=0,tmx=0,tmy=0;
  addEventListener('pointermove',function(e){tmx=(e.clientX/innerWidth-.5)*2;tmy=(e.clientY/innerHeight-.5)*2;},{passive:true});
  var st=track(cv,{t:0,draw:function(){
    var x=st.x,W=st.W,H=st.H;if(!W)return;
    var narrow=W<900,sc=Math.min(W,H)*(narrow?.235:.26),oy=narrow?-H*.10:0,rx=-.20+my*.26,ry=st.t*2+mx*.5;
    x.clearRect(0,0,W,H);
    contact(x,W/2,H/2+oy+sc*1.28,sc*1.12,sc*.14,.22);
    scene(x,W,H,[{m:RING,o:{rx:rx+.52,ry:ry*1.5,scale:sc,oy:oy}},{m:SOLID,o:{rx:rx,ry:ry,scale:sc,oy:oy}}]);
  },step:function(){st.t+=.004;mx+=(tmx-mx)*.06;my+=(tmy-my)*.06;}});
})();

function ink(a){return 'rgba('+INK+','+a+')';}
function plate(st){
  var x=st.x,W=st.W,H=st.H,b={l:W*.05,r:W*.95,t:H*.10,b:H*.80};
  x.strokeStyle=ink(.13);x.lineWidth=1;x.beginPath();x.moveTo(b.l,b.b+.5);x.lineTo(b.r,b.b+.5);x.stroke();
  x.strokeStyle=ink(.30);var tx=st.mir?b.r-.5:b.l+.5;
  x.beginPath();x.moveTo(tx,b.b);x.lineTo(tx,b.b-H*.09);x.stroke();
  return b;}
function label(x,s,px,py,al){x.font=MONO;x.fillStyle=ink(.5);x.textAlign=al||'left';x.fillText(s,px,py);}
function seeded(){var s=7;return function(){s=(s*1103515245+12345)&0x7fffffff;return s/0x7fffffff;};}
/* random-date cloud: half-normal scaled so its 95th percentile sits at t = 2.79 */
var CLOUD=(function(){var r=seeded(),out=[],i;
  for(i=0;i<84;i++){var u=Math.max(r(),1e-6),v=r();out.push(Math.min(Math.abs(Math.sqrt(-2*Math.log(u))*Math.cos(6.2832*v))*2.79/1.96,4.4));}
  return out;})();
var SEEDS=(function(){var r=seeded(),out=[],i;for(i=0;i<46;i++)out.push([r(),r()]);return out;})();
var FIG={
  split:function(st){
    var x=st.x,b=plate(st),i,span=b.r-b.l,sx=b.l+span*.58;
    x.setLineDash([3,4]);x.strokeStyle=ink(.35);x.beginPath();x.moveTo(sx+.5,b.t);x.lineTo(sx+.5,b.b);x.stroke();x.setLineDash([]);
    label(x,'TRAIN',b.l+8,b.t+4);label(x,'UNSEEN',sx+8,b.t+4);
    for(i=0;i<SEEDS.length;i++){
      var u=(SEEDS[i][0]+st.t*.05)%1,px=b.l+span*u,py=b.t+16+SEEDS[i][1]*(b.b-b.t-26),keep=i%23===0;
      if(u>.58&&!keep){var k=Math.min(1,(u-.58)/.14);if(k>=1)continue;
        py+=(b.b-3-py)*k;x.fillStyle=ink((.42*(1-k)).toFixed(3));x.beginPath();x.arc(px,py,1.4,0,6.2832);x.fill();continue;}
      x.fillStyle=ink(keep&&u>.58?.85:.42);x.beginPath();x.arc(px,py,keep&&u>.58?2.8:1.6,0,6.2832);x.fill();}
  },
  spread:function(st){
    var x=st.x,b=plate(st),i,u,N=140,span=b.r-46-b.l,cy=(b.t+b.b)/2,amp=(b.b-b.t)*.26,hs=(b.b-b.t)*.08;
    function mid(u){return cy-amp*(Math.sin(u*9+st.t*.9)*.5+Math.sin(u*23-st.t*1.3)*.22+Math.sin(u*3.1+st.t*.4)*.28);}
    x.beginPath();for(i=0;i<=N;i++){u=i/N;x.lineTo(b.l+span*u,mid(u)-hs);}
    for(i=N;i>=0;i--){u=i/N;x.lineTo(b.l+span*u,mid(u)+hs);}x.closePath();x.fillStyle=ink(.05);x.fill();
    [[-hs,.38,[]],[0,.28,[3,4]],[hs,.38,[]]].forEach(function(L){
      x.setLineDash(L[2]);x.strokeStyle=ink(L[1]);x.beginPath();
      for(var j=0;j<=N;j++){var w=j/N;x.lineTo(b.l+span*w,mid(w)+L[0]);}x.stroke();});
    x.setLineDash([]);
    label(x,'ASK',b.r,mid(1)-hs+3,'right');label(x,'MID',b.r,mid(1)+3,'right');label(x,'BID',b.r,mid(1)+hs+3,'right');
    var p1=[b.l+span*.28,mid(.28)-hs],p2=[b.l+span*.72,mid(.72)+hs];
    x.strokeStyle=ink(.55);x.beginPath();x.moveTo(p1[0],p1[1]);x.lineTo(p2[0],p2[1]);x.stroke();
    x.fillStyle=ink(.85);[p1,p2].forEach(function(p){x.beginPath();x.arc(p[0],p[1],3,0,6.2832);x.fill();});
    label(x,'BUY',p1[0],p1[1]-9,'center');label(x,'SELL',p2[0],p2[1]+16,'center');
  },
  control:function(st){
    var x=st.x,b=plate(st),i,span=b.r-b.l;
    function X(v){return b.l+span*(v/4.5);}
    for(i=0;i<=4;i++){x.strokeStyle=ink(.25);x.beginPath();x.moveTo(X(i)+.5,b.b);x.lineTo(X(i)+.5,b.b+4);x.stroke();
      label(x,String(i),X(i),b.b+16,'center');}
    label(x,'T',b.r,b.b+16,'right');
    var n=Math.min(CLOUD.length,Math.floor(((st.t*.11)%1)*1.4*CLOUD.length)),bins={},dy=Math.max(3.2,(b.b-b.t)/22);
    x.fillStyle=ink(.34);
    for(i=0;i<n;i++){var k=Math.floor(CLOUD[i]/.16),c=bins[k]=(bins[k]||0)+1;
      x.beginPath();x.arc(X((k+.5)*.16),b.b-3-(c-1)*dy,1.5,0,6.2832);x.fill();}
    x.setLineDash([3,4]);x.strokeStyle=ink(.5);x.beginPath();x.moveTo(X(2.79)+.5,b.t+14);x.lineTo(X(2.79)+.5,b.b);x.stroke();x.setLineDash([]);
    label(x,'P95 RANDOM',X(2.79)-6,b.t+10,'right');
    x.strokeStyle=ink(.8);x.beginPath();x.moveTo(X(3.87)+.5,b.t+14);x.lineTo(X(3.87)+.5,b.b);x.stroke();
    x.fillStyle=ink(.9);x.beginPath();x.arc(X(3.87),b.t+14,3,0,6.2832);x.fill();
    label(x,'FED DAYS',X(3.87)+8,b.t+10);
  }
};
document.querySelectorAll('.pil canvas').forEach(function(cv){
  /* t = 7.3 puts the control plate's cloud fully built, so the still frame reads */
  var st=track(cv,{t:cv.dataset.fig==='control'?7.3:Math.random()*20,mir:cv.dataset.mirror==='1',
    draw:function(){if(!st.W)return;st.x.clearRect(0,0,st.W,st.H);FIG[cv.dataset.fig](st);},
    step:function(){st.t+=.016;}});
});

/* ---------- bar + current section ---------- */
var bar=document.getElementById('bar'),links=[].slice.call(document.querySelectorAll('.nav a'));
function ui(){
  bar.classList.toggle('on',scrollY>40||home.hidden);
  var line=innerHeight*.42;
  links.forEach(function(a){var s=document.getElementById(a.dataset.sec),r=s&&s.getBoundingClientRect();
    a.classList.toggle('here',!home.hidden&&!!r&&r.top<=line&&r.bottom>line);});
}
addEventListener('scroll',ui,{passive:true});

route();
(function loop(){
  if(!reduce)for(var i=0;i<all.length;i++){var s=all[i];if(s.vis){s.step();s.draw();}}
  requestAnimationFrame(loop);
})();
})();
