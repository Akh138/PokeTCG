// =============================================================
// MODULE : MARCHÉ MONDIAL ET GESTION DES VENTES (MARKETPLACE)
// =============================================================

// 1. AFFICHAGE DU MARCHÉ PUBLIC (CARTES DES AUTRES DRESSEURS)
async function chargerMarcheMondial() {
    const grid = document.getElementById("market-grid");
    const userData = JSON.parse(localStorage.getItem("user_data"));
    if (!grid) return;

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
            // Récupération des métadonnées de la carte (Catalog)
            const res = await fetch(`${API_CATALOG}/details/${ad.idCarteApi}`);
            const rawData = await res.json();
            const cardData = rawData.id ? rawData : rawData.data;

            // Récupération du pseudo du vendeur (Identity)
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
                        <!-- BOUTON 3D ACHETER (STYLE VERT) -->
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
        await pokeAlert("ERREUR", "Impossible de charger le marché mondial.");
    }
}

// 2. ACTION D'ACHAT (LOGIQUE SÉQUESTRE)
async function acheterCarte(idAnnonce, prix) {
    const userData = JSON.parse(localStorage.getItem("user_data"));
    const userToken = localStorage.getItem("user_token");

    if (userData.solde < prix) {
        await pokeAlert("SOLDE INSUFFISANT", "Vous n'avez pas assez de Poké-Crédits pour cet achat.");
        return;
    }

    const confirmation = await pokeConfirm("TRANSACTION", `Voulez-vous acheter cette carte pour ${prix} PC ? L'argent sera bloqué en séquestre jusqu'à la livraison.`);
    if (!confirmation) return;

    try {
        const reponse = await fetch(`${API_MARKETPLACE}/buy/${idAnnonce}/${userData.id}`, {
            method: "PUT",
            headers: {
                "Authorization": "Bearer " + userToken,
                "Content-Type": "application/json"
            }
        });

        if (reponse.ok) {
            await pokeAlert("SUCCÈS", "Achat validé ! La carte est en route vers votre collection.");
            await chargerSoldeDresseur(userData.id);
            await chargerInventairePrivé(userData.id);
            chargerMarcheMondial();
        } else {
            const errorMsg = await reponse.text();
            await pokeAlert("REFUSÉ", "Le serveur a décliné l'achat : " + errorMsg);
        }
    } catch (error) { await pokeAlert("ERREUR", "Le service Marketplace est injoignable."); }
}

