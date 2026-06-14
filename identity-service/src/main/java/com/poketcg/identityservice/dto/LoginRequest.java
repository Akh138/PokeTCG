package com.poketcg.identityservice.dto;

import lombok.Data;

@Data // Génère les Getters/Setters automatiquement
public class LoginRequest {
    private String username;
    private String password;
}