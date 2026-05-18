import './src/styles/global.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Globe from './src/scenes/Globe.js';
import KenyaMap from './src/scenes/KenyaMap.js';
import CountySidebar from './src/components/CountySidebar.js';
import CountyCard from './src/components/CountyCard.js';
import FinalScene from './src/scenes/FinalScene.js';
import { Howl } from 'howler';

gsap.registerPlugin(ScrollTrigger);

class Experience {
  constructor() {
    this.canvas = document.querySelector('#experience-canvas');
    this.scene = new THREE.Scene();
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.pixelRatio = Math.min(window.devicePixelRatio, 2);

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.setupCamera();
    this.setupRenderer();
    this.setupLights();
    
    // Data placeholders
    this.culturalData = null;
    this.culturalManifest = null;
    this.activeCounty = null;
    this.visitedCounties = new Set();
    this.audioInstances = {};

    // Initialize Components
    this.sidebar = new CountySidebar();
    this.countyCard = new CountyCard();
    this.finalScene = new FinalScene(this.scene, this.camera);
    
    // Initialize Scenes
    this.globe = new Globe(this.scene, this.camera);
    this.kenyaMap = new KenyaMap(this.scene, this.camera);

    this.loadData();
    this.addResizeListener();
    this.addInteractions();
    this.setupScrollAnimation();
    this.tick();

    this.showIntroText();

    console.log('Kenya 47 3D Experience Initialized');
  }

  async loadData() {
    const [dataRes, manifestRes] = await Promise.all([
      fetch('/data/counties-cultural-data.json'),
      fetch('/data/cultural-manifest.json')
    ]);
    this.culturalData = await dataRes.json();
    this.culturalManifest = await manifestRes.json();
    this.setupAudio();
  }

  setupAudio() {
    // Predefine regional motifs
    const regions = ['Coast', 'Western', 'Rift Valley', 'Nairobi', 'Northern', 'Highlands'];
    regions.forEach(region => {
      const slug = region.toLowerCase().replace(' ', '-');
      this.audioInstances[region] = new Howl({
        src: [`/assets/audio/motifs/${slug}.mp3`],
        volume: 0.5,
        loop: true
      });
    });
  }

  addInteractions() {
    window.addEventListener('mousemove', (event) => {
      this.mouse.x = (event.clientX / this.width) * 2 - 1;
      this.mouse.y = -(event.clientY / this.height) * 2 + 1;

      if (!this.kenyaMap.group.visible || this.activeCounty) return;

      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.kenyaMap.group.children, true);

      if (intersects.length > 0) {
        let object = intersects[0].object;
        while (object && !object.userData.isCounty && object.parent !== this.kenyaMap.group) {
          object = object.parent;
        }
        const feature = this.kenyaMap.features.find(f => f.group === object || f.mesh === intersects[0].object);
        if (feature) {
          this.kenyaMap.features.forEach(f => {
            if (f === feature) {
              f.mesh.material.emissive.setHex(0x554400); // Hover glow
            } else if (!this.visitedCounties.has(f.data.id)) {
              f.mesh.material.emissive.setHex(0x000000);
            }
          });
          document.body.style.cursor = 'pointer';
        }
      } else {
        this.kenyaMap.features.forEach(f => {
          if (!this.visitedCounties.has(f.data.id)) {
            f.mesh.material.emissive.setHex(0x000000);
          } else {
            f.mesh.material.emissive.setHex(0x332200);
          }
        });
        document.body.style.cursor = 'default';
      }
    });

    window.addEventListener('click', (event) => {
      if (!this.kenyaMap.group.visible) return;

      this.mouse.x = (event.clientX / this.width) * 2 - 1;
      this.mouse.y = -(event.clientY / this.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.kenyaMap.group.children, true);

      if (intersects.length > 0) {
        // Find the county group by traversing up
        let object = intersects[0].object;
        while (object && !object.userData.isCounty && object.parent !== this.kenyaMap.group) {
          object = object.parent;
        }
        
        // Find matching feature in kenyaMap
        const feature = this.kenyaMap.features.find(f => f.group === object || f.mesh === intersects[0].object);
        if (feature) {
          this.selectCounty(feature.data.id);
        }
      }
    });

    window.addEventListener('county-selected', (event) => {
      this.selectCounty(event.detail.id);
    });

