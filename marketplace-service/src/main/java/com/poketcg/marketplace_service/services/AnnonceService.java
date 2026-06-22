package com.poketcg.marketplace_service.services;

import com.poketcg.marketplace_service.entities.Annonce;
import com.poketcg.marketplace_service.repositories.AnnonceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AnnonceService {

    private final AnnonceRepository annonceRepository;

    // Je crée l'annonce et je la mets en statut DISPONIBLE par défaut
    public Annonce publierAnnonce(Annonce annonce) {
        annonce.setStatut("DISPONIBLE");
        annonce.setDatePublication(LocalDateTime.now());
        return annonceRepository.save(annonce);
    }

    // Je récupère toutes les annonces du marché
    public List<Annonce> voirLeMarche() {
        return annonceRepository.findByStatut("DISPONIBLE");
    }

    // Voir toutes les annonces d'un dresseur précis
    public List<Annonce> voirMesAnnonces(Long idVendeur) {
        return annonceRepository.findAll().stream()
                .filter(a -> a.getIdVendeur().equals(idVendeur))
                .toList();
    }

    // Voir toutes les annonces pour une carte précise (ex: tous les Dracaufeu)
    public List<Annonce> chercherParCarte(String idCarteApi) {
        return annonceRepository.findByIdCarteApi(idCarteApi);
    }

    // Annuler une vente
    public void supprimerAnnonce(Long id) {
        annonceRepository.deleteById(id);
    }

    // MÉTHODE : Pour supprimer tout mon catalogue de vente (Droit à l'oubli / RGPD)
    public void supprimerToutesMesAnnonces(Long idVendeur) {
        annonceRepository.deleteByIdVendeur(idVendeur);
    }
}