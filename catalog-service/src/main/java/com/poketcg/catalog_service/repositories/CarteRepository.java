package com.poketcg.catalog_service.repositories;

import com.poketcg.catalog_service.entities.Carte;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository // Je dis a Spring que c'est ici qu'on parle a MongoDB
public interface CarteRepository extends MongoRepository<Carte, String> {
    // Cette méthode me permettra de vérifier si une carte est déjà en cache via l'ID API
    Optional<Carte> findByIdApiUnique(String idApiUnique);
}