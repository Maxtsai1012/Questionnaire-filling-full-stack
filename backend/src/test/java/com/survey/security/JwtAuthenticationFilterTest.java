package com.survey.security;

import com.survey.entity.AppUser;
import io.jsonwebtoken.MalformedJwtException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class JwtAuthenticationFilterTest {
    private final JwtTokenProvider provider = mock(JwtTokenProvider.class);
    private final UserDetailsServiceImpl users = mock(UserDetailsServiceImpl.class);
    private final JwtAuthenticationFilter filter = new JwtAuthenticationFilter(provider, users);

    @AfterEach void clearContext() { SecurityContextHolder.clearContext(); }

    @Test void noAuthorizationHeaderLeavesRequestAnonymous() throws Exception {
        run(new MockHttpServletRequest());
        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verifyNoInteractions(provider, users);
    }

    @Test void nonBearerHeaderIsIgnored() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Basic abc");
        run(request);
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test void invalidJwtLeavesRequestAnonymous() throws Exception {
        when(provider.parseToken("bad")).thenThrow(new MalformedJwtException("bad"));
        MockHttpServletRequest request = bearer("bad");
        run(request);
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test void validMemberJwtCreatesSecurityContext() throws Exception {
        AppUser member = user(1, "MEMBER");
        when(provider.parseToken("valid")).thenReturn(new JwtTokenProvider.ParsedToken(1, 0));
        when(users.loadUserById(1)).thenReturn(UserPrincipal.from(member));
        run(bearer("valid"));
        assertTrue(SecurityContextHolder.getContext().getAuthentication().isAuthenticated());
        assertEquals("ROLE_MEMBER", SecurityContextHolder.getContext().getAuthentication().getAuthorities().iterator().next().getAuthority());
    }

    @Test void validAdminJwtCreatesAdminAuthority() throws Exception {
        AppUser admin = user(2, "ADMIN");
        when(provider.parseToken("valid-admin")).thenReturn(new JwtTokenProvider.ParsedToken(2, 0));
        when(users.loadUserById(2)).thenReturn(UserPrincipal.from(admin));
        run(bearer("valid-admin"));
        assertEquals("ROLE_ADMIN", SecurityContextHolder.getContext().getAuthentication().getAuthorities().iterator().next().getAuthority());
    }

    @Test void mismatchedTokenVersionLeavesRequestAnonymous() throws Exception {
        AppUser member = user(1, "MEMBER");
        member.setTokenVersion(4);
        when(provider.parseToken("revoked")).thenReturn(new JwtTokenProvider.ParsedToken(1, 3));
        when(users.loadUserById(1)).thenReturn(UserPrincipal.from(member));
        run(bearer("revoked"));
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    private void run(MockHttpServletRequest request) throws Exception {
        filter.doFilter(request, new MockHttpServletResponse(), new MockFilterChain());
    }
    private MockHttpServletRequest bearer(String token) {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer " + token);
        return request;
    }
    private AppUser user(int id, String role) {
        AppUser user = new AppUser(); user.setId(id); user.setName("Test"); user.setEmail("test@example.com");
        user.setPhone("0911111111"); user.setPasswordHash("x"); user.setRole(role); return user;
    }
}
