package com.poketcg.identityservice.repositories;

import com.poketcg.identityservice.entities.Dresseur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository // Je dis à Spring que c'est ici qu'on gère les accès à la base MySQL
public interface DresseurRepository extends JpaRepository<Dresseur, Long> {
    // Cette méthode magique permettra de vérifier si un pseudo existe déjà
    Optional<Dresseur> findByUsername(String username);
}