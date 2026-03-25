package com.aimentor.domain.book.service;

import com.aimentor.domain.book.dto.response.AladinItemListResponse;
import com.aimentor.external.aladin.AladinBookService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class ItBookService {

    private final AladinBookService aladinBookService;

    public ItBookService(AladinBookService aladinBookService) {
        this.aladinBookService = aladinBookService;
    }

    public AladinItemListResponse getItBooks() {
        return aladinBookService.getItEditorChoiceBooks();
    }
}
