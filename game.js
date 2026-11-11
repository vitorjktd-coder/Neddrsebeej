import * as THREE from 'three';

const $ = (id) => document.getElementById(id);
const canvas = $('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.18;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x101c25);
scene.fog = new THREE.FogExp2(0x101c25, 0.0085);
const camera = new THREE.PerspectiveCamera(67, window.innerWidth / window.innerHeight, 0.08, 700);
camera.position.set(0, 1.35, 0);
scene.add(camera);

const mat = (color, roughness = 1, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness, ...extra });
const dirtMat = mat(0x554b3d);
const shoulderMat = mat(0x302d28);
const trackEdgeMat = mat(0x95836a);
const rutMat = mat(0x38352f);
const barkMat = mat(0x211c19);
const pineMats = [mat(0x172b2b), mat(0x1b3433), mat(0x263936), mat(0x20302d)];
const roadWidth = 12;
const stageLength = 2400;
const trackCenter = (d) => 11 * Math.sin(d * 0.00155) + 6.5 * Math.sin(d * 0.0040 + 1.1) + 3.2 * Math.sin(d * 0.0081 + 2.5);
const rand = (seed) => { let x = Math.sin(seed * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

// A subtly grainy dirt surface, generated locally so the stage has no external asset dependency.
const dirtCanvas = document.createElement('canvas'); dirtCanvas.width = 256; dirtCanvas.height = 256;
const ctx = dirtCanvas.getContext('2d');
ctx.fillStyle = '#655747'; ctx.fillRect(0, 0, 256, 256);
for (let i = 0; i < 4200; i++) { const x = rand(i + 11) * 256, y = rand(i + 112) * 256; const a = 0.04 + rand(i + 300) * .17; ctx.fillStyle = rand(i + 800) > .5 ? `rgba(218,190,144,${a})` : `rgba(15,13,12,${a})`; ctx.fillRect(x, y, 1 + rand(i + 2) * 3, 1 + rand(i + 4) * 2); }
const dirtTexture = new THREE.CanvasTexture(dirtCanvas); dirtTexture.wrapS = dirtTexture.wrapT = THREE.RepeatWrapping; dirtTexture.repeat.set(2, 160); dirtTexture.colorSpace = THREE.SRGBColorSpace; dirtMat.map = dirtTexture; dirtMat.color.set(0xc0ad8e);

scene.add(new THREE.HemisphereLight(0x91a3ae, 0x161310, 0.43));
const moonLight = new THREE.DirectionalLight(0xa6c0d0, 0.66); moonLight.position.set(-35, 70, 30); scene.add(moonLight);
const moon = new THREE.Mesh(new THREE.SphereGeometry(5, 16, 12), new THREE.MeshBasicMaterial({ color: 0xc3d0ca })); moon.position.set(-62, 58, -210); scene.add(moon);
const moonHalo = new THREE.Mesh(new THREE.SphereGeometry(7.5, 16, 12), new THREE.MeshBasicMaterial({ color: 0x50687a, transparent: true, opacity: .14 })); moonHalo.position.copy(moon.position); scene.add(moonHalo);
const starGeo = new THREE.BufferGeometry(), starPos = [];
for (let i = 0; i < 280; i++) starPos.push((rand(i + 43) - .5) * 700, 16 + rand(i + 991) * 130, -40 - rand(i + 88) * 450);
starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xc1c9c4, size: .7, transparent: true, opacity: .62 })); scene.add(stars);

