// --- LOGIQUE DE CONNEXION (IDENTITY-SERVICE) ---

// 1. Je définis les adresses de mon service d'identité (Port 8081)
const LOGIN_API_URL = "http://localhost:8081/api/auth/login";
const PROFILE_API_URL = "http://localhost:8081/api/auth/user"; // ⭐ HABIB : Nouvelle adresse pour le profil

document.addEventListener("DOMContentLoaded", () => {

    const loginBtn = document.getElementById("login-btn");

    loginBtn.addEventListener("click", async () => {

        const usernameVal = document.getElementById("username").value;
        const passwordVal = document.getElementById("password").value;

        if(!usernameVal || !passwordVal) {
            alert("Merci de remplir tous les champs !");
            return;
        }

        try {
            // 2. J'envoie les identifiants pour récupérer le Token
            const reponse = await fetch(LOGIN_API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: usernameVal,
                    password: passwordVal
                })
            });

            if (reponse.ok) {
                const token = await reponse.text();
                localStorage.setItem("user_token", token);

                //  - Je récupère le VRAI profil avant de rediriger
                // On a besoin de savoir si l'utilisateur est ROLE_USER ou ROLE_ADMIN
                const resProfile = await fetch(`${PROFILE_API_URL}/${usernameVal}`, {
                    method: "GET",
                    headers: { "Authorization": "Bearer " + token }
                });

                if (resProfile.ok) {
                    const fullUserData = await resProfile.json();

                    // On enregistre les vraies données (avec l'ID et le ROLE)
                    localStorage.setItem("user_data", JSON.stringify(fullUserData));

                    alert("Connexion réussie ! Bienvenue Maître " + fullUserData.username);

                    // LOGIQUE D'AIGUILLAGE
                    if (fullUserData.role === 'ROLE_ADMIN') {
                        console.log("Direction : Console d'Administration");
                        window.location.href = "dashboardadmin.html";
                    } else {
                        console.log("Direction : Dashboard Dresseur");
                        window.location.href = "dashboarddresseur.html";
                    }

                } else {
                    alert("Erreur lors de la récupération du profil.");
                }

            } else {
                alert("Identifiants incorrects. Réessaie !");
            }

        } catch (error) {
            console.error("Erreur technique :", error);
            alert("Impossible de joindre le service d'identité.");
        }
    });
});