"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, Send, Loader2 } from "lucide-react";
import { useState } from "react";

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  id?: string;
}

interface WeatherChatProps {
  chatMessages: ChatMessage[];
  chatLoading: boolean;
  isSendingMessage: boolean;
  chatInput: string;
  onChatInputChange: (value: string) => void;
  onSendMessage: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  reasoningSteps: string[];
  currentStepIndex: number;
}

export function WeatherChat({
  chatMessages,
  chatLoading,
  isSendingMessage,
  chatInput,
  onChatInputChange,
  onSendMessage,
  onKeyPress,
  reasoningSteps,
  currentStepIndex,
}: WeatherChatProps) {
  const [showChat, setShowChat] = useState(false);

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold">Chat Agrícola</h3>
        <Button
          onClick={() => setShowChat(!showChat)}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <MessageCircle className="w-4 h-4" />
          {showChat ? 'Ocultar Chat' : 'Abrir Chat'}
        </Button>
      </div>
      
      <div className={`grid transition-all duration-300 ease-in-out ${showChat ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <Card className="border border-border/60 shadow-md mt-2">
            <CardContent className="p-4">
              {/* Área de mensajes */}
              <div className="h-64 overflow-y-auto mb-4 p-3 bg-muted/50 rounded-lg">
                {chatMessages.length === 0 ? (
                  <div className="text-center text-muted-foreground mt-20">
                    <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50 animate-float" style={{ animationDuration: '3s' }} />
                    <p className="font-body text-sm">¡Hola! Puedes preguntarme cualquier cosa sobre las recomendaciones climáticas o agricultura en general.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {chatMessages.map((message, index) => (
                      <div
                        key={index}
                        className={`flex ${
                          message.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-[80%] p-3 ${
                            message.role === 'user'
                              ? 'bg-primary text-primary-foreground chat-bubble-user'
                              : 'bg-card border border-border/60 shadow-sm chat-bubble-assistant'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap font-body">{message.content}</p>
                        </div>
                      </div>
                    ))}
                    {/* Pasos de razonamiento animados */}
                    {isSendingMessage && reasoningSteps.length > 0 && (
                      <div className="flex justify-start chat-msg-enter">
                        <div className="bg-card border border-border p-3 rounded-lg shadow-sm max-w-[90%]">
                          <div className="flex items-start gap-3">
                            <div className="relative mt-0.5">
                              <Loader2 className="w-4 h-4 animate-spin text-primary" />
                            </div>
                            <div className="space-y-1.5 min-w-[200px]">
                              {reasoningSteps.map((step, idx) => (
                                <div
                                  key={idx}
                                  className={`text-sm font-body transition-all duration-700 ${
                                    idx === currentStepIndex
                                      ? 'text-foreground opacity-100 translate-x-0'
                                      : idx < currentStepIndex
                                      ? 'text-muted-foreground/60 opacity-60 translate-x-1'
                                      : 'text-muted-foreground/30 opacity-30 -translate-x-1'
                                  }`}
                                >
                                  <span className="inline-flex items-center gap-2">
                                    {idx < currentStepIndex && (
                                      <span className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                                    )}
                                    {idx === currentStepIndex && (
                                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                    )}
                                    {idx > currentStepIndex && (
                                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/20" />
                                    )}
                                    {step}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {/* Fallback loading state */}
                    {(chatLoading && !isSendingMessage) && (
                      <div className="flex justify-start chat-msg-enter">
                        <div className="bg-card border border-border p-3 rounded-lg shadow-sm">
                          <div className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-primary" />
                            <span className="text-sm text-muted-foreground font-body">Cargando...</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Input para escribir mensajes */}
              <div className="flex gap-2">
                <Input
                  value={chatInput}
                  onChange={(e) => onChatInputChange(e.target.value)}
                  onKeyPress={onKeyPress}
                  placeholder="Escribe tu pregunta sobre agricultura o clima..."
                  disabled={isSendingMessage}
                  className="flex-1 font-body input-focus-ring min-w-0"
                />
                <Button
                  onClick={onSendMessage}
                  disabled={!chatInput.trim() || isSendingMessage}
                  size="sm"
                  className="px-3 btn-press transition-all duration-normal flex-shrink-0"
                >
                  {isSendingMessage ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 transition-transform duration-normal group-hover:translate-x-0.5" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
