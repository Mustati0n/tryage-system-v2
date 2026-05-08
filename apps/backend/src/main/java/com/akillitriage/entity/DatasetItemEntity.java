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
@Table(name = "dataset_items")
public class DatasetItemEntity {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "triage_kayit_id", nullable = false)
  private TriageRecordEntity triageKayit;

  @Column(name = "gercek_etiket", nullable = false, length = 20)
  private String gercekEtiket;

  @Column(name = "note", columnDefinition = "text")
  private String note;

  @Column(name = "kaynak", nullable = false, length = 30)
  private String kaynak;

  @Column(name = "eklenme_zamani", nullable = false)
  private OffsetDateTime eklenmeZamani;

  public Long getId() {
    return id;
  }

  public TriageRecordEntity getTriageKayit() {
    return triageKayit;
  }

  public void setTriageKayit(TriageRecordEntity triageKayit) {
    this.triageKayit = triageKayit;
  }

  public String getGercekEtiket() {
    return gercekEtiket;
  }

  public void setGercekEtiket(String gercekEtiket) {
    this.gercekEtiket = gercekEtiket;
  }

  public String getNote() {
    return note;
  }

  public void setNote(String note) {
    this.note = note;
  }

  public String getKaynak() {
    return kaynak;
  }

  public void setKaynak(String kaynak) {
    this.kaynak = kaynak;
  }

  public OffsetDateTime getEklenmeZamani() {
    return eklenmeZamani;
  }

  public void setEklenmeZamani(OffsetDateTime eklenmeZamani) {
    this.eklenmeZamani = eklenmeZamani;
  }
}
