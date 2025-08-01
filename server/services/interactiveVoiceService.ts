export class InteractiveVoiceService {
  private conversations: Map<string, ConversationState> = new Map();
  
  private interviewQuestions = [
    {
      step: 1,
      field: 'name',
      question: "Hi! I'm Rooma, your AI roommate matching assistant. Could you please tell me your name?",
      expectedResponse: "My name is...",
      followUp: "Nice to meet you!"
    },
    {
      step: 2,
      field: 'cleanliness',
      question: "On a scale of 1-5, how important is cleanliness to you in shared spaces? 1 being not important at all, 5 being extremely important.",
      expectedResponse: "I'd say...",
      followUp: "That's helpful to know for matching!"
    },
    {
      step: 3,
      field: 'socialLevel',
      question: "How social are you? On a scale of 1-5, do you prefer quiet time at home (1) or lots of social interaction (5)?",
      expectedResponse: "I'm usually around...",
      followUp: "Great, that helps me understand your social preferences."
    },
    {
      step: 4,
      field: 'sleepTime',
      question: "What time do you usually go to bed? This helps match you with someone with a compatible schedule.",
      expectedResponse: "I usually sleep around...",
      followUp: "Perfect, sleep schedules are important for compatibility."
    },
    {
      step: 5,
      field: 'pets',
      question: "Do you have any pets, or are you okay living with pets?",
      expectedResponse: "I have... / I'm okay with...",
      followUp: "Good to know about your pet preferences."
    },
    {
      step: 6,
      field: 'interests',
      question: "What are some of your interests or hobbies? This helps find someone you might connect with.",
      expectedResponse: "I enjoy...",
      followUp: "Those sound like great interests!"
    },
    {
      step: 7,
      field: 'roomType',
      question: "Would you prefer a single room or are you open to sharing a room?",
      expectedResponse: "I prefer...",
      followUp: "That's noted for your room preferences."
    }
  ];

  private generateRealisticResponse(question: any): string {
    const responses: Record<string, string[]> = {
      name: ["Sarah", "Jessica", "Emily", "Rachel", "Amanda", "Lisa"],
      cleanliness: ["4", "5", "3", "4 - I like things pretty clean"],
      socialLevel: ["3", "2 - I prefer quieter living", "4 - I enjoy socializing", "3 - balanced"],
      sleepTime: ["11 PM", "10:30 PM", "midnight", "11:30 PM"],
      pets: ["I have a cat", "No pets but I'm okay with them", "I don't have pets"],
      interests: ["reading and yoga", "cooking and hiking", "music and art", "fitness and movies"],
      roomType: ["single room", "I'm open to sharing", "preferably single"]
    };
    
    const fieldResponses = responses[question.field] || ["I'm not sure"];
    return fieldResponses[Math.floor(Math.random() * fieldResponses.length)];
  }

  async startInteractiveInterview(callId: string): Promise<void> {
    console.log(`Starting interactive interview for call: ${callId}`);
    
    const conversation: ConversationState = {
      callId,
      status: 'in-progress',
      currentStep: 0,
      totalSteps: this.interviewQuestions.length,
      progress: 0,
      responses: {},
      transcript: '',
      startTime: new Date(),
      questions: this.interviewQuestions
    };

    this.conversations.set(callId, conversation);
    
    // Start the first question immediately for better UX
    setTimeout(() => {
      this.processNextQuestion(callId);
    }, 1000);
  }

  private async processNextQuestion(callId: string): Promise<void> {
    const conversation = this.conversations.get(callId);
    if (!conversation) return;

    const currentQuestion = conversation.questions[conversation.currentStep];
    if (!currentQuestion) {
      // Interview completed
      await this.completeInterview(callId);
      return;
    }

    // Simulate voice synthesis and response
    console.log(`Rooma: ${currentQuestion.question}`);
    
    // Simulate user response after a delay
    setTimeout(() => {
      this.simulateUserResponse(callId, currentQuestion);
    }, 3000 + Math.random() * 2000); // 3-5 seconds
  }

  private simulateUserResponse(callId: string, question: any): void {
    const conversation = this.conversations.get(callId);
    if (!conversation) return;

    // Simulate a realistic user response
    const response = this.generateRealisticResponse(question);
    conversation.responses[question.field] = response;
    
    // Update transcript
    const userResponseText = `User: ${response}`;
    conversation.transcript += `\n${userResponseText}\n`;

    // Move to next question
    conversation.currentStep++;
    conversation.progress = Math.round((conversation.currentStep / conversation.totalSteps) * 100);

    console.log(`📝 User responded: ${response}`);
    console.log(`📊 Progress: ${conversation.progress}% (${conversation.currentStep}/${conversation.totalSteps})`);

    // Process next question or complete
    if (conversation.currentStep < conversation.totalSteps) {
      setTimeout(() => {
        this.processNextQuestion(callId);
      }, 2000); // 2 second delay between questions
    } else {
      this.completeInterview(callId);
    }
  }

  private async completeInterview(callId: string): Promise<void> {
    const conversation = this.conversations.get(callId);
    if (!conversation) return;

    console.log(`Interview completed for call ${callId}`);
    
    // Mark conversation as completed
    conversation.status = 'completed';
    conversation.endTime = new Date();
    
    // Generate final transcript
    const transcript = this.generateTranscript(conversation);
    conversation.transcript = transcript;
  }

  private generateTranscript(conversation: ConversationState): string {
    const responses = conversation.responses;
    return `Hi, this is Rooma from RooMate.ai! I'd like to ask a few questions to help match you with a compatible roommate.

User Name: ${responses.name || 'Not provided'}

Sleep Schedule: ${responses.sleepType || 'Not specified'} (sleeps at ${responses.sleepTime || 'not specified'}, wakes at ${responses.wakeTime || 'not specified'})

Cleanliness Level: ${responses.cleanliness || 'Not specified'}/5 (${responses.cleanlinessImportance || 'medium'} importance)

Social Level: ${responses.socialLevel || 'Not specified'}/5 (${responses.socialImportance || 'medium'} importance)

Pets: ${responses.pets ? 'Has pets' : 'No pets'} (${responses.okWithPets ? 'okay with pets' : 'prefers no pets'})

Smoking: ${responses.smoking ? 'Smokes' : 'Non-smoker'} (${responses.okWithSmoking ? 'okay with smoking' : 'prefers non-smoking roommate'})

Interests: ${responses.interests?.join(', ') || 'Not specified'}

Room Preferences: ${responses.roomType || 'No preference'} room, ${responses.floorType || 'no preference'} floor

Budget: ${responses.budget || 'Not specified'}

Thank you for taking the time to share your preferences! This information will help us find you the perfect roommate match.`;
  }

  getConversationStatus(callId: string): any {
    const conversation = this.conversations.get(callId);
    if (!conversation) return null;

    const totalQuestions = conversation.questions.length;
    const progress = ((conversation.currentStep) / totalQuestions) * 100;

    return {
      id: callId,
      status: conversation.status || (conversation.currentStep >= totalQuestions ? 'completed' : 'in-progress'),
      progress: Math.min(100, progress),
      currentStep: conversation.currentStep,
      totalSteps: totalQuestions,
      duration: conversation.endTime ? 
        Math.floor((conversation.endTime.getTime() - conversation.startTime.getTime()) / 1000) :
        Math.floor((new Date().getTime() - conversation.startTime.getTime()) / 1000),
      transcript: conversation.transcript || '',
      responses: conversation.responses
    };
  }

  extractProfileData(callId: string): any {
    const conversation = this.conversations.get(callId);
    if (!conversation || !conversation.responses) return null;

    const responses = conversation.responses;
    
    return {
      name: responses.name || '',
      age: 22, // Default for now
      location: 'San Francisco, CA', // Default for now
      occupation: 'Student', // Default for now
      budget: responses.budget || '',
      bio: `I'm ${responses.name || 'a student'} looking for a compatible roommate. I'm ${responses.cleanliness === 5 ? 'very clean and organized' : 'reasonably clean'} and ${responses.socialLevel === 3 ? 'enjoy a good balance of social time and quiet time' : responses.socialLevel > 3 ? 'quite social' : 'prefer quieter living'}. ${responses.interests?.length ? 'My interests include ' + responses.interests.join(', ') + '.' : ''}`,
      lifestyle: {
        cleanliness: responses.cleanliness || 3,
        cleanlinessImportance: responses.cleanlinessImportance || 'medium',
        socialLevel: responses.socialLevel || 3,
        socialLevelImportance: responses.socialImportance || 'medium',
        sleepTime: responses.sleepTime || '23:00',
        wakeTime: responses.wakeTime || '07:00',
        sleepImportance: 'high',
        workSchedule: 'Student',
        pets: responses.pets || false,
        petType: '',
        smoking: responses.smoking || false,
        drinking: false, // Default
        drinkingFrequency: 'never',
        roomType: responses.roomType || 'no_preference',
        floorType: responses.floorType || 'no_preference',
        cooking: true,
        musicLevel: 2,
        musicImportance: 'low',
        lifestyleTags: responses.interests || [],
        guestPolicy: 'occasionally'
      },
      roommatePreferences: {
        preferredCleanliness: responses.cleanliness || 3,
        cleanlinessImportance: responses.cleanlinessImportance || 'medium',
        preferredSocialLevel: responses.socialLevel || 3,
        socialImportance: responses.socialImportance || 'medium',
        okWithPets: responses.okWithPets || false,
        petImportance: responses.okWithPets ? 'low' : 'medium',
        okWithSmoking: responses.okWithSmoking || false,
        smokingImportance: responses.okWithSmoking ? 'low' : 'high',
        preferredSleepSchedule: responses.sleepType || 'flexible',
        sleepImportance: 'high',
        preferredGuestPolicy: 'occasionally',
        guestImportance: 'low',
        interestMatching: 'important',
        ageRange: [18, 30],
        locationRadius: 10,
        budgetRange: responses.budgetRange || [500, 1500],
        dealBreakers: responses.okWithSmoking ? [] : ['smoking'],
        mustHaves: ['clean', 'respectful']
      },
      interests: responses.interests || [],
      languages: ['English']
    };
  }
}

interface ConversationState {
  callId: string;
  currentStep: number;
  totalSteps: number;
  progress: number;
  startTime: Date;
  endTime?: Date;
  status?: string;
  responses: Record<string, any>;
  questions: Array<{
    step: number;
    question: string;
    field: string;
    expectedResponse: string;
    followUp: string;
  }>;
  transcript?: string;
}

export const interactiveVoiceService = new InteractiveVoiceService();