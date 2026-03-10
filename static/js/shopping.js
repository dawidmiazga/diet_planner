/* =====================================================
   STATE
===================================================== */

const ShoppingState = {
    shoppingStartDate: null,
    shoppingEndDate: null,
    plannerData: {},
    shoppingData: [],
    currentSort: { key: "name", asc: true },
    lastRemovedProductId: null,
    lastRemovedProductName: null,
    undoTimeout: null
};

const $ = id => document.getElementById(id);

/* =====================================================
   API
===================================================== */

const ShoppingAPI = {

    async fetchShopping(start, end) {
        const res = await fetch(`/api/shopping_list?start=${start}&end=${end}`);
        return await res.json();
    },

    async markBought(id) {
        return fetch("/api/shopping_check/" + id, { method: "POST" });
    },

    async undoBought(id) {
        return fetch("/api/shopping_uncheck/" + id, { method: "POST" });
    },

    async resetList() {
        return fetch("/api/shopping_reset", { method: "POST" });
    },

    async fetchDates() {
        const res = await fetch("/api/get_shopping_dates");
        return await res.json();
    },

    async saveDates(start, end) {
        return App.API.post("/api/save_shopping_dates", {
            start_date: start,
            end_date: end
        });
    }
};
/* =====================================================
   UI
===================================================== */

