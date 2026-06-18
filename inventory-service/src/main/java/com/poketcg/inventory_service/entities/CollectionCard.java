package com.poketcg.inventory_service.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "collectionner") // Le nom exact sur mon MLD
@Data @NoArgsConstructor @AllArgsConstructor
public class CollectionCard {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Je stocke l'ID du dresseur qui vient d'Identity
    @Column(nullable = false)
    private Long idDresseur;

    // Je stocke l'ID de la carte qui vient de l'API (ex: base1-4)
    @Column(nullable = false)
    private String idCarteApi;

    // Les détails que j'ai prévus dans mon MLD
    private String etatCarte;    // ex: Neuf, Excellent, Usé
    private String langueCarte;  // ex: FR, EN, JP
    private LocalDateTime dateAcquisition;
}