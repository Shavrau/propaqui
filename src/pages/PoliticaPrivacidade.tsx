import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Shield, Database, Clock, UserCheck, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";

const VERSAO_POLITICA = "1.0.0";
const DATA_ATUALIZACAO = "28 de novembro de 2024";

const PoliticaPrivacidade = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>

        <Card className="shadow-lg">
          <CardHeader className="text-center border-b">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Shield className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">
              Política de Privacidade e Proteção de Dados
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Versão {VERSAO_POLITICA} - Última atualização: {DATA_ATUALIZACAO}
            </p>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none p-6 space-y-6">
            {/* Introdução */}
            <section>
              <h2 className="text-lg font-semibold flex items-center gap-2 text-foreground">
                <Shield className="h-5 w-5 text-primary" />
                1. Introdução
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Esta Política de Privacidade descreve como o Sistema de Gestão de Lotes 
                coleta, usa, armazena e protege seus dados pessoais, em conformidade com 
                a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Ao utilizar nosso sistema, você concorda com as práticas descritas nesta política.
              </p>
            </section>

            {/* Dados Coletados */}
            <section>
              <h2 className="text-lg font-semibold flex items-center gap-2 text-foreground">
                <Database className="h-5 w-5 text-primary" />
                2. Dados Coletados
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Coletamos os seguintes dados pessoais:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                <li><strong>Dados de identificação:</strong> Nome completo, CPF e e-mail</li>
                <li><strong>Dados de acesso:</strong> Registros de login e navegação no sistema</li>
                <li><strong>Dados de atividade:</strong> Logs de acesso a lotes consultados</li>
              </ul>
            </section>

            {/* Finalidade do Tratamento */}
            <section>
              <h2 className="text-lg font-semibold flex items-center gap-2 text-foreground">
                <UserCheck className="h-5 w-5 text-primary" />
                3. Finalidade do Tratamento
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Utilizamos seus dados para as seguintes finalidades:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                <li><strong>Autenticação:</strong> Verificar sua identidade e permitir acesso ao sistema</li>
                <li><strong>Auditoria:</strong> Manter registros de atividades para fins de segurança e conformidade</li>
                <li><strong>Comunicação:</strong> Enviar notificações importantes sobre sua conta</li>
                <li><strong>Melhoria do serviço:</strong> Analisar padrões de uso para aprimorar o sistema</li>
              </ul>
            </section>

            {/* Base Legal */}
            <section>
              <h2 className="text-lg font-semibold text-foreground">
                4. Base Legal para o Tratamento (Art. 7º, LGPD)
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                O tratamento dos seus dados pessoais é realizado com base nas seguintes hipóteses legais:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                <li><strong>Consentimento (Art. 7º, I):</strong> Para registro de logs de acesso</li>
                <li><strong>Execução de contrato (Art. 7º, V):</strong> Para prestação do serviço de gestão de lotes</li>
                <li><strong>Cumprimento de obrigação legal (Art. 7º, II):</strong> Para manutenção de registros exigidos por lei</li>
                <li><strong>Legítimo interesse (Art. 7º, IX):</strong> Para segurança e prevenção de fraudes</li>
              </ul>
            </section>

            {/* Retenção de Dados */}
            <section>
              <h2 className="text-lg font-semibold flex items-center gap-2 text-foreground">
                <Clock className="h-5 w-5 text-primary" />
                5. Retenção de Dados
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Seus dados são retidos pelos seguintes períodos:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                <li><strong>Dados cadastrais:</strong> Enquanto você mantiver conta ativa no sistema</li>
                <li><strong>Logs de acesso:</strong> Anonimizados após 1 ano, excluídos após 2 anos</li>
                <li><strong>Dados de auditoria:</strong> Conforme exigência legal aplicável</li>
              </ul>
            </section>

            {/* Compartilhamento */}
            <section>
              <h2 className="text-lg font-semibold text-foreground">
                6. Compartilhamento de Dados
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Seus dados pessoais <strong>não são compartilhados</strong> com terceiros para fins comerciais. 
                O compartilhamento pode ocorrer apenas:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                <li>Por determinação legal ou judicial</li>
                <li>Para cumprimento de obrigações regulatórias</li>
                <li>Com prestadores de serviços essenciais (hospedagem, infraestrutura), sob contratos de confidencialidade</li>
              </ul>
            </section>

            {/* Direitos do Titular */}
            <section>
              <h2 className="text-lg font-semibold text-foreground">
                7. Seus Direitos (Arts. 17-22, LGPD)
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Você tem os seguintes direitos em relação aos seus dados pessoais:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                <li><strong>Confirmação e acesso:</strong> Saber se tratamos seus dados e obter cópia</li>
                <li><strong>Correção:</strong> Solicitar correção de dados incompletos ou desatualizados</li>
                <li><strong>Anonimização ou eliminação:</strong> Solicitar exclusão de dados desnecessários</li>
                <li><strong>Portabilidade:</strong> Receber seus dados em formato estruturado</li>
                <li><strong>Revogação do consentimento:</strong> Retirar seu consentimento a qualquer momento</li>
                <li><strong>Oposição:</strong> Opor-se ao tratamento em determinadas circunstâncias</li>
              </ul>
            </section>

            {/* Segurança */}
            <section>
              <h2 className="text-lg font-semibold text-foreground">
                8. Segurança dos Dados
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Implementamos medidas técnicas e organizacionais para proteger seus dados:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                <li>Criptografia de dados em trânsito (HTTPS/TLS)</li>
                <li>Controle de acesso baseado em funções (RBAC)</li>
                <li>Políticas de segurança em nível de linha (RLS)</li>
                <li>Monitoramento de atividades suspeitas</li>
                <li>Backups regulares e plano de recuperação de desastres</li>
              </ul>
            </section>

            {/* Cookies e Armazenamento */}
            <section>
              <h2 className="text-lg font-semibold text-foreground">
                9. Cookies e Armazenamento Local
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Utilizamos armazenamento local do navegador para:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                <li><strong>Sessão de autenticação:</strong> Manter você conectado entre visitas</li>
                <li><strong>Preferências:</strong> Salvar configurações de interface</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-2">
                Os tokens de sessão são automaticamente renovados e expiram por segurança.
              </p>
            </section>

            {/* Contato */}
            <section>
              <h2 className="text-lg font-semibold flex items-center gap-2 text-foreground">
                <Mail className="h-5 w-5 text-primary" />
                10. Contato e Encarregado de Dados
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Para exercer seus direitos ou esclarecer dúvidas sobre esta política, 
                entre em contato com nosso Encarregado de Proteção de Dados (DPO):
              </p>
              <div className="bg-muted/50 p-4 rounded-lg mt-2">
                <p className="text-sm text-muted-foreground">
                  <strong>E-mail:</strong> privacidade@sistemagestao.com.br<br />
                  <strong>Prazo de resposta:</strong> Até 15 dias úteis
                </p>
              </div>
            </section>

            {/* Alterações */}
            <section>
              <h2 className="text-lg font-semibold text-foreground">
                11. Alterações nesta Política
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Esta política pode ser atualizada periodicamente. Notificaremos você sobre 
                alterações significativas por e-mail ou aviso no sistema. A versão mais 
                recente estará sempre disponível nesta página.
              </p>
            </section>

            {/* Legislação Aplicável */}
            <section className="border-t pt-4">
              <p className="text-xs text-muted-foreground text-center">
                Esta política está em conformidade com a Lei Geral de Proteção de Dados 
                (Lei nº 13.709/2018) e demais legislações aplicáveis à proteção de dados 
                pessoais no Brasil.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export const VERSAO_POLITICA_ATUAL = VERSAO_POLITICA;

export default PoliticaPrivacidade;
