package com.aimentor.external.speech;

import com.aimentor.external.speech.dto.SpeechToTextRequest;
import com.aimentor.external.speech.dto.SpeechToTextResponse;
import com.aimentor.external.speech.dto.TextToSpeechRequest;
import com.aimentor.external.speech.dto.TextToSpeechResponse;

public interface SpeechIntegrationService {

    SpeechToTextResponse speechToText(SpeechToTextRequest request);

    TextToSpeechResponse textToSpeech(TextToSpeechRequest request);
}
