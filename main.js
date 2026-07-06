import * as THREE from 'three';
import { shows, venueConfig } from './media.js';

const canvas = document.getElementById('world');
const boot = document.getElementById('boot');
const enterButton = document.getElementById('enter-world');
const hint = document.getElementById('hint');
const dialogue = document.getElementById('dialogue');
const dialogueTitle = document.getElementById('dialogue-title');
const dialogueText = document.getElementById('dialogue-text');
const dialogueActions = document.getElementById('dialogue-actions');
const dialogueClose = document.getElementById('dialogue-close');
const fullscreenButton = document.getElementById('fullscreen');
const qualityButton = document.getElementById('quality');
const resetButton = document.getElementById('reset');
const playerModal = document.getElementById('player-modal');
const playerTitle = document.getElementById('player-title');
const playerMeta = document.getElementById('player-meta');
const playerStatus = document.getElementById('player-status');
const videoPlayer = document.getElementById('video-player');
const iframePlayer = document.getElementById('iframe-player');
const playerClose = document.getElementById('player-close');
const touchStick = document.getElementById('touch-stick');
const stickNub = touchStick.querySelector('span');
const touchAction = document.getElementById('touch-action');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x05030b);
scene.fog = new THREE.FogExp2(0x05030b, 0.018);

const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.08, 260);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.8));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const clock = new THREE.Clock();
const keys = new Set();
const interactables = [];
const colliders = [];
const animations = [];
const raycaster = new THREE.Raycaster();
const center = new THREE.Vector2(0, 0);
let highQuality = true;
let pointerLocked = false;
let currentHls = null;
let touchMove = { x: 0, y: 0 };
let lastLook = null;

const player = { position: new THREE.Vector3(0, 1.7, 62), yaw: Math.PI, pitch: 0, radius: 0.72, speed: 7 };

function canvasTexture(key, width, height, draw, repeat = [1, 1]) {
  const c = document.createElement('canvas');
  c.width = width;
  c.height = height;
  const ctx = c.getContext('2d');
  draw(ctx, width, height);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat[0], repeat[1]);
  tex.anisotropy = 8;
  tex.name = key;
  return tex;
}

function noise(ctx, w, h, amount = 1000, alpha = 0.08) {
  for (let i = 0; i < amount; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? `rgba(255,255,255,${Math.random() * alpha})` : `rgba(0,0,0,${Math.random() * alpha})`;
    ctx.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 3, 1 + Math.random() * 3);
  }
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  const start = y - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((lineText, i) => ctx.fillText(lineText, x, start + i * lineHeight));
}

function textTexture(key, width, height, options) {
  return canvasTexture(key, width, height, (ctx, w, h) => {
    ctx.fillStyle = options.bg || '#080812';
    ctx.fillRect(0, 0, w, h);
    if (options.gradient) {
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, options.gradient[0]);
      grad.addColorStop(1, options.gradient[1]);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    }
    ctx.strokeStyle = options.border || '#ffd36e';
    ctx.lineWidth = Math.max(6, w * 0.012);
    ctx.strokeRect(10, 10, w - 20, h - 20);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = options.glow || options.border || '#ffd36e';
    ctx.shadowBlur = options.shadow ?? 18;
    ctx.fillStyle = options.color || '#fff0c9';
    ctx.font = `900 ${options.titleSize || Math.floor(h * 0.26)}px Tahoma, Arial`;
    wrapText(ctx, options.title || '', w / 2, h * 0.38, w * 0.86, options.lineHeight || Math.floor(h * 0.25));
    ctx.shadowBlur = 8;
    ctx.fillStyle = options.subColor || '#ffd36e';
    ctx.font = `700 ${options.subSize || Math.floor(h * 0.12)}px Tahoma, Arial`;
    wrapText(ctx, options.subtitle || '', w / 2, h * 0.76, w * 0.86, options.subLineHeight || Math.floor(h * 0.13));
  });
}

