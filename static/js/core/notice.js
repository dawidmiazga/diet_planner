function showSaveNoticeGlobal(state = "success") {
    let notice = document.querySelector(".save-notice-global");

    if (!notice) {
        notice = document.createElement("div");
        notice.className = "save-notice-global";
        document.body.appendChild(notice);
    }

    if (state === "loading") {
        notice.textContent = "Zapisywanie...";
        notice.classList.remove("success", "error");
        notice.classList.add("show");
    }

    if (state === "success") {
        notice.textContent = "Zapisano ✔";
        notice.classList.remove("error");
        notice.classList.add("success", "show");
        setTimeout(() => notice.classList.remove("show"), 1200);
    }

    if (state === "error") {
        notice.textContent = "Błąd zapisu ❌";
        notice.classList.remove("success");
        notice.classList.add("error", "show");
        setTimeout(() => notice.classList.remove("show"), 2000);
    }
}