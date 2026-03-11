
/* =====================================================
   MACRO CALCULATOR (GLOBAL)
===================================================== */

const Macro = {

    calculate(ingredients, products, multiplier = 1) {

        let kcal = 0;
        let b = 0;
        let t = 0;
        let w = 0;

        ingredients.forEach(ingredient => {

            const product = products.find(p => p.id === ingredient.id);
            if (!product) return;

            const grams = ingredient.grams * multiplier;

            kcal += (product.makro.kcal || 0) * grams / 100;
            b += (product.makro.b || 0) * grams / 100;
            t += (product.makro.t || 0) * grams / 100;
            w += (product.makro.w || 0) * grams / 100;

        });

        return {
            kcal,
            b,
            t,
            w
        };
    },

    render(containerId, macros) {

        const el = document.getElementById(containerId);
        if (!el) return;

        el.innerHTML = `
            <div class="macro-line">

                <div class="macro-kcal">
                    🔥 ${Math.round(macros.kcal)} kcal
                </div>

                <div class="macro-item protein">
                    <span>B</span>
                    ${macros.b.toFixed(1)}g
                </div>

                <div class="macro-item carbs">
                    <span>W</span>
                    ${macros.w.toFixed(1)}g
                </div>

                <div class="macro-item fat">
                    <span>T</span>
                    ${macros.t.toFixed(1)}g
                </div>

            </div>
        `;
    }

};
