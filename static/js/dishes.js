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
        const data = await App.API.get("/api/meals");
        DishesState.meals = data;
        return data;
    },

    async saveMeal(id, mealData) {
        if (id) {
            return App.API.put(`/api/meals/${id}`, mealData);
        }
        return App.API.post("/api/meals", mealData);
    },

    async deleteMeal(id) {
        return App.API.delete(`/api/meals/${id}`);
    },

    async fetchProducts() {
        return App.API.get("/api/products");
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

        if (!container) return;
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

    renderMeals() {
        const grid = document.getElementById("mealsGrid");

        if (!grid) return;
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
        ModalShared.renderDishSelection([]);
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
        if (document.getElementById("mealsGrid")) {
            DishesUI.renderMeals();
        }
    },

    openModal(meal) {
        document.getElementById("mealId").value = meal.id;
        document.getElementById("mealName").value = meal.name;
        document.getElementById("mealDescription").value = meal.description;
        ModalShared.renderPersonSelection(meal.person);
        ModalShared.renderDishSelection(meal.person, meal.dish || []);
        if (!meal.rating) {
            meal.rating = 0;
        }

        ModalShared.currentRating = meal.rating || 0;
        ModalShared.renderStars(ModalShared.currentRating);

        const container = document.getElementById("ingredientsContainer");
        container.innerHTML = "";

        if (meal.ingredients && Array.isArray(meal.ingredients)) {
            meal.ingredients.forEach(ing => {
                ModalShared.addIngredientField(ing.name, ing.grams, ing.id);
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
        ModalShared.renderPersonSelection(DishesState.currentPerson);
        ModalShared.renderDishSelection(DishesState.currentPerson, []);

        const container = document.getElementById("ingredientsContainer");
        container.innerHTML = "";

        document.getElementById("editModalTitleMeal").textContent = "Dodaj danie";
        document.getElementById("deleteMealBtn").style.display = "none";
        document.getElementById("mealModal").classList.add("show");

        ModalShared.currentRating = 0;
        ModalShared.renderStars(0);
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
                ModalShared.renderStars(Number(this.dataset.value));
            });

            star.addEventListener("mouseenter", function () {
                ModalShared.renderStars(Number(this.dataset.value));
            });

            star.addEventListener("mouseleave", function () {
                ModalShared.renderStars(ModalShared.currentRating);
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