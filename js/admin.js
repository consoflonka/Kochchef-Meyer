/**
 * Kochchef Meyer - Admin Panel
 * Menü-Verwaltung mit localStorage
 */

class AdminPanel {
    constructor() {
        this.menuData = null;
        this.init();
    }

    async init() {
        await this.loadMenu();
        this.setupNavigation();
        this.setupForms();
        this.updateStats();
        this.renderDishes();
        this.renderCategories();
        this.populateCategorySelects();
    }

    // ==================== Data Loading ====================

    async loadMenu() {
        try {
            // Erst localStorage prüfen
            const localData = localStorage.getItem('kochchef_menu');
            if (localData) {
                this.menuData = JSON.parse(localData);
                console.log('Menü aus localStorage geladen');
            } else {
                // Sonst aus JSON laden
                const response = await fetch('data/menu.json');
                this.menuData = await response.json();
                console.log('Menü aus JSON-Datei geladen');
            }
            this.updateLastUpdated();
        } catch (error) {
            console.error('Fehler beim Laden:', error);
            this.showToast('Fehler beim Laden des Menüs', 'error');
        }
    }

    saveMenu() {
        this.menuData.lastUpdated = new Date().toISOString().split('T')[0];
        localStorage.setItem('kochchef_menu', JSON.stringify(this.menuData));
        this.updateLastUpdated();
        this.showToast('Änderungen gespeichert!', 'success');
    }

    // ==================== Navigation ====================

    setupNavigation() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.target.dataset.section;

                // Update active states
                document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
                e.target.classList.add('active');

