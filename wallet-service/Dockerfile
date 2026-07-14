# 1. Image Java 17 légère
FROM eclipse-temurin:17-jdk-alpine

# 2. Dossier de travail
WORKDIR /app

# 3. On copie le JAR généré dans target vers le conteneur
# On utilise un nom générique 'app.jar' pour simplifier
COPY target/*.jar app.jar

# 4. Commande de lancement
ENTRYPOINT ["java", "-jar", "app.jar"]