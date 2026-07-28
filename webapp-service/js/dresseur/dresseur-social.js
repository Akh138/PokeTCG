// =============================================================
// MODULE : SOCIAL ET COMMUNAUTÉ (SOCIAL & IDENTITY SERVICE)
// =============================================================

// 1. CHARGEMENT DES MESSAGES DU FORUM (MONGODB)
async function chargerMessagesForum() {
    const feed = document.getElementById("forum-feed");
    if(!feed) return;

    const userData = JSON.parse(localStorage.getItem("user_data"));
    if(!userData) return;

    try {
        const reponse = await fetch(API_SOCIAL);
        const messages = await reponse.json();

        if (messages.length === 0) {
            feed.innerHTML = "<p style='color:var(--text-muted); padding:50px;'>Aucun message pour le moment.</p>";
            return;
        }

        // Tri par date (plus récent en haut)
        messages.sort((a, b) => new Date(b.dateEnvoi) - new Date(a.dateEnvoi));
        feed.innerHTML = "";

        messages.forEach(msg => {
            const date = new Date(msg.dateEnvoi).toLocaleString('fr-FR');
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

// 2. PUBLICATION SUR LE FORUM
async function publierSurForum() {
    const sujet = document.getElementById("forum-sujet").value.trim();
    const message = document.getElementById("forum-message").value.trim();
    const userData = JSON.parse(localStorage.getItem("user_data"));

    if (!sujet || !message) {
        await pokeAlert("CHAMPS VIDES", "Merci de donner un sujet et un contenu à votre message !");
        return;
    }

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
        } else {
            await pokeAlert("ERREUR", "Impossible de publier pour le moment.");
        }
    } catch (e) { await pokeAlert("MAINTENANCE", "Le microservice Social ne répond pas."); }
}

async function likerUnMessage(id) {
    try {
        const res = await fetch(`${API_SOCIAL}/like/${id}`, { method: "PUT" });
        if (res.ok) chargerMessagesForum();
    } catch (e) { console.error(e); }
}

async function supprimerMessageForum(idMessage) {
    const conf = await pokeConfirm("MODÉRATION", "Voulez-vous vraiment supprimer ce message ?");
    if (!conf) return;

    try {
        const res = await fetch(`${API_SOCIAL}/${idMessage}`, {
            method: "DELETE"
        });

        if (res.ok) {
            await pokeAlert("SUPPRIMÉ", "Le message a été effacé du forum.");
            chargerMessagesForum();
        }
    } catch (e) { await pokeAlert("ERREUR", "Impossible de supprimer le message."); }
}

// 3. DROIT À L'OUBLI (SUPPRESSION TOTALE RGPD)
async function supprimerMonCompte() {
    const userData = JSON.parse(localStorage.getItem("user_data"));

    // La grande alerte de sécurité
    const confirmation = await pokeConfirm(
        "DANGER - SUPPRESSION",
        "ATTENTION RIGUEUR HABIB : Cette action effacera définitivement votre compte, votre argent et toutes vos cartes. Continuer ?"
    );

    if (!confirmation) return;

    try {
        const reponse = await fetch(`${API_IDENTITY}/delete/${userData.id}`, {
            method: "DELETE",
            headers: { "Authorization": "Bearer " + localStorage.getItem("user_token") }
        });

        if (reponse.ok) {
            await pokeAlert("ADIEU DRESSEUR", "Votre compte et toutes vos données ont été effacés avec succès.");
            logout();
        } else {
            await pokeAlert("ERREUR TECHNIQUE", "Une erreur est survenue lors de la suppression de vos données.");
        }
    } catch (e) {
        console.error("Crash suppression compte :", e);
        await pokeAlert("MAINTENANCE", "Le microservice Identity est injoignable.");
    }
}