package com.poketcg.inventory_service.services;

import com.poketcg.inventory_service.entities.CollectionCard;
import com.poketcg.inventory_service.repositories.CollectionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CollectionService {

    private final CollectionRepository collectionRepository;

    //  méthode pour "capturer" une carte et l'ajouter à sa collection
    public CollectionCard ajouterAuPokedex(CollectionCard card) {
        // J'ajoute automatiquement la date d'acquisition au moment de l'enregistrement
        card.setDateAcquisition(LocalDateTime.now());
        // Par défaut, quand j'ajoute une carte moi-même, elle est "POSSEDEE"
        card.setStatut("POSSEDEE");
        return collectionRepository.save(card);
    }

    //  méthode pour consulter son propre Pokedex
    public List<CollectionCard> voirMonPokedex(Long idDresseur) {
        return collectionRepository.findByIdDresseur(idDresseur);
    }

    // Supprimer une carte de la collection
    public void supprimerDuPokedex(Long id) {
        collectionRepository.deleteById(id);
    }

    // Modifier l'état d'une carte (ex: de 'Usé' à 'Excellent')
    public CollectionCard updateEtat(Long id, String nouvelEtat) {
        CollectionCard card = collectionRepository.findById(id).orElseThrow();
        card.setEtatCarte(nouvelEtat);
        return collectionRepository.save(card);
    }

    //  MÉTHODE : Pour le nettoyage RGPD
    public void supprimerToutLePokedex(Long idDresseur) {
        collectionRepository.deleteByIdDresseur(idDresseur);
    }

    // MÉTHODE : Changer le propriétaire (Achat Marketplace)
    // C'est ici que je gère le transfert de la carte du vendeur vers l'acheteur
    public CollectionCard transfererPropriete(Long idVendeur, Long idAcheteur, String idCarteApi) {
        // 1. Je cherche la carte chez le vendeur
        // (Note: on prend la première qu'on trouve s'il en a plusieurs)
        List<CollectionCard> pokedexVendeur = collectionRepository.findByIdDresseur(idVendeur);
        CollectionCard cardATransferer = pokedexVendeur.stream()
                .filter(c -> c.getIdCarteApi().equals(idCarteApi))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Le vendeur ne possède plus cette carte !"));

        // 2. Je change le dresseur et je passe le statut en "EN_TRANSIT"
        cardATransferer.setIdDresseur(idAcheteur);
        cardATransferer.setStatut("EN_TRANSIT"); // L'argent est bloqué, la carte est en route

        return collectionRepository.save(cardATransferer);
    }

    // MÉTHODE : Valider la réception (Fin de livraison)
    // C'est ici que je confirme que l'acheteur a bien reçu la carte
    public CollectionCard validerReception(Long idAcheteur, String idCarteApi) {
        // Je cherche la carte qui est "en transit" chez l'acheteur
        List<CollectionCard> pokedexAcheteur = collectionRepository.findByIdDresseur(idAcheteur);
        CollectionCard cardAValider = pokedexAcheteur.stream()
                .filter(c -> c.getIdCarteApi().equals(idCarteApi) && "EN_TRANSIT".equals(c.getStatut()))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Aucune carte en transit trouvée pour cet ID !"));

        // Je passe le statut en POSSEDEE car le colis est arrivé
        cardAValider.setStatut("POSSEDEE");
        return collectionRepository.save(cardAValider);
    }
}