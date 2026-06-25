package com.poketcg.identityservice.services;

import com.poketcg.identityservice.config.JwtUtils;
import com.poketcg.identityservice.entities.Dresseur;
import com.poketcg.identityservice.proxies.InventoryProxy;
import com.poketcg.identityservice.proxies.MarketplaceProxy;
import com.poketcg.identityservice.proxies.SocialProxy;
import com.poketcg.identityservice.proxies.WalletProxy;
import com.poketcg.identityservice.repositories.DresseurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class DresseurService {

    private final DresseurRepository dresseurRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;

    private final WalletProxy walletProxy;
    private final InventoryProxy inventoryProxy;
    private final MarketplaceProxy marketplaceProxy;
    // 2. C'est cette ligne qu'il manquait pour que le rouge disparaisse !
    private final SocialProxy socialProxy;

    public Dresseur inscription(Dresseur dresseur) {
        dresseur.setPassword(passwordEncoder.encode(dresseur.getPassword()));
        dresseur.setRole("ROLE_USER");
        Dresseur nouveauDresseur = dresseurRepository.save(dresseur);

        walletProxy.createWallet(nouveauDresseur.getId());
        return nouveauDresseur;
    }

    public String connexion(String username, String password) {
        Dresseur dresseur = dresseurRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Dresseur inconnu !"));

        if (passwordEncoder.matches(password, dresseur.getPassword())) {
            return jwtUtils.generateToken(username);
        } else {
            throw new RuntimeException("Mot de passe incorrect !");
        }
    }

    // 4. MA LOGIQUE DE SUPPRESSION (Droit à l'oubli / RGPD)
    public void supprimerCompte(Long id) {
        if (!dresseurRepository.existsById(id)) {
            throw new RuntimeException("Erreur : Impossible de supprimer, dresseur introuvable.");
        }

        // B. ORCHESTRATION TOTALE : Je nettoie absolument tout dans tous les services
        inventoryProxy.deleteAllByTrainer(id);
        marketplaceProxy.deleteAllByVendeur(id);
        socialProxy.deleteByAuthor(id); // <--- Maintenant le rouge est parti !

        dresseurRepository.deleteById(id);
    }
}