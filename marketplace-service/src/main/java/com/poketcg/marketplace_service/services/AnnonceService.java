package com.poketcg.marketplace_service.services;

import com.poketcg.marketplace_service.entities.Annonce;
import com.poketcg.marketplace_service.entities.Offre;
import com.poketcg.marketplace_service.proxies.InventoryProxy;
import com.poketcg.marketplace_service.proxies.WalletProxy;
import com.poketcg.marketplace_service.repositories.AnnonceRepository;
import com.poketcg.marketplace_service.repositories.OffreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AnnonceService {

    private final AnnonceRepository annonceRepository;
    private final OffreRepository offreRepository;
    // J'injecte les proxys pour pouvoir orchestrer l'achat
    private final WalletProxy walletProxy;
    private final InventoryProxy inventoryProxy;

    // Je crée l'annonce et je la mets en statut DISPONIBLE par défaut
    public Annonce publierAnnonce(Annonce annonce) {
        annonce.setStatut("DISPONIBLE");
        annonce.setDatePublication(LocalDateTime.now());
        return annonceRepository.save(annonce);
    }

    // Je récupère toutes les annonces du marché (Vue brute pour l'admin)
    public List<Annonce> voirLeMarche() {
        return annonceRepository.findByStatut("DISPONIBLE");
    }

    // MÉTHODE : Voir le marché sans mes propres annonces
    public List<Annonce> voirLeMarchePublic(Long idDresseurConnecte) {
        return voirLeMarche().stream()
                .filter(a -> !a.getIdVendeur().equals(idDresseurConnecte))
                .toList();
    }

    // Voir toutes les annonces d'un dresseur précis (mes propres ventes)
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

    // MÉTHODE : Pour le nettoyage RGPD
    public void supprimerToutesMesAnnonces(Long idVendeur) {
        annonceRepository.deleteByIdVendeur(idVendeur);
    }

    // LE COEUR DU MÉTIER : Lancer l'achat (Étape 1 du workflow)
    public Annonce acheterUneCarte(Long idAnnonce, Long idAcheteur) {
        Annonce annonce = annonceRepository.findById(idAnnonce)
                .orElseThrow(() -> new RuntimeException("Annonce introuvable !"));

        if (annonce.getIdVendeur().equals(idAcheteur)) {
            throw new RuntimeException("Vous ne pouvez pas acheter votre propre annonce !");
        }

        annonce.setIdAcheteur(idAcheteur);

        walletProxy.lockFunds(idAcheteur, annonce.getPrix());
        inventoryProxy.transferCard(annonce.getIdVendeur(), idAcheteur, annonce.getIdCarteApi());

        annonce.setStatut("EN_TRANSIT");

        return annonceRepository.save(annonce);
    }

    // FINALISATION : Confirmer la réception (Étape 2 du workflow)
    public Annonce confirmerReception(Long idAnnonce) {
        Annonce annonce = annonceRepository.findById(idAnnonce)
                .orElseThrow(() -> new RuntimeException("Annonce introuvable !"));

        walletProxy.confirmPurchase(annonce.getIdAcheteur(), annonce.getIdVendeur(), annonce.getPrix());
        inventoryProxy.confirmDelivery(annonce.getIdAcheteur(), annonce.getIdCarteApi());

        annonce.setStatut("VENDUE");

        return annonceRepository.save(annonce);
    }

    // MÉTHODE : Voir le marché trié du moins cher au plus cher
    public List<Annonce> voirLeMarchePublicTrie(Long idDresseurConnecte) {
        return annonceRepository.findByStatutOrderByPrixAsc("DISPONIBLE").stream()
                .filter(a -> !a.getIdVendeur().equals(idDresseurConnecte))
                .toList();
    }

    // PROPOSER UN ÉCHANGE (Troc ou Négociation)
    public Offre proposerEchange(Offre offre) {
        offre.setStatut("EN_ATTENTE");
        return offreRepository.save(offre);
    }

    // ACCEPTER L'ÉCHANGE (Double transfert + Prix négocié)
    // J'ai mis à jour cette méthode avec des messages d'erreurs clairs pour éviter les ID orphelins
    public Annonce accepterEchange(Long idOffre) {
        // 1. Je vérifie que l'offre existe bien en base
        Offre offre = offreRepository.findById(idOffre)
                .orElseThrow(() -> new RuntimeException("Erreur : L'offre n°" + idOffre + " n'existe pas ou a été supprimée."));

        // 2. Je vérifie que l'annonce liée n'a pas disparue entre temps
        Annonce annonce = annonceRepository.findById(offre.getIdAnnonce())
                .orElseThrow(() -> new RuntimeException("Erreur : L'annonce liée à cette offre est introuvable."));

        // 3. Mise à jour de l'acheteur dans l'annonce
        annonce.setIdAcheteur(offre.getIdAcheteur());

        // 4. ORCHESTRATION FINANCIÈRE (Basée sur le prix de l'offre et non celui de base)
        if (offre.getPrixPropose() != null && offre.getPrixPropose().compareTo(java.math.BigDecimal.ZERO) > 0) {
            walletProxy.lockFunds(offre.getIdAcheteur(), offre.getPrixPropose());
        }

        // 5. DOUBLE TRANSFERT D'INVENTAIRE (Orchestration croisée)
        // A. La carte de l'annonce va vers l'acheteur
        inventoryProxy.transferCard(annonce.getIdVendeur(), offre.getIdAcheteur(), annonce.getIdCarteApi());

        // B. La carte proposée en échange va vers le vendeur
        if (offre.getIdCarteProposee() != null && !offre.getIdCarteProposee().isEmpty()) {
            inventoryProxy.transferCard(offre.getIdAcheteur(), annonce.getIdVendeur(), offre.getIdCarteProposee());
        }

        // 6. Enregistrement des changements de statuts
        offre.setStatut("ACCEPTEE");
        annonce.setStatut("EN_TRANSIT");

        offreRepository.save(offre);
        return annonceRepository.save(annonce);
    }
}