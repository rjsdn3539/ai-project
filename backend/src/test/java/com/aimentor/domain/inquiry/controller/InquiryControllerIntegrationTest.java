package com.aimentor.domain.inquiry.controller;

import com.aimentor.common.security.jwt.JwtTokenProvider;
import com.aimentor.domain.inquiry.repository.InquiryRepository;
import com.aimentor.domain.user.entity.Role;
import com.aimentor.domain.user.entity.User;
import com.aimentor.domain.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "jwt.secret-key=test-secret-key-test-secret-key-test-secret-key",
        "jwt.access-token-expiration-seconds=1800",
        "jwt.refresh-token-expiration-seconds=1209600"
})
@AutoConfigureMockMvc
class InquiryControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private InquiryRepository inquiryRepository;

    @Test
    void inquiryApisShouldSupportPagingSearchAndAdminAnswer() throws Exception {
        User user = userRepository.save(User.builder()
                .email("member@example.com")
                .name("member")
                .password(passwordEncoder.encode("password1"))
                .role(Role.USER)
                .build());

        User admin = userRepository.save(User.builder()
                .email("support@example.com")
                .name("support-admin")
                .password(passwordEncoder.encode("password1"))
                .role(Role.ADMIN)
                .build());

        String userToken = jwtTokenProvider.createAccessToken(user.getId(), user.getEmail(), user.getRole());
        String adminToken = jwtTokenProvider.createAccessToken(admin.getId(), admin.getEmail(), admin.getRole());

        mockMvc.perform(post("/api/v1/inquiries")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "member",
                                  "email": "member@example.com",
                                  "category": "Service",
                                  "subject": "result inquiry",
                                  "message": "I want to know where I can review the previous interview result."
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("PENDING"))
                .andExpect(jsonPath("$.data.subject").value("result inquiry"));

        mockMvc.perform(post("/api/v1/inquiries")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "member",
                                  "email": "member@example.com",
                                  "category": "General",
                                  "subject": "subscription inquiry",
                                  "message": "I want to know how to upgrade the subscription plan this month."
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.subject").value("subscription inquiry"));

        mockMvc.perform(get("/api/v1/inquiries/me")
                        .param("size", "5")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items.length()").value(2))
                .andExpect(jsonPath("$.data.totalElements").value(2));

        mockMvc.perform(get("/api/v1/admin/inquiries")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + userToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/v1/admin/inquiries")
                        .param("search", "subscription")
                        .param("size", "5")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items.length()").value(1))
                .andExpect(jsonPath("$.data.items[0].subject").value("subscription inquiry"));

        Long inquiryId = inquiryRepository.findAll().stream()
                .filter(inquiry -> "result inquiry".equals(inquiry.getSubject()))
                .findFirst()
                .orElseThrow()
                .getId();

        mockMvc.perform(patch("/api/v1/admin/inquiries/{inquiryId}/answer", inquiryId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "answer": "You can review past interview results from the interview history page."
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("ANSWERED"))
                .andExpect(jsonPath("$.data.answeredBy").value("support-admin"));

        mockMvc.perform(get("/api/v1/inquiries/me")
                        .param("status", "ANSWERED")
                        .param("size", "5")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items.length()").value(1))
                .andExpect(jsonPath("$.data.items[0].status").value("ANSWERED"))
                .andExpect(jsonPath("$.data.items[0].adminAnswer").value("You can review past interview results from the interview history page."));
    }
}