                document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
                document.getElementById(section).classList.add('active');
            });
        });
    }

    // ==================== Forms ====================

    setupForms() {
        // Dish Form
        document.getElementById('dish-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveDish();
        });

        // Category Form
        document.getElementById('category-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveCategory();
        });

        // Search & Filter
        document.getElementById('dish-search')?.addEventListener('input', () => this.renderDishes());
        document.getElementById('category-filter')?.addEventListener('change', () => this.renderDishes());
    }

    // ==================== Stats ====================

    updateStats() {
        if (!this.menuData) return;

        let totalDishes = 0;
        let vegetarian = 0;
        let spicy = 0;

        this.menuData.categories.forEach(cat => {
            totalDishes += cat.dishes.length;
            cat.dishes.forEach(dish => {
                if (dish.vegetarian) vegetarian++;
                if (dish.spicy) spicy++;
            });
        });

        document.getElementById('stat-total').textContent = totalDishes;
        document.getElementById('stat-categories').textContent = this.menuData.categories.length;
        document.getElementById('stat-vegetarian').textContent = vegetarian;
        document.getElementById('stat-spicy').textContent = spicy;
    }

    updateLastUpdated() {
        const el = document.getElementById('last-updated');
        if (el && this.menuData) {
            el.textContent = this.menuData.lastUpdated || '-';
        }
    }

    // ==================== Dishes ====================

    renderDishes() {
        const container = document.getElementById('dishes-list');
        if (!container || !this.menuData) return;

        const searchQuery = document.getElementById('dish-search')?.value.toLowerCase() || '';
        const categoryFilter = document.getElementById('category-filter')?.value || 'all';

        let html = '';

        this.menuData.categories.forEach(category => {
            if (categoryFilter !== 'all' && category.id !== categoryFilter) return;

            const filteredDishes = category.dishes.filter(dish =>
                dish.name.toLowerCase().includes(searchQuery) ||
                dish.ingredients.toLowerCase().includes(searchQuery)
            );

            filteredDishes.forEach(dish => {
                html += `
                    <div class="dish-item" data-id="${dish.id}" data-category="${category.id}">
                        <div class="dish-info">
                            <div class="dish-name">${dish.name}</div>
                            <div class="dish-meta">${category.name}</div>
                        </div>
                        <div class="dish-badges">
                            ${dish.vegetarian ? '<span class="badge badge-veg">🥬 Veg</span>' : ''}
                            ${dish.spicy ? '<span class="badge badge-spicy">🌶️</span>' : ''}
                        </div>
                        <div class="dish-price">${dish.price.toFixed(2)} €</div>
                        <div class="dish-actions">
                            <button class="btn-icon btn-edit" onclick="admin.editDish('${category.id}', ${dish.id})" title="Bearbeiten">✏️</button>
                            <button class="btn-icon btn-delete" onclick="admin.deleteDish('${category.id}', ${dish.id})" title="Löschen">🗑️</button>
                        </div>
                    </div>
                `;
            });
        });

        container.innerHTML = html || '<div style="padding: 30px; text-align: center; color: #666;">Keine Gerichte gefunden</div>';
    }

    openAddDishModal() {
        document.getElementById('modal-title').textContent = 'Neues Gericht hinzufügen';
        document.getElementById('dish-form').reset();
        document.getElementById('dish-id').value = '';
        document.getElementById('dish-category-id').value = '';
        document.getElementById('dish-modal').classList.add('active');
    }

    editDish(categoryId, dishId) {
        const category = this.menuData.categories.find(c => c.id === categoryId);
        const dish = category?.dishes.find(d => d.id === dishId);

        if (!dish) return;

        document.getElementById('modal-title').textContent = 'Gericht bearbeiten';
        document.getElementById('dish-id').value = dish.id;
        document.getElementById('dish-category-id').value = categoryId;
        document.getElementById('dish-name').value = dish.name;
        document.getElementById('dish-price').value = dish.price;
        document.getElementById('dish-category').value = categoryId;
        document.getElementById('dish-ingredients').value = dish.ingredients;
        document.getElementById('dish-vegetarian').checked = dish.vegetarian;
        document.getElementById('dish-spicy').checked = dish.spicy;

        document.getElementById('dish-modal').classList.add('active');
    }

    saveDish() {
        const dishId = document.getElementById('dish-id').value;
        const originalCategoryId = document.getElementById('dish-category-id').value;
        const newCategoryId = document.getElementById('dish-category').value;

        const dishData = {
            id: dishId ? parseInt(dishId) : Date.now(),
            name: document.getElementById('dish-name').value,
            price: parseFloat(document.getElementById('dish-price').value),
            ingredients: document.getElementById('dish-ingredients').value,
            vegetarian: document.getElementById('dish-vegetarian').checked,
            spicy: document.getElementById('dish-spicy').checked
        };

        if (dishId && originalCategoryId) {
            // Bestehendes Gericht bearbeiten
            const oldCategory = this.menuData.categories.find(c => c.id === originalCategoryId);

            if (originalCategoryId !== newCategoryId) {
                // Kategorie gewechselt - aus alter entfernen
                oldCategory.dishes = oldCategory.dishes.filter(d => d.id !== parseInt(dishId));
                // In neue hinzufügen
                const newCategory = this.menuData.categories.find(c => c.id === newCategoryId);
                newCategory.dishes.push(dishData);
            } else {
                // Gleiche Kategorie - aktualisieren
                const index = oldCategory.dishes.findIndex(d => d.id === parseInt(dishId));
                oldCategory.dishes[index] = dishData;
            }
        } else {
            // Neues Gericht
            const category = this.menuData.categories.find(c => c.id === newCategoryId);
            category.dishes.push(dishData);
        }

        this.saveMenu();
        this.closeModal();
        this.renderDishes();
        this.updateStats();
    }

    deleteDish(categoryId, dishId) {
        if (!confirm('Gericht wirklich löschen?')) return;

        const category = this.menuData.categories.find(c => c.id === categoryId);
        category.dishes = category.dishes.filter(d => d.id !== dishId);

        this.saveMenu();
        this.renderDishes();
        this.updateStats();
    }

    closeModal() {
        document.getElementById('dish-modal').classList.remove('active');
    }

    // ==================== Categories ====================

    renderCategories() {
        const container = document.getElementById('categories-list');
        if (!container || !this.menuData) return;

        let html = '';

        this.menuData.categories.forEach(category => {
            html += `
                <div class="category-card">
                    <div class="category-icon">${category.icon}</div>
                    <div class="category-info">
                        <div class="category-name">${category.name}</div>
                        <div class="category-count">${category.dishes.length} Gerichte</div>
                    </div>
                    <div class="dish-actions">
                        <button class="btn-icon btn-edit" onclick="admin.editCategory('${category.id}')" title="Bearbeiten">✏️</button>
                        <button class="btn-icon btn-delete" onclick="admin.deleteCategory('${category.id}')" title="Löschen">🗑️</button>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    populateCategorySelects() {
        const selects = [
            document.getElementById('dish-category'),
            document.getElementById('category-filter')
        ];

        selects.forEach(select => {
            if (!select) return;

            const isFilter = select.id === 'category-filter';
            select.innerHTML = isFilter ? '<option value="all">Alle Kategorien</option>' : '';

            this.menuData.categories.forEach(cat => {
                select.innerHTML += `<option value="${cat.id}">${cat.icon} ${cat.name}</option>`;
            });
        });
    }

    openAddCategoryModal() {
        document.getElementById('category-modal-title').textContent = 'Neue Kategorie';
        document.getElementById('category-form').reset();
        document.getElementById('category-id').value = '';
        document.getElementById('category-modal').classList.add('active');
    }

    editCategory(categoryId) {
        const category = this.menuData.categories.find(c => c.id === categoryId);
        if (!category) return;

        document.getElementById('category-modal-title').textContent = 'Kategorie bearbeiten';
        document.getElementById('category-id').value = category.id;
        document.getElementById('category-name').value = category.name;
        document.getElementById('category-icon').value = category.icon;

        document.getElementById('category-modal').classList.add('active');
    }

    saveCategory() {
        const categoryId = document.getElementById('category-id').value;
        const name = document.getElementById('category-name').value;
        const icon = document.getElementById('category-icon').value || '🍽️';

        if (categoryId) {
            // Bearbeiten
            const category = this.menuData.categories.find(c => c.id === categoryId);
            category.name = name;
            category.icon = icon;
        } else {
            // Neu
            const newId = name.toLowerCase().replace(/\s+/g, '-').replace(/[äöü]/g, m => ({ä:'ae',ö:'oe',ü:'ue'}[m]));
            this.menuData.categories.push({
                id: newId,
                name: name,
                icon: icon,
                dishes: []
            });
        }

        this.saveMenu();
        this.closeCategoryModal();
        this.renderCategories();
        this.populateCategorySelects();
        this.updateStats();
    }

    deleteCategory(categoryId) {
        const category = this.menuData.categories.find(c => c.id === categoryId);
        if (category.dishes.length > 0) {
            alert(`Diese Kategorie enthält noch ${category.dishes.length} Gerichte. Bitte erst alle Gerichte löschen oder verschieben.`);
            return;
        }

        if (!confirm('Kategorie wirklich löschen?')) return;

        this.menuData.categories = this.menuData.categories.filter(c => c.id !== categoryId);

        this.saveMenu();
        this.renderCategories();
        this.populateCategorySelects();
        this.updateStats();
    }

    closeCategoryModal() {
        document.getElementById('category-modal').classList.remove('active');
    }

    // ==================== Export / Import ====================

    exportMenu() {
        const dataStr = JSON.stringify(this.menuData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `kochchef-menu-${this.menuData.lastUpdated}.json`;
        a.click();

        URL.revokeObjectURL(url);
        this.showToast('Menü exportiert!', 'success');
    }

    importMenu() {
        const fileInput = document.getElementById('import-file');
        const file = fileInput.files[0];

        if (!file) {
            this.showToast('Bitte eine Datei auswählen', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);

                // Validierung
                if (!data.categories || !Array.isArray(data.categories)) {
                    throw new Error('Ungültiges Format');
                }

                this.menuData = data;
                this.saveMenu();
                this.updateStats();
                this.renderDishes();
                this.renderCategories();
                this.populateCategorySelects();

                this.showToast('Menü importiert!', 'success');
            } catch (error) {
                this.showToast('Fehler beim Import: ' + error.message, 'error');
            }
        };

        reader.readAsText(file);
    }

    async resetToOriginal() {
        if (!confirm('Alle lokalen Änderungen werden gelöscht. Fortfahren?')) return;

        localStorage.removeItem('kochchef_menu');

        try {
            const response = await fetch('data/menu.json');
            this.menuData = await response.json();

            this.updateStats();
            this.renderDishes();
            this.renderCategories();
            this.populateCategorySelects();
            this.updateLastUpdated();

            this.showToast('Auf Original zurückgesetzt!', 'success');
        } catch (error) {
            this.showToast('Fehler: ' + error.message, 'error');
        }
    }

    // ==================== Toast ====================

    showToast(message, type = '') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = 'toast show ' + type;

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}

// Initialize
const admin = new AdminPanel();
