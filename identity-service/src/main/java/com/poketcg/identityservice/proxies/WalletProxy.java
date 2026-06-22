package com.poketcg.identityservice.proxies;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PathVariable;

// Je déclare ce proxy pour appeler le service Wallet sur le port 8082
@FeignClient(name = "wallet-service", url = "http://localhost:8082/api/wallets")
public interface WalletProxy {

    // J'appelle la route de création de portefeuille que nous avons déjà testée sur Postman
    @PostMapping("/create/{idDresseur}")
    Object createWallet(@PathVariable("idDresseur") Long idDresseur);
}