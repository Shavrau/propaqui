import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Search, MapPin, Ruler } from "lucide-react";

interface Lote {
  id: string;
  numero_iptu: string;
  numero_cadastro: string;
  loteamento: string;
  quadra: string;
  numero_lote: string;
  area_total: number;
}

const Buscar = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Lote[]>([]);
  const [filters, setFilters] = useState({
    numero_iptu: "",
    numero_cadastro: "",
    loteamento: "",
    quadra: "",
    numero_lote: "",
  });

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin'
      });
      
      setIsAdmin(data === true);
    }
  };

  const formatIPTU = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    return numbers
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})\d+?$/, "$1");
  };

  const sanitizeAlphanumeric = (value: string) => {
    return value.replace(/[^a-zA-Z0-9\s\-]/g, "").toUpperCase();
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let query = supabase.from("lotes").select("*");

      if (filters.numero_iptu) {
        query = query.ilike("numero_iptu", `%${filters.numero_iptu}%`);
      }
      if (filters.numero_cadastro) {
        query = query.ilike("numero_cadastro", `%${filters.numero_cadastro}%`);
      }
      if (filters.loteamento) {
        query = query.ilike("loteamento", `%${filters.loteamento}%`);
      }
      if (filters.quadra) {
        query = query.ilike("quadra", `%${filters.quadra}%`);
      }
      if (filters.numero_lote) {
        query = query.ilike("numero_lote", `%${filters.numero_lote}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setResults(data || []);
      
      if (data?.length === 0) {
        toast.info("Nenhum lote encontrado com os critérios de busca");
      }
    } catch (error: any) {
      toast.error("Erro ao buscar lotes");
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setFilters({
      numero_iptu: "",
      numero_cadastro: "",
      loteamento: "",
      quadra: "",
      numero_lote: "",
    });
    setResults([]);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar isAdmin={isAdmin} />
      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Buscar Lotes</h1>
            <p className="text-muted-foreground">
              Utilize os filtros abaixo para encontrar lotes específicos
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Filtros de Busca
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="numero_iptu">Número IPTU</Label>
                    <Input
                      id="numero_iptu"
                      placeholder="000.000.000.000"
                      value={filters.numero_iptu}
                      onChange={(e) =>
                        setFilters({ ...filters, numero_iptu: formatIPTU(e.target.value) })
                      }
                      maxLength={15}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="numero_cadastro">Número de Cadastro</Label>
                    <Input
                      id="numero_cadastro"
                      placeholder="Ex: CAD-12345"
                      value={filters.numero_cadastro}
                      onChange={(e) =>
                        setFilters({ ...filters, numero_cadastro: sanitizeAlphanumeric(e.target.value) })
                      }
                      maxLength={20}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="loteamento">Loteamento</Label>
                    <Input
                      id="loteamento"
                      placeholder="Nome do loteamento"
                      value={filters.loteamento}
                      onChange={(e) =>
                        setFilters({ ...filters, loteamento: e.target.value.slice(0, 100) })
                      }
                      maxLength={100}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quadra">Quadra</Label>
                    <Input
                      id="quadra"
                      placeholder="Ex: A, B, 01"
                      value={filters.quadra}
                      onChange={(e) => setFilters({ ...filters, quadra: sanitizeAlphanumeric(e.target.value) })}
                      maxLength={10}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="numero_lote">Número do Lote</Label>
                    <Input
                      id="numero_lote"
                      placeholder="Ex: 001, 123"
                      value={filters.numero_lote}
                      onChange={(e) =>
                        setFilters({ ...filters, numero_lote: sanitizeAlphanumeric(e.target.value) })
                      }
                      maxLength={10}
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button type="submit" disabled={loading}>
                    {loading ? "Buscando..." : "Buscar"}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleClearFilters}>
                    Limpar Filtros
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {results.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">
                Resultados da Busca ({results.length})
              </h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {results.map((lote) => (
                  <Card
                    key={lote.id}
                    className="hover:shadow-lg transition-all cursor-pointer"
                    onClick={() => {
                      if (!isAdmin) {
                        toast.error("Apenas administradores podem acessar os detalhes dos lotes");
                        navigate("/dashboard");
                        return;
                      }
                      navigate(`/lote-detalhes/${lote.id}`);
                    }}
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
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Buscar;
