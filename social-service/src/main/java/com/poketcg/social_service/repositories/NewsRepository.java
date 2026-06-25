package com.poketcg.social_service.repositories;
import com.poketcg.social_service.entities.News;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface NewsRepository extends MongoRepository<News, String> { }