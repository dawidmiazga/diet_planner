

let currentRating = 0;
let currentPerson = "osoba1";
let currentDay = 1;
let meals = [];

const filterInput = document.getElementById("mealFilterInput");
const clearBtn = document.getElementById("clearMealFilter");
const filterWrapper = document.querySelector(".filter-with-clear");

filterInput.addEventListener("input", () => {

    if (filterInput.value.length > 0) {
        filterWrapper.classList.add("has-text");
    } else {
        filterWrapper.classList.remove("has-text");
    }

    animateGrid();
});

clearBtn.addEventListener("click", () => {
    filterInput.value = "";
    filterWrapper.classList.remove("has-text");
    animateGrid();
});

function renderStars(rating) {
    currentRating = rating;

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
function updateDayTabs() {
    const container = document.getElementById("dayTabs");
    container.innerHTML = "";

    const isDawid = currentPerson === "osoba1";
    const count = isDawid ? 5 : 4;

    for (let i = 1; i <= count; i++) {
        const tab = document.createElement("div");
        tab.className = "tab";
        if (i === 1) tab.classList.add("active");

        tab.textContent = DISH_CONFIG[currentPerson][i];
        tab.onclick = function () {
            setDay(i, this);
        };

        container.appendChild(tab);
    }
}

function addIngredientField(name = "", grams = "", id = null) {
    const container = document.getElementById("ingredientsContainer");

    // jeśli id nie podane, generujemy tymczasowe
    const ingId = id || Date.now() + Math.floor(Math.random() * 1000);

    const row = document.createElement("div");
    row.className = "ingredient-row";
    row.dataset.id = ingId; // zapisujemy id w dataset dla późniejszej edycji

    row.innerHTML = `
        <input type="text" class="ingredient-name" id="ingredient-name-${ingId}" name="ingredient-name-${ingId}" placeholder="Nazwa składnika" value="${name}">
        <input type="number" class="ingredient-grams" id="ingredient-grams-${ingId}" name="ingredient-grams-${ingId}" placeholder="g" value="${grams}">
        <button type="button" class="brn ingredient-delete" onclick="this.parentElement.remove()">×</button>
    `;

    container.appendChild(row);
}

function renderDishSelection(selected = []) {
    const container = document.getElementById("dishSelection");
    container.innerHTML = "";

    const config = DISH_CONFIG[currentPerson];
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
}
function updateDishSelectionForModal(person, selected = []) {

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
}
function loadMeals() {
    fetch("/api/meals")
        .then(res => res.json())
        .then(data => {
            meals = data;
            renderMeals();
        });
}

function renderMeals() {
    const grid = document.getElementById("mealsGrid");
    grid.innerHTML = "";


    const searchText = document.getElementById("mealFilterInput")?.value.toLowerCase() || "";

    const filtered = meals.filter(m =>
        m.person === currentPerson &&
        Array.isArray(m.dish) &&
        m.dish.includes(Number(currentDay)) &&
        m.name.toLowerCase().includes(searchText)
    );

    // 🔥 SORTOWANIE PO NAZWIE (A-Z)
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

        // 🔥 jeśli nowa litera – dodaj separator
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
                                    ${generateStaticStars(m.rating || 0)}
                                </div>`;

        card.onclick = () => openModal(m);

        grid.appendChild(card);
    });

}
function animateGrid() {
    const grid = document.getElementById("mealsGrid");

    grid.classList.add("grid-fade-out");

    setTimeout(() => {
        renderMeals();
        grid.classList.remove("grid-fade-out");
        grid.classList.add("grid-fade-in");

        setTimeout(() => {
            grid.classList.remove("grid-fade-in");
        }, 200);

    }, 150);
}

function setPerson(person, el) {
    currentPerson = person;

    document.querySelectorAll("#personTabs .tab")
        .forEach(t => t.classList.remove("active"));

    el.classList.add("active");

    currentDay = 1;

    updateDayTabs();

    const firstDayTab = document.querySelector("#dayTabs .tab");
    if (firstDayTab) {
        document.querySelectorAll("#dayTabs .tab")
            .forEach(t => t.classList.remove("active"));

        firstDayTab.classList.add("active");
    }

    animateGrid();
    renderDishSelection([]);
}

function setDay(day, el) {
    currentDay = day;

    document.querySelectorAll("#dayTabs .tab")
        .forEach(t => t.classList.remove("active"));

    el.classList.add("active");

    animateGrid();
}
let selectedProductId = null;

// 1️⃣ Otwieranie modal wyboru produktu
function openProductModal() {
    fetch("/api/products") // endpoint w Flask, zwraca products.json
        .then(res => res.json())
        .then(data => {
            const list = document.getElementById("productsList");
            list.innerHTML = "";

            data.forEach(p => {
                const item = document.createElement("div");
                item.className = "product-item";
                item.style.padding = "6px";
                item.style.cursor = "pointer";
                item.style.borderBottom = "1px solid #e5e7eb";
                item.innerText = p.nazwa_produktu;
                item.dataset.id = p.id;
                item.dataset.name = p.nazwa_produktu;

                item.onclick = () => {
                    selectedProductId = p.id;
                    document.getElementById("productGrams").value = 0;
                    document.querySelectorAll("#productsList .product-item")
                        .forEach(el => el.style.background = "transparent");
                    item.style.background = "#e5e7eb";
                };

                list.appendChild(item);
            });

            document.getElementById("productModal").classList.add("show");
        });
}

// 2️⃣ Zamknięcie modal
function closeProductModal() {
    document.getElementById("productModal").classList.remove("show");
    selectedProductId = null;
}

// 3️⃣ Wybranie produktu i dodanie do listy składników
function selectProduct() {
    if (!selectedProductId) return alert("Wybierz produkt");

    const grams = Number(document.getElementById("productGrams").value);
    if (!grams || grams <= 0) return alert("Podaj ilość w gramach");

    // pobranie nazwy wybranego produktu
    const selectedItem = document.querySelector(`#productsList .product-item[data-id='${selectedProductId}']`);
    const name = selectedItem.dataset.name;

    addIngredientField(name, grams, selectedProductId); // wykorzystujemy zmodyfikowany addIngredientField z id
    closeProductModal();
}

function openModal(meal) {
    document.getElementById("mealId").value = meal.id;
    document.getElementById("mealName").value = meal.name;
    document.getElementById("mealDescription").value = meal.description;
    renderPersonSelection(meal.person);
    updateDishSelectionForModal(meal.person, meal.dish || []);
    if (!meal.rating) {
        meal.rating = 0;
    }
    renderStars(meal.rating);

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

function openAddForm() {
    document.getElementById("mealId").value = "";
    document.getElementById("mealName").value = "";
    document.getElementById("mealDescription").value = "";
    renderPersonSelection(currentPerson);
    updateDishSelectionForModal(currentPerson, []);

    const container = document.getElementById("ingredientsContainer");
    container.innerHTML = "";
    // addIngredientField();

    // renderDishSelection([]);

    document.getElementById("editModalTitleMeal").textContent = "Dodaj danie";
    document.getElementById("deleteMealBtn").style.display = "none";
    document.getElementById("mealModal").classList.add("show");

    renderStars(0);
}
function renderPersonSelection(selectedPerson = "osoba1") {

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
            updateDishSelectionForModal(this.value, []);
        });

        const span = document.createElement("span");
        span.textContent = label;

        wrapper.appendChild(input);
        wrapper.appendChild(span);
        container.appendChild(wrapper);
    });
}
function closeModal() {
    const modal = document.getElementById("mealModal");

    modal.classList.add("closing");

    setTimeout(() => {
        modal.classList.remove("show");
        modal.classList.remove("closing");
    }, 200);
}

