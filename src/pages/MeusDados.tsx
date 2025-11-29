import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  User,
  Shield,
  Download,
  Trash2,
  History,
  FileText,
  Save,
} from "lucide-react";
import { maskCPF } from "@/lib/utils";

interface UserData {
  id: string;
  nome: string;
  email: string | null;
  cpf: string;
  consentimento_lgpd: boolean;
  consentimento_logs: boolean;
  data_consentimento: string | null;
  versao_politica_privacidade: string | null;
  created_at: string | null;
}

const MeusDados = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [editedNome, setEditedNome] = useState("");
  const [consentimentoLogs, setConsentimentoLogs] = useState(false);
  const [logsCount, setLogsCount] = useState(0);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Check admin status
      const { data: adminData } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin'
      });
      setIsAdmin(adminData === true);

      // Load user profile
      const { data: profileData, error } = await supabase
        .from("usuarios")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      setUserData(profileData);
      setEditedNome(profileData.nome);
      setConsentimentoLogs(profileData.consentimento_logs || false);

      // Count user's access logs
      const { count } = await supabase
        .from("log_acesso")
        .select("*", { count: 'exact', head: true })
        .eq("cpf_usuario", profileData.cpf);

      setLogsCount(count || 0);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar seus dados");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!userData) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from("usuarios")
        .update({
          nome: editedNome,
          consentimento_logs: consentimentoLogs,
        })
        .eq("id", userData.id);

      if (error) throw error;

      setUserData({ ...userData, nome: editedNome, consentimento_logs: consentimentoLogs });
      toast.success("Dados atualizados com sucesso!");
    } catch (error) {
      console.error("Erro ao atualizar:", error);
      toast.error("Erro ao atualizar seus dados");
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = async () => {
    if (!userData) return;

    try {
      // Collect all user data
      const exportData = {
        dados_pessoais: {
          nome: userData.nome,
          email: userData.email,
          cpf: userData.cpf,
          data_cadastro: userData.created_at,
        },
        consentimentos: {
          politica_privacidade: userData.consentimento_lgpd,
          registro_logs: userData.consentimento_logs,
          data_consentimento: userData.data_consentimento,
          versao_politica: userData.versao_politica_privacidade,
        },
        logs_acesso: {
          total_registros: logsCount,
          nota: "Para detalhes completos dos logs, entre em contato com o DPO.",
        },
        data_exportacao: new Date().toISOString(),
      };

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `meus-dados-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Dados exportados com sucesso!");
    } catch (error) {
      console.error("Erro ao exportar:", error);
      toast.error("Erro ao exportar seus dados");
    }
  };

  const handleDeleteLogs = async () => {
    if (!userData) return;

    try {
      // Anonimizar logs do usuário (em vez de deletar, por questões de auditoria)
      const { error } = await supabase
        .from("log_acesso")
        .update({ cpf_usuario: '***.***.***-**' })
        .eq("cpf_usuario", userData.cpf);

      if (error) throw error;

      setLogsCount(0);
      toast.success("Seus logs de acesso foram anonimizados!");
    } catch (error) {
      console.error("Erro ao anonimizar logs:", error);
      toast.error("Erro ao anonimizar seus logs");
    }
  };

  const handleRevokeConsent = async () => {
    if (!userData) return;

    try {
      const { error } = await supabase
        .from("usuarios")
        .update({
          consentimento_logs: false,
        })
        .eq("id", userData.id);

      if (error) throw error;

      setConsentimentoLogs(false);
      setUserData({ ...userData, consentimento_logs: false });
      toast.success("Consentimento para registro de logs revogado!");
    } catch (error) {
      console.error("Erro ao revogar consentimento:", error);
      toast.error("Erro ao revogar consentimento");
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
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Meus Dados e Privacidade</h1>
            <p className="text-muted-foreground">
              Gerencie seus dados pessoais e preferências de privacidade conforme a LGPD
            </p>
          </div>

          {/* Dados Pessoais */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Dados Pessoais
              </CardTitle>
              <CardDescription>
                Visualize e atualize suas informações cadastrais
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome Completo</Label>
                  <Input
                    id="nome"
                    value={editedNome}
                    onChange={(e) => setEditedNome(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input value={userData?.email || ""} disabled />
                  <p className="text-xs text-muted-foreground">
                    Para alterar o e-mail, entre em contato com o suporte
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>CPF</Label>
                  <Input value={maskCPF(userData?.cpf || "")} disabled />
                  <p className="text-xs text-muted-foreground">
                    CPF não pode ser alterado
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Data de Cadastro</Label>
                  <Input 
                    value={userData?.created_at ? new Date(userData.created_at).toLocaleDateString('pt-BR') : ""} 
                    disabled 
                  />
                </div>
              </div>
              <Button onClick={handleUpdateProfile} disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </CardContent>
          </Card>

          {/* Consentimentos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Consentimentos e Privacidade
              </CardTitle>
              <CardDescription>
                Gerencie seus consentimentos de tratamento de dados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <Label className="font-medium">Política de Privacidade</Label>
                  <p className="text-sm text-muted-foreground">
                    Aceite obrigatório para uso do sistema
                  </p>
                  {userData?.versao_politica_privacidade && (
                    <p className="text-xs text-muted-foreground">
                      Versão aceita: {userData.versao_politica_privacidade}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-primary font-medium">Aceito</span>
                  <Button variant="outline" size="sm" onClick={() => navigate('/politica-privacidade')}>
                    <FileText className="mr-2 h-4 w-4" />
                    Ver Política
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <Label className="font-medium">Registro de Logs de Acesso</Label>
                  <p className="text-sm text-muted-foreground">
                    Permite o registro de suas atividades para auditoria
                  </p>
                  {userData?.data_consentimento && (
                    <p className="text-xs text-muted-foreground">
                      Consentido em: {new Date(userData.data_consentimento).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <Switch
                    checked={consentimentoLogs}
                    onCheckedChange={(checked) => {
                      setConsentimentoLogs(checked);
                      if (!checked) {
                        handleRevokeConsent();
                      }
                    }}
                  />
                  <span className="text-sm">
                    {consentimentoLogs ? "Ativado" : "Desativado"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Direitos do Titular */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Seus Direitos (LGPD)
              </CardTitle>
              <CardDescription>
                Exerça seus direitos previstos na Lei Geral de Proteção de Dados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {/* Exportar Dados */}
                <div className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center gap-2">
                    <Download className="h-5 w-5 text-primary" />
                    <h4 className="font-medium">Portabilidade de Dados</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Baixe uma cópia de todos os seus dados pessoais em formato JSON
                  </p>
                  <Button variant="outline" onClick={handleExportData}>
                    <Download className="mr-2 h-4 w-4" />
                    Exportar Meus Dados
                  </Button>
                </div>

                {/* Anonimizar Logs */}
                <div className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center gap-2">
                    <Trash2 className="h-5 w-5 text-destructive" />
                    <h4 className="font-medium">Anonimização de Logs</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Você possui {logsCount} registro(s) de acesso
                  </p>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" disabled={logsCount === 0}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Anonimizar Logs
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Anonimizar logs de acesso?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação irá anonimizar seus {logsCount} registro(s) de acesso, 
                          substituindo seu CPF por dados mascarados. Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteLogs}>
                          Confirmar Anonimização
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-2">Outros Direitos</h4>
                <p className="text-sm text-muted-foreground">
                  Para exercer outros direitos como exclusão completa de conta, correção de dados 
                  ou oposição ao tratamento, entre em contato com nosso Encarregado de Proteção de Dados:
                </p>
                <p className="text-sm font-medium mt-2">
                  privacidade@sistemagestao.com.br
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default MeusDados;
