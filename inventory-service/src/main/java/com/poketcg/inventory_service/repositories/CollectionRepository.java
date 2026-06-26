package com.poketcg.inventory_service.repositories;

import com.poketcg.inventory_service.entities.CollectionCard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface CollectionRepository extends JpaRepository<CollectionCard, Long> {

    List<CollectionCard> findByIdDresseur(Long idDresseur);
    //  MÉTHODE : Compter le nombre de cartes possédées dans une extension
    // Spring va générer la requête SQL tout seul !
    long countByIdDresseurAndExtension(Long idDresseur, String extension);

    // Ma méthode personnalisée pour supprimer TOUTES les cartes d'un dresseur d'un coup
    @Transactional // Je dis à la base de données de traiter cela comme une opération sécurisée
    void deleteByIdDresseur(Long idDresseur);
}