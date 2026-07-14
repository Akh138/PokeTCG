package com.poketcg.marketplace_service.proxies;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "inventory-service")
public interface InventoryProxy {

    // MÉTHODE : Pour confirmer que la carte est bien arrivée à destination
    @PutMapping("/api/inventory/transfer/{idVendeur}/{idAcheteur}/{idCarteApi}")
    Object transferCard(@PathVariable("idVendeur") Long idVendeur,
                        @PathVariable("idAcheteur") Long idAcheteur,
                        @PathVariable("idCarteApi") String idCarteApi);

    // MÉTHODE : Pour confirmer que la carte est bien arrivée à destination
    @PutMapping("/api/inventory/confirm-receipt/{idDresseur}/{idCarteApi}")
    Object confirmDelivery(@PathVariable("idDresseur") Long idDresseur,
                           @PathVariable("idCarteApi") String idCarteApi);
}