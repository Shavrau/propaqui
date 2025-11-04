import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-8 max-w-2xl px-4">
        <div className="flex justify-center mb-6">
          <div className="p-6 bg-primary/10 rounded-full">
            <Building2 className="h-20 w-20 text-primary" />
          </div>
        </div>
        <div>
          <h1 className="mb-4 text-5xl font-bold">Sistema de Gestão de Lotes</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Gerencie lotes, histórico de construções e controle de acessos em uma única plataforma profissional.
          </p>
        </div>
        <div className="flex gap-4 justify-center">
          <Button size="lg" onClick={() => navigate("/auth")}>
            Entrar no Sistema
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
