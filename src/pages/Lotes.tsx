import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, MapPin, Ruler, Building2 } from "lucide-react";
import { toast } from "sonner";

interface Lote {
  id: string;
  numero_iptu: string;
  numero_cadastro: string;
  loteamento: string;
  quadra: string;
  numero_lote: string;
  area_total: number;
  imagens: string[];
}

const Lotes = () => {
  const navigate = useNavigate();
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserProfile();
    loadLotes();
  }, []);

  const loadUserProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("usuarios")
        .select("perfil")
        .eq("id", user.id)
        .single();
      
      if (data) {
        setIsAdmin(data.perfil === "admin");
      }
    }
  };

  const loadLotes = async () => {
    try {
      const { data, error } = await supabase
        .from("lotes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLotes(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar lotes");
    } finally {
      setLoading(false);
    }
  };

  const handleViewLote = (loteId: string) => {
    navigate(`/lote/${loteId}`);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar isAdmin={isAdmin} />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar isAdmin={isAdmin} />
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Lotes Cadastrados</h1>
              <p className="text-muted-foreground">
                Visualize e gerencie todos os lotes do sistema
              </p>
            </div>
            {isAdmin && (
              <Button onClick={() => navigate("/lote/novo")} size="lg">
                <Plus className="mr-2 h-5 w-5" />
                Novo Lote
              </Button>
            )}
          </div>

          {lotes.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Building2 className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Nenhum lote cadastrado</h3>
                <p className="text-muted-foreground mb-4">
                  {isAdmin 
                    ? "Comece cadastrando o primeiro lote do sistema."
                    : "Aguarde o cadastro de lotes pelos administradores."}
                </p>
                {isAdmin && (
                  <Button onClick={() => navigate("/lote/novo")}>
                    <Plus className="mr-2 h-4 w-4" />
                    Cadastrar Primeiro Lote
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {lotes.map((lote) => (
                <Card
                  key={lote.id}
                  className="hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => handleViewLote(lote.id)}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      Lote {lote.numero_lote}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">IPTU</p>
                      <p className="font-medium">{lote.numero_iptu}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Loteamento</p>
                      <p className="font-medium">{lote.loteamento}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Quadra</p>
                      <p className="font-medium">{lote.quadra}</p>
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      <Ruler className="h-4 w-4 text-accent" />
                      <span className="font-semibold">{lote.area_total} m²</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Lotes;
