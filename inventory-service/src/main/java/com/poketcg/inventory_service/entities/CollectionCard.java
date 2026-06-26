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

    //  Je stocke le nom de l'extension pour calculer la progression
    private String extension;    // ex: Set de Base, Épée et Bouclier

    // Les détails que j'ai prévus dans mon MLD
    private String etatCarte;    // ex: Neuf, Excellent, Usé
    private String langueCarte;  // ex: FR, EN, JP
    private LocalDateTime dateAcquisition;

    // J'ajoute le statut pour gérer le flux de livraison (POSSEDEE, EN_TRANSIT)
    private String statut;
}