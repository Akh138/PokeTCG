// --- LOGIQUE D'INSCRIPTION (IDENTITY-SERVICE) ---

const REGISTER_API_URL = "http://localhost:8081/api/auth/register";

document.addEventListener("DOMContentLoaded", () => {
    const regBtn = document.getElementById("register-btn");

    regBtn.addEventListener("click", async () => {
        // Je récupère TOUTES les infos du formulaire
        const userData = {
            username: document.getElementById("reg-username").value,
            email: document.getElementById("reg-email").value,
            password: document.getElementById("reg-password").value,
            address: document.getElementById("reg-address").value,
            zipCode: document.getElementById("reg-zip").value,
            role: "USER" // Je force le rôle de base
        };
        // Rigueur : Vérification rapide avant d'envoyer
        if(!userData.username || !userData.email || !userData.password) {
            await pokeAlert("CHAMPS VIDES", "Merci de remplir les informations obligatoires !");
            return;
        }

        try {
            // J'envoie le gros paquet de données en JSON
            const reponse = await fetch(REGISTER_API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(userData)
            });

            if (reponse.ok) {
                //  On attend le clic sur OK avant de rediriger
                await pokeAlert("BIENVENUE", "Inscription réussie ! Bienvenue dans l'aventure. Connecte-toi maintenant.");
                window.location.href = "login.html";
            } else {
                // En cas de doublon (email déjà pris) ou erreur backend
                await pokeAlert("ÉCHEC", "Erreur lors de l'inscription. L'email ou le pseudo est peut-être déjà utilisé.");
            }

        } catch (error) {
            console.error("Erreur technique :", error);
            await pokeAlert("MAINTENANCE", "Le service d'identité est indisponible pour le moment.");
        }
    });
});