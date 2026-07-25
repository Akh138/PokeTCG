# ⚡ PokeTCG - Écosystème Microservices

## 📋 Présentation
PokeTCG est une plateforme sécurisée pour collectionneurs de cartes Pokémon, basée sur une architecture distribuée de 6 microservices.

## 🏗️ Architecture Technique
- **Backend :** Java 17, Spring Boot, Spring Cloud (Feign, Consul).
- **Frontend :** Vanilla JavaScript (SPA), HTML5, CSS3 (Glassmorphism).
- **Bases de données :** MySQL 8.0 (Finance) & MongoDB (Catalogue).
- **Orchestration :** Docker & Docker-Compose.

## 🚀 Procédure de déploiement
1. **Prérequis :** Docker Desktop installé.
2. **Compilation :** `mvn clean package -DskipTests` dans chaque dossier de service.
3. **Lancement :** `docker-compose up --build` à la racine du projet.
4. **Accès :**
    - Site Web : http://localhost
    - Supervision : http://localhost:8500 (Consul)