    window.addEventListener('county-card-closed', () => {
      this.activeCounty = null;
      this.stopAllAudio();
      this.resetCamera();
    });
  }

  selectCounty(id) {
    if (this.activeCounty === id) return;
    this.activeCounty = id;
    this.visitedCounties.add(id);

    const county = this.culturalData.counties.find(c => c.id === id);
    if (!county) return;

    // Highlight on map
    this.kenyaMap.highlightCounty(id, this.visitedCounties);

    // Zoom camera
    const centroid = this.kenyaMap.getCountyCentroid(id);
    if (centroid) {
      gsap.to(this.camera.position, {
        x: centroid.x,
        y: centroid.y,
        z: 0.4,
        duration: 1.5,
        ease: 'power2.inOut'
      });
    }

    // Play Audio
    this.playRegionAudio(county.region);

    // Show Card
    this.countyCard.show(county, this.culturalManifest);

    if (this.visitedCounties.size >= 47) {
      this.showFinishButton();
    }
  }

  showFinishButton() {
    if (document.getElementById('finish-journey-btn')) return;
    
    const btn = document.createElement('button');
    btn.id = 'finish-journey-btn';
    btn.className = 'ui-btn';
    btn.innerText = 'Celebrate Unified Kenya';
    btn.style.position = 'fixed';
    btn.style.bottom = '40px';
    btn.style.left = '50%';
    btn.style.transform = 'translateX(-50%)';
    btn.style.zIndex = '300';
    btn.style.pointerEvents = 'auto';
    
    document.querySelector('#ui-overlay').appendChild(btn);
    
    btn.addEventListener('click', () => {
      btn.remove();
      this.triggerFinalSequence();
    });

    gsap.fromTo(btn, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 1 });
  }

  async triggerFinalSequence() {
    this.activeCounty = null;
    this.countyCard.hide();
    document.querySelector('#county-sidebar').classList.remove('visible');

    // 1. FINAL ZOOM OUT & Map Light Up
    const tl = gsap.timeline();

    // Pull camera back to show full map
    tl.to(this.camera.position, {
      x: 0,
      y: 0,
      z: 1.5,
      duration: 3,
      ease: 'power3.inOut'
    });

    // Light up all counties & Show labels
    tl.call(() => {
      this.kenyaMap.lightUpAll();
      this.finalScene.createParticleBurst(0);
      this.finalScene.createParticleBurst(0.5); // Second burst
      this.finalScene.createParticleBurst(1);   // Third burst
    }, null, 1);

    // 2. GLOBAL CONTEXT - Seamless zoom out to Globe
    tl.to(this.kenyaMap.group.scale, {
      x: 0.05, y: 0.05, z: 0.05,
      duration: 4,
      ease: 'power2.inOut'
    }, 4);

    tl.call(() => {
      this.globe.group.visible = true;
      this.globe.group.scale.set(0.1, 0.1, 0.1);
      this.globe.showGoldenJewel();
    }, null, 4.5);

    tl.to(this.globe.group.scale, {
      x: 1, y: 1, z: 1,
      duration: 4,
      ease: 'power2.inOut'
    }, 4.5);

    tl.to(this.globe.earth.material, {
      opacity: 1,
      duration: 2
    }, 5);

    tl.to(this.globe.atmosphere.material.uniforms.uOpacity, {
      value: 1,
      duration: 2
    }, 5);

    tl.to(this.globe.stars.material.uniforms.uOpacity, {
      value: 1,
      duration: 2
    }, 5);

    tl.to(this.camera.position, {
      z: 5,
      x: 0,
      y: 0,
      duration: 5,
      ease: 'power2.inOut'
    }, 4);

    // 3. FINAL TYPOGRAPHY & UI
    tl.call(() => {
      this.finalScene.show();
    }, null, 8);

    // 4. AUDIO SWELL
    this.playAudioSwell();
  }

  playAudioSwell() {
    this.stopAllAudio();
    const swell = new Howl({
      src: ['/assets/audio/final-swell.mp3'],
      volume: 0.8
    });
    swell.play();
  }

  playRegionAudio(region) {
    this.stopAllAudio();
    if (this.audioInstances[region]) {
      this.audioInstances[region].play();
      this.audioInstances[region].fade(0, 0.5, 1000);
    }
  }

  stopAllAudio() {
    Object.values(this.audioInstances).forEach(howl => {
      if (howl.playing()) {
        howl.fade(0.5, 0, 1000);
        setTimeout(() => howl.stop(), 1000);
      }
    });
  }

  resetCamera() {
    gsap.to(this.camera.position, {
      x: 0.2,
      y: 0.02,
      z: 0.5,
      duration: 1.5,
      ease: 'power2.inOut'
    });
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

    tl.to(this.globe.atmosphere.material.uniforms.uOpacity, {
      value: 0,
      duration: 1
    }, 1);

    tl.to(this.globe.stars.material.uniforms.uOpacity, {
      value: 0,
      duration: 1
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
