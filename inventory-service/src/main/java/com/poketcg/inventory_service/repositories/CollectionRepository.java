package com.poketcg.inventory_service.repositories;

import com.poketcg.inventory_service.entities.CollectionCard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository // Je dis à Spring que c'est ici qu'on parle à la base de données
public interface CollectionRepository extends JpaRepository<CollectionCard, Long> {

    // Cette méthode magique permettra de retrouver toutes les cartes d'un dresseur précis
    List<CollectionCard> findByIdDresseur(Long idDresseur);
}