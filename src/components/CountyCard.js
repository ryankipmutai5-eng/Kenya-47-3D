import gsap from 'gsap';

export default class CountyCard {
  constructor() {
    this.container = document.querySelector('#ui-overlay');
    this.card = null;
    this.createCard();
  }

  createCard() {
    this.card = document.createElement('div');
    this.card.id = 'county-card';
    this.card.className = 'glass-card';
    this.container.appendChild(this.card);
  }

  async show(countyData, culturalManifest) {
    const manifest = culturalManifest.counties.find(c => c.id === countyData.id);
    if (!manifest) return;

    this.card.innerHTML = `
      <div class="card-header">
        <h2>${countyData.name.toUpperCase()}</h2>
        <span class="county-badge">#${String(countyData.id).padStart(2, '0')}</span>
      </div>
      <div class="cultural-grid">
        ${manifest.grid_items.map(item => `
          <div class="grid-item">
            <div class="grid-image" style="background-image: url('${item.image_url || `/src/assets/textures/county-cultural/placeholders/${this.getPlaceholder(item.category)}.svg`}')"></div>
            <div class="grid-caption">
              <span class="category">${item.category}</span>
              <p>${item.description}</p>
            </div>
          </div>
        `).join('')}
      </div>
      <div class="county-facts">
        <div class="fact">
          <span class="label">Capital</span>
          <span class="value">${countyData.capital}</span>
        </div>
        <div class="fact">
          <span class="label">Population</span>
          <span class="value">${countyData.population.toLocaleString()}</span>
        </div>
        <div class="fact">
          <span class="label">Area</span>
          <span class="value">${countyData.area_km2} km²</span>
        </div>
      </div>
      <button class="close-card">×</button>
    `;

    this.card.querySelector('.close-card').addEventListener('click', () => this.hide());

    gsap.to(this.card, {
      x: 0,
      opacity: 1,
      duration: 0.8,
      ease: 'power3.out'
    });
  }

  hide() {
    gsap.to(this.card, {
      x: 100,
      opacity: 0,
      duration: 0.5,
      ease: 'power3.in',
      onComplete: () => {
        // Dispatch event to resume overview if needed
        window.dispatchEvent(new CustomEvent('county-card-closed'));
      }
    });
  }

  getPlaceholder(category) {
    const mapping = {
      'People / Community': 'people',
      'Traditional Dress': 'dress',
      'Local Food': 'food',
      'Landmark / Site': 'landmark',
      'Wildlife': 'wildlife',
      'Architecture': 'architecture',
      'Crafts / Economy': 'crafts',
      'Cultural Dance': 'dance',
      'Festival / Ritual': 'festival'
    };
    return mapping[category] || 'people';
  }
}
