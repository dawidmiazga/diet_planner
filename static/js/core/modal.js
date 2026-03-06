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
    }
};