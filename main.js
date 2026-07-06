import * as THREE from 'three';
import { shows, venueConfig } from './media.js';

const $=id=>document.getElementById(id);
const canvas=$('world'), boot=$('boot'), enter=$('enter-world'), hint=$('hint');
const dlg=$('dialogue'), dt=$('dialogue-title'), dx=$('dialogue-text'), da=$('dialogue-actions'), dc=$('dialogue-close');
const fs=$('fullscreen'), q=$('quality'), reset=$('reset'), stick=$('touch-stick'), nub=stick.querySelector('span'), act=$('touch-action');

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x090202);
scene.fog=new THREE.FogExp2(0x090202,.018);
const cam=new THREE.PerspectiveCamera(70,innerWidth/innerHeight,.08,220);
const r=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
r.setPixelRatio(Math.min(devicePixelRatio,1.8));
r.setSize(innerWidth,innerHeight);
r.outputColorSpace=THREE.SRGBColorSpace;
r.shadowMap.enabled=true;

const clock=new THREE.Clock(), keys=new Set(), walls=[], picks=[], ray=new THREE.Raycaster(), mid=new THREE.Vector2();
let hi=true, locked=false, joy={x:0,y:0}, look=null;
const p={pos:new THREE.Vector3(0,1.7,70),yaw:Math.PI,pitch:0,rad:.72,speed:7};

