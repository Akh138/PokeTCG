package com.poketcg.social_service.repositories;
import com.poketcg.social_service.entities.ForumMessage;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface ForumRepository extends MongoRepository<ForumMessage, String> {
    // MA MÉTHODE : Pour effacer d'un coup tous les messages d'un dresseur précis
    void deleteByIdAuteur(Long idAuteur);
}