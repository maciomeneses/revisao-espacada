package com.ebbin.api.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@DisplayName("EmailService — envio de e-mails via Brevo")
class EmailServiceTest {

    private RestClient restClient;
    private RestClient.RequestBodyUriSpec uriSpec;
    private RestClient.RequestBodySpec bodySpec;
    private RestClient.ResponseSpec responseSpec;

    @SuppressWarnings("unchecked")
    private EmailService newServiceWithMockedClient(String apiKey, String from) {
        EmailService service = new EmailService(apiKey, from);

        restClient = mock(RestClient.class);
        uriSpec = mock(RestClient.RequestBodyUriSpec.class);
        bodySpec = mock(RestClient.RequestBodySpec.class);
        responseSpec = mock(RestClient.ResponseSpec.class);

        when(restClient.post()).thenReturn(uriSpec);
        when(uriSpec.uri(any(String.class))).thenReturn(bodySpec);
        when(bodySpec.header(any(String.class), any(String.class))).thenReturn(bodySpec);
        when(bodySpec.contentType(any(MediaType.class))).thenReturn(bodySpec);
        when(bodySpec.body(any(Object.class))).thenReturn(bodySpec);
        when(bodySpec.retrieve()).thenReturn(responseSpec);
        when(responseSpec.toBodilessEntity()).thenReturn(null);

        ReflectionTestUtils.setField(service, "restClient", restClient);
        return service;
    }

    @Test
    @DisplayName("sendPasswordReset envia e-mail com payload correto quando API key configurada")
    @SuppressWarnings("unchecked")
    void sendPasswordReset_sucesso() {
        EmailService service = newServiceWithMockedClient("brevo-key-123", "noreply@ebbin.com");
        String to = "user@test.com";
        String resetLink = "https://ebbin.app/reset?token=abc123";

        service.sendPasswordReset(to, resetLink);

        ArgumentCaptor<String> uriCaptor = ArgumentCaptor.forClass(String.class);
        verify(uriSpec).uri(uriCaptor.capture());
        assertThat(uriCaptor.getValue()).isEqualTo("https://api.brevo.com/v3/smtp/email");

        verify(bodySpec).header("api-key", "brevo-key-123");
        verify(bodySpec).contentType(MediaType.APPLICATION_JSON);

        ArgumentCaptor<Object> bodyCaptor = ArgumentCaptor.forClass(Object.class);
        verify(bodySpec).body(bodyCaptor.capture());

        Map<String, Object> body = (Map<String, Object>) bodyCaptor.getValue();
        assertThat(body).containsKey("sender").containsKey("to").containsKey("subject").containsKey("textContent");

        Map<String, Object> sender = (Map<String, Object>) body.get("sender");
        assertThat(sender).containsEntry("email", "noreply@ebbin.com");
        assertThat(sender).containsEntry("name", "Revisão Espaçada");

        List<Map<String, Object>> recipients = (List<Map<String, Object>>) body.get("to");
        assertThat(recipients).hasSize(1);
        assertThat(recipients.get(0)).containsEntry("email", to);

        assertThat(body.get("subject")).isEqualTo("Redefinição de senha — Revisão Espaçada");

        String text = (String) body.get("textContent");
        assertThat(text)
                .contains(resetLink)
                .contains("redefinição da sua senha")
                .contains("15 minutos");

        verify(responseSpec).toBodilessEntity();
    }

    @Test
    @DisplayName("sendPasswordReset não envia quando API key está vazia")
    void sendPasswordReset_apiKeyVazia_naoEnvia() {
        EmailService service = newServiceWithMockedClient("", "noreply@ebbin.com");

        service.sendPasswordReset("user@test.com", "https://x/reset");

        verify(restClient, never()).post();
    }

    @Test
    @DisplayName("sendPasswordReset não envia quando API key é null")
    void sendPasswordReset_apiKeyNull_naoEnvia() {
        EmailService service = newServiceWithMockedClient(null, "noreply@ebbin.com");

        service.sendPasswordReset("user@test.com", "https://x/reset");

        verify(restClient, never()).post();
    }

    @Test
    @DisplayName("sendPasswordReset não envia quando API key contém apenas espaços")
    void sendPasswordReset_apiKeyBlank_naoEnvia() {
        EmailService service = newServiceWithMockedClient("   ", "noreply@ebbin.com");

        service.sendPasswordReset("user@test.com", "https://x/reset");

        verify(restClient, never()).post();
    }

    @Test
    @DisplayName("sendPasswordReset trata exceção do RestClient sem propagar")
    void sendPasswordReset_exceptionDoRestClient_naoPropaga() {
        EmailService service = newServiceWithMockedClient("brevo-key", "noreply@ebbin.com");
        when(responseSpec.toBodilessEntity())
                .thenThrow(new RestClientException("Brevo indisponível"));

        assertThatCode(() -> service.sendPasswordReset("user@test.com", "https://x/reset"))
                .doesNotThrowAnyException();

        verify(responseSpec).toBodilessEntity();
    }

    @Test
    @DisplayName("construtor inicializa restClient real")
    void construtor_inicializaRestClient() {
        EmailService service = new EmailService("key", "from@ebbin.com");
        Object internalClient = ReflectionTestUtils.getField(service, "restClient");
        assertThat(internalClient).isNotNull().isInstanceOf(RestClient.class);
    }

}
