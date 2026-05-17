import './src/styles/global.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Globe from './src/scenes/Globe.js';
import KenyaMap from './src/scenes/KenyaMap.js';
import CountySidebar from './src/components/CountySidebar.js';

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
    
    // Initialize Components
    this.sidebar = new CountySidebar();
    
    // Initialize Scenes
    this.globe = new Globe(this.scene, this.camera);
    this.kenyaMap = new KenyaMap(this.scene, this.camera);

    this.addResizeListener();
    this.setupScrollAnimation();
    this.tick();

    this.showIntroText();

    console.log('Kenya 47 3D Experience Initialized');
  }

  setupScrollAnimation() {
    // Scene 1: Africa Zoom
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: 'body',
        start: 'top top',
        end: '+=200%',
        scrub: 1,
        pin: true
      }
    });

    // Initial globe rotation to face Kenya
    tl.to(this.globe.group.rotation, {
      y: -Math.PI * 0.4, // Adjust to face Kenya
      x: 0,
      duration: 1
    });

    // Zoom into Africa/Kenya
    tl.to(this.camera.position, {
      z: 0.5,
      y: 0.02,
      x: 0.2,
      duration: 2
    }, 0);

    // Fade out intro text
    tl.to('.intro-title', {
      opacity: 0,
      duration: 0.5
    }, 0);

    // Fade out globe and atmosphere
    tl.to(this.globe.group.scale, {
      x: 0.1,
      y: 0.1,
      z: 0.1,
      duration: 1
    }, 1);

    tl.to(this.globe.earth.material, {
      opacity: 0,
      duration: 1,
      transparent: true
    }, 1);

    tl.to(this.globe.atmosphere.material, {
      opacity: 0,
      duration: 1,
      transparent: true
    }, 1);

    tl.call(() => {
      this.globe.group.visible = false;
    }, null, 2);

    // Show Kenya Map
    tl.call(() => {
      this.kenyaMap.show();
    }, null, 1.5);

    tl.fromTo(this.kenyaMap.group.scale, {
      x: 0,
      y: 0,
      z: 0
    }, {
      x: 1,
      y: 1,
      z: 1,
      duration: 1
    }, 1.5);

    // Show Sidebar in Scene 2
    tl.call(() => {
      document.querySelector('#county-sidebar').classList.add('visible');
    }, null, 2);
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
