import * as THREE from 'three';
import { createWorld } from './world.js';
import { Ship, PLAYER_CFG, ENEMY_CFG } from './ships.js';
import { Combat } from './combat.js';
import { HUD } from './hud.js';
import { clamp, angDiff, rand } from './utils.js';

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(2, devicePixelRatio));
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.5, 6000);
const world = createWorld(scene);
const combat = new Combat(scene);
const hud = new HUD();

const player = new Ship(PLAYER_CFG, 'player');
player.pos.set(0, 0, 0);
scene.add(player.group);

const enemies = [];
for (let i = 0; i < 3; i++) {
  const e = new Ship(ENEMY_CFG, 'enemy');
  const a = rand(0, Math.PI * 2);
  e.pos.set(Math.sin(a) * rand(500, 900), 0, Math.cos(a) * rand(500, 900));
  scene.add(e.group);
  enemies.push(e);
}

const keys = {};
let mouseDown = false, mouseNDC = new THREE.Vector2(), mouseWorld = new THREE.Vector3(0, 0, 400);
let lock = null, lockIdx = -1, missileCd = 0, shake = 0, score = 0, ended = false;
const ray = new THREE.Raycaster();
const seaPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

addEventListener('keydown', (e) => {
  keys[e.code] = true;
  if (e.code === 'Space' || e.code === 'Tab') e.preventDefault();
  if (e.code === 'Tab') cycleLock();
});
addEventListener('keyup', (e) => { keys[e.code] = false; });
addEventListener('mousemove', (e) => {
  mouseNDC.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
});
addEventListener('mousedown', () => { mouseDown = true; });
addEventListener('mouseup', () => { mouseDown = false; });
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
document.getElementById('ov-btn').addEventListener('click', () => location.reload());

function cycleLock() {
  const alive = enemies.filter((e) => e.alive);
  if (!alive.length) { lock = null; return; }
  lockIdx = (lockIdx + 1) % alive.length;
  lock = alive[lockIdx];
}
function turretWorld(ship) {
  const v = new THREE.Vector3();
  ship.turret.getWorldPosition(v);
  v.y += 1.6;
  return v;
}
function end(win) {
  ended = true;
  const ov = document.getElementById('overlay');
  ov.classList.remove('hidden');
  document.getElementById('ov-title').textContent = win ? 'MISSION COMPLETE' : 'SHIP LOST';
  document.getElementById('ov-sub').textContent = 'SCORE ' + score;
}
function onHit(ship, dmg, team, at) {
  if (ship.team === team) return;
  ship.damage(dmg);
  combat.explode(at.clone(), 1.1, 0xffaa55);
  shake = Math.max(shake, 0.5);
  if (!ship.alive) {
    combat.explode(ship.pos.clone().setY(5), 3.2, 0xff7733);
    scene.remove(ship.group);
    if (ship.team === 'enemy') { score += 100; if (lock === ship) lock = null; }
  }
}

const clock = new THREE.Clock();
function loop() {
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, clock.getDelta());
  const t = clock.elapsedTime;
  world.update(t);

  if (!ended) {
    ray.setFromCamera(mouseNDC, camera);
    ray.ray.intersectPlane(seaPlane, mouseWorld);

    const throttle = (keys['KeyW'] ? 1 : 0) + (keys['KeyS'] ? -0.5 : 0);
    const rudder = (keys['KeyD'] ? 1 : 0) + (keys['KeyA'] ? -1 : 0);
    player.move(dt, throttle, rudder);

    const aim = (lock && lock.alive) ? lock.pos.clone() : mouseWorld.clone();
    const wyaw = Math.atan2(aim.x - player.pos.x, aim.z - player.pos.z);
    const ty = clamp(angDiff(wyaw, player.heading), -1.25, 1.25);
    player.turret.rotation.y = ty;

    player.fireCd -= dt; missileCd -= dt;
    if ((mouseDown || keys['Space']) && player.fireCd <= 0 && Math.abs(ty) < 1.2) {
      combat.shell(turretWorld(player), aim.clone().setY(3), 230, 26, 'player');
      player.fireCd = 0.35; shake = Math.max(shake, 0.3);
    }
    if (keys['KeyF'] && missileCd <= 0 && lock && lock.alive) {
      combat.missile(turretWorld(player), lock, 95, 'player');
      missileCd = 4;
    }

    for (const e of enemies) {
      if (!e.alive) continue;
      const d = e.pos.distanceTo(player.pos);
      let desired = Math.atan2(player.pos.x - e.pos.x, player.pos.z - e.pos.z);
      if (d < 260) desired += e.side * 1.9;
      e.steerTo(desired, 0.5, dt);
      e.move(dt, d > 340 ? 0.9 : 0.5, 0);
      const pyaw = Math.atan2(player.pos.x - e.pos.x, player.pos.z - e.pos.z);
      e.turret.rotation.y = clamp(angDiff(pyaw, e.heading), -1.25, 1.25);
      e.fireCd -= dt;
      if (e.fireCd <= 0 && d < 700 && Math.abs(e.turret.rotation.y) < 0.5) {
        const lead = player.pos.clone().addScaledVector(player.forward(), player.speed * (d / 180));
        combat.shell(turretWorld(e), lead.setY(3), 180, 16, 'enemy');
        e.fireCd = 2.4 + Math.random() * 1.6;
      }
    }

    combat.update(dt, [player, ...enemies], onHit);
    player.bob(t);
    for (const e of enemies) if (e.alive) e.bob(t);

    if (!player.alive) end(false);
    else if (enemies.every((e) => !e.alive)) end(true);
  }

  const fwd = player.forward();
  const want = player.pos.clone().addScaledVector(fwd, -70).add(new THREE.Vector3(0, 26, 0));
  camera.position.lerp(want, 1 - Math.pow(0.001, dt));
  if (shake > 0) {
    camera.position.x += rand(-shake, shake);
    camera.position.y += rand(-shake, shake);
    shake *= 0.88;
  }
  camera.lookAt(player.pos.clone().addScaledVector(fwd, 45).add(new THREE.Vector3(0, 7, 0)));

  hud.update({
    knots: player.speed * 1.94384,
    heading: ((THREE.MathUtils.radToDeg(player.heading) % 360) + 360) % 360,
    score,
    hpPct: player.hp / player.maxHp,
    target: lock && lock.alive ? ('LOCK ' + lock.cfg.name + ' ' + Math.round(lock.pos.distanceTo(player.pos)) + 'm') : 'NO CONTACT',
    msg: ended ? '' : (enemies.filter((e) => e.alive).length + ' HOSTILE CONTACTS')
  });
  hud.minimap(player, enemies);
  renderer.render(scene, camera);
}
loop();