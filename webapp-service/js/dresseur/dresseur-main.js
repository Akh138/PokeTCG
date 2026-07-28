// --- 1. ADRESSES DE MES MICROSERVICES ---
const API_IDENTITY     = "http://localhost:8081/api/auth";
const API_CATALOG      = "http://localhost:8083/api/catalog";
const API_INVENTORY    = "http://localhost:8084/api/inventory";
const API_MARKETPLACE  = "http://localhost:8085/api/marketplace";
const API_WALLETS      = "http://localhost:8082/api/wallets";
const API_SOCIAL       = "http://localhost:8086/api/social/forum";

// --- 2. VARIABLES GLOBALES DE SESSION ---
let toutesLesExtensions = [];
let monInventaire = [];
let mesAnnonces = [];
let annoncesPubliques = [];
let carteEnCoursDeCapture = null;
let carteEnCoursDeVente = null;
let versionSelectionnee = "Normal";

// --- DÉMARRAGE DE L'APPLICATION ---
document.addEventListener("DOMContentLoaded", async () => {
    const userData = JSON.parse(localStorage.getItem("user_data"));
    const userToken = localStorage.getItem("user_token");

    if (!userData || !userToken) {
        window.location.href = "login.html";
        return;
    }

    const nomUtilisateur = userData.username || userData.pseudo;
    document.getElementById("display-pseudo").innerText = nomUtilisateur;

    try {
        const userFull = await chargerInfosDresseur(nomUtilisateur, userToken);
        if (userFull && userFull.id) {
            await chargerInventairePrivé(userFull.id);
            await chargerMesAnnonces(userFull.id);
            await chargerSoldeDresseur(userFull.id);
        }
        await chargerExtensionsMondiales();
        mettreAJourStatsAccueil();
    } catch (error) {
        console.error("Erreur démarrage :", error);
    }

    initUIControls();
    initAvatarSystem();
    initCaptureLogic();
    initSearchLogic();
});

// Fonctions socles (Profil, Logout)
async function chargerInfosDresseur(pseudo, token) {
    const reponse = await fetch(`${API_IDENTITY}/user/${pseudo}`, {
        headers: { "Authorization": "Bearer " + token }
    });
    if (reponse.ok) {
        const fullUser = await reponse.json();
        document.getElementById("display-email").innerText = fullUser.email;
        document.getElementById("display-address").innerText = `${fullUser.address}, ${fullUser.zipCode}`;
        localStorage.setItem("user_data", JSON.stringify(fullUser));
        return fullUser;
    }
}

function logout() { localStorage.clear(); window.location.href = "../index.html"; }

// --- FONCTION DE CONTRÔLE DE L'INTERFACE (MENU & ONGLETS) ---
function initUIControls() {
    const burgerBtn = document.getElementById("burger-toggle");
    const drawer = document.getElementById("side-drawer");
    const closeDrawerBtn = document.getElementById("close-drawer");

    // 1. Gestion de l'ouverture/fermeture du menu
    if(burgerBtn) burgerBtn.onclick = () => drawer.classList.add("open");
    if(closeDrawerBtn) closeDrawerBtn.onclick = () => drawer.classList.remove("open");

    // 2. Gestion de la navigation par onglets (Single Page Application)
    document.querySelectorAll(".nav-link").forEach(link => {
        link.onclick = (e) => {
            e.preventDefault();
            const target = link.getAttribute("data-target");

            // Mise à jour visuelle des liens
            document.querySelectorAll(".nav-link").forEach(l => l.classList.remove("active"));
            link.classList.add("active");

            // Changement de vue
            document.querySelectorAll(".dashboard-view").forEach(v => {
                v.classList.remove("active");
                if (v.id === target) v.classList.add("active");
            });

            // Chargement des données spécifiques à l'onglet
            if (target === "view-collection") afficherMaCollection();
            if (target === "view-market") chargerMarcheMondial();
            if (target === "view-my-sales") chargerGestionVentes();
            if (target === "view-forum") chargerMessagesForum();
            if (target === "view-home") mettreAJourStatsAccueil();

            if (target === "view-wallet") {
                const userData = JSON.parse(localStorage.getItem("user_data"));
                if(userData && userData.id) {
                    chargerSoldeDresseur(userData.id);
                    chargerHistoriquePortefeuille(userData.id);
                }
            }

            // On referme le menu sur mobile après le clic
            drawer.classList.remove("open");
        };
    });
}

// --- GESTION DU SYSTÈME D'AVATARS ---
function initAvatarSystem() {
    const avatars = ['avatar1.png', 'avatar2.png', 'avatar3.png', 'avatar4.png']; // Rigueur : on s'arrête à 3
    const list = document.getElementById("avatar-list");
    if(!list) return;

    list.innerHTML = "";
    avatars.forEach(fileName => {
        const img = document.createElement("img");
        img.src = `../assets/avatars/${fileName}`;
        img.className = "avatar-choice";
        img.onclick = () => {
            document.getElementById("current-avatar").src = `../assets/avatars/${fileName}`;
            localStorage.setItem("user_avatar", fileName);
            closeAvatarModal();
        };
        list.appendChild(img);
    });

    // On charge l'avatar sauvegardé
    const saved = localStorage.getItem("user_avatar");
    if(saved) {
        const currentAvatarImg = document.getElementById("current-avatar");
        if (currentAvatarImg) currentAvatarImg.src = `../assets/avatars/${saved}`;
    }

    // --- HELPERS GLOBAUX : ACCESSIBLES PAR LE HTML (window) ---

    window.openAvatarModal = function() {
        const modal = document.getElementById("avatar-modal");
        if (modal) modal.style.display = "flex";
    };

    window.closeAvatarModal = function() {
        const modal = document.getElementById("avatar-modal");
        if (modal) modal.style.display = "none";
    };

    window.openEditModal = function() {
        const u = JSON.parse(localStorage.getItem("user_data"));
        if (u) {
            document.getElementById("edit-address").value = u.address || "";
            document.getElementById("edit-zip").value = u.zipCode || "";
            document.getElementById("edit-phone").value = u.phone || "";
            const modal = document.getElementById("edit-profile-modal");
            if (modal) modal.style.display = "flex";
        }
    };

    window.closeEditModal = function() {
        const modal = document.getElementById("edit-profile-modal");
        if (modal) modal.style.display = "none";
    };

// On attache aussi la sauvegarde au contexte global
    window.sauvegarderProfil = async function() {
        const userData = JSON.parse(localStorage.getItem("user_data"));
        const token = localStorage.getItem("user_token");

        const body = {
            address: document.getElementById("edit-address").value,
            zipCode: document.getElementById("edit-zip").value,
            phone: document.getElementById("edit-phone").value
        };

        try {
            const res = await fetch(`${API_IDENTITY}/update/${userData.id}`, {
                method: "PUT",
                headers: {
                    "Authorization": "Bearer " + token,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                // Utilisation de la nouvelle modale 
                await pokeAlert("PROFIL", "Vos coordonnées ont été mises à jour avec succès !");
                window.closeEditModal();
                await chargerInfosDresseur(userData.username || userData.pseudo, token);
            } else {
                await pokeAlert("ÉCHEC", "Le serveur a refusé la mise à jour des données.");
            }
        } catch (e) {
            console.error("Erreur mise à jour profil :", e);
            await pokeAlert("MAINTENANCE", "Impossible de joindre le microservice Identity.");
        }
    };
}