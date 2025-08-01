// Omnidim Web Service for Browser-Based Voice Calling
class OmnidimWebService {
  private apiKey: string;
  private widget: any = null;
  private isInitialized = false;
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async initialize(): Promise<boolean> {
    try {
      // Load Omnidim widget script if not already loaded
      if (!this.isScriptLoaded()) {
        await this.loadScript();
      }
      
      // Initialize the widget
      if (window.omnidim) {
        this.widget = window.omnidim.init({
          apiKey: this.apiKey,
          mode: 'web',
          enableAudio: true,
          enableVideo: false
        });
        this.isInitialized = true;
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to initialize Omnidim web service:', error);
      return false;
    }
  }

  private isScriptLoaded(): boolean {
    return !!document.querySelector('script[src*="omnidim"]') || !!window.omnidim;
  }

  private loadScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://widget.omnidim.io/embed.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Omnidim script'));
      document.head.appendChild(script);
    });
  }

  async startVoiceCall(config: {
    agentName: string;
    agentRole: string;
    agentPersonality: string;
    systemPrompt: string;
    onCallStart?: () => void;
    onCallEnd?: (transcript: string) => void;
    onError?: (error: any) => void;
  }): Promise<boolean> {
    if (!this.isInitialized || !this.widget) {
      const initialized = await this.initialize();
      if (!initialized) {
        config.onError?.({ message: 'Failed to initialize voice calling' });
        return false;
      }
    }

    try {
      await this.widget.startCall({
        agent: {
          name: config.agentName,
          role: config.agentRole,
          personality: config.agentPersonality,
          systemMessage: config.systemPrompt
        },
        options: {
          enableAudio: true,
          enableVideo: false,
          recordCall: true,
          autoTranscribe: true
        },
        callbacks: {
          onStart: config.onCallStart,
          onEnd: (result: any) => {
            config.onCallEnd?.(result.transcript || '');
          },
          onError: config.onError
        }
      });
      
      return true;
    } catch (error) {
      console.error('Failed to start voice call:', error);
      config.onError?.(error);
      return false;
    }
  }

  endCall(): void {
    if (this.widget && this.widget.endCall) {
      this.widget.endCall();
    }
  }

  isAvailable(): boolean {
    return this.isInitialized && !!this.widget;
  }
}

// Global window extension
declare global {
  interface Window {
    omnidim?: any;
  }
}

export default OmnidimWebService;