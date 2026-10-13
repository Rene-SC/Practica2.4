import * as THREE from "three";

const loader = new THREE.TextureLoader();
const defaultSunDirection = new THREE.Vector3(-2, 0.5, 1.5).normalize();

function getEarthMat(sunDirection = defaultSunDirection) {
  // Rutas resueltas por Parcel hacia tu carpeta src/planeta/
  const dayMapUrl = new URL("../planeta/earth-daymap-4k.jpg", import.meta.url).href;
  const nightMapUrl = new URL("../planeta/earth-nightmap-4k.jpg", import.meta.url).href;
  const cloudsMapUrl = new URL("../planeta/earth-clouds-map-4k.jpg", import.meta.url).href;
  const specularMapUrl = new URL("../planeta/earth-specular-4k.jpg", import.meta.url).href;

  const uniforms = {
    dayTexture: { value: loader.load(dayMapUrl) },
    nightTexture: { value: loader.load(nightMapUrl) },
    cloudsTexture: { value: loader.load(cloudsMapUrl) },
    specularTexture: { value: loader.load(specularMapUrl) },
    sunDirection: { value: sunDirection },
  };

  const vs = `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;

    void main() {
      vec4 modelPosition = modelMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * viewMatrix * modelPosition;

      vec3 modelNormal = (modelMatrix * vec4(normal, 0.0)).xyz;

      vUv = uv;
      vNormal = modelNormal;
      vPosition = modelPosition.xyz;
    }
  `;

  const fs = `
    uniform sampler2D dayTexture;
    uniform sampler2D nightTexture;
    uniform sampler2D cloudsTexture;
    uniform sampler2D specularTexture;
    uniform vec3 sunDirection;

    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;

    void main() {
      vec3 viewDirection = normalize(vPosition - cameraPosition);
      vec3 normal = normalize(vNormal);
      vec3 sunDir = normalize(sunDirection); // Clave: normaliza para evitar que queme la imagen

      // 1. Orientación solar y mezcla Día / Noche
      float sunOrientation = dot(sunDir, normal);
      float dayMix = smoothstep(-0.25, 0.5, sunOrientation);

      vec3 dayColor = texture2D(dayTexture, vUv).rgb;
      vec3 nightColor = texture2D(nightTexture, vUv).rgb;
      vec3 color = mix(nightColor, dayColor, dayMix);

      // 2. Capa de nubes
      float cloudIntensity = texture2D(cloudsTexture, vUv).r;
      float cloudsMix = clamp(cloudIntensity * dayMix, 0.0, 1.0);
      color = mix(color, vec3(1.0), cloudsMix);

      // 3. Brillo especular del agua (solo en océanos y atenuado por las nubes)
      vec3 reflection = reflect(-sunDir, normal);
      float specular = max(-dot(reflection, viewDirection), 0.0);
      specular = pow(specular, 28.0); // Brillo nítido y acotado

      float oceanSpecularMask = texture2D(specularTexture, vUv).r;
      specular *= oceanSpecularMask * (1.0 - cloudIntensity * 0.8); // El agua brilla, las nubes la tapan
      
      color += vec3(specular * 0.6) * dayMix;

      gl_FragColor = vec4(color, 1.0);
    }
  `;

  const material = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: vs,
    fragmentShader: fs,
  });

  return material;
}

export { getEarthMat };