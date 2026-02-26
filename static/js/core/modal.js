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
    }
};