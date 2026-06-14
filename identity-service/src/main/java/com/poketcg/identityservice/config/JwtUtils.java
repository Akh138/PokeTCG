package com.poketcg.identityservice.config;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;
import java.security.Key;
import java.util.Date;

@Component // Je dis à Spring que c'est un outil réutilisable
public class JwtUtils {

    // 1. Une clé secrète pour signer le badge (comme un sceau de cire)
    private final Key key = Keys.secretKeyFor(SignatureAlgorithm.HS256);

    // 2. Cette méthode fabrique le badge (le Token)
    public String generateToken(String username) {
        return Jwts.builder()
                .setSubject(username) // Le nom du dresseur sur le badge
                .setIssuedAt(new Date()) // Date de création
                .setExpiration(new Date(System.currentTimeMillis() + 86400000)) // Expire dans 24h et pour 1h : (new Date(System.currentTimeMillis() + 3600000))
                .signWith(key) // Signature avec la clé secrète
                .compact();
    }
}