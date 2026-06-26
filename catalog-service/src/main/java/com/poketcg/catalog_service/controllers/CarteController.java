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

    // 2. Voir tout le contenu du catalogue local (Ma base NoSQL)
    @GetMapping("/all")
    public List<Carte> getAll() {
        return carteService.recupererToutesLesCartes();
    }

    // 3. Importer une carte réelle manuellement
    @PostMapping("/import/{idApi}")
    public Carte importCard(@PathVariable String idApi) {
        return carteService.importerCarteDepuisApis(idApi);
    }

    // 4. MA ROUTE INTELLIGENTE (Ticket #6) : Récupérer ou Importer
    // C'est la route principale : si je demande une carte qu'on n'a pas,
    // mon service va l'aspirer automatiquement.
    @GetMapping("/details/{idApi}")
    public Carte getDetails(@PathVariable String idApi) {
        return carteService.recupererOuImporter(idApi);
    }

    // 5. FILTRE PAR TYPE (Ticket #5)
    // Exemple : /api/catalog/type/Fire
    @GetMapping("/type/{type}")
    public List<Carte> getByType(@PathVariable String type) {
        return carteService.chercherParType(type);
    }

    // 6. FILTRE PAR RARETÉ (Ticket #5)
    // Exemple : /api/catalog/rarete/Rare Holo
    @GetMapping("/rarete/{rarete}")
    public List<Carte> getByRarete(@PathVariable String rarete) {
        return carteService.chercherParRarete(rarete);
    }
}