// Geometry follows a continuous road centerline through the entire special stage.
function stripGeometry(start, end, width, segments, offset = 0) {
  const positions = [], uvs = [], indices = [];
  for (let i = 0; i <= segments; i++) {
    const d = start + (end - start) * i / segments, c = trackCenter(d) + offset, z = -d;
    positions.push(c - width / 2, .015, z, c + width / 2, .015, z);
    uvs.push(0, i / segments * 90, 1, i / segments * 90);
    if (i < segments) { const a = i * 2; indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); geo.setIndex(indices); geo.computeVertexNormals(); return geo;
}
const road = new THREE.Mesh(stripGeometry(0, 2700, roadWidth, 1080), dirtMat); road.receiveShadow = true; scene.add(road);
const leftShoulder = new THREE.Mesh(stripGeometry(0, 2700, 4, 1080, -8), shoulderMat); scene.add(leftShoulder);
const rightShoulder = new THREE.Mesh(stripGeometry(0, 2700, 4, 1080, 8), shoulderMat); scene.add(rightShoulder);
for (const side of [-1, 1]) {
  const edge = new THREE.Mesh(stripGeometry(0, 2700, .13, 1080, side * (roadWidth / 2 - .18)), trackEdgeMat); scene.add(edge);
  const rut = new THREE.Mesh(stripGeometry(0, 2700, .19, 1080, side * 1.75), rutMat); scene.add(rut);
}
// Dark earth plane and pine forest, instanced for a dense but light-weight scene.
const ground = new THREE.Mesh(new THREE.PlaneGeometry(1200, 3600), mat(0x111b1b)); ground.rotation.x = -Math.PI / 2; ground.position.set(0, -.16, -1320); scene.add(ground);
const trunkGeo = new THREE.CylinderGeometry(.1, .2, 2.7, 5);
const crownGeos = [new THREE.ConeGeometry(1.05, 2.5, 6), new THREE.ConeGeometry(.79, 2.1, 6), new THREE.ConeGeometry(.53, 1.7, 6)];
const trunkInstances = new THREE.InstancedMesh(trunkGeo, barkMat, 620);
const crownInstances = pineMats.map((m, j) => new THREE.InstancedMesh(crownGeos[j % 3], m, 620));
const dummy = new THREE.Object3D(); let treeCount = 0;
for (let d = 10; d < 2700; d += 8.5) {
  for (const side of [-1, 1]) {
    const variation = rand(d * 2 + side * 3) * 7;
    const x = trackCenter(d) + side * (11 + variation), z = -d;
    const scale = .68 + rand(d + side * 19) * 1.05;
    dummy.position.set(x, 1.25 * scale, z); dummy.scale.setScalar(scale); dummy.rotation.y = rand(d + side * 101) * Math.PI; dummy.updateMatrix(); trunkInstances.setMatrixAt(treeCount, dummy.matrix);
    for (let j = 0; j < crownInstances.length; j++) { dummy.position.set(x, (2.35 + j * 1.0) * scale, z); dummy.scale.setScalar(scale); dummy.rotation.y = rand(d + j * 77) * Math.PI; dummy.updateMatrix(); crownInstances[j].setMatrixAt(treeCount, dummy.matrix); }
    treeCount++;
  }
}
trunkInstances.count = treeCount; trunkInstances.instanceMatrix.needsUpdate = true; scene.add(trunkInstances);
for (const inst of crownInstances) { inst.count = treeCount; inst.instanceMatrix.needsUpdate = true; scene.add(inst); }

// Occasional reflective red/white route boards along the verges.
const signMat = mat(0xb9a98b, .7, { emissive: 0x292116 });
const signRed = mat(0xb84f37, .7, { emissive: 0x3c1009 });
for (let d = 42; d < 2650; d += 72) {
  const side = rand(d + 4) > .5 ? 1 : -1;
  const pole = new THREE.Mesh(new THREE.BoxGeometry(.09, 1.2, .09), barkMat); pole.position.set(trackCenter(d) + side * 8.2, .6, -d); scene.add(pole);
  const board = new THREE.Mesh(new THREE.BoxGeometry(.62, .34, .1), signMat); board.position.set(trackCenter(d) + side * 8.2, 1.05, -d); scene.add(board);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(.19, .34, .12), signRed); stripe.position.set(trackCenter(d) + side * 8.2, 1.05, -d - .01); scene.add(stripe);
}

