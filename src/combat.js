import * as THREE from 'three';
import { waveHeight, rand } from './utils.js';

const G = 21.0;

export class Combat {
  constructor(scene) {
    this.scene = scene;
    this.shells = [];
    this.missiles = [];
    this.parts = [];
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d');
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,1)');
    gr.addColorStop(0.4, 'rgba(255,255,255,0.6)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    this.tex = new THREE.CanvasTexture(c);
  }
  shell(from, to, speed, dmg, team) {
    const dir = to.clone().sub(from);
    const t = dir.length() / speed;
    dir.normalize();
    const vel = dir.multiplyScalar(speed);
    vel.y += 0.5 * G * t;
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 6, 6),
      new THREE.MeshBasicMaterial({ color: team === 'player' ? 0x9fefff : 0xff8f6a })
    );
    m.position.copy(from);
    this.scene.add(m);
    this.shells.push({ m, vel, dmg, team, life: 14 });
  }
  missile(from, target, dmg, team) {
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.6, 4),
      new THREE.MeshBasicMaterial({ color: 0xdff6ff })
    );
    m.position.copy(from); m.position.y += 3;
    this.scene.add(m);
    this.missiles.push({ m, target, vel: new THREE.Vector3(0, 12, 0), speed: 70, dmg, team, life: 12 });
  }
  sprite(color, size) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({
      map: this.tex, color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
    }));
    s.scale.setScalar(size);
    this.scene.add(s);
    return s;
  }
  explode(pos, power, color) {
    const flash = this.sprite(color, 6 * power);
    this.parts.push({ s: flash, vel: new THREE.Vector3(), life: 0.25, max: 0.25, grow: 26 * power });
    const n = Math.floor(10 * power);
    for (let i = 0; i < n; i++) {
      const p = this.sprite(i % 3 === 0 ? 0x2c343c : color, rand(1.5, 3.5) * power * 0.6);
      p.position.copy(pos);
      this.parts.push({
        s: p,
        vel: new THREE.Vector3(rand(-14, 14), rand(4, 22), rand(-14, 14)).multiplyScalar(power * 0.5),
        life: rand(0.5, 1.2), max: 1.2, grow: 4
      });
    }
  }
  splash(pos) {
    const p = this.sprite(0xbfefff, 5);
    p.position.copy(pos);
    this.parts.push({ s: p, vel: new THREE.Vector3(0, 8, 0), life: 0.5, max: 0.5, grow: 10 });
  }
  update(dt, ships, onHit) {
    for (let i = this.shells.length - 1; i >= 0; i--) {
      const s = this.shells[i];
      s.vel.y -= G * dt;
      s.m.position.addScaledVector(s.vel, dt);
      s.life -= dt;
      let dead = s.life <= 0;
      if (!dead) {
        for (const ship of ships) {
          if (!ship.alive || ship.team === s.team) continue;
          if (s.m.position.y < ship.cfg.freeboard + 8 && s.m.position.distanceTo(ship.pos) < ship.cfg.length * 0.35) {
            onHit(ship, s.dmg, s.team, s.m.position);
            dead = true; break;
          }
        }
      }
      if (!dead && s.m.position.y <= waveHeight(s.m.position.x, s.m.position.z, 0)) {
        this.splash(s.m.position); dead = true;
      }
      if (dead) { this.scene.remove(s.m); this.shells.splice(i, 1); }
    }
    for (let i = this.missiles.length - 1; i >= 0; i--) {
      const m = this.missiles[i];
      m.life -= dt;
      let dead = m.life <= 0 || !m.target.alive;
      if (!dead) {
        const desired = m.target.pos.clone().add(new THREE.Vector3(0, 4, 0)).sub(m.m.position).normalize().multiplyScalar(m.speed);
        m.vel.lerp(desired, Math.min(1, dt * 2.5));
        m.m.position.addScaledVector(m.vel, dt);
        m.m.lookAt(m.m.position.clone().add(m.vel));
        if (Math.random() < 0.6) {
          const t = this.sprite(0x9fb6c4, 1.6);
          t.position.copy(m.m.position);
          this.parts.push({ s: t, vel: new THREE.Vector3(), life: 0.7, max: 0.7, grow: 3 });
        }
        if (m.m.position.distanceTo(m.target.pos) < 14) {
          onHit(m.target, m.dmg, m.team, m.m.position);
          dead = true;
        }
      }
      if (dead) { this.scene.remove(m.m); this.missiles.splice(i, 1); }
    }
    for (let i = this.parts.length - 1; i >= 0; i--) {
      const p = this.parts[i];
      p.life -= dt;
      p.s.position.addScaledVector(p.vel, dt);
      p.vel.y -= 9 * dt * 0.3;
      p.s.scale.setScalar(p.s.scale.x + p.grow * dt);
      p.s.material.opacity = Math.max(0, p.life / p.max);
      if (p.life <= 0) { this.scene.remove(p.s); p.s.material.dispose(); this.parts.splice(i, 1); }
    }
  }
}