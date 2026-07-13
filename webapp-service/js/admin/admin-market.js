// --- MODULE : MODÉRATION DU MARCHÉ (Marketplace 8085) ---

const API_ADMIN_MARKET = "http://localhost:8085/api/marketplace";

//  Fonction pour lister absolument toutes les annonces avec Vendeur et Acheteur
async function loadMarketModeration() {
    const container = document.getElementById("admin-market-list");
    if(!container) return;

    container.innerHTML = "<p style='text-align:center;'>Analyse du marché en cours...</p>";

    try {
        const reponse = await fetch(`${API_ADMIN_MARKET}/admin/all`);
        const annonces = await reponse.json();

        if(annonces.length === 0) {
            container.innerHTML = "<p class='small-text'>Aucune annonce sur le marché.</p>";
            return;
        }

        //  J'ajoute la colonne "Acheteur" dans l'en-tête
        let tableHtml = `
            <table>
                <thead>
                    <tr>
                        <th>Carte ID</th>
                        <th>Vendeur</th>
                        <th>Acheteur</th>
                        <th>Prix</th>
                        <th>Statut</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>`;

        for (const ad of annonces) {
            // 1. On récupère le pseudo du VENDEUR
            const resSeller = await fetch(`http://localhost:8081/api/auth/id/${ad.idVendeur}`);
            const seller = await resSeller.json();

            // 2. On récupère le pseudo de l'ACHETEUR (si la carte est vendue ou en transit)
            let buyerName = "<i style='color:var(--text-muted)'>Aucun</i>";

            if (ad.idAcheteur) {
                try {
                    const resBuyer = await fetch(`http://localhost:8081/api/auth/id/${ad.idAcheteur}`);
                    const buyer = await resBuyer.json();
                    buyerName = `<span style="color:var(--poke-yellow)">${buyer.username}</span>`;
                } catch (err) {
                    buyerName = "Inconnu";
                }
            }

            // Couleur du statut
            let statusColor = "status-available";
            if(ad.statut === 'EN_TRANSIT' || ad.statut === 'EXPEDIEE') statusColor = "status-transit";
            if(ad.statut === 'VENDUE') statusColor = "";

            tableHtml += `
                <tr>
                    <td><b>${ad.idCarteApi}</b></td>
                    <td>${seller.username}</td>
                    <td>${buyerName}</td>
                    <td><b style="color:var(--poke-yellow)">${ad.prix} PC</b></td>
                    <td><span class="status-tag ${statusColor}">${ad.statut}</span></td>
                    <td>
                        <button class="btn-ban" onclick="adminDeleteAd(${ad.id})">
                            <i class="fas fa-trash"></i> Supprimer
                        </button>
                    </td>
                </tr>`;
        }

        tableHtml += `</tbody></table>`;
        container.innerHTML = tableHtml;

    } catch (e) {
        console.error("Erreur Market Admin :", e);
        container.innerHTML = "<p style='color:red;'>Erreur microservice Marketplace (8085).</p>";
    }
}

//  Supprimer une annonce (Modération)
async function adminDeleteAd(idAnnonce) {
    if(!confirm("Rigueur Habib : Voulez-vous supprimer cette annonce ?")) return;

    try {
        const res = await fetch(`${API_ADMIN_MARKET}/delete/${idAnnonce}`, {
            method: "DELETE"
        });

        if(res.ok) {
            alert("Annonce supprimée.");
            loadMarketModeration();
        }
    } catch (e) { alert("Erreur serveur."); }
}