package com.poketcg.social_service.controllers;

import com.poketcg.social_service.entities.ForumMessage;
import com.poketcg.social_service.entities.News;
import com.poketcg.social_service.services.SocialService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;

//ANNOTATION : Pour la sécurité du Front-end
// J'ouvre la porte pour que mon futur site puisse appeler toutes les routes de ce Controller.
@CrossOrigin("*")
@RestController
@RequestMapping("/api/social")
@RequiredArgsConstructor
public class SocialController {
    private final SocialService socialService;

    // --- ENDPOINTS NEWS ---
    @PostMapping("/news")
    public News addNews(@RequestBody News news) { return socialService.publierNews(news); }

    @GetMapping("/news")
    public List<News> getNews() { return socialService.voirToutesLesNews(); }

    @DeleteMapping("/news/{id}")
    public String deleteNews(@PathVariable String id) {
        socialService.supprimerNews(id);
        return "L'actualité a été supprimée.";
    }

    // --- ENDPOINTS FORUM ---
    @PostMapping("/forum")
    public ForumMessage postMessage(@RequestBody ForumMessage msg) { return socialService.posterMessage(msg); }

    @GetMapping("/forum")
    public List<ForumMessage> getForum() { return socialService.voirLeForum(); }

    // Pour liker un message (PUT car on modifie le message)
    @PutMapping("/forum/like/{id}")
    public ForumMessage like(@PathVariable String id) {
        return socialService.likerMessage(id);
    }

    // Suppression d'un message précis (ID technique MongoDB)
    @DeleteMapping("/forum/{id}")
    public String deleteMessage(@PathVariable String id) {
        socialService.supprimerMessage(id);
        return "Message supprimé du forum.";
    }

    // Suppression en cascade (RGPD) appelée via l'ID du dresseur
    @DeleteMapping("/forum/author/{idAuthor}")
    public String deleteByAuthor(@PathVariable Long idAuthor) {
        socialService.supprimerTousLesMessagesDresseur(idAuthor);
        return "Tous les messages du dresseur " + idAuthor + " ont été effacés.";
    }
}