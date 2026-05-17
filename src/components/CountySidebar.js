import './src/styles/global.css';

export default class CountySidebar {
  constructor() {
    this.container = document.querySelector('#ui-overlay');
    this.createSidebar();
  }

  async createSidebar() {
    try {
      const response = await fetch('/src/data/counties-cultural-data.json');
      const data = await response.json();
      this.counties = data.counties;
      this.render();
    } catch (error) {
      console.error('Error loading cultural data for sidebar:', error);
    }
  }

  render() {
    const sidebar = document.createElement('div');
    sidebar.id = 'county-sidebar';
    sidebar.innerHTML = `
      <div class="sidebar-header">
        <h3>Kenya Counties</h3>
      </div>
      <div class="sidebar-content">
        ${this.counties.map(county => `
          <div class="county-item" data-id="${county.id}">
            <span class="county-code">${county.code}</span>
            <span class="county-name">${county.name}</span>
          </div>
        `).join('')}
      </div>
    `;
    this.container.appendChild(sidebar);
    
    // Styling is in global.css
  }
}
