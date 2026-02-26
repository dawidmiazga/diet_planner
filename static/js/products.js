
/************** MODEL **************/

const Model = {
    products: [],
    productToDeleteId: null,
    productToDeleteName: "",
    sortDirection: {},
    savedSort: null,

    async fetchProducts() {
        this.products = await API.get("/api/products");
        return this.products;
    },

    async addProduct(product) {
        this.products = await API.post("/api/products", product);
    },

    async updateProduct(id, product) {
        this.products = await API.put(`/api/products/${id}`, product);
    },

    async deleteProduct(id) {
        await API.delete(`/api/products/${id}`);
    }
};

/************** VIEW **************/
const View = {
    popupContainer: null,
    cancelButton: null,
    successPopup: null,
    addAnotherYes: null,
    addAnotherNo: null,
    deletePopup: null,
    deleteMessage: null,
    deleteYes: null,
    deleteNo: null,

    init() {
        this.popupContainer = document.getElementById('popupContainer');
        this.cancelButton = document.getElementById('cancelButton');
        this.successPopup = document.getElementById("successPopup");
        this.addAnotherYes = document.getElementById("addAnotherYes");
        this.addAnotherNo = document.getElementById("addAnotherNo");
        this.deletePopup = document.getElementById("deletePopup");
        this.deleteMessage = document.getElementById("deleteMessage");
        this.deleteYes = document.getElementById("deleteYes");
        this.deleteNo = document.getElementById("deleteNo");
    },

    renderProducts(products) {
        const tbody = document.querySelector("#productsTable tbody");
        tbody.innerHTML = "";

        if (!products.length) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" style="text-align:center;">Brak produktów</td>
                </tr>
            `;
            return;
        }

        products.forEach(p => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${p.nazwa_produktu}</td>
                <td>${p.dzial_w_sklepie}</td>
                <td>${p.nazwa_jednostki} (${p.jednostka_per_gram}g)</td>
                <td>${p.czy_w_lodowce}</td>
                <td>${p.makro?.kcal || 0}</td>
                <td>${p.makro?.b || 0}</td>
                <td>${p.makro?.t || 0}</td>
                <td>${p.makro?.w || 0}</td>
                <td>
                    <button class="btn yellow-btn" onclick="Controller.openEditPopup(${p.id})">Edytuj</button>
                    <button class="btn red-btn" onclick="Controller.confirmDelete(${p.id}, '${p.nazwa_produktu}')">Usuń</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    },

    getFilters() {
        return {
            nazwa: document.getElementById("filterNazwa").value.toLowerCase()
        };
    },
};

/************** CONTROLLER **************/
const Controller = {
    mode: "add", // add | edit

    async init() {
        View.init();
        this.bindEvents();
        await this.loadAndRender();

        // domyślne sortowanie na starcie: kolumna Nazwa, ascending
        if (!Model.sortDirection[0]) Model.sortDirection[0] = true; // ascending
        this.sortTable(0, false, true);
    },

    bindEvents() {
        const editForm = document.getElementById("editForm");
        if (editForm) {
            editForm.addEventListener("submit", async (e) => {
                e.preventDefault();
                await this.handleEditForm(e);
            });
        }

        View.addAnotherYes.addEventListener("click", () => {
            Controller.closeSuccessPopup();
            Controller.openAddPopup(); // od razu otwórz formularz dodawania
        });

        View.addAnotherNo.addEventListener("click", () => {
            Controller.closeSuccessPopup();
        });

        View.deleteNo.addEventListener("click", () => {
            Model.productToDeleteId = null;
            Controller.closeDeletePopup();
        });

        View.deleteYes.addEventListener("click", () => this.handleDelete());

        this.closeDeletePopup();

        const filterInput = document.getElementById("filterNazwa");
        const clearBtn = document.getElementById("clearProductFilter");
        const wrapper = document.getElementById("productFilterWrapper");

        filterInput.addEventListener("input", () => {
            if (filterInput.value.length > 0) {
                wrapper.classList.add("has-text");
            } else {
                wrapper.classList.remove("has-text");
            }
            this.loadAndRender();
        });

        clearBtn.addEventListener("click", () => {
            filterInput.value = "";
            wrapper.classList.remove("has-text");
            this.loadAndRender();
        });

    },

    /************** POPUP METHODS **************/
    openDeletePopup() { document.getElementById("deletePopup").classList.add("show"); },
    closeDeletePopup() {
        const modal = document.getElementById("deletePopup");

        modal.classList.add("closing");

        setTimeout(() => {
            modal.classList.remove("show");
            modal.classList.remove("closing");
        }, 200);
    },
    openSuccessPopup() { document.getElementById("successPopup").classList.add("show"); }, closeSuccessPopup() {
        const modal = document.getElementById("successPopup");

        modal.classList.add("closing");

        setTimeout(() => {
            modal.classList.remove("show");
            modal.classList.remove("closing");
        }, 200);
    },

    /************** DATA METHODS **************/
    async loadAndRender() {
        await Model.fetchProducts();
        this.applyFilters();
    },

    applyFilters() {
        const filters = View.getFilters();
        let filtered = Model.products.slice();

        if (filters.nazwa) {
            filtered = filtered.filter(p =>
                p.nazwa_produktu.toLowerCase().includes(filters.nazwa)
            );
        }

        View.renderProducts(filtered);

        if (Model.savedSort) {
            const { colIndex, isNumeric, asc } = Model.savedSort;
            this.sortTable(colIndex, isNumeric, asc); // forceAsc = zachowujemy kierunek
        }
    },

    async handleAddForm(e) {
        e.preventDefault();
        const form = e.target;
        const newProduct = {
            nazwa_produktu: form.nazwa_produktu.value.trim(),
            nazwa_jednostki: form.nazwa_jednostki.value,
            jednostka_per_gram: parseInt(form.jednostka_per_gram.value),
            makro: {
                kcal: parseFloat(document.getElementById("kcal").value) || 0,
                b: parseFloat(document.getElementById("b").value) || 0,
                t: parseFloat(document.getElementById("t").value) || 0,
                w: parseFloat(document.getElementById("w").value) || 0
            }
        };
        if (!newProduct.nazwa_produktu || newProduct.jednostka_per_gram <= 0) {
            alert("Proszę wprowadzić poprawne dane!");
            return;
        }
        await Model.addProduct(newProduct);
        form.reset();
        this.loadAndRender();
        this.openSuccessPopup();
    },

    async handleEditForm(e) {
        const id = document.getElementById("edit_id").value;
        const updatedProduct = {
            nazwa_produktu: document.getElementById("edit_nazwa").value.trim(),
            nazwa_jednostki: document.getElementById("edit_jednostka").value,
            jednostka_per_gram: parseInt(document.getElementById("edit_gramy").value),
            czy_w_lodowce: document.getElementById("edit_lodowka").value,
            dzial_w_sklepie: document.getElementById("edit_dzial").value,
            makro: {
                kcal: parseFloat(document.getElementById("edit_kcal").value) || 0,
                b: parseFloat(document.getElementById("edit_b").value) || 0,
                t: parseFloat(document.getElementById("edit_t").value) || 0,
                w: parseFloat(document.getElementById("edit_w").value) || 0
            }
        };

        if (this.mode === "edit") {
            await Model.updateProduct(id, updatedProduct);
            showSaveNoticeGlobal();
        } else {
            await Model.addProduct(updatedProduct);
            Controller.openSuccessPopup();
        }

        showSaveNoticeGlobal();
        Modal.close("editProductModal");
        Controller.loadAndRender();
    },

    confirmDelete(id, name) {
        Model.productToDeleteId = id;
        Model.productToDeleteName = name;
        View.deleteMessage.textContent = `Czy na pewno chcesz usunąć produkt "${name}"?`;
        this.openDeletePopup();
    },

    async handleDelete() {
        if (!Model.productToDeleteId) return;
        await Model.deleteProduct(Model.productToDeleteId);
        Model.productToDeleteId = null;
        Model.productToDeleteName = "";
        this.closeDeletePopup();
        this.loadAndRender();
    },

    /************** POPUP FORM METHODS **************/
    openEditPopup(id) {
        this.mode = "edit";
        const product = Model.products.find(p => p.id === id);
        if (!product) return;

        document.getElementById("edit_id").value = product.id;
        document.getElementById("edit_nazwa").value = product.nazwa_produktu;
        document.getElementById("edit_jednostka").value = product.nazwa_jednostki;
        document.getElementById("edit_lodowka").value = product.czy_w_lodowce || "Nie";
        document.getElementById("edit_gramy").value = product.jednostka_per_gram;
        document.getElementById("edit_kcal").value = product.makro?.kcal || 0;
        document.getElementById("edit_b").value = product.makro?.b || 0;
        document.getElementById("edit_t").value = product.makro?.t || 0;
        document.getElementById("edit_w").value = product.makro?.w || 0;
        document.getElementById("edit_dzial").value = product.dzial_w_sklepie || "";

        document.getElementById("editModalTitle").textContent = "Edytuj produkt";
        document.getElementById("modalSubmitBtn").textContent = "Zapisz";

        Modal.open("editProductModal");
    },

    openAddPopup() {
        this.mode = "add";
        document.getElementById("editForm").reset();
        document.getElementById("edit_id").value = "";
        document.getElementById("edit_lodowka").value = "Nie";
        document.getElementById("edit_dzial").value = "";

        document.getElementById("editModalTitle").textContent = "Nowy produkt";
        document.getElementById("modalSubmitBtn").textContent = "Dodaj";

        Modal.open("editProductModal");
    },

    closeEditPopup() {
        const modal = document.getElementById("editProductModal");

        modal.classList.add("closing");

        setTimeout(() => {
            modal.classList.remove("show");
            modal.classList.remove("closing");
        }, 200);
    },

    /************** SORTING **************/
    sortTable(colIndex, isNumeric, forceAsc = null) {
        const table = document.getElementById("productsTable");
        const tbody = table.querySelector("tbody");
        const rows = Array.from(tbody.querySelectorAll("tr"));

        if (!Model.sortDirection) Model.sortDirection = {};

        if (forceAsc !== null) {
            Model.sortDirection[colIndex] = forceAsc;
        } else {
            Model.sortDirection[colIndex] = !Model.sortDirection[colIndex];
        }

        rows.sort((a, b) => {
            let aValue = a.cells[colIndex].textContent.trim();
            let bValue = b.cells[colIndex].textContent.trim();

            if (isNumeric) {
                aValue = parseFloat(aValue) || 0;
                bValue = parseFloat(bValue) || 0;
                return Model.sortDirection[colIndex] ? aValue - bValue : bValue - aValue;
            }

            return Model.sortDirection[colIndex]
                ? aValue.localeCompare(bValue)
                : bValue.localeCompare(aValue);
        });

        tbody.innerHTML = "";
        rows.forEach(row => tbody.appendChild(row));

        const headers = table.querySelectorAll("th");
        headers.forEach((th, index) => {
            const icon = th.querySelector(".sort-icon");
            if (!icon) return;
            if (index === colIndex) {
                icon.textContent = Model.sortDirection[colIndex] ? "▲" : "▼";
                icon.style.opacity = "1";
            } else {
                icon.textContent = "▲▼";
                icon.style.opacity = "0.4";
            }
        });

        // 🔥 zapis sortowania
        Model.savedSort = { colIndex, isNumeric, asc: Model.sortDirection[colIndex] };
    }
};

/************** GLOBAL NOTICES **************/

document.addEventListener("DOMContentLoaded", () => {
    Controller.init();
});

document.addEventListener("click", function (e) {
    const modal = document.getElementById("editProductModal");

    if (e.target === modal) {
        Modal.close("editProductModal");
    }
});
