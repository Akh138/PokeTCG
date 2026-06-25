package com.poketcg.social_service.entities;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Document(collection = "forum_messages")
@Data @NoArgsConstructor @AllArgsConstructor
public class ForumMessage {
    @Id
    private String id;
    private Long idAuteur;     // ID du dresseur qui parle
    private String pseudoAuteur;
    private String sujet;      // Le titre de la discussion
    private String message;
    private LocalDateTime dateEnvoi;
}