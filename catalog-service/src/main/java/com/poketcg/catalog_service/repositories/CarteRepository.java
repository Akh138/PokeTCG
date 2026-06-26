package com.poketcg.catalog_service.repositories;

import com.poketcg.catalog_service.entities.Carte;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository // Je dis a Spring que c'est ici qu'on parle a ma base NoSQL MongoDB
public interface CarteRepository extends MongoRepository<Carte, String> {

    // 1. Pour vérifier si on a déjà la carte en cache
    Optional<Carte> findByIdApiUnique(String idApiUnique);

    // 2. MÉTHODE : Chercher par extension (ex: Set de Base)
    List<Carte> findByExtension(String extension);

    // 3. MÉTHODE : Chercher par type (ex: Feu, Eau...)
    // (Note : On l'utilisera dès qu'on aura ajouté le champ dans l'entité)
    List<Carte> findByType(String type);

    // 4. MÉTHODE : Chercher par rareté (ex: Rare Holo)
    List<Carte> findByRarete(String rarete);
}