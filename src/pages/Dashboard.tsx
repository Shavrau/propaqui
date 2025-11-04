import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Sidebar from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, FileText, Users, TrendingUp } from "lucide-react";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalLotes: 0,
    totalHistoricos: 0,
    totalLogs: 0,
  });
  const [isAdmin, setIsAdmin] = useState(false);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    loadUserProfile();
    loadStats();
  }, []);

  const loadUserProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("usuarios")
        .select("nome, perfil")
        .eq("id", user.id)
        .single();
      
      if (data) {
        setUserName(data.nome);
        setIsAdmin(data.perfil === "admin");
      }
    }
  };

  const loadStats = async () => {
    const [lotesRes, historicosRes, logsRes] = await Promise.all([
      supabase.from("lotes").select("id", { count: "exact", head: true }),
      supabase.from("historico_construcao").select("id", { count: "exact", head: true }),
      supabase.from("log_acesso").select("id", { count: "exact", head: true }),
    ]);

    setStats({
      totalLotes: lotesRes.count || 0,
      totalHistoricos: historicosRes.count || 0,
      totalLogs: logsRes.count || 0,
    });
  };

  const statCards = [
    { title: "Total de Lotes", value: stats.totalLotes, icon: Building2, color: "text-primary" },
    { title: "Históricos", value: stats.totalHistoricos, icon: FileText, color: "text-accent" },
    ...(isAdmin ? [{ title: "Acessos Registrados", value: stats.totalLogs, icon: TrendingUp, color: "text-blue-500" }] : []),
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar isAdmin={isAdmin} />
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Bem-vindo, {userName}!</h1>
            <p className="text-muted-foreground">
              {isAdmin ? "Painel administrativo" : "Painel de visualização"} - Sistema de Gestão de Lotes
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {statCards.map((stat) => (
              <Card key={stat.title} className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Informações do Sistema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Sobre o Sistema</h3>
                <p className="text-sm text-muted-foreground">
                  Sistema completo de gestão de lotes com funcionalidades de cadastro, busca,
                  histórico de construções e controle de acessos.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Seu Perfil</h3>
                <p className="text-sm text-muted-foreground">
                  {isAdmin 
                    ? "Como administrador, você tem acesso completo ao sistema, incluindo cadastro e edição de lotes."
                    : "Como usuário, você pode visualizar e buscar lotes cadastrados no sistema."}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
