// ---AUDIT FINANCIER (Wallet 8082) ---

const API_ADMIN_WALLET = "http://localhost:8082/api/wallets";

// Fonction pour charger les stats globales (Dresseurs + Argent)
async function loadGlobalStats() {
    try {
        // 1. On récupère le nombre de dresseurs (via le service Identity)
        const resUsers = await fetch("http://localhost:8081/api/auth/all");
        const users = await resUsers.json();
        document.getElementById("stat-total-users").innerText = users.length;

        // 2. On récupère les stats de l'argent (via le service Wallet)
        const resWallet = await fetch(`${API_ADMIN_WALLET}/admin/stats`);
        const walletStats = await resWallet.json();

        // 3. Mise à jour des compteurs de l'accueil
        document.getElementById("stat-total-credits").innerText = (walletStats.totalAvailable || 0).toFixed(2) + " PC";
        document.getElementById("stat-total-escrow").innerText = (walletStats.totalEscrow || 0).toFixed(2) + " PC";

        // Si on est sur la vue Audit, on remplit aussi le contenu détaillé
        const auditContent = document.getElementById("admin-wallet-audit-content");
        if(auditContent) {
            auditContent.innerHTML = `
                <div class="mgmt-item">
                    <span>Masse monétaire totale (Circulation) :</span>
                    <b style="color:var(--poke-yellow)">${(walletStats.totalAvailable + walletStats.totalEscrow).toFixed(2)} PC</b>
                </div>
                <div class="mgmt-item">
                    <span>Garantie de séquestre (Fonds gelés) :</span>
                    <b style="color:#3b82f6">${(walletStats.totalEscrow || 0).toFixed(2)} PC</b>
                </div>
            `;
        }

    } catch (e) {
        console.error("Erreur Audit Admin :", e);
    }
}