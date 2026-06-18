package com.poketcg.catalog_service.proxies;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

// Je déclare ce client pour appeler l'API française (noms et extensions en FR)
@FeignClient(name = "tcgdex-fr", url = "https://api.tcgdex.net/v2/fr")
public interface TcgDexProxy {

    // J'appelle l'URL /cards/{id} de TCGdex pour avoir la version française
    @GetMapping("/cards/{id}")
    Object getCardDetailsFr(@PathVariable("id") String id);
}