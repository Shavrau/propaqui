import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Sidebar from "@/components/Sidebar";
import AlterarAreaDialog from "@/components/AlterarAreaDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Edit, MapPin, Ruler, Calendar, Plus, History } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

interface Historico {
  id: string;
  area_construida: number;
  area_demolida: number;
  data_aprovacao: string;
  created_at: string;
}

interface HistoricoAlteracao {
  id: string;
  area_anterior: number;
  area_nova: number;
  motivo: string | null;
  data_alteracao: string;
  alterado_por: string;
  usuarios: {
    nome: string;
  };
}

const LoteDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lote, setLote] = useState<Lote | null>(null);
  const [historicos, setHistoricos] = useState<Historico[]>([]);
  const [historicosAlteracao, setHistoricosAlteracao] = useState<HistoricoAlteracao[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showHistoricoDialog, setShowHistoricoDialog] = useState(false);
  const [historicoForm, setHistoricoForm] = useState({
    area_construida: "",
    area_demolida: "",
    data_aprovacao: "",
  });

  useEffect(() => {
    loadUserProfile();
    loadLoteDetails();
    loadHistoricos();
    loadHistoricosAlteracao();
    createAccessLog();
  }, [id]);

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

  const loadLoteDetails = async () => {
    try {
      const { data, error } = await supabase
        .from("lotes")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setLote(data);
    } catch (error) {
      toast.error("Erro ao carregar detalhes do lote");
      navigate("/lotes");
    } finally {
      setLoading(false);
    }
  };

  const loadHistoricos = async () => {
    try {
      const { data, error } = await supabase
        .from("historico_construcao")
        .select("*")
        .eq("lote_id", id)
        .order("data_aprovacao", { ascending: false });

      if (error) throw error;
      setHistoricos(data || []);
    } catch (error) {
      console.error("Erro ao carregar históricos:", error);
    }
  };

  const loadHistoricosAlteracao = async () => {
    try {
      const { data, error } = await supabase
        .from("historico_alteracao_area")
        .select(`
          *,
          usuarios:alterado_por (
            nome
          )
        `)
        .eq("lote_id", id)
        .order("data_alteracao", { ascending: false });

      if (error) throw error;
      setHistoricosAlteracao(data || []);
    } catch (error) {
      console.error("Erro ao carregar histórico de alterações:", error);
    }
  };

  const createAccessLog = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from("usuarios")
        .select("cpf")
        .eq("id", user.id)
        .single();

      if (userData) {
        await supabase.from("log_acesso").insert([
          {
            cpf_usuario: userData.cpf,
            lote_id: id,
          },
        ]);
      }
    } catch (error) {
      console.error("Erro ao criar log de acesso:", error);
    }
  };

  const handleAddHistorico = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from("historico_construcao").insert([
        {
          lote_id: id,
          area_construida: parseFloat(historicoForm.area_construida),
          area_demolida: parseFloat(historicoForm.area_demolida || "0"),
          data_aprovacao: historicoForm.data_aprovacao,
        },
      ]);

      if (error) throw error;

      toast.success("Histórico adicionado com sucesso!");
      setShowHistoricoDialog(false);
      setHistoricoForm({ area_construida: "", area_demolida: "", data_aprovacao: "" });
      loadHistoricos();
    } catch (error: any) {
      toast.error("Erro ao adicionar histórico");
    }
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

  if (!lote) return null;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar isAdmin={isAdmin} />
      <main className="flex-1 p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => navigate("/lotes")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            {isAdmin && (
              <Button onClick={() => navigate(`/lote/${id}`)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Button>
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <MapPin className="h-6 w-6 text-primary" />
                Lote {lote.numero_lote} - {lote.loteamento}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">
                      Número IPTU
                    </h3>
                    <p className="text-lg font-semibold">{lote.numero_iptu}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">
                      Número de Cadastro
                    </h3>
                    <p className="text-lg font-semibold">{lote.numero_cadastro}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Quadra</h3>
                    <p className="text-lg font-semibold">{lote.quadra}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">
                      Loteamento
                    </h3>
                    <p className="text-lg font-semibold">{lote.loteamento}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">
                      Número do Lote
                    </h3>
                    <p className="text-lg font-semibold">{lote.numero_lote}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Ruler className="h-5 w-5 text-accent" />
                      <h3 className="text-sm font-medium text-muted-foreground">Área Total</h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-lg font-semibold">{lote.area_total} m²</p>
                      {isAdmin && (
                        <AlterarAreaDialog
                          loteId={lote.id}
                          areaAtual={lote.area_total}
                          onAreaAlterada={() => {
                            loadLoteDetails();
                            loadHistoricosAlteracao();
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {lote.imagens && lote.imagens.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Imagens</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {lote.imagens.map((url, index) => (
                      <img
                        key={index}
                        src={url}
                        alt={`Lote ${index + 1}`}
                        className="w-full h-64 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {historicosAlteracao.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Histórico de Alterações de Área
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {historicosAlteracao.map((alteracao) => (
                    <div
                      key={alteracao.id}
                      className="p-4 border border-border rounded-lg space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {new Date(alteracao.data_alteracao).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          Por: {alteracao.usuarios.nome}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Área Anterior</p>
                          <p className="text-lg font-semibold">{alteracao.area_anterior} m²</p>
                        </div>
                        <span className="text-2xl text-muted-foreground">→</span>
                        <div>
                          <p className="text-sm text-muted-foreground">Área Nova</p>
                          <p className="text-lg font-semibold text-primary">
                            {alteracao.area_nova} m²
                          </p>
                        </div>
                      </div>
                      {alteracao.motivo && (
                        <div className="pt-2 border-t">
                          <p className="text-sm text-muted-foreground">Motivo:</p>
                          <p className="text-sm">{alteracao.motivo}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Histórico de Construção</CardTitle>
              {isAdmin && (
                <Dialog open={showHistoricoDialog} onOpenChange={setShowHistoricoDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Adicionar
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Adicionar Histórico</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddHistorico} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="area_construida">Área Construída (m²) *</Label>
                        <Input
                          id="area_construida"
                          type="number"
                          step="0.01"
                          value={historicoForm.area_construida}
                          onChange={(e) =>
                            setHistoricoForm({
                              ...historicoForm,
                              area_construida: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="area_demolida">Área Demolida (m²)</Label>
                        <Input
                          id="area_demolida"
                          type="number"
                          step="0.01"
                          value={historicoForm.area_demolida}
                          onChange={(e) =>
                            setHistoricoForm({
                              ...historicoForm,
                              area_demolida: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="data_aprovacao">Data de Aprovação *</Label>
                        <Input
                          id="data_aprovacao"
                          type="date"
                          value={historicoForm.data_aprovacao}
                          onChange={(e) =>
                            setHistoricoForm({
                              ...historicoForm,
                              data_aprovacao: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full">
                        Adicionar Histórico
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent>
              {historicos.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum histórico registrado
                </p>
              ) : (
                <div className="space-y-4">
                  {historicos.map((historico) => (
                    <div
                      key={historico.id}
                      className="p-4 border border-border rounded-lg space-y-2"
                    >
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {new Date(historico.data_aprovacao).toLocaleDateString("pt-BR")}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Área Construída</p>
                          <p className="text-lg font-semibold">{historico.area_construida} m²</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Área Demolida</p>
                          <p className="text-lg font-semibold">{historico.area_demolida} m²</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default LoteDetails;
