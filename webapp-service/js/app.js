// --- LOGIQUE DE RÉCUPÉRATION DES NEWS ---

// 1. Je définis l'adresse de mon microservice Social pour interroger MongoDB
const SOCIAL_API_URL = "http://localhost:8086/api/social/news";

// 2. Ma fonction asynchrone pour aller chercher les actualités
async function chargerNews() {
    try {
        // J'appelle le service Java via Fetch et j'attends la réponse
        const reponse = await fetch(SOCIAL_API_URL);

        // Je transforme la réponse brute en une liste d'objets JSON exploitables
        const newsListe = await reponse.json();

        // Je cible la zone de ma page d'accueil où les news doivent apparaître
        const container = document.getElementById("news-list");
        if (!container) return;// je m'arrête si l'élément n'est pas sur la page

        // Je vide le message d'attente "Chargement..." pour laisser place aux vraies données
        container.innerHTML = "";

        // 3. Je parcours la liste des news reçues de MongoDB pour créer le visuel
        newsListe.forEach(news => {
            // Je construis dynamiquement chaque carte d'actualité.
            // J'utilise les Template Literals pour injecter les variables (titre, image, lien).
            const card = `
                <div class="news-card">
                    <img src="${news.imageUrl}" alt="news">
                    <div class="news-info">
                        <p>${news.titre}</p>
                        <!-- Si un lien vers un article complet existe, je l'affiche dans un nouvel onglet -->
                        <a href="${news.articleUrl}" target="_blank" class="news-link">
                            Lire l'article complet <i class="fas fa-external-link-alt"></i>
                        </a>
                    </div>
                </div>
            `;
            // J'injecte la carte finale dans le conteneur HTML
            container.innerHTML += card;
        });

    } catch (error) {
        console.error("Erreur lors du chargement des news :", error);

        // J'affiche un message dans la zone dédiée ET j'ouvre ma modale personnalisée
        const container = document.getElementById("news-list");
        if (container) container.innerHTML = "<p style='text-align:center; padding:20px;'>Actualités indisponibles.</p>";

        await pokeAlert("MAINTENANCE", "Le flux d'actualités est momentanément interrompu.");
    }
}

// 4. Je déclenche le chargement automatiquement dès que la page d'accueil est prête
document.addEventListener("DOMContentLoaded", chargerNews);