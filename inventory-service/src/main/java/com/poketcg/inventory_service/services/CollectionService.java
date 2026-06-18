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

    // Ma méthode pour "capturer" une carte et l'ajouter à sa collection
    public CollectionCard ajouterAuPokedex(CollectionCard card) {
        // J'ajoute automatiquement la date d'acquisition au moment de l'enregistrement
        card.setDateAcquisition(LocalDateTime.now());
        return collectionRepository.save(card);
    }

    // Ma méthode pour consulter son propre Pokedex
    public List<CollectionCard> voirMonPokedex(Long idDresseur) {
        return collectionRepository.findByIdDresseur(idDresseur);
    }
}