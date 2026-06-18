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
}