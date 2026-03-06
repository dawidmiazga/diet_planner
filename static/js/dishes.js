/* =====================================================
   STATE
===================================================== */

const DishesState = {
    currentRating: 0,
    currentPerson: "osoba1",
    currentDay: 1,
    meals: [],
    products: [],
    selectedProductId: null,
    mealToDeleteId: null
};

/* =====================================================
   API
===================================================== */

const DishesAPI = {

    async fetchMeals() {
        const data = await API.get("/api/meals");
        DishesState.meals = data;
        return data;
    },

    async saveMeal(id, mealData) {
        if (id) {
            return API.put(`/api/meals/${id}`, mealData);
        }
        return API.post("/api/meals", mealData);
    },

    async deleteMeal(id) {
        return API.delete(`/api/meals/${id}`);
    },

    async fetchProducts() {
        return API.get("/api/products");
    }
};

/* =====================================================
   UI
===================================================== */

const DishesUI = {
    renderProductList(products) {
        const list = document.getElementById("productsList");
        list.innerHTML = "";

        products.forEach(p => {
            const item = document.createElement("div");
            item.className = "product-item";
            item.innerText = p.nazwa_produktu;
            item.dataset.id = p.id;
            item.dataset.name = p.nazwa_produktu;

            item.addEventListener("click", () => {
                DishesState.selectedProductId = p.id;

                document.querySelectorAll("#productsList .product-item")
                    .forEach(el => el.style.background = "transparent");

                item.style.background = "#e5e7eb";
            });

            list.appendChild(item);
        });
    },
    renderStars(rating) {
        DishesState.currentRating = rating;

        const stars = document.querySelectorAll("#mealRating span");

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

    updateDayTabs() {
        const container = document.getElementById("dayTabs");
        container.innerHTML = "";

        const isDawid = DishesState.currentPerson === "osoba1";
        const count = isDawid ? 5 : 4;

        for (let i = 1; i <= count; i++) {
            const tab = document.createElement("div");
            tab.className = "tab";
            if (i === 1) tab.classList.add("active");

            tab.textContent = DISH_CONFIG[DishesState.currentPerson][i];
            tab.onclick = function () {
                Dishes.setDay(i, this);
            };

            container.appendChild(tab);
        }
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
            <input type="number" class="ingredient-grams" id="ingredient-grams-${ingId}" name="ingredient-grams-${ingId}" placeholder="g" value="${grams}">
            <button type="button" class="brn ingredient-delete" onclick="this.parentElement.remove()">×</button>
        `;

        container.appendChild(row);
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

    renderMeals() {
        const grid = document.getElementById("mealsGrid");
        grid.innerHTML = "";

        const searchText = document.getElementById("mealFilterInput")?.value.toLowerCase() || "";

        const filtered = DishesState.meals.filter(m =>
            m.person === DishesState.currentPerson &&
            Array.isArray(m.dish) &&
            m.dish.includes(Number(DishesState.currentDay)) &&
            m.name.toLowerCase().includes(searchText)
        );

        filtered.sort((a, b) =>
            a.name.localeCompare(b.name, 'pl', { sensitivity: 'base' })
        );

        if (!filtered.length) {
            grid.innerHTML = "<p>Brak dań</p>";
            return;
        }

        let currentLetter = "";

        filtered.forEach(m => {
            const firstLetter = m.name.charAt(0).toUpperCase();

            if (firstLetter !== currentLetter) {
                currentLetter = firstLetter;

                const separator = document.createElement("div");
                separator.className = "letter-separator";
                separator.innerText = currentLetter;

                grid.appendChild(separator);
            }

            const card = document.createElement("div");
            card.className = "card";

            card.innerHTML = `<strong>${m.name}</strong>
                                <div class="meal-rating">
                                    ${DishesUI.generateStaticStars(m.rating || 0)}
                                </div>`;

            card.onclick = () => Dishes.openModal(m);

            grid.appendChild(card);
        });

    },

    animateGrid() {
        const grid = document.getElementById("mealsGrid");

        grid.classList.add("grid-fade-out");

        setTimeout(() => {
            DishesUI.renderMeals();
            grid.classList.remove("grid-fade-out");
            grid.classList.add("grid-fade-in");

            setTimeout(() => {
                grid.classList.remove("grid-fade-in");
            }, 200);

        }, 150);
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
                DishesUI.renderDishSelection(this.value, []);
            });

            const span = document.createElement("span");
            span.textContent = label;

            wrapper.appendChild(input);
            wrapper.appendChild(span);
            container.appendChild(wrapper);
        });
    },

    highlightStars(rating) {
        const stars = document.querySelectorAll("#mealRating span");

        stars.forEach(star => {
            const value = Number(star.dataset.value);

            if (value <= rating) {
                star.classList.add("hovered");
            } else {
                star.classList.remove("hovered");
            }
        });
    }
}

/* =====================================================
   DISHES LOGIC
===================================================== */

const Dishes = {
    setPerson(person, el) {
        DishesState.currentPerson = person;

        document.querySelectorAll("#personTabs .tab")
            .forEach(t => t.classList.remove("active"));

        el.classList.add("active");

        DishesState.currentDay = 1;

        DishesUI.updateDayTabs();

        const firstDayTab = document.querySelector("#dayTabs .tab");
        if (firstDayTab) {
            document.querySelectorAll("#dayTabs .tab")
                .forEach(t => t.classList.remove("active"));

            firstDayTab.classList.add("active");
        }

        DishesUI.animateGrid();
        DishesUI.renderDishSelection([]);
    },

    setDay(day, el) {
        DishesState.currentDay = day;

        document.querySelectorAll("#dayTabs .tab")
            .forEach(t => t.classList.remove("active"));

        el.classList.add("active");

        DishesUI.animateGrid();
    },

    async loadMeals() {
        await DishesAPI.fetchMeals();
        DishesUI.renderMeals();
    },

    openModal(meal) {
        document.getElementById("mealId").value = meal.id;
        document.getElementById("mealName").value = meal.name;
        document.getElementById("mealDescription").value = meal.description;
        DishesUI.renderPersonSelection(meal.person);
        DishesUI.renderDishSelection(meal.person, meal.dish || []);
        if (!meal.rating) {
            meal.rating = 0;
        }
        DishesUI.renderStars(meal.rating);

        const container = document.getElementById("ingredientsContainer");
        container.innerHTML = "";

        if (meal.ingredients && Array.isArray(meal.ingredients)) {
            meal.ingredients.forEach(ing => {
                DishesUI.addIngredientField(ing.name, ing.grams, ing.id);
            });
        }

        document.getElementById("editModalTitleMeal").textContent = "Edytuj danie";
        document.getElementById("deleteMealBtn").style.display = "inline-block";
        document.getElementById("mealModal").classList.add("show");
    },

    openAddForm() {
        document.getElementById("mealId").value = "";
        document.getElementById("mealName").value = "";
        document.getElementById("mealDescription").value = "";
        DishesUI.renderPersonSelection(DishesState.currentPerson);
        DishesUI.renderDishSelection(DishesState.currentPerson, []);

        const container = document.getElementById("ingredientsContainer");
        container.innerHTML = "";

        document.getElementById("editModalTitleMeal").textContent = "Dodaj danie";
        document.getElementById("deleteMealBtn").style.display = "none";
        document.getElementById("mealModal").classList.add("show");

        DishesUI.renderStars(0);
    },

    // closeModal() {
    //     const modal = document.getElementById("mealModal");

    //     modal.classList.add("closing");

    //     setTimeout(() => {
    //         modal.classList.remove("show");
    //         modal.classList.remove("closing");
    //     }, 200);
    // },

    async saveMeal() {
        const id = document.getElementById("mealId").value;
        const ingredientRows = document.querySelectorAll(".ingredient-row");

        const ingredients = [];
        let nextIngredientId = 1; // do generowania nowych id dla składników

        ingredientRows.forEach(row => {
            const name = row.querySelector(".ingredient-name").value.trim();
            const grams = row.querySelector(".ingredient-grams").value;

            if (name && grams) {
                // jeśli wiersz ma dataset.id używamy go, w przeciwnym razie generujemy nowe
                let ingId = row.dataset.id ? Number(row.dataset.id) : nextIngredientId++;
                ingredients.push({ id: ingId, name, grams: Number(grams) });
            }
        });

        // pobierz zaznaczone dish
        const selectedDish = Array.from(
            document.querySelectorAll("#dishSelection input[type='checkbox']:checked")
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
            rating: DishesState.currentRating
        };

        try {
            await DishesAPI.saveMeal(id, mealData);
            Modal.closeModal();
            await this.loadMeals();
        } catch (err) {
            console.error(err);
            alert("Błąd zapisu");
        }
    },

    confirmDeleteMeal() {
        const id = document.getElementById("mealId").value;
        if (!id) return;

        DishesState.mealToDeleteId = id;

        const mealName = document.getElementById("mealName").value;

        const message = document.getElementById("deleteMessage");
        message.textContent = `Czy na pewno chcesz usunąć danie "${mealName}"?`;

        document.getElementById("deletePopup").classList.add("show");
    },

    selectProduct() {
        if (!DishesState.selectedProductId) return alert("Wybierz produkt");

        const grams = Number(document.getElementById("productGrams").value);
        if (!grams || grams <= 0) return alert("Podaj ilość w gramach");

        const selectedItem = document.querySelector(`#productsList .product-item[data-id='${DishesState.selectedProductId}']`);
        const name = selectedItem.dataset.name;

        DishesUI.addIngredientField(name, grams, DishesState.selectedProductId);
        Dishes.closeProductModal();
    },

    async openProductModal() {
        try {
            const data = await DishesAPI.fetchProducts();
            
            data.sort((a, b) =>
                a.nazwa_produktu.localeCompare(
                    b.nazwa_produktu,
                    'pl',
                    { sensitivity: 'base' }
                )
            );

            DishesState.products = data;

            DishesUI.renderProductList(data);

            document.getElementById("productSearch").value = "";
            document.getElementById("productModal").classList.add("show");

        } catch (err) {
            console.error(err);
            alert("Błąd ładowania produktów");
        }
    },

    closeProductModal() {
        document.getElementById("productModal").classList.remove("show");
        DishesState.selectedProductId = null;
    },

    bindEvents() {

        const filterInput = document.getElementById("mealFilterInput");
        const clearBtn = document.getElementById("clearMealFilter");
        const filterWrapper = document.querySelector(".filter-with-clear");
        const productSearch = document.getElementById("productSearch");

        if (productSearch) {
            productSearch.addEventListener("input", () => {

                const query = productSearch.value.toLowerCase();

                const filtered = DishesState.products.filter(p =>
                    p.nazwa_produktu.toLowerCase().includes(query)
                );

                DishesUI.renderProductList(filtered);
            });
        }

        if (filterInput) {
            filterInput.addEventListener("input", () => {

                if (filterInput.value.length > 0) {
                    filterWrapper.classList.add("has-text");
                } else {
                    filterWrapper.classList.remove("has-text");
                }

                DishesUI.animateGrid();
            });
        }

        if (clearBtn) {
            clearBtn.addEventListener("click", () => {
                filterInput.value = "";
                filterWrapper.classList.remove("has-text");
                DishesUI.animateGrid();
            });
        }

        // STARS
        document.querySelectorAll("#mealRating span").forEach(star => {

            star.addEventListener("click", function () {
                DishesUI.renderStars(Number(this.dataset.value));
            });

            star.addEventListener("mouseenter", function () {
                DishesUI.highlightStars(Number(this.dataset.value));
            });

            star.addEventListener("mouseleave", function () {
                DishesUI.renderStars(DishesState.currentRating);
            });
        });

        // DELETE POPUP
        const deleteNo = document.getElementById("deleteNo");
        const deleteYes = document.getElementById("deleteYes");

        if (deleteNo) {
            deleteNo.addEventListener("click", () => {
                DishesState.mealToDeleteId = null;
                document.getElementById("deletePopup").classList.remove("show");
            });
        }

        if (deleteYes) {
            deleteYes.addEventListener("click", async () => {
                if (!DishesState.mealToDeleteId) return;

                try {
                    await DishesAPI.deleteMeal(DishesState.mealToDeleteId);
                    DishesState.mealToDeleteId = null;
                    document.getElementById("deletePopup").classList.remove("show");
                    Modal.closeModal();
                    await this.loadMeals();
                } catch (err) {
                    console.error(err);
                    alert("Błąd usuwania");
                }
            });
        }
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    Dishes.bindEvents();
    DishesUI.updateDayTabs();
    await Dishes.loadMeals();
});