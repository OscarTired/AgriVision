import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto py-12 px-4 max-w-3xl">
      <Card className="bio-panel border-primary/20">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary">Política de Privacidad</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-foreground/80 leading-relaxed">
          <p className="text-sm text-muted-foreground">Última actualización: {new Date().toLocaleDateString('es-ES')}</p>

          <section>
            <h3 className="text-xl font-semibold text-foreground mb-2">1. Información que recopilamos</h3>
            <p>
              AgriVision utiliza la autenticación de Google (Google OAuth) exclusivamente para permitirle iniciar sesión de forma segura y vincular su historial de chat y consultas a su cuenta. La única información básica que recibimos de Google es:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Su dirección de correo electrónico</li>
              <li>Su nombre y foto de perfil pública</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-foreground mb-2">2. Uso de la información</h3>
            <p>
              Utilizamos esta información <strong>únicamente</strong> para los siguientes propósitos:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Crear y mantener su sesión activa en nuestra plataforma.</li>
              <li>Vincular de forma segura su historial de conversaciones y consultas sobre el manejo de la Frambuesa Heritage.</li>
              <li>Personalizar su experiencia en la aplicación.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-foreground mb-2">3. Privacidad y Terceros</h3>
            <p>
              <strong>No vendemos, alquilamos ni compartimos</strong> su información personal con terceros con fines publicitarios. Sus consultas al chat se procesan mediante servicios de inteligencia artificial (Vertex AI) bajo estrictos acuerdos de confidencialidad y privacidad empresarial, asegurando que sus datos no se utilicen para entrenar modelos públicos de terceros.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-foreground mb-2">4. Retención y Control de sus Datos</h3>
            <p>
              Mantenemos su historial de interacciones para que usted pueda consultarlo posteriormente. Usted tiene el control total: puede eliminar conversaciones específicas directamente desde la interfaz o solicitar la eliminación completa de su cuenta e historial en cualquier momento.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-foreground mb-2">5. Cambios en esta política</h3>
            <p>
              Podemos actualizar esta política de privacidad ocasionalmente para reflejar cambios en nuestras prácticas. Se considera vigente la versión publicada en esta página.
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
