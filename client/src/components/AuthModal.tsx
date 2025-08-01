import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, Loader2, AtSign, Lock, User, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { signUpSchema, signInSchema, type SignUpData, type SignInData } from "@shared/schema";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const signUpForm = useForm<SignUpData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      username: "",
      password: "",
      confirmPassword: "",
    },
  });

  const signInForm = useForm<SignInData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const handleSignUp = async (data: SignUpData) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to create account' }));
        throw new Error(errorData.message || 'Failed to create account');
      }

      toast({
        title: "Account created!",
        description: "Welcome to RooMate.ai!",
      });
      
      onClose();
      window.location.reload();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (data: SignInData) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to sign in' }));
        throw new Error(errorData.message || 'Failed to sign in');
      }

      toast({
        title: "Welcome back!",
        description: "Successfully signed in.",
      });
      
      onClose();
      window.location.reload();
    } catch (error: any) {
      toast({
        title: "Error", 
        description: error.message || "Failed to sign in",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-[400px] sm:max-w-[420px] md:max-w-[480px] max-h-[95vh] min-h-[400px] p-0 overflow-hidden bg-white border-0 shadow-2xl rounded-xl sm:rounded-2xl md:rounded-3xl">
        <DialogTitle className="sr-only">Welcome to RooMate.ai</DialogTitle>
        <DialogDescription className="sr-only">
          Welcome to RooMate.ai - your AI-powered companion for finding the perfect roommate match
        </DialogDescription>
        
        <div className="flex flex-col items-center justify-start px-4 sm:px-6 md:px-8 py-4 sm:py-6 md:py-8 text-center h-full max-h-[95vh] overflow-y-auto scrollbar-thin scrollbar-thumb-purple-300 scrollbar-track-gray-100">
          {/* Heart Icon */}
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mb-3 sm:mb-4 md:mb-6 shadow-lg flex-shrink-0">
            <Heart className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-white fill-white" />
          </div>
          
          {/* Title */}
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-3 px-2">
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Welcome to RooMate.ai
            </span>
          </h1>
          
          {/* Subtitle */}
          <p className="text-gray-600 text-xs sm:text-sm md:text-base max-w-xs sm:max-w-sm leading-relaxed mb-3 sm:mb-4 md:mb-6 px-2 flex-shrink-0">
            Your AI-powered companion for finding the perfect roommate match
          </p>

          {/* Auth Content */}
          <div className="w-full max-w-xs sm:max-w-sm flex-1 min-h-0">

            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-gray-100 rounded-lg sm:rounded-xl p-1 mb-2 sm:mb-3 md:mb-4">
                <TabsTrigger 
                  value="signin" 
                  className="rounded-md sm:rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm font-medium text-xs sm:text-sm"
                  data-testid="tab-signin"
                >
                  Sign In
                </TabsTrigger>
                <TabsTrigger 
                  value="signup" 
                  className="rounded-md sm:rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm font-medium text-xs sm:text-sm"
                  data-testid="tab-signup"
                >
                  Sign Up
                </TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="space-y-2 sm:space-y-3 md:space-y-4 pb-4">
                <div className="space-y-2 sm:space-y-3 md:space-y-4">
                  <div className="space-y-1 sm:space-y-2">
                    <Label htmlFor="signin-username" className="text-xs sm:text-sm font-medium text-gray-700">
                      Username
                    </Label>
                    <div className="relative">
                      <AtSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 sm:w-4 sm:h-4" />
                      <Input
                        id="signin-username"
                        type="text"
                        placeholder="your_username"
                        className="pl-8 sm:pl-9 md:pl-10 h-9 sm:h-10 md:h-12 rounded-lg sm:rounded-xl border-gray-300 text-xs sm:text-sm md:text-base"
                        data-testid="input-signin-username"
                        {...signInForm.register("username")}
                      />
                    </div>
                    {signInForm.formState.errors.username && (
                      <p className="text-red-500 text-xs">{signInForm.formState.errors.username.message}</p>
                    )}
                  </div>

                  <div className="space-y-1 sm:space-y-2">
                    <Label htmlFor="signin-password" className="text-xs sm:text-sm font-medium text-gray-700">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 sm:w-4 sm:h-4" />
                      <Input
                        id="signin-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Your password"
                        className="pl-8 sm:pl-9 md:pl-10 pr-8 sm:pr-9 md:pr-10 h-9 sm:h-10 md:h-12 rounded-lg sm:rounded-xl border-gray-300 text-xs sm:text-sm md:text-base"
                        data-testid="input-signin-password"
                        {...signInForm.register("password")}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        data-testid="button-toggle-password"
                      >
                        {showPassword ? <EyeOff className="w-3 h-3 sm:w-4 sm:h-4" /> : <Eye className="w-3 h-3 sm:w-4 sm:h-4" />}
                      </button>
                    </div>
                    {signInForm.formState.errors.password && (
                      <p className="text-red-500 text-xs">{signInForm.formState.errors.password.message}</p>
                    )}
                  </div>

                  <Button
                    onClick={signInForm.handleSubmit(handleSignIn)}
                    disabled={isLoading}
                    className="w-full h-9 sm:h-10 md:h-12 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium rounded-lg sm:rounded-xl transition-all duration-200 text-xs sm:text-sm md:text-base mt-2"
                    data-testid="button-signin"
                  >
                    {isLoading ? (
                      <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 animate-spin" />
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="signup" className="space-y-2 sm:space-y-3 md:space-y-4 pb-4">
                <div className="space-y-2 sm:space-y-3 md:space-y-4">
                  <div className="space-y-1 sm:space-y-2">
                    <Label htmlFor="signup-name" className="text-xs sm:text-sm font-medium text-gray-700">
                      Full Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 sm:w-4 sm:h-4" />
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Your full name"
                        className="pl-8 sm:pl-9 md:pl-10 h-9 sm:h-10 md:h-12 rounded-lg sm:rounded-xl border-gray-300 text-xs sm:text-sm md:text-base"
                        data-testid="input-signup-name"
                        {...signUpForm.register("name")}
                      />
                    </div>
                    {signUpForm.formState.errors.name && (
                      <p className="text-red-500 text-xs">{signUpForm.formState.errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-1 sm:space-y-2">
                    <Label htmlFor="signup-username" className="text-xs sm:text-sm font-medium text-gray-700">
                      Username
                    </Label>
                    <div className="relative">
                      <AtSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 sm:w-4 sm:h-4" />
                      <Input
                        id="signup-username"
                        type="text"
                        placeholder="Choose a username"
                        className="pl-8 sm:pl-9 md:pl-10 h-9 sm:h-10 md:h-12 rounded-lg sm:rounded-xl border-gray-300 text-xs sm:text-sm md:text-base"
                        data-testid="input-signup-username"
                        {...signUpForm.register("username")}
                      />
                    </div>
                    {signUpForm.formState.errors.username && (
                      <p className="text-red-500 text-xs">{signUpForm.formState.errors.username.message}</p>
                    )}
                  </div>

                  <div className="space-y-1 sm:space-y-2">
                    <Label htmlFor="signup-password" className="text-xs sm:text-sm font-medium text-gray-700">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 sm:w-4 sm:h-4" />
                      <Input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a password"
                        className="pl-8 sm:pl-9 md:pl-10 pr-8 sm:pr-9 md:pr-10 h-9 sm:h-10 md:h-12 rounded-lg sm:rounded-xl border-gray-300 text-xs sm:text-sm md:text-base"
                        data-testid="input-signup-password"
                        {...signUpForm.register("password")}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        data-testid="button-toggle-signup-password"
                      >
                        {showPassword ? <EyeOff className="w-3 h-3 sm:w-4 sm:h-4" /> : <Eye className="w-3 h-3 sm:w-4 sm:h-4" />}
                      </button>
                    </div>
                    {signUpForm.formState.errors.password && (
                      <p className="text-red-500 text-xs">{signUpForm.formState.errors.password.message}</p>
                    )}
                  </div>

                  <div className="space-y-1 sm:space-y-2">
                    <Label htmlFor="signup-confirmPassword" className="text-xs sm:text-sm font-medium text-gray-700">
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 sm:w-4 sm:h-4" />
                      <Input
                        id="signup-confirmPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        className="pl-8 sm:pl-9 md:pl-10 h-9 sm:h-10 md:h-12 rounded-lg sm:rounded-xl border-gray-300 text-xs sm:text-sm md:text-base"
                        data-testid="input-signup-confirmPassword"
                        {...signUpForm.register("confirmPassword")}
                      />
                    </div>
                    {signUpForm.formState.errors.confirmPassword && (
                      <p className="text-red-500 text-xs">{signUpForm.formState.errors.confirmPassword.message}</p>
                    )}
                  </div>

                  <Button
                    onClick={signUpForm.handleSubmit(handleSignUp)}
                    disabled={isLoading}
                    className="w-full h-9 sm:h-10 md:h-12 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium rounded-lg sm:rounded-xl transition-all duration-200 text-xs sm:text-sm md:text-base mt-2"
                    data-testid="button-signup"
                  >
                    {isLoading ? (
                      <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 animate-spin" />
                    ) : (
                      "Sign Up"
                    )}
                  </Button>

                  <p className="text-center text-xs text-gray-500 mt-3 sm:mt-4 px-2">
                    By signing up, you agree to our{" "}
                    <a href="#" className="text-purple-600 hover:underline">
                      Terms of Service
                    </a>{" "}
                    and{" "}
                    <a href="#" className="text-purple-600 hover:underline">
                      Privacy Policy
                    </a>
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}