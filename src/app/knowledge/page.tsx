"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { BookOpenText, Send, Loader2, Bot, User, FileText, Sparkles, Brain, Lightbulb } from "lucide-react";
import { usePersistentChat } from "@/hooks/use-persistent-chat";

interface RAGSource {
  source: string;
  page: number;
  relevance: number;
  snippet: string;
}

interface MessageWithSources {
  role: 'user' | 'assistant';
  content: string;
  sources?: RAGSource[];
}

const SUGGESTED_QUESTIONS = [
  "¿Cómo prevenir Botrytis en frambuesa Heritage?",
  "¿Cuál es el manejo de plagas en frambuesa?",
  "¿Cuándo y cómo podar frambuesa Heritage?",
  "¿Qué fertilización necesita la frambuesa Heritage?",
  "¿Cómo manejar el riego en frambuesa?",
  "¿Cuáles son las enfermedades más comunes en frambuesa Heritage?",
];

export default function KnowledgePage() {
  const [chatInput, setChatInput] = useState('');
  const [sending, setSending] = useState(false);
  const [localMessages, setLocalMessages] = useState<MessageWithSources[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const {
    messages: persistedMessages,
    addMessages,
    loading: chatLoading,
  } = usePersistentChat('knowledge');

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [localMessages, persistedMessages]);

  const handleSend = async (message?: string) => {
    const userMessage = (message || chatInput).trim();
    if (!userMessage || sending) return;

    setChatInput('');
    setSending(true);

    // Add user message to local state immediately
    setLocalMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      const response = await fetch('/api/knowledge-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          chatHistory: [...persistedMessages, ...localMessages].slice(-10).map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();

      // Add assistant message with sources to local state
      setLocalMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: data.response,
          sources: data.sources || [],
        },
      ]);

      // Persist both messages
      await new Promise(resolve => setTimeout(resolve, 1));
      await addMessages([
        { role: 'user', content: userMessage },
        { role: 'assistant', content: data.response },
      ]);
    } catch (error) {
      console.error('Error in knowledge chat:', error);
      setLocalMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Lo siento, hubo un error al procesar tu consulta. Por favor, inténtalo de nuevo.',
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Combine persisted + local messages for display
  const allMessages = localMessages.length > 0
    ? localMessages
    : persistedMessages.map(m => ({ role: m.role, content: m.content } as MessageWithSources));

  const showWelcome = allMessages.length === 0 && !chatLoading;

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Floating decorative elements */}
      <div className="absolute top-24 left-20 w-32 h-32 rounded-full bg-primary/10 blur-3xl animate-pulse-subtle" />
      <div className="absolute top-60 right-32 w-40 h-40 rounded-full bg-accent/10 blur-3xl animate-pulse-subtle" style={{animationDelay: '1s'}} />
      <div className="absolute bottom-40 left-1/3 w-24 h-24 rounded-full bg-primary/10 blur-2xl animate-pulse-subtle" style={{animationDelay: '2s'}} />
      
      <div className="container mx-auto py-8 lg:py-12 max-w-6xl relative z-10">
        {/* Hero section */}
        <div className="relative mb-8 lg:mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-6 backdrop-blur-sm stagger-item border border-primary/20 shadow-[0_0_10px_rgba(var(--primary),0.2)]" style={{ animationDelay: '0ms' }}>
            <Brain className="w-4 h-4 text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.8)]" />
            <span className="text-sm font-medium text-primary font-body">Base de Conocimiento</span>
          </div>
          <h1 className="text-5xl lg:text-7xl font-display font-bold tracking-tight mb-4 stagger-item" style={{ animationDelay: '50ms' }}>
            <span className="block text-iridescent">Frambuesa</span>
            <span className="block text-primary">Heritage</span>
          </h1>
          <p className="text-xl text-muted-foreground font-body max-w-2xl stagger-item" style={{ animationDelay: '100ms' }}>
            Consulta información técnica extraída de manuales especializados sobre cultivo de frambuesa Heritage en Perú
          </p>
        </div>
        
        {/* Main card */}
        <div className="relative bio-panel rounded-[2rem] p-1 overflow-hidden card-hover">
          <div className="shimmer-bio" />
          <div className="relative bg-background/40 backdrop-blur-3xl rounded-[calc(2rem-4px)] h-[calc(100vh-14rem)] flex flex-col w-full">
          <Card className="bg-transparent border-0 shadow-none h-full flex flex-col">
            <CardHeader className="relative border-b border-primary/10 p-6 flex-shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 transition-transform duration-normal hover:scale-110 hover:shadow-[0_0_20px_rgba(var(--primary),0.3)]">
                  <BookOpenText className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-display font-bold tracking-tight">Chat de Conocimiento</CardTitle>
                  <CardDescription className="font-body">
                    Pregunta sobre cultivo, enfermedades, plagas y más
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
          {/* Messages area */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {showWelcome && (
                <div className="text-center py-12 space-y-8">
                  <div className="flex justify-center">
                    <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 shadow-[0_0_15px_rgba(var(--primary),0.2)] flex items-center justify-center backdrop-blur-sm animate-scale-in">
                      <Sparkles className="w-10 h-10 text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.8)] animate-float" style={{ animationDuration: '3s' }} />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-display font-semibold mb-3">¡Bienvenido a la Base de Conocimiento!</h3>
                    <p className="text-base text-muted-foreground max-w-xl mx-auto font-body leading-relaxed">
                      Pregunta sobre cultivo, enfermedades, plagas, manejo, poda, riego y más sobre Frambuesa Heritage. Las respuestas están respaldadas por manuales técnicos especializados.
                    </p>
                  </div>

                  {/* Suggested questions - asymmetric grid layout */}
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground font-medium font-body flex items-center justify-center gap-2">
                      <Lightbulb className="w-4 h-4" />
                      Preguntas sugeridas:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-4xl mx-auto">
                      {SUGGESTED_QUESTIONS.map((q, i) => (
                        <Button
                          key={i}
                          variant="outline"
                          className="text-sm h-auto py-3 px-4 whitespace-normal text-left btn-press stagger-item border-2 border-border/40 hover:border-primary/40 hover:bg-primary/5 hover:text-foreground transition-all"
                          onClick={() => handleSend(q)}
                          disabled={sending}
                        >
                          {q}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {allMessages.map((msg, index) => (
                <div key={index} className={`flex gap-3 ${msg.role === 'user' ? 'animate-slide-in-right' : 'animate-slide-in-left'}`}>
                  <div className="flex-shrink-0 mt-1">
                    {msg.role === 'user' ? (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                        <Bot className="h-4 w-4 text-accent" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium font-display">
                        {msg.role === 'user' ? 'Tú' : 'AgriVision'}
                      </span>
                      {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
                        <Badge variant="secondary" className="text-xs bg-accent/20 text-accent border-accent/30">
                          <FileText className="w-3 h-3 mr-1" />
                          {msg.sources.length} fuentes
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground whitespace-pre-wrap font-body">
                      {msg.content}
                    </div>

                    {/* Source citations */}
                    {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
                      <div className="mt-3 space-y-1">
                        <p className="text-xs font-medium text-muted-foreground font-body">Fuentes consultadas:</p>
                        <div className="flex flex-wrap gap-1">
                          {msg.sources.map((src, si) => (
                            <Badge
                              key={si}
                              variant="outline"
                              className="text-xs font-normal py-1 font-body transition-all duration-normal hover:scale-105 hover:shadow-sm cursor-default"
                              title={src.snippet}
                            >
                              <FileText className="w-3 h-3 mr-1" />
                              {src.source} — p.{src.page} ({src.relevance}%)
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {sending && (
                <div className="flex gap-3 chat-msg-enter">
                  <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-accent" />
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground font-body">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Consultando base de conocimiento...
                  </div>
                </div>
              )}

              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          {/* Input area */}
          <div className="p-6 border-t border-primary/10 flex-shrink-0 bg-background/50">
            <div className="flex gap-3">
              <Input
                placeholder="Escribe tu pregunta sobre frambuesa Heritage..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={sending}
                className="flex-1 font-body text-base h-12 border-2 input-focus-ring"
              />
              <Button
                onClick={() => handleSend()}
                disabled={!chatInput.trim() || sending}
                size="lg"
                className="px-6 btn-press"
              >
                {sending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
        </div>
      </div>
      </div>
    </div>
  );
}
