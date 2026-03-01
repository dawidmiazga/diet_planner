// const state = {
//     meals: [],
//     products: [],
//     plannerData: { osoba1: {}, osoba2: {} },
//     currentPerson: "osoba1",
//     isEditMode: false,
//     selectedRatingFilter: 0,
//     currentPreviewMeal: null,
//     portionMultiplier: 1,
//     baseIngredients: []
// };

let currentPreviewMeal = null;
let selectedRatingFilter = 0;
let currentPerson = "osoba1";
let meals = [];
let products = [];
let currentPortionMultiplier = 1.0;
let baseIngredients = [];
let plannerData = { "osoba1": {}, "osoba2": {} };
let isEditMode = false;  // Domyślnie tryb podglądu

function setBaseIngredients(ingredients) {
    baseIngredients = ingredients; 
    currentPortionMultiplier = 1.0;
    renderScaledIngredients();
}

function setMode(edit, el) {
    isEditMode = edit;

    document.querySelectorAll(".mode-btn")
        .forEach(btn => btn.classList.remove("active"));

    el.classList.add("active");

    moveIndicator();
    renderPlanner();
}

function moveIndicator() {
    const active = document.querySelector(".mode-btn.active");
    const indicator = document.querySelector(".mode-indicator");

    if (!active || !indicator) return;

    indicator.style.width = active.offsetWidth + "px";
    indicator.style.left = active.offsetLeft + "px";
}

window.addEventListener("load", moveIndicator);
window.addEventListener("resize", moveIndicator);

function changePortion(step) {
    let newValue = currentPortionMultiplier + step;

    if (newValue < 0.5) return;

    currentPortionMultiplier = Math.round(newValue * 10) / 10;
    // document.getElementById("portionValue").innerText = currentPortionMultiplier.toFixed(1);

    renderScaledIngredients();
}

function renderScaledIngredients() {

    const left = document.getElementById("mealDescriptionLeft");

    let ingredientsHTML = `
        <div class="ingredients-title-row">
            <h4>Składniki</h4>

            <div class="portion-multiplier">

                <button type="button" onclick="changePortion(-0.5)">
                    <svg viewBox="0 0 24 24">
                        <rect x="5" y="11" width="14" height="2" rx="1"></rect>
                    </svg>
                </button>

                <span id="portionValue">${currentPortionMultiplier.toFixed(1)}</span>

                <button type="button" onclick="changePortion(0.5)">
                    <svg viewBox="0 0 24 24">
                        <rect x="5" y="11" width="14" height="2" rx="1"></rect>
                        <rect x="11" y="5" width="2" height="14" rx="1"></rect>
                    </svg>
                </button>

            </div>
        </div>
    `;

    ingredientsHTML += `<div class="ingredients-display-list">`;

    baseIngredients.forEach(ingredient => {

        const product = products.find(p => p.id === ingredient.id);

        const scaledGrams = ingredient.grams * currentPortionMultiplier;

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
        <div class="ingredient-display-row" onclick="toggleIngredient(this)">
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
}


function renderPlanner() {
    const startDateInput = document.getElementById("startDate").value;
    if (!startDateInput) return;

    const startDate = new Date(startDateInput);
    const grid = document.getElementById("plannerGrid");
    grid.innerHTML = "";

    const maxDishes = currentPerson === "osoba1" ? 5 : 4;
    grid.style.gridTemplateColumns = `150px repeat(${maxDishes}, 1fr)`;

    // nagłówki kolumn
    grid.appendChild(createHeaderCell("Data"));
    for (let dish = 1; dish <= maxDishes; dish++) {
        grid.appendChild(createHeaderCell(DISH_CONFIG[currentPerson][dish]));
    }
    // 
    // wiersze = daty
    for (let row = 0; row < 5; row++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + row);
        const dateStr = d.toISOString().split('T')[0];

        // komórka daty
        grid.appendChild(createCell(d.toLocaleDateString('pl-PL', { weekday: 'short', day: 'numeric', month: 'numeric' })));

        for (let dish = 1; dish <= maxDishes; dish++) {
            const mealId = plannerData[currentPerson][dateStr]?.[dish] || "";
            const meal = meals.find(m => m.id === mealId);
            const cellText = meal ? meal.name : "-";

            const cell = createCell(cellText, "cell");

            // kliknięcie w komórkę otwiera popup tylko jeśli jest danie
            cell.onclick = () => openMealModal(dateStr, dish);

            // dodajemy przycisk X tylko jeśli jest wybrane danie i tylko w trybie edycji
            if (meal && isEditMode) {
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
                    removeMeal(dateStr, dish);
                };

                cell.appendChild(removeBtn);
            }
            grid.appendChild(cell);
        }
    }
}

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

                    renderPlanner();
                }
            });

            renderPlanner();
        });


    Promise.all([
        fetch("/api/meals").then(res => res.json()),
        fetch("/api/load_planner").then(res => res.json()),
        fetch("/api/products").then(res => res.json())
    ])
        .then(([mealsData, plannerSaved, productsData]) => {
            meals = mealsData;
            plannerData = plannerSaved;
            products = productsData;
            renderPlanner();
        });

});


