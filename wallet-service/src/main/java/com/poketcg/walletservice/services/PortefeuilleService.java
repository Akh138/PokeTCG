package com.poketcg.walletservice.services;

import com.poketcg.walletservice.entities.Portefeuille;
import com.poketcg.walletservice.entities.TransactionHistory;
import com.poketcg.walletservice.repositories.PortefeuilleRepository;
import com.poketcg.walletservice.repositories.TransactionHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class PortefeuilleService {

    private final PortefeuilleRepository portefeuilleRepository;
    private final TransactionHistoryRepository historyRepository;

    // 1. Initialisation d'un nouveau compte
    public Portefeuille creerPortefeuille(Long idDresseur) {
        Portefeuille p = new Portefeuille();
        p.setIdDresseur(idDresseur);
        p.setSoldeDisponible(BigDecimal.ZERO);
        p.setSoldeSequestre(BigDecimal.ZERO);
        return portefeuilleRepository.save(p);
    }

    // 2. Récupération des données du compte
    public Portefeuille recupererSolde(Long idDresseur) {
        return portefeuilleRepository.findByIdDresseur(idDresseur)
                .orElseThrow(() -> new RuntimeException("Portefeuille introuvable !"));
    }

    // 3. Simulation de dépôt d'argent
    public String deposerArgent(Long idDresseur, BigDecimal montant) {
        Portefeuille p = recupererSolde(idDresseur);
        p.setSoldeDisponible(p.getSoldeDisponible().add(montant));

        historyRepository.save(new TransactionHistory(null, idDresseur, montant, "DEPOSIT", LocalDateTime.now()));
        portefeuilleRepository.save(p);

        return "Approvisionnement réussi : " + montant + " PC ajoutés à votre solde disponible.";
    }

    // 4. LOGIQUE DE SÉQUESTRE (Le "gel" de l'argent lors de l'achat)
    public String bloquerPourAchat(Long idAcheteur, BigDecimal montant) {
        Portefeuille p = recupererSolde(idAcheteur);

        if (p.getSoldeDisponible().compareTo(montant) < 0) {
            throw new RuntimeException("Action refusée : Solde insuffisant pour sécuriser cette transaction.");
        }

        p.setSoldeDisponible(p.getSoldeDisponible().subtract(montant));
        p.setSoldeSequestre(p.getSoldeSequestre().add(montant));

        historyRepository.save(new TransactionHistory(null, idAcheteur, montant, "PURCHASE_LOCK", LocalDateTime.now()));
        portefeuilleRepository.save(p);

        return "Transaction initiée : " + montant + " PC placés en séquestre. En attente de validation de livraison.";
    }

    // 5. TRANSACTION RÉUSSIE : Transfert final vers le vendeur
    public String confirmerAchat(Long idAcheteur, Long idVendeur, BigDecimal montant) {
        Portefeuille pAcheteur = recupererSolde(idAcheteur);
        Portefeuille pVendeur = recupererSolde(idVendeur);

        pAcheteur.setSoldeSequestre(pAcheteur.getSoldeSequestre().subtract(montant));
        pVendeur.setSoldeDisponible(pVendeur.getSoldeDisponible().add(montant));

        portefeuilleRepository.save(pAcheteur);
        portefeuilleRepository.save(pVendeur);

        historyRepository.save(new TransactionHistory(null, idAcheteur, montant, "PURCHASE_CONFIRMED", LocalDateTime.now()));
        historyRepository.save(new TransactionHistory(null, idVendeur, montant, "SALE_CONFIRMED", LocalDateTime.now()));

        return "Transaction clôturée avec succès : fonds transférés au dresseur n°" + idVendeur;
    }

    // 6. ANNULATION : Retour de l'argent vers l'acheteur
    public String annulerAchat(Long idAcheteur, BigDecimal montant) {
        Portefeuille p = recupererSolde(idAcheteur);

        p.setSoldeSequestre(p.getSoldeSequestre().subtract(montant));
        p.setSoldeDisponible(p.getSoldeDisponible().add(montant));

        portefeuilleRepository.save(p);
        historyRepository.save(new TransactionHistory(null, idAcheteur, montant, "PURCHASE_CANCELLED", LocalDateTime.now()));

        return "Annulation effectuée : le montant de " + montant + " PC a été restitué sur votre solde disponible.";
    }
}