import { normalizeSpokenNumber } from "@/lib/normalizeSpokenNumber";
// Web Audio Service for Browser-Based Voice Interactions
export class WebAudioService {
  private speechSynthesis: SpeechSynthesis;
  private speechRecognition: any;
  private isListening = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  // Track if recognition is active to prevent overlap
  private _isRecognitionActive = false;

  constructor() {
    this.speechSynthesis = window.speechSynthesis;

    // Initialize Speech Recognition
    if ('webkitSpeechRecognition' in window) {
      this.speechRecognition = new (window as any).webkitSpeechRecognition();
    } else if ('SpeechRecognition' in window) {
      this.speechRecognition = new (window as any).SpeechRecognition();
    }

    if (this.speechRecognition) {
      this.speechRecognition.continuous = false;
      this.speechRecognition.interimResults = false;
      this.speechRecognition.lang = 'en-US';
    }
  }

  // Check if audio features are available
  isAudioSupported(): boolean {
    return !!(this.speechSynthesis && this.speechRecognition);
  }

  // Speak text using Text-to-Speech
  async speak(text: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.speechSynthesis) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      // Stop any current speech
      this.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      this.currentUtterance = utterance;

      // Configure voice settings
      utterance.rate = 0.9; // Slightly slower for clarity
      utterance.pitch = 1.1; // Slightly higher pitch for friendliness
      utterance.volume = 0.8;

      // Try to use a female voice if available
      const voices = this.speechSynthesis.getVoices();
      const femaleVoice = voices.find(voice =>
        voice.name.toLowerCase().includes('female') ||
        voice.name.toLowerCase().includes('samantha') ||
        voice.name.toLowerCase().includes('karen') ||
        voice.name.toLowerCase().includes('sara')
      );

      if (femaleVoice) {
        utterance.voice = femaleVoice;
      }

      utterance.onend = () => {
        this.currentUtterance = null;
        resolve();
      };

      utterance.onerror = (event) => {
        this.currentUtterance = null;
        reject(new Error(`Speech synthesis error: ${event.error}`));
      };

