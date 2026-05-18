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
      const response = await fetch('/src/data/kenya-counties.geojson');
      this.geoData = await response.json();
      this.createMap();
    } catch (error) {
      console.error('Error loading GeoJSON:', error);
    }
  }

  createMap() {
    this.features = [];

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
      this.features.push({
        group: countyGroup,
        mesh: mesh,
        data: feature.properties
      });

      // Add label if center is available
      if (feature.properties.center_lat && feature.properties.center_lon) {
        this.addLabel(feature.properties.name, feature.properties.center_lon, feature.properties.center_lat);
      }
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
    if (feature && feature.data.center_lat && feature.data.center_lon) {
      const [x, y] = this.projection([feature.data.center_lon, feature.data.center_lat]);
      return { x, y: -y, z: 0.5 };
    }
    return null;
  }
}
