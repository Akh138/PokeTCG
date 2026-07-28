// =============================================================
// MODULE : EXPLORATEUR ET RECHERCHE (CATALOG SERVICE)
// =============================================================

// 1. CHARGEMENT DES EXTENSIONS DEPUIS L'API OU MONGO
async function chargerExtensionsMondiales() {
    try {
        const reponse = await fetch(`${API_CATALOG}/extensions`);
        const result = await reponse.json();
        toutesLesExtensions = result.data;

        // Tri par date de sortie décroissante
        toutesLesExtensions.sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate));

        remplirLeSelectExtensions(toutesLesExtensions);

        // J'affiche la galerie (elle utilisera monInventaire chargé au démarrage)
        afficherGalerieExtensions(toutesLesExtensions);
    } catch (error) {
        console.error("Erreur microservice Catalog :", error);
        // On informe si le service est hors-ligne dès l'entrée
        await pokeAlert("MAINTENANCE", "Le catalogue mondial est momentanément indisponible.");
    }
}

// 2. AFFICHAGE DE LA GALERIE DE LOGOS (STYLE POKÉCARDEX)
function afficherGalerieExtensions(liste) {
    const grid = document.getElementById("pokedex-grid");
    if (!grid) return;
    grid.innerHTML = "";

    liste.forEach(ext => {
        // RIGUEUR HABIB : Sécurité format d'image (API vs MongoDB)
        const imageLogo = (ext.images && ext.images.logo) ? ext.images.logo : ext.logoUrl;

        // 1. Filtrage de l'inventaire MySQL pour cette extension précise
        const mesCartesDuSet = monInventaire.filter(c => c.extension === ext.name);

        // 2. Comptage des cartes possédées
        const uniqueOwnedIds = [...new Set(mesCartesDuSet.map(c => c.idCarteApi))];
        const nbPossedes = uniqueOwnedIds.length;

        // 3. Calcul de progression via le champ .total garanti par le Backend
        const totalSet = ext.total || 0;
        const pourcentage = totalSet > 0 ? Math.round((nbPossedes / totalSet) * 100) : 0;

        grid.innerHTML += `
            <div class="extension-card glass" onclick="voirCartesDeLExtension('${ext.id}')">
                <img src="${imageLogo}" alt="${ext.name}">
                <div class="ext-info">
                    <p class="series-name">${ext.series}</p>
                    <h3>${ext.name}</h3>
                    <p class="release-date">Sortie : ${ext.releaseDate}</p>

                    <!-- MA BARRE DE PROGRESSION -->
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

// 3. AFFICHAGE DES CARTES D'UN SET PRÉCIS
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
        await pokeAlert("ERREUR CATALOGUE", "Impossible de charger les cartes de cette extension.");
        chargerExtensionsMondiales();
    }
}

// 4. LOGIQUE DE RECHERCHE GLOBALE PAR NOM
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
        console.error("Erreur recherche globale:", error);
        await pokeAlert("RECHERCHE", "La recherche mondiale a échoué. Réessayez plus tard.");
    }
}

// 5. RENDU DE LA GRILLE DE CARTES (AVEC BOUTON 3D)
function afficherGrillePokemon(liste, nomExtension) {
    const grid = document.getElementById("pokedex-grid");

    liste.forEach(carte => {
        // Calcul du prix sécurisé
        let prix = "N/A";
        if(carte.tcgplayer && carte.tcgplayer.prices) {
            const p = carte.tcgplayer.prices;
            const data = p.holofoil || p.normal || p.reverseHolofoil;
            if (data && data.market) prix = data.market.toFixed(2) + "€";
        }

        // Vérification des indicateurs de complétion
        const aN = monInventaire.some(c => c.idCarteApi === carte.id && c.langueCarte === "Normal");
        const aH = monInventaire.some(c => c.idCarteApi === carte.id && c.langueCarte === "Holo");
        const aR = monInventaire.some(c => c.idCarteApi === carte.id && c.langueCarte === "Reverse");

        const imgUrl = (carte.images && carte.images.large) ? carte.images.large : carte.imageUrl || "https://via.placeholder.com/250x350";

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
                    <h3>${carte.name || carte.nomFr}</h3>
                    <div class="status-indicators">
                        <div class="box ${aN ? 'active-normal' : ''}">N</div>
                        <div class="box ${aH ? 'active-holo' : ''}">H</div>
                        <div class="box ${aR ? 'active-reverse' : ''}">R</div>
                    </div>
                    <!-- BOUTON 3D CAPTURER -->
                    <button class="btn-3d btn-yellow" style="width: 100%; margin-top: 10px;" onclick="preparerCapture('${carte.id}', '${nomExtension}')">
                        <div class="button-outer">
                            <div class="button-inner">
                                <span><i class="fas fa-plus-circle"></i> CAPTURER</span>
                            </div>
                        </div>
                    </button>
                </div>
            </div>`;
    });
}

// 6. OUTILS UI (SELECT ET ZOOM)
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

window.ouvrirZoom = function(url, event) {
    if (event) event.stopPropagation();
    const modal = document.getElementById("card-modal");
    const img = document.getElementById("img-zoom");
    if (modal && img) {
        img.src = url;
        modal.style.display = "flex";
    }
};

function initSearchLogic() {
    const searchInput = document.getElementById("search-name");
    if (searchInput) {
        // On ajoute "async" ici pour pouvoir utiliser "await" plus bas
        searchInput.addEventListener("keydown", async (e) => {
            if (e.key === "Enter") {
                let val = searchInput.value.trim();
                if (val.length >= 3) {
                    val = val.charAt(0).toUpperCase() + val.slice(1).toLowerCase();
                    rechercherGlobalement(val);
                } else {
                    // Désormais, l'attente (await) est autorisée
                    await pokeAlert("RECHERCHE", "Merci d'écrire au moins 3 lettres pour lancer la recherche.");
                }
            }
        });
    }
}