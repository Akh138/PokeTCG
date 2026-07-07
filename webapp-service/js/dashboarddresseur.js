// --- LOGIQUE DU DASHBOARD DRESSEUR - PokeTCG (VERSION ÉLITE SYNCHRONISÉE) ---

// 1. ADRESSES DE MES MICROSERVICES
const API_IDENTITY  = "http://localhost:8081/api/auth";
const API_CATALOG   = "http://localhost:8083/api/catalog";
const API_INVENTORY = "http://localhost:8084/api/inventory";

// 2. VARIABLES GLOBALES DE SESSION
let toutesLesExtensions = [];
let monInventaire = [];
let carteEnCoursDeCapture = null;
let versionSelectionnee = "Normal";

// --- DÉMARRAGE DE L'APPLICATION ---
document.addEventListener("DOMContentLoaded", async () => {

    // VÉRIFICATION DE SÉCURITÉ JWT
    const userData = JSON.parse(localStorage.getItem("user_data"));
    const userToken = localStorage.getItem("user_token");

    if (!userData || !userToken) {
        console.warn("Session absente, redirection...");
        window.location.href = "login.html";
        return;
    }

    // A. INITIALISATION DU PROFIL (MySQL 8081)
    // Je commence par afficher le pseudo pour rassurer l'utilisateur
    document.getElementById("display-pseudo").innerText = userData.pseudo;

    // B. CHARGEMENT DES DONNÉES EN CASCADE (ORDRE CRITIQUE)
    try {
        // 1. Je récupère d'abord les infos complètes (Email, Adresse, Solde)
        await chargerInfosDresseur(userData.pseudo, userToken);

        // 2. TRÈS IMPORTANT : Je récupère mon inventaire MySQL AVANT d'afficher le catalogue
        // C'est ce qui règle le bug des barres de progression à 0
        const freshUserData = JSON.parse(localStorage.getItem("user_data"));
        await chargerInventairePrivé(freshUserData.id);

        // 3. Maintenant que j'ai mon inventaire en mémoire, je peux afficher les extensions
        // Les barres de progression seront calculées avec les vrais chiffres immédiatement
        await chargerExtensionsMondiales();

    } catch (error) {
        console.error("Erreur lors du démarrage du Dashboard :", error);
    }

    // C. ACTIVATION DES ÉCOUTEURS D'ÉVÉNEMENTS
    initUIControls();      // Burger et Onglets
    initAvatarSystem();    // Choix des portraits
    initCaptureLogic();    // Modale de capture
    initSearchLogic();     // Recherche globale (Entrée)
});


// --- SECTION : GESTION DU ZOOM (LIGHTBOX) ---

window.ouvrirZoom = function(url, event) {
    if (event) event.stopPropagation();

    const modal = document.getElementById("card-modal");
    const img = document.getElementById("img-zoom");

    if (modal && img) {
        img.src = url;
        modal.style.display = "flex";
    }
};


// --- SECTION : EXPLORATEUR ET RECHERCHE (CATALOG) ---

async function chargerExtensionsMondiales() {
    try {
        const reponse = await fetch(`${API_CATALOG}/extensions`);
        const result = await reponse.json();
        toutesLesExtensions = result.data;

        // Tri par date de sortie décroissante
        toutesLesExtensions.sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate));

        remplirLeSelectExtensions(toutesLesExtensions);

        // J'affiche la galerie (elle utilisera monInventaire chargé à l'étape A)
        afficherGalerieExtensions(toutesLesExtensions);
    } catch (error) {
        console.error("Erreur microservice Catalog :", error);
    }
}

