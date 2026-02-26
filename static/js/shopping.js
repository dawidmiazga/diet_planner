let shoppingStartDate = null;
let shoppingEndDate = null;
let plannerData = {};
let shoppingData = [];
let currentSort = { key: "name", asc: true };
let lastRemovedProductId = null;
let lastRemovedProductName = null;
let undoTimeout = null;

function loadShopping() {
    // lastRemovedProductId = null;
    // lastRemovedProductName = null;
    // updateUndoButton();

    // jeśli inputy mają pustą wartość, to nic nie rób
    const startVal = document.getElementById("shoppingStartDate").value;
    const endVal = document.getElementById("shoppingEndDate").value;

    if (!startVal || !endVal) {
        console.warn("Brak dat w inputach — nie wywołuję API:", startVal, endVal);
        return;
    }

    fetch(`/api/shopping_list?start=${startVal}&end=${endVal}`)
        .then(res => res.json())
        .then(data => {
            shoppingData = data.filter(item => !item.checked);
            sortTable(currentSort.key, false);
        });
}

function renderTable() {

    const body = document.getElementById("shoppingBody");
    body.innerHTML = "";

    shoppingData.forEach(item => {

        let iloscText = item.grams + " g";
        if (item.sztuki && item.jednostka) {
            iloscText += " (" + item.sztuki + " " + item.jednostka + ")";
        }

        let lodowkaText = "—";
        if (item.czy_w_lodowce === "Tak") lodowkaText = "Tak";
        if (item.czy_w_lodowce === "Nie") lodowkaText = "Nie";
        if (item.czy_w_lodowce === "Tak/Nie") lodowkaText = "Tak/Nie";

        const row = document.createElement("tr");
        row.innerHTML = `
            <td>
                <button class="btn remove-btn" onclick="markBought(${item.id})">✕</button>
            </td>
            <td>${item.name}</td>
            <td>${iloscText}</td>
            <td>${item.dzial_w_sklepie}</td>
            <td>${lodowkaText}</td>
        `;

        body.appendChild(row);
    });
}

function sortTable(key, toggle = true) {

    if (toggle) {
        if (currentSort.key === key) {
            currentSort.asc = !currentSort.asc;
        } else {
            currentSort.key = key;
            currentSort.asc = true;
        }
    } else {
        currentSort.key = key;
    }

    shoppingData.sort((a, b) => {

        let valA, valB;

        if (key === "ilosc") {
            valA = Number(a.grams);
            valB = Number(b.grams);
        } else {
            valA = (a[key] || "").toString().toLowerCase();
            valB = (b[key] || "").toString().toLowerCase();
        }

        if (valA < valB) return currentSort.asc ? -1 : 1;
        if (valA > valB) return currentSort.asc ? 1 : -1;
        return 0;
    });
    renderTable();
    updateSortIcons();
}

function updateSortIcons() {

    const headers = document.querySelectorAll(".shopping-table th[data-key]");

    headers.forEach(th => {

        const key = th.getAttribute("data-key");
        const icon = th.querySelector(".sort-icon");

        if (!icon) return;

        if (key === currentSort.key) {
            icon.textContent = currentSort.asc ? "▲" : "▼";
        } else {
            icon.textContent = "▲▼";
        }
    });
}

function markBought(id) {
    const product = shoppingData.find(p => p.id === id);

    if (product) {
        lastRemovedProductId = id;
        lastRemovedProductName = product.name;

        updateUndoButton();
    }

    fetch("/api/shopping_check/" + id, {
        method: "POST"
    }).then(() => {
        loadShopping();
    });
}

