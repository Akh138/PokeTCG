package com.poketcg.walletservice.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Entity
@Table(name = "portefeuille") // Je fais le lien avec le nom dans MySQL
@Data @NoArgsConstructor @AllArgsConstructor
public class Portefeuille {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // BigDecimal est obligatoire pour l'argent (precision totale)
    @Column(nullable = false)
    private BigDecimal soldeDisponible;

    @Column(nullable = false)
    private BigDecimal soldeSequestre;

    // C'est l'ID du dresseur qui vient de l'autre service
    @Column(nullable = false, unique = true)
    private Long idDresseur;
}