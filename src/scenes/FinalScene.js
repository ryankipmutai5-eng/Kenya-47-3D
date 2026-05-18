import * as THREE from 'three';
import gsap from 'gsap';

export default class FinalScene {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.uiContainer = document.querySelector('#ui-overlay');
  }

  async show() {
    // 1. Particle Burst
    this.createParticleBurst();

    // 2. Final Typography
    this.createFinalTypography();
    
    // 3. Replay and Share Buttons
    this.createUIButtons();
  }

  createParticleBurst(delay = 0) {
    const particleCount = 1500; // Increased count
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    const colorChoices = [
      new THREE.Color(0xFFD700), // Gold
      new THREE.Color(0xFFFFFF), // White
      new THREE.Color(0xFF0000), // Red
      new THREE.Color(0x006600)  // Green
    ];

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0.5;

      const color = colorChoices[Math.floor(Math.random() * colorChoices.length)];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.025,
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending
    });

    const particles = new THREE.Points(geometry, material);
    this.scene.add(particles);

    // Animate particles
    const posAttr = geometry.getAttribute('position');
    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const distance = 1.5 + Math.random() * 3; // Wider burst
      
      const targetX = distance * Math.sin(phi) * Math.cos(theta);
      const targetY = distance * Math.sin(phi) * Math.sin(theta);
      const targetZ = distance * Math.cos(phi);

      gsap.to({ val: 0 }, {
        val: 1,
        duration: 1.5 + Math.random() * 2,
        delay: delay,
        ease: 'expo.out', // Snappier explosion
        onUpdate: function() {
          const progress = this.targets()[0].val;
          posAttr.setXYZ(i, targetX * progress, targetY * progress, targetZ * progress);
          posAttr.needsUpdate = true;
        }
      });
    }

    gsap.to(material, {
      opacity: 0,
      duration: 3,
      delay: delay + 1.5,
      onComplete: () => {
        this.scene.remove(particles);
        geometry.dispose();
        material.dispose();
      }
    });
  }

  createFinalTypography() {
    const finalOverlay = document.createElement('div');
    finalOverlay.id = 'final-overlay';
    finalOverlay.innerHTML = `
      <div class="final-text-container">
        <h1 class="final-text line1">47 Counties.</h1>
        <h1 class="final-text line2">One Heritage.</h1>
        <h1 class="final-text line3">Kenya.</h1>
      </div>
    `;
    this.uiContainer.appendChild(finalOverlay);

    // Animation for text
    const tl = gsap.timeline();
    tl.fromTo('.final-text.line1', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1, delay: 0.5 });
    tl.fromTo('.final-text.line2', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1 }, "-=0.5");
    tl.fromTo('.final-text.line3', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1 }, "-=0.5");
    
    // Flag pulse effect behind text
    const pulseTl = gsap.timeline({ repeat: -1 });
    pulseTl.to('.final-text-container', {
      boxShadow: '0 0 150px rgba(0, 0, 0, 0.4)', // Black
      duration: 2
    })
    .to('.final-text-container', {
      boxShadow: '0 0 150px rgba(187, 3, 3, 0.4)', // Red
      duration: 2
    })
    .to('.final-text-container', {
      boxShadow: '0 0 150px rgba(0, 102, 0, 0.4)', // Green
      duration: 2
    });
  }

  createUIButtons() {
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'final-buttons';
    buttonsContainer.innerHTML = `
      <button id="replay-btn" class="ui-btn">Explore Again</button>
      <button id="share-btn" class="ui-btn">Share Journey</button>
    `;
    document.querySelector('#final-overlay').appendChild(buttonsContainer);

    document.getElementById('replay-btn').addEventListener('click', () => {
      window.location.reload();
    });

    document.getElementById('share-btn').addEventListener('click', () => {
      const url = window.location.href;
      navigator.clipboard.writeText(url).then(() => {
        const btn = document.getElementById('share-btn');
        const originalText = btn.innerText;
        btn.innerText = 'URL Copied!';
        setTimeout(() => btn.innerText = originalText, 2000);
      });
    });

    gsap.fromTo('.final-buttons', { opacity: 0 }, { opacity: 1, duration: 1, delay: 2 });
  }

  hide() {
    const finalOverlay = document.getElementById('final-overlay');
    if (finalOverlay) {
      finalOverlay.remove();
    }
  }
}
