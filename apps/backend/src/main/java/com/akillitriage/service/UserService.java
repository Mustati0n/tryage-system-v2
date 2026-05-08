package com.akillitriage.service;

import com.akillitriage.api.NotFoundException;
import com.akillitriage.dto.UserDtos;
import java.util.List;
import com.akillitriage.entity.UserEntity;
import com.akillitriage.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class UserService {
  private final UserRepository userRepository;

  public UserService(UserRepository userRepository) {
    this.userRepository = userRepository;
  }

  public UserDtos.UserResponse create(UserDtos.UserCreateRequest request) {
    if (userRepository.findByKullaniciAdiIgnoreCase(request.kullaniciAdi()).isPresent()) {
      throw new IllegalArgumentException("Bu kullanici adi zaten var");
    }
    UserEntity user = new UserEntity();
    user.setKullaniciAdi(request.kullaniciAdi());
    user.setSifreHash(request.sifre()); // TODO: bcrypt
    user.setRol(request.rol());
    user.setAdSoyad(
        StringUtils.hasText(request.adSoyad()) ? request.adSoyad().trim() : request.kullaniciAdi().trim());
    user.setAktifMi(true);
    return toResponse(userRepository.save(user));
  }

  public List<UserDtos.UserResponse> list() {
    return userRepository.findAll().stream().map(this::toResponse).toList();
  }

  public UserDtos.UserResponse update(Long id, UserDtos.UserUpdateRequest request) {
    UserEntity user = userRepository.findById(id).orElseThrow(() -> new NotFoundException("Kullanici bulunamadi"));
    user.setKullaniciAdi(request.kullaniciAdi());
    user.setRol(request.rol());
    if (StringUtils.hasText(request.adSoyad())) {
      user.setAdSoyad(request.adSoyad().trim());
    }
    return toResponse(userRepository.save(user));
  }

  public UserDtos.UserResponse updateStatus(Long id, UserDtos.UserStatusRequest request) {
    UserEntity user = userRepository.findById(id).orElseThrow(() -> new NotFoundException("Kullanici bulunamadi"));
    user.setAktifMi(request.aktifMi());
    return toResponse(userRepository.save(user));
  }

  private UserDtos.UserResponse toResponse(UserEntity r) {
    return new UserDtos.UserResponse(
        r.getId(), r.getKullaniciAdi(), r.getAdSoyad(), r.getRol(), r.isAktifMi());
  }
}
