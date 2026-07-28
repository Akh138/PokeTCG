// =============================================================
// LOGIQUE DU POKEDEX MONDIAL - PokeTCG
// =============================================================

// Je définis l'adresse de base de mon microservice Catalog (Port 8083)
const API_BASE = "http://localhost:8083/api/catalog";

// Je crée des variables pour stocker mes données en mémoire et éviter des appels serveurs inutiles
let toutesLesExtensions = [];
let cartesDuSetActuel = [];
let modeVue = "EXTENSIONS"; // Me permet de savoir si l'utilisateur regarde la liste des logos ou des cartes

// 1. CHARGEMENT INITIAL : Je récupère les extensions au démarrage de la page
async function chargerExplorateur() {
    try {
        modeVue = "EXTENSIONS";
        // J'utilise fetch pour appeler mon API de manière asynchrone
        const reponse = await fetch(`${API_BASE}/extensions`);
        const result = await reponse.json();

        // Je stocke la liste brute reçue
        toutesLesExtensions = result.data;

        // Je trie les séries par date de sortie (les plus récentes en haut)
        toutesLesExtensions.sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate));

        // Je remplis mon menu déroulant pour le filtrage
        remplirLeSelect(toutesLesExtensions);

        // Je lance l'affichage de ma galerie de logos
        afficherGalerieExtensions(toutesLesExtensions);

    } catch (error) {
        console.error("Erreur de chargement :", error);
        // RIGUEUR : J'informe l'utilisateur si le microservice ne répond pas
        await pokeAlert("MAINTENANCE", "Le catalogue mondial est momentanément indisponible.");
    }
}

// 2. GESTIONNAIRE DE MENU DÉROULANT (SELECT)
function remplirLeSelect(liste) {
    const select = document.getElementById("extension-filter");
    if (!select) return;

    // Je réinitialise le menu avec une option par défaut
    select.innerHTML = '<option value="all">Toutes les extensions</option>';

    // Pour chaque extension, je crée une balise <option> dynamiquement
    liste.forEach(ext => {
        const option = document.createElement("option");
        option.value = ext.id;
        option.innerText = ext.name;
        select.appendChild(option); // J'ajoute l'option dans le menu
    });
}

// 3. AFFICHAGE DE LA GALERIE DE LOGOS
function afficherGalerieExtensions(liste) {
    const grid = document.getElementById("pokedex-grid");
    if (!grid) return;
    grid.innerHTML = "";

    liste.forEach(ext => {
        // RIGUEUR : Je gère le format hybride (API vs MongoDB) pour ne pas casser l'affichage des images
        const finalLogo = (ext.images && ext.images.logo) ? ext.images.logo : ext.logoUrl;

        // Je construis ma carte en HTML en utilisant les Template Literals (accents graves)
        const cardHtml = `
            <div class="extension-card glass" onclick="voirCartesDeLExtension('${ext.id}')">
                <img src="${finalLogo}" alt="${ext.name}">
                <div class="ext-info">
                    <p class="series-name">${ext.series}</p>
                    <h3>${ext.name}</h3>
                    <p class="release-date">Sortie le : ${ext.releaseDate}</p>
                </div>
            </div>`;
        grid.innerHTML += cardHtml; // J'injecte la carte dans ma grille
    });
}

// 4. AFFICHAGE DES CARTES D'UNE EXTENSION PRÉCISE
async function voirCartesDeLExtension(setId) {
    modeVue = "CARTS";
    const grid = document.getElementById("pokedex-grid");
    const ext = toutesLesExtensions.find(e => e.id === setId);
    const nomSet = ext ? ext.name : "Extension";

    // Je mets à jour la valeur du filtre pour qu'elle corresponde au clic
    document.getElementById("extension-filter").value = setId;
    grid.innerHTML = `<p style="grid-column: 1/-1; text-align:center;">Chargement de "${nomSet}"...</p>`;

    try {
        // J'appelle la route spécifique de mon service Catalog pour un set
        const reponse = await fetch(`${API_BASE}/set/${setId}`);
        cartesDuSetActuel = await reponse.json();

        // Je prépare l'en-tête de la grille avec un bouton retour
        grid.innerHTML = `
            <div class="grid-header">
                <button class="filter-btn back-btn" onclick="chargerExplorateur()">
                    <i class="fas fa-arrow-left"></i> Retour aux extensions
                </button>
                <h2>${nomSet}</h2>
            </div>`;

        // Je lance l'affichage de la grille de cartes
        afficherGrilleCartes(cartesDuSetActuel);
    } catch (error) {
        // RIGUEUR : En cas d'erreur API, j'affiche ma modale personnalisée
        await pokeAlert("ERREUR", "Impossible de récupérer les cartes de cette extension.");
        chargerExplorateur();
    }
}

