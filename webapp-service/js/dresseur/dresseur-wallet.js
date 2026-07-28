// =============================================================
// MODULE : PORTEFEUILLE ET BANQUE (WALLET SERVICE - PORT 8082)
// =============================================================

// 1. RÉCUPÉRATION DU SOLDE RÉEL DEPUIS MYSQL
// Cette fonction est le lien direct avec ma base de données transactionnelle.
async function chargerSoldeDresseur(idDresseur) {
    try {
        // J'appelle mon microservice Wallet via une requête asynchrone
        const reponse = await fetch(`${API_WALLETS}/owner/${idDresseur}`);

        if (reponse.ok) {
            const wallet = await reponse.json();

            // RIGUEUR : Je force l'affichage à 2 décimales pour la précision monétaire
            const dispo = wallet.soldeDisponible.toFixed(2);
            const bloque = wallet.soldeSequestre.toFixed(2);

            // J'injecte les montants dans le Header et dans la vue "Ma Banque"
            const balanceHeader = document.getElementById("user-balance-header");
            if (balanceHeader) balanceHeader.innerText = dispo + " PC";

            if (document.getElementById("wallet-available")) {
                document.getElementById("wallet-available").innerText = dispo + " PC";
                document.getElementById("wallet-escrow").innerText = bloque + " PC";
            }

            // Je synchronise ma session locale pour que le reste du site connaisse mon solde
            const u = JSON.parse(localStorage.getItem("user_data"));
            u.solde = wallet.soldeDisponible;
            localStorage.setItem("user_data", JSON.stringify(u));
        }
    } catch (error) {
        console.error("Erreur Banque :", error);
        // En cas de panne réseau, j'avertis le dresseur via ma modale personnalisée
        await pokeAlert("MA BANQUE", "Impossible de récupérer votre solde réel. Affichage du dernier solde connu.");
    }
}

// 2. LOGIQUE DE RECHARGE (FORMULAIRE FIXE DE LA PAGE BANQUE)
async function rechargerCompte() {
    const userData = JSON.parse(localStorage.getItem("user_data"));
    const montant = document.getElementById("recharge-amount").value;
    const card = document.getElementById("card-num").value;
    const exp = document.getElementById("card-exp").value;
    const cvv = document.getElementById("card-cvv").value;

    // VALIDATION DE RIGUEUR : Je bloque la requête si les infos sont incomplètes
    if (!card || card.length < 16 || !exp || !cvv) {
        await pokeAlert("MA BANQUE", "Informations bancaires invalides.");
        return;
    }
    if (!montant || montant <= 0) {
        await pokeAlert("MA BANQUE", "Le montant du dépôt doit être supérieur à 0 PC.");
        return;
    }

    try {
        // J'utilise la méthode PUT car je modifie une ressource existante (mon solde)
        const res = await fetch(`${API_WALLETS}/deposit/${userData.id}/${montant}`, {
            method: "PUT"
        });

        if (res.ok) {
            await pokeAlert("SUCCÈS", "Paiement accepté ! Votre compte a été crédité.");
            // Je vide le formulaire par sécurité
            document.getElementById("recharge-amount").value = "";
            document.getElementById("card-num").value = "";
            document.getElementById("card-exp").value = "";
            document.getElementById("card-cvv").value = "";

            // Je mets à jour l'interface immédiatement pour une meilleure expérience utilisateur
            await chargerSoldeDresseur(userData.id);
            await chargerHistoriquePortefeuille(userData.id);
        }
    } catch (e) {
        await pokeAlert("MAINTENANCE", "Le microservice Wallet est indisponible.");
    }
}

// 3. LOGIQUE DE RECHARGE (MODALE ÉLITE DU HEADER)
// J'ai créé cette fonction pour permettre une recharge rapide sans quitter le Marché ou le Pokedex.
function openRechargeModal() {
    const userData = JSON.parse(localStorage.getItem("user_data"));
    const modal = document.getElementById("recharge-modal");
    if (modal) {
        modal.style.display = "flex";
        // Je personnalise la carte bancaire visuelle avec le nom du dresseur
        const holder = document.getElementById("modal-card-holder");
        if (holder) holder.innerText = userData.username || "DRESSEUR";
    }
}

function closeRechargeModal() {
    document.getElementById("recharge-modal").style.display = "none";
}

// Version asynchrone de la recharge via la fenêtre surgissante
async function rechargerCompteModal() {
    const userData = JSON.parse(localStorage.getItem("user_data"));
    const montant = document.getElementById("modal-recharge-amount").value;
    const card = document.getElementById("modal-card-num").value;

    if (!card || card.length < 16 || !montant || montant <= 0) {
        await pokeAlert("RECHARGE RAPIDE", "Merci de remplir tous les champs de paiement.");
        return;
    }

    try {
        const res = await fetch(`${API_WALLETS}/deposit/${userData.id}/${montant}`, {
            method: "PUT"
        });

        if (res.ok) {
            await pokeAlert("SUCCÈS", "Vos Poké-Crédits ont été ajoutés avec succès !");
            closeRechargeModal();
            // Je rafraîchis les données financières
            await chargerSoldeDresseur(userData.id);
            await chargerHistoriquePortefeuille(userData.id);
        }
    } catch (e) {
        await pokeAlert("MAINTENANCE", "Impossible de joindre le microservice Wallet.");
    }
}

// Petit helper pour mes boutons de montants rapides (50, 100, 500)
window.setAmount = function(val) {
    const field = document.getElementById("recharge-amount");
    if(field) field.value = val;
};

// 4. JOURNAL D'AUDIT FINANCIER (LISTE DES MOUVEMENTS)
// C'est ici que je gère la traçabilité de chaque mouvement d'argent.
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

            // LOGIQUE DE RIGUEUR : J'applique un code couleur selon la nature de la transaction
            if (t.type === 'DEPOSIT' || t.type === 'SALE_CONFIRMED') {
                color = "#10b981"; // Vert : C'est un gain d'argent
                prefix = "+";
            }
            if (t.type === 'PURCHASE_LOCK' || t.type === 'PURCHASE_CONFIRMED') {
                color = "#ef4444"; // Rouge : C'est une dépense
                prefix = "-";
            }
            if (t.type === 'PURCHASE_CANCELLED') {
                color = "#3b82f6"; // Bleu : C'est un remboursement (Annulation)
                prefix = "+";
            }

            // Je génère dynamiquement la ligne du journal avec les bonnes couleurs
            list.innerHTML += `
                <div class="mgmt-item" style="border-left: 4px solid ${color}; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; padding: 10px; background: rgba(255,255,255,0.02); border-radius: 8px;">
                    <div class="mgmt-item-info" style="text-align: left;">
                        <b style="font-size: 0.85rem;">${t.type}</b><br>
                        <span style="font-size: 0.7rem; color: var(--text-muted);">${date}</span>
                    </div>
                    <b style="color: ${color}; font-size: 1rem;">${prefix}${t.montant.toFixed(2)} PC</b>
                </div>`;
        });
    } catch (e) {
        console.error("Erreur Audit Wallet :", e);
        await pokeAlert("MA BANQUE", "Le journal des mouvements est momentanément indisponible.");
    }
}