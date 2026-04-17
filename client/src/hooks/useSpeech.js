import { useCallback, useRef, useState } from 'react';

/**
 * useSpeech — wraps the Web Speech API (recognition + synthesis)
 *
 * Returns:
 *   speak(text, options?)     — speak text aloud
 *   startListening(opts)      — start mic (prompts permission)
 *   stopListening()           — stop recording
 *   transcript                — current recognised text
 *   isListening               — bool
 *   isSpeaking                — bool
 *   supported                 — whether SpeechRecognition is available
 */
export default function useSpeech() {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef(null);

  const supported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  // ── Text-to-speech ─────────────────────────────────────────────────────────
  const speak = useCallback((text, { rate = 0.9, pitch = 1, lang = 'en-GB' } = {}) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang;
    utter.rate = rate;
    utter.pitch = pitch;
    utter.onstart = () => setIsSpeaking(true);
    utter.onend = () => setIsSpeaking(false);
    utter.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utter);
  }, []);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  }, []);

  // ── Speech recognition ────────────────────────────────────────────────────
  const startListening = useCallback(
    ({ onResult, onEnd, continuous = false, lang = 'en-US' } = {}) => {
      if (!supported) return;

      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      const rec = new SR();
      rec.lang = lang;
      rec.continuous = continuous;
      rec.interimResults = true;

      rec.onstart = () => {
        setIsListening(true);
        setTranscript('');
      };

      rec.onresult = (event) => {
        let interim = '';
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const t = event.results[i][0].transcript;
          if (event.results[i].isFinal) final += t;
          else interim += t;
        }
        const combined = (final || interim).trim();
        setTranscript(combined);
        if (final && onResult) onResult(final.trim());
      };

      rec.onend = () => {
        setIsListening(false);
        if (onEnd) onEnd();
      };

      rec.onerror = (e) => {
        console.warn('Speech recognition error:', e.error);
        setIsListening(false);
        if (onEnd) onEnd();
      };

      recognitionRef.current = rec;
      rec.start();
    },
    [supported]
  );

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  return {
    speak,
    stopSpeaking,
    startListening,
    stopListening,
    transcript,
    isListening,
    isSpeaking,
    supported,
  };
}
