'use client';

import { useState } from 'react';
import { useSession } from '@/lib/auth-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Mail, 
  Crown, 
  Bell, 
  Palette, 
  Shield, 
  Loader2,
  Check,
  X,
  Leaf
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ProfilePage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  
  // Preferences state
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    pushNotifications: false,
    marketingEmails: false,
    darkMode: false,
    compactMode: false,
  });

  const handleSavePreferences = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
    toast({
      title: 'Preferencias guardadas',
      description: 'Tus cambios han sido guardados exitosamente.',
    });
  };

  if (!session?.user) {
    return (
      <div className="container mx-auto py-8 max-w-4xl">
        <div className="relative bio-panel rounded-[2rem] p-1 overflow-hidden card-hover">
          <div className="shimmer-bio" />
          <div className="relative bg-background/40 backdrop-blur-3xl rounded-[calc(2rem-4px)] h-full w-full">
        <Card className="bg-transparent border-0 shadow-none">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <User className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No has iniciado sesión</h3>
            <p className="text-muted-foreground">
              Inicia sesión para ver y gestionar tu perfil
            </p>
          </CardContent>
        </Card>
          </div>
        </div>
      </div>
    );
  }

  const user = session.user;

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-10 text-center flex flex-col items-center">
        <div className="w-12 h-12 rounded-full border border-primary/30 flex items-center justify-center bg-background/50 backdrop-blur-md shadow-[0_0_15px_rgba(var(--primary),0.2)] animate-float-bio mb-4 stagger-item" style={{ animationDelay: '0ms' }}>
          <User className="w-6 h-6 text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.8)]" />
        </div>
        <h1 className="text-4xl lg:text-5xl font-display font-bold mb-3 tracking-tight stagger-item" style={{ animationDelay: '50ms' }}>
          Mi <span className="text-iridescent">Perfil</span>
        </h1>
        <p className="text-muted-foreground font-body mt-1 stagger-item" style={{ animationDelay: '100ms' }}>
          Gestiona tu información personal y preferencias
        </p>
      </div>

      <Tabs defaultValue="perfil" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="perfil" className="gap-2">
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">Perfil</span>
          </TabsTrigger>
          <TabsTrigger value="plan" className="gap-2">
            <Crown className="w-4 h-4" />
            <span className="hidden sm:inline">Plan</span>
          </TabsTrigger>
          <TabsTrigger value="preferencias" className="gap-2">
            <Palette className="w-4 h-4" />
            <span className="hidden sm:inline">Preferencias</span>
          </TabsTrigger>
          <TabsTrigger value="notificaciones" className="gap-2">
            <Bell className="w-4 h-4" />
            <span className="hidden sm:inline">Notificaciones</span>
          </TabsTrigger>
        </TabsList>

        {/* Perfil Tab */}
        <TabsContent value="perfil">
          <div className="relative bio-panel rounded-[2rem] p-1 overflow-hidden card-hover">
            <div className="shimmer-bio" />
            <div className="relative bg-background/40 backdrop-blur-3xl rounded-[calc(2rem-4px)] h-full w-full">
          <Card className="bg-transparent border-0 shadow-none">
            <CardHeader>
              <CardTitle className="font-display">Información Personal</CardTitle>
              <CardDescription className="font-body">
                Tu información básica y datos de contacto
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20 transition-all duration-normal hover:ring-4 hover:ring-primary/20 cursor-default">
                  <AvatarImage src={user.image || ''} alt={user.name || ''} />
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl font-display">
                    {user.name?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold font-display text-lg">{user.name || 'Usuario'}</h3>
                  <p className="text-sm text-muted-foreground font-body">{user.email}</p>
                  <Badge variant="outline" className="mt-2 font-body">
                    <Check className="w-3 h-3 mr-1" />
                    Verificado
                  </Badge>
                </div>
              </div>

              <Separator className="bg-border/40" />

              {/* Form Fields */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name" className="font-body">
                    <User className="w-4 h-4 inline mr-2" />
                    Nombre completo
                  </Label>
                  <Input 
                    id="name" 
                    value={user.name || ''} 
                    readOnly 
                    className="font-body bg-muted/50 border-border/40"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="font-body">
                    <Mail className="w-4 h-4 inline mr-2" />
                    Correo electrónico
                  </Label>
                  <Input 
                    id="email" 
                    value={user.email || ''} 
                    readOnly 
                    className="font-body bg-muted/50 border-border/40"
                  />
                </div>
              </div>

              <div className="bg-primary/5 border border-primary/10 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium font-body text-sm">Seguridad de la cuenta</p>
                    <p className="text-xs text-muted-foreground font-body mt-1">
                      Tu cuenta está protegida con autenticación segura. 
                      La información personal no puede ser modificada directamente.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
            </div>
          </div>
        </TabsContent>

        {/* Plan Tab */}
        <TabsContent value="plan">
          <div className="relative bio-panel rounded-[2rem] p-1 overflow-hidden card-hover">
            <div className="shimmer-bio" style={{ animationDelay: '0.5s' }} />
            <div className="relative bg-background/40 backdrop-blur-3xl rounded-[calc(2rem-4px)] h-full w-full">
          <Card className="bg-transparent border-0 shadow-none">
            <CardHeader>
              <CardTitle className="font-display">Plan de Suscripción</CardTitle>
              <CardDescription className="font-body">
                Detalles de tu plan actual y beneficios
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Current Plan */}
              <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl p-6 border border-primary/20">
                <div className="flex items-center justify-between">
                  <div>
                    <Badge className="mb-2 font-body bg-primary text-primary-foreground">
                      <Leaf className="w-3 h-3 mr-1" />
                      Plan Actual
                    </Badge>
                    <h3 className="text-3xl font-display font-bold">Gratuito</h3>
                    <p className="text-sm text-muted-foreground font-body mt-1">
                      Acceso básico a todas las funciones
                    </p>
                  </div>
                  <Crown className="w-12 h-12 text-primary/40" />
                </div>
              </div>

              {/* Features */}
              <div className="space-y-4">
                <h4 className="font-semibold font-body text-lg">Incluido en tu plan:</h4>
                <div className="grid gap-3">
                  {[
                    'Diagnóstico de cultivos con IA',
                    'Consultas al chat del clima',
                    'Base de conocimiento técnico',
                    'Historial de diagnósticos',
                    'Soporte por correo electrónico',
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center gap-3 text-sm font-body stagger-item border border-border/40 p-3 rounded-xl bg-background/50">
                      <Check className="w-5 h-5 text-primary" />
                      {feature}
                    </div>
                  ))}
                </div>
              </div>

              <Separator className="bg-border/40" />

              {/* Upgrade CTA */}
              <div className="bg-accent/5 border border-accent/20 rounded-xl p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium font-body text-accent">¿Necesitas más?</p>
                    <p className="text-xs text-muted-foreground font-body mt-1">
                      Próximamente: Plan Pro con análisis avanzados
                    </p>
                  </div>
                  <Button disabled variant="outline" className="font-body border-accent/30 text-accent bg-transparent">
                    Próximamente
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
            </div>
          </div>
        </TabsContent>

        {/* Preferencias Tab */}
        <TabsContent value="preferencias">
          <div className="relative bio-panel rounded-[2rem] p-1 overflow-hidden card-hover">
            <div className="shimmer-bio" style={{ animationDelay: '1s' }} />
            <div className="relative bg-background/40 backdrop-blur-3xl rounded-[calc(2rem-4px)] h-full w-full">
          <Card className="bg-transparent border-0 shadow-none">
            <CardHeader>
              <CardTitle className="font-display">Preferencias de la Aplicación</CardTitle>
              <CardDescription className="font-body">
                Personaliza tu experiencia en AgriVision
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {/* Dark Mode */}
                <div className="flex items-center justify-between p-4 bg-muted/20 border border-border/40 rounded-xl">
                  <div className="space-y-0.5">
                    <Label className="font-body text-base">Modo oscuro</Label>
                    <p className="text-xs text-muted-foreground font-body">
                      Cambia entre tema claro y oscuro
                    </p>
                  </div>
                  <Switch 
                    checked={preferences.darkMode}
                    onCheckedChange={(checked) => 
                      setPreferences(prev => ({ ...prev, darkMode: checked }))
                    }
                  />
                </div>

                {/* Compact Mode */}
                <div className="flex items-center justify-between p-4 bg-muted/20 border border-border/40 rounded-xl">
                  <div className="space-y-0.5">
                    <Label className="font-body text-base">Vista compacta</Label>
                    <p className="text-xs text-muted-foreground font-body">
                      Reduce el espaciado entre elementos
                    </p>
                  </div>
                  <Switch 
                    checked={preferences.compactMode}
                    onCheckedChange={(checked) => 
                      setPreferences(prev => ({ ...prev, compactMode: checked }))
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button 
                  onClick={handleSavePreferences}
                  disabled={isSaving}
                  className="font-body btn-press rounded-xl px-6"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Guardar preferencias
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
            </div>
          </div>
        </TabsContent>

        {/* Notificaciones Tab */}
        <TabsContent value="notificaciones">
          <div className="relative bio-panel rounded-[2rem] p-1 overflow-hidden card-hover">
            <div className="shimmer-bio" style={{ animationDelay: '1.5s' }} />
            <div className="relative bg-background/40 backdrop-blur-3xl rounded-[calc(2rem-4px)] h-full w-full">
          <Card className="bg-transparent border-0 shadow-none">
            <CardHeader>
              <CardTitle className="font-display">Configuración de Notificaciones</CardTitle>
              <CardDescription className="font-body">
                Elige cómo y cuándo quieres recibir notificaciones
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {/* Email Notifications */}
                <div className="flex items-center justify-between p-4 bg-muted/20 border border-border/40 rounded-xl">
                  <div className="space-y-0.5">
                    <Label className="font-body text-base">Notificaciones por correo</Label>
                    <p className="text-xs text-muted-foreground font-body">
                      Recibe actualizaciones importantes en tu correo
                    </p>
                  </div>
                  <Switch 
                    checked={preferences.emailNotifications}
                    onCheckedChange={(checked) => 
                      setPreferences(prev => ({ ...prev, emailNotifications: checked }))
                    }
                  />
                </div>

                {/* Push Notifications */}
                <div className="flex items-center justify-between p-4 bg-muted/20 border border-border/40 rounded-xl">
                  <div className="space-y-0.5">
                    <Label className="font-body text-base">Notificaciones push</Label>
                    <p className="text-xs text-muted-foreground font-body">
                      Alertas en tiempo real del navegador
                    </p>
                  </div>
                  <Switch 
                    checked={preferences.pushNotifications}
                    onCheckedChange={(checked) => 
                      setPreferences(prev => ({ ...prev, pushNotifications: checked }))
                    }
                  />
                </div>

                {/* Marketing Emails */}
                <div className="flex items-center justify-between p-4 bg-muted/20 border border-border/40 rounded-xl">
                  <div className="space-y-0.5">
                    <Label className="font-body text-base">Correos promocionales</Label>
                    <p className="text-xs text-muted-foreground font-body">
                      Novedades, consejos agrícolas y ofertas especiales
                    </p>
                  </div>
                  <Switch 
                    checked={preferences.marketingEmails}
                    onCheckedChange={(checked) => 
                      setPreferences(prev => ({ ...prev, marketingEmails: checked }))
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button 
                  onClick={handleSavePreferences}
                  disabled={isSaving}
                  className="font-body btn-press rounded-xl px-6"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Guardar preferencias
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
