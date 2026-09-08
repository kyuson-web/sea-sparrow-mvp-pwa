import * as THREE from 'three';
import { clamp, angDiff, waveHeight } from './utils.js';

export const PLAYER_CFG = { name:'SS-07 Sea Sparrow', length:62, beam:13, freeboard:6, draft:3, hp:320, maxSpeed:26, turnRate:0.55, hull:0x66737c, super:0x7d8a92 };
export const ENEMY_CFG  = { name:'Meridian Corvette', length:70, beam:15, freeboard:7, draft:3.5, hp:260, maxSpeed:20, turnRate:0.40, hull:0x463436, super:0x5d4446 };

export function buildGreybox(cfg) {
  const g = new THREE.Group();
  const hullM = new THREE.MeshStandardMaterial({ color: cfg.hull, roughness: 0.65, metalness: 0.25 });
  const supM  = new THREE.MeshStandardMaterial({ color: cfg.super, roughness: 0.60, metalness: 0.20 });
  const darkM = new THREE.MeshStandardMaterial({ color: 0x20262c, roughness: 0.80, metalness: 0.30 });

  const bodyH = cfg.freeboard + cfg.draft;
  const hull = new THREE.Mesh(new THREE.BoxGeometry(cfg.beam, bodyH, cfg.length * 0.72), hullM);
  hull.position.y = (cfg.freeboard - cfg.draft) / 2;
  g.add(hull);

  const bow = new THREE.Mesh(new THREE.ConeGeometry(cfg.beam * 0.5, cfg.length * 0.28, 4), hullM);
  bow.rotation.x = Math.PI / 2; bow.rotation.y = Math.PI / 4;
  bow.position.set(0, (cfg.freeboard - cfg.draft) / 2, cfg.length * 0.5);
  g.add(bow);

  const bridge = new THREE.Mesh(new THREE.BoxGeometry(cfg.beam * 0.55, cfg.freeboard * 0.9, cfg.length * 0.16), supM);
  bridge.position.set(0, cfg.freeboard + cfg.freeboard * 0.45, -cfg.length * 0.05);
  g.add(bridge);

  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.7, cfg.freeboard * 1.6, 6), darkM);
  mast.position.set(0, cfg.freeboard + cfg.freeboard * 1.5, -cfg.length * 0.08);
  g.add(mast);

  const turret = new THREE.Group();
  turret.position.set(0, cfg.freeboard, cfg.length * 0.30);
  turret.add(new THREE.Mesh(new THREE.CylinderGeometry(cfg.beam * 0.16, cfg.beam * 0.20, 2.2, 8), supM));
  const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, cfg.length * 0.16), darkM);
  barrel.position.set(0, 1.4, cfg.length * 0.08);
  turret.add(barrel);
  g.add(turret);

  return { group: g, turret, barrel };
}

export class Ship {
  constructor(cfg, team) {
    this.cfg = cfg; this.team = team;
    this.pos = new THREE.Vector3();
    this.heading = 0; this.speed = 0;
    this.hp = cfg.hp; this.maxHp = cfg.hp; this.alive = true;
    this.fireCd = 0; this.side = Math.random() < 0.5 ? 1 : -1;
    const b = buildGreybox(cfg);
    this.group = b.group; this.turret = b.turret; this.barrel = b.barrel;
  }
  forward() { return new THREE.Vector3(Math.sin(this.heading), 0, Math.cos(this.heading)); }
  steerTo(target, rate, dt) { this.heading += clamp(angDiff(target, this.heading) * 2, -1, 1) * rate * dt; }
  move(dt, throttle, rudder) {
    const max = this.cfg.maxSpeed;
    this.speed += (throttle * max - this.speed) * Math.min(1, dt * 0.6);
    const eff = 0.35 + 0.65 * clamp(Math.abs(this.speed) / max, 0, 1);
    this.heading += rudder * this.cfg.turnRate * eff * dt * (this.speed < 0 ? -1 : 1);
    this.pos.addScaledVector(this.forward(), this.speed * dt);
  }
  bob(t) {
    const h = waveHeight(this.pos.x, this.pos.z, t);
    this.group.position.set(this.pos.x, h, this.pos.z);
    this.group.rotation.y = this.heading;
    const f = this.forward();
    const h2 = waveHeight(this.pos.x + f.x * 12, this.pos.z + f.z * 12, t);
    this.group.rotation.x = clamp((h2 - h) * 0.02, -0.12, 0.12);
  }
  damage(d) { this.hp -= d; if (this.hp <= 0) { this.hp = 0; this.alive = false; } }
}