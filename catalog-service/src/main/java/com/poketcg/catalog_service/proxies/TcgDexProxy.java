package com.poketcg.catalog_service.proxies;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import java.util.List;
import java.util.Map;

// Je déclare ce client pour appeler l'API française (noms et extensions en FR)
@FeignClient(name = "tcgdex-fr", url = "https://api.tcgdex.net/v2/fr")
public interface TcgDexProxy {

    // J'appelle l'URL /cards/{id} de TCGdex pour avoir la version française
    @GetMapping("/cards/{id}")
    Object getCardDetailsFr(@PathVariable("id") String id);

    // MÉTHODE : Récupérer la liste des extensions avec les noms en Français
    @GetMapping("/sets")
    Object getAllSetsFr();

    // MÉTHODE : Récupérer toutes les cartes d'un set précis en Français
    @GetMapping("/sets/{id}")
    Object getSetDetailsFr(@PathVariable("id") String id);

    // MÉTHODE : Chercher les cartes par nom en Français
    @GetMapping("/cards")
    Object searchCardsByNameFr(@RequestParam("name") String name);

    //MÉTHODE : Traduire un nom en un ID anglais
    // Exemple : /pokemon/dracaufeu -> me donnera l'id "charizard"
    @GetMapping("/pokemon/{name}")
    Map<String, Object> getPokemonDataByName(@PathVariable("name") String name);

    @GetMapping("/pokemon")
    List<Map<String, String>> getAllPokemonNames();
}