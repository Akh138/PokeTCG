package com.poketcg.marketplace_service.proxies;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PathVariable;
import java.math.BigDecimal;

@FeignClient(name = "wallet-service")
public interface WalletProxy {

    // J'appelle la méthode de séquestre (bloquer l'argent)
    @PutMapping("/api/wallets/lock/{idDresseur}/{montant}")
    String lockFunds(@PathVariable("idDresseur") Long idDresseur, @PathVariable("montant") java.math.BigDecimal montant);

    // J'appelle la méthode de transfert définitif (une fois reçu)
    @PutMapping("/api/wallets/confirm/{idAcheteur}/{idVendeur}/{montant}")
    String confirmPurchase(@PathVariable("idAcheteur") Long idAcheteur, @PathVariable("idVendeur") Long idVendeur, @PathVariable("montant") java.math.BigDecimal montant);

    // J'ajoute le tunnel pour annuler l'achat et rendre l'argent
    @PutMapping("/api/wallets/cancel/{idAcheteur}/{montant}")
    String cancelPurchase(@PathVariable("idAcheteur") Long idAcheteur, @PathVariable("montant") java.math.BigDecimal montant);
}