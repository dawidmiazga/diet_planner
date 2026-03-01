/* =====================================================
   STATE
===================================================== */
const AppState = {

    // konfiguracja
    config: {
        defaultDaysToRender: 5
    },

    // dane runtime
    currentPerson: "osoba1",
    isEditMode: false,
    selectedRatingFilter: 0,

    meals: [],
    mealsById: {},
    products: [],
    plannerData: { osoba1: {}, osoba2: {} },

    // modal preview
    currentPreviewMeal: null,
    baseIngredients: [],
    currentPortionMultiplier: 1.0,

    // planner modal
    currentSelectedMealId: null,
    currentMealOptions: []
};

const $ = id => document.getElementById(id);

/* =====================================================
   API
===================================================== */

async function savePlanner() {
    try {
        const res = await fetch("/api/save_planner", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(AppState.plannerData)
        });

        if (!res.ok) throw new Error();

        UI.showSaveNoticeGlobal();

    } catch {
        showErrorNotice("Błąd zapisu");
    }
}

/* =====================================================
   PLANNER LOGIC
===================================================== */

const Planner = {
    renderPlanner() {
        const startDateInput = $("startDate").value;
        if (!startDateInput) return;

        const startDate = new Date(startDateInput);
        const grid = $("plannerGrid");
        grid.innerHTML = "";

        const maxDishes = AppState.currentPerson === "osoba1" ? AppState.config.defaultDaysToRender : 4;
        grid.style.gridTemplateColumns = `150px repeat(${maxDishes}, 1fr)`;

        // nagłówki kolumn
        grid.appendChild(UI.createHeaderCell("Data"));
        for (let dish = 1; dish <= maxDishes; dish++) {
            grid.appendChild(UI.createHeaderCell(DISH_CONFIG[AppState.currentPerson][dish]));
        }

        AppState.mealsById = Object.fromEntries(
            AppState.meals.map(m => [m.id, m])
        );

        // wiersze = daty
        for (let row = 0; row < maxDishes; row++) {
            const d = new Date(startDate);
            d.setDate(d.getDate() + row);
            const dateStr = d.toISOString().split('T')[0];

            // komórka daty
            grid.appendChild(UI.createCell(d.toLocaleDateString('pl-PL', { weekday: 'short', day: 'numeric', month: 'numeric' })));

            for (let dish = 1; dish <= maxDishes; dish++) {
                const mealId = AppState.plannerData[AppState.currentPerson][dateStr]?.[dish] || "";
                const meal = AppState.mealsById[mealId];
                const cellText = meal ? meal.name : "-";

                const cell = UI.createCell(cellText, "cell");

                // kliknięcie w komórkę otwiera popup tylko jeśli jest danie
                cell.onclick = () => Planner.openMealModal(dateStr, dish);

                // dodajemy przycisk X tylko jeśli jest wybrane danie i tylko w trybie edycji
                if (meal && AppState.isEditMode) {
                    const removeBtn = document.createElement("button");
                    removeBtn.innerHTML = `
                        <svg viewBox="0 0 24 24">
                            <line x1="6" y1="6" x2="18" y2="18" stroke="white" stroke-width="2" stroke-linecap="round"/>
                            <line x1="18" y1="6" x2="6" y2="18" stroke="white" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                    `;
                    removeBtn.className = "remove-meal-btn";

                    removeBtn.onclick = (e) => {
                        e.stopPropagation();
                        Planner.removeMeal(dateStr, dish);
                    };

                    cell.appendChild(removeBtn);
                }
                grid.appendChild(cell);
            }
        }
    },

    savePlannerMeal(mealId) {
        const dish = parseInt($("cellDish").value);
        const dateStr = $("cellDate").value;

        if (!AppState.plannerData[AppState.currentPerson][dateStr])
            AppState.plannerData[AppState.currentPerson][dateStr] = {};

        AppState.plannerData[AppState.currentPerson][dateStr][dish] = mealId;

        Planner.closePlannerMealModal();
        Planner.renderPlanner();
        savePlanner();
    },

    removeMeal(dateStr, dish) {
        if (AppState.plannerData[AppState.currentPerson][dateStr] && AppState.plannerData[AppState.currentPerson][dateStr][dish]) {
            delete AppState.plannerData[AppState.currentPerson][dateStr][dish];

            if (Object.keys(AppState.plannerData[AppState.currentPerson][dateStr]).length === 0) {
                delete AppState.plannerData[AppState.currentPerson][dateStr];
            }
        }

        Planner.renderPlanner();
        savePlanner();
        UI.showSaveNoticeGlobal();
    },

    setPerson(person, el) {
        AppState.currentPerson = person;
        document.querySelectorAll("#personTabs .tab").forEach(t => t.classList.remove("active"));
        el.classList.add("active");
        Planner.renderPlanner();
    },

    openMealModal(dateStr, dish) {
        // Jeśli edytujemy, to otwiera się modal z wyborem dania
        if (AppState.isEditMode) {
            $("cellDish").value = dish;
            $("cellDate").value = dateStr;
            AppState.selectedRatingFilter = 0;
            UI.initRatingFilter();

            const container = $("mealTiles");
            container.innerHTML = "";
            AppState.currentMealOptions = AppState.meals
                .filter(m =>
                    m.person === AppState.currentPerson &&
                    Array.isArray(m.dish) &&
                    m.dish.includes(Number(dish))
                )
                .sort((a, b) =>
                    a.name.localeCompare(b.name, 'pl', { sensitivity: 'base' })
                );

            AppState.currentSelectedMealId =
                AppState.plannerData[AppState.currentPerson][dateStr]?.[dish] || null;

            Planner.renderMealTiles();

            $("plannerMealModal").classList.add("show");

            const searchInput = $("mealSearch");
            searchInput.value = "";

            setTimeout(() => {
                searchInput.focus();
            }, 220);

            searchInput.oninput = (e) => {
                Planner.renderMealTiles(e.target.value);
            };
        } else {
            // Jeśli podgląd, to wyświetl opis i składniki dania
            const mealId = AppState.plannerData[AppState.currentPerson][dateStr]?.[dish];
            const meal = AppState.meals.find(m => m.id === mealId);

            if (meal) {
                DescriptionModal.openDescriptionModal(meal);
            }
        }
    },

    renderMealTiles(filterText = "") {
        const container = $("mealTiles");

        if (!AppState.currentMealOptions) return;

        container.innerHTML = "";
        const filteredOptions = AppState.currentMealOptions
            .filter(m =>
                m.name.toLowerCase().includes(filterText.toLowerCase())
            )
            .filter(m =>
                AppState.selectedRatingFilter === 0
                    ? true
                    : (m.rating || 0) === AppState.selectedRatingFilter
            );

        if (filteredOptions.length === 0) {
            container.innerHTML = "<p>Brak dań pasujących do wyszukiwania</p>";
        } else {
            filteredOptions.forEach(m => {
                const tile = document.createElement("div");
                tile.className = "meal-tile";

                if (m.id === AppState.currentSelectedMealId) {
                    tile.classList.add("selected");
                }

                tile.innerHTML = `
                    <div class="meal-tile-content">
                        <div class="meal-rating">
                            ${UI.generateStaticStars(m.rating || 0)}
                        </div>
                        <div class="meal-name">${m.name}</div>
                    </div>
                `;

                tile.onclick = () => Planner.savePlannerMeal(m.id);
                container.appendChild(tile);
            });
        }
    },

    closePlannerMealModal() {
        const modal = $("plannerMealModal");
        closeModalElement(modal);
    },

    setMode(edit, el) {
        AppState.isEditMode = edit;

        document.querySelectorAll(".mode-btn")
            .forEach(btn => btn.classList.remove("active"));

        el.classList.add("active");

        UI.moveIndicator();
        Planner.renderPlanner();
    }
}

