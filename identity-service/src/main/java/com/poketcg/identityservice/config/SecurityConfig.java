package com.poketcg.identityservice.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity // Je dis à Spring que c'est ici que je règle la sécurité
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // 1. Je désactive le CSRF (nécessaire pour les APIs REST)
                .csrf(csrf -> csrf.disable())

                // 2. Je définis les règles d'accès aux URLs
                .authorizeHttpRequests(auth -> auth
                        // J'autorise tout le monde à accéder aux routes d'authentification (inscription/connexion)
                        .requestMatchers("/api/auth/**").permitAll()
                        // Toutes les autres requêtes devront être authentifiées
                        .anyRequest().authenticated()
                );

        return http.build();
    }

    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        // Cet outil servira à crypter les mots de passe partout dans l'appli
        return new BCryptPasswordEncoder();
    }
}