// 5. LOGIQUE DE RECHERCHE GLOBALE (Sur toutes les extensions)
async function rechercherGlobalement(nom) {
    modeVue = "RECHERCHE_GLOBALE";
    const grid = document.getElementById("pokedex-grid");
    grid.innerHTML = `<p style="grid-column: 1/-1; text-align:center;">Recherche de "${nom}" dans la base mondiale...</p>`;

    try {
        const reponse = await fetch(`${API_BASE}/search/${nom}`);
        const resultats = await reponse.json();

        grid.innerHTML = `
            <div class="grid-header">
                <button class="filter-btn back-btn" onclick="chargerExplorateur()">
                    <i class="fas fa-arrow-left"></i> Retour aux extensions
                </button>
                <h2>Résultats pour : "${nom}"</h2>
                <p style="color: var(--poke-yellow)">${resultats.length} cartes trouvées</p>
            </div>`;

        afficherGrilleCartes(resultats);

    } catch (error) {
        console.error("Erreur recherche globale:", error);
        await pokeAlert("RECHERCHE", "La recherche mondiale a échoué. Réessayez plus tard.");
    }
}

// 6. RENDU DE LA GRILLE DE CARTES (AVEC LOGIQUE DE PRIX)
function afficherGrilleCartes(liste) {
    const grid = document.getElementById("pokedex-grid");
    // Je nettoie les anciennes cartes pour éviter les doublons visuels
    const oldCards = grid.querySelectorAll('.pokemon-card');
    oldCards.forEach(c => c.remove());

    liste.forEach(carte => {
        // Sécurité pour l'image : si l'URL est absente, j'affiche un placeholder
        const imgUrl = (carte.images && carte.images.large) ? carte.images.large : (carte.imageUrl || "https://via.placeholder.com/250x350");

        // LOGIQUE DE PRIX : Je cherche la cotation la plus juste (TCGPlayer)
        let prixFinal = "0.00";

        // 1. Priorité au calcul déjà fait par mon backend
        if (carte.prixFinal && carte.prixFinal !== "0.00") {
            prixFinal = parseFloat(carte.prixFinal).toFixed(2);
        }
        // 2. Sinon, je fouille manuellement dans l'objet de l'API
        else if (carte.tcgplayer && carte.tcgplayer.prices) {
            const p = carte.tcgplayer.prices;
            const data = p.holofoil || p.normal || p.reverseHolofoil || p.unlimitedHolofoil;
            if (data && data.market) {
                prixFinal = data.market.toFixed(2);
            }
        }

        // Je génère le composant visuel de la carte
        const cardHtml = `
            <div class="pokemon-card glass" onclick="ouvrirZoom('${imgUrl}')">
                <div class="card-img-container">
                    <img src="${imgUrl}" alt="${carte.name}">
                </div>
                <div class="card-details">
                    <h3>${carte.name || carte.nomFr}</h3>
                    <div class="price-tag">
                        <i class="fas fa-coins"></i>
                        <span>${prixFinal} PC</span>
                    </div>
                </div>
            </div>`;
        grid.innerHTML += cardHtml;
    });
}

// 7. ÉCOUTEURS D'ÉVÉNEMENTS (INTERACTIONS UTILISATEUR)
document.addEventListener("DOMContentLoaded", () => {
    // Je lance l'explorateur dès que le document est prêt
    chargerExplorateur();

    const searchInput = document.getElementById("search-name");

    // ÉCOUTEUR : Touche Entrée pour la recherche mondiale
    searchInput.addEventListener("keydown", async (e) => {
        if (e.key === "Enter") {
            let val = searchInput.value.trim();
            if (val.length >= 3) {
                // Je formate le nom (1ère lettre en Majuscule) pour le pont bilingue
                val = val.charAt(0).toUpperCase() + val.slice(1).toLowerCase();
                rechercherGlobalement(val);
            } else {
                // RIGUEUR : J'avertis l'utilisateur s'il tape moins de 3 lettres
                await pokeAlert("RECHERCHE", "Merci d'écrire au moins 3 lettres pour lancer la recherche.");
            }
        }
    });

    // ÉCOUTEUR : Filtrage instantané (pendant la frappe)
    searchInput.addEventListener("input", (e) => {
        const saisie = e.target.value.toLowerCase();
        if (modeVue === "EXTENSIONS") {
            const filtre = toutesLesExtensions.filter(ext => ext.name.toLowerCase().includes(saisie));
            afficherGalerieExtensions(filtre);
        } else if (modeVue === "CARTS") {
            const filtre = cartesDuSetActuel.filter(c => (c.name || c.nomFr).toLowerCase().includes(saisie));
            afficherGrilleCartes(filtre);
        }
    });

    // ÉCOUTEUR : Changement de set via le menu déroulant
    document.getElementById("extension-filter").addEventListener("change", (e) => {
        const value = e.target.value;
        if (value === "all") chargerExplorateur();
        else voirCartesDeLExtension(value);
    });

    // GESTION DE LA MODALE ZOOM
    const modal = document.getElementById("card-modal");
    const closeBtn = document.querySelector(".close-modal");
    if (closeBtn) closeBtn.onclick = () => modal.style.display = "none";
    window.onclick = (event) => { if (event.target == modal) { modal.style.display = "none"; } };
});

// FONCTION : Agrandir l'image d'une carte
function ouvrirZoom(imageUrl) {
    const modal = document.getElementById("card-modal");
    document.getElementById("img-zoom").src = imageUrl;
    modal.style.display = "flex";
}