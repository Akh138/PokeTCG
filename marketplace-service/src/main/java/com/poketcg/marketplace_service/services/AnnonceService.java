package com.poketcg.marketplace_service.services;

import com.poketcg.marketplace_service.entities.Annonce;
import com.poketcg.marketplace_service.proxies.InventoryProxy;
import com.poketcg.marketplace_service.proxies.WalletProxy;
import com.poketcg.marketplace_service.repositories.AnnonceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AnnonceService {

    private final AnnonceRepository annonceRepository;
    // J'injecte les proxys pour pouvoir orchestrer l'achat
    private final WalletProxy walletProxy;
    private final InventoryProxy inventoryProxy;

    // Je crée l'annonce et je la mets en statut DISPONIBLE par défaut
    public Annonce publierAnnonce(Annonce annonce) {
        annonce.setStatut("DISPONIBLE");
        annonce.setDatePublication(LocalDateTime.now());
        return annonceRepository.save(annonce);
    }

    // Je récupère toutes les annonces du marché
    public List<Annonce> voirLeMarche() {
        return annonceRepository.findByStatut("DISPONIBLE");
    }

    // Voir toutes les annonces d'un dresseur précis
    public List<Annonce> voirMesAnnonces(Long idVendeur) {
        return annonceRepository.findAll().stream()
                .filter(a -> a.getIdVendeur().equals(idVendeur))
                .toList();
    }

    // Voir toutes les annonces pour une carte précise (ex: tous les Dracaufeu)
    public List<Annonce> chercherParCarte(String idCarteApi) {
        return annonceRepository.findByIdCarteApi(idCarteApi);
    }

    // Annuler une vente
    public void supprimerAnnonce(Long id) {
        annonceRepository.deleteById(id);
    }

    // MÉTHODE : Pour supprimer tout mon catalogue de vente (Droit à l'oubli / RGPD)
    public void supprimerToutesMesAnnonces(Long idVendeur) {
        annonceRepository.deleteById(idVendeur);
    }

    // ⭐ LE COEUR DU MÉTIER : Lancer l'achat (Étape 1 du workflow)
    public Annonce acheterUneCarte(Long idAnnonce, Long idAcheteur) {
        // 1. Je récupère l'annonce dans ma base
        Annonce annonce = annonceRepository.findById(idAnnonce)
                .orElseThrow(() -> new RuntimeException("Annonce introuvable !"));

        // 2. Sécurité : on ne peut pas s'acheter sa propre carte
        if (annonce.getIdVendeur().equals(idAcheteur)) {
            throw new RuntimeException("Vous ne pouvez pas acheter votre propre annonce !");
        }

        // 3. Je verrouille l'acheteur dans l'annonce
        annonce.setIdAcheteur(idAcheteur);

        // 4. ORCHESTRATION FINTECH : Je demande au service Wallet de bloquer l'argent
        // (L'argent passe en mode SEQUESTRE chez l'acheteur)
        walletProxy.lockFunds(idAcheteur, annonce.getPrix());

        // 5. ORCHESTRATION INVENTAIRE : Je transfère la carte vers l'acheteur
        // (Elle passe en mode EN_TRANSIT dans son Pokedex)
        inventoryProxy.transferCard(annonce.getIdVendeur(), idAcheteur, annonce.getIdCarteApi());

        // 6. MISE À JOUR DE L'ANNONCE
        annonce.setStatut("EN_TRANSIT");

        return annonceRepository.save(annonce);
    }

    // ⭐ FINALISATION : Confirmer la réception (Étape 2 du workflow)
    // C'est ici que l'argent est réellement versé au vendeur
    public Annonce confirmerReception(Long idAnnonce) {
        Annonce annonce = annonceRepository.findById(idAnnonce)
                .orElseThrow(() -> new RuntimeException("Annonce introuvable !"));

        // 1. DÉNOUEMENT FINANCIER : Le Wallet débloque l'argent du séquestre vers le vendeur
        walletProxy.confirmPurchase(annonce.getIdAcheteur(), annonce.getIdVendeur(), annonce.getPrix());

        // 2. MISE À JOUR POKEDEX : La carte devient définitivement "POSSEDEE" par l'acheteur
        // On verra cette méthode dans l'étape suivante de l'orchestration
        inventoryProxy.confirmDelivery(annonce.getIdAcheteur(), annonce.getIdCarteApi());

        // 3. CLÔTURE DE L'ANNONCE
        annonce.setStatut("VENDUE");

        return annonceRepository.save(annonce);
    }
}