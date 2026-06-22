package com.poketcg.identityservice.proxies;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;

// Proxy pour appeler l'Inventory-Service sur le port 8084
@FeignClient(name = "inventory-service", url = "http://localhost:8084/api/inventory")
public interface InventoryProxy {

    // On appelle la route de suppression groupée que nous avons testée
    @DeleteMapping("/trainer/{idDresseur}")
    String deleteAllByTrainer(@PathVariable("idDresseur") Long idDresseur);
}