function saveMeal() {
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

    // 🔥 pobierz zaznaczone dish
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
        rating: currentRating  // ⭐ NOWE
    };


    const method = id ? "PUT" : "POST";
    const url = id ? `/api/meals/${id}` : "/api/meals";

    fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mealData)
    }).then(() => {
        closeModal();
        loadMeals();
    });
}


let mealToDeleteId = null;

/* =========================
   DELETE POPUP LOGIC
========================= */

function confirmDeleteMeal() {
    const id = document.getElementById("mealId").value;
    if (!id) return;

    mealToDeleteId = id;

    const mealName = document.getElementById("mealName").value;

    const message = document.getElementById("deleteMessage");
    message.textContent = `Czy na pewno chcesz usunąć danie "${mealName}"?`;

    document.getElementById("deletePopup").classList.add("show");
}
function highlightStars(rating) {
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
// kliknięcie ANULUJ
document.addEventListener("DOMContentLoaded", function () {

    const deleteNo = document.getElementById("deleteNo");
    const deleteYes = document.getElementById("deleteYes");

    if (deleteNo) {
        deleteNo.addEventListener("click", () => {
            mealToDeleteId = null;
            document.getElementById("deletePopup").classList.remove("show");
        });
    }

    if (deleteYes) {
        deleteYes.addEventListener("click", () => {
            if (!mealToDeleteId) return;

            fetch(`/api/meals/${mealToDeleteId}`, { method: "DELETE" })
                .then(() => {
                    mealToDeleteId = null;
                    document.getElementById("deletePopup").classList.remove("show");
                    closeModal();
                    loadMeals();
                });
        });
    }

});

loadMeals();
document.addEventListener("DOMContentLoaded", function () {
    const stars = document.querySelectorAll("#mealRating span");

    stars.forEach(star => {

        // klik
        star.addEventListener("click", function () {
            const value = Number(this.dataset.value);
            renderStars(value);
        });

        // hover
        star.addEventListener("mouseenter", function () {
            const value = Number(this.dataset.value);
            highlightStars(value);
        });

        star.addEventListener("mouseleave", function () {
            renderStars(currentRating);
        });
    });
});
// document.addEventListener("DOMContentLoaded", function () {
//     document.querySelectorAll("#mealRating span").forEach(star => {
//         star.addEventListener("click", function () {
//             const value = Number(this.dataset.value);
//             renderStars(value);
//         });
//     });
// });

document.addEventListener("DOMContentLoaded", function () {

    const personSelect = document.getElementById("mealPerson");

    if (personSelect) {
        personSelect.addEventListener("change", function () {

            updateDishSelectionForModal(this.value, []);

        });
    }

});
document.addEventListener("DOMContentLoaded", function () {
    updateDayTabs();
});
