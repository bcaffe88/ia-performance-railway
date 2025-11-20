import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "../const";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { BarChart3, LogOut, MessageSquare, Search, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function Dashboard() {
  const { user, isAuthenticated, logout } = useAuth();
  const [period, setPeriod] = useState("30d");
  const [search, setSearch] = useState("");
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);

  const dateRange = useMemo(() => {
    const end = new Date();
    const start = new Date();
    if (period === "7d") start.setDate(end.getDate() - 7);
    else if (period === "30d") start.setDate(end.getDate() - 30);
    else start.setMonth(end.getMonth() - 1);
    return { startDate: start.toISOString(), endDate: end.toISOString() };
  }, [period]);

  const { data: conversations = [] } = trpc.conversations.list.useQuery({
    ...dateRange,
    search: search || undefined,
  });

  const { data: metrics } = trpc.metrics.summary.useQuery(dateRange);

  const { data: chartData = [] } = trpc.metrics.perDay.useQuery(dateRange);

  const { data: messages = [] } = trpc.messages.byConversation.useQuery(
    { conversationId: selectedConversation! },
    { enabled: !!selectedConversation }
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <img src={APP_LOGO} alt="Logo" className="h-16 mx-auto mb-4" />
            <CardTitle className="text-2xl">{APP_TITLE}</CardTitle>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => (window.location.href = getLoginUrl())}>
              Login com GitHub
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white">
      <header className="border-b border-gray-800 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <img src={APP_LOGO} alt="Logo" className="h-10" />
            <h1 className="text-2xl font-bold">{APP_TITLE}</h1>
          </div>
          <nav className="flex gap-2">
            <Link href="/">
              <Button variant="ghost" size="sm">Dashboard</Button>
            </Link>
            <Link href="/organizations">
              <Button variant="ghost" size="sm">Organizações</Button>
            </Link>
            <Link href="/appointments">
              <Button variant="ghost" size="sm">Agendamentos</Button>
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-300">{user?.name}</span>
            <Button variant="outline" size="sm" onClick={() => logout()}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto py-8 space-y-6">
        <Tabs defaultValue="messages">
          <TabsList className="bg-black/30">
            <TabsTrigger value="messages">Mensagens</TabsTrigger>
            <TabsTrigger value="metrics">Métricas</TabsTrigger>
          </TabsList>

          <TabsContent value="messages" className="space-y-6">
            <div className="flex gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar mensagens..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 bg-black/30 border-gray-700"
                />
              </div>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-40 bg-black/30 border-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">7 dias</SelectItem>
                  <SelectItem value="30d">30 dias</SelectItem>
                  <SelectItem value="month">Este mês</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-black/30 border-gray-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-400">Total</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{metrics?.total || 0}</div>
                </CardContent>
              </Card>
              <Card className="bg-black/30 border-gray-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-400">Cliente</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-400">{metrics?.client || 0}</div>
                </CardContent>
              </Card>
              <Card className="bg-black/30 border-gray-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-400">IA</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-400">{metrics?.ai || 0}</div>
                </CardContent>
              </Card>
              <Card className="bg-black/30 border-gray-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-400">Humano</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-400">{metrics?.human || 0}</div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-black/30 border-gray-700">
              <CardHeader>
                <CardTitle>Conversas</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700">
                      <TableHead>Cliente</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Canal</TableHead>
                      <TableHead>Mensagens</TableHead>
                      <TableHead>Última Mensagem</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {conversations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-gray-400 py-8">
                          Nenhuma conversa encontrada
                        </TableCell>
                      </TableRow>
                    ) : (
                      conversations.map((conv) => (
                        <TableRow
                          key={conv.id}
                          className="border-gray-700 cursor-pointer hover:bg-white/5"
                          onClick={() => setSelectedConversation(conv.id)}
                        >
                          <TableCell>{conv.clientName || "Sem nome"}</TableCell>
                          <TableCell>{conv.clientPhone}</TableCell>
                          <TableCell>{conv.channel}</TableCell>
                          <TableCell>{conv.messageCount}</TableCell>
                          <TableCell>{new Date(conv.lastMessageAt).toLocaleString("pt-BR")}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {selectedConversation && (
              <Card className="bg-black/30 border-gray-700">
                <CardHeader>
                  <CardTitle>Mensagens da Conversa</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-3 rounded-lg ${
                        msg.sender === "client"
                          ? "bg-blue-900/30"
                          : msg.sender === "ai"
                          ? "bg-green-900/30"
                          : "bg-purple-900/30"
                      }`}
                    >
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span className="font-semibold">{msg.sender.toUpperCase()}</span>
                        <span>{new Date(msg.timestamp).toLocaleString("pt-BR")}</span>
                      </div>
                      <p className="text-sm">{msg.content}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="metrics" className="space-y-6">
            <div className="flex gap-4 items-center">
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-40 bg-black/30 border-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">7 dias</SelectItem>
                  <SelectItem value="30d">30 dias</SelectItem>
                  <SelectItem value="month">Este mês</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-black/30 border-gray-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Mensagens
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{metrics?.total || 0}</div>
                </CardContent>
              </Card>
              <Card className="bg-black/30 border-gray-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Usuários
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{conversations.length}</div>
                </CardContent>
              </Card>
              <Card className="bg-black/30 border-gray-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-400">Média msg/usuário</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {conversations.length > 0 ? ((metrics?.total || 0) / conversations.length).toFixed(1) : "0.0"}
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-black/30 border-gray-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Taxa IA
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-400">
                    {metrics?.total ? ((metrics.ai / metrics.total) * 100).toFixed(0) : 0}%
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-black/30 border-gray-700">
              <CardHeader>
                <CardTitle>Mensagens por Dia</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }}
                    />
                    <Area type="monotone" dataKey="count" stroke="#3b82f6" fillOpacity={1} fill="url(#colorCount)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
