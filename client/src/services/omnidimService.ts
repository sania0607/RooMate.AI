/**
 * Omnidim Integration Service
 * Automatically captures and saves Omnidim widget responses containing "roomo"
 */

export class OmnidimService {
  private static instance: OmnidimService;
  private initialized = false;
  private sessionId: string;

  private constructor() {
    this.sessionId = this.generateSessionId();
  }

  public static getInstance(): OmnidimService {
    if (!OmnidimService.instance) {
      OmnidimService.instance = new OmnidimService();
    }
    return OmnidimService.instance;
  }

  private generateSessionId(): string {
    return `omnidim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Initialize the Omnidim service to listen for widget interactions
   */
  public initialize(): void {
    if (this.initialized) return;

    // Wait for Omnidim widget to load
    this.waitForOmnidimWidget();
    this.initialized = true;
  }

  private waitForOmnidimWidget(): void {
    // Check if Omnidim widget is loaded
    const checkOmnidim = () => {
      if (typeof window !== 'undefined' && (window as any).omnidim) {
        this.setupOmnidimListeners();
      } else {
        // Check again after a short delay
        setTimeout(checkOmnidim, 1000);
      }
    };

    checkOmnidim();
  }

  private setupOmnidimListeners(): void {
    try {
      // Listen for Omnidim events
      if ((window as any).omnidim && (window as any).omnidim.on) {
        (window as any).omnidim.on('response', this.handleOmnidimResponse.bind(this));
        (window as any).omnidim.on('interaction', this.handleOmnidimInteraction.bind(this));
        console.log('Omnidim listeners initialized');
      } else {
        // Fallback: Use message listener for cross-frame communication
        window.addEventListener('message', this.handlePostMessage.bind(this));
        console.log('Omnidim fallback message listener initialized');
      }
    } catch (error) {
      console.error('Error setting up Omnidim listeners:', error);
    }
  }

  private handlePostMessage(event: MessageEvent): void {
    // Filter for Omnidim messages
    if (event.origin.includes('omnidim.io') && event.data) {
      const data = event.data;
      if (data.type === 'omnidim_response' && data.response) {
        this.handleOmnidimResponse(data.response);
      }
    }
  }

  private async handleOmnidimResponse(responseData: any): Promise<void> {
    try {
      const response = responseData.answer || responseData.response || responseData.text || '';
      
      // Check if response contains "roomo" (case insensitive)
      if (response.toLowerCase().includes('roomo')) {
        await this.saveOmnidimResponse({
          id: responseData.id || Date.now().toString(),
          question: responseData.question || responseData.prompt || '',
          answer: response,
          sessionId: this.sessionId,
          metadata: {
            timestamp: new Date().toISOString(),
            type: responseData.type || 'response',
            source: 'omnidim_widget'
          }
        });
      }
    } catch (error) {
      console.error('Error handling Omnidim response:', error);
    }
  }

  private async handleOmnidimInteraction(interactionData: any): Promise<void> {
    // Handle other types of interactions if needed
    console.log('Omnidim interaction:', interactionData);
  }

  private async saveOmnidimResponse(responseData: any): Promise<void> {
    try {
      const response = await fetch('/api/omnidim/response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(responseData),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Omnidim response saved:', result.message);
      } else {
        const error = await response.json();
        console.warn('Failed to save Omnidim response:', error.message);
      }
    } catch (error) {
      console.error('Error saving Omnidim response:', error);
    }
  }

  /**
   * Manually save an Omnidim response (for testing or manual integration)
   */
  public async manualSaveResponse(question: string, answer: string, metadata?: any): Promise<void> {
    if (!answer.toLowerCase().includes('roomo')) {
      console.warn('Response does not contain "roomo", not saving');
      return;
    }

    await this.saveOmnidimResponse({
      id: Date.now().toString(),
      question,
      answer,
      sessionId: this.sessionId,
      metadata: {
        timestamp: new Date().toISOString(),
        type: 'manual',
        source: 'client_manual',
        ...metadata
      }
    });
  }

  /**
   * Get the current session ID
   */
  public getSessionId(): string {
    return this.sessionId;
  }
}

// Export singleton instance
export const omnidimService = OmnidimService.getInstance();