function tex(w,h,draw,rep=[1,1]){const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');draw(g,w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(...rep);t.anisotropy=8;return t}
function noise(g,w,h,n=1200,a=.08){for(let i=0;i<n;i++){g.fillStyle=Math.random()>.5?`rgba(255,255,255,${Math.random()*a})`:`rgba(0,0,0,${Math.random()*a})`;g.fillRect(Math.random()*w,Math.random()*h,1+Math.random()*3,1+Math.random()*3)}}
function wrap(g,s,x,y,m,l){const a=String(s).split(/\s+/),out=[];let line='';for(const w of a){const t=line?line+' '+w:w;if(g.measureText(t).width>m&&line){out.push(line);line=w}else line=t}if(line)out.push(line);out.forEach((v,i)=>g.fillText(v,x,y+(i-(out.length-1)/2)*l))}
function sign(title,sub,{a='#280707',b='#050202',border='#ffd36e',glow='#ff9d43',ts=70,ss=32}={}){return tex(900,560,(g,w,h)=>{const gr=g.createLinearGradient(0,0,w,h);gr.addColorStop(0,a);gr.addColorStop(1,b);g.fillStyle=gr;g.fillRect(0,0,w,h);noise(g,w,h,900,.055);g.strokeStyle=border;g.lineWidth=14;g.strokeRect(18,18,w-36,h-36);g.textAlign='center';g.textBaseline='middle';g.shadowColor=glow;g.shadowBlur=30;g.fillStyle='#fff0c9';g.font=`900 ${ts}px Tahoma,Arial`;wrap(g,title,w/2,h*.38,w*.82,ts*.92);g.shadowBlur=12;g.fillStyle=border;g.font=`800 ${ss}px Tahoma,Arial`;wrap(g,sub,w/2,h*.75,w*.84,ss*1.28)},[1,1])}
function poster(show){const [a,b,c]=show.posterStyle||['#4d1111','#ffd36e','#ff4fd8'];return sign(show.band,`${show.date} • ${show.time}\n${show.tagline}`,{a,b:'#050202',border:b,glow:c,ts:78,ss:31})}

const maps={
 street:tex(512,512,(g,w,h)=>{g.fillStyle='#111014';g.fillRect(0,0,w,h);for(let y=0;y<h;y+=56){for(let x=(y/56%2)*42;x<w;x+=84){g.fillStyle=`rgb(${26+Math.random()*24},${24+Math.random()*18},${30+Math.random()*18})`;g.fillRect(x+2,y+2,78,50)}}g.strokeStyle='rgba(255,211,110,.12)';for(let y=0;y<h;y+=56){g.beginPath();g.moveTo(0,y);g.lineTo(w,y);g.stroke()}noise(g,w,h,2200,.1)},[15,17]),
 brick:tex(512,512,(g,w,h)=>{g.fillStyle='#4a1712';g.fillRect(0,0,w,h);for(let y=0;y<h;y+=44){for(let x=(y/44%2)*48;x<w;x+=96){g.fillStyle=`rgb(${70+Math.random()*52},${20+Math.random()*20},${14+Math.random()*16})`;g.fillRect(x+3,y+3,90,38)}}noise(g,w,h,1500,.08)},[3,3]),
 stucco:tex(512,512,(g,w,h)=>{const gr=g.createLinearGradient(0,0,w,h);gr.addColorStop(0,'#986547');gr.addColorStop(1,'#3a1511');g.fillStyle=gr;g.fillRect(0,0,w,h);noise(g,w,h,3500,.09)},[2,2])
};
const mat={street:new THREE.MeshStandardMaterial({map:maps.street,roughness:.9,metalness:.08}),brick:new THREE.MeshStandardMaterial({map:maps.brick,roughness:.86}),stucco:new THREE.MeshStandardMaterial({map:maps.stucco,roughness:.84}),gold:new THREE.MeshStandardMaterial({color:0xffc45c,roughness:.36,metalness:.25}),iron:new THREE.MeshStandardMaterial({color:0x111014,roughness:.5,metalness:.75}),wood:new THREE.MeshStandardMaterial({color:0x3a1f12,roughness:.8}),glow:new THREE.MeshBasicMaterial({color:0xff9d43})};

function box(w,h,d,m,x=0,y=0,z=0){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;return o}
function plane(w,h,m,x=0,y=0,z=0,ry=0){const o=new THREE.Mesh(new THREE.PlaneGeometry(w,h),m);o.position.set(x,y,z);o.rotation.y=ry;return o}
function col(x,z,w,d){walls.push({minX:x-w/2,maxX:x+w/2,minZ:z-d/2,maxZ:z+d/2})}
function wall(x,z,w,d,h=7,m=mat.brick){scene.add(box(w,h,d,m,x,h/2,z));col(x,z,w+.3,d+.3)}
function pick(o,data){o.userData.data=data;picks.push(o)}
function addPoster(show,x,y,z,ry,s=1){const o=plane(4.5*s,6.4*s,new THREE.MeshBasicMaterial({map:poster(show)}),x,y,z,ry);scene.add(o);pick(o,{title:show.band,text:`${show.date} at ${show.time}. ${show.tagline}. ${show.note||''}`})}
function neon(title,sub,x,y,z,ry,w=8,h=3.5,c='#ff4fd8'){const o=plane(w,h,new THREE.MeshBasicMaterial({map:sign(title,sub,{border:c,glow:c,ts:52,ss:24})}),x,y,z,ry);scene.add(o);pick(o,{title,text:sub});const l=new THREE.PointLight(new THREE.Color(c),1.25,18,1.7);l.position.set(x,y,z);scene.add(l)}
function lamp(x,z,c=0xff9d43){const g=new THREE.Group();g.add(box(.12,3,.12,mat.iron,0,1.5,0));const s=new THREE.Mesh(new THREE.SphereGeometry(.25,16,12),mat.glow);s.position.y=3.05;const l=new THREE.PointLight(c,1.6,16,1.7);l.position.y=3.05;g.add(s,l);g.position.set(x,0,z);scene.add(g)}
function balcony(x,z,w,ry){const g=new THREE.Group();g.add(box(w,.12,1,mat.wood,0,3.2,0),box(w,.62,.08,mat.iron,0,3.72,-.5));for(let i=-w/2+.7;i<w/2;i+=1.3)g.add(box(.07,1,.07,mat.iron,i,3.48,-.5));g.position.set(x,0,z);g.rotation.y=ry;scene.add(g)}

function build(){
 scene.add(new THREE.HemisphereLight(0xffcf9a,0x160404,1));
 const moon=new THREE.DirectionalLight(0xffd7a8,1.05);moon.position.set(-24,50,45);moon.castShadow=true;scene.add(moon);
 const ground=new THREE.Mesh(new THREE.PlaneGeometry(135,155),mat.street);ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
 wall(-36,0,2,132,8);wall(36,0,2,132,8);wall(0,-62,74,2,8);wall(-18,46,36,2,8);wall(24,46,24,2,8);
 [[-18,25,2,36],[14,19,2,46],[-8,-5,2,44],[25,-18,2,38],[-24,-32,2,38],[0,-48,28,2],[18,-2,22,2],[-25,6,22,2],[8,34,20,2],[-18,-18,24,2]].forEach((a,i)=>wall(...a,7,i%2?mat.stucco:mat.brick));
 neon(venueConfig.marqueeTop,venueConfig.marqueeBottom,0,9.5,54,0,28,7,'#ffd36e');
 const sched=plane(12,8,new THREE.MeshBasicMaterial({map:sign('NOW SHOWING',shows.map(s=>`${s.time}  ${s.band}`).join('\n'),{border:'#ffd36e',glow:'#ff9d43',ts:66,ss:29})}),-28,5,54,0);scene.add(sched);pick(sched,{title:'NOW SHOWING',text:'A copied schedule board in the street, like a Broadway lobby leaked into the French Quarter.'});
 [[-34,4,35,Math.PI/2],[-34,4,22,Math.PI/2],[-34,4,9,Math.PI/2],[34,4,34,-Math.PI/2],[34,4,21,-Math.PI/2],[34,4,8,-Math.PI/2],[-17,4,44,0],[8,4,44,0],[-10,4,16,Math.PI/2],[16,4,10,-Math.PI/2],[-23,4,-6,0],[24,4,-8,Math.PI],[0,4,-47,0],[-28,4,-40,Math.PI/2],[30,4,-28,-Math.PI/2],[-14,4,-30,Math.PI]].forEach((p,i)=>addPoster(shows[i%shows.length],...p,1));
 neon('RUE NEON','BANDS • BALCONY • LIVE',-18,7,27,Math.PI/2,8,3.5,'#ff4fd8');
 neon('DECATUR DREAMS','POSTERS ALL NIGHT',14,7,31,-Math.PI/2,8,3.5,'#4deaff');
 neon('MOON BAR','NO COVER IN THE MAZE',-7,7,-8,Math.PI/2,8,3.5,'#ff8f35');
 neon('BMC LIVE','CLICK POSTERS FOR MEDIA',26,7,-18,-Math.PI/2,8,3.5,'#ffd36e');
 [[-28,39],[-12,39],[12,39],[28,39],[-30,12],[30,12],[-30,-16],[30,-16],[-12,-54],[12,-54],[-2,22],[22,2],[-22,-26],[6,-36]].forEach(([x,z],i)=>lamp(x,z,i%3===0?0xff6b2b:i%3===1?0xffc55b:0xff3c8a));
 [[-35,32,12,Math.PI/2],[35,30,11,-Math.PI/2],[-35,-22,10,Math.PI/2],[35,-38,12,-Math.PI/2],[-8,-7,10,Math.PI/2],[14,5,10,-Math.PI/2]].forEach(a=>balcony(...a));
 neon('JACKSON SQUARE EXIT','RESET RETURNS TO CANAL STREET',0,5,-61,0,16,4,'#73ff8a');
}
function show(d){dt.textContent=d.title||'French Quarter Maze';dx.textContent=d.text||'';da.innerHTML='';dlg.classList.remove('hidden')}
function updateCam(){cam.position.copy(p.pos);cam.rotation.order='YXZ';cam.rotation.y=p.yaw;cam.rotation.x=p.pitch}
function blocked(x,z){if(Math.abs(x)>44||z>75||z<-67)return true;return walls.some(c=>x+p.rad>c.minX&&x-p.rad<c.maxX&&z+p.rad>c.minZ&&z-p.rad<c.maxZ)}
function move(dt){const f=(keys.has('KeyW')||keys.has('ArrowUp')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0)+joy.y,s=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0)+joy.x;if(!f&&!s)return;const sin=Math.sin(p.yaw),cos=Math.cos(p.yaw),d=new THREE.Vector3(sin*f+cos*s,0,cos*f-sin*s);if(d.lengthSq()>1)d.normalize();d.multiplyScalar(p.speed*(keys.has('ShiftLeft')||keys.has('ShiftRight')?1.65:1)*dt);const nx=p.pos.x+d.x,nz=p.pos.z+d.z;if(!blocked(nx,p.pos.z))p.pos.x=nx;if(!blocked(p.pos.x,nz))p.pos.z=nz}
function target(){ray.setFromCamera(mid,cam);return ray.intersectObjects(picks,false).find(h=>h.distance<8)}
function inspect(){const h=target();h?.object?.userData?.data?show(h.object.userData.data):show({title:'Nothing Selected',text:'Look at a poster, neon sign, schedule board, or marquee, then press E or click.'})}
function loop(){requestAnimationFrame(loop);const dt=clock.getDelta();move(Math.min(dt,.05));updateCam();const h=target();hint.textContent=h?.object?.userData?.data?`E / click: ${h.object.userData.data.title}`:'WASD move • Mouse look • E / click inspect • Shift sprint • Esc release';r.render(scene,cam)}
function resetP(){p.pos.set(0,1.7,70);p.yaw=Math.PI;p.pitch=0;updateCam()}

