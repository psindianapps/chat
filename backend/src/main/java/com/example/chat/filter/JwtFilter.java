package com.example.chat.filter;

import com.example.chat.service.UserDetailServiceImpl;
import com.example.chat.utils.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
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

        HttpMethod method = exchange.getRequest().getMethod();

        if (method == HttpMethod.OPTIONS) {
            return chain.filter(exchange);
        }

        String path = exchange.getRequest()
                .getURI()
                .getPath();

        if (path.startsWith("/public") ||
                path.startsWith("/auth")) {

            return chain.filter(exchange);
        }

        // Public APIs ko JWT ki zarurat nahi
        if (path.startsWith("/public") ||
                path.startsWith("/auth")) {

            return chain.filter(exchange);
        }

        if (path.equals("/chat")) {

            String wsToken = exchange.getRequest()
                    .getQueryParams()
                    .getFirst("token");

            if (wsToken != null) {

                ServerHttpRequest mutatedRequest = exchange.getRequest()
                        .mutate()
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + wsToken)
                        .build();

                exchange = exchange.mutate()
                        .request(mutatedRequest)
                        .build();
            }
        }

        String authorizationHeader = exchange.getRequest()
                .getHeaders()
                .getFirst(HttpHeaders.AUTHORIZATION);


        // Token missing
        if ((authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) ) {

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
            final ServerWebExchange finalExchange = exchange;
            return Mono.fromCallable(() ->
                            userDetailService.loadUserByUsername(username)
                    )
                    .subscribeOn(reactor.core.scheduler.Schedulers.boundedElastic())
                    .flatMap(userDetails -> {

                        if (!userDetails.isEnabled()) {
                            return unauthorized(finalExchange);
                        }

                        if (!jwtUtils.validateToken(token)) {
                            return unauthorized(finalExchange);
                        }

                        Authentication authentication =
                                new UsernamePasswordAuthenticationToken(
                                        userDetails,
                                        null,
                                        userDetails.getAuthorities()
                                );

                        return chain.filter(finalExchange)
                                .contextWrite(
                                        ReactiveSecurityContextHolder
                                                .withAuthentication(authentication)
                                );
                    })
                    .onErrorResume(error ->
                            unauthorized(finalExchange)
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