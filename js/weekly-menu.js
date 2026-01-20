/**
 * Kochchef Meyer - Weekly Menu Manager
 * Zeigt den wöchentlichen Menüplan mit Tagesgerichten
 */

class WeeklyMenuManager {
    constructor() {
        this.weeklyData = null;
        this.currentWeek = null;
        this.selectedDay = null;
        this.init();
    }

    async init() {
        await this.loadWeeklyMenu();
        this.setCurrentDay();
        this.renderWeeklyMenu();
    }

    async loadWeeklyMenu() {
        try {
            // Versuche zuerst localStorage (für Admin-Änderungen)
            const localData = localStorage.getItem('kochchef_weekly_menu');
            if (localData) {
                this.weeklyData = JSON.parse(localData);
                console.log('Wochenmenü aus localStorage geladen');
            } else {
                // Sonst aus JSON-Datei laden
                const response = await fetch('data/weekly-menu.json');
                this.weeklyData = await response.json();
                console.log('Wochenmenü aus JSON-Datei geladen');
            }
        } catch (error) {
            console.error('Fehler beim Laden des Wochenmenüs:', error);
        }
    }

    setCurrentDay() {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];

        // Finde die aktuelle Woche
        this.currentWeek = this.weeklyData.weeks.find(week => {
            return todayStr >= week.startDate && todayStr <= week.endDate;
        });

        // Fallback: Nimm die erste Woche wenn keine aktuelle gefunden
        if (!this.currentWeek && this.weeklyData.weeks.length > 0) {
            this.currentWeek = this.weeklyData.weeks[0];
        }

        // Setze den aktuellen Tag
        const dayOfWeek = today.getDay(); // 0 = Sonntag, 1 = Montag, etc.
        const dayMap = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        this.selectedDay = dayMap[dayOfWeek];

        // Fallback auf Montag wenn Wochenende
        if (this.selectedDay === 'sunday' || this.selectedDay === 'saturday') {
            this.selectedDay = 'monday';
        }
    }

    getDayNameGerman(dayKey) {
        const names = {
            monday: 'Montag',
            tuesday: 'Dienstag',
            wednesday: 'Mittwoch',
            thursday: 'Donnerstag',
            friday: 'Freitag'
        };
        return names[dayKey] || dayKey;
    }

    getDayNameShort(dayKey) {
        const names = {
            monday: 'Mo',
            tuesday: 'Di',
            wednesday: 'Mi',
            thursday: 'Do',
            friday: 'Fr'
        };
        return names[dayKey] || dayKey;
    }

    getDateForDay(dayKey) {
        if (!this.currentWeek) return '';

        const startDate = new Date(this.currentWeek.startDate);
        const dayIndex = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].indexOf(dayKey);

        const date = new Date(startDate);
        date.setDate(startDate.getDate() + dayIndex);

        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');

        return `${day}.${month}.`;
    }

    isToday(dayKey) {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];

        if (!this.currentWeek) return false;

        const startDate = new Date(this.currentWeek.startDate);
        const dayIndex = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].indexOf(dayKey);

        const date = new Date(startDate);
        date.setDate(startDate.getDate() + dayIndex);

        return date.toISOString().split('T')[0] === todayStr;
    }

    renderWeeklyMenu() {
        const container = document.getElementById('weekly-menu-container');
        if (!container || !this.currentWeek) return;

        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

        let html = `
            <div class="weekly-menu-section">
                <div class="section-header-inline">
                    <h2>🍽️ Menü der Woche</h2>
                    <p class="week-range">${this.formatWeekRange()}</p>
                </div>

                <!-- Day Selector -->
                <div class="day-selector">
                    ${days.map(day => `
                        <button
                            class="day-btn ${this.selectedDay === day ? 'active' : ''} ${this.isToday(day) ? 'today' : ''}"
                            data-day="${day}"
                            onclick="weeklyMenu.selectDay('${day}')">
                            <span class="day-short">${this.getDayNameShort(day)}</span>
                            <span class="day-date">${this.getDateForDay(day)}</span>
                            ${this.isToday(day) ? '<span class="today-badge">Heute</span>' : ''}
                        </button>
                    `).join('')}
                </div>

                <!-- Dishes Display -->
                <div class="weekly-dishes">
                    <div class="weekly-dishes-header">
                        <h3>${this.getDayNameGerman(this.selectedDay)}, ${this.getDateForDay(this.selectedDay).replace('.', '')} Januar</h3>
                    </div>
                    <div class="weekly-dishes-grid">
                        ${this.renderDishes(this.selectedDay)}
                    </div>
                </div>

                <div class="weekly-menu-footer">
                    <p><strong>💡 Tipp:</strong> Ab 8:00 Uhr können Sie telefonisch vorbestellen!</p>
                    <a href="tel:+491748451470" class="btn btn-primary">📞 Jetzt bestellen: 0174 845 14 70</a>
                    <a href="catering.html" class="btn btn-secondary">📋 Komplettes Catering-Menü ansehen</a>
                </div>
            </div>
        `;

        container.innerHTML = html;
    }

    formatWeekRange() {
        if (!this.currentWeek) return '';

        const start = new Date(this.currentWeek.startDate);
        const end = new Date(this.currentWeek.endDate);

        const startDay = start.getDate();
        const endDay = end.getDate();
        const month = start.toLocaleDateString('de-DE', { month: 'long' });
        const year = start.getFullYear();

        return `${startDay}. - ${endDay}. ${month} ${year}`;
    }

    selectDay(day) {
        this.selectedDay = day;
        this.renderWeeklyMenu();
    }

    renderDishes(dayKey) {
        if (!this.currentWeek || !this.currentWeek.days[dayKey]) {
            return '<div class="no-dishes">Keine Gerichte für diesen Tag verfügbar.</div>';
        }

        const dishes = this.currentWeek.days[dayKey];

        return dishes.map(dish => `
            <div class="weekly-dish-card">
                <div class="dish-header">
                    <h4>${dish.name}</h4>
                    <span class="dish-price">${dish.price.toFixed(2)} €</span>
                </div>
                <div class="dish-badges">
                    ${dish.vegetarian ? '<span class="badge badge-veg">🥬 Vegetarisch</span>' : ''}
                    ${dish.spicy ? '<span class="badge badge-spicy">🌶️ Pikant</span>' : ''}
                </div>
                <p class="dish-ingredients">${dish.ingredients}</p>
            </div>
        `).join('');
    }
}

// Initialize when DOM is ready
let weeklyMenu;
document.addEventListener('DOMContentLoaded', () => {
    weeklyMenu = new WeeklyMenuManager();
});