document.addEventListener('pointerlockchange',()=>locked=document.pointerLockElement===canvas);
document.addEventListener('mousemove',e=>{if(!locked)return;p.yaw-=e.movementX*.0022;p.pitch=THREE.MathUtils.clamp(p.pitch-e.movementY*.0022,-1.25,1.25)});
document.addEventListener('keydown',e=>{keys.add(e.code);if(e.code==='KeyE')inspect();if(e.code==='Escape')dlg.classList.add('hidden')});
document.addEventListener('keyup',e=>keys.delete(e.code));
canvas.addEventListener('click',()=>{if(!boot.classList.contains('hidden')&&!locked)return;inspect()});
enter.onclick=()=>{boot.classList.add('hidden');canvas.focus();if(!matchMedia('(pointer: coarse)').matches)canvas.requestPointerLock?.()};
dc.onclick=()=>dlg.classList.add('hidden');
fs.onclick=async()=>{if(!document.fullscreenElement)await document.documentElement.requestFullscreen?.();else await document.exitFullscreen?.()};
q.onclick=()=>{hi=!hi;r.setPixelRatio(hi?Math.min(devicePixelRatio,1.8):1);r.shadowMap.enabled=hi;q.textContent=hi?'Quality: High':'Quality: Low'};
reset.onclick=resetP;
function stickMove(e){const r=stick.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,dx=Math.max(-42,Math.min(42,e.clientX-cx)),dy=Math.max(-42,Math.min(42,e.clientY-cy));nub.style.transform=`translate(${dx}px,${dy}px)`;joy.x=dx/42;joy.y=-dy/42}
function stickClear(){joy={x:0,y:0};nub.style.transform='translate(0,0)'}
stick.addEventListener('pointerdown',e=>{stick.setPointerCapture(e.pointerId);stickMove(e)});stick.addEventListener('pointermove',stickMove);stick.addEventListener('pointerup',stickClear);stick.addEventListener('pointercancel',stickClear);act.onclick=inspect;
canvas.addEventListener('pointerdown',e=>{if(matchMedia('(pointer: coarse)').matches)look={x:e.clientX,y:e.clientY}});
canvas.addEventListener('pointermove',e=>{if(!look)return;const dx=e.clientX-look.x,dy=e.clientY-look.y;look={x:e.clientX,y:e.clientY};p.yaw-=dx*.005;p.pitch=THREE.MathUtils.clamp(p.pitch-dy*.005,-1.25,1.25)});
canvas.addEventListener('pointerup',()=>look=null);canvas.addEventListener('pointercancel',()=>look=null);
addEventListener('resize',()=>{cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix();r.setSize(innerWidth,innerHeight)});
build();resetP();loop();
