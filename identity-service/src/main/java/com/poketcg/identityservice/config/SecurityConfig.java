package com.poketcg.identityservice.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import java.util.List;

@Configuration
@EnableWebSecurity // Je dis à Spring que c'est ici que je règle la sécurité
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // 1. Je désactive le CSRF (nécessaire pour les APIs REST)
                .csrf(csrf -> csrf.disable())

                // 2. Je configure les CORS pour que mon futur Front-end puisse appeler l'API
                .cors(cors -> cors.configurationSource(request -> {
                    CorsConfiguration config = new CorsConfiguration();
                    config.setAllowedOrigins(List.of("*"));
                    config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
                    config.setAllowedHeaders(List.of("*"));
                    return config;
                }))

                // 3. Je force la sécurité à être "Stateless" (pas de session stockée sur le serveur)
                // C'est la règle d'or quand on utilise des badges JWT
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // 4. Je définis les règles d'accès aux URLs
                .authorizeHttpRequests(auth -> auth
                        // J'autorise TOUT le monde sur le dossier d'authentification (register, login, delete)
                        .requestMatchers("/api/auth/**").permitAll()
                        // J'autorise l'Actuator pour que Consul voit le service au vert
                        .requestMatchers("/actuator/**").permitAll()
                        .requestMatchers("/error").permitAll()
                        // Tout le reste demande d'être connecté
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