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

// export const ProductView = {

//     renderProducts(products, tbody) {
//         tbody.innerHTML = "";

//         products.forEach(p => {
//             const row = document.createElement("tr");
//             row.innerHTML = `
//                 <td><input value="${p.nazwa_produktu}" onchange="updateProduct(${p.id}, this)"></td>
//                 <td>
//                     <select onchange="updateProduct(${p.id}, this)">
//                         {% for jednostka in jednostki %}
//                         <option value="{{ jednostka }}" ${p.nazwa_jednostki == '{{ jednostka }}' ? 'selected' : ''}>
//                             {{ jednostka }}
//                         </option>
//                         {% endfor %}
//                     </select>
//                 </td>
//                 <td><input type="number" min="1" value="${p.jednostka_per_gram}" onchange="updateProduct(${p.id}, this)"></td>
//                 <td>
//                     <select onchange="updateProduct(${p.id}, this)">
//                         {% for dzial in dzialy %}
//                         <option value="{{ dzial }}" ${p.dzial_w_sklepie == '{{ dzial }}' ? 'selected' : ''}>
//                             {{ dzial }}
//                         </option>
//                         {% endfor %}
//                     </select>
//                 </td>
//                 <td>
//                     <select onchange="updateProduct(${p.id}, this)">
//                         <option value="Tak" ${p.czy_w_lodowce == 'Tak' ? 'selected' : ''}>Tak</option>
//                         <option value="Nie" ${p.czy_w_lodowce == 'Nie' ? 'selected' : ''}>Nie</option>
//                         <option value="Czasem" ${p.czy_w_lodowce == 'Czasem' ? 'selected' : ''}>Czasem</option>
//                     </select>
//                 </td>
//                 <td>
//                     <button class="button-delete" data-id="${p.id}" data-name="${p.nazwa_produktu}">Usuń</button>
//                 </td>
//             `;
//             tbody.appendChild(row);
//         });
//     },

//     showModal(modal) {
//         modal.style.display = "block";
//     },

//     hideModal(modal) {
//         modal.style.display = "none";
//     },

//     getCellValue(cell) {
//         const input = cell.querySelector("input");
//         if (input) return input.value.trim();
//         const select = cell.querySelector("select");
//         if (select) return select.value;
//         return cell.textContent.trim();
//     }
// };