// 3. GESTION DES VENTES (BUREAU COMMERCIAL / HISTORIQUE)
async function chargerGestionVentes() {
    const placeholder = document.getElementById("my-sales-placeholder");
    const userData = JSON.parse(localStorage.getItem("user_data"));
    if (!placeholder) return;

    placeholder.innerHTML = `<p style="text-align:center;">Chargement de votre bureau commercial...</p>`;

    try {
        const monIdReel = Number(userData.id);
        const resAchats = await fetch(`${API_MARKETPLACE}/acheteur/${monIdReel}`);
        const mesAchats = await resAchats.json();
        const resVentes = await fetch(`${API_MARKETPLACE}/vendeur/${monIdReel}`);
        const mesVentes = await resVentes.json();

        const achatsEnCours = mesAchats.filter(a => a.statut === 'EN_TRANSIT' || a.statut === 'EXPEDIEE');
        const historiqueAchatsReçus = mesAchats.filter(a => a.statut === 'VENDUE');

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

        // Remplissage Achats (Acheteur)
        const pendingGrid = document.getElementById("list-achats-cours");
        if (achatsEnCours.length === 0) {
            pendingGrid.innerHTML = "<p class='small-text'>Aucun colis en route.</p>";
        } else {
            for (const achat of achatsEnCours) {
                const resCard = await fetch(`${API_CATALOG}/details/${achat.idCarteApi}`);
                const card = await resCard.json();
                const cardData = card.id ? card : card.data;
                let actionHtml = "";

                if (achat.statut === 'EN_TRANSIT') {
                    actionHtml = `
                        <div style="display:flex; flex-direction:column; gap:5px; align-items: flex-end;">
                            <span style="color:var(--text-muted); font-size:0.7rem;"><i class="fas fa-clock"></i> Attente envoi...</span>
                            <button class="btn-3d btn-red" style="width: 130px; height: 32px;" onclick="cloturerAnnulerAchat(${achat.id})">
                                <div class="button-outer"><div class="button-inner"><span style="font-size: 0.8rem; letter-spacing: 2.5px;">ANNULER</span></div></div>
                            </button>
                        </div>`;
                } else if (achat.statut === 'EXPEDIEE') {
                    actionHtml = `
                        <button class="btn-3d btn-yellow" style="width: 130px; height: 32px;" onclick="confirmerReceptionAchat(${achat.id})">
                            <div class="button-outer"><div class="button-inner"><span style="font-size: 0.8rem; letter-spacing: 2.5px;">REÇU ?</span></div></div>
                        </button>`;
                }
                pendingGrid.innerHTML += `<div class="mgmt-item"><div class="mgmt-item-info"><b>${cardData.nomFr}</b><span>Prix : ${achat.prix} PC</span></div>${actionHtml}</div>`;
            }
        }

        // Remplissage Ventes (Vendeur)
        const salesGrid = document.getElementById("list-ventes-actives");
        if (mesVentes.length === 0) {
            salesGrid.innerHTML = "<p class='small-text'>Vous n'avez aucune annonce.</p>";
        } else {
            for (const vente of mesVentes) {
                const resCard = await fetch(`${API_CATALOG}/details/${vente.idCarteApi}`);
                const card = await resCard.json();
                const cardData = card.id ? card : card.data;
                let btnVendeur = "";

                if (vente.statut === 'DISPONIBLE') {
                    btnVendeur = `
                        <button class="btn-3d btn-red" style="width: 110px; height: 32px;" onclick="annulerAnnonce(${vente.id})">
                            <div class="button-outer"><div class="button-inner"><span style="font-size: 0.8rem; letter-spacing: 2.5px;">RETIRER</span></div></div>
                        </button>`;
                } else if (vente.statut === 'EN_TRANSIT') {
                    btnVendeur = `
                        <button class="btn-3d btn-yellow" style="width: 130px; height: 32px;" onclick="marquerCommeEnvoye(${vente.id})">
                            <div class="button-outer"><div class="button-inner"><span style="font-size: 0.8rem; letter-spacing: 2.5px;"><i class="fas fa-shipping-fast"></i> ENVOYER</span></div></div>
                        </button>`;
                } else if (vente.statut === 'EXPEDIEE') {
                    btnVendeur = `<span style="color:#3b82f6; font-size:0.75rem; font-weight:bold;"><i class="fas fa-truck"></i> EN ROUTE</span>`;
                }
                salesGrid.innerHTML += `
                    <div class="mgmt-item">
                        <div class="mgmt-item-info"><b>${cardData.nomFr || card.nomFr}</b><span>Prix : ${vente.prix} PC</span><span class="status-tag ${vente.statut === 'VENDUE' ? 'status-available' : 'status-transit'}">${vente.statut}</span></div>
                        ${btnVendeur}
                    </div>`;
            }
        }
    } catch (e) { console.error("Erreur Gestion :", e); }
}

// 4. ACTIONS DU WORKFLOW DE VENTE
async function marquerCommeEnvoye(idAnnonce) {
    const conf = await pokeConfirm("LOGISTIQUE", "Avez-vous déposé le colis ? L'acheteur sera notifié de l'expédition.");
    if (!conf) return;

    try {
        const res = await fetch(`${API_MARKETPLACE}/ship/${idAnnonce}`, { method: "PUT" });
        if (res.ok) {
            await pokeAlert("ENVOI", "Statut mis à jour : Colis expédié !");
            chargerGestionVentes();
        }
    } catch (e) { await pokeAlert("ERREUR", "Erreur lors de la mise à jour du statut."); }
}

