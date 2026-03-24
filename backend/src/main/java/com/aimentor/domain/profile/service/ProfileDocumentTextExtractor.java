package com.aimentor.domain.profile.service;

import com.aimentor.common.exception.ApiException;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.hwpf.HWPFDocument;
import org.apache.poi.hwpf.extractor.WordExtractor;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class ProfileDocumentTextExtractor {

    private static final int MAX_TEXT_LENGTH = 5000;

    public String extract(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "FILE_REQUIRED", "업로드할 파일이 필요합니다.");
        }

        String extension = resolveExtension(file.getOriginalFilename());
        try {
            byte[] bytes = file.getBytes();
            String extracted = switch (extension) {
                case "txt" -> extractTxt(bytes);
                case "pdf" -> extractPdf(bytes);
                case "docx" -> extractDocx(bytes);
                case "doc" -> extractDoc(bytes);
                default -> throw new ApiException(
                        HttpStatus.BAD_REQUEST,
                        "UNSUPPORTED_FILE_TYPE",
                        "지원하지 않는 파일 형식입니다. (.txt, .pdf, .doc, .docx)"
                );
            };
            return sanitize(extracted);
        } catch (ApiException e) {
            throw e;
        } catch (IOException e) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "FILE_READ_FAILED", "파일을 읽을 수 없습니다.");
        }
    }

    private String extractTxt(byte[] bytes) {
        return new String(bytes, StandardCharsets.UTF_8);
    }

    private String extractPdf(byte[] bytes) throws IOException {
        try (PDDocument document = Loader.loadPDF(bytes)) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(document);
        }
    }

    private String extractDocx(byte[] bytes) throws IOException {
        try (XWPFDocument document = new XWPFDocument(new ByteArrayInputStream(bytes));
             XWPFWordExtractor extractor = new XWPFWordExtractor(document)) {
            return extractor.getText();
        }
    }

    private String extractDoc(byte[] bytes) throws IOException {
        try (HWPFDocument document = new HWPFDocument(new ByteArrayInputStream(bytes));
             WordExtractor extractor = new WordExtractor(document)) {
            return extractor.getText();
        }
    }

    private String sanitize(String text) {
        if (text == null) {
            return "";
        }
        String normalized = text.replace("\u0000", "")
                .replaceAll("[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F]", " ")
                .replaceAll("\\r\\n?", "\n")
                .replaceAll("[ \\t]+", " ")
                .replaceAll("\\n{3,}", "\n\n")
                .trim();
        if (normalized.length() > MAX_TEXT_LENGTH) {
            return normalized.substring(0, MAX_TEXT_LENGTH);
        }
        return normalized;
    }

    private String resolveExtension(String originalFilename) {
        if (originalFilename == null || !originalFilename.contains(".")) {
            return "";
        }
        return originalFilename.substring(originalFilename.lastIndexOf('.') + 1).toLowerCase();
    }
}
