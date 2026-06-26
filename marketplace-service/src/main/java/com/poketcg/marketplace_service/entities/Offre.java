package com.poketcg.marketplace_service.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Entity
@Table(name = "offres") // Je crée une nouvelle table pour les négociations
@Data @NoArgsConstructor @AllArgsConstructor
public class Offre {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long idAnnonce;      // Sur quelle annonce on négocie ?
    private Long idAcheteur;     // Qui propose l'échange ?

    // NÉGOCIATION : Ce que l'acheteur propose
    private BigDecimal prixPropose;     // "Je te donne X crédits..."
    private String idCarteProposee;     // "...et ma carte (ex: Mewtwo base1-10)"

    // Statut de la négociation : EN_ATTENTE, ACCEPTEE, REFUSEE
    private String statut;
}