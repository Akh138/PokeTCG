// =============================================================
// MODULE : PORTEFEUILLE ET BANQUE (WALLET SERVICE)
// =============================================================

// 1. RÉCUPÉRATION DU SOLDE RÉEL DEPUIS MYSQL
async function chargerSoldeDresseur(idDresseur) {
    try {
        const reponse = await fetch(`${API_WALLETS}/owner/${idDresseur}`);
        if (reponse.ok) {
            const wallet = await reponse.json();
            const dispo = wallet.soldeDisponible.toFixed(2);
            const bloque = wallet.soldeSequestre.toFixed(2);

            // Mise à jour du header et de la vue Wallet
            document.getElementById("user-balance-header").innerText = dispo + " PC";
            if (document.getElementById("wallet-available")) {
                document.getElementById("wallet-available").innerText = dispo + " PC";
                document.getElementById("wallet-escrow").innerText = bloque + " PC";
            }

            // Synchronisation de la session locale pour les autres calculs
            const u = JSON.parse(localStorage.getItem("user_data"));
            u.solde = wallet.soldeDisponible;
            localStorage.setItem("user_data", JSON.stringify(u));
        }
    } catch (error) {
        console.error("Erreur Banque :", error);
    }
}

// 2. LOGIQUE DE RECHARGE (FORMULAIRE DE LA PAGE BANQUE)
async function rechargerCompte() {
    const userData = JSON.parse(localStorage.getItem("user_data"));
    const montant = document.getElementById("recharge-amount").value;
    const card = document.getElementById("card-num").value;
    const exp = document.getElementById("card-exp").value;
    const cvv = document.getElementById("card-cvv").value;

    if (!card || card.length < 16 || !exp || !cvv) {
        alert("Rigueur : Informations bancaires invalides.");
        return;
    }
    if (!montant || montant <= 0) {
        alert("Rigueur : Montant invalide.");
        return;
    }

    try {
        const res = await fetch(`${API_WALLETS}/deposit/${userData.id}/${montant}`, {
            method: "PUT"
        });

        if (res.ok) {
            alert("Paiement accepté ! Compte crédité !");
            // Reset des champs
            document.getElementById("recharge-amount").value = "";
            document.getElementById("card-num").value = "";
            document.getElementById("card-exp").value = "";
            document.getElementById("card-cvv").value = "";

            // Mise à jour immédiate (UX)
            await chargerSoldeDresseur(userData.id);
            await chargerHistoriquePortefeuille(userData.id);
        }
    } catch (e) {
        alert("Impossible de joindre le microservice Wallet.");
    }
}

// 3. LOGIQUE DE RECHARGE (MODALE ÉLITE DU HEADER)
function openRechargeModal() {
    const userData = JSON.parse(localStorage.getItem("user_data"));
    const modal = document.getElementById("recharge-modal");
    if (modal) {
        modal.style.display = "flex";
        document.getElementById("modal-card-holder").innerText = userData.username || "DRESSEUR";
    }
}

function closeRechargeModal() {
    document.getElementById("recharge-modal").style.display = "none";
}

async function rechargerCompteModal() {
    const userData = JSON.parse(localStorage.getItem("user_data"));
    const montant = document.getElementById("modal-recharge-amount").value;
    const card = document.getElementById("modal-card-num").value;

    if (!card || card.length < 16 || !montant || montant <= 0) {
        alert("Rigueur : Veuillez remplir les informations de paiement.");
        return;
    }

    try {
        const res = await fetch(`${API_WALLETS}/deposit/${userData.id}/${montant}`, {
            method: "PUT"
        });

        if (res.ok) {
            alert("Paiement accepté ! Vos Poké-Crédits ont été ajoutés.");
            closeRechargeModal();
            // Mise à jour immédiate
            await chargerSoldeDresseur(userData.id);
            await chargerHistoriquePortefeuille(userData.id);
        }
    } catch (e) {
        alert("Erreur de connexion avec le service Wallet.");
    }
}

window.setAmount = function(val) {
    const field = document.getElementById("recharge-amount");
    if(field) field.value = val;
};

// 4. JOURNAL D'AUDIT FINANCIER (LISTE DES MOUVEMENTS)
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

            // Code couleur de Rigueur pour l'audit
            if (t.type === 'DEPOSIT' || t.type === 'SALE_CONFIRMED') {
                color = "#10b981"; // Vert : gain
                prefix = "+";
            }
            if (t.type === 'PURCHASE_LOCK' || t.type === 'PURCHASE_CONFIRMED') {
                color = "#ef4444"; // Rouge : dépense
                prefix = "-";
            }
            if (t.type === 'PURCHASE_CANCELLED') {
                color = "#3b82f6"; // Bleu : remboursement
                prefix = "+";
            }

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
    }
}