const textures = {
  asphalt: canvasTexture('wet-asphalt', 512, 512, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#15151d');
    g.addColorStop(1, '#05070d');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 24) {
      ctx.strokeStyle = 'rgba(125,130,150,.14)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 24) ctx.lineTo(x, y + Math.sin(x * 0.04 + y * 0.05) * 6);
      ctx.stroke();
    }
    noise(ctx, w, h, 2000, 0.11);
  }, [12, 12]),
  brick: canvasTexture('theatre-brick', 512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#4a2222';
    ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 48) {
      for (let x = ((y / 48) % 2) * 50; x < w; x += 100) {
        ctx.fillStyle = `rgb(${85 + Math.random() * 45},${34 + Math.random() * 20},${32 + Math.random() * 18})`;
        ctx.fillRect(x + 3, y + 3, 94, 42);
      }
    }
    ctx.strokeStyle = 'rgba(15,8,8,.55)';
    ctx.lineWidth = 4;
    for (let y = 0; y < h; y += 48) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    noise(ctx, w, h, 1800, 0.08);
  }, [4, 4]),
  carpet: canvasTexture('purple-carpet', 512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#24113f';
    ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 34) {
      ctx.strokeStyle = 'rgba(255,79,216,.18)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 16) ctx.lineTo(x, y + Math.sin(x * 0.08) * 9);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(255,211,110,.22)';
    for (let x = 0; x < w; x += 64) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 40, h); ctx.stroke(); }
    noise(ctx, w, h, 1500, 0.06);
  }, [5, 9]),
  wood: canvasTexture('dark-wood', 512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#3a2216'; ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 18) {
      ctx.strokeStyle = `rgba(${110 + Math.random() * 50},${65 + Math.random() * 20},${35 + Math.random() * 14},.42)`;
      ctx.lineWidth = 3; ctx.beginPath();
      for (let x = 0; x <= w; x += 18) ctx.lineTo(x, y + Math.sin(x * 0.045 + y * 0.04) * 7);
      ctx.stroke();
    }
  }, [5, 2]),
  purplePanel: canvasTexture('purple-panel', 512, 512, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w * 0.45, h * 0.3, 20, w * 0.5, h * 0.5, w * 0.75);
    g.addColorStop(0, '#5d2ca5'); g.addColorStop(0.5, '#2d1650'); g.addColorStop(1, '#10061f');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); noise(ctx, w, h, 2000, 0.09);
  }, [2, 2])
};

const mat = {
  asphalt: new THREE.MeshStandardMaterial({ map: textures.asphalt, roughness: 0.96, metalness: 0.08 }),
  brick: new THREE.MeshStandardMaterial({ map: textures.brick, roughness: 0.88 }),
  carpet: new THREE.MeshStandardMaterial({ map: textures.carpet, roughness: 0.92 }),
  wood: new THREE.MeshStandardMaterial({ map: textures.wood, roughness: 0.78 }),
  purple: new THREE.MeshStandardMaterial({ map: textures.purplePanel, roughness: 0.72 }),
  black: new THREE.MeshStandardMaterial({ color: 0x050509, roughness: 0.7 }),
  gold: new THREE.MeshStandardMaterial({ color: 0xffc65a, roughness: 0.38, metalness: 0.24 }),
  metal: new THREE.MeshStandardMaterial({ color: 0x16151c, roughness: 0.42, metalness: 0.72 }),
  glass: new THREE.MeshStandardMaterial({ color: 0x101a28, roughness: 0.16, metalness: 0.05, transparent: true, opacity: 0.72 }),
  glowPink: new THREE.MeshBasicMaterial({ color: 0xff4fd8 }),
  glowGold: new THREE.MeshBasicMaterial({ color: 0xffd36e }),
  glowCyan: new THREE.MeshBasicMaterial({ color: 0x4deaff })
};

function box(w, h, d, material, x = 0, y = 0, z = 0) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; return mesh;
}
function plane(w, h, material, x = 0, y = 0, z = 0, ry = 0) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material);
  mesh.position.set(x, y, z); mesh.rotation.y = ry; return mesh;
}
function addCollider(x, z, w, d) { colliders.push({ minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2 }); }
function addInteractable(mesh, data) { mesh.userData.interactive = true; mesh.userData.data = data; interactables.push(mesh); }
function posterTexture(show) {
  const [a, b, c] = show.posterStyle || ['#2d1650', '#ffcb6b', '#4deaff'];
  return textTexture(`poster-${show.id}`, 900, 1300, { gradient: [a, '#07030d'], border: b, glow: c, title: show.band, subtitle: `${show.date} • ${show.time}\n${show.tagline}`, titleSize: 108, lineHeight: 106, subSize: 50, subLineHeight: 62, color: '#fff0c9', subColor: b });
}

