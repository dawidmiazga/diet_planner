const Model = {
    products: [],
    productToDeleteId: null,
    productToDeleteName: "",
    sortDirection: {},

    async fetchProducts() {
        const res = await fetch("/api/products");
        this.products = await res.json();
        return this.products;
    },

    async addProduct(product) {
        await fetch("/api/products", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(product)
        });
    },

    async updateProduct(id, product) {
        await fetch(`/api/products/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(product)
        });
    },

    async deleteProduct(id) {
        await fetch(`/api/products/${id}`, { method: "DELETE" });
    }
};

// export const ProductModel = {

//     async getAll() {
//         const res = await fetch("/api/products");
//         return res.json();
//     },

//     async create(product) {
//         return fetch("/api/products", {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify(product)
//         });
//     },

//     async update(id, product) {
//         return fetch(`/api/products/${id}`, {
//             method: "PUT",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify(product)
//         });
//     },

//     async delete(id) {
//         return fetch(`/api/products/${id}`, { method: "DELETE" });
//     }
// };
