package com.poketcg.catalog_service.repositories;

import com.poketcg.catalog_service.entities.Extension;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ExtensionRepository extends MongoRepository<Extension, String> {
    // findAll() suffit pour l'accueil
}