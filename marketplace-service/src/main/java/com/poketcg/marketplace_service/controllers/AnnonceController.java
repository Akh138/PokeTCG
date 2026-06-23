package com.poketcg.marketplace_service.controllers;

import com.poketcg.marketplace_service.entities.Annonce;
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

    // Route pour voir toutes les annonces disponibles
    @GetMapping("/all")
    public List<Annonce> getAll() {
        return annonceService.voirLeMarche();
    }

    // Voir les annonces d'un vendeur
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

    // ÉTAPE 1 DE LA VENTE : Lancer l'achat d'une annonce (Bloque l'argent et transfère la carte)
    @PutMapping("/buy/{idAnnonce}/{idAcheteur}")
    public Annonce buy(@PathVariable Long idAnnonce, @PathVariable Long idAcheteur) {
        return annonceService.acheterUneCarte(idAnnonce, idAcheteur);
    }

    // ÉTAPE 2 DE LA VENTE : Confirmer la réception (Paye le vendeur et valide la carte)
    // C'est cette route que j'appellerai quand le colis est arrivé !
    @PutMapping("/confirm-delivery/{idAnnonce}")
    public Annonce confirmDelivery(@PathVariable Long idAnnonce) {
        return annonceService.confirmerReception(idAnnonce);
    }
}