function addLights() {
  scene.add(new THREE.HemisphereLight(0x9fbfff, 0x120812, 0.8));
  const moon = new THREE.DirectionalLight(0xaabaff, 1.0);
  moon.position.set(-24, 48, 55); moon.castShadow = true; moon.shadow.mapSize.set(1024, 1024);
  moon.shadow.camera.left = -80; moon.shadow.camera.right = 80; moon.shadow.camera.top = 80; moon.shadow.camera.bottom = -80; scene.add(moon);
  [[0xffb84d, 1.6, 0, 5.5, 15], [0xb14dff, 1.2, 18, 4, 25], [0x4deaff, 1.8, 0, 5.5, -51]].forEach(([c, i, x, y, z]) => { const l = new THREE.PointLight(c, i, 48, 1.6); l.position.set(x, y, z); scene.add(l); });
}

function addFloorAndShell() {
  const outside = new THREE.Mesh(new THREE.PlaneGeometry(110, 44), mat.asphalt); outside.rotation.x = -Math.PI / 2; outside.position.set(0, 0, 66); outside.receiveShadow = true; scene.add(outside);
  const interior = new THREE.Mesh(new THREE.PlaneGeometry(70, 116), mat.carpet); interior.rotation.x = -Math.PI / 2; interior.position.set(0, 0.03, 2); interior.receiveShadow = true; scene.add(interior);
  [[-35,4,2,1,8,116], [35,4,2,1,8,116], [0,4,-56,70,8,1], [-25,4,60,20,8,1], [25,4,60,20,8,1]].forEach(([x,y,z,w,h,d]) => scene.add(box(w,h,d,mat.brick,x,y,z)));
  addCollider(-35, 2, 1.5, 116); addCollider(35, 2, 1.5, 116); addCollider(0, -56, 70, 1.5); addCollider(-25, 60, 20, 1.5); addCollider(25, 60, 20, 1.5);
}

function addTheatreExterior() {
  scene.add(box(76, 18, 5, mat.brick, 0, 9, 61.5));
  scene.add(box(14, 6.2, 0.4, mat.glass, 0, 3.1, 58.7));
  const marqueeTex = textTexture('marquee-main', 1200, 360, { bg: '#160b12', border: '#ffd36e', glow: '#ff4fd8', title: venueConfig.marqueeTop, subtitle: venueConfig.marqueeBottom, titleSize: 92, subSize: 38, color: '#ffd36e', subColor: '#fff0c9', shadow: 24 });
  const marquee = plane(34, 10, new THREE.MeshBasicMaterial({ map: marqueeTex }), 0, 12.5, 58.25, 0); scene.add(marquee);
  addInteractable(marquee, { type: 'info', title: 'THE MARQUEE', text: 'This can pull from the schedule later: tonight’s band, stream status, ticket note, or LIVE NOW.' });
  const bulbPositions = [];
  for (let x = -18; x <= 18; x += 2) bulbPositions.push([x, 18, 58.0], [x, 7.0, 58.0]);
  for (let y = 8; y <= 17; y += 2) bulbPositions.push([-19, y, 58.0], [19, y, 58.0]);
  bulbPositions.forEach((p, i) => { const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 8), mat.glowGold.clone()); bulb.position.set(...p); scene.add(bulb); animations.push((dt, t) => bulb.material.color.setHSL(0.12, 1, 0.55 + Math.sin(t * 6 + i * 0.55) * 0.18)); });
  const ticketTex = textTexture('ticket-booth', 700, 500, { bg: '#090811', border: '#4deaff', glow: '#4deaff', title: 'TICKETS', subtitle: 'POSTERS INSIDE', titleSize: 86, subSize: 38, color: '#fff0c9', subColor: '#4deaff' });
  scene.add(plane(7, 5, new THREE.MeshBasicMaterial({ map: ticketTex }), -28, 4.2, 58.2));
}

function addPosterLobby() {
  const lobbyLabel = textTexture('lobby-label', 900, 240, { bg: '#0c0714', border: '#ff4fd8', glow: '#ff4fd8', title: 'POSTER LOBBY', subtitle: 'Click a band poster to load the screen', titleSize: 58, subSize: 28, color: '#fff0c9', subColor: '#ffd36e' });
  scene.add(plane(16, 4.2, new THREE.MeshBasicMaterial({ map: lobbyLabel }), 0, 6.2, 37.8));
  shows.forEach((show, i) => {
    const left = i % 2 === 0; const x = left ? -34.35 : 34.35; const z = 38 - Math.floor(i / 2) * 15;
    const poster = plane(5.4, 7.8, new THREE.MeshBasicMaterial({ map: posterTexture(show) }), x, 4.3, z, left ? Math.PI / 2 : -Math.PI / 2); scene.add(poster);
    const frame = box(0.25, 8.3, 6.0, mat.gold, left ? x + 0.08 : x - 0.08, 4.3, z); frame.rotation.y = left ? Math.PI / 2 : -Math.PI / 2; scene.add(frame);
    addInteractable(poster, { type: 'show', show, title: show.band, text: `${show.date} at ${show.time}. ${show.tagline}. ${show.tipLine}` });
  });
}

