package com.poketcg.marketplace_service.controllers;

import com.poketcg.marketplace_service.entities.Annonce;
import com.poketcg.marketplace_service.entities.Offre; // J'importe l'entité Offre
import com.poketcg.marketplace_service.services.AnnonceService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/marketplace")
@RequiredArgsConstructor
public class AnnonceController {

    private final AnnonceService annonceService;

    // Route pour mettre en vente une carte
    @PostMapping("/post")
    public Annonce post(@RequestBody Annonce annonce) {
        return annonceService.publierAnnonce(annonce);
    }

    // 1. Voir TOUTES les annonces disponibles (Vue globale)
    @GetMapping("/all")
    public List<Annonce> getAll() {
        return annonceService.voirLeMarche();
    }

    // 2. Voir le marché public (Exclut mes propres ventes)
    @GetMapping("/public/{idDresseur}")
    public List<Annonce> getPublicMarket(@PathVariable Long idDresseur) {
        return annonceService.voirLeMarchePublic(idDresseur);
    }

    // Voir les annonces d'un dresseur (Mes ventes à moi)
    @GetMapping("/vendeur/{idVendeur}")
    public List<Annonce> getByVendeur(@PathVariable Long idVendeur) {
        return annonceService.voirMesAnnonces(idVendeur);
    }

    // Chercher toutes les ventes d'un modèle de carte
    @GetMapping("/carte/{idCarteApi}")
    public List<Annonce> getByCarte(@PathVariable String idCarteApi) {
        return annonceService.chercherParCarte(idCarteApi);
    }

    // Retirer une annonce précise du marché
    @DeleteMapping("/delete/{id}")
    public String delete(@PathVariable Long id) {
        annonceService.supprimerAnnonce(id);
        return "L'annonce a été retirée du marché.";
    }

    // ROUTE : Pour supprimer toutes les annonces d'un dresseur (RGPD)
    @DeleteMapping("/vendeur/{idVendeur}")
    public String deleteAllByVendeur(@PathVariable Long idVendeur) {
        annonceService.supprimerToutesMesAnnonces(idVendeur);
        return "Toutes les annonces du dresseur " + idVendeur + " ont été retirées du marché.";
    }

    // ÉTAPE 1 DE LA VENTE : Lancer l'achat d'une annonce
    @PutMapping("/buy/{idAnnonce}/{idAcheteur}")
    public Annonce buy(@PathVariable Long idAnnonce, @PathVariable Long idAcheteur) {
        return annonceService.acheterUneCarte(idAnnonce, idAcheteur);
    }

    // ÉTAPE 2 DE LA VENTE : Confirmer la réception
    @PutMapping("/confirm-delivery/{idAnnonce}")
    public Annonce confirmDelivery(@PathVariable Long idAnnonce) {
        return annonceService.confirmerReception(idAnnonce);
    }

    // 3. Voir le marché trié par prix croissant
    @GetMapping("/public/sorted/{idDresseur}")
    public List<Annonce> getPublicMarketSorted(@PathVariable Long idDresseur) {
        return annonceService.voirLeMarchePublicTrie(idDresseur);
    }

    // ⭐ NOUVEAUTÉ : Système de Troc et Négociation (Swap)

    // A. Faire une proposition (prix différent ou échange de carte)
    @PostMapping("/offers/propose")
    public Offre propose(@RequestBody Offre offre) {
        return annonceService.proposerEchange(offre);
    }

    // B. Accepter l'échange (Déclenche le double transfert et le paiement négocié)
    @PutMapping("/offers/accept/{idOffre}")
    public Annonce acceptOffer(@PathVariable Long idOffre) {
        return annonceService.accepterEchange(idOffre);
    }
}