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
}