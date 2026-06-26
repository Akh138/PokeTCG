package com.poketcg.marketplace_service.repositories;

import com.poketcg.marketplace_service.entities.Annonce;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

public interface AnnonceRepository extends JpaRepository<Annonce, Long> {
    // Pour voir toutes les annonces d'une carte précise
    List<Annonce> findByIdCarteApi(String idCarteApi);
    // Pour voir toutes les annonces encore disponibles
    List<Annonce> findByStatut(String statut);
    // Grâce au mot-clé "OrderByPrixAsc", Spring va générer tout seul
    // le SQL pour trier du moins cher au plus cher. C'est magique !
    List<Annonce> findByStatutOrderByPrixAsc(String statut);

    // MÉTHODE : Pour supprimer d'un coup toutes les annonces d'un dresseur précis
    @Transactional
    void deleteByIdVendeur(Long idVendeur);
}