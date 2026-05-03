"use client";

import { useState, useEffect, useRef } from 'react';
import { useSession } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { MessageCircle, Calendar, Trash2, Eye, Stethoscope, CloudRain, User, Bot, Send, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface ChatSession {
  id: string;
  chatType: 'diagnosis' | 'weather' | 'knowledge';
  messages: ChatMessage[];
  lastUpdated: string;
  title?: string;
  messageCount?: number;
}

export default function HistoryPage() {
  const { data: session } = useSession();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [chatInput, setChatInput] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const sendingRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { isPending } = useSession();

  // Redirigir al usuario si cierra sesión
  useEffect(() => {
    if (!isPending && session === null) {
      router.push('/');
    }
  }, [session, isPending, router]);

  // Auto-scroll para los mensajes del chat
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedSession?.messages, sendingMessage]);

  useEffect(() => {
    // Solo cargar una vez al montar el componente
    if (!isInitialized) {
      loadChatHistory();
      setIsInitialized(true);
    }
  }, [isInitialized]); // Controlar con flag para evitar re-cargas

  const loadChatHistory = async () => {
    if (loading) return; // Evitar múltiples llamadas simultáneas
    
    try {
      setLoading(true);
      console.log('[DEBUG] Cargando historial de chat...');
      
      // Intentar cargar desde la API primero
      const response = await fetch('/api/chat-history?list=true', {
        cache: 'no-cache' // Evitar cache para obtener datos frescos
      });
      console.log('[DEBUG] Respuesta de API:', response.status, response.statusText);
      
      if (response.ok) {
        const data = await response.json();
        //console.log('[DEBUG] Datos recibidos de API:', data);
        //console.log('[DEBUG] Número de sesiones:', data.sessions?.length || 0);
        setSessions(data.sessions || []);
      } else {
        console.error('Error loading chat history from API:', response.statusText);
        // Fallback a localStorage si la API falla
        loadLocalHistory();
        return;
      }
    } catch (error) {
      console.error('Error loading chat history from API:', error);
      // Fallback a localStorage si la API falla
      loadLocalHistory();
      return;
    } finally {
      setLoading(false);
    }
  };

  const loadSessionMessages = async (sessionId: string, chatType: string) => {
    if (loadingMessages) return []; // Evitar múltiples llamadas simultáneas
    
    try {
      setLoadingMessages(true);
      //console.log('[DEBUG] Cargando mensajes para sesión:', sessionId, chatType);
      
      const response = await fetch(`/api/chat-history?type=${chatType}&sessionId=${sessionId}`, {
        cache: 'no-cache' // Evitar cache para obtener datos frescos
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('[DEBUG] Mensajes cargados:', data.messages?.length || 0);
        return data.messages || [];
      } else {
        console.error('Error loading session messages:', response.statusText);
        return [];
      }
    } catch (error) {
      console.error('Error loading session messages:', error);
      return [];
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSessionSelect = async (session: ChatSession) => {
    //console.log('[DEBUG] Seleccionando sesión:', session.id);
    
    // Evitar re-seleccionar la misma sesión
    if (selectedSession?.id === session.id) {
      return;
    }
    
    // Si la sesión ya tiene mensajes cargados, usarlos
    if (session.messages && session.messages.length > 0) {
      setSelectedSession(session);
      return;
    }
    
    // Cargar mensajes de la sesión
    const messages = await loadSessionMessages(session.id, session.chatType);
    const sessionWithMessages = {
      ...session,
      messages
    };
    
    setSelectedSession(sessionWithMessages);
  };

  const loadLocalHistory = () => {
    try {
      setLoading(true);
      const localSessions: ChatSession[] = [];
      
      // Buscar sesiones en localStorage
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('chat-')) {
          try {
            const sessionData = JSON.parse(localStorage.getItem(key) || '{}');
            if (sessionData.messages && sessionData.messages.length > 0) {
              const chatType = key.includes('diagnosis') ? 'diagnosis' : 'weather';
              localSessions.push({
                id: sessionData.id || key,
                chatType,
                messages: sessionData.messages,
                lastUpdated: sessionData.lastUpdated || new Date().toISOString(),
                title: generateSessionTitle(sessionData.messages[0]?.content, chatType)
              });
            }
          } catch (error) {
            console.error('Error parsing session:', error);
          }
        }
      });
      
      setSessions(localSessions.sort((a, b) => 
        new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
      ));
    } catch (error) {
      console.error('Error loading local history:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSessionTitle = (firstMessage: string, chatType: string) => {
    if (!firstMessage) return `Sesión de ${chatType === 'diagnosis' ? 'diagnóstico' : 'clima'}`;
    const truncated = firstMessage.length > 50 ? firstMessage.substring(0, 50) + '...' : firstMessage;
    return truncated;
  };

  const deleteSession = async (sessionId: string) => {
    try {
      if (session?.user) {
        // Para usuarios autenticados, eliminar de la API
        const sessionToDelete = sessions.find(s => s.id === sessionId);
        if (sessionToDelete) {
          await fetch(`/api/chat-history?type=${sessionToDelete.chatType}&sessionId=${sessionId}`, {
            method: 'DELETE'
          });
        }
      } else {
        // Para usuarios invitados, eliminar de localStorage
        const keyToDelete = Object.keys(localStorage).find(key => 
          key.startsWith('chat-') && localStorage.getItem(key)?.includes(sessionId)
        );
        if (keyToDelete) {
          localStorage.removeItem(keyToDelete);
        }
      }
      
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      if (selectedSession?.id === sessionId) {
        setSelectedSession(null);
      }
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  const filteredSessions = sessions.filter(session => {
    if (activeTab === 'all') return true;
    return session.chatType === activeTab;
  });

  const getChatTypeIcon = (chatType: string) => {
    if (chatType === 'diagnosis') return <Stethoscope className="h-4 w-4" />;
    if (chatType === 'knowledge') return <MessageCircle className="h-4 w-4" />;
    return <CloudRain className="h-4 w-4" />;
  };

  const handleSendChatMessage = async () => {
    console.log('🔍 [DEBUG] handleSendChatMessage llamado - sendingMessage:', sendingMessage, 'sendingRef:', sendingRef.current);
    
    // Verificación con ref para prevenir múltiples ejecuciones simultáneas
    if (sendingRef.current) {
      console.log('🔍 [DEBUG] Ya hay un mensaje siendo enviado (ref), ignorando...');
      return;
    }
    
    if (!chatInput.trim() || !selectedSession || sendingMessage) {
      console.log('🔍 [DEBUG] Condiciones no cumplidas - chatInput:', !!chatInput.trim(), 'selectedSession:', !!selectedSession, 'sendingMessage:', sendingMessage);
      return;
    }
    
    // Marcar como enviando INMEDIATAMENTE para prevenir duplicados
    console.log('🔍 [DEBUG] Iniciando envío de mensaje...');
    sendingRef.current = true;
    setSendingMessage(true);
    
    const messageContent = chatInput.trim();
    setChatInput(''); // Limpiar input inmediatamente

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: messageContent,
      timestamp: new Date().toISOString()
    };

    // Agregar mensaje del usuario inmediatamente
    const updatedSession = {
      ...selectedSession,
      messages: [...selectedSession.messages, userMessage]
    };
    setSelectedSession(updatedSession);

    try {
      let response;
      
      if (selectedSession.chatType === 'diagnosis') {
        // Para chat de diagnóstico, usar contexto básico
        response = await fetch('/api/diagnosis-chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: userMessage.content,
            diagnosisContext: {
              diseaseName: 'Consulta general',
              confidence: 0,
              symptoms: [],
              recommendations: [],
              location: 'Ubicación no especificada',
              coordinates: { lat: 0, lon: 0 },
              weatherData: {
                temperature: 20,
                tempHigh: 25,
                tempLow: 15,
                humidity: 60,
                windSpeed: 10,
                condition: 'Despejado'
              },
              date: new Date().toISOString()
            },
            chatHistory: selectedSession.messages.slice(-10).map(msg => ({
              role: msg.role,
              content: msg.content
            }))
          }),
        });
      } else if (selectedSession.chatType === 'knowledge') {
        // Para chat de conocimiento, usar contexto básico
        response = await fetch('/api/knowledge-chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: userMessage.content,
            knowledgeContext: {
              topic: 'Consulta general',
              subtopic: 'Consulta general',
              date: new Date().toISOString(),
              recommendations: []
            },
            chatHistory: selectedSession.messages.slice(-10).map(msg => ({
              role: msg.role,
              content: msg.content
            }))
          }),
        });
      } else {
        // Para chat de clima, usar contexto básico
        response = await fetch('/api/weather-chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: userMessage.content,
            weatherContext: {
              location: 'Ubicación no especificada',
              coordinates: { lat: 0, lon: 0 },
              date: new Date().toISOString(),
              tempHigh: 25,
              tempLow: 15,
              humidity: 60,
              windSpeed: 10,
              condition: 'Despejado',
              recommendations: []
            },
            chatHistory: selectedSession.messages.slice(-10).map(msg => ({
              role: msg.role,
              content: msg.content
            }))
          }),
        });
      }

      if (!response.ok) {
        throw new Error('Error al enviar mensaje');
      }

      const data = await response.json();
      
      // Crear respuesta del asistente con la respuesta real de la IA
      // Agregar un pequeño delay para asegurar que el timestamp sea posterior al del usuario
      await new Promise(resolve => setTimeout(resolve, 1));
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || 'Lo siento, no pude generar una respuesta.',
        timestamp: new Date().toISOString()
      };

      const finalSession = {
        ...updatedSession,
        messages: [...updatedSession.messages, assistantMessage],
        lastUpdated: new Date().toISOString()
      };
      setSelectedSession(finalSession);
      
      // Actualizar la lista de sesiones
      setSessions(prev => prev.map(s => 
        s.id === selectedSession.id ? finalSession : s
      ));
      
      // Ocultar la animación de escribiendo inmediatamente antes de hacer fetch
      setSendingMessage(false);
      try {
        console.log('🔍 [DEBUG] Guardando mensajes en historial...', {
          userMessageId: userMessage.id,
          assistantMessageId: assistantMessage.id,
          sessionId: selectedSession.id
        });
        // Guardar mensajes secuencialmente para mantener el orden
        await fetch('/api/chat-history', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chatType: selectedSession.chatType,
            sessionId: selectedSession.id,
            role: userMessage.role,
            content: userMessage.content
          }),
        });
        
        await fetch('/api/chat-history', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chatType: selectedSession.chatType,
            sessionId: selectedSession.id,
            role: assistantMessage.role,
            content: assistantMessage.content
          }),
        });
        console.log('🔍 [DEBUG] Mensajes guardados exitosamente');
      } catch (saveError) {
        console.error('Error saving to history:', saveError);
        // No interrumpir el flujo si falla el guardado
      }

    } catch (error) {
      console.error('Error sending message:', error);
      // Mostrar mensaje de error
      // Agregar un pequeño delay para asegurar que el timestamp sea posterior al del usuario
      await new Promise(resolve => setTimeout(resolve, 1));
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Lo siento, hubo un error al procesar tu mensaje. Por favor, inténtalo de nuevo.',
        timestamp: new Date().toISOString()
      };
      
      const errorSession = {
        ...updatedSession,
        messages: [...updatedSession.messages, errorMessage]
      };
      setSelectedSession(errorSession);
    } finally {
       setSendingMessage(false);
       sendingRef.current = false;
     }
   };

  const getChatTypeBadge = (chatType: string) => {
    if (chatType === 'diagnosis') return (
      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
        Diagnóstico
      </Badge>
    );
    if (chatType === 'knowledge') return (
      <Badge variant="secondary" className="bg-accent/20 text-accent border-accent/30">
        Conocimiento
      </Badge>
    );
    return (
      <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30">
        Clima
      </Badge>
    );
  };

  // Removed authentication check - history now works for both authenticated and guest users

  return (
    <div className="container mx-auto px-4 py-8 w-full max-w-full overflow-visible">
      <div className="mb-10 text-center flex flex-col items-center">
        <div className="w-12 h-12 rounded-full border border-primary/30 flex items-center justify-center bg-background/50 backdrop-blur-md shadow-[0_0_15px_rgba(var(--primary),0.2)] animate-float-bio mb-4 stagger-item" style={{ animationDelay: '0ms' }}>
          <MessageCircle className="w-6 h-6 text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.8)]" />
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mb-3 tracking-tight stagger-item break-words max-w-full" style={{ animationDelay: '50ms' }}>
          Historial de <span className="text-iridescent">Conversaciones</span>
        </h1>
        <p className="text-muted-foreground font-body stagger-item" style={{ animationDelay: '50ms' }}>
          Revisa y gestiona tus conversaciones anteriores con AgriVision
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full max-w-full">
        {/* Lista de sesiones */}
        <div className="lg:col-span-1 w-full min-w-0">
          <div className="relative bio-panel rounded-[2rem] p-1 h-full">
            <div className="shimmer-bio" />
            <div className="relative bg-background/40 backdrop-blur-3xl rounded-[calc(2rem-4px)] h-full w-full">
          <Card className="bg-transparent border-0 shadow-none h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display">
                <MessageCircle className="h-5 w-5" />
                Conversaciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-2 sm:flex sm:flex-wrap w-full h-auto gap-2 bg-transparent p-0 mb-4">
                  <TabsTrigger value="all" className="btn-press text-xs sm:text-sm h-9 data-[state=active]:bg-background data-[state=active]:shadow-sm">Todas</TabsTrigger>
                  <TabsTrigger value="diagnosis" className="btn-press text-xs sm:text-sm h-9 data-[state=active]:bg-background data-[state=active]:shadow-sm">Diagnóstico</TabsTrigger>
                  <TabsTrigger value="weather" className="btn-press text-xs sm:text-sm h-9 data-[state=active]:bg-background data-[state=active]:shadow-sm">Clima</TabsTrigger>
                  <TabsTrigger value="knowledge" className="btn-press text-xs sm:text-sm h-9 data-[state=active]:bg-background data-[state=active]:shadow-sm">Conocimiento</TabsTrigger>
                </TabsList>
                
                <div className="mt-2">
                  {loading ? (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground">Cargando...</p>
                    </div>
                  ) : filteredSessions.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground">No hay conversaciones</p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[400px] [&>div]:overflow-visible pr-2">
                      <div className="grid grid-cols-1 sm:grid-cols-1 gap-3 sm:gap-2">
                        {filteredSessions.map((session) => (
                          <Card 
                            key={session.id} 
                            className={`relative cursor-pointer transition-all duration-normal hover:bg-muted/50 stagger-item border-2 ${selectedSession?.id === session.id ? 'border-primary' : 'border-transparent'}`}
                            onClick={() => handleSessionSelect(session)}
                          >
                            <CardContent className="p-3">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    {getChatTypeIcon(session.chatType)}
                                    {getChatTypeBadge(session.chatType)}
                                  </div>
                                  <p className="text-sm font-medium font-display truncate">
                                    {session.title}
                                  </p>
                                  <p className="text-xs text-muted-foreground font-body mt-1 truncate">
                                    {format(new Date(session.lastUpdated), 'dd MMM yy, HH:mm', { locale: es })} · {session.messageCount ?? session.messages.length} msgs
                                  </p>
                                </div>
                                <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-7 w-7 text-muted-foreground hover:text-destructive btn-press"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="max-w-[85vw] sm:max-w-lg rounded-lg p-4 sm:p-6">
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>¿Eliminar conversación?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Esta acción no se puede deshacer. La conversación será eliminada permanentemente.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel className="btn-press">Cancelar</AlertDialogCancel>
                                        <AlertDialogAction 
                                          onClick={() => deleteSession(session.id)}
                                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90 btn-press"
                                        >
                                          Eliminar
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              </Tabs>
            </CardContent>
          </Card>
            </div>
          </div>
        </div>

        {/* Detalle de la sesión */}
        <div className="lg:col-span-2 w-full min-w-0">
          <div className="relative bio-panel rounded-[2rem] p-1 h-full">
            <div className="shimmer-bio" style={{ animationDelay: '2s' }} />
            <div className="relative bg-background/40 backdrop-blur-3xl rounded-[calc(2rem-4px)] h-full w-full">
          <Card className="bg-transparent border-0 shadow-none h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display">
                <Eye className="h-5 w-5" />
                {selectedSession ? 'Detalle de Conversación' : 'Selecciona una conversación'}
              </CardTitle>
              {selectedSession && (
                <CardDescription className="font-body">
                  {getChatTypeBadge(selectedSession.chatType)} • 
                  {format(new Date(selectedSession.lastUpdated), 'dd MMMM yyyy, HH:mm', { locale: es })}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {loadingMessages ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">
                    Cargando mensajes...
                  </p>
                </div>
              ) : selectedSession ? (
                <ScrollArea className="h-[500px]">
                  <div className="space-y-4">
                    {selectedSession.messages && selectedSession.messages.length > 0 ? (
                      selectedSession.messages.map((message, index) => (
                        <div key={message.id || index} className={`flex gap-3 ${message.role === 'user' ? 'animate-slide-in-right' : 'animate-slide-in-left'}`}>
                          <div className="flex-shrink-0">
                            {message.role === 'user' ? (
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="h-4 w-4 text-primary" />
                              </div>
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                                <Bot className="h-4 w-4 text-accent" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium font-display">
                                {message.role === 'user' ? 'Tú' : 'AgriVision'}
                              </span>
                              {message.timestamp && (
                                <span className="text-xs text-muted-foreground font-body">
                                  {format(new Date(message.timestamp), 'HH:mm', { locale: es })}
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground whitespace-pre-wrap font-body">
                              {message.content}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">
                          No hay mensajes en esta conversación
                        </p>
                      </div>
                    )}
                    
                    {/* Indicador de "Escribiendo..." */}
                    {sendingMessage && (
                      <div className="flex gap-3 animate-slide-in-left">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                            <Bot className="h-4 w-4 text-accent" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium font-display">AgriVision</span>
                          </div>
                          <div className="flex gap-1.5 mt-2 bg-muted/50 p-3 rounded-2xl rounded-tl-sm w-fit">
                            <span className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Elemento invisible para el auto-scroll */}
                    <div ref={messagesEndRef} className="h-1" />
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-12 animate-scale-in">
                  <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4 animate-float" style={{ animationDuration: '3s' }} />
                  <p className="text-muted-foreground font-body">
                    Selecciona una conversación de la lista para ver los detalles
                  </p>
                </div>
              )}
              
              {/* Barra de chat completa */}
              {selectedSession && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Escribe tu mensaje..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendChatMessage();
                        }
                      }}
                      disabled={sendingMessage}
                    />
                    <Button 
                      onClick={handleSendChatMessage}
                      disabled={!chatInput.trim() || sendingMessage}
                      size="sm"
                      className="btn-press"
                    >
                      {sendingMessage ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}