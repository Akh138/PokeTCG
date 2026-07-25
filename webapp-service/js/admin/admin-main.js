// --- ADMIN MAIN ORCHESTRATOR ---

document.addEventListener("DOMContentLoaded", () => {
    // 1. Vérification de sécurité (Rigueur Habib)
    const userData = JSON.parse(localStorage.getItem("user_data"));

    // Si pas connecté OU si pas admin, on vire l'intrus vers le login
    if (!userData || userData.role !== 'ROLE_ADMIN') {
        alert("Accès réservé au Maître de la Ligue !");
        window.location.href = "login.html";
        return; // On arrête tout ici
    }

    initAdminUI();
    loadGlobalStats();
});

function initAdminUI() {
    const burger = document.getElementById("admin-burger");
    const drawer = document.getElementById("admin-drawer");
    const closeBtn = document.getElementById("close-admin-drawer");

    if(burger) burger.onclick = () => drawer.classList.add("open");
    if(closeBtn) closeBtn.onclick = () => drawer.classList.remove("open");

    // Navigation SPA
    document.querySelectorAll(".admin-nav-link").forEach(link => {
        link.onclick = (e) => {
            e.preventDefault();
            const target = link.getAttribute("data-target");

            document.querySelectorAll(".admin-nav-link").forEach(l => l.classList.remove("active"));
            link.classList.add("active");

            document.querySelectorAll(".admin-dashboard-view").forEach(v => {
                v.classList.remove("active");
                if(v.id === target) v.classList.add("active");
            });

            //Ici on déclenchera le chargement des données selon la vue
            if(target === "admin-view-users") loadAllUsers();
            if(target === "admin-view-market") loadMarketModeration();
            if(target === "admin-view-social") loadSocialManagement();
            if(target === "admin-view-home") loadGlobalStats();
            if(target === "admin-view-wallet") loadGlobalStats();

            drawer.classList.remove("open");
        };
    });
}

function logoutAdmin() {
    localStorage.clear();
    window.location.href = "../index.html";
}