package com.poketcg.walletservice.repositories;

import com.poketcg.walletservice.entities.Portefeuille;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface PortefeuilleRepository extends JpaRepository<Portefeuille, Long> {

    // Cette méthode permet de retrouver le portefeuille d'un dresseur précis
    Optional<Portefeuille> findByIdDresseur(Long idDresseur);

    // Somme de tout l'argent disponible sur le site
    @org.springframework.data.jpa.repository.Query("SELECT SUM(p.soldeDisponible) FROM Portefeuille p")
    java.math.BigDecimal sumAllAvailable();

    // Somme de tout l'argent bloqué en séquestre (achats en cours)
    @org.springframework.data.jpa.repository.Query("SELECT SUM(p.soldeSequestre) FROM Portefeuille p")
    java.math.BigDecimal sumAllEscrow();
}