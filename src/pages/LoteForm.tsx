import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Upload, X, Plus, Trash2, Construction } from "lucide-react";
import { getSafeErrorMessage, logError } from "@/lib/errorHandler";

const LoteForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = id && id !== "novo";
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [formData, setFormData] = useState({
    numero_iptu: "",
    numero_cadastro: "",
    loteamento: "",
    quadra: "",
    numero_lote: "",
    area_total: "",
  });
  const [imagens, setImagens] = useState<string[]>([]);
  const [historicos, setHistoricos] = useState<Array<{
    area_construida: string;
    area_demolida: string;
    data_aprovacao: string;
  }>>([]);

  useEffect(() => {
    checkAdminStatus();
    if (isEdit) {
      loadLote();
    }
  }, [isEdit, id]);

  const checkAdminStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin'
      });
      
      if (error || !data) {
        toast.error("Acesso negado");
        navigate("/dashboard");
      } else {
        setIsAdmin(true);
      }
    }
  };

  const loadLote = async () => {
    try {
      const { data, error } = await supabase
        .from("lotes")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      
      if (data) {
        setFormData({
          numero_iptu: data.numero_iptu,
          numero_cadastro: data.numero_cadastro,
          loteamento: data.loteamento,
          quadra: data.quadra,
          numero_lote: data.numero_lote,
          area_total: data.area_total.toString(),
        });
        setImagens(data.imagens || []);
      }
    } catch (error) {
      toast.error("Erro ao carregar lote");
      navigate("/lotes");
    }
  };

  const formatIPTU = (value: string) => {
    const numbers = value.replace(/\D/g, "").slice(0, 12);
    const parts = [];
    for (let i = 0; i < numbers.length; i += 3) {
      parts.push(numbers.slice(i, i + 3));
    }
    return parts.join(".");
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (imagens.length + files.length > 2) {
      toast.error("Máximo de 2 imagens por lote");
      return;
    }

    setUploading(true);
    try {
      const uploadedUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split(".").pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("lotes")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Get signed URL for private bucket (valid for 1 year)
        const { data: signedUrlData } = await supabase.storage
          .from("lotes")
          .createSignedUrl(filePath, 31536000); // 365 days in seconds

        if (signedUrlData?.signedUrl) {
          uploadedUrls.push(signedUrlData.signedUrl);
        }
      }

      setImagens([...imagens, ...uploadedUrls]);
      toast.success("Imagens enviadas com sucesso!");
    } catch (error: any) {
      logError(error, 'Image Upload');
      toast.error(getSafeErrorMessage(error));
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (url: string) => {
    setImagens(imagens.filter((img) => img !== url));
  };

  const addHistorico = () => {
    setHistoricos([
      ...historicos,
      {
        area_construida: "",
        area_demolida: "",
        data_aprovacao: "",
      },
    ]);
  };

  const removeHistorico = (index: number) => {
    setHistoricos(historicos.filter((_, i) => i !== index));
  };

  const updateHistorico = (index: number, field: string, value: string) => {
    const updated = [...historicos];
    updated[index] = { ...updated[index], [field]: value };
    setHistoricos(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const loteData = {
        numero_iptu: formData.numero_iptu,
        numero_cadastro: formData.numero_cadastro,
        loteamento: formData.loteamento,
        quadra: formData.quadra,
        numero_lote: formData.numero_lote,
        area_total: parseFloat(formData.area_total),
        imagens,
        created_by: user.id,
      };

      let loteId = id;

      if (isEdit) {
        const { error } = await supabase
          .from("lotes")
          .update(loteData)
          .eq("id", id);

        if (error) throw error;
      } else {
        const { data: newLote, error } = await supabase
          .from("lotes")
          .insert([loteData])
          .select()
          .single();

        if (error) throw error;
        loteId = newLote.id;
      }

      // Processar históricos de construção/demolição
      if (historicos.length > 0 && loteId) {
        let areaAtual = parseFloat(formData.area_total);

        for (const hist of historicos) {
          if (!hist.area_construida || !hist.data_aprovacao) continue;

          const areaConstruida = parseFloat(hist.area_construida);
          const areaDemolida = parseFloat(hist.area_demolida || "0");
          const areaDiferenca = areaConstruida - areaDemolida;
          const novaArea = areaAtual + areaDiferenca;

          // Inserir histórico de construção
          const { error: historicoError } = await supabase
            .from("historico_construcao")
            .insert({
              lote_id: loteId,
              area_construida: areaConstruida,
              area_demolida: areaDemolida,
              data_aprovacao: hist.data_aprovacao,
            });

          if (historicoError) throw historicoError;

          // Registrar no histórico de alterações
          const motivo = areaDiferenca > 0 
            ? `Construção: +${areaConstruida}m² construídos${areaDemolida > 0 ? ` e -${areaDemolida}m² demolidos` : ''}`
            : `Demolição: -${areaDemolida}m² demolidos${areaConstruida > 0 ? ` e +${areaConstruida}m² construídos` : ''}`;

          const { error: alteracaoError } = await supabase
            .from("historico_alteracao_area")
            .insert({
              lote_id: loteId,
              area_anterior: areaAtual,
              area_nova: novaArea,
              motivo: motivo,
              alterado_por: user.id,
            });

          if (alteracaoError) throw alteracaoError;

          // Atualizar área do lote
          const { error: updateAreaError } = await supabase
            .from("lotes")
            .update({ area_total: novaArea })
            .eq("id", loteId);

          if (updateAreaError) throw updateAreaError;

          areaAtual = novaArea;
        }
      }

      toast.success(isEdit ? "Lote atualizado com sucesso!" : "Lote cadastrado com sucesso!");

      navigate("/lotes");
    } catch (error: any) {
      logError(error, 'Save Lote');
      toast.error(getSafeErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar isAdmin={isAdmin} />
      <main className="flex-1 p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/lotes")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>

          <Card>
            <CardHeader>
              <CardTitle>
                {isEdit ? "Editar Lote" : "Cadastrar Novo Lote"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="numero_iptu">Número IPTU *</Label>
                    <Input
                      id="numero_iptu"
                      placeholder="000.000.000.000"
                      value={formData.numero_iptu}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          numero_iptu: formatIPTU(e.target.value),
                        })
                      }
                      maxLength={15}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="numero_cadastro">Número de Cadastro *</Label>
                    <Input
                      id="numero_cadastro"
                      placeholder="Ex: CAD-12345"
                      value={formData.numero_cadastro}
                      onChange={(e) =>
                        setFormData({ ...formData, numero_cadastro: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="loteamento">Loteamento *</Label>
                    <Input
                      id="loteamento"
                      placeholder="Nome do loteamento"
                      value={formData.loteamento}
                      onChange={(e) =>
                        setFormData({ ...formData, loteamento: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quadra">Quadra *</Label>
                    <Input
                      id="quadra"
                      placeholder="Ex: A, B, 01"
                      value={formData.quadra}
                      onChange={(e) =>
                        setFormData({ ...formData, quadra: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="numero_lote">Número do Lote *</Label>
                    <Input
                      id="numero_lote"
                      placeholder="Ex: 001, 123"
                      value={formData.numero_lote}
                      onChange={(e) =>
                        setFormData({ ...formData, numero_lote: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="area_total">Área Total (m²) *</Label>
                    <Input
                      id="area_total"
                      type="number"
                      step="0.01"
                      placeholder="Ex: 250.50"
                      value={formData.area_total}
                      onChange={(e) =>
                        setFormData({ ...formData, area_total: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                {/* Histórico de Construção/Demolição */}
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Construction className="h-5 w-5 text-primary" />
                      <Label className="text-base font-semibold">
                        Histórico de Construção/Demolição
                      </Label>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addHistorico}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Registro
                    </Button>
                  </div>

                  {historicos.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-lg">
                      Nenhum registro adicionado. Clique em "Adicionar Registro" para incluir construções ou demolições.
                    </p>
                  )}

                  {historicos.map((hist, index) => (
                    <div
                      key={index}
                      className="p-4 border border-border rounded-lg space-y-3 bg-muted/30"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Registro #{index + 1}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeHistorico(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`area_construida_${index}`}>
                            Área Construída (m²) *
                          </Label>
                          <Input
                            id={`area_construida_${index}`}
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={hist.area_construida}
                            onChange={(e) =>
                              updateHistorico(index, "area_construida", e.target.value)
                            }
                            required={historicos.length > 0}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`area_demolida_${index}`}>
                            Área Demolida (m²)
                          </Label>
                          <Input
                            id={`area_demolida_${index}`}
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={hist.area_demolida}
                            onChange={(e) =>
                              updateHistorico(index, "area_demolida", e.target.value)
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`data_aprovacao_${index}`}>
                            Data de Aprovação *
                          </Label>
                          <Input
                            id={`data_aprovacao_${index}`}
                            type="date"
                            max={new Date().toISOString().split('T')[0]}
                            value={hist.data_aprovacao}
                            onChange={(e) =>
                              updateHistorico(index, "data_aprovacao", e.target.value)
                            }
                            required={historicos.length > 0}
                          />
                        </div>
                      </div>

                      {hist.area_construida && (
                        <div className="p-2 bg-background rounded text-sm">
                          <span className="text-muted-foreground">Impacto na área: </span>
                          <span className={`font-semibold ${
                            (parseFloat(hist.area_construida || "0") - parseFloat(hist.area_demolida || "0")) >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}>
                            {(parseFloat(hist.area_construida || "0") - parseFloat(hist.area_demolida || "0")) >= 0 ? "+" : ""}
                            {(parseFloat(hist.area_construida || "0") - parseFloat(hist.area_demolida || "0")).toFixed(2)} m²
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <Label>Imagens (máximo 2)</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      disabled={uploading || imagens.length >= 2}
                      className="flex-1"
                    />
                    {uploading && (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                    )}
                  </div>
                  {imagens.length > 0 && (
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      {imagens.map((url, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={url}
                            alt={`Imagem ${index + 1}`}
                            className="w-full h-40 object-cover rounded-lg"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeImage(url)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-4">
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? "Salvando..." : isEdit ? "Atualizar Lote" : "Cadastrar Lote"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/lotes")}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default LoteForm;
