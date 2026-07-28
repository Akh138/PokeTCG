// --- SYSTÈME DE NOTIFICATIONS ÉLITE PokeTCG ---

// 1. L'ALERTE SIMPLE
window.pokeAlert = function(titre, message) {
    return new Promise((resolve) => {
        const modal = document.getElementById("poke-modal-container");
        document.getElementById("poke-modal-title").innerText = titre;
        document.getElementById("poke-modal-message").innerText = message;

        document.getElementById("poke-modal-cancel").style.display = "none";
        document.getElementById("poke-modal-ok-text").innerText = "OK";

        modal.style.display = "flex";

        // ⭐ RIGUEUR : On ne résout la promesse QUE quand on clique sur OK
        document.getElementById("poke-modal-ok").onclick = () => {
            modal.style.display = "none";
            resolve(); // Le code peut enfin continuer
        };
    });
};

// 2. LA CONFIRMATION (Promesse)
window.pokeConfirm = function(titre, message) {
    return new Promise((resolve) => {
        const modal = document.getElementById("poke-modal-container");
        document.getElementById("poke-modal-title").innerText = titre;
        document.getElementById("poke-modal-message").innerText = message;

        document.getElementById("poke-modal-cancel").style.display = "block";
        document.getElementById("poke-modal-ok-text").innerText = "CONFIRMER";

        modal.style.display = "flex";

        document.getElementById("poke-modal-ok").onclick = () => {
            modal.style.display = "none";
            resolve(true);
        };

        document.getElementById("poke-modal-cancel").onclick = () => {
            modal.style.display = "none";
            resolve(false);
        };
    });
};