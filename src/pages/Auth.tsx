import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Building2, Eye, EyeOff } from "lucide-react";
import { getSafeErrorMessage, logError } from "@/lib/errorHandler";
import { VERSAO_POLITICA_ATUAL } from "./PoliticaPrivacidade";

const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [signupData, setSignupData] = useState({ cpf: "", nome: "", email: "", password: "", confirmPassword: "" });
  const [resetEmail, setResetEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const [aceitouPolitica, setAceitouPolitica] = useState(false);
  const [aceitouLogs, setAceitouLogs] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });
  }, [navigate]);

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    return numbers
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2")
      .replace(/(-\d{2})\d+?$/, "$1");
  };

  const removeCPFMask = (cpf: string) => {
    return cpf.replace(/\D/g, "");
  };

  const validateCPF = (cpf: string): boolean => {
    const cleanedCpf = cpf.replace(/\D/g, "");
    
    if (cleanedCpf.length !== 11) return false;
    
    // Reject known invalid sequences (all same digits)
    if (/^(\d)\1{10}$/.test(cleanedCpf)) return false;
    
    // Calculate first check digit
    let sum1 = 0;
    for (let i = 0; i < 9; i++) {
      sum1 += parseInt(cleanedCpf[i]) * (10 - i);
    }
    let dv1 = 11 - (sum1 % 11);
    if (dv1 >= 10) dv1 = 0;
    
    // Calculate second check digit
    let sum2 = 0;
    for (let i = 0; i < 10; i++) {
      sum2 += parseInt(cleanedCpf[i]) * (11 - i);
    }
    let dv2 = 11 - (sum2 % 11);
    if (dv2 >= 10) dv2 = 0;
    
    // Verify check digits match
    return parseInt(cleanedCpf[9]) === dv1 && parseInt(cleanedCpf[10]) === dv2;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      });

      if (error) throw error;

      toast.success("Login realizado com sucesso!");
      navigate("/dashboard");
    } catch (error: any) {
      logError(error, 'Login');
      toast.error(getSafeErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate consent - both are required
      if (!aceitouPolitica) {
        toast.error("Você precisa aceitar a Política de Privacidade para continuar.");
        setLoading(false);
        return;
      }

      if (!aceitouLogs) {
        toast.error("O consentimento para registro de logs é obrigatório para uso do sistema.");
        setLoading(false);
        return;
      }

      const cpfSemMascara = removeCPFMask(signupData.cpf);
      
      // Validate CPF before sending to server
      if (!validateCPF(cpfSemMascara)) {
        toast.error("CPF inválido. Por favor, verifique o número digitado.");
        setLoading(false);
        return;
      }

      // Validate password confirmation
      if (signupData.password !== signupData.confirmPassword) {
        toast.error("As senhas não coincidem.");
        setLoading(false);
        return;
      }
      
      const { error, data } = await supabase.auth.signUp({
        email: signupData.email,
        password: signupData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            cpf: cpfSemMascara,
            nome: signupData.nome,
            perfil: "usuario",
            consentimento_lgpd: aceitouPolitica,
            consentimento_logs: aceitouLogs,
            versao_politica: VERSAO_POLITICA_ATUAL,
          },
        },
      });

      if (error) throw error;

      // Update user consent in usuarios table after signup
      if (data.user) {
        await supabase
          .from('usuarios')
          .update({
            consentimento_lgpd: aceitouPolitica,
            consentimento_logs: aceitouLogs,
            data_consentimento: new Date().toISOString(),
            versao_politica_privacidade: VERSAO_POLITICA_ATUAL,
          })
          .eq('id', data.user.id);
      }

      toast.success("Cadastro realizado! Você já pode fazer login.");
      setSignupData({ cpf: "", nome: "", email: "", password: "", confirmPassword: "" });
      setAceitouPolitica(false);
      setAceitouLogs(false);
    } catch (error: any) {
      logError(error, 'Signup');
      toast.error(getSafeErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/`,
      });

      if (error) throw error;

      toast.success("Email de recuperação enviado! Verifique sua caixa de entrada.");
      setResetEmail("");
    } catch (error: any) {
      logError(error, 'PasswordReset');
      toast.error(getSafeErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Sistema de Gestão de Lotes</CardTitle>
          <CardDescription>Entre com suas credenciais ou crie uma nova conta</CardDescription>
        </CardHeader>
        <CardContent>
          {!showResetForm ? (
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Cadastro</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={loginData.email}
                    onChange={(e) =>
                      setLoginData({ ...loginData, email: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Senha</Label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Digite sua senha"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      required
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowResetForm(true)}
                    className="text-sm text-primary hover:underline"
                  >
                    Esqueceu sua senha?
                  </button>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Entrando..." : "Entrar"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-cpf">CPF</Label>
                  <Input
                    id="signup-cpf"
                    placeholder="000.000.000-00"
                    value={signupData.cpf}
                    onChange={(e) =>
                      setSignupData({ ...signupData, cpf: formatCPF(e.target.value) })
                    }
                    maxLength={14}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-nome">Nome Completo</Label>
                  <Input
                    id="signup-nome"
                    placeholder="Digite seu nome"
                    value={signupData.nome}
                    onChange={(e) => setSignupData({ ...signupData, nome: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={signupData.email}
                    onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Senha</Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showSignupPassword ? "text" : "password"}
                      placeholder="Mínimo 6 caracteres"
                      value={signupData.password}
                      onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                      minLength={6}
                      required
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignupPassword(!showSignupPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showSignupPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-confirm-password">Confirmar Senha</Label>
                  <div className="relative">
                    <Input
                      id="signup-confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Digite a senha novamente"
                      value={signupData.confirmPassword}
                      onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                      minLength={6}
                      required
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Consentimento LGPD */}
                <div className="space-y-3 pt-2 border-t">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="aceito-politica"
                      checked={aceitouPolitica}
                      onCheckedChange={(checked) => setAceitouPolitica(checked === true)}
                      className="mt-1"
                    />
                    <Label htmlFor="aceito-politica" className="text-sm leading-relaxed cursor-pointer">
                      Li e aceito a{" "}
                      <Link
                        to="/politica-privacidade"
                        className="text-primary hover:underline font-medium"
                        target="_blank"
                      >
                        Política de Privacidade
                      </Link>{" "}
                      e autorizo o tratamento dos meus dados pessoais conforme descrito.
                      <span className="text-destructive">*</span>
                    </Label>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="aceito-logs"
                      checked={aceitouLogs}
                      onCheckedChange={(checked) => setAceitouLogs(checked === true)}
                      className="mt-1"
                    />
                    <Label htmlFor="aceito-logs" className="text-sm leading-relaxed cursor-pointer">
                      Autorizo o registro de logs de acesso aos lotes para fins de auditoria e segurança.
                      <span className="text-destructive">*</span>
                      <span className="text-muted-foreground text-xs block mt-1">
                        (Obrigatório para uso do sistema)
                      </span>
                    </Label>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading || !aceitouPolitica || !aceitouLogs}>
                  {loading ? "Criando conta..." : "Criar Conta"}
                </Button>
              </form>
            </TabsContent>
            </Tabs>
          ) : (
            <div className="space-y-6 pt-6">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Recuperar Senha</h3>
                <p className="text-sm text-muted-foreground">
                  Digite seu email para receber o link de recuperação
                </p>
              </div>
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Enviando..." : "Enviar Email de Recuperação"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowResetForm(false)}
                  className="w-full"
                >
                  Voltar para login
                </Button>
              </form>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
