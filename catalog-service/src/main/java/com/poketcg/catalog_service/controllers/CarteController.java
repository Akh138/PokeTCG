package com.poketcg.catalog_service.controllers;

import com.poketcg.catalog_service.entities.Carte;
import com.poketcg.catalog_service.services.CarteService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/catalog")
@RequiredArgsConstructor
public class CarteController {

    private final CarteService carteService;

    // 1. Ajouter manuellement une carte au cache (Test technique)
    @PostMapping("/add")
    public Carte addCard(@RequestBody Carte carte) {
        return carteService.sauvegarderEnCache(carte);
    }

    // 2. Voir tout le contenu du catalogue local
    @GetMapping("/all")
    public List<Carte> getAll() {
        return carteService.recupererToutesLesCartes();
    }

    // 3. Importer une carte réelle depuis les APIs (ex: base1-4 pour Dracaufeu)
    @PostMapping("/import/{idApi}")
    public Carte importCard(@PathVariable String idApi) {
        // J'appelle mon service d'agrégation pour faire le travail
        return carteService.importerCarteDepuisApis(idApi);
    }
}