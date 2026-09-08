import * as THREE from 'three';
import { waveHeight } from './utils.js';

export function createWorld(scene) {
  scene.background = new THREE.Color(0x0d2b3d);
  scene.fog = new THREE.Fog(0x0d2b3d, 400, 3200);

  scene.add(new THREE.HemisphereLight(0xbfe8ff, 0x081820, 1.0));
  const sun = new THREE.DirectionalLight(0xffd9a8, 1.6);
  sun.position.set(300, 420, 180);
  scene.add(sun);

  const geo = new THREE.PlaneGeometry(8000, 8000, 96, 96);
  geo.rotateX(-Math.PI / 2);
  const mat = new THREE.MeshStandardMaterial({ color: 0x0e4258, roughness: 0.32, metalness: 0.15 });

  new THREE.TextureLoader().load('assets/images/ocean_tile.png', (tex) => {
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(90, 90);
    tex.colorSpace = THREE.SRGBColorSpace;
    mat.map = tex;
    mat.needsUpdate = true;
  }, undefined, () => {});

  const ocean = new THREE.Mesh(geo, mat);
  scene.add(ocean);
  const base = geo.attributes.position.array.slice();

  function update(t) {
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      pos.array[i * 3 + 1] = waveHeight(base[i * 3], base[i * 3 + 2], t);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
  }
  return { ocean, update };
}