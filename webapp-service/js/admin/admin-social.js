// --- MODULE : COMMUNICATION & MODÉRATION (Social 8086) ---

const API_ADMIN_SOCIAL = "http://localhost:8086/api/social";

// Fonction globale pour charger Forum ET News
async function loadSocialManagement() {
    loadForumMessages();
    loadAdminNews(); // J'appelle aussi le chargement des news
}

// 1. GESTION DU FORUM
async function loadForumMessages() {
    const forumContainer = document.getElementById("admin-forum-list");
    if(!forumContainer) return;
    try {
        const reponse = await fetch(`${API_ADMIN_SOCIAL}/forum`);
        const messages = await reponse.json();
        if(messages.length === 0) {
            forumContainer.innerHTML = "<p class='small-text'>Aucun message sur le forum.</p>";
            return;
        }
        messages.sort((a, b) => new Date(b.dateEnvoi) - new Date(a.dateEnvoi));
        forumContainer.innerHTML = "";
        messages.forEach(msg => {
            const date = new Date(msg.dateEnvoi).toLocaleString('fr-FR');
            forumContainer.innerHTML += `
                <div class="mgmt-item" style="flex-direction:column; align-items:flex-start; gap:5px; padding:15px; margin-bottom:10px;">
                    <div style="display:flex; justify-content:space-between; width:100%;">
                        <b style="color:var(--poke-yellow)">${msg.pseudoAuteur}</b>
                        <span style="font-size:0.7rem; color:var(--text-muted)">${date}</span>
                    </div>
                    <i style="color:white; font-size:0.85rem;">Sujet : ${msg.sujet}</i>
                    <p style="font-size:0.8rem; color:rgba(255,255,255,0.7); margin:5px 0;">${msg.message}</p>
                    <button class="btn-3d btn-red" style="width: 130px; height: 32px;" onclick="adminDeleteForumMsg('${msg.id}')">
                       <div class="button-outer">
                         <div class="button-inner">
                            <span style="font-size: 0.7rem; letter-spacing: 2px; padding-bottom: 3px;">SUPPRIMER</span>
                         </div>
                       </div>
                   </button>
                </div>`;
        });
    } catch (e) { forumContainer.innerHTML = "<p style='color:red;'>Erreur Forum.</p>"; }
}

// 2. GESTION DES NEWS (Pour voir celle de Postman et les autres)
async function loadAdminNews() {
    const newsContainer = document.getElementById("admin-news-list");
    if(!newsContainer) return;

    try {
        const reponse = await fetch(`${API_ADMIN_SOCIAL}/news`);
        const news = await reponse.json();

        if(news.length === 0) {
            newsContainer.innerHTML = "<p class='small-text'>Aucune news publiée.</p>";
            return;
        }

        news.sort((a, b) => new Date(b.datePublication) - new Date(a.datePublication));

        newsContainer.innerHTML = "";
        news.forEach(n => {
            newsContainer.innerHTML += `
                <div class="mgmt-item" style="padding: 12px 15px; margin-bottom: 8px; background: rgba(0,0,0,0.2);">
                    <div class="mgmt-item-info" style="max-width: 80%;">
                        <b style="font-size: 0.8rem; color: white; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                            ${n.titre}
                        </b>
                    </div>
                    <button class="btn-3d btn-red" style="width: 50px; height: 40px;" onclick="adminDeleteNews('${n.id}')">
                       <div class="button-outer">
                         <div class="button-inner">
                           <span><i class="fas fa-trash-alt"></i></span>
                        </div>
                      </div>
                    </button>
                </div>`;
        });
    } catch (e) { newsContainer.innerHTML = "<p style='color:red;'>Erreur News.</p>"; }
}

// Fonction pour publier une news avec Image et Lien (Comme sur Postman)
async function adminPublishNews() {
    const titleVal = document.getElementById("news-title").value;
    const contentVal = document.getElementById("news-content").value;
    const imageVal = document.getElementById("news-image").value;
    const linkVal = document.getElementById("news-link").value;

    // Rigueur : Le titre est le minimum syndical
    if(!titleVal) {
        alert("Rigueur : Il faut au moins un titre pour la news !");
        return;
    }

    // On prépare l'objet JSON exactement comme celui de ton Postman
    const newsData = {
        titre: titleVal,
        contenu: contentVal,
        imageUrl: imageVal,
        articleUrl: linkVal
    };

    try {
        const res = await fetch(`${API_ADMIN_SOCIAL}/news`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newsData)
        });

        if(res.ok) {
            alert("News diffusée avec succès sur le site !");
            // On vide tous les champs
            document.getElementById("news-title").value = "";
            document.getElementById("news-content").value = "";
            document.getElementById("news-image").value = "";
            document.getElementById("news-link").value = "";

            loadAdminNews(); // On rafraîchit la liste en bas
        } else {
            alert("Erreur microservice : Impossible de publier.");
        }
    } catch (e) {
        console.error(e);
        alert("Microservice Social injoignable.");
    }
}

// Supprimer une news
async function adminDeleteNews(idNews) {
    if(!confirm("Supprimer cette actualité ?")) return;
    try {
        const res = await fetch(`${API_ADMIN_SOCIAL}/news/${idNews}`, { method: "DELETE" });
        if(res.ok) { loadAdminNews(); }
    } catch (e) { alert("Erreur."); }
}

// GESTION FORUM (DÉJÀ FAIT)
async function adminDeleteForumMsg(idMsg) {
    if(!confirm("Supprimer ce message ?")) return;
    try {
        const res = await fetch(`${API_ADMIN_SOCIAL}/forum/${idMsg}`, { method: "DELETE" });
        if(res.ok) { loadForumMessages(); }
    } catch (e) { alert("Erreur."); }
}