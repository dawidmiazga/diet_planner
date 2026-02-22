let currentPerson = "osoba1";
let currentDay = 1;
let meals = [];

const grid = document.getElementById("mealsGrid");
const modal = document.getElementById("mealModal");

document.addEventListener("DOMContentLoaded", () => {
    setupTabs();
    setupButtons();
    loadMeals();
});

function setupTabs() {
    document.querySelectorAll("#personTabs .tab").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll("#personTabs .tab").forEach(t => t.classList.remove("active"));
            btn.classList.add("active");
            currentPerson = btn.dataset.person;
            renderMeals();
        });
    });

    document.querySelectorAll("#dayTabs .tab").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll("#dayTabs .tab").forEach(t => t.classList.remove("active"));
            btn.classList.add("active");
            currentDay = Number(btn.dataset.day);
            renderMeals();
        });
    });
}

function setupButtons() {
    document.getElementById("addMealBtn").addEventListener("click", openAddForm);
    document.getElementById("closeModalBtn").addEventListener("click", closeModal);
    document.getElementById("saveMealBtn").addEventListener("click", saveMeal);
    document.getElementById("deleteMealBtn").addEventListener("click", deleteMeal);
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
    grid.innerHTML = "";

    const filtered = meals.filter(m =>
        m.person === currentPerson &&
        Number(m.day) === currentDay
    );

    if (!filtered.length) {
        grid.innerHTML = "<p>Brak dań</p>";
        return;
    }

    filtered.forEach(m => {
        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `<h3>${m.name}</h3><p>${m.description}</p>`;
        card.addEventListener("click", () => openModal(m));
        grid.appendChild(card);
    });
}

function openModal(meal) {
    document.getElementById("mealId").value = meal.id;
    document.getElementById("mealName").value = meal.name;
    document.getElementById("mealDescription").value = meal.description;
    document.getElementById("mealIngredients").value = meal.ingredients;
    modal.classList.add("show");
}

function openAddForm() {
    document.getElementById("mealId").value = "";
    document.getElementById("mealName").value = "";
    document.getElementById("mealDescription").value = "";
    document.getElementById("mealIngredients").value = "";
    modal.classList.add("show");
}

function closeModal() {
    modal.classList.remove("show");
}

function saveMeal() {
    const id = document.getElementById("mealId").value;

    const mealData = {
        name: document.getElementById("mealName").value,
        description: document.getElementById("mealDescription").value,
        ingredients: document.getElementById("mealIngredients").value,
        person: currentPerson,
        day: currentDay
    };

    const method = id ? "PUT" : "POST";
    const url = id ? `/api/meals/${id}` : "/api/meals";

    fetch(url, {
        method: method,
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(mealData)
    }).then(() => {
        closeModal();
        loadMeals();
    });
}

function deleteMeal() {
    const id = document.getElementById("mealId").value;
    if (!id) return;

    fetch(`/api/meals/${id}`, {
        method: "DELETE"
    }).then(() => {
        closeModal();
        loadMeals();
    });
}
