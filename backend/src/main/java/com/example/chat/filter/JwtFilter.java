package com.example.chat.filter;

import com.example.chat.service.UserDetailServiceImpl;
import com.example.chat.utils.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

@Component
public class JwtFilter implements WebFilter {

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private UserDetailServiceImpl userDetailService;

    @Override
    public Mono<Void> filter(
            ServerWebExchange exchange,
            WebFilterChain chain) {

        String path = exchange.getRequest()
                .getURI()
                .getPath();

        // Public APIs ko JWT ki zarurat nahi
        if (path.startsWith("/public") ||
                path.startsWith("/auth")) {

            return chain.filter(exchange);
        }

        String authorizationHeader = exchange.getRequest()
                .getHeaders()
                .getFirst(HttpHeaders.AUTHORIZATION);

        // Token missing
        if (authorizationHeader == null ||
                !authorizationHeader.startsWith("Bearer ")) {

            return unauthorized(exchange);
        }

        String token = authorizationHeader.substring(7);

        try {

            String username = jwtUtils.extractUsername(token);

            if (username == null) {
                return unauthorized(exchange);
            }

            /*
             * UserDetailService ka current implementation
             * synchronous hai, isliye blocking call ko
             * boundedElastic thread par execute kar rahe hain.
             */
            return Mono.fromCallable(() ->
                            userDetailService.loadUserByUsername(username)
                    )
                    .subscribeOn(reactor.core.scheduler.Schedulers.boundedElastic())
                    .flatMap(userDetails -> {

                        if (!userDetails.isEnabled()) {
                            return unauthorized(exchange);
                        }

                        if (!jwtUtils.validateToken(token)) {
                            return unauthorized(exchange);
                        }

                        Authentication authentication =
                                new UsernamePasswordAuthenticationToken(
                                        userDetails,
                                        null,
                                        userDetails.getAuthorities()
                                );

                        return chain.filter(exchange)
                                .contextWrite(
                                        ReactiveSecurityContextHolder
                                                .withAuthentication(authentication)
                                );
                    })
                    .onErrorResume(error ->
                            unauthorized(exchange)
                    );

        } catch (Exception e) {
            return unauthorized(exchange);
        }
    }

    private Mono<Void> unauthorized(ServerWebExchange exchange) {

        exchange.getResponse()
                .setStatusCode(HttpStatus.UNAUTHORIZED);

        return exchange.getResponse().setComplete();
    }
}