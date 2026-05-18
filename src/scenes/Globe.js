import * as THREE from 'three';
import gsap from 'gsap';
import { atmosphereVertexShader, atmosphereFragmentShader } from '../shaders/atmosphere.glsl';
import { starsVertexShader, starsFragmentShader } from '../shaders/stars.glsl';

export default class Globe {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.init();
  }

  init() {
    this.createStars();
    this.createEarth();
    this.createAtmosphere();
    this.animate();
  }

  createEarth() {
    // Placeholder 8K texture URL
    const textureLoader = new THREE.TextureLoader();
    const earthTexture = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg');
    
    const geometry = new THREE.SphereGeometry(2, 64, 64);
    const material = new THREE.MeshStandardMaterial({
      map: earthTexture,
      roughness: 0.5,
      metalness: 0.1
    });
    
    this.earth = new THREE.Mesh(geometry, material);
    this.group.add(this.earth);

    this.createKenyaHighlight();
  }

  createKenyaHighlight() {
    // Approx coordinates for Kenya on the globe
    // Lat: 0.0236, Lon: 37.9062
    const lat = 0.0236 * (Math.PI / 180);
    const lon = 37.9062 * (Math.PI / 180);
    const radius = 2.01;

    const x = radius * Math.cos(lat) * Math.sin(lon + Math.PI / 2);
    const y = radius * Math.sin(lat);
    const z = radius * Math.cos(lat) * Math.cos(lon + Math.PI / 2);

    const geometry = new THREE.CircleGeometry(0.1, 32);
    const material = new THREE.MeshBasicMaterial({
      color: 0xF5A623,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    });

    this.kenyaHighlight = new THREE.Mesh(geometry, material);
    this.kenyaHighlight.position.set(x, y, z);
    this.kenyaHighlight.lookAt(0, 0, 0);
    this.earth.add(this.kenyaHighlight);

    // Pulsing effect
    gsap.to(this.kenyaHighlight.scale, {
      x: 1.5,
      y: 1.5,
      duration: 1,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut'
    });
  }

  createAtmosphere() {
    const geometry = new THREE.SphereGeometry(2.1, 64, 64);
    const material = new THREE.ShaderMaterial({
      vertexShader: atmosphereVertexShader,
      fragmentShader: atmosphereFragmentShader,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true
    });

    this.atmosphere = new THREE.Mesh(geometry, material);
    this.group.add(this.atmosphere);
  }

  createStars() {
    const starsCount = 15000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starsCount * 3);
    const colors = new Float32Array(starsCount * 3);
    const sizes = new Float32Array(starsCount);

    for (let i = 0; i < starsCount; i++) {
      const x = (Math.random() - 0.5) * 1000;
      const y = (Math.random() - 0.5) * 1000;
      const z = (Math.random() - 0.5) * 1000;
      
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      const color = new THREE.Color();
      color.setHSL(Math.random(), 0.2, 0.8);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      sizes[i] = Math.random() * 2;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.ShaderMaterial({
      vertexShader: starsVertexShader,
      fragmentShader: starsFragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      vertexColors: true
    });

    this.stars = new THREE.Points(geometry, material);
    this.scene.add(this.stars);
  }

  animate() {
    gsap.to(this.earth.rotation, {
      y: Math.PI * 2,
      duration: 60,
      repeat: -1,
      ease: 'none'
    });

    // Subtle camera drift
    gsap.to(this.camera.position, {
      z: 4.5,
      duration: 10,
      yoyo: true,
      repeat: -1,
      ease: 'power1.inOut'
    });
  }

  update() {
    // Rotation handled by GSAP, but could add frame-based logic here
  }
}
