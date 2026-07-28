document.addEventListener("DOMContentLoaded", () => {
    const container = document.querySelector(".pokeball-container");
    if (!container) return;

    // --- 1. GÉNÉRATEUR D'ÉCLAIRS ÉLECTRIQUES ---
    const lightningInterval = setInterval(() => {
        spawnRealLightning(container);
    }, 100); // Un éclair toutes les 100ms pour l'effet de tension

    // --- 2. DÉCLENCHEMENT DE L'OUVERTURE ---
    setTimeout(() => {
        clearInterval(lightningInterval);
        spawnMassiveSmoke(container);
    }, 2500); // Se synchronise avec tes 2.5s de CSS
});

// Algorithme pour dessiner un éclair brisé
function spawnRealLightning(parent) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "lightning-svg");

    const path = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    path.setAttribute("class", "lightning-path");

    // On définit un point de départ et d'arrivée aléatoire autour de la Pokéball
    let x = Math.random() * 400 + 300; // Zone centrale
    let y = Math.random() * 400 + 100;
    let points = `${x},${y}`;

    // On crée 5 segments brisés pour l'effet "réel"
    for (let i = 0; i < 6; i++) {
        x += (Math.random() - 0.5) * 150;
        y += (Math.random() - 0.5) * 150;
        points += ` ${x},${y}`;
    }

    path.setAttribute("points", points);
    svg.appendChild(path);
    parent.appendChild(svg);

    // On supprime l'éclair très vite pour le clignotement
    setTimeout(() => svg.remove(), 60);
}

// Algorithme pour l'explosion de fumée volumineuse
function spawnMassiveSmoke(parent) {
    // On crée 80 particules pour un effet de nuage dense
    for (let i = 0; i < 80; i++) {
        const p = document.createElement("div");
        p.setAttribute("class", "smoke-particle");

        // Taille aléatoire des nuages
        const size = Math.random() * 80 + 40;
        p.style.width = size + "px";
        p.style.height = size + "px";

        p.style.top = "50%";
        p.style.left = "50%";

        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * 350 + 100; // Se déploie loin autour de la balle
        const tx = Math.cos(angle) * dist;
        const ty = Math.sin(angle) * dist;

        parent.appendChild(p);

        p.animate([
            { transform: "translate(-50%, -50%) scale(0.5)", opacity: 0.8 },
            { transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(3)`, opacity: 0 }
        ], {
            duration: Math.random() * 1000 + 1000, // Durée variable pour le réalisme
            easing: "ease-out"
        }).onfinish = () => p.remove();
    }
}