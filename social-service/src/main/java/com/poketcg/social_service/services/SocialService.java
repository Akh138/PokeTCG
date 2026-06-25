package com.poketcg.social_service.services;

import com.poketcg.social_service.entities.ForumMessage;
import com.poketcg.social_service.entities.News;
import com.poketcg.social_service.repositories.ForumRepository;
import com.poketcg.social_service.repositories.NewsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SocialService {
    private final NewsRepository newsRepository;
    private final ForumRepository forumRepository;

    // --- LOGIQUE NEWS ---
    public News publierNews(News news) {
        news.setDatePublication(LocalDateTime.now());
        return newsRepository.save(news);
    }

    public List<News> voirToutesLesNews() {
        return newsRepository.findAll();
    }

    // MA MÉTHODE : Pour supprimer une news (Modération)
    public void supprimerNews(String id) {
        newsRepository.deleteById(id);
    }

    // --- LOGIQUE FORUM ---
    public ForumMessage posterMessage(ForumMessage msg) {
        msg.setDateEnvoi(LocalDateTime.now());
        return forumRepository.save(msg);
    }

    public List<ForumMessage> voirLeForum() {
        return forumRepository.findAll();
    }

    // MA MÉTHODE : Pour supprimer un message précis (Modération)
    public void supprimerMessage(String id) {
        forumRepository.deleteById(id);
    }

    // MA MÉTHODE : Le grand nettoyage RGPD
    // C'est ici que je supprime toutes les traces écrites d'un dresseur qui s'en va
    public void supprimerTousLesMessagesDresseur(Long idAuteur) {
        forumRepository.deleteByIdAuteur(idAuteur);
    }
}