function savePlannerMeal(mealId) {
    const dish = parseInt(document.getElementById("cellDish").value);
    const dateStr = document.getElementById("cellDate").value;

    if (!plannerData[currentPerson][dateStr])
        plannerData[currentPerson][dateStr] = {};

    plannerData[currentPerson][dateStr][dish] = mealId;

    closePlannerMealModal();
    renderPlanner();

    // 🔥 AUTO ZAPIS
    fetch("/api/save_planner", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(plannerData)
    });

    showSaveNoticeGlobal();
}

function setPerson(person, el) {
    currentPerson = person;
    document.querySelectorAll("#personTabs .tab").forEach(t => t.classList.remove("active"));
    el.classList.add("active");
    renderPlanner();
}

function removeMeal(dateStr, dish) {
    if (plannerData[currentPerson][dateStr] && plannerData[currentPerson][dateStr][dish]) {
        delete plannerData[currentPerson][dateStr][dish];

        if (Object.keys(plannerData[currentPerson][dateStr]).length === 0) {
            delete plannerData[currentPerson][dateStr];
        }
    }

    renderPlanner();

    // auto zapis
    fetch("/api/save_planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(plannerData)
    });

    showSaveNoticeGlobal();
}

// nowa funkcja do nagłówków z klasą osoby
function createHeaderCell(text) {
    const div = document.createElement("div");
    div.className = "header " + (currentPerson === "osoba1" ? "header-osoba1" : "header-osoba2");
    div.textContent = text;
    return div;
}

// funkcja uniwersalna dla zwykłych komórek
function createCell(text, cls = "cell") {
    const div = document.createElement("div");
    div.className = cls;
    div.textContent = text;
    return div;
}
function openDescriptionModal(meal) {
    currentPreviewMeal = meal;

    const editBtn = document.getElementById("editMealFromPreviewBtn");
    editBtn.style.display = "inline-flex";

    editBtn.onclick = function () {
        closeDescriptionModal();
        openMealEditModalFromPlanner(currentPreviewMeal);
    };

    document.getElementById("descriptionTitle").textContent = meal.name;

    const left = document.getElementById("mealDescriptionLeft");
    const right = document.getElementById("mealDescriptionRight");

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
            <div class="step-display-row" onclick="toggleStep(this)">
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

    setBaseIngredients(meal.ingredients);

    document.getElementById("mealDescriptionModal").classList.add("show");
}

function openMealEditModalFromPlanner(meal) {

    if (!meal) return;

    document.getElementById("mealId").value = meal.id;
    document.getElementById("mealName").value = meal.name;
    document.getElementById("mealDescription").value = meal.description;

    renderPersonSelection(meal.person);
    updateDishSelectionForModal(meal.person, meal.dish || []);

    renderStars(meal.rating || 0);

    const container = document.getElementById("ingredientsContainer");
    container.innerHTML = "";

    if (meal.ingredients && Array.isArray(meal.ingredients)) {
        meal.ingredients.forEach(ing => {
            addIngredientField(ing.name, ing.grams, ing.id);
        });
    }

    document.getElementById("editModalTitleMeal").textContent = "Edytuj danie";
    document.getElementById("deleteMealBtn").style.display = "inline-block";

    document.getElementById("mealModal").classList.add("show");
}

