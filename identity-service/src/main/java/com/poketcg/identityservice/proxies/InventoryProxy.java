package com.poketcg.identityservice.proxies;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "inventory-service")
public interface InventoryProxy {
    @DeleteMapping("/api/inventory/trainer/{idDresseur}")
    String deleteAllByTrainer(@PathVariable("idDresseur") Long idDresseur);
}