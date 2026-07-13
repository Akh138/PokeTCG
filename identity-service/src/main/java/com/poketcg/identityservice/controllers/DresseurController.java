package com.poketcg.identityservice.controllers;

import com.poketcg.identityservice.dto.LoginRequest;
import com.poketcg.identityservice.entities.Dresseur;
import com.poketcg.identityservice.services.DresseurService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin("*") // J'autorise mon site web à appeler mon service pour s'inscrire ou se connecter
@RestController // 1. Je dis à Spring que cette classe est une API (elle renvoie du JSON)
@RequestMapping("/api/auth") // 2. Toutes les adresses commenceront par /api/auth
@RequiredArgsConstructor
public class DresseurController {

    private final DresseurService dresseurService;

    // 3. Cette méthode s'occupe de l'inscription (Requête POST).
    @PostMapping("/register")
    public Dresseur register(@Valid @RequestBody Dresseur dresseur) { // J'ajoute @Valid pour dire à Spring de vérifier les contraintes de l'entité
        // @RequestBody veut dire : "Prends les infos envoyées par l'utilisateur et transforme-les en objet Java"
        return dresseurService.inscription(dresseur);
    }

    // 4. Cette méthode permet de se connecter
    @PostMapping("/login")
    public String login(@RequestBody LoginRequest loginRequest) {
        // On appelle le service pour vérifier l'identité et récupérer le badge JWT
        return dresseurService.connexion(loginRequest.getUsername(), loginRequest.getPassword());
    }

    // 5. Supprimer un dresseur (Droit à l'oubli / RGPD)
    // J'utilise DELETE pour signifier une suppression de ressource
    @DeleteMapping("/delete/{id}")
    public String deleteAccount(@PathVariable Long id) {
        dresseurService.supprimerCompte(id);
        return "Succès : Votre compte dresseur a été supprimé ainsi que vos données personnelles.";
    }

    // Cette route permet au JavaScript de demander les infos (Email, Adresse)
    // On utilise le pseudo dans l'URL pour cibler le bon dresseur
    @GetMapping("/user/{username}")
    public Dresseur getProfile(@PathVariable String username) {
        return dresseurService.recupererProfil(username);
    }

    // Route pour modifier son profil (Adresse et Téléphone)
    @PutMapping("/update/{username}")
    public Dresseur updateProfile(@PathVariable String username, @RequestBody Dresseur dresseur) {
        return dresseurService.mettreAJourProfil(username, dresseur);
    }

    //  Route indispensable pour traduire l'ID du vendeur en Pseudo sur le Marché
    @GetMapping("/id/{id}")
    public Dresseur getById(@PathVariable Long id) {
        return dresseurService.trouverParId(id);
    }

    //  Route Admin pour voir toute la base de données
    @GetMapping("/all")
    public List<Dresseur> getAllTrainers() {
        return dresseurService.recupererTousLesDresseurs();
    }
}