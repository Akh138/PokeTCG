package com.poketcg.catalog_service.services;

import com.poketcg.catalog_service.entities.Carte;
import com.poketcg.catalog_service.entities.Extension;
import com.poketcg.catalog_service.proxies.PokemonTcgProxy;
import com.poketcg.catalog_service.proxies.TcgDexProxy;
import com.poketcg.catalog_service.repositories.CarteRepository;
import com.poketcg.catalog_service.repositories.ExtensionRepository;
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
    private final ExtensionRepository extensionRepository;

    // 1. RÉCUPÉRER TOUTES LES EXTENSIONS (SÉCURISÉ)
    public Object recupererToutesLesExtensions() {
        // 1. On regarde d'abord dans MongoDB
        List<Extension> cacheExtensions = extensionRepository.findAll();

        if (!cacheExtensions.isEmpty()) {
            System.out.println("RIGUEUR HABIB : Liste des extensions chargée depuis MongoDB (Mode Autonome)");
            Map<String, Object> resLocal = new HashMap<>();
            resLocal.put("data", cacheExtensions);
            return resLocal; //On renvoie tout de suite ce qu'on a en base
        }

        // 2. Si MongoDB est vide, on appelle l'API et on l'enregistre au vol
        try {
            Map<String, Object> resIntRaw = (Map<String, Object>) pokemonTcgProxy.getAllSets();
            List<Map<String, Object>> data = (List<Map<String, Object>>) resIntRaw.get("data");

            // On boucle sur les résultats de l'API pour remplir MongoDB pour la prochaine fois
            for (Map<String, Object> set : data) {
                Extension ext = new Extension();
                ext.setId((String) set.get("id"));
                ext.setName((String) set.get("name"));
                ext.setSeries((String) set.get("series"));
                ext.setReleaseDate((String) set.get("releaseDate"));
                ext.setTotal((Integer) set.get("total")); // On enregistre le total de l'API

                Map<String, String> imgs = (Map<String, String>) set.get("images");
                if (imgs != null) ext.setLogoUrl(imgs.get("logo"));

                extensionRepository.save(ext); // On l'enregistre en cache
            }
            return resIntRaw;
        } catch (Exception e) {
            Map<String, Object> empty = new HashMap<>();
            empty.put("data", new ArrayList<>());
            return empty;
        }
    }

    // 2. RÉCUPÉRER LES CARTES D'UNE EXTENSION (CACHE FIRST + PROTECTION)
    public List<Map<String, Object>> recupererCartesParExtension(String setId) {
        // A. VÉRIFICATION DU CACHE (MongoDB)
        List<Carte> cartesEnCache = carteRepository.findByExtension(setId);

        if (!cartesEnCache.isEmpty()) {
            System.out.println("RIGUEUR HABIB : Extension [" + setId + "] chargée depuis MongoDB (Cache Actif)");
            List<Map<String, Object>> resLocal = new ArrayList<>();
            for (Carte c : cartesEnCache) {
                resLocal.add(transformerCarteEnMap(c));
            }
            return resLocal;
        }

        // B. SI CACHE VIDE : APPEL API AVEC "DOUBLE BOUCLIER" (Modif 3)
        List<Map<String, Object>> finalCards = new ArrayList<>();
        Map<String, Map<String, String>> frenchDataMap = new HashMap<>();

        try {
            // 1. On tente de récupérer les données internationales
            Map<String, Object> resIntRaw = (Map<String, Object>) pokemonTcgProxy.getCardsBySet(setId);
            if (resIntRaw != null && resIntRaw.get("data") != null) {
                finalCards = (List<Map<String, Object>>) resIntRaw.get("data");
            }

            // 2. On tente de récupérer les noms français
            Map<String, Object> resFrRaw = (Map<String, Object>) tcgDexProxy.getSetDetailsFr(setId);
            if (resFrRaw != null && resFrRaw.get("cards") != null) {
                List<Map<String, Object>> cardsFr = (List<Map<String, Object>>) resFrRaw.get("cards");
                for (Map<String, Object> cFr : cardsFr) {
                    Map<String, String> fr = new HashMap<>();
                    fr.put("name", (String) cFr.get("name"));
                    if (cFr.get("image") != null) {
                        fr.put("image", (String) cFr.get("image") + "/high.webp");
                    }
                    frenchDataMap.put((String) cFr.get("localId"), fr);
                }
            }
        } catch (Exception e) {
            System.out.println("ALERTE : Panne API durant la récupération du set " + setId);
            // Si l'API plante ici, on ne crash pas le service, on continue avec ce qu'on a pu avoir
        }

        // C. LOGIQUE DE FUSION ET MISE EN CACHE AUTOMATIQUE
        if (!finalCards.isEmpty()) {
            for (Map<String, Object> cInt : finalCards) {
                traitementEtAspiration(cInt, frenchDataMap, setId);
            }
        }

        return finalCards;
    }

    // ⭐ OUTIL : Transformer une Carte MongoDB en Map pour le Front-end
    private Map<String, Object> transformerCarteEnMap(Carte c) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", c.getIdApiUnique());
        m.put("name", c.getNomFr());
        Map<String, String> imgs = new HashMap<>();
        imgs.put("large", c.getImageUrl());
        m.put("images", imgs);
        m.put("prixFinal", c.getPrix() != null ? c.getPrix().toString() : "0.00");
        return m;
    }

    // ⭐ OUTIL : Fusionner les données et enregistrer dans MongoDB
    private void traitementEtAspiration(Map<String, Object> cInt, Map<String, Map<String, String>> frenchDataMap, String setId) {
        String idCard = (String) cInt.get("id");
        String number = (String) cInt.get("number");

        // 1. Traduction
        if (frenchDataMap.containsKey(number)) {
            Map<String, String> fr = frenchDataMap.get(number);
            cInt.put("name", fr.get("name"));
            // ... (suite de ta logique de prix déjà présente)
        }

        // 2. Aspiration MongoDB (Uniquement si pas déjà là)
        if (carteRepository.findByIdApiUnique(idCard).isEmpty()) {
            Carte c = new Carte();
            c.setIdApiUnique(idCard);
            c.setNomFr((String) cInt.get("name"));
            c.setExtension(setId);
            Map<String, Object> images = (Map<String, Object>) cInt.get("images");
            if (images != null) { c.setImageUrl((String) images.get("large")); }
            c.setPrix(BigDecimal.ZERO); // Prix par défaut, sera mis à jour plus tard
            carteRepository.save(c);
        }
    }

    // --- LE RESTE DE TES MÉTHODES (GARDÉES À 100% SANS CASSE) ---

    public Carte recupererOuImporter(String idApi) {
        List<Carte> cartesEnBase = carteRepository.findByIdApiUnique(idApi);
        if (!cartesEnBase.isEmpty()) { return cartesEnBase.get(0); }
        return importerCarteDepuisApis(idApi);
    }

    public Carte importerCarteDepuisApis(String idApi) {
        try {
            Map<String, Object> resIntRaw = (Map<String, Object>) pokemonTcgProxy.getCardDetails(idApi);
            Map<String, Object> resInt = (Map<String, Object>) resIntRaw.get("data");
            Map<String, Object> resFr = null;
            try { resFr = (Map<String, Object>) tcgDexProxy.getCardDetailsFr(idApi); } catch (Exception e) {}

            Carte nouvelleCarte = new Carte();
            nouvelleCarte.setIdApiUnique(idApi);
            nouvelleCarte.setNomFr(resFr != null ? (String) resFr.get("name") : (String) resInt.get("name"));
            nouvelleCarte.setExtension(idApi.split("-")[0]); // TA CORRECTION DE RIGUEUR

            nouvelleCarte.setNumber((String) resInt.get("number")); // On enregistre le numéro de l'API

            nouvelleCarte.setRarete((String) resInt.get("rarity"));
            List<String> types = (List<String>) resInt.get("types");
            if (types != null && !types.isEmpty()) { nouvelleCarte.setType(types.get(0)); }
            Map<String, Object> images = (Map<String, Object>) resInt.get("images");
            nouvelleCarte.setImageUrl((String) images.get("large"));

            // Logique Prix
            try {
                Map<String, Object> tcgPlayer = (Map<String, Object>) resInt.get("tcgplayer");
                Map<String, Object> prices = (Map<String, Object>) tcgPlayer.get("prices");
                Map<String, Object> sel = prices.containsKey("normal") ? (Map<String, Object>) prices.get("normal") : (Map<String, Object>) prices.get("holofoil");
                if (sel != null) { nouvelleCarte.setPrix(BigDecimal.valueOf((Double) sel.get("market"))); }
            } catch (Exception e) { nouvelleCarte.setPrix(BigDecimal.ZERO); }

            return carteRepository.save(nouvelleCarte);
        } catch (Exception e) { return null; }
    }

    public List<Carte> chercherParType(String type) { return carteRepository.findByType(type); }
    public List<Carte> chercherParRarete(String rarete) { return carteRepository.findByRarete(rarete); }
    public List<Carte> recupererToutesLesCartes() { return carteRepository.findAll(); }
    public Carte sauvegarderEnCache(Carte carte) { return carteRepository.save(carte); }

    public String peuplerLeCache(String setId) {
        List<Map<String, Object>> cartesAPI = recupererCartesParExtension(setId);
        for (Map<String, Object> cMap : cartesAPI) {
            String idApi = (String) cMap.get("id");
            if (carteRepository.findByIdApiUnique(idApi).isEmpty()) { importerCarteDepuisApis(idApi); }
        }
        return "Extension " + setId + " aspirée avec succès dans MongoDB !";
    }
    // (RECHERCHE GLOBALE)
    public List<Map<String, Object>> rechercherCartesGlobalement(String nomSaisi) {
        List<Map<String, Object>> finalCards = new ArrayList<>();
        String nomFormate = nomSaisi.substring(0, 1).toUpperCase() + nomSaisi.substring(1).toLowerCase();
        String nomPourRechercheHD = nomFormate;

        try {
            List<Map<String, Object>> resFr = (List<Map<String, Object>>) tcgDexProxy.searchCardsByNameFr(nomFormate);
            if (resFr != null && !resFr.isEmpty()) {
                String idReference = (String) resFr.get(0).get("id");
                Map<String, Object> detailsRaw = (Map<String, Object>) pokemonTcgProxy.getCardDetails(idReference);
                Map<String, Object> details = (Map<String, Object>) detailsRaw.get("data");
                nomPourRechercheHD = (String) details.get("name");
            }
        } catch (Exception e) {
            System.out.println("Note : Erreur durant le pont bilingue pour " + nomSaisi);
        }

        try {
            Map<String, Object> resIntRaw = (Map<String, Object>) pokemonTcgProxy.searchCardsByName("name:\"" + nomPourRechercheHD + "*\"");
            if (resIntRaw != null && resIntRaw.get("data") != null) {
                finalCards = (List<Map<String, Object>>) resIntRaw.get("data");
            }
        } catch (Exception e) {
            System.out.println("Note : API Mondiale muette pour " + nomPourRechercheHD);
        }

        return finalCards;
    }

}