package com.url.shortener.service;

import com.url.shortener.models.UrlMapping;
import com.url.shortener.repository.UrlMappingRepository;
import com.url.shortener.utils.ShortUrlBloomFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor

public class UrlRedirectService {

    private final UrlMappingRepository urlMappingRepository;
    private final StringRedisTemplate redisTemplate;
    private final ShortUrlBloomFilter shortUrlBloomFilter;

    public String getOriginalUrl(String shortUrl){
        if(!shortUrlBloomFilter.mightContain(shortUrl)){
            return null;
        }

        String cacheUrl = redisTemplate.opsForValue().get("short:" +shortUrl);
        if(cacheUrl != null){
            redisTemplate.opsForValue().increment("click:" +shortUrl);
            return cacheUrl;
        }

        UrlMapping mapping = urlMappingRepository.findByShortUrl(shortUrl);
        if(mapping != null){
            redisTemplate.opsForValue().set("short:"+shortUrl,mapping.getOriginalUrl(),7, TimeUnit.DAYS);
            redisTemplate.opsForValue().increment("click:" +shortUrl);
            return mapping.getOriginalUrl();

        }
        return null;
    }
}