function toggleIngredient(element) {
    element.classList.toggle("checked");
}

function closeDescriptionModal() {

    const editBtn = document.getElementById("editMealFromPreviewBtn");
    editBtn.style.display = "none";

    document.getElementById("mealDescriptionModal").classList.remove("show");

    currentPortionMultiplier = 1.0;
    baseIngredients = [];

    const portionEl = document.getElementById("portionValue");
    if (portionEl) portionEl.innerText = "1.0";
}

// zamknięcie po kliknięciu w tło

function toggleStep(element) {
    element.classList.toggle("checked");
}

function generateStaticStars(rating) {
    let starsHTML = "";

    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            starsHTML += '<span class="static-star filled"></span>';
        } else {
            starsHTML += '<span class="static-star"></span>';
        }
    }

    return starsHTML;
}

function initRatingFilter() {
    const container = document.getElementById("ratingFilter");
    container.innerHTML = "";

    for (let i = 1; i <= 5; i++) {
        const star = document.createElement("span");
        star.className = "filter-star";

        if (i <= selectedRatingFilter) {
            star.classList.add("active");
        }

        star.onclick = () => {
            selectedRatingFilter = i;
            initRatingFilter();
            renderMealTiles(document.getElementById("mealSearch").value);
        };

        container.appendChild(star);
    }

    document.getElementById("clearRatingFilter").onclick = () => {
        selectedRatingFilter = 0;
        initRatingFilter();
        renderMealTiles(document.getElementById("mealSearch").value);
    };
}

function openMealModal(dateStr, dish) {
    // Jeśli edytujemy, to otwiera się modal z wyborem dania
    if (isEditMode) {
        document.getElementById("cellDish").value = dish;
        document.getElementById("cellDate").value = dateStr;
        selectedRatingFilter = 0;
        initRatingFilter();

        const container = document.getElementById("mealTiles");
        container.innerHTML = "";
        window.currentMealOptions = meals
            .filter(m =>
                m.person === currentPerson &&
                Array.isArray(m.dish) &&
                m.dish.includes(Number(dish))
            )
            .sort((a, b) =>
                a.name.localeCompare(b.name, 'pl', { sensitivity: 'base' })
            );

        window.currentSelectedMealId =
            plannerData[currentPerson][dateStr]?.[dish] || null;

        renderMealTiles();

        document.getElementById("plannerMealModal").classList.add("show");

        const searchInput = document.getElementById("mealSearch");
        searchInput.value = "";

        setTimeout(() => {
            searchInput.focus();
        }, 220);

        searchInput.oninput = (e) => {
            renderMealTiles(e.target.value);
        };
    } else {
        // Jeśli podgląd, to wyświetl opis i składniki dania
        const mealId = plannerData[currentPerson][dateStr]?.[dish];
        const meal = meals.find(m => m.id === mealId);

        if (meal) {
            openDescriptionModal(meal);
        }
    }
}


function renderMealTiles(filterText = "") {

    const container = document.getElementById("mealTiles");

    if (!window.currentMealOptions) return;

    container.innerHTML = "";

    const filteredOptions = window.currentMealOptions
        .filter(m =>
            m.name.toLowerCase().includes(filterText.toLowerCase())
        )
        .filter(m =>
            selectedRatingFilter === 0
                ? true
                : (m.rating || 0) === selectedRatingFilter
        );

    if (filteredOptions.length === 0) {
        container.innerHTML = "<p>Brak dań pasujących do wyszukiwania</p>";
    } else {
        filteredOptions.forEach(m => {
            const tile = document.createElement("div");
            tile.className = "meal-tile";

            if (m.id === window.currentSelectedMealId) {
                tile.classList.add("selected");
            }

            tile.innerHTML = `
                <div class="meal-tile-content">
                    <div class="meal-rating">
                        ${generateStaticStars(m.rating || 0)}
                    </div>
                    <div class="meal-name">${m.name}</div>
                </div>
            `;

            tile.onclick = () => savePlannerMeal(m.id);
            container.appendChild(tile);
        });
    }
}

function closePlannerMealModal() {
    const modal = document.getElementById("plannerMealModal");
    closeModalElement(modal);
}

function showSaveNoticeGlobal() {
    // sprawdź, czy już istnieje
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
}
