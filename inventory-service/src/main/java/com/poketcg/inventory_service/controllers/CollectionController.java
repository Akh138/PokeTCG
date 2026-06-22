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

    @DeleteMapping("/delete/{id}")
    public String delete(@PathVariable Long id) {
        collectionService.supprimerDuPokedex(id);
        return "Carte supprimée de l'inventaire.";
    }


    @DeleteMapping("/trainer/{idDresseur}")
    public String deleteAllByTrainer(@PathVariable Long idDresseur) {
        collectionService.supprimerToutLePokedex(idDresseur);
        return "Tout l'inventaire du dresseur " + idDresseur + " a été supprimé avec succès.";
    }

    @PutMapping("/update/{id}/{nouvelEtat}")
    public CollectionCard update(@PathVariable Long id, @PathVariable String nouvelEtat) {
        return collectionService.updateEtat(id, nouvelEtat);
    }
}