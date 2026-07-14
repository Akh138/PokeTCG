package com.poketcg.catalog_service.controllers;

import com.poketcg.catalog_service.entities.Carte;
import com.poketcg.catalog_service.services.CarteService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@CrossOrigin("*") // J'autorise mon site web à lire les données du catalogue (Port 8083)
@RestController
@RequestMapping("/api/catalog")
@RequiredArgsConstructor
public class CarteController {

    private final CarteService carteService;

    //  Lister toutes les séries de cartes disponibles dans l'API
    @GetMapping("/extensions")
    public Object getExtensions() {
        return carteService.recupererToutesLesExtensions();
    }

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

    // 7. Voir toutes les cartes d'une extension précise (ex: /set/base1)
    @GetMapping("/set/{setId}")
    public List<Map<String, Object>> getCardsBySet(@PathVariable String setId) {
        return carteService.recupererCartesParExtension(setId);
    }

    // 8. Recherche globale par nom (ex: Pikachu) sur toutes les séries
    @GetMapping("/search/{nom}")
    public List<Map<String, Object>> searchGlobal(@PathVariable String nom) {
        return carteService.rechercherCartesGlobalement(nom);
    }

    // 9. Route Admin pour aspirer une extension complète dans MongoDB ⭐
    @PostMapping("/admin/seed/{setId}")
    public String seedExtension(@PathVariable String setId) {
        return carteService.peuplerLeCache(setId);
    }
}