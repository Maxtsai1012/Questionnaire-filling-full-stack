package com.survey.service;

import com.survey.repository.AppUserRepository;
import com.survey.security.JwtTokenProvider;
import com.survey.security.MigratingPasswordEncoder;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

class AuthServiceLogoutTest {
    private final AppUserRepository repository = mock(AppUserRepository.class);
    private final AuthService service = new AuthService(repository,
            new MigratingPasswordEncoder(4), mock(JwtTokenProvider.class));

    @Test void logoutAtomicallyIncrementsOnlyAuthenticatedUserVersion() {
        when(repository.incrementTokenVersion(12)).thenReturn(1);
        service.logout(12);
        verify(repository).incrementTokenVersion(12);
        verifyNoMoreInteractions(repository);
    }

    @Test void logoutFailsWhenExactlyOneUserWasNotUpdated() {
        when(repository.incrementTokenVersion(12)).thenReturn(0);
        assertThrows(IllegalStateException.class, () -> service.logout(12));
    }
}
