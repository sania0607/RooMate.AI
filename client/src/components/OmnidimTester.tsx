import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { omnidimService } from "@/services/omnidimService";
import { TestTube, Send } from "lucide-react";

export function OmnidimTester() {
  const [question, setQuestion] = useState("What are you looking for in a roommate?");
  const [answer, setAnswer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleTestSubmit = async () => {
    if (!answer.trim()) {
      toast({
        title: "Missing Answer",
        description: "Please provide an answer to test the Omnidim integration.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await omnidimService.manualSaveResponse(question, answer, {
        testMode: true,
        source: "omnidim_tester"
      });
      
      if (answer.toLowerCase().includes('roomo')) {
        toast({
          title: "Response Saved!",
          description: "Your response containing 'roomo' has been saved to your profile.",
        });
      } else {
        toast({
          title: "Response Not Saved",
          description: "Only responses containing 'roomo' are saved to your profile.",
          variant: "destructive",
        });
      }
      
      setAnswer("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save the response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const quickTestResponses = [
    "I'm looking for someone who keeps things clean and enjoys roomo conversations.",
    "I'd love a roommate who respects quiet hours and likes discussing roomo topics.",
    "Someone who doesn't smoke and is interested in roomo lifestyle would be perfect.",
    "Just someone normal who doesn't like roomo stuff." // This one should not be saved
  ];

  return (
    <Card className="border-dashed border-2 border-blue-300 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
          <TestTube className="h-5 w-5" />
          Omnidim Integration Tester
        </CardTitle>
        <p className="text-sm text-blue-600 dark:text-blue-400">
          Test the Omnidim response system by simulating widget interactions. 
          Only responses containing "roomo" will be saved.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
            Question
          </label>
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Enter a question..."
            className="bg-white dark:bg-gray-800"
          />
        </div>
        
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
            Answer
          </label>
          <Textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Enter your answer (include 'roomo' to test saving)..."
            rows={3}
            className="bg-white dark:bg-gray-800"
          />
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleTestSubmit}
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isSubmitting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Test Submit
          </Button>
        </div>

        <div className="border-t pt-4">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Quick Test Responses:
          </p>
          <div className="space-y-2">
            {quickTestResponses.map((response, index) => (
              <button
                key={index}
                onClick={() => setAnswer(response)}
                className="text-left w-full p-2 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded border transition-colors"
              >
                {response}
                {response.toLowerCase().includes('roomo') && (
                  <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                    ✓ Contains "roomo"
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-950/20 p-3 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>Note:</strong> This tester simulates Omnidim widget responses. 
            In production, the system automatically captures responses from the actual 
            Omnidim widget when they contain "roomo".
          </p>
        </div>
      </CardContent>
    </Card>
  );
}