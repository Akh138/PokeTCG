package com.poketcg.identityservice.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity // 1. Je dis à Spring que cette classe correspond à une table dans MySQL
@Table(name = "dresseurs") // 2. Je donne le nom exact de la table qu'on a prévu au MCD
@Data // 3. Grâce à Lombok, les Getters et Setters sont créés automatiquement (gain de temps)
@NoArgsConstructor @AllArgsConstructor // 4. Génère les constructeurs automatiquement
public class Dresseur {

    @Id // 5. C'est ma clé primaire (PK)
    @GeneratedValue(strategy = GenerationType.IDENTITY) // 6. C'est le Auto-Increment (AI)
    private Long id;

    // Je vérifie que le pseudo n'est pas vide et fait entre 3 et 50 caractères
    @NotBlank(message = "Le pseudo est obligatoire")
    @Size(min = 3, max = 50)
    @Column(unique = true, nullable = false, length = 50) // 7. Contraintes UQ et NN du MCD
    private String username;

    // Ma contrainte magique qui vérifie le format @ et le point
    @NotBlank(message = "L'email est obligatoire")
    @Email(message = "Le format de l'email est invalide")
    @Column(unique = true, nullable = false, length = 100)
    private String email;

    @NotBlank(message = "Le mot de passe est obligatoire")
    @Column(nullable = false)
    private String password;

    @NotBlank(message = "L'adresse est obligatoire")
    @Column(nullable = false)
    private String address;

    // J'ajoute le Code Postal avec une vérification de 5 chiffres (Format FR)
    @NotBlank(message = "Le code postal est obligatoire")
    @Pattern(regexp = "^[0-9]{5}$", message = "Le code postal doit contenir 5 chiffres")
    private String zipCode;

    @Column(nullable = false, length = 20)
    private String role;
}