// A low-poly cockpit lives on the camera: hood, instrument binnacle, and the old three-spoke wheel.
const cockpit = new THREE.Group(); camera.add(cockpit);
const cockpitDark = mat(0x171b1b, .72), cockpitEdge = mat(0x49504a, .48, { metalness: .48 }), hoodMat = mat(0x263c40, .65, { metalness: .2 });
const hood = new THREE.Mesh(new THREE.BoxGeometry(2.42, .16, 1.45), hoodMat); hood.position.set(0, -.96, -2.55); cockpit.add(hood);
const hoodRidge = new THREE.Mesh(new THREE.BoxGeometry(.055, .025, 1.2), mat(0x526265, .55)); hoodRidge.position.set(0, -.865, -2.56); cockpit.add(hoodRidge);
const dash = new THREE.Mesh(new THREE.BoxGeometry(2.0, .34, .36), cockpitDark); dash.position.set(0, -.71, -1.32); cockpit.add(dash);
const dashTrim = new THREE.Mesh(new THREE.BoxGeometry(2.02, .035, .37), cockpitEdge); dashTrim.position.set(0, -.52, -1.32); cockpit.add(dashTrim);
const wheel = new THREE.Group(); wheel.position.set(-.05, -.68, -1.06); wheel.rotation.x = -.18; cockpit.add(wheel);
const wheelRing = new THREE.Mesh(new THREE.TorusGeometry(.38, .038, 8, 24), cockpitEdge); wheel.add(wheelRing);
const wheelHub = new THREE.Mesh(new THREE.CylinderGeometry(.105, .105, .08, 12), cockpitDark); wheelHub.rotation.x = Math.PI / 2; wheel.add(wheelHub);
for (let i = 0; i < 3; i++) { const a = i * Math.PI * 2 / 3 + Math.PI / 2; const spoke = new THREE.Mesh(new THREE.BoxGeometry(.035, .34, .04), cockpitEdge); spoke.position.set(Math.sin(a) * .17, Math.cos(a) * .17, 0); spoke.rotation.z = -a; wheel.add(spoke); }
function dial(x, radius, lit = 0x90ad9b) {
  const face = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, .055, 24), mat(0x0b1214, .4, { emissive: 0x101d1c })); face.rotation.x = Math.PI / 2; face.position.set(x, -.69, -1.49); cockpit.add(face);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(radius, .025, 7, 24), cockpitEdge); rim.position.set(x, -.69, -1.445); cockpit.add(rim);
  const needle = new THREE.Mesh(new THREE.BoxGeometry(.014, radius * .72, .012), new THREE.MeshBasicMaterial({ color: lit })); needle.position.set(x, -.69 + radius * .25, -1.435); needle.rotation.z = -.7; cockpit.add(needle); return needle;
}
const speedNeedle = dial(-.52, .22, 0xe7a15f), rpmNeedle = dial(-.08, .15, 0xd98055);
// Two local headlamps cast long, warm beams down the gravel.
for (const x of [-.54, .54]) {
  const lamp = new THREE.SpotLight(0xffe6bd, 145, 105, Math.PI / 5.2, .55, 1.35); lamp.position.set(x, -.12, -.18); lamp.target.position.set(x * 1.5, -1.0, -58); camera.add(lamp); camera.add(lamp.target);
  const glow = new THREE.PointLight(0xffd9a1, 1.8, 8); glow.position.set(x, -.08, -.4); camera.add(glow);
}

// Rivals are simple 90s hatchback silhouettes. Their progress is independent from the player's.
function makeRival(color, number) {
  const car = new THREE.Group();
  const bodyMat = mat(color, .6, { metalness: .12 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.72, .52, 3.1), bodyMat); body.position.y = .53; car.add(body);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.2, .55, 1.5), mat(0x202c30, .35, { metalness: .3 })); roof.position.set(0, .99, -.08); car.add(roof);
  const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.04, .35, .045), mat(0x52636a, .25, { metalness: .35 })); windshield.position.set(0, 1.03, -.86); windshield.rotation.x = -.22; car.add(windshield);
  for (const x of [-.87, .87]) for (const z of [-.94, .94]) { const tire = new THREE.Mesh(new THREE.CylinderGeometry(.29, .29, .16, 9), mat(0x101112)); tire.rotation.z = Math.PI / 2; tire.position.set(x, .32, z); car.add(tire); }
  for (const x of [-.57, .57]) { const h = new THREE.Mesh(new THREE.BoxGeometry(.28, .14, .04), new THREE.MeshBasicMaterial({ color: 0xffd9a0 })); h.position.set(x, .58, -1.57); car.add(h); const tail = new THREE.Mesh(new THREE.BoxGeometry(.22, .13, .04), new THREE.MeshBasicMaterial({ color: 0xa92e23 })); tail.position.set(x, .58, 1.57); car.add(tail); }
  const plate = new THREE.Mesh(new THREE.BoxGeometry(.38, .17, .03), mat(0xd1c8a9)); plate.position.set(0, .57, 1.58); car.add(plate);
  car.userData.number = number; return car;
}
const rivalData = [
  { name: 'M. KANKKUNEN', distance: 255, speed: 105, lane: -2.0, color: 0xc44730 },
  { name: 'T. MAKINEN', distance: 470, speed: 111, lane: 2.0, color: 0xd2c7a6 },
  { name: 'C. SAINZ', distance: 720, speed: 99, lane: -1.2, color: 0x296373 },
  { name: 'YOU', distance: 0, speed: 0, lane: 0, color: 0x567276 },
  { name: 'F. DELECOUR', distance: 1040, speed: 112, lane: 2.0, color: 0xc2a446 },
  { name: 'P. LIATTI', distance: 1350, speed: 100, lane: -1.9, color: 0x6a483d },
  { name: 'B. THIRY', distance: 1710, speed: 108, lane: 1.3, color: 0x626963 },
  { name: 'A. AURIOL', distance: 1980, speed: 103, lane: -2.2, color: 0x47568a }
];
const rivalCars = [];
for (let i = 0; i < rivalData.length; i++) { if (i === 3) { rivalCars[i] = null; continue; } const car = makeRival(rivalData[i].color, i); scene.add(car); rivalCars[i] = car; }

