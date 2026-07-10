// --- LOGIQUE DU DASHBOARD DRESSEUR - PokeTCG (VERSION FINALE INTÉGRALE - SÉCURISÉE) ---

// 1. ADRESSES DE MES MICROSERVICES
const API_IDENTITY     = "http://localhost:8081/api/auth";
const API_CATALOG      = "http://localhost:8083/api/catalog";
const API_INVENTORY    = "http://localhost:8084/api/inventory";
const API_MARKETPLACE  = "http://localhost:8085/api/marketplace";
const API_WALLETS      = "http://localhost:8082/api/wallets"; // Port 8082 pour ma banque

// 2. VARIABLES GLOBALES DE SESSION
let toutesLesExtensions = [];
let monInventaire = [];
let mesAnnonces = []; // Habib : Je stocke ici mes ventes actives pour mettre à jour les badges
let annoncesPubliques = []; // Habib : Je stocke ici les cartes des autres dresseurs
let carteEnCoursDeCapture = null;
let carteEnCoursDeVente = null; // Habib : Pour stocker l'ID de la carte que je veux vendre
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

    // ⭐ HABIB : ÉTAPE PRIORITAIRE n°1 ⭐
    // J'active IMMÉDIATEMENT les contrôles UI (Burger, Onglets)
    // Comme ça, le menu fonctionne même pendant que les données chargent.
    initUIControls();
    initAvatarSystem();
    initCaptureLogic();
    initSearchLogic();

    // A. INITIALISATION DU PROFIL (Pseudo)
    document.getElementById("display-pseudo").innerText = userData.pseudo;

    // B. CHARGEMENT DES DONNÉES EN CASCADE (ORDRE CRITIQUE)
    try {
        // 1. Je récupère d'abord les infos complètes (Email, Adresse, Solde)
        const userFull = await chargerInfosDresseur(userData.pseudo, userToken);

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

    } catch (error) {
        console.error("Erreur lors du chargement des données :", error);
    }
});


// --- SECTION : GESTION DU ZOOM (LIGHTBOX) ---

// Habib : J'attache la fonction à 'window' pour qu'elle soit visible partout
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

// Habib : Cette fonction gère la recherche globale par nom (Pikachu, Dracaufeu...)
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

        // Habib : Je vérifie mes 3 carrés de complétion
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


// ⭐ HABIB : MA LOGIQUE DE COLLECTION (LISTE DES LOGOS + CLASSEUR GRID) ⭐

