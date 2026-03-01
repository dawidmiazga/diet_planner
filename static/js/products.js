/* =====================================================
   STATE
===================================================== */

const ProductsState = {
    products: [],
    productToDeleteId: null,
    productToDeleteName: "",
    sortDirection: {},
    savedSort: null,
    mode: "add"
};

const $ = id => document.getElementById(id);

/* =====================================================
   API
===================================================== */

const ProductsAPI = {
    async fetchProducts() {
        ProductsState.products = await API.get("/api/products");
        return ProductsState.products;
    },

    async addProduct(product) {
        ProductsState.products = await API.post("/api/products", product);
    },

    async updateProduct(id, product) {
        ProductsState.products = await API.put(`/api/products/${id}`, product);
    },

    async deleteProduct(id) {
        await API.delete(`/api/products/${id}`);
    }
};

/* =====================================================
   UI
===================================================== */

const ProductsUI = {
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
        this.popupContainer = $('popupContainer');
        this.cancelButton = $('cancelButton');
        this.successPopup = $("successPopup");
        this.addAnotherYes = $("addAnotherYes");
        this.addAnotherNo = $("addAnotherNo");
        this.deletePopup = $("deletePopup");
        this.deleteMessage = $("deleteMessage");
        this.deleteYes = $("deleteYes");
        this.deleteNo = $("deleteNo");
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
                    <button class="btn yellow-btn" onclick="Products.openEditPopup(${p.id})">Edytuj</button>
                    <button class="btn red-btn" onclick="Products.confirmDelete(${p.id}, '${p.nazwa_produktu}')">Usuń</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    },

    getFilters() {
        return {
            nazwa: $("filterNazwa").value.toLowerCase()
        };
    },

    sortTable(colIndex, isNumeric, forceAsc = null) {
        const table = $("productsTable");
        const tbody = table.querySelector("tbody");
        const rows = Array.from(tbody.querySelectorAll("tr"));

        if (!ProductsState.sortDirection) ProductsState.sortDirection = {};

        if (forceAsc !== null) {
            ProductsState.sortDirection[colIndex] = forceAsc;
        } else {
            ProductsState.sortDirection[colIndex] = !ProductsState.sortDirection[colIndex];
        }

        rows.sort((a, b) => {
            let aValue = a.cells[colIndex].textContent.trim();
            let bValue = b.cells[colIndex].textContent.trim();

            if (isNumeric) {
                aValue = parseFloat(aValue) || 0;
                bValue = parseFloat(bValue) || 0;
                return ProductsState.sortDirection[colIndex] ? aValue - bValue : bValue - aValue;
            }

            return ProductsState.sortDirection[colIndex]
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
                icon.textContent = ProductsState.sortDirection[colIndex] ? "▲" : "▼";
                icon.style.opacity = "1";
            } else {
                icon.textContent = "▲▼";
                icon.style.opacity = "0.4";
            }
        });

        ProductsState.savedSort = { colIndex, isNumeric, asc: ProductsState.sortDirection[colIndex] };
    }
};

/* =====================================================
   PRODUCTS LOGIC
===================================================== */

