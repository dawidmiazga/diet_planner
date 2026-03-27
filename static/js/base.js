/* =====================================================
   STATE
===================================================== */

const BaseState = {
    nav: null,
    highlight: null
};

/* =====================================================
   CONFIG
===================================================== */

const DISH_CONFIG = {
    osoba1: {
        1: "Śniadanie",
        2: "II Śniadanie",
        3: "Obiad",
        4: "Kolacja",
        5: "Przekąska"
    },
    osoba2: {
        1: "Śniadanie",
        2: "Obiad",
        3: "Kolacja",
        4: "Przekąska",
        5: "II Śniadanie"
    }
};

/* =====================================================
   UI
===================================================== */

const BaseUI = {

    moveHighlight(el) {
        const rect = el.getBoundingClientRect();
        const navRect = BaseState.nav.getBoundingClientRect();

        BaseState.highlight.style.width = `${rect.width}px`;
        BaseState.highlight.style.left = `${rect.left - navRect.left}px`;
    }

};

/* =====================================================
   BASE LOGIC
===================================================== */

const Base = {

    initNavHighlight() {

        if (!BaseState.nav || !BaseState.highlight) return;

        const active = BaseState.nav.querySelector(".nav-link.active");

        if (active) {
            BaseUI.moveHighlight(active);
        }

        BaseState.nav.querySelectorAll(".nav-link").forEach(link => {

            link.addEventListener("mouseenter", () => {
                BaseUI.moveHighlight(link);
            });

            link.addEventListener("mouseleave", () => {

                const active = BaseState.nav.querySelector(".nav-link.active");

                if (active) {
                    BaseUI.moveHighlight(active);
                }

            });

        });

    },

    initPageAnimation() {

        const content = $("pageContent");

        if (!content) return;

        setTimeout(() => {
            content.classList.add("show");
        }, 50);

    },

    bindGlobalEvents() {

        // ESC zamyka modale
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") {
                $$(".modal.show").forEach(modal => {
                    closeModalElement(modal);
                });
            }
        });

        // klik w tło
        document.addEventListener("click", (e) => {
            if (e.target.classList.contains("modal")) {
                closeModalElement(e.target);
            }
        });
    }
};

/* =====================================================
   INIT
===================================================== */

document.addEventListener("DOMContentLoaded", () => {
    BaseState.nav = $("mainNav");
    BaseState.highlight = $("navHighlight");

    Base.initNavHighlight();
    Base.initPageAnimation();
    Base.bindGlobalEvents();

});

/* =====================================================
   FUNCTIONS
===================================================== */

function closeModalElement(modal) {
    if (!modal) return;
    modal.classList.add("closing");

    setTimeout(() => {
        modal.classList.remove("show");
        modal.classList.remove("closing");
    }, 200);
}

window.$ = function (id) {
    return document.getElementById(id);
};

window.$$ = function (selector) {
    return document.querySelectorAll(selector);
};