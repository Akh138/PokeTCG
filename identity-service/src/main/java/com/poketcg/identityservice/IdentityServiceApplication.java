package com.poketcg.identityservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication
@EnableFeignClients // J'active Feign pour que ce service puisse appeler le Wallet et les autres
public class IdentityServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(IdentityServiceApplication.class, args);
    }

}