function addBarRoom() {
  scene.add(box(9, 3.4, 35, mat.wood, 25, 1.7, 12)); addCollider(25, 12, 9, 35);
  for (let z = -3; z <= 25; z += 7) { const stool = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.6, 16), mat.metal); stool.position.set(18.5, 0.35, z); stool.castShadow = true; scene.add(stool); addCollider(18.5, z, 1.4, 1.4); }
  [[-18,3.5,28,9,4], [0,3.5,28,9,4], [18,3.5,28,9,4]].forEach(([x,y,z,w,h], i) => { scene.add(box(w,h,0.18,mat.purple,x,y,z)); const l = new THREE.PointLight(i === 1 ? 0xff4fd8 : 0x4deaff, 0.7, 18, 1.6); l.position.set(x, y + 1, z - 1.2); scene.add(l); });
  const scheduleTex = textTexture('schedule-board', 900, 620, { bg: '#090812', border: '#ffd36e', glow: '#ffd36e', title: "TONIGHT'S SCHEDULE", subtitle: shows.slice(0, 4).map(s => `${s.time}  ${s.band}`).join('\n'), titleSize: 62, subSize: 34, subLineHeight: 48, color: '#ffd36e', subColor: '#fff0c9' });
  const schedule = plane(10, 7, new THREE.MeshBasicMaterial({ map: scheduleTex }), -20, 4.5, 27.55); scene.add(schedule); addInteractable(schedule, { type: 'info', title: "TONIGHT'S SCHEDULE", text: 'This schedule board is data-driven from media.js. Replace the show list and the room updates.' });
  const tipTex = textTexture('tip-artist', 800, 800, { bg: '#12081f', border: '#73ff8a', glow: '#73ff8a', title: 'TIP ARTIST', subtitle: 'QR / CASHAPP / VENMO\nplaceholder panel', titleSize: 74, subSize: 40, subLineHeight: 52, color: '#fff0c9', subColor: '#73ff8a' });
  const tip = plane(7.2, 7.2, new THREE.MeshBasicMaterial({ map: tipTex }), 34.42, 4.6, -8, -Math.PI / 2); scene.add(tip); addInteractable(tip, { type: 'info', title: 'TIP ARTIST PANEL', text: 'Drop the real CashApp/Venmo QR art into this panel later. It belongs near the bar and stream schedule.' });
}

function addTheatreRoom() {
  scene.add(box(42, 15, 2, mat.purple, 0, 7.5, -48));
  const screenTex = textTexture('screen-standby', 1200, 675, { bg: '#050609', border: '#4deaff', glow: '#4deaff', title: 'BMC SCREEN', subtitle: 'Click screen or poster to play video / live broadcast', titleSize: 92, subSize: 38, color: '#fff0c9', subColor: '#4deaff', shadow: 28 });
  const screen = plane(30, 16.875, new THREE.MeshBasicMaterial({ map: screenTex }), 0, 8.2, -49.15, 0); scene.add(screen); addInteractable(screen, { type: 'show', show: shows[1], title: 'THEATRE SCREEN', text: 'Main broadcast screen. Default is wired to the live broadcast placeholder in media.js.' });
  for (let row = 0; row < 4; row++) { const z = -22 + row * 6; for (let x = -18; x <= 18; x += 6) { const chair = new THREE.Group(); chair.add(box(3.2, 0.6, 2.2, mat.black, 0, 0.55, 0), box(3.2, 2.2, 0.45, mat.black, 0, 1.5, 0.95)); chair.position.set(x, 0, z); scene.add(chair); addCollider(x, z, 3.4, 2.4); } }
  const aisleGlow = new THREE.PointLight(0xff4fd8, 0.65, 22, 2); aisleGlow.position.set(0, 1.0, -16); scene.add(aisleGlow);
}