const rpmBars = $('rpmBars'); for (let i = 0; i < 12; i++) { const b = document.createElement('i'); if (i > 9) b.classList.add('red'); rpmBars.appendChild(b); }
let state = 'menu', speed = 0, playerDistance = 0, lane = 0, steerVelocity = 0, elapsed = 0, condition = 100, countdown = 0, lastTime = performance.now(), shakeTime = 0, toastTimer = 0, lastOvertake = -1;
const keys = new Set();
function timeString(seconds) { const mins = Math.floor(seconds / 60), secs = seconds % 60; return `${String(mins).padStart(2, '0')}:${secs.toFixed(2).padStart(5, '0')}`; }
function showToast(text) { const t = $('toast'); t.textContent = text; t.classList.add('show'); toastTimer = 1.8; }
function beginStage() { state = 'countdown'; countdown = 3.5; speed = 0; playerDistance = 0; lane = 0; steerVelocity = 0; elapsed = 0; condition = 100; rivalData.forEach((r, i) => { if (i !== 3) r.distance = [255, 470, 720, 0, 1040, 1350, 1710, 1980][i]; }); $('overlay').classList.add('hidden'); $('result').classList.add('hidden'); $('bottomHint').style.opacity = '1'; }
$('startButton').addEventListener('click', beginStage); $('restartButton').addEventListener('click', beginStage);
window.addEventListener('keydown', (e) => { const k = e.key.toLowerCase(); if (['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k)) e.preventDefault(); keys.add(k); if ((k === 'enter' || k === ' ') && state === 'menu') beginStage(); if (k === 'escape' && state === 'racing') state = 'paused'; else if (k === 'escape' && state === 'paused') state = 'racing'; });
window.addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
window.addEventListener('blur', () => keys.clear());
// Touch control areas for phones/tablets.
let touchSteer = 0; canvas.addEventListener('touchstart', (e) => { if (e.touches[0]) touchSteer = (e.touches[0].clientX / window.innerWidth - .5) * 2; }, { passive: true });
canvas.addEventListener('touchmove', (e) => { if (e.touches[0]) touchSteer = (e.touches[0].clientX / window.innerWidth - .5) * 2; }, { passive: true });
canvas.addEventListener('touchend', () => { touchSteer = 0; }, { passive: true });

function update(dt) {
  if (state === 'countdown') {
    countdown -= dt;
    if (countdown <= 0) { state = 'racing'; showToast('GO!'); }
    else if (Math.ceil(countdown) !== Math.ceil(countdown + dt)) showToast(String(Math.ceil(countdown)));
  }
  if (state === 'racing') {
    elapsed += dt;
    const accelerate = keys.has('w') || keys.has('arrowup'), brake = keys.has('s') || keys.has('arrowdown'), handbrake = keys.has(' ');
    const steer = (keys.has('a') || keys.has('arrowleft') ? -1 : 0) + (keys.has('d') || keys.has('arrowright') ? 1 : 0) + touchSteer;
    if (accelerate) speed += 49 * dt; else speed -= (handbrake ? 75 : 12) * dt;
    if (brake) speed -= 76 * dt;
    speed = THREE.MathUtils.clamp(speed, 0, condition < 25 ? 105 : 175);
    const speedFactor = .25 + speed / 90;
    steerVelocity += steer * (handbrake ? 16 : 9.5) * speedFactor * dt;
    steerVelocity *= Math.exp(-(handbrake ? 1.8 : 3.8) * dt);
    lane += steerVelocity * dt;
    const roadEdge = roadWidth / 2 - .8;
    if (Math.abs(lane) > roadEdge) { speed = Math.max(0, speed - 48 * dt); condition = Math.max(0, condition - 3.3 * dt); lane = THREE.MathUtils.clamp(lane, -roadWidth, roadWidth); if (Math.random() < dt * 1.3) { $('flash').style.opacity = '.09'; setTimeout(() => $('flash').style.opacity = '0', 55); } }
    if (Math.abs(lane) > roadEdge + 1.5) { condition = Math.max(0, condition - 8 * dt); shakeTime = .16; }
    playerDistance += speed / 3.6 * dt;
    rivalData.forEach((r, i) => { if (i !== 3) r.distance += r.speed / 3.6 * dt; });
    const pass = rivalData.findIndex((r, i) => i !== 3 && lastOvertake !== i && r.distance < playerDistance && r.distance > playerDistance - 2.5);
    if (pass >= 0) { lastOvertake = pass; showToast('CLEAN PASS  +1'); setTimeout(() => { if (lastOvertake === pass) lastOvertake = -1; }, 700); }
    if (playerDistance >= stageLength) { playerDistance = stageLength; state = 'finished'; $('finalTime').textContent = timeString(elapsed); const rank = rivalData.filter((r, i) => i !== 3 && r.distance > playerDistance).length + 1; $('resultTitle').innerHTML = rank <= 3 ? 'PODIUM<br><i>FINISH</i>' : 'STAGE<br><i>FINISHED</i>'; $('resultCopy').textContent = `You finished ${rank}${rank === 1 ? 'st' : rank === 2 ? 'nd' : rank === 3 ? 'rd' : 'th'} overall. ${condition > 70 ? 'A clean run through the pines.' : 'The gravel took its toll.'}`; $('result').classList.remove('hidden'); }
  }
  if (state === 'paused') return;
  const center = trackCenter(playerDistance);
  camera.position.set(center + lane * .48, 1.35, -playerDistance);
  camera.rotation.set(0, 0, 0);
  // Look-ahead contributes a subtle lean into the corners.
  const curve = trackCenter(playerDistance + 24) - trackCenter(playerDistance - 24);
  camera.rotation.y = THREE.MathUtils.clamp(-curve * .0035 - steerVelocity * .012, -.105, .105);
  wheel.rotation.z = THREE.MathUtils.damp(wheel.rotation.z, -steerVelocity * .055, 5, dt);
  rivalData.forEach((r, i) => { const car = rivalCars[i]; if (!car) return; const d = r.distance; car.position.set(trackCenter(d) + r.lane, 0, -d); car.rotation.y = -(trackCenter(d + 3) - trackCenter(d - 3)) * .07; });
  const kmh = Math.round(speed), rpm = Math.min(1, speed / 175);
  $('speed').textContent = String(kmh).padStart(3, '0'); $('gear').textContent = speed < 2 ? '1' : String(Math.min(5, Math.max(1, Math.ceil(speed / 35))));
  $('timer').textContent = timeString(elapsed); $('distance').textContent = `${Math.max(0, Math.ceil(stageLength - playerDistance)).toLocaleString()} M TO FINISH`;
  $('progressFill').style.width = `${playerDistance / stageLength * 100}%`;
  const rank = rivalData.filter((r, i) => i !== 3 && r.distance > playerDistance).length + 1; $('position').innerHTML = `${String(rank).padStart(2, '0')}<span>/ 08</span>`;
  $('damage').querySelector('i').style.width = `${condition}%`; $('damage').querySelector('b').textContent = `${Math.round(condition)}%`;
  const bars = rpmBars.children; const activeBars = Math.round(rpm * bars.length); for (let i = 0; i < bars.length; i++) bars[i].classList.toggle('on', i < activeBars);
  $('rpmText').textContent = speed < 3 ? 'IDLE' : rpm > .9 ? 'REDLINE' : `${Math.round(900 + rpm * 6100)} RPM`;
  speedNeedle.rotation.z = -.7 + rpm * 2.5; rpmNeedle.rotation.z = -.7 + rpm * 2.5;
  $('leftNote').style.opacity = playerDistance > 2310 ? '.35' : '1';
  if (toastTimer > 0) { toastTimer -= dt; if (toastTimer <= 0) $('toast').classList.remove('show'); }
  if (shakeTime > 0) { shakeTime -= dt; $('game').classList.add('shake'); } else $('game').classList.remove('shake');
  const starAttribute = stars.geometry.attributes.position; stars.position.x = center * .12; stars.position.z = -playerDistance * .04;
}
function frame(now) { requestAnimationFrame(frame); const dt = Math.min(.04, Math.max(0, (now - lastTime) / 1000)); lastTime = now; update(dt); renderer.render(scene, camera); }
requestAnimationFrame(frame);
window.addEventListener('resize', () => { renderer.setSize(window.innerWidth, window.innerHeight); camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); });
