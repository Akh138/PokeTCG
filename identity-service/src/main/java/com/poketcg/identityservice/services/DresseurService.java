package com.poketcg.identityservice.services;

import com.poketcg.identityservice.config.JwtUtils;
import com.poketcg.identityservice.entities.Dresseur;
import com.poketcg.identityservice.proxies.InventoryProxy;
import com.poketcg.identityservice.proxies.MarketplaceProxy;
import com.poketcg.identityservice.proxies.WalletProxy; // J'importe le proxy pour parler au Wallet
import com.poketcg.identityservice.repositories.DresseurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service // C'est ici que j'écris mes règles "métier" (le cerveau)
@RequiredArgsConstructor
public class DresseurService {

    private final DresseurRepository dresseurRepository;
    // Cet outil servira à transformer les mots de passe en charabia illisible (sécurité)
    private final BCryptPasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;

    // J'ajoute le proxy pour pouvoir commander des actions au service Wallet
    private final WalletProxy walletProxy;
    // J'ajoute les deux nouveaux proxys pour l'orchestration du nettoyage RGPD
    private final InventoryProxy inventoryProxy;
    private final MarketplaceProxy marketplaceProxy;

    public Dresseur inscription(Dresseur dresseur) {
        // 1. Je crypte le mot de passe avant de l'enregistrer (BCrypt)
        dresseur.setPassword(passwordEncoder.encode(dresseur.getPassword()));

        // 2. Je donne le rôle de base "USER" par défaut
        dresseur.setRole("ROLE_USER");

        // 3. J'enregistre dans MySQL via le repository
        Dresseur nouveauDresseur = dresseurRepository.save(dresseur);

        // 4. ORCHESTRATION : Dès que le dresseur est créé, je demande au microservice Wallet
        // de lui créer automatiquement son compte bancaire avec son nouvel ID
        walletProxy.createWallet(nouveauDresseur.getId());

        return nouveauDresseur;
    }

    public String connexion(String username, String password) {
        // 1. On cherche le dresseur dans la base MySQL par son pseudo
        Dresseur dresseur = dresseurRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Dresseur inconnu !"));

        // 2. On compare le mot de passe tapé avec celui qui est crypté en base
        if (passwordEncoder.matches(password, dresseur.getPassword())) {
            // 3. Si c'est bon, on fabrique le badge JWT (valable 1h)
            return jwtUtils.generateToken(username);
        } else {
            throw new RuntimeException("Mot de passe incorrect !");
        }
    }

    // 4. MA LOGIQUE DE SUPPRESSION (Droit à l'oubli / RGPD)
    // C'est ici que je gère la suppression d'un dresseur en cascade distribuée
    public void supprimerCompte(Long id) {
        // A. Je vérifie d'abord si le dresseur existe
        if (!dresseurRepository.existsById(id)) {
            throw new RuntimeException("Erreur : Impossible de supprimer, dresseur introuvable.");
        }

        // B. ORCHESTRATION : Avant de supprimer le dresseur, je préviens les autres services
        // pour effacer ses cartes et ses annonces. Comme ça, pas de données fantômes !
        inventoryProxy.deleteAllByTrainer(id);
        marketplaceProxy.deleteAllByVendeur(id);

        // C. Enfin, je l'efface physiquement de la table dresseurs
        dresseurRepository.deleteById(id);
    }
}