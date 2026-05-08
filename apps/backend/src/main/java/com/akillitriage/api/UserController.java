package com.akillitriage.api;

import com.akillitriage.dto.UserDtos;
import com.akillitriage.service.UserService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@PreAuthorize("hasRole('ADMIN')")
public class UserController {
  private final UserService userService;

  public UserController(UserService userService) {
    this.userService = userService;
  }

  @PostMapping
  public UserDtos.UserResponse create(@Valid @RequestBody UserDtos.UserCreateRequest request) {
    return userService.create(request);
  }

  @GetMapping
  public List<UserDtos.UserResponse> list() {
    return userService.list();
  }

  @PutMapping("/{id}")
  public UserDtos.UserResponse update(@PathVariable Long id, @Valid @RequestBody UserDtos.UserUpdateRequest request) {
    return userService.update(id, request);
  }

  @PatchMapping("/{id}/status")
  public UserDtos.UserResponse updateStatus(
      @PathVariable Long id, @Valid @RequestBody UserDtos.UserStatusRequest request) {
    return userService.updateStatus(id, request);
  }
}
