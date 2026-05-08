package com.akillitriage.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDate;

@Entity
@Table(name = "patients")
public class PatientEntity {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "ad", nullable = false, length = 100)
  private String ad;

  @Column(name = "soyad", nullable = false, length = 100)
  private String soyad;

  @Column(name = "tc_kimlik_no", nullable = false, unique = true, length = 11)
  private String tcKimlikNo;

  @Column(name = "dogum_tarihi", nullable = false)
  private LocalDate dogumTarihi;

  @Column(name = "cinsiyet", nullable = false, length = 20)
  private String cinsiyet;

  public Long getId() {
    return id;
  }

  public String getAd() {
    return ad;
  }

  public void setAd(String ad) {
    this.ad = ad;
  }

  public String getSoyad() {
    return soyad;
  }

  public void setSoyad(String soyad) {
    this.soyad = soyad;
  }

  public String getTcKimlikNo() {
    return tcKimlikNo;
  }

  public void setTcKimlikNo(String tcKimlikNo) {
    this.tcKimlikNo = tcKimlikNo;
  }

  public LocalDate getDogumTarihi() {
    return dogumTarihi;
  }

  public void setDogumTarihi(LocalDate dogumTarihi) {
    this.dogumTarihi = dogumTarihi;
  }

  public String getCinsiyet() {
    return cinsiyet;
  }

  public void setCinsiyet(String cinsiyet) {
    this.cinsiyet = cinsiyet;
  }
}
