import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Clock, User } from "lucide-react";

interface OmnidimResponse {
  id: string;
  question: string;
  answer: string;
  timestamp: string;
  metadata?: any;
}

interface OmnidimResponsesData {
  sessionId?: string;
  responses: OmnidimResponse[];
  lastUpdated: string;
}

export function OmnidimResponses() {
  const { data: profile, isLoading } = useQuery({
    queryKey: ["/api/profile"],
  });

  const omnidimResponses: OmnidimResponsesData | null = (profile as any)?.omnidimResponses || null;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Omnidim Responses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!omnidimResponses || omnidimResponses.responses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Omnidim Responses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No Omnidim responses yet</p>
            <p className="text-sm">
              Responses containing "roomo" from the Omnidim widget will appear here automatically.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Omnidim Responses
          </div>
          <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
            {omnidimResponses.responses.length} responses
          </span>
        </CardTitle>
        {omnidimResponses.sessionId && (
          <p className="text-sm text-gray-500">
            Session: {omnidimResponses.sessionId}
          </p>
        )}
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <div className="space-y-4">
            {omnidimResponses.responses.map((response) => (
              <div
                key={response.id}
                className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800"
              >
                {response.question && (
                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
                        Question
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 pl-6">
                      {response.question}
                    </p>
                  </div>
                )}
                
                <div className="mb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <MessageSquare className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium text-green-700 dark:text-green-400">
                      Response
                    </span>
                    <span className="text-xs bg-yellow-100 text-yellow-800 border border-yellow-300 px-2 py-1 rounded">
                      contains "roomo"
                    </span>
                  </div>
                  <p className="text-sm text-gray-900 dark:text-gray-100 pl-6">
                    {response.answer}
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Clock className="h-3 w-3" />
                  <span>
                    {new Date(response.timestamp).toLocaleString()}
                  </span>
                  {response.metadata?.source && (
                    <>
                      <span>•</span>
                      <span className="capitalize">
                        {response.metadata.source.replace('_', ' ')}
                      </span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Auto-Save:</strong> Responses from the Omnidim widget containing "roomo" 
            are automatically saved to your profile for better roommate matching.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}