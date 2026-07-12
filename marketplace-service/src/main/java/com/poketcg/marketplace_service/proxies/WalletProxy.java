package com.poketcg.marketplace_service.proxies;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PathVariable;
import java.math.BigDecimal;

// Ce proxy permet de commander le Wallet pour bloquer l'argent
@FeignClient(name = "wallet-service", url = "http://localhost:8082/api/wallets")
public interface WalletProxy {

    // J'appelle la méthode de séquestre (bloquer l'argent)
    @PutMapping("/lock/{idDresseur}/{montant}")
    String lockFunds(@PathVariable("idDresseur") Long idDresseur, @PathVariable("montant") BigDecimal montant);

    // J'appelle la méthode de transfert définitif (une fois reçu)
    @PutMapping("/confirm/{idAcheteur}/{idVendeur}/{montant}")
    String confirmPurchase(@PathVariable("idAcheteur") Long idAcheteur, @PathVariable("idVendeur") Long idVendeur, @PathVariable("montant") BigDecimal montant);

    // J'ajoute le tunnel pour annuler l'achat et rendre l'argent
    @PutMapping("/api/wallets/cancel/{idAcheteur}/{montant}")
    String cancelPurchase(@PathVariable("idAcheteur") Long idAcheteur, @PathVariable("montant") java.math.BigDecimal montant);
}