package com.poketcg.identityservice.proxies;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "marketplace-service")
public interface MarketplaceProxy {
    @DeleteMapping("/api/marketplace/vendeur/{idVendeur}")
    String deleteAllByVendeur(@PathVariable("idVendeur") Long idVendeur);
}