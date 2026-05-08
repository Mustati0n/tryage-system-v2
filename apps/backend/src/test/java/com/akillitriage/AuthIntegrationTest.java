package com.akillitriage;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

class AuthIntegrationTest extends BaseIntegrationTest {
  @Test
  void loginAndMeFlowWorks() throws Exception {
    String token = loginAndGetToken("admin", "admin123");

    mockMvc
        .perform(get("/api/auth/me").header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.kullaniciAdi").value("admin"))
        .andExpect(jsonPath("$.rol").value("ADMIN"));
  }

  @Test
  void loginFailsWithWrongPassword() throws Exception {
    String body =
        """
        {
          "kullaniciAdi": "admin",
          "sifre": "wrong"
        }
        """;
    mockMvc
        .perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(body))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.code").value("AUTH_ERROR"));
  }

  @Test
  void refreshFlowReturnsNewTokens() throws Exception {
    String loginBody =
        """
        {
          "kullaniciAdi": "admin",
          "sifre": "admin123"
        }
        """;

    MvcResult loginResult =
        mockMvc
            .perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(loginBody))
            .andExpect(status().isOk())
            .andReturn();

    JsonNode loginJson = objectMapper.readTree(loginResult.getResponse().getContentAsString());
    String oldRefresh = loginJson.get("refreshToken").asText();

    String refreshBody =
        """
        {
          "refreshToken": "%s"
        }
        """
            .formatted(oldRefresh);

    MvcResult refreshResult =
        mockMvc
            .perform(post("/api/auth/refresh").contentType(MediaType.APPLICATION_JSON).content(refreshBody))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.accessToken").isNotEmpty())
            .andExpect(jsonPath("$.refreshToken").isNotEmpty())
            .andReturn();

    JsonNode refreshed = objectMapper.readTree(refreshResult.getResponse().getContentAsString());
    String newRefresh = refreshed.get("refreshToken").asText();
    String newAccess = refreshed.get("accessToken").asText();
    org.junit.jupiter.api.Assertions.assertNotEquals(oldRefresh, newRefresh);

    mockMvc
        .perform(get("/api/auth/me").header(HttpHeaders.AUTHORIZATION, "Bearer " + newAccess))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.kullaniciAdi").value("admin"));
  }

  @Test
  void refreshFailsWithUnknownToken() throws Exception {
    String body =
        """
        {
          "refreshToken": "no-such-token"
        }
        """;
    mockMvc
        .perform(post("/api/auth/refresh").contentType(MediaType.APPLICATION_JSON).content(body))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.code").value("AUTH_ERROR"));
  }
}
