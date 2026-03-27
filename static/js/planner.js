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
    currentMealOptions: [],

    hasUnsavedChanges: false,
    pendingNavigation: null,

    // planner snapshow 
    originalPlannerData: null,
};

let DragState = {
    from: null
};

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

        showSaveNoticeGlobal();

    } catch {
        showErrorNotice("Błąd zapisu");
    }
}

/* =====================================================
   PLANNER LOGIC
===================================================== */

const Planner = {
    openUnsavedModal(targetUrl) {

        AppState.pendingNavigation = targetUrl;

        const modal = document.getElementById("unsavedChangesModal");
        modal.classList.add("show");
    },
    markAsChanged() {
        AppState.hasUnsavedChanges = true;

        const btnSave = $("savePlannerBtn");
        if (btnSave) {
            btnSave.style.display = "inline-block";
            btnSave.classList.add("unsaved");
        }

        const btnDiscard = $("discardPlannerBtn");
        if (btnDiscard) {
            btnDiscard.style.display = "inline-block";
            btnDiscard.classList.add("unsaved");
        }

        UI.showUnsavedIndicator();
    },

    renderPlanner() {
        const startDateInput = $("startDate").value;
        if (!startDateInput) return;

        const startDate = new Date(startDateInput);
        const grid = $("plannerGrid");
        grid.innerHTML = "";

        const maxDishes = AppState.currentPerson === "osoba1" ? AppState.config.defaultDaysToRender : 5;
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
        for (let row = 0; row < 5; row++) {
            const d = new Date(startDate);
            d.setDate(d.getDate() + row);

            const dateStr = d.toLocaleDateString('sv-SE');
            const today = new Date().toLocaleDateString('sv-SE');
            const isToday = dateStr === today;

            const macros = this.calculateDayMacros(dateStr);

            const dateCell = document.createElement("div");
            dateCell.className = "cell date-cell";

            dateCell.addEventListener("contextmenu", (e) => {
                e.preventDefault();

                Planner.openCopyDayMenu(e, dateStr);
            });

            dateCell.innerHTML = `
                <div class="date-label">
                    ${d.toLocaleDateString('pl-PL', { weekday: 'short', day: 'numeric', month: 'numeric' })}
                </div>

                <div class="date-kcal">
                    ${Math.round(macros.kcal)} kcal
                </div>

                <div class="date-macros">
                    <span class="macro-protein">B ${macros.b.toFixed(0)}</span>
                    <span class="macro-carbs">W ${macros.w.toFixed(0)}</span>
                    <span class="macro-fat">T ${macros.t.toFixed(0)}</span>
                </div>
            `;

            if (isToday) dateCell.classList.add("today-row");

            grid.appendChild(dateCell);

            for (let dish = 1; dish <= maxDishes; dish++) {
                const entry = AppState.plannerData[AppState.currentPerson][dateStr]?.[dish];

                let mealId = null;
                let eaten = false;

                if (typeof entry === "object") {
                    mealId = entry.meal;
                    eaten = entry.eaten === true;
                } else {
                    mealId = entry;
                }

                const meal = AppState.mealsById[mealId];
                const cell = UI.createCell("", "cell");

                cell.dataset.date = dateStr;
                cell.dataset.dish = dish;

                cell.addEventListener("dragover", (e) => {
                    if (!AppState.isEditMode) return;
                    e.preventDefault();
                    cell.classList.add("drag-over");
                });

                cell.addEventListener("dragleave", () => {
                    cell.classList.remove("drag-over");
                });

                cell.addEventListener("drop", (e) => {
                    e.preventDefault();
                    cell.classList.remove("drag-over");

                    if (!AppState.isEditMode) return;
                    if (!DragState.from) return;

                    const to = {
                        date: cell.dataset.date,
                        dish: parseInt(cell.dataset.dish)
                    };

                    if (DragState.from.date === to.date && DragState.from.dish === to.dish) {
                        return;
                    }

                    Planner.swapMeals(DragState.from, to);
                    DragState.from = null;
                });

                if (isToday) cell.classList.add("today-row");

                if (meal) {
                    if (meal && AppState.isEditMode) {
                        cell.setAttribute("draggable", true);

                        cell.addEventListener("dragstart", () => {
                            DragState.from = {
                                date: dateStr,
                                dish: dish
                            };
                            cell.classList.add("dragging");
                        });

                        cell.addEventListener("dragend", () => {
                            cell.classList.remove("dragging");
                        });
                    }
                    if (!AppState.isEditMode) {

                        const checkbox = document.createElement("input");
                        checkbox.type = "checkbox";
                        checkbox.className = "meal-checkbox";
                        checkbox.checked = eaten;

                        checkbox.onclick = (e) => {
                            e.stopPropagation();

                            Planner.toggleEaten(dateStr, dish, checkbox.checked);

                            // 🔥 natychmiastowa aktualizacja przekreślenia
                            if (checkbox.checked) {
                                nameSpan.classList.add("meal-eaten");
                            } else {
                                nameSpan.classList.remove("meal-eaten");
                            }
                        };

                        cell.appendChild(checkbox);
                    }

                    const nameSpan = document.createElement("span");
                    nameSpan.textContent = meal.name;

                    if (eaten) {
                        nameSpan.classList.add("meal-eaten");
                    }

                    cell.appendChild(nameSpan);

                } else {
                    cell.textContent = "-";
                }

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

    openCopyDayMenu(e, dateStr) {

        // usuń stare menu jeśli istnieje
        const oldMenu = document.getElementById("dayContextMenu");
        if (oldMenu) oldMenu.remove();

        const menu = document.createElement("div");
        menu.id = "dayContextMenu";
        menu.className = "context-menu";

        menu.innerHTML = `
        <div class="context-item">📋 Kopiuj dzień</div>
    `;

        menu.style.top = e.pageY + "px";
        menu.style.left = e.pageX + "px";

        document.body.appendChild(menu);

        // klik w opcję
        menu.onclick = () => {
            menu.remove();
            Planner.openCopyDayModal(dateStr);
        };

        // klik gdziekolwiek zamyka menu
        document.addEventListener("click", () => menu.remove(), { once: true });
    },

    openCopyDayModal(dateStr) {

    $("copyFromDate").value = dateStr;

    flatpickr("#copyToDate", {
        locale: flatpickr.l10ns.pl,
        dateFormat: "Y-m-d",
        defaultDate: dateStr
    });

    $("copyDayModal").classList.add("show");
},

confirmCopyDay() {

    const fromDate = $("copyFromDate").value;
    const toDate = $("copyToDate").value;

    if (!fromDate || !toDate) return;

    const sourceDay = AppState.plannerData[AppState.currentPerson][fromDate];

    if (!sourceDay) {
        alert("Brak danych do skopiowania");
        return;
    }

    // głęboka kopia
    const copiedDay = JSON.parse(JSON.stringify(sourceDay));

    AppState.plannerData[AppState.currentPerson][toDate] = copiedDay;

    closeModalElement($("copyDayModal"));

    this.renderPlanner();
    this.markAsChanged();
},

    savePlannerMeal(mealId) {
        const dish = parseInt($("cellDish").value);
        const dateStr = $("cellDate").value;

        if (!AppState.plannerData[AppState.currentPerson][dateStr])
            AppState.plannerData[AppState.currentPerson][dateStr] = {};

        AppState.plannerData[AppState.currentPerson][dateStr][dish] = {
            meal: mealId,
            eaten: false
        };

        Modal.closePlannerMealModal();
        this.renderPlanner();
        this.markAsChanged();
        // savePlanner();
    },

    removeMeal(dateStr, dish) {
        if (AppState.plannerData[AppState.currentPerson][dateStr] && AppState.plannerData[AppState.currentPerson][dateStr][dish]) {
            delete AppState.plannerData[AppState.currentPerson][dateStr][dish];

            if (Object.keys(AppState.plannerData[AppState.currentPerson][dateStr]).length === 0) {
                delete AppState.plannerData[AppState.currentPerson][dateStr];
            }
        }

        this.renderPlanner();
        this.markAsChanged();
        // savePlanner();
        // UI.showSaveNoticeGlobal();
    },

    setPerson(person, el) {
        AppState.currentPerson = person;
        $$("#personTabs .tab").forEach(t => t.classList.remove("active"));
        el.classList.add("active");
        this.renderPlanner();
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
            const entry = AppState.plannerData[AppState.currentPerson][dateStr]?.[dish];
            const mealId = typeof entry === "object" ? entry.meal : entry;
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



    setMode(edit, el) {
        AppState.isEditMode = edit;

        // AppState.currentPerson = person;
        // $$("#plannerMode .tab").forEach(t => t.classList.remove("active"));
        // el.classList.add("active");
        // this.renderPlanner();

        $$("#plannerMode .tab")
            .forEach(t => t.classList.remove("active"));

        el.classList.add("active");

        // 🔥 pokazuj/ukrywaj przycisk zapisu
        // const saveBtn = $("savePlannerBtn");
        // if (edit) {
        //     saveBtn.style.display = "inline-block";
        // } else {
        //     saveBtn.style.display = "none";
        // }

        UI.moveIndicator();
        this.renderPlanner();
    },

    calculateDayMacros(dateStr) {

        const day = AppState.plannerData[AppState.currentPerson][dateStr];
        if (!day) {
            return { kcal: 0, b: 0, t: 0, w: 0 };
        }

        let totals = { kcal: 0, b: 0, t: 0, w: 0 };

        Object.values(day).forEach(entry => {

            const mealId = typeof entry === "object" ? entry.meal : entry;

            const meal = AppState.mealsById[mealId];
            if (!meal) return;

            const macros = Macro.calculate(
                meal.ingredients,
                AppState.products,
                1
            );

            totals.kcal += macros.kcal;
            totals.b += macros.b;
            totals.t += macros.t;
            totals.w += macros.w;

        });

        return totals;
    },

    async manualSave() {
        await savePlanner();

        AppState.originalPlannerData = JSON.parse(
            JSON.stringify(AppState.plannerData)
        );

        AppState.hasUnsavedChanges = false;

        const btnbtnSave = $("savePlannerBtn");
        if (btnbtnSave) {
            btnbtnSave.classList.remove("unsaved");
            btnbtnSave.style.display = "none";
        }

        const btnDiscard = $("discardPlannerBtn");
        if (btnDiscard) btnDiscard.style.display = "none";

        UI.hideUnsavedIndicator();
    },


    async discardSave() {
        AppState.plannerData = JSON.parse(
            JSON.stringify(AppState.originalPlannerData)
        );

        AppState.hasUnsavedChanges = false;

        Planner.renderPlanner();

        const btnSave = $("savePlannerBtn");
        const btnDiscard = $("discardPlannerBtn");

        if (btnSave) btnSave.style.display = "none";
        if (btnDiscard) btnDiscard.style.display = "none";

        UI.hideUnsavedIndicator();
    },

    checkForChanges() {
        return AppState.hasUnsavedChanges;
    },

    toggleEaten(dateStr, dish, checked) {

        const day = AppState.plannerData[AppState.currentPerson][dateStr];

        if (!day || !day[dish]) return;

        let entry = day[dish];

        // jeśli stary format (tylko id)
        if (typeof entry === "number") {
            entry = {
                meal: entry,
                eaten: checked
            };
        } else {
            entry.eaten = checked;
        }
        day[dish] = entry;

        Planner.markAsChanged();
        // Planner.renderPlanner(); // 🔥 odśwież UI
    },

    getMealEntry(dateStr, dish) {
        return AppState.plannerData[AppState.currentPerson][dateStr]?.[dish] || null;
    },

    setMealEntry(dateStr, dish, entry) {
        if (!AppState.plannerData[AppState.currentPerson][dateStr]) {
            AppState.plannerData[AppState.currentPerson][dateStr] = {};
        }

        if (entry === null) {
            delete AppState.plannerData[AppState.currentPerson][dateStr][dish];

            if (Object.keys(AppState.plannerData[AppState.currentPerson][dateStr]).length === 0) {
                delete AppState.plannerData[AppState.currentPerson][dateStr];
            }
        } else {
            AppState.plannerData[AppState.currentPerson][dateStr][dish] = entry;
        }
    },

    swapMeals(from, to) {
        const entryA = this.getMealEntry(from.date, from.dish);
        const entryB = this.getMealEntry(to.date, to.dish);

        this.setMealEntry(from.date, from.dish, entryB);
        this.setMealEntry(to.date, to.dish, entryA);

        this.renderPlanner();
        this.markAsChanged();
    }
}

/* =====================================================
   MEAL DESCRIPTION MODAL
===================================================== */

const DescriptionModal = {
    calculateMacros() {

        const macros = Macro.calculate(
            AppState.baseIngredients,
            AppState.products,
            AppState.currentPortionMultiplier
        );

        Macro.render("mealMacros", macros);

    },

    openDescriptionModal(meal) {
        AppState.currentPreviewMeal = meal;

        const editBtn = $("editMealFromPreviewBtn");
        editBtn.style.display = "inline-flex";

        editBtn.onclick = () => {
            Modal.closeDescriptionModal();
            MealModal.openMealEditModalFromPlanner(AppState.currentPreviewMeal);
        };
        // $("descriptionTitle").textContent = meal.name;
        console.log(meal.rating)
        console.log(meal.name)
        $("descriptionTitle").innerHTML = `
            <div class="meal-tile-content">
                <div class="meal-rating">
                    ${UI.generateStaticStars(meal.rating || 0)}
                </div>
                <div class="meal-name">${meal.name}</div>
            </div>
        `;

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
                // console.log(iloscJednostek)
                iloscJednostek = Number.isInteger(iloscJednostek)
                    ? iloscJednostek
                    : iloscJednostek.toFixed(2);

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
        left.innerHTML = `
            <div id="mealMacros" class="macro-preview"></div>
            ${ingredientsHTML}
        `;
        DescriptionModal.calculateMacros();
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

        ModalShared.renderPersonSelection(meal.person);
        ModalShared.renderDishSelection(meal.person, meal.dish || []);

        ModalShared.renderStars(meal.rating || 0);

        const container = $("ingredientsContainer");
        container.innerHTML = "";

        if (meal.ingredients && Array.isArray(meal.ingredients)) {
            meal.ingredients.forEach(ing => {
                ModalShared.addIngredientField(ing.name, ing.grams, ing.id);
            });
            ModalShared.calculateMacrosFromInputs();
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
    showUnsavedIndicator() {
        let indicator = document.querySelector(".unsaved-indicator");

        if (!indicator) {
            indicator = document.createElement("div");
            indicator.className = "unsaved-indicator";
            indicator.textContent = "Masz niezapisane zmiany";
            document.body.appendChild(indicator);
        }

        indicator.classList.add("show");
    },

    hideUnsavedIndicator() {
        const indicator = document.querySelector(".unsaved-indicator");
        if (indicator) {
            indicator.classList.remove("show");
        }
    },
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
            AppState.originalPlannerData = JSON.parse(JSON.stringify(plannerSaved));
            AppState.products = productsData;
            Planner.renderPlanner();
        });
});

window.addEventListener("load", UI.moveIndicator);
window.addEventListener("resize", UI.moveIndicator);
window.addEventListener("beforeunload", function (e) {
    if (AppState.hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
    }
});
document.addEventListener("DOMContentLoaded", () => {

    const saveBtn = document.getElementById("saveAndLeaveBtn");
    const discardBtn = document.getElementById("discardAndLeaveBtn");
    const stayBtn = document.getElementById("stayOnPageBtn");

    if (!saveBtn) return; // zabezpieczenie gdy nie jesteśmy na plannerze

    saveBtn.addEventListener("click", async () => {

        await Planner.manualSave();

        window.location.href = AppState.pendingNavigation;
    });

    discardBtn.addEventListener("click", () => {
        AppState.hasUnsavedChanges = false;
        window.location.href = AppState.pendingNavigation;
    });

    stayBtn.addEventListener("click", () => {

        const modal = document.getElementById("unsavedChangesModal");
        modal.classList.remove("show");

        AppState.pendingNavigation = null;
    });
});
document.addEventListener("DOMContentLoaded", () => {

    $$(".nav-link").forEach(link => {
        link.addEventListener("click", function (e) {

            // tylko jeśli jesteśmy na plannerze
            const isPlanner =
                window.location.pathname === "/" ||
                window.location.pathname.includes("planner");

            if (!isPlanner) return;

            if (AppState.hasUnsavedChanges) {
                e.preventDefault();
                Planner.openUnsavedModal(this.href);
            }
        });
    });
});