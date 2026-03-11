/* =====================================================
   STATE
===================================================== */

const DishesStateModal = {
    currentRating: 0,
    currentPerson: "osoba1",
    currentDay: 1,
    meals: [],
    products: [],
    selectedProductId: null,
    mealToDeleteId: null
};

const ModalShared = {
    async saveMeal() {
        const id = document.getElementById("mealId").value;
        const ingredientRows = $$(".ingredient-row");

        const ingredients = [];
        // let nextIngredientId = 1; // do generowania nowych id dla składników

        ingredientRows.forEach(row => {
            const name = row.querySelector(".ingredient-name").value.trim();
            const grams = row.querySelector(".ingredient-grams").value;

            if (name && grams) {
                // jeśli wiersz ma dataset.id używamy go, w przeciwnym razie generujemy nowe
                const ingId = Number(row.dataset.id);
                ingredients.push({ id: ingId, name, grams: Number(grams) });
            }
        });

        // pobierz zaznaczone dish
        const selectedDish = Array.from(
            $$("#dishSelection input[type='checkbox']:checked")
        ).map(cb => Number(cb.value));

        if (selectedDish.length === 0) {
            return alert("Wybierz przynajmniej jeden posiłek");
        }

        const selectedPerson = document.querySelector(
            "#mealPersonSelection input[name='mealPersonRadio']:checked"
        )?.value;

        const mealData = {
            name: document.getElementById("mealName").value,
            description: document.getElementById("mealDescription").value,
            ingredients: ingredients,
            person: selectedPerson,
            dish: selectedDish,
            rating: this.currentRating
        };

        try {
            await DishesAPI.saveMeal(id, mealData);
            Modal.closeModal();
            await Dishes.loadMeals();

            if (typeof Planner !== "undefined") {
                const meals = await fetch("/api/meals").then(r => r.json());
                AppState.meals = meals;
                Planner.renderPlanner();
            }
        } catch (err) {
            console.error(err);
            alert("Błąd zapisu");
        }
    },

    renderPersonSelection(selectedPerson = "osoba1") {

        const container = document.getElementById("mealPersonSelection");
        container.innerHTML = "";

        const persons = {
            osoba1: "Dawid",
            osoba2: "Kasia"
        };

        Object.entries(persons).forEach(([value, label]) => {

            const wrapper = document.createElement("label");
            wrapper.classList.add("dish-pill");

            const input = document.createElement("input");
            input.type = "radio";
            input.name = "mealPersonRadio";
            input.value = value;

            if (value === selectedPerson) {
                input.checked = true;
            }

            input.addEventListener("change", function () {
                this.renderDishSelection(this.value, []);
            });

            const span = document.createElement("span");
            span.textContent = label;

            wrapper.appendChild(input);
            wrapper.appendChild(span);
            container.appendChild(wrapper);
        });
    },

    renderDishSelection(person, selected = []) {

        const container = document.getElementById("dishSelection");
        container.innerHTML = "";

        const config = DISH_CONFIG[person];
        if (!config) return;

        Object.entries(config).forEach(([value, label]) => {

            const wrapper = document.createElement("label");
            wrapper.classList.add("dish-pill");

            const input = document.createElement("input");
            input.type = "checkbox";
            input.value = value;

            if (selected.includes(Number(value))) {
                input.checked = true;
            }

            const span = document.createElement("span");
            span.textContent = label;

            wrapper.appendChild(input);
            wrapper.appendChild(span);
            container.appendChild(wrapper);
        });
    },

    renderStars(rating) {
        this.currentRating = rating;

        const stars = $$("#mealRating span");

        stars.forEach(star => {
            const value = Number(star.dataset.value);

            star.classList.remove("hovered");

            if (value <= rating) {
                star.classList.add("filled");
            } else {
                star.classList.remove("filled");
            }
        });
    },

    addIngredientField(name = "", grams = "", id = null) {
        const container = document.getElementById("ingredientsContainer");

        // jeśli id nie podane, generujemy tymczasowe
        const ingId = id || Date.now() + Math.floor(Math.random() * 1000);

        const row = document.createElement("div");
        row.className = "ingredient-row";
        row.dataset.id = ingId;

        row.innerHTML = `
            <input type="text" class="ingredient-name" id="ingredient-name-${ingId}" name="ingredient-name-${ingId}" placeholder="Nazwa składnika" value="${name}">
            <input type="number" class="ingredient-grams"
                id="ingredient-grams-${ingId}"
                name="ingredient-grams-${ingId}"
                placeholder="g"
                value="${grams}"
                oninput="ModalShared.calculateMacrosFromInputs()">
            <button type="button" class="brn ingredient-delete"
                onclick="this.parentElement.remove(); ModalShared.calculateMacrosFromInputs();">✕</button>
        `;

        container.appendChild(row);
        ModalShared.calculateMacrosFromInputs();
    },

    calculateMacrosFromInputs() {

        const rows = $$(".ingredient-row");

        const ingredients = [];

        rows.forEach(row => {

            const grams = Number(row.querySelector(".ingredient-grams").value);
            const id = Number(row.dataset.id);

            if (!grams || !id) return;

            ingredients.push({
                id: id,
                grams: grams
            });

        });

        // 🔥 wybierz właściwą listę produktów
        let products = [];

        if (typeof AppState !== "undefined") {
            products = AppState.products;
        } else if (typeof DishesState !== "undefined") {
            products = DishesState.products;
        }

        const macros = Macro.calculate(
            ingredients,
            products,
            1
        );

        Macro.render("mealMacrosEdit", macros);

    }
}

