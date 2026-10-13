//================================================================================
//                                DOCUMENTACION DE CODIGO
//================================================================================
// NOMBRE DEL ARCHIVO / MODULO : practica2.4.js
// PROYECTO                    : Practica 4 - Mundo
// AUTOR                       : Omar Alejandro Aguayo Sanchez, Rene Servin Cansino
// FECHA DE ELABORACION        : 05/10/2026
// TIEMPO DE DESARROLLO        : 5 horas
// VERSION                     : 2.0.7
//================================================================================
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import getStarfield from "./planetajs/getStarfield.js";
import { getFresnelMat } from "./planetajs/getFresnelMat.js";
import { getEarthMat } from "./planetajs/getEarthMat.js";
import getLayer from "./planetajs/getLayer.js";
// ============================================================
// PANEL DE INFORMACIÓN DE LA PRÁCTICA
// ============================================================
const panelInfo = document.createElement('div');
panelInfo.style.position = 'fixed';
panelInfo.style.bottom = '15px';
panelInfo.style.left = '15px';
panelInfo.style.padding = '10px 15px';
panelInfo.style.background = 'rgba(0, 0, 0, 0.75)';
panelInfo.style.color = '#ffffff';
panelInfo.style.fontFamily = 'monospace, sans-serif';
panelInfo.style.fontSize = '14px';
panelInfo.style.lineHeight = '1.4';
panelInfo.style.border = '1px solid #00ffff';
panelInfo.style.borderRadius = '6px';
panelInfo.style.zIndex = '1000';
panelInfo.style.userSelect = 'none';

panelInfo.innerHTML = `
    <strong>Práctica 4 - Mundo</strong><br>
`;
document.body.appendChild(panelInfo);

const w = window.innerWidth;
const h = window.innerHeight;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
camera.position.set(0.2, 0, 3);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(w, h);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

const sunDirection = new THREE.Vector3(-2, 0.5, 1.5);

const earthGroup = new THREE.Group();
earthGroup.rotation.z = (-23.4 * Math.PI) / 180;
scene.add(earthGroup);

const ctrls = new OrbitControls(camera, renderer.domElement);
ctrls.enableDamping = true;

const detail = 32;
const geometry = new THREE.IcosahedronGeometry(1, detail);

// Material con shaders de la Tierra
const material = getEarthMat(sunDirection);
const earthMesh = new THREE.Mesh(geometry, material);
earthGroup.add(earthMesh);

// Resplandor atmosférico (Fresnel)
const atmosphereMat = getFresnelMat();
const glowMesh = new THREE.Mesh(geometry, atmosphereMat);
glowMesh.scale.setScalar(1.02);
earthGroup.add(glowMesh);

// Fondo de estrellas
const stars = getStarfield({ numStars: 2000 });
scene.add(stars);

// Luz solar principal
const sunLight = new THREE.DirectionalLight(0xffffff, 4.0);
sunLight.position.copy(sunDirection);
scene.add(sunLight);

// Sol decorativo (ajustado en escala para evitar deformación por perspectiva)
const sunGeo = new THREE.SphereGeometry(0.3, 32, 32);
const sunMat = new THREE.MeshBasicMaterial({ color: 0xffffaa });
const sunMesh = new THREE.Mesh(sunGeo, sunMat);
sunMesh.position.copy(sunDirection).multiplyScalar(15);
scene.add(sunMesh);

// Gradiente espacial
const radGradUrl = new URL("./planeta/rad-grad.png", import.meta.url).href;
const nebula = getLayer({ path: radGradUrl });
scene.add(nebula);

function animate(t = 0) {
  requestAnimationFrame(animate);
  earthMesh.rotation.y += 0.002;
  glowMesh.rotation.y += 0.002;
  if (stars && stars.userData && stars.userData.update) {
    stars.userData.update(t);
  }
  renderer.render(scene, camera);
  ctrls.update();
}

animate();

function handleWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener("resize", handleWindowResize, false);