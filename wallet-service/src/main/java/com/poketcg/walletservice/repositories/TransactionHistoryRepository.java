package com.poketcg.walletservice.repositories;

import com.poketcg.walletservice.entities.TransactionHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TransactionHistoryRepository extends JpaRepository<TransactionHistory, Long> {

    //Je cherche l'historique d'un dresseur trié du plus récent au plus ancien
    java.util.List<TransactionHistory> findByIdDresseurOrderByDateDesc(Long idDresseur);
}