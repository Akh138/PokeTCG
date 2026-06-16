package com.poketcg.walletservice.entities;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "transactions_history")
@Data @NoArgsConstructor @AllArgsConstructor
public class TransactionHistory {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long idDresseur;
    private BigDecimal montant;
    private String type; // DEPOSIT, PURCHASE, SALE
    private LocalDateTime date;
}