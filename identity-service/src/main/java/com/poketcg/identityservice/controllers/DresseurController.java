package com.poketcg.identityservice.controllers;

import com.poketcg.identityservice.dto.LoginRequest;
import com.poketcg.identityservice.entities.Dresseur;
import com.poketcg.identityservice.services.DresseurService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController // 1. Je dis à Spring que cette classe est une API (elle renvoie du JSON)
@RequestMapping("/api/auth") // 2. Toutes les adresses commenceront par /api/auth
@RequiredArgsConstructor
public class DresseurController {

    private final DresseurService dresseurService;

    // 3. Cette méthode s'occupe de l'inscription (Requête POST).
    @PostMapping("/register")
    public Dresseur register(@RequestBody Dresseur dresseur) {
        // @RequestBody veut dire : "Prends les infos envoyées par l'utilisateur et transforme-les en objet Java"
        return dresseurService.inscription(dresseur);
    }

    // 4. Cette méthode permet de se connecter
    @PostMapping("/login")
    public String login(@RequestBody LoginRequest loginRequest) {
        // On appelle le service pour vérifier l'identité et récupérer le badge JWT
        return dresseurService.connexion(loginRequest.getUsername(), loginRequest.getPassword());
    }
}