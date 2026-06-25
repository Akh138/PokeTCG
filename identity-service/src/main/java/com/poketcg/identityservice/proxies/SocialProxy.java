package com.poketcg.identityservice.proxies;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "social-service", url = "http://localhost:8086/api/social")
public interface SocialProxy {
    @DeleteMapping("/forum/author/{idAuthor}")
    void deleteByAuthor(@PathVariable("idAuthor") Long idAuthor);
}
