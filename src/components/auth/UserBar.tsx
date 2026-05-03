'use client';

import { useState } from 'react';
import { signOut, useSession } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { User, LogOut, Settings, History, UserCircle } from 'lucide-react';
import { AuthModal } from './AuthModal';
import Link from 'next/link';

interface UserBarProps {
  onAuthRequired?: () => void;
}

export function UserBar({ onAuthRequired }: UserBarProps) {
  const { data: session } = useSession();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      // Opcional: limpiar localStorage de datos de invitado
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('chat-')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Error during sign out:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleGuestContinue = () => {
    // Simplemente cerrar el modal, el usuario continuará como invitado
    setShowAuthModal(false);
    onAuthRequired?.();
  };

  if (session?.user) {
    // Usuario autenticado
    return (
      <div className="flex items-center gap-3">
        <Badge variant="secondary" className="bg-primary/20 text-primary font-body border border-primary/30">
          Autenticado
        </Badge>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full btn-press transition-all duration-normal hover:ring-2 hover:ring-primary/30">
              <Avatar className="h-10 w-10">
                <AvatarImage src={session.user.image || ''} alt={session.user.name || ''} />
                <AvatarFallback className="bg-primary/20 text-primary font-display">
                  {session.user.name?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none font-display">
                  {session.user.name || 'Usuario'}
                </p>
                <p className="text-xs leading-none text-muted-foreground font-body">
                  {session.user.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="focus:bg-primary/10 focus:text-primary cursor-pointer transition-colors duration-200">
              <Link href="/profile" className="flex items-center w-full">
                <UserCircle className="mr-2 h-4 w-4" />
                <span>Mi Perfil</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="focus:bg-primary/10 focus:text-primary cursor-pointer transition-colors duration-200">
              <Link href="/history" className="flex items-center w-full">
                <History className="mr-2 h-4 w-4" />
                <span>Historial</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleSignOut}
              disabled={isLoggingOut}
              className="text-red-600 focus:bg-red-50 focus:text-red-700 dark:focus:bg-red-950/30 dark:focus:text-red-400 cursor-pointer transition-colors duration-200 btn-press"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>{isLoggingOut ? 'Cerrando...' : 'Cerrar Sesión'}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  // Usuario no autenticado
  return (
    <>
      <div className="flex items-center gap-3">
        <Badge variant="outline" className="border-accent text-accent font-body badge-pulse shadow-[0_0_10px_rgba(var(--accent),0.2)]">
          Modo Invitado
        </Badge>
        
        <Button 
          onClick={() => setShowAuthModal(true)}
          variant="outline"
          size="sm"
          className="border-primary/50 text-primary hover:bg-primary/10 hover:text-primary btn-press"
        >
          <User className="mr-2 h-4 w-4" />
          Iniciar Sesión
        </Button>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onGuestContinue={handleGuestContinue}
        title="Iniciar Sesión en AgroVision"
        description="Guarda tu progreso y accede a todas las funciones"
      />
    </>
  );
}