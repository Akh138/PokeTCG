package com.poketcg.identityservice.proxies;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;

// Proxy pour appeler le Marketplace-Service sur le port 8085
@FeignClient(name = "marketplace-service", url = "http://localhost:8085/api/marketplace")
public interface MarketplaceProxy {

    // On appelle la route de retrait massif des annonces
    @DeleteMapping("/vendeur/{idVendeur}")
    String deleteAllByVendeur(@PathVariable("idVendeur") Long idVendeur);
}