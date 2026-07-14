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

    // 1. LOGIQUE DE FUSION FRANÇAISE (IDENTIQUE)
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

    // 2. FUSION PAR EXTENSION (GARDÉE ET SÉCURISÉE PAR CACHE)
    public List<Map<String, Object>> recupererCartesParExtension(String setId) {

        // ÉTAPE DE SÉCURITÉ  (VÉRIFICATION DU CACHE)
        // Avant d'appeler l'API, je regarde si mon MongoDB possède déjà cette extension
        // J'utilise l'ID technique (ex: base1, swsh1, etc.)
        List<Carte> cartesEnCache = carteRepository.findByExtension(setId);

        if (!cartesEnCache.isEmpty()) {
            System.out.println("RIGUEUR HABIB : Extension [" + setId + "] chargée depuis MongoDB (Cache Actif)");
            List<Map<String, Object>> resLocal = new ArrayList<>();
            for (Carte c : cartesEnCache) {
                Map<String, Object> m = new HashMap<>();
                m.put("id", c.getIdApiUnique());
                m.put("name", c.getNomFr());
                // Je recrée la structure attendue par le Front-end
                Map<String, String> imgs = new HashMap<>();
                imgs.put("large", c.getImageUrl());
                m.put("images", imgs);
                m.put("prixFinal", c.getPrix().toString());
                resLocal.add(m);
            }
            return resLocal; // ✅ Je renvoie les données locales instantanément
        }

        // --- SI LE CACHE EST VIDE, ON CONTINUE AVEC TON CODE D'ORIGINE ---
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

        //  BOUCLE DE CALCUL ET D'ASPIRATION DANS LE CACHE
        for (Map<String, Object> cInt : finalCards) {
            String idCard = (String) cInt.get("id"); // L'ID unique (ex: base1-4)
            String number = (String) cInt.get("number");

            // 1. On applique les noms français si dispo
            if (frenchDataMap.containsKey(number)) {
                Map<String, String> fr = frenchDataMap.get(number);
                cInt.put("name", fr.get("name"));
                if (fr.containsKey("image") && fr.get("image") != null) {
                    Map<String, Object> images = (Map<String, Object>) cInt.get("images");
                    if (images != null) { images.put("large", fr.get("image")); }
                }
            }

            // 2. On pré-calcule le prix pour le Front-end
            cInt.put("prixFinal", "0.00");
            if (cInt.containsKey("tcgplayer")) {
                Map<String, Object> tcg = (Map<String, Object>) cInt.get("tcgplayer");
                if (tcg.containsKey("prices")) {
                    Map<String, Object> p = (Map<String, Object>) tcg.get("prices");
                    for (Object key : p.keySet()) {
                        Map<String, Object> details = (Map<String, Object>) p.get(key);
                        if (details.get("market") != null) {
                            cInt.put("prixFinal", details.get("market").toString());
                            break;
                        }
                    }
                }
            }

            // ⭐ HABIB : C'EST ICI QU'ON ASPIRE DANS MONGO POUR L'EXAMEN ⭐
            // Si la carte n'est pas déjà dans mon MongoDB, je l'enregistre
            if (carteRepository.findByIdApiUnique(idCard).isEmpty()) {
                Carte c = new Carte();
                c.setIdApiUnique(idCard);
                c.setNomFr((String) cInt.get("name"));
                c.setExtension(setId); // TRÈS IMPORTANT : On lie la carte au setId (ex: base1)

                Map<String, Object> images = (Map<String, Object>) cInt.get("images");
                if (images != null) { c.setImageUrl((String) images.get("large")); }

                try {
                    c.setPrix(new BigDecimal(cInt.get("prixFinal").toString()));
                } catch (Exception e) { c.setPrix(BigDecimal.ZERO); }

                carteRepository.save(c); // On l'enregistre en cache
                System.out.println("Cache : Carte [" + c.getNomFr() + "] mise en sécurité dans MongoDB.");
            }
        }
        return finalCards;
    }

    // ⭐ MA LOGIQUE DE RECHERCHE BILINGUE (SÉCURISÉE)
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
        } catch (Exception e) {}

        try {
            Map<String, Object> resIntRaw = (Map<String, Object>) pokemonTcgProxy.searchCardsByName("name:\"" + nomPourRechercheHD + "*\"");
            if (resIntRaw != null && resIntRaw.get("data") != null) { finalCards = (List<Map<String, Object>>) resIntRaw.get("data"); }
        } catch (Exception e) {}

        return finalCards;
    }

    public Carte recupererOuImporter(String idApi) {
        // J'utilise le nouveau retour en List du Repository
        List<Carte> cartesEnBase = carteRepository.findByIdApiUnique(idApi);

        // Si ma liste n'est pas vide, je renvoie la première carte trouvée
        // Même s'il y a un doublon en base, le service ne crash plus !
        if (!cartesEnBase.isEmpty()) {
            return cartesEnBase.get(0);
        }

        // Sinon, je lance l'importation normale
        return importerCarteDepuisApis(idApi);
    }

    // MA MÉTHODE D'IMPORTATION (SÉCURISÉE CONTRE LE CRASH 404)
    public Carte importerCarteDepuisApis(String idApi) {
        // A. J'appelle d'abord l'international (Source fiable à 100%)
        Map<String, Object> resIntRaw = (Map<String, Object>) pokemonTcgProxy.getCardDetails(idApi);
        Map<String, Object> resInt = (Map<String, Object>) resIntRaw.get("data");

        // B. Je tente le Français (Si 404, j'attrape l'erreur pour ne pas crasher)
        Map<String, Object> resFr = null;
        try {
            resFr = (Map<String, Object>) tcgDexProxy.getCardDetailsFr(idApi);
        } catch (Exception e) {
            System.out.println("Note : Traduction FR non disponible pour " + idApi + ". On continue en anglais.");
        }

        Carte nouvelleCarte = new Carte();
        nouvelleCarte.setIdApiUnique(idApi);

        // Si le français a échoué (resFr null), je prends les données anglaises mondiales
        nouvelleCarte.setNomFr(resFr != null ? (String) resFr.get("name") : (String) resInt.get("name"));

        Map<String, Object> setFr = (resFr != null) ? (Map<String, Object>) resFr.get("set") : null;
        nouvelleCarte.setExtension(setFr != null ? (String) setFr.get("name") : "Série Inconnue");

        nouvelleCarte.setRarete((String) resInt.get("rarity"));
        List<String> types = (List<String>) resInt.get("types");
        if (types != null && !types.isEmpty()) { nouvelleCarte.setType(types.get(0)); }
        Map<String, Object> images = (Map<String, Object>) resInt.get("images");
        nouvelleCarte.setImageUrl((String) images.get("large"));

        // MA LOGIQUE DE RECHERCHE DE PRIX MULTI-SOURCES
        try {
            Map<String, Object> tcgPlayer = (Map<String, Object>) resInt.get("tcgplayer");
            Map<String, Object> prices = (Map<String, Object>) tcgPlayer.get("prices");

            Map<String, Object> sel = null;
            if (prices.containsKey("holofoil")) sel = (Map<String, Object>) prices.get("holofoil");
            else if (prices.containsKey("normal")) sel = (Map<String, Object>) prices.get("normal");
            else if (prices.containsKey("reverseHolofoil")) sel = (Map<String, Object>) prices.get("reverseHolofoil");

            if (sel != null) {
                Double marketPrice = (Double) sel.get("market");
                nouvelleCarte.setPrix(BigDecimal.valueOf(marketPrice));
            }
        } catch (Exception e) { nouvelleCarte.setPrix(BigDecimal.ZERO); }

        return carteRepository.save(nouvelleCarte);
    }

    public List<Carte> chercherParType(String type) { return carteRepository.findByType(type); }
    public List<Carte> chercherParRarete(String rarete) { return carteRepository.findByRarete(rarete); }
    public List<Carte> recupererToutesLesCartes() { return carteRepository.findAll(); }
    public Carte sauvegarderEnCache(Carte carte) { return carteRepository.save(carte); }

    // La "Super-Aspiration" pour RECUPERER SUR MONGO ⭐
    public String peuplerLeCache(String setId) {
        // 1. On récupère toutes les cartes de l'API (Logique existante)
        List<Map<String, Object>> cartesAPI = recupererCartesParExtension(setId);

        // 2. On les enregistre une par une en base MongoDB
        for (Map<String, Object> cMap : cartesAPI) {
            String idApi = (String) cMap.get("id");

            // Si la carte n'est pas déjà là, on l'importe
            if (carteRepository.findByIdApiUnique(idApi).isEmpty()) {
                importerCarteDepuisApis(idApi);
            }
        }
        return "Extension " + setId + " aspirée avec succès dans MongoDB !";
    }
}