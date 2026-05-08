package com.akillitriage;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

class PatientIntegrationTest extends BaseIntegrationTest {
  @Test
  void createAndSearchPatientByTcWorks() throws Exception {
    String token = loginAndGetToken("personel", "personel123");
    String tc = "12345678901";
    String createBody =
        """
        {
          "ad": "Ali",
          "soyad": "Yilmaz",
          "tcKimlikNo": "%s",
          "dogumTarihi": "2001-05-10",
          "cinsiyet": "ERKEK"
        }
        """
            .formatted(tc);

    mockMvc
        .perform(
            post("/api/patients")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(createBody))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.tcKimlikNo").value(tc));

    mockMvc
        .perform(
            get("/api/patients")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .param("tcKimlikNo", tc))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].tcKimlikNo").value(tc))
        .andExpect(jsonPath("$[0].ad").value("Ali"));
  }
}
