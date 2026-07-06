package com.poketcg.catalog_service.proxies;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

// Je déclare ce client pour appeler l'API internationale (visuels HD et prix)
@FeignClient(name = "pokemon-tcg-io", url = "https://api.pokemontcg.io/v2")
public interface PokemonTcgProxy {

    // J'appelle l'URL /cards/{id} pour récupérer les détails d'une carte
    // J'utilise Object pour recevoir la réponse brute de l'API
    @GetMapping("/cards/{id}")
    Object getCardDetails(@PathVariable("id") String id);

    //  MÉTHODE : Récupérer toutes les extensions du monde (Set de Base, EV01, etc.)
    @GetMapping("/sets")
    Object getAllSets();

    //  MÉTHODE : Récupérer toutes les cartes d'une extension (via une requête filtrée)
    // On utilise le paramètre "q" pour dire : "donne moi les cartes où set.id = {id}"
    @GetMapping("/cards?q=set.id:{setId}")
    Object getCardsBySet(@PathVariable("setId") String setId);

    //  MÉTHODE : Chercher un nom de Pokémon partout (ex: Pikachu)
    // J'utilise le paramètre 'q' pour demander à l'API de filtrer par nom
    @GetMapping("/cards")
    Object searchCardsByName(@RequestParam("q") String query);
}