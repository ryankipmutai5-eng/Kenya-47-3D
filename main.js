import './src/styles/global.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Globe from './src/scenes/Globe.js';

gsap.registerPlugin(ScrollTrigger);

class Experience {
  constructor() {
    this.canvas = document.querySelector('#experience-canvas');
    this.scene = new THREE.Scene();
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.pixelRatio = Math.min(window.devicePixelRatio, 2);

    this.setupCamera();
    this.setupRenderer();
    this.setupLights();
    
    // Initialize Globe Scene
    this.globe = new Globe(this.scene, this.camera);

    this.addResizeListener();
    this.tick();

    this.showIntroText();

    console.log('Kenya 47 3D Experience Initialized');
  }

  showIntroText() {
    const overlay = document.querySelector('#ui-overlay');
    const introText = document.createElement('div');
    introText.id = 'intro-text';
    introText.innerHTML = '<h1 class="intro-title">A Journey Through Kenya</h1>';
    overlay.appendChild(introText);

    gsap.fromTo('.intro-title', 
      { opacity: 0, y: 20 }, 
      { opacity: 1, y: 0, duration: 2, delay: 1, ease: 'power2.out' }
    );
  }

  setupCamera() {
    this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 0.1, 1000);
    this.camera.position.z = 5;
    this.scene.add(this.camera);
  }

  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(this.pixelRatio);
    this.renderer.setClearColor(0x020408, 1);
  }

  setupLights() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1);
    sunLight.position.set(5, 5, 5);
    this.scene.add(sunLight);
  }

  addResizeListener() {
    window.addEventListener('resize', () => {
      this.width = window.innerWidth;
      this.height = window.innerHeight;

      this.camera.aspect = this.width / this.height;
      this.camera.updateProjectionMatrix();

      this.renderer.setSize(this.width, this.height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });
  }

  tick() {
    this.renderer.render(this.scene, this.camera);
    window.requestAnimationFrame(() => this.tick());
  }
}

new Experience();
// Boilerplate initialized