/* =====================================================
   MEAL DESCRIPTION MODAL
===================================================== */

const DescriptionModal = {
    openDescriptionModal(meal) {
        AppState.currentPreviewMeal = meal;

        const editBtn = $("editMealFromPreviewBtn");
        editBtn.style.display = "inline-flex";

        editBtn.onclick = function () {
            DescriptionModal.closeDescriptionModal();
            MealModal.openMealEditModalFromPlanner(AppState.currentPreviewMeal);
        };

        $("descriptionTitle").textContent = meal.name;

        const left = $("mealDescriptionLeft");
        const right = $("mealDescriptionRight");

        left.innerHTML = "";
        right.innerHTML = "";

        let descriptionHTML = "<h4>Przygotowanie</h4>";

        if (meal.description && meal.description.trim() !== "") {

            const steps = meal.description
                .split("\n")
                .map(step => step.trim())
                .filter(step => step.length > 0);

            descriptionHTML += `<div class="steps-display-list">`;

            steps.forEach((step, index) => {
                descriptionHTML += `
                    <div class="step-display-row" onclick="DescriptionModal.toggleStep(this)">
                        <div class="step-number">${index + 1}.</div>
                        <div class="step-text">${step}</div>
                    </div>
                `;
            });

            descriptionHTML += `</div>`;

        } else {
            descriptionHTML += "<p>Brak opisu.</p>";
        }

        right.innerHTML = descriptionHTML;

        DescriptionModal.setBaseIngredients(meal.ingredients);

        $("mealDescriptionModal").classList.add("show");
    },

    closeDescriptionModal() {
        const editBtn = $("editMealFromPreviewBtn");
        editBtn.style.display = "none";

        $("mealDescriptionModal").classList.remove("show");

        AppState.currentPortionMultiplier = 1.0;
        AppState.baseIngredients = [];

        const portionEl = $("portionValue");
        if (portionEl) portionEl.innerText = "1.0";
    },

    toggleIngredient(element) {
        element.classList.toggle("checked");
    },

    toggleStep(element) {
        element.classList.toggle("checked");
    },

    renderScaledIngredients() {
        const left = $("mealDescriptionLeft");

        let ingredientsHTML = `
            <div class="ingredients-title-row">
                <h4>Składniki</h4>

                <div class="portion-multiplier">

                    <button type="button" onclick="DescriptionModal.changePortion(-0.5)">
                        <svg viewBox="0 0 24 24">
                            <rect x="5" y="11" width="14" height="2" rx="1"></rect>
                        </svg>
                    </button>

                    <span id="portionValue">${AppState.currentPortionMultiplier.toFixed(1)}</span>

                    <button type="button" onclick="DescriptionModal.changePortion(0.5)">
                        <svg viewBox="0 0 24 24">
                            <rect x="5" y="11" width="14" height="2" rx="1"></rect>
                            <rect x="11" y="5" width="2" height="14" rx="1"></rect>
                        </svg>
                    </button>

                </div>
            </div>
        `;

        ingredientsHTML += `<div class="ingredients-display-list">`;

        AppState.baseIngredients.forEach(ingredient => {

            const product = AppState.products.find(p => p.id === ingredient.id);

            const scaledGrams = ingredient.grams * AppState.currentPortionMultiplier;

            let gramsPart = `${scaledGrams.toFixed(1)}g`;
            let extraUnitPart = "";

            if (
                product &&
                product.jednostka_per_gram &&
                product.nazwa_jednostki &&
                product.nazwa_jednostki.toLowerCase() !== "gram"
            ) {

                let iloscJednostek = scaledGrams / product.jednostka_per_gram;

                iloscJednostek = Number.isInteger(iloscJednostek)
                    ? iloscJednostek
                    : iloscJednostek.toFixed(1);

                extraUnitPart = ` (${iloscJednostek} ${product.nazwa_jednostki})`;
            }

            ingredientsHTML += `
                <div class="ingredient-display-row" onclick="DescriptionModal.toggleIngredient(this)">
                    <div class="ingredient-display-name">
                        ${ingredient.name}
                    </div>
                    <div class="ingredient-display-value">
                        ${gramsPart}${extraUnitPart}
                    </div>
                </div>
            `;
        });

        ingredientsHTML += `</div>`;
        left.innerHTML = ingredientsHTML;
    },

    changePortion(step) {
        let newValue = AppState.currentPortionMultiplier + step;
        if (newValue < 0.5) return;

        AppState.currentPortionMultiplier = Math.round(newValue * 10) / 10;
        DescriptionModal.renderScaledIngredients();
    },

    setBaseIngredients(ingredients) {
        AppState.baseIngredients = ingredients;
        AppState.currentPortionMultiplier = 1.0;
        DescriptionModal.renderScaledIngredients();
    }
}