function addVenue() {
  addLights(); addFloorAndShell(); addTheatreExterior(); addPosterLobby(); addBarRoom(); addTheatreRoom();
  const exitTex = textTexture('exit-sign', 500, 180, { bg: '#0b1c12', border: '#73ff8a', glow: '#73ff8a', title: 'EXIT', subtitle: 'street', titleSize: 64, subSize: 24, color: '#73ff8a', subColor: '#fff0c9' });
  scene.add(plane(6, 2.2, new THREE.MeshBasicMaterial({ map: exitTex }), 0, 5.5, 59.1));
}

function showDialogue(data) {
  dialogueTitle.textContent = data.title || 'BMC Theatre'; dialogueText.textContent = data.text || ''; dialogueActions.innerHTML = '';
  if (data.type === 'show' && data.show) {
    const play = document.createElement('button'); play.className = 'button'; play.textContent = 'LOAD ON SCREEN'; play.addEventListener('click', () => { dialogue.classList.add('hidden'); openPlayer(data.show); }); dialogueActions.appendChild(play);
    const info = document.createElement('button'); info.className = 'button'; info.textContent = 'BAND INFO'; info.addEventListener('click', () => { dialogueText.textContent = `${data.show.band}: ${data.show.tagline}. ${data.show.date} at ${data.show.time}. ${data.show.tipLine}`; }); dialogueActions.appendChild(info);
  }
  dialogue.classList.remove('hidden');
}

function openPlayer(show) {
  if (currentHls) { currentHls.destroy(); currentHls = null; }
  videoPlayer.pause(); videoPlayer.removeAttribute('src'); videoPlayer.load(); videoPlayer.style.display = 'block'; iframePlayer.style.display = 'none'; iframePlayer.removeAttribute('src');
  playerTitle.textContent = show.band; playerMeta.textContent = `${show.date} • ${show.time} • ${show.videoType}`; playerStatus.textContent = '';
  if (show.videoType === 'iframe') { videoPlayer.style.display = 'none'; iframePlayer.style.display = 'block'; iframePlayer.src = show.videoSrc; playerStatus.textContent = 'Iframe mode. Replace videoSrc in media.js with the real embeddable player URL.'; }
  else if (show.videoType === 'live-hls') {
    if (videoPlayer.canPlayType('application/vnd.apple.mpegurl')) { videoPlayer.src = show.videoSrc; playerStatus.textContent = 'Native HLS live-stream mode.'; }
    else if (window.Hls && window.Hls.isSupported()) { currentHls = new window.Hls(); currentHls.loadSource(show.videoSrc); currentHls.attachMedia(videoPlayer); playerStatus.textContent = 'HLS.js live-stream mode. Replace the example URL with the real broadcast .m3u8.'; }
    else playerStatus.textContent = 'This browser needs an HLS-compatible player. The UI is wired; use a supported stream or iframe embed.';
  } else { videoPlayer.src = show.videoSrc; playerStatus.textContent = 'Static video mode. Put an MP4 at this path or change videoSrc in media.js.'; }
  videoPlayer.onerror = () => { playerStatus.textContent = `Could not load ${show.videoSrc}. This is expected until you add the real MP4/live URL in media.js.`; };
  playerModal.classList.remove('hidden');
}
function closePlayer() { if (currentHls) { currentHls.destroy(); currentHls = null; } videoPlayer.pause(); videoPlayer.removeAttribute('src'); videoPlayer.load(); iframePlayer.removeAttribute('src'); playerModal.classList.add('hidden'); }

