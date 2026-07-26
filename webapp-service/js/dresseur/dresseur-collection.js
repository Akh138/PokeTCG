// =============================================================
// MODULE : MA COLLECTION ET INVENTAIRE (INVENTORY SERVICE)
// =============================================================

// 1. AFFICHAGE DES LOGOS DES SÉRIES POSSÉDÉES
async function afficherMaCollection() {
    const grid = document.getElementById("collection-grid");
    if (!grid) return;
    grid.innerHTML = `<p style="text-align:center;">Chargement de votre collection...</p>`;

    // Sécurité si les extensions ne sont pas encore chargées (Provient du Pokedex)
    if (toutesLesExtensions.length === 0) {
        await chargerExtensionsMondiales();
    }

    // Filtrage : On ne garde que les extensions présentes dans mon inventaire MySQL
    const mesSetsNoms = [...new Set(monInventaire.map(c => c.extension))];
    const mesExtensions = toutesLesExtensions.filter(ext => mesSetsNoms.includes(ext.name));

    if (mesExtensions.length === 0) {
        grid.innerHTML = `<p style="text-align:center; padding:50px;">Votre collection est vide. Allez dans le Pokedex Mondial !</p>`;
        return;
    }

    grid.innerHTML = "";
    mesExtensions.forEach(ext => {
        // RIGUEUR HABIB : Sécurité format d'image
        const logoCollection = (ext.images && ext.images.logo) ? ext.images.logo : ext.logoUrl;

        const mesCartes = monInventaire.filter(c => c.extension === ext.name);
        const uniqueIds = [...new Set(mesCartes.map(c => c.idCarteApi))];
        const nbPossedes = uniqueIds.length;
        const pourcent = Math.round((nbPossedes / ext.total) * 100);

        grid.innerHTML += `
            <div class="extension-card glass" onclick="ouvrirClasseurSet('${ext.id}')">
                <img src="${logoCollection}" alt="${ext.name}">
                <div class="ext-info">
                    <h3>${ext.name}</h3>
                    <div class="ext-progress">
                        <div class="ext-progress-info">
                            <span>Collection</span>
                            <span>${nbPossedes} / ${ext.total}</span>
                        </div>
                        <div class="ext-progress-bg">
                            <div class="ext-progress-fill ${pourcent === 100 ? 'completed' : ''}" 
                                 style="width: ${pourcent}%">
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
    });
}

// 2. OUVERTURE DU CLASSEUR DÉTAILLÉ (STYLE BINDER)
async function ouvrirClasseurSet(setId) {
    const grid = document.getElementById("collection-grid");
    const ext = toutesLesExtensions.find(e => e.id === setId);
    grid.innerHTML = `<p style="text-align:center;">Ouverture du classeur ${ext.name}...</p>`;

    try {
        const reponse = await fetch(`${API_CATALOG}/set/${setId}`);
        const toutesLesCartesMondiales = await reponse.json();

        // Tri par numéro de carte (Grâce au champ .number ajouté au Backend)
        toutesLesCartesMondiales.sort((a, b) => parseInt(a.number) - parseInt(b.number));

        grid.innerHTML = `
            <div class="grid-header">
                <button class="filter-btn back-btn" onclick="afficherMaCollection()">Retour</button>
                <h2>${ext.name}</h2>
            </div>
            <div class="binder-grid" id="binder-view"></div>
        `;

        const binderView = document.getElementById("binder-view");

        toutesLesCartesMondiales.forEach(carteMondiale => {
            const possession = monInventaire.find(c => c.idCarteApi === carteMondiale.id && c.statut === 'POSSEDEE');
            const imageCarte = (carteMondiale.images && carteMondiale.images.large) ? carteMondiale.images.large : carteMondiale.imageUrl;
            const numeroCarte = carteMondiale.number || "N/A";

            if (possession) {
                const estEnVente = mesAnnonces.some(a => a.idCarteApi === carteMondiale.id && a.statut === 'DISPONIBLE');
                let classEtat = "cond-neuf";
                if(possession.etatCarte === "Excellent") classEtat = "cond-excellent";
                if(possession.etatCarte === "Usé") classEtat = "cond-use";

                const date = new Date(possession.dateAcquisition).toLocaleDateString('fr-FR');
                const nomSecurise = (carteMondiale.name || carteMondiale.nomFr).replace(/'/g, "\\'");

                binderView.innerHTML += `
                    <div class="pokemon-card glass">
                        <div class="card-img-container">
                            <div class="condition-badge ${classEtat}">${possession.etatCarte}</div>
                            <div class="btn-zoom-overlay" onclick="ouvrirZoom('${imageCarte}', event)"><i class="fas fa-search-plus"></i></div>
                            <img src="${imageCarte}" alt="pokemon">
                        </div>
                        <div class="card-details">
                            <h3>${carteMondiale.name || carteMondiale.nomFr}</h3>
                            <!-- BOUTON 3D VENDRE -->
                            ${estEnVente ?
                    `<div class="status-badge-sale"><i class="fas fa-tag"></i> En vente</div>` :
                    `<button class="btn-3d btn-yellow" style="width: 100%; margin-top: 10px;" onclick="preparerVente('${carteMondiale.id}', '${nomSecurise}')">
                                    <div class="button-outer"><div class="button-inner"><span><i class="fas fa-hand-holding-usd"></i> VENDRE</span></div></div>
                                 </button>`
                }
                            <div class="status-indicators">
                                <div class="box ${possession.langueCarte === 'Normal' ? 'active-normal' : ''}">N</div>
                                <div class="box ${possession.langueCarte === 'Holo' ? 'active-holo' : ''}">H</div>
                                <div class="box ${possession.langueCarte === 'Reverse' ? 'active-reverse' : ''}">R</div>
                            </div>
                            <span class="acquisition-date">Obtenue le ${date}</span>
                        </div>
                    </div>`;
            } else {
                binderView.innerHTML += `
                    <div class="pokemon-card glass not-owned">
                        <div class="card-img-container">
                            <div class="missing-badge">MANQUANTE</div>
                            <img src="../assets/cards-back.png" alt="Missing">
                        </div>
                        <div class="card-details"><h3 style="opacity:0.3;">N°${numeroCarte}</h3></div>
                    </div>`;
            }
        });
    } catch (e) { console.error("Erreur classeur :", e); }
}

// 3. LOGIQUE DE CAPTURE (AJOUT À MYSQL)
function preparerCapture(idApi, nomExt) {
    carteEnCoursDeCapture = { idApi, nomExtension: nomExt };
    document.getElementById("add-card-modal").style.display = "flex";
}

function initCaptureLogic() {
    const btns = document.querySelectorAll(".ver-btn");
    btns.forEach(btn => {
        btn.addEventListener("click", () => {
            btns.forEach(b => b.classList.remove("selected"));
            btn.classList.add("selected");
            versionSelectionnee = btn.getAttribute("data-ver");
        });
    });

    document.getElementById("confirm-add").onclick = async () => {
        const userData = JSON.parse(localStorage.getItem("user_data"));
        const condition = document.getElementById("select-condition").value;

        const body = {
            idDresseur: userData.id,
            idCarteApi: carteEnCoursDeCapture.idApi,
            extension: carteEnCoursDeCapture.nomExtension,
            etatCarte: condition,
            langueCarte: versionSelectionnee,
            statut: "POSSEDEE"
        };

        try {
            const res = await fetch(`${API_INVENTORY}/add`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                alert("Carte ajoutée avec succès !");
                document.getElementById("add-card-modal").style.display = "none";
                location.reload();
            }
        } catch (e) { alert("Erreur serveur."); }
    };
}

// 4. SYNCHRONISATION MYSQL ET CALCUL DES STATS (XP)
async function chargerInventairePrivé(idDresseur) {
    try {
        const reponse = await fetch(`${API_INVENTORY}/pokedex/${idDresseur}`);
        if (reponse.ok) {
            monInventaire = await reponse.json();
        }
    } catch (e) { console.error(e); }
}

async function mettreAJourStatsAccueil() {
    const cardsCountElem = document.getElementById("total-cards-count");
    const totalValueElem = document.getElementById("total-collection-value");
    const levelElem = document.getElementById("trainer-level");
    const xpBar = document.getElementById("xp-fill-bar");
    const xpText = document.getElementById("xp-text");

    if (!cardsCountElem) return;

    const nbCartes = monInventaire.length;
    cardsCountElem.innerText = nbCartes + " Cartes";

    // MOTEUR DE CALCUL XP PAR RARETÉ (Argument Master Examen)
    let totalXP = 0;
    monInventaire.forEach(card => {
        if (card.langueCarte === "Holo") totalXP += 3;
        else if (card.langueCarte === "Reverse") totalXP += 5;
        else totalXP += 1;
    });

    const xpParNiveau = 100;
    const niveau = Math.floor(totalXP / xpParNiveau) + 1;
    const xpRestant = totalXP % xpParNiveau;
    const pourcentageXP = (xpRestant / xpParNiveau) * 100;

    levelElem.innerText = niveau;
    if (xpBar) xpBar.style.width = pourcentageXP + "%";
    if (xpText) xpText.innerText = `${xpRestant} / ${xpParNiveau} XP`;

    // Simulation de valeur financière
    let valeurTotale = nbCartes * 12.50;
    totalValueElem.innerText = valeurTotale.toFixed(2) + " PC";
}