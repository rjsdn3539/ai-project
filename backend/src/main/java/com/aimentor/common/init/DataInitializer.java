package com.aimentor.common.init;

import com.aimentor.domain.subscription.SubscriptionTier;
import com.aimentor.domain.user.entity.Role;
import com.aimentor.domain.user.entity.User;
import com.aimentor.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${admin.email:admin@aimentor.com}")
    private String adminEmail;

    @Value("${admin.password:admin1234}")
    private String adminPassword;

    @Value("${admin.name:admin}")
    private String adminName;

    @Override
    public void run(ApplicationArguments args) {
        if (userRepository.existsByEmail(adminEmail)) {
            userRepository.findByEmail(adminEmail).ifPresent(existing -> {
                if (existing.getEffectiveTier() != SubscriptionTier.PREMIUM) {
                    existing.changeSubscription(SubscriptionTier.PREMIUM, null);
                    userRepository.save(existing);
                }
            });
            return;
        }

        User admin = User.builder()
                .email(adminEmail)
                .name(adminName)
                .password(passwordEncoder.encode(adminPassword))
                .role(Role.ADMIN)
                .build();
        admin.changeSubscription(SubscriptionTier.PREMIUM, null);

        userRepository.save(admin);
        log.info("초기 관리자 계정 생성: {}", adminEmail);
    }
}
