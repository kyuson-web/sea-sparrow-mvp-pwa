export class HUD {
  constructor() {
    const id = (x) => document.getElementById(x);
    this.speed = id('hud-speed'); this.hdg = id('hud-hdg');
    this.score = id('hud-score'); this.hp = id('hud-hp');
    this.target = id('hud-target'); this.msg = id('hud-msg');
    this.map = id('minimap').getContext('2d');
  }
  update(d) {
    this.speed.textContent = Math.round(d.knots);
    this.hdg.textContent = String(Math.round(d.heading)).padStart(3, '0');
    this.score.textContent = d.score;
    this.hp.style.width = Math.max(0, d.hpPct * 100) + '%';
    this.hp.style.background = d.hpPct > 0.4 ? '#38d57f' : '#ff5e5e';
    this.target.textContent = d.target;
    this.msg.textContent = d.msg;
  }
  minimap(player, enemies) {
    const c = this.map, S = 170, k = 1 / 12;
    c.clearRect(0, 0, S, S);
    c.strokeStyle = 'rgba(120,220,255,0.25)';
    c.beginPath(); c.arc(S / 2, S / 2, S / 2 - 4, 0, 7); c.stroke();
    for (const e of enemies) {
      if (!e.alive) continue;
      const dx = (e.pos.x - player.pos.x) * k, dz = (e.pos.z - player.pos.z) * k;
      if (Math.hypot(dx, dz) > S / 2 - 6) continue;
      c.fillStyle = '#ff5e5e';
      c.fillRect(S / 2 + dx - 2, S / 2 + dz - 2, 4, 4);
    }
    c.save();
    c.translate(S / 2, S / 2); c.rotate(-player.heading);
    c.fillStyle = '#8fefff';
    c.beginPath(); c.moveTo(0, -6); c.lineTo(4, 5); c.lineTo(-4, 5); c.closePath(); c.fill();
    c.restore();
  }
}