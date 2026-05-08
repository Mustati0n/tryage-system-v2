package com.akillitriage.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;

@Entity
@Table(name = "triage_records")
public class TriageRecordEntity {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "hasta_id", nullable = false)
  private PatientEntity hasta;

  @Column(name = "yas", nullable = false)
  private Integer yas;

  @Column(name = "cinsiyet", nullable = false, length = 20)
  private String cinsiyet;

  @Column(name = "sikayet_metni", nullable = false, columnDefinition = "text")
  private String sikayetMetni;

  @Column(name = "etiket", nullable = false, length = 20)
  private String etiket;

  @Column(name = "guven", nullable = false)
  private Double guven;

  @Column(name = "model_versiyonu", nullable = false, length = 100)
  private String modelVersiyonu;

  @Column(name = "ses_dosya_yolu")
  private String sesDosyaYolu;

  @Column(name = "durum", nullable = false, length = 30)
  private String durum;

  @Column(name = "override_etiket", length = 20)
  private String overrideEtiket;

  @Column(name = "override_nedeni", columnDefinition = "text")
  private String overrideNedeni;

  @Column(name = "basvuru_zamani", nullable = false)
  private OffsetDateTime basvuruZamani;

  @Column(name = "created_by_kullanici_adi", nullable = false, length = 100)
  private String createdByKullaniciAdi;

  public Long getId() {
    return id;
  }

  public PatientEntity getHasta() {
    return hasta;
  }

  public void setHasta(PatientEntity hasta) {
    this.hasta = hasta;
  }

  public Integer getYas() {
    return yas;
  }

  public void setYas(Integer yas) {
    this.yas = yas;
  }

  public String getCinsiyet() {
    return cinsiyet;
  }

  public void setCinsiyet(String cinsiyet) {
    this.cinsiyet = cinsiyet;
  }

  public String getSikayetMetni() {
    return sikayetMetni;
  }

  public void setSikayetMetni(String sikayetMetni) {
    this.sikayetMetni = sikayetMetni;
  }

  public String getEtiket() {
    return etiket;
  }

  public void setEtiket(String etiket) {
    this.etiket = etiket;
  }

  public Double getGuven() {
    return guven;
  }

  public void setGuven(Double guven) {
    this.guven = guven;
  }

  public String getModelVersiyonu() {
    return modelVersiyonu;
  }

  public void setModelVersiyonu(String modelVersiyonu) {
    this.modelVersiyonu = modelVersiyonu;
  }

  public String getSesDosyaYolu() {
    return sesDosyaYolu;
  }

  public void setSesDosyaYolu(String sesDosyaYolu) {
    this.sesDosyaYolu = sesDosyaYolu;
  }

  public String getDurum() {
    return durum;
  }

  public void setDurum(String durum) {
    this.durum = durum;
  }

  public String getOverrideEtiket() {
    return overrideEtiket;
  }

  public void setOverrideEtiket(String overrideEtiket) {
    this.overrideEtiket = overrideEtiket;
  }

  public String getOverrideNedeni() {
    return overrideNedeni;
  }

  public void setOverrideNedeni(String overrideNedeni) {
    this.overrideNedeni = overrideNedeni;
  }

  public OffsetDateTime getBasvuruZamani() {
    return basvuruZamani;
  }

  public void setBasvuruZamani(OffsetDateTime basvuruZamani) {
    this.basvuruZamani = basvuruZamani;
  }

  public String getCreatedByKullaniciAdi() {
    return createdByKullaniciAdi;
  }

  public void setCreatedByKullaniciAdi(String createdByKullaniciAdi) {
    this.createdByKullaniciAdi = createdByKullaniciAdi;
  }
}
