package com.akillitriage.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "users")
public class UserEntity {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "kullanici_adi", nullable = false, unique = true, length = 100)
  private String kullaniciAdi;

  @Column(name = "sifre_hash", nullable = false, length = 255)
  private String sifreHash;

  @Column(name = "rol", nullable = false, length = 20)
  private String rol;

  @Column(name = "ad_soyad", length = 150)
  private String adSoyad;

  @Column(name = "aktif_mi", nullable = false)
  private boolean aktifMi;

  public Long getId() {
    return id;
  }

  public String getKullaniciAdi() {
    return kullaniciAdi;
  }

  public void setKullaniciAdi(String kullaniciAdi) {
    this.kullaniciAdi = kullaniciAdi;
  }

  public String getSifreHash() {
    return sifreHash;
  }

  public void setSifreHash(String sifreHash) {
    this.sifreHash = sifreHash;
  }

  public String getRol() {
    return rol;
  }

  public void setRol(String rol) {
    this.rol = rol;
  }

  public String getAdSoyad() {
    return adSoyad;
  }

  public void setAdSoyad(String adSoyad) {
    this.adSoyad = adSoyad;
  }

  public boolean isAktifMi() {
    return aktifMi;
  }

  public void setAktifMi(boolean aktifMi) {
    this.aktifMi = aktifMi;
  }
}