// Habib : Voici ma logique de calcul de progression set par set
function afficherGalerieExtensions(liste) {
    const grid = document.getElementById("pokedex-grid");
    if (!grid) return;
    grid.innerHTML = "";

    liste.forEach(ext => {
        // 1. Je filtre mon inventaire MySQL pour cette extension précise
        const mesCartesDuSet = monInventaire.filter(c => c.extension === ext.name);

        // 2. Je compte combien de cartes différentes je possède
        const uniqueOwnedIds = [...new Set(mesCartesDuSet.map(c => c.idCarteApi))];
        const nbPossedes = uniqueOwnedIds.length;

        // 3. Je récupère le total de l'API et je calcule le %
        const totalSet = ext.total;
        const pourcentage = Math.round((nbPossedes / totalSet) * 100);

        grid.innerHTML += `
            <div class="extension-card glass" onclick="voirCartesDeLExtension('${ext.id}')">
                <img src="${ext.images.logo}" alt="${ext.name}">
                <div class="ext-info">
                    <p class="series-name">${ext.series}</p>
                    <h3>${ext.name}</h3>
                    <p class="release-date">Sortie : ${ext.releaseDate}</p>

                    <!-- MA BARRE DE PROGRESSION (POKÉCARDEX STYLE) -->
                    <div class="ext-progress">
                        <div class="ext-progress-info">
                            <span>Possédées</span>
                            <span>${nbPossedes} / ${totalSet}</span>
                        </div>
                        <div class="ext-progress-bg">
                            <div class="ext-progress-fill ${pourcentage === 100 ? 'completed' : ''}" 
                                 style="width: ${pourcentage}%">
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
    });
}

// Habib : Synchronisation MySQL avant d'entrer dans un set
async function voirCartesDeLExtension(setId) {
    const grid = document.getElementById("pokedex-grid");
    const userData = JSON.parse(localStorage.getItem("user_data"));
    const extInfo = toutesLesExtensions.find(e => e.id === setId);

    grid.innerHTML = `<p style="grid-column: 1/-1; text-align:center;">Synchronisation de l'inventaire...</p>`;

    try {
        await chargerInventairePrivé(userData.id);
        const reponse = await fetch(`${API_CATALOG}/set/${setId}`);
        const cartes = await reponse.json();

        grid.innerHTML = `
            <div class="grid-header">
                <button class="filter-btn back-btn" onclick="chargerExtensionsMondiales()">Retour</button>
                <h2>${extInfo.name}</h2>
            </div>`;

        afficherGrillePokemon(cartes, extInfo.name);

    } catch (error) {
        alert("Erreur lors du chargement.");
    }
}

async function rechercherGlobalement(nom) {
    const grid = document.getElementById("pokedex-grid");
    const userData = JSON.parse(localStorage.getItem("user_data"));
    grid.innerHTML = `<p style="grid-column: 1/-1; text-align:center;">Recherche dans toutes les extensions...</p>`;

    try {
        await chargerInventairePrivé(userData.id);
        const reponse = await fetch(`${API_CATALOG}/search/${nom}`);
        const resultats = await reponse.json();

        grid.innerHTML = `
            <div class="grid-header">
                <button class="filter-btn back-btn" onclick="chargerExtensionsMondiales()">Retour</button>
                <h2>Résultats pour : "${nom}"</h2>
            </div>`;

        afficherGrillePokemon(resultats, "Résultats Mondiaux");
    } catch (error) {
        alert("La recherche a échoué.");
    }
}

function afficherGrillePokemon(liste, nomExtension) {
    const grid = document.getElementById("pokedex-grid");

    liste.forEach(carte => {
        let prix = "N/A";
        if(carte.tcgplayer && carte.tcgplayer.prices) {
            const p = carte.tcgplayer.prices;
            const data = p.holofoil || p.normal || p.reverseHolofoil;
            if (data && data.market) prix = data.market.toFixed(2) + "€";
        }

        const aN = monInventaire.some(c => c.idCarteApi === carte.id && c.langueCarte === "Normal");
        const aH = monInventaire.some(c => c.idCarteApi === carte.id && c.langueCarte === "Holo");
        const aR = monInventaire.some(c => c.idCarteApi === carte.id && c.langueCarte === "Reverse");

        const imgUrl = (carte.images && carte.images.large) ? carte.images.large : "https://via.placeholder.com/250x350";

        grid.innerHTML += `
            <div class="pokemon-card glass">
                <div class="card-img-container">
                    <div class="market-price-tag">${prix}</div>
                    <div class="btn-zoom-overlay" onclick="ouvrirZoom('${imgUrl}', event)">
                        <i class="fas fa-search-plus"></i>
                    </div>
                    <img src="${imgUrl}" alt="${carte.name}">
                </div>
                <div class="card-details">
                    <h3>${carte.name}</h3>
                    <div class="status-indicators">
                        <div class="box ${aN ? 'active-normal' : ''}">N</div>
                        <div class="box ${aH ? 'active-holo' : ''}">H</div>
                        <div class="box ${aR ? 'active-reverse' : ''}">R</div>
                    </div>
                    <button class="add-to-collection-btn" onclick="preparerCapture('${carte.id}', '${nomExtension}')">
                        <i class="fas fa-plus-circle"></i> Capturer
                    </button>
                </div>
            </div>`;
    });
}


// --- SECTION : LOGIQUE DE CAPTURE (INVENTORY) ---

function preparerCapture(idApi, nomExt) {
    carteEnCoursDeCapture = { idApi, nomExtension: nomExt };
    document.getElementById("add-card-modal").style.display = "flex";
}

function initCaptureLogic() {
    const btns = document.querySelectorAll(".ver-btn");
    btns.forEach(btn => {
        btn.addEventListener("click", () => {
            btns.forEach(b => b.classList.remove("selected"));
            btn.classList.add("selected");
            versionSelectionnee = btn.getAttribute("data-ver");
        });
    });

    document.getElementById("confirm-add").onclick = async () => {
        const userData = JSON.parse(localStorage.getItem("user_data"));

        const body = {
            idDresseur: userData.id,
            idCarteApi: carteEnCoursDeCapture.idApi,
            extension: carteEnCoursDeCapture.nomExtension,
            etatCarte: document.getElementById("select-condition").value,
            langueCarte: versionSelectionnee,
            statut: "POSSEDEE"
        };

        try {
            const res = await fetch(`${API_INVENTORY}/add`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                alert("Carte ajoutée avec succès !");
                document.getElementById("add-card-modal").style.display = "none";
                location.reload();
            }
        } catch (e) { alert("Erreur serveur."); }
    };
}


// --- SECTION : PROFIL ET IDENTITY ---

async function chargerInfosDresseur(pseudo, token) {
    try {
        const reponse = await fetch(`${API_IDENTITY}/user/${pseudo}`, {
            method: "GET",
            headers: { "Authorization": "Bearer " + token }
        });

        if (reponse.ok) {
            const fullUser = await reponse.json();
            document.getElementById("display-email").innerText = fullUser.email;
            document.getElementById("display-address").innerText = `${fullUser.address}, ${fullUser.zipCode}`;

            const phoneCell = document.getElementById("display-phone");
            if (phoneCell) phoneCell.innerText = fullUser.phone || "Non renseigné";

            document.getElementById("user-balance-header").innerText = (fullUser.solde || 0).toFixed(2) + " PC";
            localStorage.setItem("user_data", JSON.stringify(fullUser));
        }
    } catch (error) { console.error(error); }
}

async function sauvegarderProfil() {
    const token = localStorage.getItem("user_token");
    const userData = JSON.parse(localStorage.getItem("user_data"));

    const data = {
        address: document.getElementById("edit-address").value,
        zipCode: document.getElementById("edit-zip").value,
        phone: document.getElementById("edit-phone").value
    };

    try {
        const res = await fetch(`${API_IDENTITY}/update/${userData.username}`, {
            method: "PUT",
            headers: { "Authorization": "Bearer " + token, "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            alert("Profil mis à jour !");
            await chargerInfosDresseur(userData.username, token);
            closeEditModal();
        }
    } catch (e) { alert("Erreur."); }
}

async function chargerInventairePrivé(idDresseur) {
    try {
        const res = await fetch(`${API_INVENTORY}/pokedex/${idDresseur}`);
        if (res.ok) {
            monInventaire = await res.json();
        }
    } catch (e) { console.error(e); }
}


// --- SECTION : CONTRÔLES UI (NAV / AVATARS) ---

function initSearchLogic() {
    const searchInput = document.getElementById("search-name");
    if (searchInput) {
        searchInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                let val = searchInput.value.trim();
                if (val.length >= 3) {
                    val = val.charAt(0).toUpperCase() + val.slice(1).toLowerCase();
                    rechercherGlobalement(val);
                }
            }
        });
    }
}

function initUIControls() {
    const burgerBtn = document.getElementById("burger-toggle");
    const drawer = document.getElementById("side-drawer");

    if(burgerBtn) burgerBtn.onclick = () => drawer.classList.add("open");
    if(document.getElementById("close-drawer")) document.getElementById("close-drawer").onclick = () => drawer.classList.remove("open");

    document.querySelectorAll(".nav-link").forEach(link => {
        link.onclick = (e) => {
            e.preventDefault();
            const target = link.getAttribute("data-target");
            document.querySelectorAll(".nav-link").forEach(l => l.classList.remove("active"));
            link.classList.add("active");
            document.querySelectorAll(".dashboard-view").forEach(v => {
                v.classList.remove("active");
                if (v.id === target) v.classList.add("active");
            });
            drawer.classList.remove("open");
        };
    });
}

function initAvatarSystem() {
    const avatars = ['avatar1.png', 'avatar2.png', 'avatar3.png', 'avatar4.png'];
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
    const saved = localStorage.getItem("user_avatar");
    if(saved) document.getElementById("current-avatar").src = `../assets/avatars/${saved}`;
}

function remplirLeSelectExtensions(liste) {
    const select = document.getElementById("extension-filter");
    if(!select) return;
    select.innerHTML = '<option value="all">Toutes les extensions</option>';
    liste.forEach(ext => {
        const opt = document.createElement("option");
        opt.value = ext.id;
        opt.innerText = ext.name;
        select.appendChild(opt);
    });
}

function openAvatarModal() { document.getElementById("avatar-modal").style.display = "flex"; }
function closeAvatarModal() { document.getElementById("avatar-modal").style.display = "none"; }
function openEditModal() {
    const u = JSON.parse(localStorage.getItem("user_data"));
    document.getElementById("edit-address").value = u.address || "";
    document.getElementById("edit-zip").value = u.zipCode || "";
    document.getElementById("edit-phone").value = u.phone || "";
    document.getElementById("edit-profile-modal").style.display = "flex";
}
function closeEditModal() { document.getElementById("edit-profile-modal").style.display = "none"; }
function logout() { localStorage.clear(); window.location.href = "../index.html"; }