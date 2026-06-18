package com.poketcg.catalog_service.services;

import com.poketcg.catalog_service.entities.Carte;
import com.poketcg.catalog_service.proxies.PokemonTcgProxy;
import com.poketcg.catalog_service.proxies.TcgDexProxy;
import com.poketcg.catalog_service.repositories.CarteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CarteService {

    private final CarteRepository carteRepository;
    // J'injecte mes deux proxies pour pouvoir appeler les APIs
    private final PokemonTcgProxy pokemonTcgProxy;
    private final TcgDexProxy tcgDexProxy;

    // Ma méthode pour "aspirer" une carte depuis les deux APIs et la mettre en cache NoSQL
    public Carte importerCarteDepuisApis(String idApi) {

        // 1. J'appelle l'API française pour récupérer le nom FR et l'extension
        Map<String, Object> resFr = (Map<String, Object>) tcgDexProxy.getCardDetailsFr(idApi);

        // 2. J'appelle l'API internationale pour récupérer l'image HD et le prix
        Map<String, Object> resIntRaw = (Map<String, Object>) pokemonTcgProxy.getCardDetails(idApi);
        Map<String, Object> resInt = (Map<String, Object>) resIntRaw.get("data");

        // 3. Je crée mon objet Carte fusionné
        Carte nouvelleCarte = new Carte();
        nouvelleCarte.setIdApiUnique(idApi);

        // Données venant de TCGdex (FR)
        nouvelleCarte.setNomFr((String) resFr.get("name"));
        Map<String, Object> setFr = (Map<String, Object>) resFr.get("set");
        nouvelleCarte.setExtension((String) setFr.get("name"));

        // Données venant de PokemonTcg.io (Images & Prix)
        Map<String, Object> images = (Map<String, Object>) resInt.get("images");
        nouvelleCarte.setImageUrl((String) images.get("large"));

        // Récupération du prix (On prend le prix moyen de TCGPlayer par défaut)
        try {
            Map<String, Object> tcgPlayer = (Map<String, Object>) resInt.get("tcgplayer");
            Map<String, Object> prices = (Map<String, Object>) tcgPlayer.get("prices");
            Map<String, Object> holofoil = (Map<String, Object>) prices.get("holofoil");
            if (holofoil == null) holofoil = (Map<String, Object>) prices.get("normal");

            Double marketPrice = (Double) holofoil.get("market");
            nouvelleCarte.setPrix(BigDecimal.valueOf(marketPrice));
        } catch (Exception e) {
            // Si le prix n'est pas dispo, on met 0 par défaut
            nouvelleCarte.setPrix(BigDecimal.ZERO);
        }

        // 4. J'enregistre le résultat final dans mon MongoDB
        return carteRepository.save(nouvelleCarte);
    }

    public List<Carte> recupererToutesLesCartes() {
        return carteRepository.findAll();
    }

    public Carte sauvegarderEnCache(Carte carte) {
        return carteRepository.save(carte);
    }
}