/**
 * Kochchef Meyer - Menu Management System
 * Lädt das Menü aus der JSON-Datei und ermöglicht Filtern/Suchen
 */

class MenuManager {
    constructor() {
        this.menuData = null;
        this.currentCategory = 'all';
        this.searchQuery = '';
        this.filterVegetarian = false;
        this.filterSpicy = false;

        this.init();
    }

    async init() {
        await this.loadMenu();
        this.setupEventListeners();
        this.renderMenu();
    }

    async loadMenu() {
        try {
            // Versuche zuerst localStorage (für Admin-Änderungen)
            const localData = localStorage.getItem('kochchef_menu');
            if (localData) {
                this.menuData = JSON.parse(localData);
                console.log('Menü aus localStorage geladen');
            } else {
                // Sonst aus JSON-Datei laden
                const response = await fetch('data/menu.json');
                this.menuData = await response.json();
                console.log('Menü aus JSON-Datei geladen');
            }
        } catch (error) {
            console.error('Fehler beim Laden des Menüs:', error);
            document.getElementById('menu-container').innerHTML =
                '<div class="no-results"><h3>Menü konnte nicht geladen werden</h3><p>Bitte versuchen Sie es später erneut.</p></div>';
        }
    }

    setupEventListeners() {
        // Category Filter Buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentCategory = e.target.dataset.category;
                this.renderMenu();
            });
        });

        // Search Input
        const searchInput = document.getElementById('menu-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value.toLowerCase();
                this.renderMenu();
            });
        }

        // Dietary Filters
        const vegFilter = document.getElementById('filter-vegetarian');
        if (vegFilter) {
            vegFilter.addEventListener('change', (e) => {
                this.filterVegetarian = e.target.checked;
                this.renderMenu();
            });
        }

        const spicyFilter = document.getElementById('filter-spicy');
        if (spicyFilter) {
            spicyFilter.addEventListener('change', (e) => {
                this.filterSpicy = e.target.checked;
                this.renderMenu();
            });
        }
    }

    filterDishes(dishes) {
        return dishes.filter(dish => {
            // Search filter
            if (this.searchQuery) {
                const searchMatch = dish.name.toLowerCase().includes(this.searchQuery) ||
                                   dish.ingredients.toLowerCase().includes(this.searchQuery);
                if (!searchMatch) return false;
            }

            // Vegetarian filter
            if (this.filterVegetarian && !dish.vegetarian) {
                return false;
            }

            // Spicy filter
            if (this.filterSpicy && !dish.spicy) {
                return false;
            }

            return true;
        });
    }

    renderMenu() {
        const container = document.getElementById('menu-container');
        if (!container || !this.menuData) return;

        let html = '';
        let totalVisible = 0;

        const categoriesToShow = this.currentCategory === 'all'
            ? this.menuData.categories
            : this.menuData.categories.filter(cat => cat.id === this.currentCategory);

        categoriesToShow.forEach(category => {
            const filteredDishes = this.filterDishes(category.dishes);

            if (filteredDishes.length === 0) return;

            // Category Header
            html += `
                <div class="category-header">
                    <span class="category-icon">${category.icon}</span>
                    <h2>${category.name}</h2>
                </div>
            `;

            // Dishes
            filteredDishes.forEach(dish => {
                totalVisible++;
                html += this.renderDishCard(dish);
            });
        });

        if (totalVisible === 0) {
            html = `
                <div class="no-results">
                    <h3>Keine Gerichte gefunden</h3>
                    <p>Versuchen Sie eine andere Suche oder Filter-Kombination.</p>
                </div>
            `;
        }

        container.innerHTML = html;

        // Update count
        const countEl = document.getElementById('visible-count');
        if (countEl) {
            countEl.textContent = totalVisible;
        }
    }

    renderDishCard(dish) {
        const badges = [];
        if (dish.vegetarian) {
            badges.push('<span class="badge badge-vegetarian">🥬 Vegetarisch</span>');
        }
        if (dish.spicy) {
            badges.push('<span class="badge badge-spicy">🌶️ Pikant</span>');
        }

        return `
            <div class="menu-card" data-id="${dish.id}">
                <div class="menu-card-header">
                    <h3>${dish.name}</h3>
                    <span class="menu-card-price">${dish.price.toFixed(2)} €</span>
                </div>
                ${badges.length > 0 ? `<div class="menu-card-badges">${badges.join('')}</div>` : ''}
                <p class="menu-card-ingredients">${dish.ingredients}</p>
            </div>
        `;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new MenuManager();
});
