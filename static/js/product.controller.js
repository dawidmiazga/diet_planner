const View = {
    popupContainer: document.getElementById('popupContainer'),
    cancelButton: document.getElementById('cancelButton'),
    successPopup: document.getElementById("successPopup"),
    addAnotherYes: document.getElementById("addAnotherYes"),
    addAnotherNo: document.getElementById("addAnotherNo"),
    deletePopup: document.getElementById("deletePopup"),
    deleteMessage: document.getElementById("deleteMessage"),
    deleteYes: document.getElementById("deleteYes"),
    deleteNo: document.getElementById("deleteNo"),

    renderProducts(products) {
        const tbody = document.querySelector("#productsTable tbody");
        tbody.innerHTML = "";
        products.forEach((p) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td><input value="${p.nazwa_produktu}" onchange="Controller.updateProduct(${p.id}, this)"></td>
                <td>
                    <select onchange="Controller.updateProduct(${p.id}, this)">
                        {% for jednostka in jednostki %}
                        <option value="{{ jednostka }}" ${p.nazwa_jednostki == '{{ jednostka }}' ? 'selected' : ''}>{{ jednostka }}</option>
                        {% endfor %}
                    </select>
                </td>
                <td><input type="number" min="1" value="${p.jednostka_per_gram}" onchange="Controller.updateProduct(${p.id}, this)"></td>
                <td>
                    <select onchange="Controller.updateProduct(${p.id}, this)">
                        {% for dzial in dzialy %}
                        <option value="{{ dzial }}" ${p.dzial_w_sklepie == '{{ dzial }}' ? 'selected' : ''}>{{ dzial }}</option>
                        {% endfor %}
                    </select>
                </td>
                <td>
                    <select onchange="Controller.updateProduct(${p.id}, this)">
                        <option value="Tak" ${p.czy_w_lodowce == 'Tak' ? 'selected' : ''}>Tak</option>
                        <option value="Nie" ${p.czy_w_lodowce == 'Nie' ? 'selected' : ''}>Nie</option>
                        <option value="Czasem" ${p.czy_w_lodowce == 'Czasem' ? 'selected' : ''}>Czasem</option>
                    </select>
                </td>
                <td>
                    <button class="button-delete" onclick="Controller.confirmDelete(${p.id}, '${p.nazwa_produktu}')">Usuń</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    },

    getFilters() {
        return {
            nazwa: document.getElementById("filterNazwa").value.toLowerCase(),
            dzial: document.getElementById("filterDzial").value,
            lodowka: document.getElementById("filterLodowka").value
        };
    },

    togglePopup(popup, show) {
        popup.style.display = show ? "block" : "none";
    }
};


// import { ProductModel } from "./product.model.js";
// import { ProductView } from "./product.view.js";

// export function initProductApp() {

//     const tbody = document.querySelector("#productsTable tbody");
//     const popupContainer = document.getElementById("popupContainer");
//     const cancelButton = document.getElementById("cancelButton");
//     const successPopup = document.getElementById("successPopup");
//     const addAnotherYes = document.getElementById("addAnotherYes");
//     const addAnotherNo = document.getElementById("addAnotherNo");
//     const deletePopup = document.getElementById("deletePopup");
//     const deleteMessage = document.getElementById("deleteMessage");
//     const deleteYes = document.getElementById("deleteYes");
//     const deleteNo = document.getElementById("deleteNo");
//     const addForm = document.getElementById("addForm");
//     const filterNazwa = document.getElementById("filterNazwa");
//     const filterDzial = document.getElementById("filterDzial");
//     const filterLodowka = document.getElementById("filterLodowka");

//     let productToDeleteId = null;
//     let sortDirection = {};

//     async function loadProducts() {
//         let products = await ProductModel.getAll();

//         const dzialFilter = filterDzial.value;
//         const lodowkaFilter = filterLodowka.value;
//         const nazwaFilter = filterNazwa.value.toLowerCase();

//         if (dzialFilter) products = products.filter(p => p.dzial_w_sklepie === dzialFilter);
//         if (lodowkaFilter) products = products.filter(p => p.czy_w_lodowce === lodowkaFilter);
//         if (nazwaFilter) products = products.filter(p => p.nazwa_produktu.toLowerCase().includes(nazwaFilter));

//         ProductView.renderProducts(products, tbody);
//     }

//     // SORTOWANIE
//     function sortTable(colIndex, isNumeric = false) {
//         const rows = Array.from(tbody.rows);
//         sortDirection[colIndex] = !sortDirection[colIndex];

//         rows.sort((a, b) => {
//             let aValue = ProductView.getCellValue(a.cells[colIndex]).toLowerCase();
//             let bValue = ProductView.getCellValue(b.cells[colIndex]).toLowerCase();

//             if (isNumeric) {
//                 aValue = parseFloat(aValue) || 0;
//                 bValue = parseFloat(bValue) || 0;
//             }

//             if (aValue < bValue) return sortDirection[colIndex] ? -1 : 1;
//             if (aValue > bValue) return sortDirection[colIndex] ? 1 : -1;
//             return 0;
//         });

//         rows.forEach(row => tbody.appendChild(row));

//         const headers = document.querySelectorAll("#productsTable th");
//         headers.forEach((th, i) => {
//             const triangle = th.querySelector(".sort-triangle");
//             if (!triangle) return;
//             if (i === colIndex) {
//                 triangle.className = "sort-triangle " + (sortDirection[colIndex] ? "triangle-up" : "triangle-down");
//             } else {
//                 triangle.className = "sort-triangle triangle-none";
//             }
//         });
//     }

//     // OBSŁUGA MODALI
//     document.getElementById("openPopup").addEventListener("click", () => ProductView.showModal(popupContainer));
//     cancelButton.addEventListener("click", () => ProductView.hideModal(popupContainer));
//     popupContainer.addEventListener("click", e => { if (e.target === popupContainer) ProductView.hideModal(popupContainer); });

//     // ADD PRODUCT
//     addForm.addEventListener("submit", async e => {
//         e.preventDefault();
//         const newProduct = {
//             nazwa_produktu: addForm.nazwa_produktu.value.trim(),
//             nazwa_jednostki: addForm.nazwa_jednostki.value,
//             jednostka_per_gram: parseInt(addForm.jednostka_per_gram.value),
//             dzial_w_sklepie: addForm.dzial_w_sklepie.value,
//             czy_w_lodowce: addForm.czy_w_lodowce.value
//         };
//         if (!newProduct.nazwa_produktu || newProduct.jednostka_per_gram <= 0) {
//             alert("Proszę wprowadzić poprawne dane!");
//             return;
//         }

//         await ProductModel.create(newProduct);
//         addForm.reset();
//         await loadProducts();
//         ProductView.showModal(successPopup);
//     });

//     addAnotherYes.addEventListener("click", () => { ProductView.hideModal(successPopup); addForm.reset(); ProductView.showModal(popupContainer); });
//     addAnotherNo.addEventListener("click", () => { ProductView.hideModal(successPopup); ProductView.hideModal(popupContainer); });

//     // DELETE PRODUCT
//     tbody.addEventListener("click", e => {
//         if (!e.target.classList.contains("button-delete")) return;
//         productToDeleteId = e.target.dataset.id;
//         deleteMessage.textContent = `Czy na pewno chcesz usunąć produkt "${e.target.dataset.name}"?`;
//         ProductView.showModal(deletePopup);
//     });

//     deleteYes.addEventListener("click", async () => {
//         if (!productToDeleteId) return;
//         await ProductModel.delete(productToDeleteId);
//         productToDeleteId = null;
//         ProductView.hideModal(deletePopup);
//         loadProducts();
//     });
//     deleteNo.addEventListener("click", () => { productToDeleteId = null; ProductView.hideModal(deletePopup); });

//     // UPDATE PRODUCT
//     window.updateProduct = async function(id, input) {
//         const row = input.closest("tr");
//         const updatedProduct = {
//             nazwa_produktu: row.cells[0].querySelector("input").value.trim(),
//             nazwa_jednostki: row.cells[1].querySelector("select").value,
//             jednostka_per_gram: parseInt(row.cells[2].querySelector("input").value),
//             dzial_w_sklepie: row.cells[3].querySelector("select").value,
//             czy_w_lodowce: row.cells[4].querySelector("select").value
//         };
//         if (!updatedProduct.nazwa_produktu || updatedProduct.jednostka_per_gram <= 0) {
//             alert("Proszę wprowadzić poprawne dane!");
//             loadProducts();
//             return;
//         }
//         await ProductModel.update(id, updatedProduct);
//     };

//     // SORTING TRIANGLES
//     document.addEventListener("DOMContentLoaded", () => {
//         const headers = document.querySelectorAll("#productsTable th");
//         headers.forEach((th, index) => {
//             if (index === 5) return; // Akcje
//             const triangle = document.createElement("span");
//             triangle.className = "sort-triangle triangle-none";
//             triangle.onclick = e => { e.stopPropagation(); sortTable(index, index === 2); };
//             th.appendChild(triangle);
//         });
//     });

//     // FILTERS
//     filterNazwa.addEventListener("input", loadProducts);
//     filterDzial.addEventListener("change", loadProducts);
//     filterLodowka.addEventListener("change", loadProducts);

//     loadProducts();
// }
