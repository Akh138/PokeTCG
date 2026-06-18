package com.poketcg.catalog_service.proxies;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

// Je déclare ce client pour appeler l'API internationale (visuels HD et prix)
@FeignClient(name = "pokemon-tcg-io", url = "https://api.pokemontcg.io/v2")
public interface PokemonTcgProxy {

    // J'appelle l'URL /cards/{id} pour récupérer les détails d'une carte
    // J'utilise Object pour recevoir la réponse brute de l'API
    @GetMapping("/cards/{id}")
    Object getCardDetails(@PathVariable("id") String id);
}