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

        try {
            // J'envoie le gros paquet de données en JSON
            const reponse = await fetch(REGISTER_API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(userData)
            });

            if (reponse.ok) {
                alert("Inscription réussie ! Bienvenue dans l'aventure. Connecte-toi maintenant.");
                window.location.href = "login.html";
            } else {
                // Je récupère le message d'erreur du backend (ex: email invalide)
                const errorData = await reponse.json();
                alert("Erreur lors de l'inscription. Vérifie tes informations.");
            }

        } catch (error) {
            console.error("Erreur technique :", error);
            alert("Le service d'identité est indisponible.");
        }
    });
});