// // ===== MEAL MODAL SHARED LOGIC =====

// const MealModal = (() => {

//     let currentRating = 0;

//     function renderStars(rating) {
//         currentRating = rating;

//         const stars = document.querySelectorAll("#mealRating span");

//         stars.forEach(star => {
//             const value = Number(star.dataset.value);

//             if (value <= rating) {
//                 star.classList.add("filled");
//             } else {
//                 star.classList.remove("filled");
//             }
//         });
//     }

//     function renderPersonSelection(selectedPerson = "osoba1") {

//         const container = document.getElementById("mealPersonSelection");
//         if (!container) return;

//         container.innerHTML = "";

//         const persons = {
//             osoba1: "Dawid",
//             osoba2: "Kasia"
//         };

//         Object.entries(persons).forEach(([value, label]) => {

//             const wrapper = document.createElement("label");
//             wrapper.classList.add("dish-pill");

//             const input = document.createElement("input");
//             input.type = "radio";
//             input.name = "mealPersonRadio";
//             input.value = value;

//             if (value === selectedPerson) {
//                 input.checked = true;
//             }

//             input.addEventListener("change", function () {
//                 updateDishSelectionForModal(this.value, []);
//             });

//             const span = document.createElement("span");
//             span.textContent = label;

//             wrapper.appendChild(input);
//             wrapper.appendChild(span);
//             container.appendChild(wrapper);
//         });
//     }

//     function updateDishSelectionForModal(person, selected = []) {

//         const container = document.getElementById("dishSelection");
//         if (!container) return;

//         container.innerHTML = "";

//         const config = DISH_CONFIG[person];
//         if (!config) return;

//         Object.entries(config).forEach(([value, label]) => {

//             const wrapper = document.createElement("label");
//             wrapper.classList.add("dish-pill");

//             const input = document.createElement("input");
//             input.type = "checkbox";
//             input.value = value;

//             if (selected.includes(Number(value))) {
//                 input.checked = true;
//             }

//             const span = document.createElement("span");
//             span.textContent = label;

//             wrapper.appendChild(input);
//             wrapper.appendChild(span);
//             container.appendChild(wrapper);
//         });
//     }

//     function addIngredientField(name = "", grams = "", id = null) {

//         const container = document.getElementById("ingredientsContainer");
//         if (!container) return;

//         const ingId = id || Date.now() + Math.floor(Math.random() * 1000);

//         const row = document.createElement("div");
//         row.className = "ingredient-row";
//         row.dataset.id = ingId;

//         row.innerHTML = `
//             <input type="text" class="ingredient-name" value="${name}">
//             <input type="number" class="ingredient-grams" value="${grams}">
//             <button type="button" class="btn ingredient-delete" onclick="this.parentElement.remove()">×</button>
//         `;

//         container.appendChild(row);
//     }

//     function open(meal) {

//         if (!meal) return;

//         document.getElementById("mealId").value = meal.id || "";
//         document.getElementById("mealName").value = meal.name || "";
//         document.getElementById("mealDescription").value = meal.description || "";

//         renderPersonSelection(meal.person || "osoba1");
//         updateDishSelectionForModal(meal.person || "osoba1", meal.dish || []);
//         renderStars(meal.rating || 0);

//         const container = document.getElementById("ingredientsContainer");
//         container.innerHTML = "";

//         if (meal.ingredients && Array.isArray(meal.ingredients)) {
//             meal.ingredients.forEach(ing => {
//                 addIngredientField(ing.name, ing.grams, ing.id);
//             });
//         }

//         document.getElementById("editModalTitleMeal").textContent =
//             meal.id ? "Edytuj danie" : "Dodaj danie";

//         document.getElementById("deleteMealBtn").style.display =
//             meal.id ? "inline-block" : "none";

//         document.getElementById("mealModal").classList.add("show");
//     }

//     return {
//         open,
//         renderStars,
//         addIngredientField
//     };

// })();