      console.log('🎤 Rooma says:', text);
      this.speechSynthesis.speak(utterance);
    });
  }

  // Stop current speech
  stopSpeaking(): void {
    if (this.speechSynthesis && this.currentUtterance) {
      this.speechSynthesis.cancel();
      this.currentUtterance = null;
    }
  }

  // Listen for user speech, with auto-retry once if no speech detected
  async listen(retryCount = 0): Promise<string> {
    // Prevent overlapping recognition
    if (this._isRecognitionActive) {
      console.warn('Speech recognition already active, ignoring new listen() call.');
      return Promise.reject(new Error('Speech recognition already in progress.'));
    }
    this._isRecognitionActive = true;

    return new Promise((resolve, reject) => {
      // Use a single recognition instance per session
      let speechRecognition: any;
      if ('webkitSpeechRecognition' in window) {
        speechRecognition = new (window as any).webkitSpeechRecognition();
      } else if ('SpeechRecognition' in window) {
        speechRecognition = new (window as any).SpeechRecognition();
      } else {
        this._isRecognitionActive = false;
        reject(new Error('Speech recognition not supported'));
        return;
      }

      speechRecognition.continuous = false;
      speechRecognition.interimResults = true;
      speechRecognition.maxAlternatives = 5;
      // Set language dynamically
      speechRecognition.lang = navigator.language || 'en-US';

      let hasResult = false;
      let timeoutId: number;
      const maxRetries = 0; // Only 1 attempt

      console.log('👂 Listening for user response... (attempt', retryCount + 1, 'of', maxRetries + 1, ')', 'lang:', speechRecognition.lang);

      timeoutId = window.setTimeout(() => {
        if (!hasResult) {
          console.log('⏰ Speech recognition timeout');
          speechRecognition.stop();
          this._isRecognitionActive = false;
          reject(new Error('Timeout - please try speaking again or use the text input below.'));
        }
      }, 10000); // 10-second timeout

      speechRecognition.onstart = () => {
        console.log('🎤 Speech recognition started');
      };

      speechRecognition.onresult = (event: any) => {
        if (hasResult) return;

        let bestTranscript = '';
        let bestConfidence = 0;
        let interimTranscript = '';
        let interimConfidence = 0;
        let foundNumberTranscript = '';
        let foundNumberConfidence = 0;
        const numberWordRegex = /^(zero|one|two|three|four|five|six|seven|eight|nine|ten|[0-9])$/i;

        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];
          for (let j = 0; j < result.length; j++) {
            const alternative = result[j];
            const transcript = alternative.transcript.trim();
            const confidence = alternative.confidence || 0;
            // Log all alternatives for debugging
            console.log(`[SpeechRecognition] result[${i}][${j}]:`, transcript, 'Confidence:', confidence, 'isFinal:', result.isFinal);

            // Accept any short, high-confidence number (digit or word)
            if (transcript.length <= 5 && confidence > 0.5 && numberWordRegex.test(transcript)) {
              foundNumberTranscript = transcript;
              foundNumberConfidence = confidence;
            }

            if (transcript.length > bestTranscript.length || confidence > bestConfidence) {
              bestTranscript = transcript;
              bestConfidence = confidence;
            }
          }

          if (result.isFinal && bestTranscript.length > 0) {
            const normalized = normalizeSpokenNumber(bestTranscript, speechRecognition.lang);
            console.log('👤 Final result - User said:', bestTranscript, 'Normalized:', normalized, 'Confidence:', bestConfidence);
            hasResult = true;
            clearTimeout(timeoutId);
            resolve(normalized);
            return;
          }
        }

        // If we have a confident number answer, accept it
        if (foundNumberTranscript && foundNumberConfidence > 0.5) {
          const normalized = normalizeSpokenNumber(foundNumberTranscript, speechRecognition.lang);
          console.log('👤 Accepting confident number result:', foundNumberTranscript, 'Normalized:', normalized, 'Confidence:', foundNumberConfidence);
          hasResult = true;
          clearTimeout(timeoutId);
          resolve(normalized);
          return;
        }

        // If no final or confident number, but we have any transcript that looks like a number, accept it
        if (!hasResult && bestTranscript && numberWordRegex.test(bestTranscript)) {
          const normalized = normalizeSpokenNumber(bestTranscript, speechRecognition.lang);
          console.log('👤 Accepting best available number-like transcript:', bestTranscript, 'Normalized:', normalized, 'Confidence:', bestConfidence);
          hasResult = true;
          clearTimeout(timeoutId);
          resolve(normalized);
          return;
        }

        if (bestTranscript.length > 0) {
          console.log('👤 Interim result:', bestTranscript, 'Confidence:', bestConfidence);
        }
      };

      speechRecognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (hasResult) return;

        hasResult = true;
        clearTimeout(timeoutId);
        this._isRecognitionActive = false;

        if (event.error === 'no-speech') {
          if (retryCount < maxRetries) {
            console.log('🔄 Auto-retrying speech recognition (no-speech)...');
            setTimeout(() => {
              this.listen(retryCount + 1).then(resolve).catch(reject);
            }, 500);
          } else {
            reject(new Error('I couldn\'t hear you. Please speak clearly and try again.'));
          }
        } else if (event.error === 'audio-capture') {
          reject(new Error('Microphone access issue. Please check your microphone.'));
        } else if (event.error === 'not-allowed') {
          reject(new Error('Microphone permission denied. Please allow microphone access.'));
        } else {
          reject(new Error(`Speech recognition failed: ${event.error}`));
        }
      };

      speechRecognition.onend = () => {
        console.log('🎤 Speech recognition ended, hasResult:', hasResult);
        this._isRecognitionActive = false;
        if (!hasResult) {
          if (retryCount < maxRetries) {
            console.log('🔄 Auto-retrying speech recognition (onend)...');
            setTimeout(() => {
              this.listen(retryCount + 1).then(resolve).catch(reject);
            }, 500);
          } else {
            reject(new Error('I couldn\'t hear you clearly. Please speak louder and try again.'));
          }
        }
      };

      try {
        speechRecognition.start();
      } catch (error) {
        hasResult = true;
        clearTimeout(timeoutId);
        this._isRecognitionActive = false;
        console.error('Failed to start speech recognition:', error);
        reject(new Error('Failed to start speech recognition. Please try again.'));
      }
    });
  }


  // Stop listening
  stopListening(): void {
    if (this.speechRecognition && this.isListening) {
      this.speechRecognition.stop();
      this.isListening = false;
    }
  }

  // Get available voices
  getVoices(): SpeechSynthesisVoice[] {
    return this.speechSynthesis ? this.speechSynthesis.getVoices() : [];
  }

  // Check microphone permission
  async checkMicrophonePermission(): Promise<boolean> {
    try {
      const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      return permission.state === 'granted';
    } catch (error) {
      // Fallback: try to access microphone directly
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        return true;
      } catch (micError) {
        return false;
      }
    }
  }

  // Request microphone permission
  async requestMicrophonePermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('Microphone permission denied:', error);
      return false;
    }
  }
}

export const webAudioService = new WebAudioService();