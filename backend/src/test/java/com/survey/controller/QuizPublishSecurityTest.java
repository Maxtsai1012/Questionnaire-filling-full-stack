package com.survey.controller;

import com.survey.config.SecurityConfig;
import com.survey.entity.AppUser;
import com.survey.security.JwtAuthenticationFilter;
import com.survey.security.JwtTokenProvider;
import com.survey.security.MigratingPasswordEncoder;
import com.survey.security.RestAccessDeniedHandler;
import com.survey.security.RestAuthenticationEntryPoint;
import com.survey.security.UserDetailsServiceImpl;
import com.survey.security.UserPrincipal;
import com.survey.service.QuizManagementService;
import com.survey.service.QuizResponseService;
import com.survey.service.StatisticsService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = {MemberQuizController.class, AdminQuizController.class})
@Import({
        SecurityConfig.class,
        JwtAuthenticationFilter.class,
        RestAuthenticationEntryPoint.class,
        RestAccessDeniedHandler.class
})
class QuizPublishSecurityTest {

    private static final String PUBLISH_REQUEST = """
            {
              "name": "Publish authorization",
              "description": "Publish authorization test",
              "startDate": "2099-01-01",
              "endDate": "2099-01-02",
              "isPublished": true,
              "questions": [
                {"questName": "Ready?", "type": "T", "need": false, "options": []}
              ]
            }
            """;

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private QuizManagementService quizManagementService;

    @MockBean
    private QuizResponseService quizResponseService;

    @MockBean
    private StatisticsService statisticsService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private UserDetailsServiceImpl userDetailsService;

    @MockBean
    private MigratingPasswordEncoder passwordEncoder;

    @Test
    void guestPublishRequestReturnsUnauthorized() throws Exception {
        mockMvc.perform(post("/api/admin/quiz")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(PUBLISH_REQUEST))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }

    @Test
    void memberPublishRequestReturnsForbidden() throws Exception {
        AppUser member = appUser(1, "MEMBER");
        when(quizManagementService.saveOrUpdateQuiz(any(), eq(member), eq(false)))
                .thenThrow(new SecurityException("只有管理員可以發布問卷"));

        mockMvc.perform(post("/api/member/quiz")
                        .with(user(UserPrincipal.from(member)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(PUBLISH_REQUEST))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("只有管理員可以發布問卷"));
    }

    @Test
    void adminPublishRequestSucceeds() throws Exception {
        AppUser admin = appUser(2, "ADMIN");
        when(quizManagementService.saveOrUpdateQuiz(any(), eq(admin), eq(true))).thenReturn(42);

        mockMvc.perform(post("/api/admin/quiz")
                        .with(user(UserPrincipal.from(admin)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(PUBLISH_REQUEST))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").value(42));
    }

    @Test
    void guestStatusOverrideReturnsUnauthorized() throws Exception {
        mockMvc.perform(put("/api/admin/quiz/42/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"IN_PROGRESS\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void memberStatusOverrideReturnsForbidden() throws Exception {
        mockMvc.perform(put("/api/admin/quiz/42/status")
                        .with(user(UserPrincipal.from(appUser(1, "MEMBER"))))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"IN_PROGRESS\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminStatusOverrideSucceedsAndReturnsEffectiveStatus() throws Exception {
        AppUser admin = appUser(2, "ADMIN");
        var result = com.survey.dto.QuizListDto.builder()
                .id(42)
                .status(com.survey.enums.QuizStatus.IN_PROGRESS)
                .statusLabel("進行中")
                .build();
        when(quizManagementService.updateAdminStatus(42, com.survey.enums.QuizStatus.IN_PROGRESS))
                .thenReturn(result);

        mockMvc.perform(put("/api/admin/quiz/42/status")
                        .with(user(UserPrincipal.from(admin)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"IN_PROGRESS\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("IN_PROGRESS"))
                .andExpect(jsonPath("$.data.statusLabel").value("進行中"));
    }

    @Test
    void guestCannotReadMemberMyResponse() throws Exception {
        mockMvc.perform(get("/api/member/quiz/42/my-response"))
                .andExpect(status().isUnauthorized());
    }

    private AppUser appUser(int id, String role) {
        AppUser user = new AppUser();
        user.setId(id);
        user.setName(role + " User");
        user.setEmail(role.toLowerCase() + "@example.com");
        user.setPhone("0900000000");
        user.setPasswordHash("unused");
        user.setRole(role);
        user.setTokenVersion(0);
        return user;
    }
}
