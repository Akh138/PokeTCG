// --- LOGIQUE DE CONNEXION (IDENTITY-SERVICE) ---

// 1. Je définis l'adresse de mon service d'identité (Port 8081)
const LOGIN_API_URL = "http://localhost:8081/api/auth/login";

// 2. J'attends que la page soit bien chargée
document.addEventListener("DOMContentLoaded", () => {

    const loginBtn = document.getElementById("login-btn");

    // 3. J'écoute le clic sur le bouton "VALIDER" de la Pokéball
    loginBtn.addEventListener("click", async () => {

        // Je récupère ce que le dresseur a tapé
        const usernameVal = document.getElementById("username").value;
        const passwordVal = document.getElementById("password").value;

        // Petite vérification avant d'appeler le serveur
        if(!usernameVal || !passwordVal) {
            alert("Merci de remplir tous les champs !");
            return;
        }

        try {
            // 4. J'envoie les données au microservice Java (Fetch POST)
            const reponse = await fetch(LOGIN_API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    username: usernameVal,
                    password: passwordVal
                })
            });

            if (reponse.ok) {
                // 5. SI ÇA MARCHE : Je reçois mon badge JWT
                const token = await reponse.text();

                // Je stocke le badge dans le navigateur (LocalStorage)
                // Comme ça, je resterai connecté sur toutes les pages !
                localStorage.setItem("pokeToken", token);
                localStorage.setItem("username", usernameVal);

                alert("Connexion réussie ! Bienvenue " + usernameVal);

                // 6. Je redirige vers l'accueil (ou le futur dashboard)
                window.location.href = "../index.html";
            } else {
                alert("Identifiants incorrects. Réessaie !");
            }

        } catch (error) {
            console.error("Erreur technique :", error);
            alert("Impossible de joindre le service d'identité.");
        }
    });
});