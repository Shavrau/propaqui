import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Edit } from "lucide-react";

interface AlterarAreaDialogProps {
  loteId: string;
  areaAtual: number;
  onAreaAlterada: () => void;
}

const AlterarAreaDialog = ({ loteId, areaAtual, onAreaAlterada }: AlterarAreaDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [novaArea, setNovaArea] = useState(areaAtual.toString());
  const [motivo, setMotivo] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const areaNovaNum = parseFloat(novaArea);
      
      if (isNaN(areaNovaNum) || areaNovaNum <= 0) {
        toast.error("Área inválida");
        return;
      }

      if (areaNovaNum === areaAtual) {
        toast.error("A nova área deve ser diferente da atual");
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Atualizar área do lote
      const { error: updateError } = await supabase
        .from("lotes")
        .update({ area_total: areaNovaNum })
        .eq("id", loteId);

      if (updateError) throw updateError;

      // Registrar histórico de alteração
      const { error: historicoError } = await supabase
        .from("historico_alteracao_area")
        .insert({
          lote_id: loteId,
          area_anterior: areaAtual,
          area_nova: areaNovaNum,
          motivo: motivo || null,
          alterado_por: user.id,
        });

      if (historicoError) throw historicoError;

      toast.success("Área alterada com sucesso!");
      setOpen(false);
      setMotivo("");
      setNovaArea(areaAtual.toString());
      onAreaAlterada();
    } catch (error: any) {
      toast.error(error.message || "Erro ao alterar área");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="h-4 w-4 mr-2" />
          Alterar Área
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Alterar Área do Lote</DialogTitle>
          <DialogDescription>
            Área atual: {areaAtual} m²
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nova-area">Nova Área (m²)</Label>
            <Input
              id="nova-area"
              type="number"
              step="0.01"
              value={novaArea}
              onChange={(e) => setNovaArea(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo da Alteração</Label>
            <Textarea
              id="motivo"
              placeholder="Descreva o motivo da alteração..."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={3}
            />
          </div>
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar Alteração"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AlterarAreaDialog;