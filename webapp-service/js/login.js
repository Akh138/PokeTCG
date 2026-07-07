// --- LOGIQUE DE CONNEXION (IDENTITY-SERVICE) ---

// 1. Je définis l'adresse de mon service d'identité (Port 8081)
const LOGIN_API_URL = "http://localhost:8081/api/auth/login";

document.addEventListener("DOMContentLoaded", () => {

    const loginBtn = document.getElementById("login-btn");

    // 2. J'écoute le clic sur le bouton "VALIDER" de la Pokéball
    loginBtn.addEventListener("click", async () => {

        const usernameVal = document.getElementById("username").value;
        const passwordVal = document.getElementById("password").value;

        if(!usernameVal || !passwordVal) {
            alert("Merci de remplir tous les champs !");
            return;
        }

        try {
            // 3. J'envoie les identifiants au microservice Java
            const reponse = await fetch(LOGIN_API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: usernameVal,
                    password: passwordVal
                })
            });

            if (reponse.ok) {
                // 4. SI RÉUSSITE : Je récupère le Token (Badge de sécurité)
                const token = await reponse.text();

                // --- RÉGLAGE DE SYNCHRONISATION ---
                // J'enregistre le token sous le nom 'user_token' pour que le Dashboard le reconnaisse
                localStorage.setItem("user_token", token);

                // Je crée un petit dossier 'user_data' avec le pseudo pour le Dashboard
                // Note : Pour l'instant on n'a que le pseudo, on récupérera l'email/adresse après
                const userData = {
                    pseudo: usernameVal,
                    email: "Chargement...",
                    adresse: "Chargement..."
                };
                localStorage.setItem("user_data", JSON.stringify(userData));

                alert("Connexion réussie ! Bienvenue " + usernameVal);

                // --- RÉGLAGE DE REDIRECTION ---
                // Je redirige vers le Dashboard et non plus vers l'accueil
                // Comme nous sommes déjà dans le dossier /pages, pas besoin de mettre '../'
                window.location.href = "dashboarddresseur.html";

            } else {
                alert("Identifiants incorrects. Réessaie !");
            }

        } catch (error) {
            console.error("Erreur technique :", error);
            alert("Impossible de joindre le service d'identité.");
        }
    });
});