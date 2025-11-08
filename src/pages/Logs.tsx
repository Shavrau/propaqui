import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Sidebar from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { FileText } from "lucide-react";

interface LogAcesso {
  id: string;
  cpf_usuario: string;
  data_hora: string;
  lote_id: string;
  lotes: {
    numero_iptu: string;
    numero_lote: string;
    loteamento: string;
  };
}

const Logs = () => {
  const [logs, setLogs] = useState<LogAcesso[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminStatus();
    loadLogs();
  }, []);

  const checkAdminStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin'
      });
      
      if (error || !data) {
        toast.error("Acesso negado");
        window.location.href = "/dashboard";
      } else {
        setIsAdmin(true);
      }
    }
  };

  const loadLogs = async () => {
    try {
      const { data, error } = await supabase
        .from("log_acesso")
        .select(`
          *,
          lotes (
            numero_iptu,
            numero_lote,
            loteamento
          )
        `)
        .order("data_hora", { ascending: false })
        .limit(100);

      if (error) throw error;
      setLogs(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar logs");
    } finally {
      setLoading(false);
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

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar isAdmin={isAdmin} />
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Logs de Acesso</h1>
            <p className="text-muted-foreground">
              Histórico completo de acessos aos lotes do sistema
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Últimos 100 Acessos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {logs.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum log de acesso registrado
                </p>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data/Hora</TableHead>
                        <TableHead>CPF do Usuário</TableHead>
                        <TableHead>IPTU do Lote</TableHead>
                        <TableHead>Número do Lote</TableHead>
                        <TableHead>Loteamento</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>
                            {new Date(log.data_hora).toLocaleString("pt-BR")}
                          </TableCell>
                          <TableCell>{log.cpf_usuario}</TableCell>
                          <TableCell>{log.lotes?.numero_iptu}</TableCell>
                          <TableCell>{log.lotes?.numero_lote}</TableCell>
                          <TableCell>{log.lotes?.loteamento}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Logs;
