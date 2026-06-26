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
    private final PokemonTcgProxy pokemonTcgProxy;
    private final TcgDexProxy tcgDexProxy;

    // 1. MA LOGIQUE DE CACHE AUTOMATIQUE (Ticket #6)
    // C'est ici que je rends le service intelligent : si la carte n'est pas en base,
    // je déclenche l'importation automatiquement.
    public Carte recupererOuImporter(String idApi) {
        return carteRepository.findByIdApiUnique(idApi)
                .orElseGet(() -> importerCarteDepuisApis(idApi));
    }

    // 2. MON ASPIRATEUR DE DONNÉES AMÉLIORÉ
    public Carte importerCarteDepuisApis(String idApi) {

        // Appel TCGdex (FR)
        Map<String, Object> resFr = (Map<String, Object>) tcgDexProxy.getCardDetailsFr(idApi);

        // Appel PokemonTcg.io (HD & Infos techniques)
        Map<String, Object> resIntRaw = (Map<String, Object>) pokemonTcgProxy.getCardDetails(idApi);
        Map<String, Object> resInt = (Map<String, Object>) resIntRaw.get("data");

        Carte nouvelleCarte = new Carte();
        nouvelleCarte.setIdApiUnique(idApi);
        nouvelleCarte.setNomFr((String) resFr.get("name"));
        Map<String, Object> setFr = (Map<String, Object>) resFr.get("set");
        nouvelleCarte.setExtension((String) setFr.get("name"));

        // Methode : J'extrais le type et la rareté
        nouvelleCarte.setRarete((String) resInt.get("rarity"));
        List<String> types = (List<String>) resInt.get("types");
        if (types != null && !types.isEmpty()) {
            nouvelleCarte.setType(types.get(0)); // Je prends le premier type (ex: Fire)
        }

        Map<String, Object> images = (Map<String, Object>) resInt.get("images");
        nouvelleCarte.setImageUrl((String) images.get("large"));

        try {
            Map<String, Object> tcgPlayer = (Map<String, Object>) resInt.get("tcgplayer");
            Map<String, Object> prices = (Map<String, Object>) tcgPlayer.get("prices");
            Map<String, Object> details = (prices.containsKey("holofoil")) ?
                    (Map<String, Object>) prices.get("holofoil") :
                    (Map<String, Object>) prices.get("normal");

            Double marketPrice = (Double) details.get("market");
            nouvelleCarte.setPrix(BigDecimal.valueOf(marketPrice));
        } catch (Exception e) {
            nouvelleCarte.setPrix(BigDecimal.ZERO);
        }

        return carteRepository.save(nouvelleCarte);
    }

    // 3. MES MÉTHODES DE FILTRAGE (Ticket #5)
    public List<Carte> chercherParType(String type) {
        return carteRepository.findByType(type);
    }

    public List<Carte> chercherParRarete(String rarete) {
        return carteRepository.findByRarete(rarete);
    }

    public List<Carte> recupererToutesLesCartes() {
        return carteRepository.findAll();
    }

    public Carte sauvegarderEnCache(Carte carte) {
        return carteRepository.save(carte);
    }
}