package com.poketcg.catalog_service.entities;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "extensions") // Nouveau tiroir NoSQL
@Data @NoArgsConstructor @AllArgsConstructor
public class Extension {
    @Id
    private String id;        // ex: base1
    private String name;      // ex: Set de Base
    private String series;    // ex: Base
    private String releaseDate;
    private String logoUrl;   // L'image du logo pour le Front-end
    private Integer total;
}