const API = {
    async get(url) {
        const res = await fetch(url);
        return res.json();
    },

    async post(url, data = null) {
        return fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: data ? JSON.stringify(data) : null
        });
    },

    async put(url, data) {
        return fetch(url, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });
    },

    async delete(url) {
        return fetch(url, { method: "DELETE" });
    }
};