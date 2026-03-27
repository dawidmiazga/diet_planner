const Modal = {
    open(id) {
        document.getElementById(id).classList.add("show");
    },

    close(id) {
        const modal = document.getElementById(id);
        modal.classList.add("closing");

        setTimeout(() => {
            modal.classList.remove("show");
            modal.classList.remove("closing");
        }, 200);
    },

    closeModal() {
        const modal = document.getElementById("mealModal");
        modal.classList.add("closing");

        setTimeout(() => {
            modal.classList.remove("show");
            modal.classList.remove("closing");
        }, 200);
    },

    // Zamknięcie modalu produktu
    closeProductModal() {
        const modal = document.getElementById("productModal");

        modal.classList.add("closing");

        setTimeout(() => {
            modal.classList.remove("show");
            modal.classList.remove("closing");
            DishesState.selectedProductId = null;
        }, 200);
    },

    closeDescriptionModal() {
        const editBtn = $("editMealFromPreviewBtn");
        editBtn.style.display = "none";

        $("mealDescriptionModal").classList.remove("show");

        AppState.currentPortionMultiplier = 1.0;
        AppState.baseIngredients = [];

        const portionEl = $("portionValue");
        if (portionEl) portionEl.innerText = "1.0";
    },

    confirmDeleteMeal() {
        const id = document.getElementById("mealId").value;
        if (!id) return;

        DishesState.mealToDeleteId = id;

        const mealName = document.getElementById("mealName").value;

        const message = document.getElementById("deleteMessage");
        message.textContent = `Czy na pewno chcesz usunąć danie "${mealName}"?`;

        document.getElementById("deletePopup").classList.add("show");
    },

    async openProductModal() {
        try {
            const data = await DishesAPI.fetchProducts();

            data.sort((a, b) =>
                a.nazwa_produktu.localeCompare(
                    b.nazwa_produktu,
                    'pl',
                    { sensitivity: 'base' }
                )
            );

            const searchInput = $("productSearch");
            searchInput.value = "";

            setTimeout(() => {
                searchInput.focus();
            }, 220);

            DishesState.products = data;

            DishesUI.renderProductList(data);

            document.getElementById("productSearch").value = "";
            document.getElementById("productModal").classList.add("show");

        } catch (err) {
            console.error(err);
            alert("Błąd ładowania produktów");
        }
    },

    selectProduct() {
        if (!DishesState.selectedProductId) return alert("Wybierz produkt");

        const grams = Number(document.getElementById("productGrams").value);
        if (!grams || grams <= 0) return alert("Podaj ilość w gramach");

        const selectedItem = document.querySelector(`#productsList .product-item[data-id='${DishesState.selectedProductId}']`);
        const name = selectedItem.dataset.name;

        ModalShared.addIngredientField(name, grams, DishesState.selectedProductId);
        Dishes.closeProductModal();
    },

    closeEditPopup() {
        const modal = $("editProductModal");

        modal.classList.add("closing");

        setTimeout(() => {
            modal.classList.remove("show");
            modal.classList.remove("closing");
        }, 200);
    },

    closeDeletePopup() {
        const modal = $("deletePopup");

        modal.classList.add("closing");

        setTimeout(() => {
            modal.classList.remove("show");
            modal.classList.remove("closing");
        }, 200);
    },

    closeSuccessPopup() {
        const modal = $("successPopup");

        modal.classList.add("closing");

        setTimeout(() => {
            modal.classList.remove("show");
            modal.classList.remove("closing");
        }, 200);
    },

    closePlannerMealModal() {
        const modal = $("plannerMealModal");
        closeModalElement(modal);
    },


};