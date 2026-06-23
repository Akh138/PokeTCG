package com.poketcg.marketplace_service.proxies;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PathVariable;

// Proxy pour commander l'Inventory-Service sur le port 8084
@FeignClient(name = "inventory-service", url = "http://localhost:8084/api/inventory")
public interface InventoryProxy {

    // J'appelle la méthode de transfert de propriété
    @PutMapping("/transfer/{idVendeur}/{idAcheteur}/{idCarteApi}")
    Object transferCard(@PathVariable("idVendeur") Long idVendeur,
                        @PathVariable("idAcheteur") Long idAcheteur,
                        @PathVariable("idCarteApi") String idCarteApi);


    // MÉTHODE : Pour confirmer que la carte est bien arrivée à destination
    @PutMapping("/confirm-receipt/{idDresseur}/{idCarteApi}")
    Object confirmDelivery(@PathVariable("idDresseur") Long idDresseur,
                           @PathVariable("idCarteApi") String idCarteApi);
}