const Products = {
    mode: "add", // add | edit

    async init() {
        ProductsUI.init();
        this.bindEvents();
        await this.loadAndRender();

        // domyślne sortowanie na starcie: kolumna Nazwa, ascending
        if (!ProductsState.sortDirection[0]) ProductsState.sortDirection[0] = true; // ascending
        ProductsUI.sortTable(0, false, true);
    },

    bindEvents() {
        const editForm = $("editForm");
        if (editForm) {
            editForm.addEventListener("submit", async (e) => {
                e.preventDefault();
                await this.handleEditForm(e);
            });
        }

        ProductsUI.addAnotherYes.addEventListener("click", () => {
            Products.closeSuccessPopup();
            Products.openAddPopup(); // od razu otwórz formularz dodawania
        });

        ProductsUI.addAnotherNo.addEventListener("click", () => {
            Products.closeSuccessPopup();
        });

        ProductsUI.deleteNo.addEventListener("click", () => {
            ProductsState.productToDeleteId = null;
            Products.closeDeletePopup();
        });

        ProductsUI.deleteYes.addEventListener("click", () => this.handleDelete());

        this.closeDeletePopup();

        const filterInput = $("filterNazwa");
        const clearBtn = $("clearProductFilter");
        const wrapper = $("productFilterWrapper");

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
    openDeletePopup() { $("deletePopup").classList.add("show"); },
    closeDeletePopup() {
        const modal = $("deletePopup");

        modal.classList.add("closing");

        setTimeout(() => {
            modal.classList.remove("show");
            modal.classList.remove("closing");
        }, 200);
    },
    
    openSuccessPopup() { $("successPopup").classList.add("show"); }, closeSuccessPopup() {
        const modal = $("successPopup");

        modal.classList.add("closing");

        setTimeout(() => {
            modal.classList.remove("show");
            modal.classList.remove("closing");
        }, 200);
    },

    /************** DATA METHODS **************/
    async loadAndRender() {
        await ProductsAPI.fetchProducts();
        this.applyFilters();
    },

    applyFilters() {
        const filters = ProductsUI.getFilters();
        let filtered = ProductsState.products.slice();

        if (filters.nazwa) {
            filtered = filtered.filter(p =>
                p.nazwa_produktu.toLowerCase().includes(filters.nazwa)
            );
        }

        ProductsUI.renderProducts(filtered);

        if (ProductsState.savedSort) {
            const { colIndex, isNumeric, asc } = ProductsState.savedSort;
            ProductsUI.sortTable(colIndex, isNumeric, asc); // forceAsc = zachowujemy kierunek
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
                kcal: parseFloat($("kcal").value) || 0,
                b: parseFloat($("b").value) || 0,
                t: parseFloat($("t").value) || 0,
                w: parseFloat($("w").value) || 0
            }
        };
        if (!newProduct.nazwa_produktu || newProduct.jednostka_per_gram <= 0) {
            alert("Proszę wprowadzić poprawne dane!");
            return;
        }
        await ProductsAPI.addProduct(newProduct);
        form.reset();
        this.loadAndRender();
        this.openSuccessPopup();
    },

    async handleEditForm(e) {
        const id = $("edit_id").value;
        const updatedProduct = {
            nazwa_produktu: $("edit_nazwa").value.trim(),
            nazwa_jednostki: $("edit_jednostka").value,
            jednostka_per_gram: parseInt($("edit_gramy").value),
            czy_w_lodowce: $("edit_lodowka").value,
            dzial_w_sklepie: $("edit_dzial").value,
            makro: {
                kcal: parseFloat($("edit_kcal").value) || 0,
                b: parseFloat($("edit_b").value) || 0,
                t: parseFloat($("edit_t").value) || 0,
                w: parseFloat($("edit_w").value) || 0
            }
        };

        if (this.mode === "edit") {
            await ProductsAPI.updateProduct(id, updatedProduct);
            showSaveNoticeGlobal();
        } else {
            await ProductsAPI.addProduct(updatedProduct);
            Products.openSuccessPopup();
        }

        showSaveNoticeGlobal();
        Modal.close("editProductModal");
        Products.loadAndRender();
    },

    confirmDelete(id, name) {
        ProductsState.productToDeleteId = id;
        ProductsState.productToDeleteName = name;
        ProductsUI.deleteMessage.textContent = `Czy na pewno chcesz usunąć produkt "${name}"?`;
        this.openDeletePopup();
    },

    async handleDelete() {
        if (!ProductsState.productToDeleteId) return;
        await ProductsAPI.deleteProduct(ProductsState.productToDeleteId);
        ProductsState.productToDeleteId = null;
        ProductsState.productToDeleteName = "";
        this.closeDeletePopup();
        this.loadAndRender();
    },

    /************** POPUP FORM METHODS **************/
    openEditPopup(id) {
        this.mode = "edit";
        const product = ProductsState.products.find(p => p.id === id);
        if (!product) return;

        $("edit_id").value = product.id;
        $("edit_nazwa").value = product.nazwa_produktu;
        $("edit_jednostka").value = product.nazwa_jednostki;
        $("edit_lodowka").value = product.czy_w_lodowce || "Nie";
        $("edit_gramy").value = product.jednostka_per_gram;
        $("edit_kcal").value = product.makro?.kcal || 0;
        $("edit_b").value = product.makro?.b || 0;
        $("edit_t").value = product.makro?.t || 0;
        $("edit_w").value = product.makro?.w || 0;
        $("edit_dzial").value = product.dzial_w_sklepie || "";

        $("editModalTitle").textContent = "Edytuj produkt";
        $("modalSubmitBtn").textContent = "Zapisz";

        Modal.open("editProductModal");
    },

    openAddPopup() {
        this.mode = "add";
        $("editForm").reset();
        $("edit_id").value = "";
        $("edit_lodowka").value = "Nie";
        $("edit_dzial").value = "";

        $("editModalTitle").textContent = "Nowy produkt";
        $("modalSubmitBtn").textContent = "Dodaj";

        Modal.open("editProductModal");
    },

    closeEditPopup() {
        const modal = $("editProductModal");

        modal.classList.add("closing");

        setTimeout(() => {
            modal.classList.remove("show");
            modal.classList.remove("closing");
        }, 200);
    },

};

/* =====================================================
   INIT
===================================================== */

document.addEventListener("DOMContentLoaded", () => {
    Products.init();
});

document.addEventListener("click", function (e) {
    const modal = $("editProductModal");

    if (e.target === modal) {
        Modal.close("editProductModal");
    }
});
