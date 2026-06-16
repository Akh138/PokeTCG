package com.poketcg.walletservice.controllers;

import com.poketcg.walletservice.entities.Portefeuille;
import com.poketcg.walletservice.services.PortefeuilleService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;

@RestController
@RequestMapping("/api/wallets") // C'est l'adresse de base pour contacter ma "banque"
@RequiredArgsConstructor
public class PortefeuilleController {

    private final PortefeuilleService portefeuilleService;

    // 1. Ma route pour créer un portefeuille
    // Je renvoie l'objet entier ici pour vérifier que l'ID et le lien avec le dresseur sont OK
    @PostMapping("/create/{idDresseur}")
    public Portefeuille create(@PathVariable Long idDresseur) {
        return portefeuilleService.creerPortefeuille(idDresseur);
    }

    // 2. Ma route pour que le dresseur puisse voir ses sous (disponible et bloqué)
    @GetMapping("/owner/{idDresseur}")
    public Portefeuille getSolde(@PathVariable Long idDresseur) {
        return portefeuilleService.recupererSolde(idDresseur);
    }

    // 3. Ma route pour ajouter de l'argent (Simulation de rechargement)
    // Je renvoie une phrase de succès pour confirmer le dépôt au dresseur
    @PutMapping("/deposit/{idDresseur}/{montant}")
    public String deposit(@PathVariable Long idDresseur, @PathVariable BigDecimal montant) {
        return portefeuilleService.deposerArgent(idDresseur, montant);
    }

    // 4. Ma route pour bloquer l'argent quand Sacha clique sur "Acheter"
    // C'est le début de ma logique de séquestre (Escrow)
    @PutMapping("/lock/{idDresseur}/{montant}")
    public String lockFunds(@PathVariable Long idDresseur, @PathVariable BigDecimal montant) {
        return portefeuilleService.bloquerPourAchat(idDresseur, montant);
    }

    // 5. Ma route pour valider définitivement la vente
    // Je l'utiliserai quand l'acheteur confirmera avoir reçu son colis
    @PutMapping("/confirm/{idAcheteur}/{idVendeur}/{montant}")
    public String confirmPurchase(@PathVariable Long idAcheteur, @PathVariable Long idVendeur, @PathVariable BigDecimal montant) {
        return portefeuilleService.confirmerAchat(idAcheteur, idVendeur, montant);
    }

    // 6. Ma route pour annuler et rendre l'argent
    // Utile en cas de litige ou si le vendeur n'envoie jamais la carte
    @PutMapping("/cancel/{idAcheteur}/{montant}")
    public String cancelPurchase(@PathVariable Long idAcheteur, @PathVariable BigDecimal montant) {
        return portefeuilleService.annulerAchat(idAcheteur, montant);
    }
}