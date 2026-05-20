import * as THREE from 'three';
import * as d3 from 'd3-geo';

export default class KenyaMap {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.group = new THREE.Group();
    this.group.visible = false; // Hidden initially
    this.scene.add(this.group);

    this.projection = d3.geoMercator()
      .center([37.9062, 0.0236]) // Center of Kenya
      .scale(5) // Scaled down for Three.js units
      .translate([0, 0]);

    this.init();
  }

  async init() {
    try {
      const response = await fetch('/data/kenya-counties.geojson');
      this.geoData = await response.json();
      this.createMap();
    } catch (error) {
      console.error('Error loading GeoJSON:', error);
    }
  }

  createMap() {
    this.features = [];
    this.labels = [];

    const material = new THREE.MeshStandardMaterial({
      color: 0xC17D3C, // Savanna ochre
      roughness: 0.7,
      metalness: 0.2,
      side: THREE.DoubleSide
    });

    const borderMaterial = new THREE.LineBasicMaterial({
      color: 0xFFD700, // Gold
      transparent: true,
      opacity: 0.5
    });

    this.geoData.features.forEach((feature, index) => {
      const countyGroup = new THREE.Group();
      this.group.add(countyGroup);

      const shape = this.createShape(feature);
      
      const extrudeSettings = {
        depth: 0.05,
        bevelEnabled: false
      };

      const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      
      // Center the geometry's bounding box
      // geometry.center(); // Don't center yet, we use projection coords

      const mesh = new THREE.Mesh(geometry, material);
      mesh.userData.isCounty = true;
      countyGroup.add(mesh);

      const edges = new THREE.EdgesGeometry(geometry);
      const line = new THREE.LineSegments(edges, borderMaterial);
      countyGroup.add(line);

      // Store reference
      const countyId = parseInt(feature.properties.adm1_pcode.substring(2));
      
      // Calculate dynamic centroid
      const centroid = d3.geoCentroid(feature);
      const [lon, lat] = centroid;

      this.features.push({
        group: countyGroup,
        mesh: mesh,
        data: {
          ...feature.properties,
          id: countyId,
          centroid: { lon, lat }
        }
      });

      // Add label using dynamic centroid
      this.addLabel(feature.properties.adm1_name, lon, lat);
    });

    // Rotate map to face camera
    this.group.rotation.x = -Math.PI * 0.1;
  }

  addLabel(name, lon, lat) {
    const [x, y] = this.projection([lon, lat]);
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 64;
    
    context.font = 'Bold 24px DM Sans';
    context.fillStyle = '#F9F3E8';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(name.toUpperCase(), 128, 32);
    
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(spriteMaterial);
    
    sprite.position.set(x, -y, 0.1); // Slightly above the map
    sprite.scale.set(0.5, 0.125, 1);
    
    this.group.add(sprite);
    this.labels.push(sprite);
    sprite.visible = false; // Hide initially for cascade
  }

  createShape(feature) {
    const shape = new THREE.Shape();
    
    if (feature.geometry.type === 'Polygon') {
      this.drawPolygon(shape, feature.geometry.coordinates[0]);
    } else if (feature.geometry.type === 'MultiPolygon') {
      feature.geometry.coordinates.forEach(polygon => {
        this.drawPolygon(shape, polygon[0]);
      });
    }

    return shape;
  }

  drawPolygon(shape, coordinates) {
    coordinates.forEach((coord, index) => {
      const [x, y] = this.projection(coord);
      if (index === 0) {
        shape.moveTo(x, -y);
      } else {
        shape.lineTo(x, -y);
      }
    });
  }

  show() {
    this.group.visible = true;
  }

  hide() {
    this.group.visible = false;
  }

  highlightCounty(id, visitedIds = new Set()) {
    this.features.forEach(feature => {
      if (feature.data.id === id) {
        // Active pulse
        gsap.to(feature.mesh.material.emissive, {
          r: 0.96, g: 0.65, b: 0.14,
          duration: 0.5,
          yoyo: true,
          repeat: 3
        });
        
        gsap.to(feature.group.position, {
          z: 0.1,
          duration: 0.5,
          ease: 'power2.out'
        });
      } else {
        // Reset or set visited state
        if (visitedIds.has(feature.data.id)) {
          // Soft visited glow
          feature.mesh.material.emissive.setHex(0x332200);
        } else {
          feature.mesh.material.emissive.setHex(0x000000);
        }

        gsap.to(feature.group.position, {
          z: 0,
          duration: 0.5
        });
      }
    });
  }

  getCountyCentroid(id) {
    const feature = this.features.find(f => f.data.id === id);
    if (feature && feature.data.centroid) {
      const { lon, lat } = feature.data.centroid;
      const [x, y] = this.projection([lon, lat]);
      return { x, y: -y, z: 0.5 };
    }
    return null;
  }

  lightUpAll() {
    this.features.forEach((feature, index) => {
      // Intense gold glow
      gsap.to(feature.mesh.material.emissive, {
        r: 1, g: 0.84, b: 0,
        duration: 1.5,
        delay: index * 0.01,
        ease: 'power2.out'
      });

      // Lift all counties slightly
      gsap.to(feature.group.position, {
        z: 0.05,
        duration: 1,
        delay: index * 0.01,
        ease: 'back.out(1.7)'
      });
    });

    // Cascade labels
    this.labels.forEach((label, index) => {
      label.visible = true;
      gsap.fromTo(label.scale, {
        x: 0, y: 0, z: 0
      }, {
        x: 0.5, y: 0.125, z: 1,
        duration: 0.5,
        delay: index * 0.015,
        ease: 'back.out(2)'
      });
    });
  }
}
