package com.poketcg.social_service.entities;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Document(collection = "news") // Je dis à Mongo de ranger ça dans le tiroir "news"
@Data @NoArgsConstructor @AllArgsConstructor
public class News {
    @Id
    private String id;
    private String titre;
    private String contenu;
    private String imageUrl;
    private LocalDateTime datePublication;
    private String articleUrl;// Je l'utiliserai pour rediriger le dresseur vers le site d'origine de l'actu
}