const ShoppingUI = {

    renderTable() {
        const body = $("shoppingBody");
        body.innerHTML = "";

        ShoppingState.shoppingData.forEach(item => {

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
                    <button class="btn remove-btn" onclick="Shopping.markBought(${item.id})">✕</button>
                </td>
                <td class="shopping-cell">
                    <input type="text" class="shopping-input" value="${item.name}" data-id="${item.id}">
                </td>
                <td class="shopping-cell">
                    <input type="text" class="shopping-input" value="${iloscText}" data-id="${item.id}">
                </td>
                <td>${item.dzial_w_sklepie}</td>
                <td>${lodowkaText}</td>
            `;
            body.appendChild(row);
        });
    },

    updateSortIcons() {
        const headers = document.querySelectorAll(".shopping-table th[data-key]");

        headers.forEach(th => {
            const key = th.getAttribute("data-key");
            const icon = th.querySelector(".sort-icon");
            if (!icon) return;

            if (key === ShoppingState.currentSort.key) {
                icon.textContent = ShoppingState.currentSort.asc ? "▲" : "▼";
            } else {
                icon.textContent = "▲▼";
            }
        });
    }
};
/* =====================================================
   SHOPPING LOGIC
===================================================== */

const Shopping = {

    async loadShopping() {

        const startVal = $("shoppingStartDate").value;
        const endVal = $("shoppingEndDate").value;

        if (!startVal || !endVal) return;

        const data = await ShoppingAPI.fetchShopping(startVal, endVal);

        ShoppingState.shoppingData = data.filter(item => !item.checked);

        this.sortTable(ShoppingState.currentSort.key, false);
    },

    sortTable(key, toggle = true) {

        const sort = ShoppingState.currentSort;

        if (toggle) {
            if (sort.key === key) {
                sort.asc = !sort.asc;
            } else {
                sort.key = key;
                sort.asc = true;
            }
        } else {
            sort.key = key;
        }

        ShoppingState.shoppingData.sort((a, b) => {

            let valA, valB;

            if (key === "ilosc") {
                valA = Number(a.grams);
                valB = Number(b.grams);
            } else {
                valA = (a[key] || "").toString().toLowerCase();
                valB = (b[key] || "").toString().toLowerCase();
            }

            if (valA < valB) return sort.asc ? -1 : 1;
            if (valA > valB) return sort.asc ? 1 : -1;
            return 0;
        });

        ShoppingUI.renderTable();
        ShoppingUI.updateSortIcons();
        this.saveState();
    },

    async markBought(id) {

        const product = ShoppingState.shoppingData.find(p => p.id === id);

        if (product) {
            ShoppingState.lastRemovedProductId = id;
            ShoppingState.lastRemovedProductName = product.name;
            this.updateUndoButton();
        }

        await ShoppingAPI.markBought(id);
        await this.loadShopping();
        this.saveState();
    },

    async undoLastRemoval() {

        if (!ShoppingState.lastRemovedProductId) return;

        await ShoppingAPI.undoBought(ShoppingState.lastRemovedProductId);

        if (ShoppingState.undoTimeout) {
            clearTimeout(ShoppingState.undoTimeout);
        }

        ShoppingState.lastRemovedProductId = null;
        ShoppingState.lastRemovedProductName = null;

        this.updateUndoButton();
        await this.loadShopping();
        this.saveState();
    },

    async resetList() {

        ShoppingState.lastRemovedProductId = null;
        ShoppingState.lastRemovedProductName = null;

        this.updateUndoButton();

        await ShoppingAPI.resetList();
        await this.loadShopping();
    },

    saveState() {
        localStorage.setItem(
            "shoppingTableState",
            JSON.stringify(ShoppingState.shoppingData)
        );
    },

    loadState() {
        const saved = localStorage.getItem("shoppingTableState");
        if (saved) {
            ShoppingState.shoppingData = JSON.parse(saved);
            this.sortTable(ShoppingState.currentSort.key, false);
        }
    },

    updateUndoButton() {

        const btn = $("undoButton");

        if (!ShoppingState.lastRemovedProductId) {
            btn.classList.add("hidden");

            setTimeout(() => {
                if (!ShoppingState.lastRemovedProductId) {
                    btn.style.display = "none";
                    btn.innerHTML = "";
                }
            }, 400);

            return;
        }

        btn.innerHTML = `
            <span class="undo-icon">↺</span>
            Usunięto: <strong>${ShoppingState.lastRemovedProductName}</strong> - Cofnij
            <div class="undo-progress"></div>
        `;

        btn.style.display = "flex";

        requestAnimationFrame(() => {
            btn.classList.remove("hidden");
        });

        const progress = btn.querySelector(".undo-progress");
        requestAnimationFrame(() => {
            progress.classList.add("animate");
        });

        if (ShoppingState.undoTimeout) {
            clearTimeout(ShoppingState.undoTimeout);
        }

        ShoppingState.undoTimeout = setTimeout(() => {
            ShoppingState.lastRemovedProductId = null;
            ShoppingState.lastRemovedProductName = null;
            this.updateUndoButton();
        }, 5000);
    },
    async copyNameAndQuantity() {

        if (!ShoppingState.shoppingData.length) {
            alert("Brak produktów do skopiowania.");
            return;
        }

        const textToCopy = ShoppingState.shoppingData.map(item => {

            let iloscText = item.grams + " g";

            if (item.sztuki && item.jednostka) {
                iloscText += " (" + item.sztuki + " " + item.jednostka + ")";
            }

            return item.name + " - " + iloscText;

        }).join("\n");

        try {
            await navigator.clipboard.writeText(textToCopy);
            this.showCopySuccess();
        } catch (err) {
            console.error("Błąd kopiowania:", err);
            alert("Nie udało się skopiować.");
        }
    },

    showCopySuccess() {

        const btn = document.querySelector('[onclick="Shopping.copyNameAndQuantity()"]');

        if (!btn) return;

        const originalText = btn.innerHTML;

        btn.innerHTML = "✅ Skopiowano!";
        btn.disabled = true;

        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }, 3000);
    },
};
/* =====================================================
   INIT
===================================================== */

document.addEventListener("DOMContentLoaded", async () => {

    const data = await ShoppingAPI.fetchDates();

    const today = new Date().toISOString().split("T")[0];

    ShoppingState.shoppingStartDate = data.start_date || today;
    ShoppingState.shoppingEndDate = data.end_date || today;

    $("shoppingStartDate").value = ShoppingState.shoppingStartDate;
    $("shoppingEndDate").value = ShoppingState.shoppingEndDate;

    flatpickr("#shoppingStartDate", {
        locale: "pl",
        dateFormat: "Y-m-d",
        defaultDate: ShoppingState.shoppingStartDate,
        onChange: async (selectedDates, dateStr) => {
            ShoppingState.shoppingStartDate = dateStr;
            await ShoppingAPI.saveDates(
                ShoppingState.shoppingStartDate,
                ShoppingState.shoppingEndDate
            );
            Shopping.loadShopping();
        }
    });

    flatpickr("#shoppingEndDate", {
        locale: "pl",
        dateFormat: "Y-m-d",
        defaultDate: ShoppingState.shoppingEndDate,
        onChange: async (selectedDates, dateStr) => {
            ShoppingState.shoppingEndDate = dateStr;
            await ShoppingAPI.saveDates(
                ShoppingState.shoppingStartDate,
                ShoppingState.shoppingEndDate
            );
            Shopping.loadShopping();
        }
    });

    Shopping.loadState();
    Shopping.loadShopping();
});
