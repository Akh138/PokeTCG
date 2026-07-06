package com.poketcg.catalog_service.services;

import com.poketcg.catalog_service.entities.Carte;
import com.poketcg.catalog_service.proxies.PokemonTcgProxy;
import com.poketcg.catalog_service.proxies.TcgDexProxy;
import com.poketcg.catalog_service.repositories.CarteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CarteService {

    private final CarteRepository carteRepository;
    private final PokemonTcgProxy pokemonTcgProxy;
    private final TcgDexProxy tcgDexProxy;

    // 1. LOGIQUE DE FUSION FRANÇAISE (GARDÉE)
    public Object recupererToutesLesExtensions() {
        Map<String, Object> resIntRaw = (Map<String, Object>) pokemonTcgProxy.getAllSets();
        List<Map<String, Object>> setsInt = (List<Map<String, Object>>) resIntRaw.get("data");
        List<Map<String, Object>> setsFr = (List<Map<String, Object>>) tcgDexProxy.getAllSetsFr();
        Map<String, String> dictionnaireFr = new HashMap<>();
        for (Map<String, Object> sFr : setsFr) { dictionnaireFr.put((String) sFr.get("id"), (String) sFr.get("name")); }
        for (Map<String, Object> sInt : setsInt) {
            String idSet = (String) sInt.get("id");
            if (dictionnaireFr.containsKey(idSet)) { sInt.put("name", dictionnaireFr.get(idSet)); }
        }
        return resIntRaw;
    }

    // 2. FUSION PAR EXTENSION (GARDÉE)
    public List<Map<String, Object>> recupererCartesParExtension(String setId) {
        List<Map<String, Object>> finalCards = new ArrayList<>();
        try {
            Map<String, Object> resIntRaw = (Map<String, Object>) pokemonTcgProxy.getCardsBySet(setId);
            if (resIntRaw != null && resIntRaw.get("data") != null) { finalCards = (List<Map<String, Object>>) resIntRaw.get("data"); }
        } catch (Exception e) { System.out.println("API Internationale muette pour : " + setId); }

        Map<String, Map<String, String>> frenchDataMap = new HashMap<>();
        try {
            Map<String, Object> resFrRaw = (Map<String, Object>) tcgDexProxy.getSetDetailsFr(setId);
            List<Map<String, Object>> cardsFr = (List<Map<String, Object>>) resFrRaw.get("cards");
            if (cardsFr != null) {
                for (Map<String, Object> cFr : cardsFr) {
                    Map<String, String> fr = new HashMap<>();
                    fr.put("name", (String) cFr.get("name"));
                    if (cFr.get("image") != null) { fr.put("image", (String) cFr.get("image") + "/high.webp"); }
                    frenchDataMap.put((String) cFr.get("localId"), fr);
                }
            }
        } catch (Exception e) { System.out.println("Note : Aucune donnée FR pour " + setId); }

        if (finalCards.isEmpty() && !frenchDataMap.isEmpty()) {
            for (Map.Entry<String, Map<String, String>> entry : frenchDataMap.entrySet()) {
                Map<String, Object> fallbackCard = new HashMap<>();
                fallbackCard.put("name", entry.getValue().get("name"));
                Map<String, String> imgs = new HashMap<>();
                imgs.put("large", entry.getValue().get("image"));
                fallbackCard.put("images", imgs);
                finalCards.add(fallbackCard);
            }
            return finalCards;
        }

        for (Map<String, Object> cInt : finalCards) {
            String number = (String) cInt.get("number");
            if (frenchDataMap.containsKey(number)) {
                Map<String, String> fr = frenchDataMap.get(number);
                cInt.put("name", fr.get("name"));
                if (fr.containsKey("image") && fr.get("image") != null) {
                    Map<String, Object> images = (Map<String, Object>) cInt.get("images");
                    if (images != null) { images.put("large", fr.get("image")); }
                }
            }
        }
        return finalCards;
    }

    // ⭐ MA LOGIQUE DE RECHERCHE BILINGUE (VERSION FINALE - LA PLUS ROBUSTE)
    public List<Map<String, Object>> rechercherCartesGlobalement(String nomSaisi) {
        List<Map<String, Object>> finalCards = new ArrayList<>();

        // Je prépare le nom avec la première lettre en majuscule (ex: Dracaufeu)
        String nomFormate = nomSaisi.substring(0, 1).toUpperCase() + nomSaisi.substring(1).toLowerCase();
        String nomPourRechercheHD = nomFormate;

        // ÉTAPE 1 : Trouver le nom anglais via une recherche ciblée
        try {
            // A. Je cherche une carte portant ce nom sur l'API FR
            List<Map<String, Object>> cardsFr = (List<Map<String, Object>>) tcgDexProxy.searchCardsByNameFr(nomFormate);

            if (cardsFr != null && !cardsFr.isEmpty()) {
                // B. Je prends l'ID de la première carte (ex: base1-4)
                String idUniversel = (String) cardsFr.get(0).get("id");

                // C. Je demande son nom anglais à l'international
                Map<String, Object> resInt = (Map<String, Object>) pokemonTcgProxy.getCardDetails(idUniversel);
                Map<String, Object> data = (Map<String, Object>) resInt.get("data");

                nomPourRechercheHD = (String) data.get("name");
                System.out.println("INFO : Pont réussi ! [" + nomFormate + "] -> [" + nomPourRechercheHD + "]");
            }
        } catch (Exception e) {
            System.out.println("LOG : Pas de traduction trouvée. Tentative recherche directe.");
        }

        // ÉTAPE 2 : Recherche Mondiale HD avec le nom anglais (ex: Charizard)
        try {
            Map<String, Object> resIntRaw = (Map<String, Object>) pokemonTcgProxy.searchCardsByName("name:\"" + nomPourRechercheHD + "*\"");
            if (resIntRaw != null && resIntRaw.get("data") != null) {
                finalCards = (List<Map<String, Object>>) resIntRaw.get("data");
            }
        } catch (Exception e) {
            System.out.println("ERREUR : L'API Internationale ne répond pas.");
        }

        // ÉTAPE 3 : Traduction des résultats (Optionnel mais plus propre)
        try {
            List<Map<String, Object>> trads = (List<Map<String, Object>>) tcgDexProxy.searchCardsByNameFr(nomFormate);
            Map<String, String> dico = new HashMap<>();
            if (trads != null) {
                for (Map<String, Object> t : trads) {
                    dico.put((String) t.get("id"), (String) t.get("name"));
                }
            }
            for (Map<String, Object> c : finalCards) {
                String id = (String) c.get("id");
                if (dico.containsKey(id)) {
                    c.put("name", dico.get(id));
                }
            }
        } catch (Exception e) {}

        return finalCards;
    }

    public Carte recupererOuImporter(String idApi) { return carteRepository.findByIdApiUnique(idApi).orElseGet(() -> importerCarteDepuisApis(idApi)); }
    public Carte importerCarteDepuisApis(String idApi) {
        Map<String, Object> resFr = (Map<String, Object>) tcgDexProxy.getCardDetailsFr(idApi);
        Map<String, Object> resIntRaw = (Map<String, Object>) pokemonTcgProxy.getCardDetails(idApi);
        Map<String, Object> resInt = (Map<String, Object>) resIntRaw.get("data");
        Carte nouvelleCarte = new Carte();
        nouvelleCarte.setIdApiUnique(idApi);
        nouvelleCarte.setNomFr((String) resFr.get("name"));
        Map<String, Object> setFr = (Map<String, Object>) resFr.get("set");
        nouvelleCarte.setExtension((String) setFr.get("name"));
        nouvelleCarte.setRarete((String) resInt.get("rarity"));
        List<String> types = (List<String>) resInt.get("types");
        if (types != null && !types.isEmpty()) { nouvelleCarte.setType(types.get(0)); }
        Map<String, Object> images = (Map<String, Object>) resInt.get("images");
        nouvelleCarte.setImageUrl((String) images.get("large"));
        try {
            Map<String, Object> tcgPlayer = (Map<String, Object>) resInt.get("tcgplayer");
            Map<String, Object> prices = (Map<String, Object>) tcgPlayer.get("prices");
            Map<String, Object> details = (prices.containsKey("holofoil")) ? (Map<String, Object>) prices.get("holofoil") : (Map<String, Object>) prices.get("normal");
            Double marketPrice = (Double) details.get("market");
            nouvelleCarte.setPrix(BigDecimal.valueOf(marketPrice));
        } catch (Exception e) { nouvelleCarte.setPrix(BigDecimal.ZERO); }
        return carteRepository.save(nouvelleCarte);
    }
    public List<Carte> chercherParType(String type) { return carteRepository.findByType(type); }
    public List<Carte> chercherParRarete(String rarete) { return carteRepository.findByRarete(rarete); }
    public List<Carte> recupererToutesLesCartes() { return carteRepository.findAll(); }
    public Carte sauvegarderEnCache(Carte carte) { return carteRepository.save(carte); }
}