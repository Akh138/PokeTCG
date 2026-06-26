package com.poketcg.marketplace_service.repositories;

import com.poketcg.marketplace_service.entities.Offre;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface OffreRepository extends JpaRepository<Offre, Long> {
    // Pour que le vendeur puisse voir toutes les propositions reçues sur son annonce
    List<Offre> findByIdAnnonce(Long idAnnonce);
}