function updateUndoButton() {

    const btn = document.getElementById("undoButton");

    // ===== UKRYWANIE =====
    if (!lastRemovedProductId) {

        btn.classList.add("hidden");

        setTimeout(() => {
            if (!lastRemovedProductId) {
                btn.style.display = "none";
                btn.innerHTML = ""; // wyczyść pasek
            }
        }, 400);

        return;
    }

    // ===== POKAZYWANIE =====

    btn.innerHTML = `
        <span class="undo-icon">↺</span>
        Usunięto: <strong>${lastRemovedProductName}</strong> - Cofnij
        <div class="undo-progress"></div>
    `;

    btn.style.display = "flex";

    requestAnimationFrame(() => {
        btn.classList.remove("hidden");
    });

    // uruchom animację paska
    const progress = btn.querySelector(".undo-progress");
    requestAnimationFrame(() => {
        progress.classList.add("animate");
    });

    // reset poprzedniego timera
    if (undoTimeout) {
        clearTimeout(undoTimeout);
    }

    // auto fade-out po 5 sekundach
    undoTimeout = setTimeout(() => {
        lastRemovedProductId = null;
        lastRemovedProductName = null;
        updateUndoButton();
    }, 5000);
}

function undoLastRemoval() {

    if (!lastRemovedProductId) return;

    fetch("/api/shopping_uncheck/" + lastRemovedProductId, {
        method: "POST"
    })
        .then(() => {

            if (undoTimeout) {
                clearTimeout(undoTimeout);
            }

            lastRemovedProductId = null;
            lastRemovedProductName = null;

            updateUndoButton();
            loadShopping();
        });
}

function resetList() {

    // 🔹 wyczyść stan cofania
    lastRemovedProductId = null;
    lastRemovedProductName = null;
    updateUndoButton();   // schowa przycisk

    fetch("/api/shopping_reset", {
        method: "POST"
    }).then(() => loadShopping());
}

// document.addEventListener("DOMContentLoaded", loadShopping);
document.addEventListener("DOMContentLoaded", () => {

    fetch("/api/get_shopping_dates")
        .then(res => res.json())
        .then(data => {

            const today = new Date().toISOString().split("T")[0];

            shoppingStartDate = data.start_date || today;
            shoppingEndDate = data.end_date || today;

            document.getElementById("shoppingStartDate").value = shoppingStartDate;
            document.getElementById("shoppingEndDate").value = shoppingEndDate;

            flatpickr("#shoppingStartDate", {
                locale: "pl",
                dateFormat: "Y-m-d",
                defaultDate: shoppingStartDate,
                onChange: function (selectedDates, dateStr) {
                    shoppingStartDate = dateStr;
                    saveShoppingDates().then(() => loadShopping());
                }
            });

            // DatePicker.init("#shoppingStartDate", shoppingStartDate, (dateStr) => {
            //     shoppingStartDate = dateStr;
            //     saveShoppingDates().then(loadShopping);
            // });

            // DatePicker.init("#shoppingEndDate", shoppingEndDate, (dateStr) => {
            //     shoppingEndDate = dateStr;
            //     saveShoppingDates().then(loadShopping);
            // });


            flatpickr("#shoppingEndDate", {
                locale: "pl",
                dateFormat: "Y-m-d",
                defaultDate: shoppingEndDate,
                onChange: function (selectedDates, dateStr) {
                    shoppingEndDate = dateStr;
                    saveShoppingDates().then(() => loadShopping());
                }
            });

            loadShopping();
        });
});
function saveShoppingDates() {
    return API.post("/api/save_shopping_dates", { start_date: shoppingStartDate, end_date: shoppingEndDate });
    // return fetch("/api/save_shopping_dates", {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify({
    //         start_date: shoppingStartDate,
    //         end_date: shoppingEndDate
    //     })
    // });
}
function generateShoppingList() {

    if (!shoppingStartDate || !shoppingEndDate) return;

    const start = new Date(shoppingStartDate);
    const end = new Date(shoppingEndDate);

    let mealIds = [];

    for (const person in plannerData) {

        for (const dateStr in plannerData[person]) {

            const currentDate = new Date(dateStr);

            if (currentDate >= start && currentDate <= end) {

                const mealsForDay = plannerData[person][dateStr];

                for (const dish in mealsForDay) {
                    mealIds.push(mealsForDay[dish]);
                }

            }
        }
    }
}