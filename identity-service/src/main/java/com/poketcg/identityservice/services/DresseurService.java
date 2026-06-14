package com.poketcg.identityservice.services;

import com.poketcg.identityservice.config.JwtUtils;
import com.poketcg.identityservice.entities.Dresseur;
import com.poketcg.identityservice.repositories.DresseurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service // C'est ici que j'écris mes règles "métier" (le cerveau)
@RequiredArgsConstructor
public class DresseurService {

    private final DresseurRepository dresseurRepository;
    // Cet outil servira à transformer les mots de passe en charabia illisible (sécurité)
    private final BCryptPasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;

    public Dresseur inscription(Dresseur dresseur) {
        // 1. Je crypte le mot de passe avant de l'enregistrer (BCrypt)
        dresseur.setPassword(passwordEncoder.encode(dresseur.getPassword()));

        // 2. Je donne le rôle de base "USER" par défaut
        dresseur.setRole("ROLE_USER");

        // 3. J'enregistre dans MySQL via le repository
        return dresseurRepository.save(dresseur);
    }

    public String connexion(String username, String password) {
        // 1. On cherche le dresseur dans la base MySQL par son pseudo
        Dresseur dresseur = dresseurRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Dresseur inconnu !"));

        // 2. On compare le mot de passe tapé avec celui qui est crypté en base
        if (passwordEncoder.matches(password, dresseur.getPassword())) {
            // 3. Si c'est bon, on fabrique le badge JWT (valable 1h)
            return jwtUtils.generateToken(username);
        } else {
            throw new RuntimeException("Mot de passe incorrect !");
        }
    }
}