function updateCamera() { camera.position.copy(player.position); camera.rotation.order = 'YXZ'; camera.rotation.y = player.yaw; camera.rotation.x = player.pitch; }
function wouldCollide(x, z) { if (Math.abs(x) > 50 || z > 76 || z < -58) return true; return colliders.some(c => x + player.radius > c.minX && x - player.radius < c.maxX && z + player.radius > c.minZ && z - player.radius < c.maxZ); }
function movePlayer(dt) {
  const forward = (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0) - (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0) + touchMove.y;
  const strafe = (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) - (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0) + touchMove.x;
  if (!forward && !strafe) return;
  const sin = Math.sin(player.yaw), cos = Math.cos(player.yaw);
  const delta = new THREE.Vector3(sin * forward + cos * strafe, 0, cos * forward - sin * strafe);
  if (delta.lengthSq() > 1) delta.normalize();
  delta.multiplyScalar(player.speed * (keys.has('ShiftLeft') || keys.has('ShiftRight') ? 1.65 : 1) * dt);
  const nx = player.position.x + delta.x, nz = player.position.z + delta.z;
  if (!wouldCollide(nx, player.position.z)) player.position.x = nx;
  if (!wouldCollide(player.position.x, nz)) player.position.z = nz;
}
function findTarget() { raycaster.setFromCamera(center, camera); return raycaster.intersectObjects(interactables, false).find(hit => hit.distance < 8); }
function interact() { const hit = findTarget(); hit?.object?.userData?.data ? showDialogue(hit.object.userData.data) : showDialogue({ title: 'Nothing Selected', text: 'Look directly at a band poster, schedule board, tip panel, marquee, or theatre screen, then click or press E.' }); }
function updateHint() { const hit = findTarget(); hint.textContent = hit?.object?.userData?.data ? `E / click: ${hit.object.userData.data.title}` : 'WASD move • Mouse look • E / click interact • Shift sprint • Esc release'; }
function animate() { requestAnimationFrame(animate); const dt = Math.min(clock.getDelta(), 0.05); movePlayer(dt); updateCamera(); animations.forEach(fn => fn(dt, clock.elapsedTime)); updateHint(); renderer.render(scene, camera); }
function resetPlayer() { player.position.set(0, 1.7, 62); player.yaw = Math.PI; player.pitch = 0; updateCamera(); }

document.addEventListener('pointerlockchange', () => { pointerLocked = document.pointerLockElement === canvas; });
document.addEventListener('mousemove', event => { if (!pointerLocked) return; player.yaw -= event.movementX * 0.0022; player.pitch = THREE.MathUtils.clamp(player.pitch - event.movementY * 0.0022, -1.25, 1.25); });
document.addEventListener('keydown', event => { keys.add(event.code); if (event.code === 'KeyE') interact(); if (event.code === 'Escape') { dialogue.classList.add('hidden'); if (!playerModal.classList.contains('hidden')) closePlayer(); } });
document.addEventListener('keyup', event => keys.delete(event.code));
canvas.addEventListener('click', () => { if (!boot.classList.contains('hidden') && !pointerLocked) return; interact(); });
enterButton.addEventListener('click', () => { boot.classList.add('hidden'); canvas.focus(); if (!matchMedia('(pointer: coarse)').matches) canvas.requestPointerLock?.(); });
dialogueClose.addEventListener('click', () => dialogue.classList.add('hidden'));
playerClose.addEventListener('click', closePlayer);
fullscreenButton.addEventListener('click', async () => { if (!document.fullscreenElement) await document.documentElement.requestFullscreen?.(); else await document.exitFullscreen?.(); });
qualityButton.addEventListener('click', () => { highQuality = !highQuality; renderer.setPixelRatio(highQuality ? Math.min(devicePixelRatio, 1.8) : 1); renderer.shadowMap.enabled = highQuality; qualityButton.textContent = highQuality ? 'Quality: High' : 'Quality: Low'; });
resetButton.addEventListener('click', resetPlayer);
function updateStick(event) { const rect = touchStick.getBoundingClientRect(); const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2; const dx = Math.max(-42, Math.min(42, event.clientX - cx)); const dy = Math.max(-42, Math.min(42, event.clientY - cy)); stickNub.style.transform = `translate(${dx}px, ${dy}px)`; touchMove.x = dx / 42; touchMove.y = -dy / 42; }
function clearStick() { touchMove = { x: 0, y: 0 }; stickNub.style.transform = 'translate(0, 0)'; }
touchStick.addEventListener('pointerdown', event => { touchStick.setPointerCapture(event.pointerId); updateStick(event); });
touchStick.addEventListener('pointermove', updateStick); touchStick.addEventListener('pointerup', clearStick); touchStick.addEventListener('pointercancel', clearStick); touchAction.addEventListener('click', interact);
canvas.addEventListener('pointerdown', event => { if (!matchMedia('(pointer: coarse)').matches) return; lastLook = { x: event.clientX, y: event.clientY }; });
canvas.addEventListener('pointermove', event => { if (!lastLook || !matchMedia('(pointer: coarse)').matches) return; const dx = event.clientX - lastLook.x, dy = event.clientY - lastLook.y; lastLook = { x: event.clientX, y: event.clientY }; player.yaw -= dx * 0.005; player.pitch = THREE.MathUtils.clamp(player.pitch - dy * 0.005, -1.25, 1.25); });
canvas.addEventListener('pointerup', () => { lastLook = null; }); canvas.addEventListener('pointercancel', () => { lastLook = null; });
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });

addVenue(); resetPlayer(); animate();
