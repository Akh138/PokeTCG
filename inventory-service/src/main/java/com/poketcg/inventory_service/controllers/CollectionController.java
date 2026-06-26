package com.poketcg.inventory_service.controllers;

import com.poketcg.inventory_service.entities.CollectionCard;
import com.poketcg.inventory_service.services.CollectionService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/inventory") // L'adresse de mon Inventaire
@RequiredArgsConstructor
public class CollectionController {

    private final CollectionService collectionService;

    // 1. Ajouter une carte à ma collection (POST)
    @PostMapping("/add")
    public CollectionCard capture(@RequestBody CollectionCard card) {
        return collectionService.ajouterAuPokedex(card);
    }

    // 2. Voir mon Pokedex personnel (GET)
    @GetMapping("/pokedex/{idDresseur}")
    public List<CollectionCard> getPokedex(@PathVariable Long idDresseur) {
        return collectionService.voirMonPokedex(idDresseur);
    }

    // 3. Supprimer une carte précise
    @DeleteMapping("/delete/{id}")
    public String delete(@PathVariable Long id) {
        collectionService.supprimerDuPokedex(id);
        return "Carte supprimée de l'inventaire.";
    }

    // 4. Suppression groupée pour le dresseur (RGPD)
    @DeleteMapping("/trainer/{idDresseur}")
    public String deleteAllByTrainer(@PathVariable Long idDresseur) {
        collectionService.supprimerToutLePokedex(idDresseur);
        return "Tout l'inventaire du dresseur " + idDresseur + " a été supprimé avec succès.";
    }

    // 5. Modifier l'état d'une carte
    @PutMapping("/update/{id}/{nouvelEtat}")
    public CollectionCard update(@PathVariable Long id, @PathVariable String nouvelEtat) {
        return collectionService.updateEtat(id, nouvelEtat);
    }

    // 6. Transfert automatique lors d'une mise en vente (Appelé par le Marketplace)
    @PutMapping("/transfer/{idVendeur}/{idAcheteur}/{idCarteApi}")
    public CollectionCard transfer(@PathVariable Long idVendeur, @PathVariable Long idAcheteur, @PathVariable String idCarteApi) {
        return collectionService.transfererPropriete(idVendeur, idAcheteur, idCarteApi);
    }

    // 7. Validation finale de réception (La carte devient "POSSÉDÉE")
    @PutMapping("/confirm-receipt/{idDresseur}/{idCarteApi}")
    public CollectionCard confirmReceipt(@PathVariable Long idDresseur, @PathVariable String idCarteApi) {
        return collectionService.validerReception(idDresseur, idCarteApi);
    }

    // 8. Voir mon nombre de cartes pour une série précise
    @GetMapping("/count/{idDresseur}/{extension}")
    public long getCountByExtension(@PathVariable Long idDresseur, @PathVariable String extension) {
        return collectionService.compterParSérie(idDresseur, extension);
    }
}