/* =====================================================
   EDIT MEAL MODAL
===================================================== */

const MealModal = {
    openMealEditModalFromPlanner(meal) {
        if (!meal) return;

        $("mealId").value = meal.id;
        $("mealName").value = meal.name;
        $("mealDescription").value = meal.description;

        renderPersonSelection(meal.person);
        updateDishSelectionForModal(meal.person, meal.dish || []);

        renderStars(meal.rating || 0);

        const container = $("ingredientsContainer");
        container.innerHTML = "";

        if (meal.ingredients && Array.isArray(meal.ingredients)) {
            meal.ingredients.forEach(ing => {
                addIngredientField(ing.name, ing.grams, ing.id);
            });
        }

        $("editModalTitleMeal").textContent = "Edytuj danie";
        $("deleteMealBtn").style.display = "inline-block";

        $("mealModal").classList.add("show");
    }
}

/* =====================================================
   RENDER HELPERS
===================================================== */

const UI = {
    createHeaderCell(text) {
        const div = document.createElement("div");
        div.className = "header " + (AppState.currentPerson === "osoba1" ? "header-osoba1" : "header-osoba2");
        div.textContent = text;
        return div;
    },

    createCell(text, cls = "cell") {
        const div = document.createElement("div");
        div.className = cls;
        div.textContent = text;
        return div;
    },

    generateStaticStars(rating) {
        let starsHTML = "";

        for (let i = 1; i <= 5; i++) {
            if (i <= rating) {
                starsHTML += '<span class="static-star filled"></span>';
            } else {
                starsHTML += '<span class="static-star"></span>';
            }
        }
        return starsHTML;
    },

    initRatingFilter() {
        const container = $("ratingFilter");
        container.innerHTML = "";

        for (let i = 1; i <= 5; i++) {
            const star = document.createElement("span");
            star.className = "filter-star";

            if (i <= AppState.selectedRatingFilter) {
                star.classList.add("active");
            }

            star.onclick = () => {
                AppState.selectedRatingFilter = i;
                UI.initRatingFilter();
                Planner.renderMealTiles($("mealSearch").value);
            };

            container.appendChild(star);
        }

        $("clearRatingFilter").onclick = () => {
            AppState.selectedRatingFilter = 0;
            UI.initRatingFilter();
            Planner.renderMealTiles($("mealSearch").value);
        };
    },

    showSaveNoticeGlobal() {
        let notice = document.querySelector(".save-notice-global");
        if (!notice) {
            notice = document.createElement("div");
            notice.className = "save-notice-global";
            notice.textContent = "Zapisano ✔";
            document.body.appendChild(notice);
        }

        notice.classList.add("show");

        setTimeout(() => {
            notice.classList.remove("show");
        }, 1200);
    },

    moveIndicator() {
        const active = document.querySelector(".mode-btn.active");
        const indicator = document.querySelector(".mode-indicator");

        if (!active || !indicator) return;

        indicator.style.width = active.offsetWidth + "px";
        indicator.style.left = active.offsetLeft + "px";
    }
}

/* =====================================================
   INIT
===================================================== */

document.addEventListener("DOMContentLoaded", () => {
    let startPicker;

    fetch("/api/get_planner_date")
        .then(res => res.json())
        .then(data => {
            startPicker = flatpickr("#startDate", {
                locale: flatpickr.l10ns.pl,
                dateFormat: "Y-m-d",
                defaultDate: data.start_date ? data.start_date : new Date(),
                allowInput: false,
                animate: true,
                onChange: function (selectedDates, dateStr) {
                    fetch("/api/save_planner_date", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({ start_date: dateStr })
                    });

                    Planner.renderPlanner();
                }
            });
            Planner.renderPlanner();
        });

    Promise.all([
        fetch("/api/meals").then(res => res.json()),
        fetch("/api/load_planner").then(res => res.json()),
        fetch("/api/products").then(res => res.json())
    ])
        .then(([mealsData, plannerSaved, productsData]) => {
            AppState.meals = mealsData;
            AppState.plannerData = plannerSaved;
            AppState.products = productsData;
            Planner.renderPlanner();
        });
});

window.addEventListener("load", UI.moveIndicator);
window.addEventListener("resize", UI.moveIndicator);