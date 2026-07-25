package com.poketcg.walletservice.services;

import com.poketcg.walletservice.entities.Portefeuille;
import com.poketcg.walletservice.repositories.PortefeuilleRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PortefeuilleServiceTest {

    @Mock
    private PortefeuilleRepository portefeuilleRepository;

    @InjectMocks
    private PortefeuilleService portefeuilleService;

    @Test
    void testRecupererSolde_Success() {
        // 1. Préparation (GIVEN) : On simule un portefeuille en base
        Portefeuille mockPortefeuille = new Portefeuille();
        mockPortefeuille.setIdDresseur(7L);
        when(portefeuilleRepository.findByIdDresseur(7L)).thenReturn(Optional.of(mockPortefeuille));

        // 2. Exécution (WHEN) : On appelle la méthode du service
        Portefeuille result = portefeuilleService.recupererSolde(7L);

        // 3. Vérification (THEN) : On vérifie que le résultat est correct
        assertNotNull(result, "Le résultat ne devrait pas être nul");
        assertEquals(7L, result.getIdDresseur(), "L'ID dresseur devrait être 7");

        // On vérifie que le Repository a bien été sollicité une seule fois
        verify(portefeuilleRepository, times(1)).findByIdDresseur(7L);
    }
}