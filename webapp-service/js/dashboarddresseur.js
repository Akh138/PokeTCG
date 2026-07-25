// --- LOGIQUE DU DASHBOARD DRESSEUR - PokeTCG (VERSION FINALE INTÉGRALE - SÉCURISÉE) ---

// 1. ADRESSES DE MES MICROSERVICES
const API_IDENTITY     = "http://localhost:8081/api/auth";
const API_CATALOG      = "http://localhost:8083/api/catalog";
const API_INVENTORY    = "http://localhost:8084/api/inventory";
const API_MARKETPLACE  = "http://localhost:8085/api/marketplace";
const API_WALLETS      = "http://localhost:8082/api/wallets"; // Port 8082 pour ma banque
const API_SOCIAL       = "http://localhost:8086/api/social/forum";

// 2. VARIABLES GLOBALES DE SESSION
let toutesLesExtensions = [];
let monInventaire = [];
let mesAnnonces = []; //  Je stocke ici mes ventes actives pour mettre à jour les badges
let annoncesPubliques = []; //  Je stocke ici les cartes des autres dresseurs
let carteEnCoursDeCapture = null;
let carteEnCoursDeVente = null; //  Pour stocker l'ID de la carte que je veux vendre
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
    //   On utilise username car c'est le nom dans ton entité Java
    const nomUtilisateur = userData.username || userData.pseudo;
    document.getElementById("display-pseudo").innerText = nomUtilisateur;

    // B. CHARGEMENT DES DONNÉES EN CASCADE (ORDRE CRITIQUE)
    try {
        // 1. Je récupère d'abord les infos complètes (Email, Adresse, Solde)
        //   On envoie le bon nom au service Identity
        const userFull = await chargerInfosDresseur(nomUtilisateur, userToken);

        // 2. TRÈS IMPORTANT : Je récupère mon inventaire MySQL AVANT d'afficher le catalogue
        if (userFull && userFull.id) {
            await chargerInventairePrivé(userFull.id);

            // JE CHARGE AUSSI MES VENTES POUR SYNCHRONISER LES BADGES
            await chargerMesAnnonces(userFull.id);

            // JE CHARGE MON SOLDE RÉEL DEPUIS LE WALLET-SERVICE
            await chargerSoldeDresseur(userFull.id);
        }

        // 3. Maintenant que j'ai mon inventaire en mémoire, je peux afficher les extensions
        await chargerExtensionsMondiales();

        // Je lance le calcul des stats dès que tout est chargé
        mettreAJourStatsAccueil();

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

//  J'attache la fonction à 'window' pour qu'elle soit visible partout
window.ouvrirZoom = function(url, event) {
    if (event) event.stopPropagation(); // Empêche de cliquer sur la carte en même temps

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

//  Voici ma logique de calcul de progression set par set
function afficherGalerieExtensions(liste) {
    const grid = document.getElementById("pokedex-grid");
    if (!grid) return;
    grid.innerHTML = "";

    liste.forEach(ext => {
        // ⭐ RIGUEUR HABIB : Correction du format d'image (API vs MongoDB) ⭐
        // Si ext.images existe, on prend le logo dedans (API). Sinon on prend ext.logoUrl (MongoDB)
        const imageLogo = (ext.images && ext.images.logo) ? ext.images.logo : ext.logoUrl;

        // 1. Je filtre mon inventaire MySQL pour cette extension précise
        const mesCartesDuSet = monInventaire.filter(c => c.extension === ext.name);

        // 2. Je compte combien de cartes différentes je possède
        const uniqueOwnedIds = [...new Set(mesCartesDuSet.map(c => c.idCarteApi))];
        const nbPossedes = uniqueOwnedIds.length;

        // 3. Je récupère le total de l'API et je calcule le %
        const totalSet = ext.total; // Plus besoin de "|| 0", la donnée est là !
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

// Synchronisation MySQL avant d'entrer dans un set
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

//  Cette fonction gère la recherche globale par nom (Pikachu, Dracaufeu...)
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
        // Logique Prix Market
        let prix = "N/A";
        if(carte.tcgplayer && carte.tcgplayer.prices) {
            const p = carte.tcgplayer.prices;
            const data = p.holofoil || p.normal || p.reverseHolofoil;
            if (data && data.market) prix = data.market.toFixed(2) + "€";
        }

        //  Je vérifie mes 3 carrés de complétion
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


//  MA LOGIQUE DE COLLECTION (LISTE DES LOGOS + CLASSEUR GRID)

async function afficherMaCollection() {
    const grid = document.getElementById("collection-grid");
    if (!grid) return;
    grid.innerHTML = `<p style="text-align:center;">Chargement de votre collection...</p>`;

    //  Sécurité si les extensions ne sont pas encore chargées
    if (toutesLesExtensions.length === 0) {
        await chargerExtensionsMondiales();
    }

    // Je ne garde que les extensions où je possède au moins une carte dans mon inventaire MySQL
    const mesSetsNoms = [...new Set(monInventaire.map(c => c.extension))];
    const mesExtensions = toutesLesExtensions.filter(ext => mesSetsNoms.includes(ext.name));

    if (mesExtensions.length === 0) {
        grid.innerHTML = `<p style="text-align:center; padding:50px;">Votre collection est vide. Allez dans le Pokedex Mondial !</p>`;
        return;
    }

    grid.innerHTML = "";
    mesExtensions.forEach(ext => {
        // Sécurité format d'image pour la collection
        const logoCollection = (ext.images && ext.images.logo) ? ext.images.logo : ext.logoUrl;

        const mesCartes = monInventaire.filter(c => c.extension === ext.name);
        const uniqueIds = [...new Set(mesCartes.map(c => c.idCarteApi))];
        const nbPossedes = uniqueIds.length;

// Utilisation directe du champ .total de MongoDB
        const pourcent = Math.round((nbPossedes / ext.total) * 100)

        grid.innerHTML += `
            <div class="extension-card glass" onclick="ouvrirClasseurSet('${ext.id}')">
                <img src="${logoCollection}" alt="${ext.name}">
                <div class="ext-info">
                    <h3>${ext.name}</h3>
                    <div class="ext-progress">
                        <div class="ext-progress-info">
                            <span>Collection</span>
                            <span>${nbPossedes} / ${ext.total}</span>
                        </div>
                        <div class="ext-progress-bg">
                            <div class="ext-progress-fill ${pourcent === 100 ? 'completed' : ''}" 
                                 style="width: ${pourcent}%">
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
    });
}

async function ouvrirClasseurSet(setId) {
    const grid = document.getElementById("collection-grid");
    const ext = toutesLesExtensions.find(e => e.id === setId);
    grid.innerHTML = `<p style="text-align:center;">Ouverture du classeur ${ext.name}...</p>`;

    try {
        const reponse = await fetch(`${API_CATALOG}/set/${setId}`);
        const toutesLesCartesMondiales = await reponse.json();

        // On trie par numéro de carte
        toutesLesCartesMondiales.sort((a, b) => parseInt(a.number) - parseInt(b.number));

        grid.innerHTML = `
            <div class="grid-header">
                <button class="filter-btn back-btn" onclick="afficherMaCollection()">Retour</button>
                <h2>${ext.name}</h2>
            </div>
            <div class="binder-grid" id="binder-view"></div>
        `;

        const binderView = document.getElementById("binder-view");

        toutesLesCartesMondiales.forEach(carteMondiale => {
            //  On définit les variables au début de la boucle pour chaque carte
            const possession = monInventaire.find(c => c.idCarteApi === carteMondiale.id && c.statut === 'POSSEDEE');

            // Sécurité Image (API vs MongoDB)
            const imageCarte = (carteMondiale.images && carteMondiale.images.large) ? carteMondiale.images.large : carteMondiale.imageUrl;

            // Sécurité Numéro (C'est ici qu'on utilise le nouveau champ total/number)
            const numeroCarte = carteMondiale.number || "N/A";

            if (possession) {
                const estEnVente = mesAnnonces.some(a => a.idCarteApi === carteMondiale.id && a.statut === 'DISPONIBLE');
                let classEtat = "cond-neuf";
                if(possession.etatCarte === "Excellent") classEtat = "cond-excellent";
                if(possession.etatCarte === "Usé") classEtat = "cond-use";

                const date = new Date(possession.dateAcquisition).toLocaleDateString('fr-FR');
                const nomSecurise = (carteMondiale.name || carteMondiale.nomFr).replace(/'/g, "\\'");

                binderView.innerHTML += `
                    <div class="pokemon-card glass">
                        <div class="card-img-container">
                            <div class="condition-badge ${classEtat}">${possession.etatCarte}</div>
                            <div class="btn-zoom-overlay" onclick="ouvrirZoom('${imageCarte}', event)">
                                <i class="fas fa-search-plus"></i>
                            </div>
                            <img src="${imageCarte}" alt="pokemon">
                        </div>
                        <div class="card-details">
                            <h3>${carteMondiale.name || carteMondiale.nomFr}</h3>
                            ${estEnVente ? `<div class="status-badge-sale"><i class="fas fa-tag"></i> En vente</div>` : `<button class="btn-sell-trigger" onclick="preparerVente('${carteMondiale.id}', '${nomSecurise}')"><i class="fas fa-hand-holding-usd"></i> Mettre en vente</button>`}
                            <div class="status-indicators">
                                <div class="box ${possession.langueCarte === 'Normal' ? 'active-normal' : ''}">N</div>
                                <div class="box ${possession.langueCarte === 'Holo' ? 'active-holo' : ''}">H</div>
                                <div class="box ${possession.langueCarte === 'Reverse' ? 'active-reverse' : ''}">R</div>
                            </div>
                            <span class="acquisition-date">Obtenue le ${date}</span>
                        </div>
                    </div>`;
            } else {
                binderView.innerHTML += `
                    <div class="pokemon-card glass not-owned">
                        <div class="card-img-container">
                            <div class="missing-badge">MANQUANTE</div>
                            <img src="../assets/cards-back.png" alt="Missing">
                        </div>
                        <div class="card-details">
                            <h3 style="opacity:0.3;">N°${numeroCarte}</h3>
                        </div>
                    </div>`;
            }
        });
    } catch (e) { console.error("Erreur classeur :", e); }
}


//  LOGIQUE MARCHÉ MONDIAL

async function chargerMarcheMondial() {
    const grid = document.getElementById("market-grid");
    const userData = JSON.parse(localStorage.getItem("user_data"));
    grid.innerHTML = `<p style="grid-column: 1/-1; text-align:center;">Ouverture du marché...</p>`;

    try {
        const reponse = await fetch(`${API_MARKETPLACE}/public/${userData.id}`);
        const annonces = await reponse.json();

        if (annonces.length === 0) {
            grid.innerHTML = `<p style="grid-column: 1/-1; text-align:center; padding:50px;">Aucune vente en cours.</p>`;
            return;
        }

        grid.innerHTML = "";
        for (const ad of annonces) {
            const res = await fetch(`${API_CATALOG}/details/${ad.idCarteApi}`);
            const rawData = await res.json();
            const cardData = rawData.id ? rawData : rawData.data;

            const resSeller = await fetch(`${API_IDENTITY}/id/${ad.idVendeur}`);
            const sellerData = await resSeller.json();
            const sellerName = sellerData.username || "Dresseur";

            let badgeColor = "#10b981";
            if(ad.etat === "Excellent") badgeColor = "#f59e0b";
            if(ad.etat === "Usé") badgeColor = "#ef4444";

            grid.innerHTML += `
                <div class="pokemon-card glass">
                    <div class="card-img-container">
                        <div class="market-price-tag" style="background: var(--poke-red); color: white;">${ad.prix} PC</div>
                        <div class="condition-badge" style="background: ${badgeColor}; bottom: 10px; left: 10px;">${ad.etat || 'Normal'}</div>
                        <div class="btn-zoom-overlay" onclick="ouvrirZoom('${cardData.imageUrl}', event)"><i class="fas fa-search-plus"></i></div>
                        <img src="${cardData.imageUrl}" alt="${cardData.nomFr}">
                    </div>
                    <div class="card-details">
                        <h3>${cardData.nomFr}</h3>
                        <p style="font-size:0.8rem; color: var(--poke-yellow); font-weight: bold;">
                           <i class="fas fa-user-tag"></i> ${sellerName}
                        </p>
                        <button class="btn-3d btn-red" style="width: 100%; margin-top: 15px;" onclick="acheterCarte(${ad.id}, ${ad.prix})">
                          <div class="button-outer">
                             <div class="button-inner" style="background: linear-gradient(135deg, #10b981, #059669);">
                               <span><i class="fas fa-shopping-cart"></i> ACHETER</span>
                             </div>
                          </div>
                        </button>
                    </div>
                </div>`;
        }
    } catch (error) {
        console.error("Erreur Marketplace :", error);
        alert("Impossible de charger le marché mondial.");
    }
}

async function acheterCarte(idAnnonce, prix) {
    const userData = JSON.parse(localStorage.getItem("user_data"));
    const userToken = localStorage.getItem("user_token");

    if (userData.solde < prix) {
        alert("Achat refusé : Solde insuffisant ! Allez à la banque pour recharger.");
        return;
    }

    if (!confirm(`Confirmer l'achat pour ${prix} PC ? L'argent sera placé en séquestre.`)) return;

    try {
        const reponse = await fetch(`${API_MARKETPLACE}/buy/${idAnnonce}/${userData.id}`, {
            method: "PUT",
            headers: {
                "Authorization": "Bearer " + userToken,
                "Content-Type": "application/json"
            }
        });

        if (reponse.ok) {
            alert("Achat réussi ! La carte est en cours de livraison (EN TRANSIT).");
            await chargerSoldeDresseur(userData.id);
            await chargerInventairePrivé(userData.id);
            chargerMarcheMondial();
        } else {
            const errorMsg = await reponse.text();
            alert("Le serveur a refusé l'achat : " + errorMsg);
        }
    } catch (error) { alert("Erreur réseau."); }
}


//  SECTION 6 - GESTION DES VENTES (HISTORIQUE DÉDIÉ ACHATS/VENTES)
async function chargerGestionVentes() {
    const placeholder = document.getElementById("my-sales-placeholder");
    const userData = JSON.parse(localStorage.getItem("user_data"));
    if (!placeholder) return;

    placeholder.innerHTML = `<p style="text-align:center;">Chargement de votre bureau commercial...</p>`;

    try {
        const monIdReel = Number(userData.id);

        // 1. Récupération des données via les routes dresseur
        const resAchats = await fetch(`${API_MARKETPLACE}/acheteur/${monIdReel}`);
        const mesAchats = await resAchats.json();

        const resVentes = await fetch(`${API_MARKETPLACE}/vendeur/${monIdReel}`);
        const mesVentes = await resVentes.json();

        // 2. Filtrage pour séparer l'actuel de l'historique
        const achatsEnCours = mesAchats.filter(a => a.statut === 'EN_TRANSIT' || a.statut === 'EXPEDIEE');
        const historiqueAchatsReçus = mesAchats.filter(a => a.statut === 'VENDUE');

        // 3. Préparation du Design avec des IDs de listes DIFFÉRENTS du portefeuille
        placeholder.innerHTML = `
            <div class="management-grid">
                <div class="mgmt-section glass">
                    <h3><i class="fas fa-shopping-bag"></i> Mes achats en route (${achatsEnCours.length})</h3>
                    <div id="list-achats-cours"></div>
                    <hr style="margin:20px 0; opacity:0.1;">
                    <h3><i class="fas fa-history"></i> Cartes déjà reçues</h3>
                    <div id="list-achats-termines"></div>
                </div>
                
                <div class="mgmt-section glass">
                    <h3><i class="fas fa-store"></i> Mes annonces / ventes actives</h3>
                    <div id="list-ventes-actives"></div>
                </div>
            </div>`;

        // 4. Remplissage Achats en cours (Acheteur voit ses colis)
        const pendingGrid = document.getElementById("list-achats-cours");
        if (achatsEnCours.length === 0) {
            pendingGrid.innerHTML = "<p class='small-text'>Aucun colis en route.</p>";
        } else {
            for (const achat of achatsEnCours) {
                const resCard = await fetch(`${API_CATALOG}/details/${achat.idCarteApi}`);
                const card = await resCard.json();
                const cardData = card.id ? card : card.data;

                // Je gère les boutons dynamiquement selon le statut
                let actionHtml = "";

                if (achat.statut === 'EN_TRANSIT') {
                    // Bouton ANNULER en 3D Rouge
                    actionHtml = `
                        <div style="display:flex; flex-direction:column; gap:5px; align-items: flex-end;">
                            <span style="color:var(--text-muted); font-size:0.7rem;"><i class="fas fa-clock"></i> Attente envoi...</span>
                            <button class="btn-3d btn-red" style="width: 130px; height: 32px;" onclick="cloturerAnnulerAchat(${achat.id})">
                                <div class="button-outer">
                                    <div class="button-inner">
                                        <span style="font-size: 0.8rem; letter-spacing: 2.5px;">ANNULER</span>
                                    </div>
                                </div>
                            </button>
                        </div>`;
                } else if (achat.statut === 'EXPEDIEE') {
                    // Bouton VALIDER en 3D Jaune (Action positive)
                    actionHtml = `
                        <button class="btn-3d btn-yellow" style="width: 130px; height: 32px;" onclick="confirmerReceptionAchat(${achat.id})">
                            <div class="button-outer">
                                <div class="button-inner">
                                    <span style="font-size: 0.8rem; letter-spacing: 2.5px;">REÇU ?</span>
                                </div>
                            </div>
                        </button>`;
                }

                pendingGrid.innerHTML += `
                    <div class="mgmt-item">
                        <div class="mgmt-item-info"><b>${cardData.nomFr}</b><span>Prix : ${achat.prix} PC</span></div>
                        ${actionHtml}
                    </div>`;
            }
        }

        // 5. Remplissage Historique des Cartes Reçues
        const historyGrid = document.getElementById("list-achats-termines");
        if (historiqueAchatsReçus.length === 0) {
            historyGrid.innerHTML = "<p class='small-text'>Aucun historique.</p>";
        } else {
            for (const h of historiqueAchatsReçus) {
                const resCard = await fetch(`${API_CATALOG}/details/${h.idCarteApi}`);
                const card = await resCard.json();
                historyGrid.innerHTML += `<div class="mgmt-item" style="opacity:0.6;"><div class="mgmt-item-info"><b>${card.nomFr || card.data.nomFr}</b><span>Statut : REÇUE</span></div></div>`;
            }
        }

        // 6. Remplissage Ventes (voit ses ventes et peut envoyer)
        const salesGrid = document.getElementById("list-ventes-actives");
        if (mesVentes.length === 0) {
            salesGrid.innerHTML = "<p class='small-text'>Vous n'avez aucune annonce.</p>";
        } else {
            for (const vente of mesVentes) {
                const resCard = await fetch(`${API_CATALOG}/details/${vente.idCarteApi}`);
                const card = await resCard.json();
                const cardData = card.id ? card : card.data;

                //   Je gère les boutons Vendeur avec précision selon le statut
                let btnVendeur = "";

                if (vente.statut === 'DISPONIBLE') {
                    // Bouton RETIRER en 3D Rouge
                    btnVendeur = `
                        <button class="btn-3d btn-red" style="width: 110px; height: 32px;" onclick="annulerAnnonce(${vente.id})">
                            <div class="button-outer">
                                <div class="button-inner">
                                   <span style="font-size: 0.8rem; letter-spacing: 2.5px;">RETIRER</span>
                                </div>
                            </div>
                        </button>`;
                } else if (vente.statut === 'EN_TRANSIT') {
                    // Bouton ENVOYÉ en 3D Jaune (L'icône de camion est incluse proprement)
                    btnVendeur = `
                        <button class="btn-3d btn-yellow" style="width: 130px; height: 32px;" onclick="marquerCommeEnvoye(${vente.id})">
                            <div class="button-outer">
                                <div class="button-inner">
                                    <span style="font-size: 0.8rem; letter-spacing: 2.5px;"><i class="fas fa-shipping-fast"></i> ENVOYER</span>
                                </div>
                            </div>
                        </button>`;
                } else if (vente.statut === 'EXPEDIEE') {
                    btnVendeur = `<span style="color:#3b82f6; font-size:0.75rem; font-weight:bold;"><i class="fas fa-truck"></i> EN ROUTE</span>`;
                }

                salesGrid.innerHTML += `
                    <div class="mgmt-item">
                        <div class="mgmt-item-info">
                            <b>${cardData.nomFr || card.nomFr}</b>
                            <span>Prix : ${vente.prix} PC</span>
                            <span class="status-tag ${vente.statut === 'VENDUE' ? 'status-available' : 'status-transit'}">${vente.statut}</span>
                        </div>
                        ${btnVendeur}
                    </div>`;
            }
        }
    } catch (e) { console.error("Erreur de rendu Gestion :", e); }
}

//  NOUVELLE FONCTION POUR LE VENDEUR
async function marquerCommeEnvoye(idAnnonce) {
    if (!confirm("Avez-vous bien déposé le colis ? Ondine pourra alors valider la réception.")) return;
    try {
        const res = await fetch(`${API_MARKETPLACE}/ship/${idAnnonce}`, { method: "PUT" });
        if (res.ok) { alert("Colis marqué comme envoyé !"); chargerGestionVentes(); }
    } catch (e) { alert("Erreur serveur."); }
}

async function confirmerReceptionAchat(idAnnonce) {
    if (!confirm("Avez-vous bien reçu le colis ? L'argent sera transféré au vendeur.")) return;

    try {
        const res = await fetch(`${API_MARKETPLACE}/confirm-delivery/${idAnnonce}`, {
            method: "PUT"
        });

        if (res.ok) {
            alert("Merci de votre confiance ! La transaction est clôturée. La carte est officiellement à vous !");
            location.reload();
        }
    } catch (e) { alert("Erreur."); }
}

// FONCTION POUR RETIRER UNE ANNONCE DU MARCHÉ
async function annulerAnnonce(idAnnonce) {
    if (!confirm("Rigueur Habib : Voulez-vous vraiment retirer cette carte de la vente ?")) return;

    try {
        // J'appelle la route DELETE de mon contrôleur Marketplace
        const res = await fetch(`${API_MARKETPLACE}/delete/${idAnnonce}`, {
            method: "DELETE"
        });

        if (res.ok) {
            alert("L'annonce a été retirée avec succès.");
            // On rafraîchit les listes et le portefeuille (au cas où)
            chargerGestionVentes();
            const userData = JSON.parse(localStorage.getItem("user_data"));
            chargerInventairePrivé(userData.id);
        } else {
            alert("Erreur lors de la suppression de l'annonce.");
        }
    } catch (e) {
        console.error("Erreur annulation :", e);
        alert("Microservice Marketplace injoignable.");
    }
}


// LOGIQUE PROFIL, INVENTAIRE ET WALLET (RIGOUREUSEMENT IDENTIQUES)

async function chargerMesAnnonces(idVendeur) {
    try {
        const res = await fetch(`${API_MARKETPLACE}/vendeur/${idVendeur}`);
        if (res.ok) {
            mesAnnonces = await res.json();
        }
    } catch (e) { console.error("Erreur Marketplace :", e); }
}

function preparerVente(idApi, nomFr) {
    carteEnCoursDeVente = idApi;
    document.getElementById("sell-card-name").innerText = "Carte : " + nomFr;
    document.getElementById("sell-card-modal").style.display = "flex";
}

async function confirmerMiseEnVente() {
    const userData = JSON.parse(localStorage.getItem("user_data"));
    const prixSaisi = document.getElementById("sell-price").value;
    if (!prixSaisi || prixSaisi <= 0) { alert("Prix invalide !"); return; }
    const maCarte = monInventaire.find(c => c.idCarteApi === carteEnCoursDeVente);
    const nouvelleAnnonce = { idVendeur: userData.id, idCarteApi: carteEnCoursDeVente, prix: prixSaisi, etat: maCarte ? maCarte.etatCarte : "Normal", statut: "DISPONIBLE", datePublication: new Date().toISOString() };
    try {
        const reponse = await fetch(`${API_MARKETPLACE}/post`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(nouvelleAnnonce) });
        if (reponse.ok) { alert("Annonce publiée !"); closeSellModal(); await chargerMesAnnonces(userData.id); const ext = toutesLesExtensions.find(e => e.name === maCarte.extension); if(ext) ouvrirClasseurSet(ext.id); }
    } catch (error) { alert("Erreur."); }
}

function closeSellModal() { document.getElementById("sell-card-modal").style.display = "none"; }


async function chargerSoldeDresseur(idDresseur) {
    try {
        const reponse = await fetch(`${API_WALLETS}/owner/${idDresseur}`);
        if (reponse.ok) {
            const wallet = await reponse.json();
            const dispo = wallet.soldeDisponible.toFixed(2);
            const bloque = wallet.soldeSequestre.toFixed(2);

            document.getElementById("user-balance-header").innerText = dispo + " PC";
            if (document.getElementById("wallet-available")) {
                document.getElementById("wallet-available").innerText = dispo + " PC";
                document.getElementById("wallet-escrow").innerText = bloque + " PC";
            }

            const u = JSON.parse(localStorage.getItem("user_data"));
            u.solde = wallet.soldeDisponible;
            localStorage.setItem("user_data", JSON.stringify(u));
        }
    } catch (error) { console.error("Erreur Banque :", error); }
}

async function rechargerCompte() {
    const userData = JSON.parse(localStorage.getItem("user_data"));
    const montant = document.getElementById("recharge-amount").value;
    const card = document.getElementById("card-num").value;
    const exp = document.getElementById("card-exp").value;
    const cvv = document.getElementById("card-cvv").value;

    if (!card || card.length < 16 || !exp || !cvv) { alert("Infos bancaires invalides."); return; }
    if (!montant || montant <= 0) { alert("Montant invalide."); return; }

    try {
        const res = await fetch(`${API_WALLETS}/deposit/${userData.id}/${montant}`, {
            method: "PUT"
        });

        if (res.ok) {
            alert("Paiement accepté ! Compte crédité !");
            document.getElementById("recharge-amount").value = "";
            document.getElementById("card-num").value = "";
            document.getElementById("card-exp").value = "";
            document.getElementById("card-cvv").value = "";
            await chargerSoldeDresseur(userData.id);
            await chargerHistoriquePortefeuille(userData.id);
        }
    } catch (e) { alert("Impossible de joindre le microservice Wallet."); }
}

window.setAmount = function(val) { document.getElementById("recharge-amount").value = val; };


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
        const condition = document.getElementById("select-condition").value;

        if (!userData || !userData.id) {
            alert("Erreur : ID dresseur introuvable. Reconnectez-vous.");
            return;
        }

        const body = {
            idDresseur: userData.id,
            idCarteApi: carteEnCoursDeCapture.idApi,
            extension: carteEnCoursDeCapture.nomExtension,
            etatCarte: condition,
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

            localStorage.setItem("user_data", JSON.stringify(fullUser));
            return fullUser;
        }
    } catch (error) { console.error(error); }
}

async function chargerInventairePrivé(idDresseur) {
    try {
        const reponse = await fetch(`${API_INVENTORY}/pokedex/${idDresseur}`);
        if (reponse.ok) {

            monInventaire = await reponse.json();
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

            if (target === "view-collection") {
                afficherMaCollection();
            }

            if (target === "view-market") {
                chargerMarcheMondial();
            }

            // NAVIGATION VERS LA GESTION DES VENTES
            if (target === "view-my-sales") {
                chargerGestionVentes();
            }

            if (target === "view-wallet") {
                const userData = JSON.parse(localStorage.getItem("user_data"));
                if(userData && userData.id) {
                    chargerSoldeDresseur(userData.id);
                    // J'ajoute l'appel ici pour charger l'audit au clic sur l'onglet
                    chargerHistoriquePortefeuille(userData.id)
                }
            }

            if (target === "view-forum") {
                chargerMessagesForum();
            }

            if (target === "view-home") {
                mettreAJourStatsAccueil();
            }

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

// LOGIQUE DE CALCUL DES STATS (DYNAMIQUE : NORMAL 1, HOLO 3, REVERSE 5)
async function mettreAJourStatsAccueil() {
    const cardsCountElem = document.getElementById("total-cards-count");
    const totalValueElem = document.getElementById("total-collection-value");
    const levelElem = document.getElementById("trainer-level");
    const xpBar = document.getElementById("xp-fill-bar");
    const xpText = document.getElementById("xp-text");

    if (!cardsCountElem) return;

    // 1. Nombre total de cartes
    const nbCartes = monInventaire.length;
    cardsCountElem.innerText = nbCartes + " Cartes";

    //  MOTEUR DE CALCUL XP PAR RARETÉ
    let totalXP = 0;
    monInventaire.forEach(card => {
        // card.langueCarte contient "Normal", "Holo" ou "Reverse"
        if (card.langueCarte === "Holo") {
            totalXP += 3;
        } else if (card.langueCarte === "Reverse") {
            totalXP += 5;
        } else {
            totalXP += 1;
        }
    });

    // 2. Calcul du Niveau (On passe à 100 XP par niveau pour que ce soit visuel)
    const xpParNiveau = 100;
    const niveau = Math.floor(totalXP / xpParNiveau) + 1;
    const xpRestant = totalXP % xpParNiveau;
    const pourcentageXP = (xpRestant / xpParNiveau) * 100;

    levelElem.innerText = niveau;
    if (xpBar) xpBar.style.width = pourcentageXP + "%";
    if (xpText) xpText.innerText = `${xpRestant} / ${xpParNiveau} XP`;

    // 3. Calcul de la Valeur Estimée (Cœur Fintech)
    try {
        // On simule une valeur moyenne par carte pour le Dashboard
        let valeurTotale = nbCartes * 12.50;
        totalValueElem.innerText = valeurTotale.toFixed(2) + " PC";
    } catch (e) { console.error("Erreur calcul valeur :", e); }
}

//  LOGIQUE DE VÉRIFICATION FINANCIÈRE (AUDIT LOG - WALLET)
async function chargerHistoriquePortefeuille(idDresseur) {
    const list = document.getElementById("wallet-history-list");
    if (!list) return;

    try {
        const reponse = await fetch(`${API_WALLETS}/history/${idDresseur}`);
        const data = await reponse.json();

        if (data.length === 0) {
            list.innerHTML = "<p style='color:var(--text-muted); font-size:0.8rem; text-align:center;'>Aucun mouvement enregistré.</p>";
            return;
        }

        list.innerHTML = "";
        data.forEach(t => {
            const date = new Date(t.date).toLocaleString('fr-FR');
            let color = "white";
            let prefix = "";

            if (t.type === 'DEPOSIT') { color = "#10b981"; prefix = "+"; }
            if (t.type === 'PURCHASE_LOCK' || t.type === 'PURCHASE_CONFIRMED') { color = "#ef4444"; prefix = "-"; }
            if (t.type === 'SALE_CONFIRMED') { color = "#10b981"; prefix = "+"; }

            list.innerHTML += `
                <div class="mgmt-item" style="border-left: 4px solid ${color}; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; padding: 10px; background: rgba(255,255,255,0.02); border-radius: 8px;">
                    <div class="mgmt-item-info" style="text-align: left;">
                        <b style="font-size: 0.85rem;">${t.type}</b><br>
                        <span style="font-size: 0.7rem; color: var(--text-muted);">${date}</span>
                    </div>
                    <b style="color: ${color}; font-size: 1rem;">${prefix}${t.montant.toFixed(2)} PC</b>
                </div>`;
        });
    } catch (e) { console.error("Erreur Audit Wallet :", e); }
}

//  FONCTION POUR ANNULER UN ACHAT (REMBOURSEMENT + RETOUR CARTE)
async function cloturerAnnulerAchat(idAnnonce) {
    if (!confirm("Rigueur Habib : Voulez-vous vraiment annuler cet achat ? L'argent sera rendu sur votre solde disponible.")) return;

    try {
        // J'appelle la route de mon contrôleur Marketplace (8085)
        const reponse = await fetch(`${API_MARKETPLACE}/cancel-buy/${idAnnonce}`, {
            method: "PUT"
        });

        if (reponse.ok) {
            alert("Achat annulé avec succès. Vos Poké-Crédits sont débloqués !");
            location.reload(); // Je recharge pour mettre à jour le solde et le Pokedex
        } else {
            const error = await reponse.text();
            alert("Action impossible : " + error);
        }
    } catch (e) {
        console.error("Erreur annulation :", e);
        alert("Microservice Marketplace injoignable.");
    }
}

//  LOGIQUE SOCIALE (FORUM MONGODB)

async function chargerMessagesForum() {
    const feed = document.getElementById("forum-feed");
    if(!feed) return;

    // Je récupère les infos de session ICI pour savoir si on peut supprimer
    const userData = JSON.parse(localStorage.getItem("user_data"));
    if(!userData) return;

    try {
        const reponse = await fetch(API_SOCIAL);
        const messages = await reponse.json();

        if (messages.length === 0) {
            feed.innerHTML = "<p style='color:var(--text-muted); padding:50px;'>Aucun message pour le moment.</p>";
            return;
        }

        messages.sort((a, b) => new Date(b.dateEnvoi) - new Date(a.dateEnvoi));
        feed.innerHTML = "";

        messages.forEach(msg => {
            const date = new Date(msg.dateEnvoi).toLocaleString('fr-FR');

            //  Je vérifie si l'ID de l'auteur MongoDB est le mien (Ondine ID 4 ou Habib ID 7)
            const monId = Number(userData.id);
            const estMonMessage = (Number(msg.idAuteur) === monId);

            feed.innerHTML += `
                <div class="mgmt-item" style="flex-direction:column; align-items:flex-start; gap:10px; padding:20px; position:relative;">
                    <div style="display:flex; justify-content:space-between; width:100%; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:10px;">
                        <span style="color:var(--poke-yellow); font-weight:bold;"><i class="fas fa-user-circle"></i> ${msg.pseudoAuteur}</span>
                        <div style="display:flex; align-items:center; gap:15px;">
                            <span style="font-size:0.7rem; color:var(--text-muted)">${date}</span>
                            
                            <!-- Bouton supprimer uniquement si c'est moi l'auteur  -->
                            ${estMonMessage ? `
                                <i class="fas fa-trash-alt" style="color:#ef4444; cursor:pointer; font-size:0.9rem;" 
                                   onclick="supprimerMessageForum('${msg.id}')" title="Supprimer mon message"></i>
                            ` : ''}
                        </div>
                    </div>
                    <b style="color:white; font-size:1.1rem;">${msg.sujet}</b>
                    <p style="color:rgba(255,255,255,0.8); font-size:0.9rem; line-height:1.4;">${msg.message}</p>
                    <button class="like-btn" style="background:none; border:none; color:#fb7185; cursor:pointer; font-weight:bold;" onclick="likerUnMessage('${msg.id}')">
                        <i class="fas fa-heart"></i> ${msg.likes || 0}
                    </button>
                </div>`;
        });
    } catch (e) {
        console.error("Erreur Forum :", e);
        feed.innerHTML = "<p style='color:red; text-align:center;'>Erreur microservice Social (8086).</p>";
    }
}

async function publierSurForum() {
    const sujet = document.getElementById("forum-sujet").value.trim();
    const message = document.getElementById("forum-message").value.trim();
    const userData = JSON.parse(localStorage.getItem("user_data"));

    if (!sujet || !message) { alert("Champs vides !"); return; }

    const body = {
        idAuteur: userData.id,
        pseudoAuteur: userData.username || userData.pseudo,
        sujet: sujet,
        message: message
    };

    try {
        const res = await fetch(API_SOCIAL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        if (res.ok) {
            document.getElementById("forum-sujet").value = "";
            document.getElementById("forum-message").value = "";
            chargerMessagesForum();
        }
    } catch (e) { alert("Erreur d'envoi."); }
}

async function likerUnMessage(id) {
    try {
        const res = await fetch(`${API_SOCIAL}/like/${id}`, { method: "PUT" });
        if (res.ok) chargerMessagesForum();
    } catch (e) { console.error(e); }
}

//  FONCTION POUR SUPPRIMER UN MESSAGE (MONGODB PORT 8086)
async function supprimerMessageForum(idMessage) {
    if (!confirm("Rigueur Habib : Voulez-vous vraiment supprimer ce message ? Cette action est irréversible.")) return;

    try {
        const res = await fetch(`${API_SOCIAL}/${idMessage}`, {
            method: "DELETE"
        });

        if (res.ok) {
            alert("Message supprimé avec succès.");
            chargerMessagesForum(); // On rafraîchit le flux
        } else {
            alert("Erreur lors de la suppression.");
        }
    } catch (e) {
        console.error("Crash suppression forum :", e);
        alert("Microservice Social injoignable.");
    }
}

//  LOGIQUE DE SUPPRESSION TOTALE (RGPD)
async function supprimerMonCompte() {
    const userData = JSON.parse(localStorage.getItem("user_data"));

    const confirmation = confirm(
        "ATTENTION RIGUEUR HABIB :\n\n" +
        "Voulez-vous vraiment supprimer votre compte ?\n" +
        "Cette action effacera définitivement :\n" +
        "- Votre Pokedex personnel\n" +
        "- Vos annonces sur le marché\n" +
        "- Vos messages sur le forum\n" +
        "- Votre portefeuille de Poké-Crédits\n\n" +
        "C'est votre dernière chance !"
    );

    if (!confirmation) return;

    try {
        // J'appelle la route DELETE de mon service Identity (8081)
        const reponse = await fetch(`${API_IDENTITY}/delete/${userData.id}`, {
            method: "DELETE",
            headers: {
                "Authorization": "Bearer " + localStorage.getItem("user_token")
            }
        });

        if (reponse.ok) {
            alert("Votre compte et toutes vos données ont été effacés avec succès. Au revoir dresseur !");
            logout(); // On vide le localStorage et on redirige vers l'accueil
        } else {
            alert("Erreur lors de la suppression. Contactez l'administrateur.");
        }
    } catch (e) {
        console.error("Crash suppression compte :", e);
        alert("Microservice Identity injoignable.");
    }
}

// --- LOGIQUE DE LA MODALE DE RECHARGE ---

function openRechargeModal() {
    const userData = JSON.parse(localStorage.getItem("user_data"));
    document.getElementById("recharge-modal").style.display = "flex";
    // On pré-remplit le nom du dresseur sur la carte
    document.getElementById("modal-card-holder").innerText = userData.username || "DRESSEUR";
}

function closeRechargeModal() {
    document.getElementById("recharge-modal").style.display = "none";
}

// Fonction de validation pour la modale
async function rechargerCompteModal() {
    const userData = JSON.parse(localStorage.getItem("user_data"));
    const montant = document.getElementById("modal-recharge-amount").value;
    const card = document.getElementById("modal-card-num").value;

    if (!card || card.length < 16 || !montant || montant <= 0) {
        alert("Rigueur : Merci de remplir tous les champs de paiement.");
        return;
    }

    try {
        const res = await fetch(`${API_WALLETS}/deposit/${userData.id}/${montant}`, {
            method: "PUT"
        });

        if (res.ok) {
            alert("Paiement accepté ! Vos Poké-Crédits ont été ajoutés.");
            closeRechargeModal();
            // Mise à jour du solde partout sur le site
            await chargerSoldeDresseur(userData.id);
        }
    } catch (e) {
        alert("Erreur de connexion avec le service Wallet.");
    }
}

function logout() { localStorage.clear(); window.location.href = "../index.html"; }