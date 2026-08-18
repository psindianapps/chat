package com.example.chat.specification;

import com.example.chat.entity.UserEntity;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public class UserSpecification {

    public static Specification<UserEntity> searchUsers(String search, Long currentUserId) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            predicates.add(
                    criteriaBuilder.notEqual(
                            root.get("id"),
                            currentUserId
                    )
            );

            if(!search.isEmpty()){
                String searchValue = "%"+search+"%";

                Predicate username = criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("username")), searchValue.toLowerCase()
                );
                Predicate displayName = criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("displayName")), searchValue.toLowerCase()
                );

                predicates.add(criteriaBuilder.or(username, displayName));
            }
            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}
