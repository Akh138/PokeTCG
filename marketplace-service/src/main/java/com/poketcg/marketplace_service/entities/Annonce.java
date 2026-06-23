package com.poketcg.marketplace_service.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "annonces") // Lien avec mon MLD
@Data @NoArgsConstructor @AllArgsConstructor
public class Annonce {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Qui vend la carte ? (ID du dresseur qui vient d'Identity)
    @Column(nullable = false)
    private Long idVendeur;

    // Qui achète la carte ?
    // Je rajoute ce champ pour savoir à qui l'annonce est "réservée" pendant le transit
    private Long idAcheteur;

    // Quelle carte est vendue ? (ID API comme "base1-4")
    @Column(nullable = false)
    private String idCarteApi;

    // À quel prix ? (BigDecimal pour la précision financière, indispensable pour mon projet Fintech)
    @Column(nullable = false)
    private BigDecimal prix;

    // Statut de l'annonce : DISPONIBLE, EN_TRANSIT, VENDUE
    private String statut;

    private LocalDateTime datePublication;
}