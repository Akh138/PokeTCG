// --- MODULE : GESTION DES DRESSEURS (Identity 8081) ---

const API_ADMIN_IDENTITY = "http://localhost:8081/api/auth";

// ⭐ HABIB : Fonction pour charger tous les dresseurs dans le tableau ⭐
async function loadAllUsers() {
    const tableBody = document.getElementById("users-list-body");
    if(!tableBody) return;

    tableBody.innerHTML = "<tr><td colspan='5' style='text-align:center;'>Chargement de la base...</td></tr>";

    try {
        const reponse = await fetch(`${API_ADMIN_IDENTITY}/all`);
        const dresseurs = await reponse.json();

        tableBody.innerHTML = ""; // On vide pour remplir

        dresseurs.forEach(user => {
            // On détermine la couleur du badge de rôle
            const roleClass = user.role === 'ROLE_ADMIN' ? 'status-available' : 'status-transit';

            tableBody.innerHTML += `
                <tr>
                    <td><b>#${user.id}</b></td>
                    <td>${user.username}</td>
                    <td>${user.email}</td>
                    <td><span class="status-tag ${roleClass}">${user.role}</span></td>
                    <td>
                        <!-- Habib : On ne permet pas de se supprimer soi-même ! -->
                        ${user.role !== 'ROLE_ADMIN' ? `
                            <button class="btn-ban" onclick="deleteTrainer(${user.id}, '${user.username}')">
                                <i class="fas fa-user-slash"></i> Bannir
                            </button>
                        ` : '<i style="color:var(--text-muted)">Protégé</i>'}
                    </td>
                </tr>`;
        });

    } catch (e) {
        console.error("Erreur Identity Admin :", e);
        tableBody.innerHTML = "<tr><td colspan='5' style='color:red;'>Erreur microservice Identity (8081).</td></tr>";
    }
}

// ⭐ HABIB : Fonction pour bannir (supprimer) un dresseur ⭐
async function deleteTrainer(id, pseudo) {
    if(!confirm(`Rigueur Habib : Voulez-vous vraiment bannir définitivement ${pseudo} ?\nTous ses Poké-Crédits et ses cartes seront effacés.`)) return;

    try {
        const res = await fetch(`${API_ADMIN_IDENTITY}/delete/${id}`, {
            method: "DELETE"
        });

        if(res.ok) {
            alert(`Dresseur ${pseudo} supprimé de la Ligue.`);
            loadAllUsers(); // On rafraîchit la liste
        } else {
            alert("Erreur lors de la suppression.");
        }
    } catch (e) { alert("Microservice Identity injoignable."); }
}