async function confirmerReceptionAchat(idAnnonce) {
    const conf = await pokeConfirm("LIVRAISON", "Confirmez-vous avoir reçu la carte ? Cela libérera l'argent pour le vendeur.");
    if (!conf) return;

    try {
        const res = await fetch(`${API_MARKETPLACE}/confirm-delivery/${idAnnonce}`, { method: "PUT" });
        if (res.ok) {
            await pokeAlert("TERMINÉ", "Merci ! La transaction est clôturée et la carte est officiellement à vous.");
            location.reload();
        }
    } catch (e) { await pokeAlert("ERREUR", "Impossible de valider la réception."); }
}

async function annulerAnnonce(idAnnonce) {
    const conf = await pokeConfirm("RETRAIT", "Voulez-vous retirer cette carte du marché mondial ?");
    if (!conf) return;

    try {
        const res = await fetch(`${API_MARKETPLACE}/delete/${idAnnonce}`, { method: "DELETE" });
        if (res.ok) {
            await pokeAlert("ANNULATION", "L'annonce a été supprimée avec succès.");
            chargerGestionVentes();
            const userData = JSON.parse(localStorage.getItem("user_data"));
            chargerInventairePrivé(userData.id);
        }
    } catch (e) { await pokeAlert("ERREUR", "Le microservice Marketplace ne répond pas."); }
}

async function cloturerAnnulerAchat(idAnnonce) {
    const conf = await pokeConfirm("ANNULATION", "Annuler cet achat ? Vos Poké-Crédits vous seront immédiatement restitués.");
    if (!conf) return;

    try {
        const reponse = await fetch(`${API_MARKETPLACE}/cancel-buy/${idAnnonce}`, { method: "PUT" });
        if (reponse.ok) {
            await pokeAlert("REMBOURSEMENT", "Achat annulé. Votre solde a été mis à jour.");
            location.reload();
        } else {
            const error = await reponse.text();
            await pokeAlert("ACTION IMPOSSIBLE", error);
        }
    } catch (e) { await pokeAlert("ERREUR", "Erreur lors de la procédure de remboursement."); }
}

// 5. LOGIQUE DE MISE EN VENTE (PUBLICATION)
async function chargerMesAnnonces(idVendeur) {
    try {
        const res = await fetch(`${API_MARKETPLACE}/vendeur/${idVendeur}`);
        if (res.ok) { mesAnnonces = await res.json(); }
    } catch (e) { console.error("Erreur Marketplace Sync :", e); }
}

function preparerVente(idApi, nomFr) {
    carteEnCoursDeVente = idApi;
    document.getElementById("sell-card-name").innerText = "Carte : " + nomFr;
    document.getElementById("sell-card-modal").style.display = "flex";
}

async function confirmerMiseEnVente() {
    const userData = JSON.parse(localStorage.getItem("user_data"));
    const prixSaisi = document.getElementById("sell-price").value;
    if (!prixSaisi || prixSaisi <= 0) { await pokeAlert("PRIX", "Prix invalide !"); return; }
    const maCarte = monInventaire.find(c => c.idCarteApi === carteEnCoursDeVente);
    const nouvelleAnnonce = { idVendeur: userData.id, idCarteApi: carteEnCoursDeVente, prix: prixSaisi, etat: maCarte ? maCarte.etatCarte : "Normal", statut: "DISPONIBLE", datePublication: new Date().toISOString() };
    try {
        const reponse = await fetch(`${API_MARKETPLACE}/post`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(nouvelleAnnonce) });
        if (reponse.ok) {
            await pokeAlert("BRAVO", "Annonce publiée !");
            closeSellModal();
            await chargerMesAnnonces(userData.id);
            const ext = toutesLesExtensions.find(e => e.name === maCarte.extension);
            if(ext) ouvrirClasseurSet(ext.id);
        }
    } catch (error) { await pokeAlert("ERREUR", "Erreur serveur."); }
}

function closeSellModal() { document.getElementById("sell-card-modal").style.display = "none"; }