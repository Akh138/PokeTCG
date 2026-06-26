package com.poketcg.catalog_service.entities;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.math.BigDecimal;

@Document(collection = "cartes") // Je dis a MongoDB de ranger ca dans le tiroir "cartes"
@Data @NoArgsConstructor @AllArgsConstructor
public class Carte {

    @Id // Identifiant unique de MongoDB
    private String id;

    private String idApiUnique; // L'identifiant de l'API (ex: base1-4)
    private String nomFr;
    private String imageUrl;
    private String extension;

    //CHAMPS : Pour pouvoir filtrer mes recherches
    private String rarete;      // ex: Rare Holo, Commune
    private String type;        // ex: Feu, Eau, Plante

    private BigDecimal prix;
}