package com.poketcg.walletservice.repositories;

import com.poketcg.walletservice.entities.Portefeuille;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface PortefeuilleRepository extends JpaRepository<Portefeuille, Long> {
    // Cette méthode permettra de retrouver le portefeuille d'un dresseur précis
    Optional<Portefeuille> findByIdDresseur(Long idDresseur);
}