function afficherMaCollection() {
    const grid = document.getElementById("collection-grid");
    if (!grid) return;
    grid.innerHTML = "";

    // Je ne garde que les extensions où je possède au moins une carte dans mon inventaire MySQL
    const mesSetsNoms = [...new Set(monInventaire.map(c => c.extension))];
    const mesExtensions = toutesLesExtensions.filter(ext => mesSetsNoms.includes(ext.name));

    if (mesExtensions.length === 0) {
        grid.innerHTML = `<p style="text-align:center; padding:50px;">Votre collection est vide. Allez dans le Pokedex Mondial !</p>`;
        return;
    }

    mesExtensions.forEach(ext => {
        const mesCartes = monInventaire.filter(c => c.extension === ext.name);
        const uniqueIds = [...new Set(mesCartes.map(c => c.idCarteApi))];
        const nbPossedes = uniqueIds.length;
        const pourcent = Math.round((nbPossedes / ext.total) * 100);

        grid.innerHTML += `
            <div class="extension-card glass" onclick="ouvrirClasseurSet('${ext.id}')">
                <img src="${ext.images.logo}" alt="${ext.name}">
                <div class="ext-info">
                    <h3>${ext.name}</h3>
                    <div class="ext-progress">
                        <div class="ext-progress-info"><span>Collection</span><span>${nbPossedes} / ${ext.total}</span></div>
                        <div class="ext-progress-bg"><div class="ext-progress-fill ${pourcent === 100 ? 'completed' : ''}" style="width: ${pourcent}%"></div></div>
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
        // Je récupère toute la série de MongoDB (Port 8083)
        const reponse = await fetch(`${API_CATALOG}/set/${setId}`);
        const toutesLesCartesMondiales = await reponse.json();

        // Je trie par numéro officiel pour respecter le rangement du classeur
        toutesLesCartesMondiales.sort((a, b) => parseInt(a.number) - parseInt(b.number));

        grid.innerHTML = `
            <div class="grid-header">
                <button class="filter-btn back-btn" onclick="afficherMaCollection()">Retour</button>
                <h2>${ext.name}</h2>
            </div>
            <!-- HABIB : J'utilise binder-grid pour forcer le rangement horizontal -->
            <div class="binder-grid" id="binder-view"></div>
        `;

        const binderView = document.getElementById("binder-view");

        toutesLesCartesMondiales.forEach(carteMondiale => {
            const possession = monInventaire.find(c => c.idCarteApi === carteMondiale.id);

            if (possession) {

                // ⭐ HABIB : LOGIQUE DE BADGE MARKETPLACE ⭐
                // Je vérifie si cette carte est déjà en vente (Statut DISPONIBLE)
                const estEnVente = mesAnnonces.some(a => a.idCarteApi === carteMondiale.id && a.statut === 'DISPONIBLE');

                // CARTE POSSÉDÉE : Couleur + Badge d'état + Image Mongo
                let classEtat = "cond-neuf";
                if(possession.etatCarte === "Excellent") classEtat = "cond-excellent";
                if(possession.etatCarte === "Usé") classEtat = "cond-use";
                const date = new Date(possession.dateAcquisition).toLocaleDateString('fr-FR');

                binderView.innerHTML += `
                    <div class="pokemon-card glass">
                        <div class="card-img-container">
                            <div class="condition-badge ${classEtat}">${possession.etatCarte}</div>
                            <div class="btn-zoom-overlay" onclick="ouvrirZoom('${carteMondiale.images.large}', event)"><i class="fas fa-search-plus"></i></div>
                            <img src="${carteMondiale.images.large}" alt="${carteMondiale.name}">
                        </div>
                        <div class="card-details">
                            <h3>${carteMondiale.name}</h3>
                            
                            <!-- HABIB : SWITCH BOUTON VENDRE / BADGE STATUT -->
                            ${estEnVente ? `
                                <div class="status-badge-sale">
                                    <i class="fas fa-tag"></i> En vente
                                </div>
                            ` : `
                                <button class="btn-sell-trigger" onclick="preparerVente('${carteMondiale.id}', '${carteMondiale.name}')">
                                    <i class="fas fa-hand-holding-usd"></i> Mettre en vente
                                </button>
                            `}
                            
                            <div class="status-indicators">
                                <div class="box ${possession.langueCarte === 'Normal' ? 'active-normal' : ''}">N</div>
                                <div class="box ${possession.langueCarte === 'Holo' ? 'active-holo' : ''}">H</div>
                                <div class="box ${possession.langueCarte === 'Reverse' ? 'active-reverse' : ''}">R</div>
                            </div>
                            <span class="acquisition-date">Obtenue le ${date}</span>
                        </div>
                    </div>`;
            } else {
                // CARTE MANQUANTE : Dos de carte (assets/cards-back.png)
                binderView.innerHTML += `
                    <div class="pokemon-card glass not-owned">
                        <div class="card-img-container">
                            <div class="missing-badge">MANQUANTE</div>
                            <img src="../assets/cards-back.png" alt="Missing">
                        </div>
                        <div class="card-details">
                            <h3 style="opacity:0.3;">N°${carteMondiale.number}</h3>
                        </div>
                    </div>`;
            }
        });
    } catch (e) { console.error("Erreur classeur :", e); }
}


// ⭐ HABIB : NOUVELLE SECTION - MARCHÉ MONDIAL (ACHAT) ⭐

async function chargerMarcheMondial() {
    const grid = document.getElementById("market-grid");
    const userData = JSON.parse(localStorage.getItem("user_data"));
    grid.innerHTML = `<p style="grid-column: 1/-1; text-align:center;">Ouverture du marché...</p>`;

    try {
        // 1. Je récupère les annonces des AUTRES (Port 8085)
        const reponse = await fetch(`${API_MARKETPLACE}/public/${userData.id}`);
        const annonces = await reponse.json();

        if (annonces.length === 0) {
            grid.innerHTML = `<p style="grid-column: 1/-1; text-align:center; padding:50px;">Aucune vente en cours.</p>`;
            return;
        }

        grid.innerHTML = "";

        // 2. Pour chaque annonce, je vais chercher les détails HD (Mongo 8083)
        for (const ad of annonces) {
            const res = await fetch(`${API_CATALOG}/details/${ad.idCarteApi}`);
            const rawData = await res.json();

            // ⭐ HABIB : SÉCURITÉ CONTRE LES ENVELOPPES .DATA ET NOMS DE CARTE.JAVA ⭐
            const cardData = rawData.id ? rawData : rawData.data;

            // 3. Je récupère le Pseudo réel du vendeur via son ID (Identity 8081)
            const resSeller = await fetch(`${API_IDENTITY}/id/${ad.idVendeur}`);
            const sellerData = await resSeller.json();
            const sellerName = sellerData.username || "Dresseur";

            // 4. Couleur du badge selon l'état de l'annonce
            let badgeColor = "#10b981"; // Mint
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
                        <button class="btn-buy-trigger" onclick="acheterCarte(${ad.id}, ${ad.prix})">
                            <i class="fas fa-shopping-cart"></i> Acheter
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
    const token = localStorage.getItem("user_token");

    // Habib : Simulation de validation Fintech (Solde suffisant ?)
    if (userData.solde < prix) {
        alert("Achat refusé : Solde insuffisant ! Allez à la banque pour recharger.");
        return;
    }

    if (!confirm(`Confirmer l'achat pour ${prix} PC ? L'argent sera placé en séquestre.`)) return;

    try {
        // J'appelle la route d'achat du Marketplace (Port 8085)
        const reponse = await fetch(`${API_MARKETPLACE}/buy/${idAnnonce}/${userData.id}`, {
            method: "PUT"
        });

        if (reponse.ok) {
            alert("Achat réussi ! La carte est en cours de livraison (EN TRANSIT).");
            await chargerSoldeDresseur(userData.id);
            await chargerInventairePrivé(userData.id);
            chargerMarcheMondial();
        }
    } catch (error) { alert("Erreur lors de la transaction."); }
}


// ⭐ HABIB : LOGIQUE MARKETPLACE (Vendeur) ⭐

async function chargerMesAnnonces(idVendeur) {
    try {
        const res = await fetch(`${API_MARKETPLACE}/vendeur/${idVendeur}`);
        if (res.ok) {
            mesAnnonces = await res.json();
            console.log("LOG : Synchronisation Marketplace réussie.");
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

    const nouvelleAnnonce = {
        idVendeur: userData.id,
        idCarteApi: carteEnCoursDeVente,
        prix: prixSaisi,
        etat: maCarte ? maCarte.etatCarte : "Normal",
        statut: "DISPONIBLE",
        datePublication: new Date().toISOString()
    };

    try {
        const reponse = await fetch(`${API_MARKETPLACE}/post`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(nouvelleAnnonce)
        });

        if (reponse.ok) {
            alert("Votre annonce est publiée ! Elle est visible par la communauté.");
            closeSellModal();
            await chargerMesAnnonces(userData.id);
            const activeCard = monInventaire.find(c => c.idCarteApi === carteEnCoursDeVente);
            if(activeCard) {
                const ext = toutesLesExtensions.find(e => e.name === activeCard.extension);
                if(ext) ouvrirClasseurSet(ext.id);
            }
        }
    } catch (error) { alert("Erreur de publication."); }
}

function closeSellModal() { document.getElementById("sell-card-modal").style.display = "none"; }


// ⭐ HABIB : LOGIQUE FINTECH (Port 8082) ⭐

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

            // Je mets à jour la session locale pour la validation d'achat
            const u = JSON.parse(localStorage.getItem("user_data"));
            u.solde = wallet.soldeDisponible;
            localStorage.setItem("user_data", JSON.stringify(u));
        }
    } catch (error) { console.error("Erreur Banque :", error); }
}

// Habib : Ma logique de rechargement sécurisée avec simulation bancaire
async function rechargerCompte() {
    const userData = JSON.parse(localStorage.getItem("user_data"));
    const montant = document.getElementById("recharge-amount").value;
    const card = document.getElementById("card-num").value;
    const exp = document.getElementById("card-exp").value;
    const cvv = document.getElementById("card-cvv").value;

    if (!card || card.length < 16) { alert("Erreur : Numéro de carte invalide."); return; }
    if (!exp || !cvv) { alert("Erreur : Merci de compléter les infos de sécurité."); return; }
    if (!montant || montant <= 0) { alert("Montant invalide !"); return; }

    try {
        const res = await fetch(`${API_WALLETS}/deposit/${userData.id}/${montant}`, {
            method: "PUT"
        });

        if (res.ok) {
            alert("Paiement accepté ! Compte crédité de " + montant + " PC.");
            document.getElementById("recharge-amount").value = "";
            document.getElementById("card-num").value = "";
            document.getElementById("card-exp").value = "";
            document.getElementById("card-cvv").value = "";
            await chargerSoldeDresseur(userData.id);
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
            return fullUser; // ⭐ HABIB : C'est ici le point vital pour l'ID !
        }
    } catch (error) { console.error(error); }
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

            // ⭐ HABIB : NAVIGATION CORRIGÉE ⭐
            if (target === "view-collection") {
                afficherMaCollection();
            }

            if (target === "view-market") {
                chargerMarcheMondial();
            }

            if (target === "view-wallet") {
                const userData = JSON.parse(localStorage.getItem("user_data"));
                if(userData && userData.id) {
                    chargerSoldeDresseur(userData.id);
                }
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
function logout() { localStorage.clear(); window.location.href = "../index.html"; }