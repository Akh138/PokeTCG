// --- LOGIQUE DU POKEDEX MONDIAL ---
const API_BASE = "http://localhost:8083/api/catalog";
let toutesLesExtensions = []; // Ma liste de logos en mémoire
let cartesDuSetActuel = [];    // Mes cartes du set choisi en mémoire
let modeVue = "EXTENSIONS";   // Sert à savoir si on cherche une extension ou un pokémon

// 1. CHARGEMENT INITIAL : Je récupère les extensions et je prépare les outils
async function chargerExplorateur() {
    try {
        modeVue = "EXTENSIONS";
        const reponse = await fetch(`${API_BASE}/extensions`);
        const result = await reponse.json();
        toutesLesExtensions = result.data;

        // Je trie les séries (plus récentes en premier)
        toutesLesExtensions.sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate));

        // Je remplis mon menu déroulant pour le filtre
        remplirLeSelect(toutesLesExtensions);

        // J'affiche ma galerie de logos
        afficherGalerieExtensions(toutesLesExtensions);

    } catch (error) {
        console.error("Erreur :", error);
        document.getElementById("pokedex-grid").innerHTML = "<p>Erreur de connexion au catalogue.</p>";
    }
}

// 2. MON GESTIONNAIRE DE MENU DÉROULANT
function remplirLeSelect(liste) {
    const select = document.getElementById("extension-filter");
    select.innerHTML = '<option value="all">Toutes les extensions</option>';

    liste.forEach(ext => {
        const option = document.createElement("option");
        option.value = ext.id;
        option.innerText = ext.name;
        select.appendChild(option);
    });
}

// 3. AFFICHAGE DE LA GALERIE DE LOGOS
function afficherGalerieExtensions(liste) {
    const grid = document.getElementById("pokedex-grid");
    grid.innerHTML = "";
    liste.forEach(ext => {
        const cardHtml = `
            <div class="extension-card glass" onclick="voirCartesDeLExtension('${ext.id}')">
                <img src="${ext.images.logo}" alt="${ext.name}">
                <div class="ext-info">
                    <p class="series-name">${ext.series}</p>
                    <h3>${ext.name}</h3>
                    <p class="release-date">Sortie le : ${ext.releaseDate}</p>
                </div>
            </div>`;
        grid.innerHTML += cardHtml;
    });
}

// 4. AFFICHAGE DES CARTES D'UN SET
async function voirCartesDeLExtension(setId) {
    modeVue = "CARTS";
    const grid = document.getElementById("pokedex-grid");
    const ext = toutesLesExtensions.find(e => e.id === setId);
    const nomSet = ext ? ext.name : "Extension";

    document.getElementById("extension-filter").value = setId;
    grid.innerHTML = `<p style="grid-column: 1/-1; text-align:center;">Chargement de "${nomSet}"...</p>`;

    try {
        const reponse = await fetch(`${API_BASE}/set/${setId}`);
        cartesDuSetActuel = await reponse.json();

        grid.innerHTML = `
            <div class="grid-header">
                <button class="filter-btn back-btn" onclick="chargerExplorateur()">
                    <i class="fas fa-arrow-left"></i> Retour aux extensions
                </button>
                <h2>${nomSet}</h2>
            </div>`;

        afficherGrilleCartes(cartesDuSetActuel);
    } catch (error) {
        alert("Erreur lors du chargement des cartes.");
        chargerExplorateur();
    }
}

// ⭐ MA LOGIQUE DE RECHERCHE GLOBALE (Toutes les extensions)
async function rechercherGlobalement(nom) {
    modeVue = "RECHERCHE_GLOBALE";
    const grid = document.getElementById("pokedex-grid");
    grid.innerHTML = `<p style="grid-column: 1/-1; text-align:center;">Recherche de "${nom}" dans le monde entier...</p>`;

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
        alert("La recherche mondiale a échoué.");
    }
}

// 5. FONCTION D'AFFICHAGE DES CARTES (AVEC CAPSULE PRIX)
function afficherGrilleCartes(liste) {
    const grid = document.getElementById("pokedex-grid");
    const oldCards = grid.querySelectorAll('.pokemon-card');
    oldCards.forEach(c => c.remove());

    liste.forEach(carte => {
        // Sécurité Image
        const imgUrl = (carte.images && carte.images.large) ? carte.images.large : "https://via.placeholder.com/250x350?text=Image+Indisponible";

        // MA LOGIQUE DE RÉCUPÉRATION DE PRIX SÉCURISÉE
        let prixFinal = "0.00";

        // 1. Je regarde si le backend a déjà calculé le prix
        if (carte.prixFinal && carte.prixFinal !== "0.00") {
            prixFinal = parseFloat(carte.prixFinal).toFixed(2);
        }
        // 2. Sinon, je scanne l'objet tcgplayer en profondeur
        else if (carte.tcgplayer && carte.tcgplayer.prices) {
            const p = carte.tcgplayer.prices;
            const data = p.holofoil || p.normal || p.reverseHolofoil || p.unlimitedHolofoil || p["1stEditionHolofoil"];
            if (data && data.market) {
                prixFinal = data.market.toFixed(2);
            }
        }

        const cardHtml = `
            <div class="pokemon-card glass" onclick="ouvrirZoom('${imgUrl}')">
                <div class="card-img-container">
                    <img src="${imgUrl}" alt="${carte.name}">
                </div>
                <div class="card-details">
                    <h3>${carte.name}</h3>
                    <!-- MA CAPSULE POKÉ-CRÉDIT -->
                    <div class="price-tag">
                        <i class="fas fa-coins"></i>
                        <span>${prixFinal} PC</span>
                    </div>
                </div>
            </div>`;
        grid.innerHTML += cardHtml;
    });
}

// 6. ÉCOUTEURS D'ÉVÉNEMENTS
document.addEventListener("DOMContentLoaded", () => {
    chargerExplorateur();

    const searchInput = document.getElementById("search-name");

    searchInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            let val = searchInput.value.trim();
            if (val.length >= 3) {
                // Je force la majuscule pour le pont bilingue
                val = val.charAt(0).toUpperCase() + val.slice(1).toLowerCase();
                rechercherGlobalement(val);
            } else {
                alert("Écris au moins 3 lettres !");
            }
        }
    });

    searchInput.addEventListener("input", (e) => {
        const saisie = e.target.value.toLowerCase();
        if (modeVue === "EXTENSIONS") {
            const filtre = toutesLesExtensions.filter(ext => ext.name.toLowerCase().includes(saisie));
            afficherGalerieExtensions(filtre);
        } else if (modeVue === "CARTS") {
            const filtre = cartesDuSetActuel.filter(c => c.name.toLowerCase().includes(saisie));
            afficherGrilleCartes(filtre);
        }
    });

    document.getElementById("extension-filter").addEventListener("change", (e) => {
        const value = e.target.value;
        if (value === "all") chargerExplorateur();
        else voirCartesDeLExtension(value);
    });

    const modal = document.getElementById("card-modal");
    const closeBtn = document.querySelector(".close-modal");
    if (closeBtn) closeBtn.onclick = () => modal.style.display = "none";
    window.onclick = (event) => { if (event.target == modal) { modal.style.display = "none"; } };
});

function ouvrirZoom(imageUrl) {
    const modal = document.getElementById("card-modal");
    document.getElementById("img-zoom").src = imageUrl;
    modal.style.display = "flex";
}