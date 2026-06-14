package com.poketcg.identityservice.entities;

import jakarta.persistence.*;
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

    @Column(unique = true, nullable = false, length = 50) // 7. Contraintes UQ et NN du MCD
    private String username;

    @Column(unique = true, nullable = false, length = 100)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String address;

    @Column(nullable = false, length = 20)
    private String role;
}