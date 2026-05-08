package com.akillitriage.api;

import com.akillitriage.dto.AdminDtos;
import com.akillitriage.service.SystemService;
import java.util.List;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/system")
public class SystemController {
  private final SystemService systemService;

  public SystemController(SystemService systemService) {
    this.systemService = systemService;
  }

  @GetMapping("/stats")
  public AdminDtos.SystemStatsResponse stats() {
    return systemService.stats();
  }

  @GetMapping("/models")
  public AdminDtos.SystemModelInfoResponse models() {
    return systemService.models();
  }

  @GetMapping("/logs")
  public List<AdminDtos.SystemLogResponse> logs(
      @RequestParam(required = false) String q,
      @RequestParam(required = false) String actionType,
      @RequestParam(required = false) String role,
      @RequestParam(required = false) String dateFrom,
      @RequestParam(required = false) String dateTo,
      @RequestParam(required = false) Integer limit) {
    return systemService.logs(q, actionType, role, dateFrom, dateTo, limit);
  }
}
