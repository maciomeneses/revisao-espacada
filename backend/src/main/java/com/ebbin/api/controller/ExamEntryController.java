package com.ebbin.api.controller;

import com.ebbin.api.dto.ExamEntryDto;
import com.ebbin.api.service.ExamEntryService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/exam-entries")
public class ExamEntryController {

    private final ExamEntryService examEntryService;

    public ExamEntryController(ExamEntryService examEntryService) {
        this.examEntryService = examEntryService;
    }

    @GetMapping
    public ResponseEntity<List<ExamEntryDto>> list(@AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(examEntryService.list(user.getUsername()));
    }

    @PostMapping
    public ResponseEntity<ExamEntryDto> create(
            @AuthenticationPrincipal UserDetails user,
            @Valid @RequestBody ExamEntryDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(examEntryService.create(user.getUsername(), dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ExamEntryDto> update(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable Long id,
            @Valid @RequestBody ExamEntryDto dto) {
        return ResponseEntity.ok(examEntryService.update(user.getUsername(), id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable Long id) {
        examEntryService.delete(user.getUsername(), id);
        return ResponseEntity.noContent().build();
    }
}
