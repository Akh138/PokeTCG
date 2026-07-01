// --- LOGIQUE DE RÉCUPÉRATION DES NEWS ---

// 1. Je définis l'adresse de mon microservice (port 8086)
const SOCIAL_API_URL = "http://localhost:8086/api/social/news";

// 2. Ma fonction pour aller chercher les données
async function chargerNews() {
    try {
        // J'appelle le service Java (Fetch)
        const reponse = await fetch(SOCIAL_API_URL);

        // Je transforme la réponse en liste d'objets JSON
        const newsListe = await reponse.json();

        // Je récupère l'endroit dans mon HTML où je veux afficher les news
        const container = document.getElementById("news-list");

        // Je vide le message "Chargement..."
        container.innerHTML = "";

        // 3. Pour chaque news reçue de MongoDB, je crée une carte HTML
        newsListe.forEach(news => {
            // MA MODIFICATION : J'ajoute un lien "Lire l'article" sous le titre
            // Si news.articleUrl existe dans ma base, le bouton s'affichera
            const card = `
                <div class="news-card">
                    <img src="${news.imageUrl}" alt="news">
                    <div class="news-info">
                        <p>${news.titre}</p>
                        <a href="${news.articleUrl}" target="_blank" class="news-link">
                            Lire l'article complet <i class="fas fa-external-link-alt"></i>
                        </a>
                    </div>
                </div>
            `;
            // J'ajoute la carte dans mon tableau
            container.innerHTML += card;
        });

    } catch (error) {
        console.error("Erreur lors du chargement des news :", error);
        document.getElementById("news-list").innerHTML = "<p>Erreur de connexion au service social.</p>";
    }
}

// 4. Je lance le chargement dès que la page est prête
document.addEventListener("DOMContentLoaded", chargerNews);