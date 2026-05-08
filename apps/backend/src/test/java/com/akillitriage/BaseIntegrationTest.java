package com.akillitriage;

import com.akillitriage.entity.UserEntity;
import com.akillitriage.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public abstract class BaseIntegrationTest {
  @Autowired protected MockMvc mockMvc;
  @Autowired protected ObjectMapper objectMapper;
  @Autowired protected UserRepository userRepository;

  @BeforeEach
  void seedUsers() {
    ensureUser("admin", "admin123", "ADMIN", true);
    ensureUser("personel", "personel123", "PERSONEL", true);
  }

  protected String loginAndGetToken(String username, String password) throws Exception {
    String body =
        """
        {
          "kullaniciAdi": "%s",
          "sifre": "%s"
        }
        """
            .formatted(username, password);

    MvcResult result =
        mockMvc
            .perform(
                org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(body))
            .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isOk())
            .andReturn();

    JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
    return json.get("accessToken").asText();
  }

  private void ensureUser(String username, String password, String role, boolean aktif) {
    if (userRepository.findByKullaniciAdiIgnoreCase(username).isPresent()) {
      return;
    }
    UserEntity u = new UserEntity();
    u.setKullaniciAdi(username);
    u.setSifreHash(password);
    u.setRol(role);
    u.setAktifMi(aktif);
    userRepository.save(u);
  }
}
