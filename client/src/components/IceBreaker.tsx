import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Coffee, 
  Film, 
  Book, 
  Music, 
  Utensils, 
  ShoppingBag,
  Camera,
  MapPin,
  Gamepad2,
  Dumbbell,
  Paintbrush,
  Heart,
  RefreshCw,
  MessageCircle,
  Sparkles
} from "lucide-react";

interface IceBreaker {
  id: string;
  activity: string;
  description: string;
  category: 'food' | 'entertainment' | 'outdoor' | 'indoor' | 'creative' | 'active' | 'social';
  duration: string;
  cost: 'free' | 'low' | 'medium' | 'high';
  icon: any;
}

const iceBreakers: IceBreaker[] = [
  // Food & Drinks
  { id: 'coffee-shop', activity: 'Grab coffee together', description: 'Visit a cozy coffee shop and chat over your favorite drinks', category: 'food', duration: '1-2 hours', cost: 'low', icon: Coffee },
  { id: 'cooking-night', activity: 'Cook dinner together', description: 'Try a new recipe and cook a meal together at home', category: 'food', duration: '2-3 hours', cost: 'low', icon: Utensils },
  { id: 'food-truck', activity: 'Explore food trucks', description: 'Hunt for the best food trucks in your area', category: 'food', duration: '2-3 hours', cost: 'medium', icon: MapPin },
  
  // Entertainment
  { id: 'movie-night', activity: 'Watch a movie', description: 'Pick a movie you both want to see and enjoy it together', category: 'entertainment', duration: '2-3 hours', cost: 'medium', icon: Film },
  { id: 'music-event', activity: 'Attend a live music event', description: 'Check out local bands or concerts in your area', category: 'entertainment', duration: '3-4 hours', cost: 'medium', icon: Music },
  { id: 'game-night', activity: 'Host a game night', description: 'Play board games, card games, or video games together', category: 'entertainment', duration: '2-4 hours', cost: 'free', icon: Gamepad2 },
  
  // Outdoor Activities
  { id: 'photography-walk', activity: 'Go on a photo walk', description: 'Explore your neighborhood and take photos of interesting spots', category: 'outdoor', duration: '2-3 hours', cost: 'free', icon: Camera },
  { id: 'local-exploration', activity: 'Explore local attractions', description: 'Visit museums, parks, or landmarks in your city', category: 'outdoor', duration: '3-5 hours', cost: 'medium', icon: MapPin },
  { id: 'outdoor-workout', activity: 'Exercise outdoors', description: 'Go for a jog, bike ride, or outdoor workout together', category: 'active', duration: '1-2 hours', cost: 'free', icon: Dumbbell },
  
  // Indoor & Creative
  { id: 'book-discussion', activity: 'Start a mini book club', description: 'Read the same book and discuss it over tea', category: 'indoor', duration: '1-2 hours', cost: 'low', icon: Book },
  { id: 'art-project', activity: 'Try a creative project', description: 'Paint, draw, or do crafts together', category: 'creative', duration: '2-3 hours', cost: 'low', icon: Paintbrush },
  { id: 'shopping-trip', activity: 'Go shopping together', description: 'Browse shops, markets, or malls and help each other pick outfits', category: 'social', duration: '2-4 hours', cost: 'medium', icon: ShoppingBag },
  
  // Social Activities
  { id: 'volunteer', activity: 'Volunteer for a cause', description: 'Find a local charity or cause to help out together', category: 'social', duration: '3-4 hours', cost: 'free', icon: Heart },
  { id: 'study-session', activity: 'Study together', description: 'Work on assignments or projects in a quiet space', category: 'indoor', duration: '2-4 hours', cost: 'free', icon: Book },
];

interface IceBreakerProps {
  className?: string;
  onSendMessage?: (message: string) => void;
}

export function IceBreaker({ className, onSendMessage }: IceBreakerProps) {
  const [currentBreaker, setCurrentBreaker] = useState<IceBreaker>(
    iceBreakers[Math.floor(Math.random() * iceBreakers.length)]
  );

  const getRandomBreaker = () => {
    const newBreaker = iceBreakers[Math.floor(Math.random() * iceBreakers.length)];
    setCurrentBreaker(newBreaker);
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      food: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300',
      entertainment: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300',
      outdoor: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
      indoor: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
      creative: 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-300',
      active: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
      social: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
    };
    return colors[category as keyof typeof colors] || colors.social;
  };

  const getCostColor = (cost: string) => {
    const colors = {
      free: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
      low: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
      high: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
    };
    return colors[cost as keyof typeof colors] || colors.medium;
  };

  const handleSendMessage = () => {
    if (onSendMessage) {
      const message = `Hey! I found this cool ice breaker idea: "${currentBreaker.activity}" - ${currentBreaker.description}. What do you think? Would you be interested?`;
      onSendMessage(message);
    }
  };

  const Icon = currentBreaker.icon;

  return (
    <Card className={`border-2 border-dashed border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 ${className}`}>
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2 text-blue-700 dark:text-blue-300">
          <Sparkles className="h-5 w-5" />
          Ice Breaker Suggestion
        </CardTitle>
        <p className="text-sm text-blue-600 dark:text-blue-400">
          Random activity ideas to help you connect with your roommate
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="flex justify-center mb-4">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full">
                <Icon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {currentBreaker.activity}
            </h3>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {currentBreaker.description}
            </p>
            
            <div className="flex flex-wrap justify-center gap-2 mb-4">
              <Badge className={getCategoryColor(currentBreaker.category)}>
                {currentBreaker.category}
              </Badge>
              <Badge className={getCostColor(currentBreaker.cost)}>
                {currentBreaker.cost === 'free' ? 'Free' : `${currentBreaker.cost} cost`}
              </Badge>
              <Badge variant="outline">
                {currentBreaker.duration}
              </Badge>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={getRandomBreaker}
            variant="outline"
            className="flex-1"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            New Idea
          </Button>
          
          {onSendMessage && (
            <Button
              onClick={handleSendMessage}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Suggest This
            </Button>
          )}
        </div>
        
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            💡 Great relationships start with shared experiences!
          </p>
        </div>
      </CardContent>
    </Card>
  );
}