# ProjetoSmartPlan - Agenda UFU

Sistema completo de gerenciamento acadêmico para estudantes da UFU, incluindo gerenciamento de disciplinas, eventos, tarefas, metas de estudo e **lembretes inteligentes**.

## 🚀 Funcionalidades

- **Dashboard**: Visão geral das suas atividades acadêmicas
- **Calendário**: Visualize todos os seus eventos em um calendário interativo
- **Disciplinas**: Gerencie suas matérias, professores e horários
- **Tarefas**: Organize suas atividades com prioridades e status
- **Metas**: Defina e acompanhe metas de estudo
- **Lembretes**: 🆕 Sistema de lembretes de provas, trabalhos e reuniões com notificações e exportação para calendários externos

## 📋 Pré-requisitos

- Node.js 20.x ou superior
- PostgreSQL (ou Neon Database)
- npm ou yarn

## 🔧 Instalação

1. Clone o repositório:
```bash
git clone https://github.com/Leonardo-781/ProjetoSmartPlan.git
cd ProjetoSmartPlan
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
Crie um arquivo `.env` na raiz do projeto:
```env
DATABASE_URL=postgresql://user:password@host:port/database
SESSION_SECRET=your-secret-key-here
PORT=5000
```

4. Execute as migrações do banco de dados (se necessário):
```bash
npm run db:push
```

## 🚀 Executando o Projeto

### Desenvolvimento
```bash
npm run dev
```

### Produção
```bash
npm run build
npm start
```

O servidor estará disponível em `http://localhost:5000`

## 📱 Sistema de Lembretes

### Visão Geral

O sistema de lembretes permite que você crie notificações para:
- **Provas e Trabalhos**: Lembretes para avaliações e entregas de trabalhos acadêmicos
- **Reuniões de Trabalho**: Lembretes para reuniões de projetos ou grupos de estudo

### Funcionalidades dos Lembretes

#### 1. Criar Lembretes
- Defina título, descrição, tipo (prova/trabalho ou reunião)
- Configure data e hora do evento
- Configure quanto tempo antes você quer ser lembrado (em minutos)
- Configure repetição (nenhuma, diária, semanal, mensal)

#### 2. Gerenciar Lembretes
- Liste todos os seus lembretes
- Filtre por tipo (provas/trabalhos ou reuniões)
- Edite lembretes existentes
- Exclua lembretes que não são mais necessários

#### 3. Exportar para Calendários Externos
Cada lembrete pode ser exportado como arquivo `.ics` (iCalendar), permitindo:
- Importação no Google Calendar
- Importação no Microsoft Outlook
- Importação no Apple Calendar
- Sincronização com qualquer aplicativo que suporte o formato iCalendar

**Como exportar:**
1. Na página de Lembretes, clique no botão de download (ícone de download) do lembrete desejado
2. Um arquivo `.ics` será baixado automaticamente
3. Abra o arquivo com seu aplicativo de calendário preferido ou importe manualmente

#### 4. Notificações
O sistema possui um endpoint para verificar lembretes pendentes e enviar notificações.

**Endpoint de Notificações:**
```bash
POST /api/reminders/dispatch
```

Este endpoint:
- Verifica lembretes que devem ser notificados
- Retorna uma lista de notificações pendentes
- Marca os lembretes como notificados para evitar duplicatas

**Exemplo de resposta:**
```json
{
  "count": 2,
  "notifications": [
    {
      "id": 1,
      "title": "Prova de Cálculo",
      "type": "exam_assignment",
      "dueAt": "2025-12-15T14:00:00.000Z",
      "message": "Lembrete: Prova de Cálculo - Prova/Trabalho em 15/12/2025 às 14:00"
    }
  ]
}
```

### API de Lembretes

#### Endpoints Disponíveis

**1. Listar Lembretes**
```http
GET /api/reminders
```
Query Parameters:
- `type`: Filtrar por tipo (`exam_assignment` ou `work_meeting`)
- `startDate`: Data inicial para filtro (ISO 8601)
- `endDate`: Data final para filtro (ISO 8601)

**2. Criar Lembrete**
```http
POST /api/reminders
Content-Type: application/json

{
  "title": "Prova de Cálculo",
  "type": "exam_assignment",
  "description": "Estudar derivadas e integrais",
  "dueAt": "2025-12-15T14:00:00Z",
  "remindBeforeMinutes": 30,
  "repeat": "none"
}
```

Campos obrigatórios:
- `title`: Título do lembrete
- `type`: Tipo (`exam_assignment` ou `work_meeting`)
- `dueAt`: Data e hora do evento (ISO 8601)

Campos opcionais:
- `description`: Descrição detalhada
- `remindBeforeMinutes`: Minutos antes para lembrar (padrão: 15)
- `repeat`: Repetição (`none`, `daily`, `weekly`, `monthly` - padrão: `none`)

**3. Obter Detalhes de um Lembrete**
```http
GET /api/reminders/:id
```

**4. Atualizar Lembrete**
```http
PUT /api/reminders/:id
Content-Type: application/json

{
  "title": "Prova de Cálculo I - Atualizada",
  "remindBeforeMinutes": 60
}
```

**5. Excluir Lembrete**
```http
DELETE /api/reminders/:id
```

**6. Exportar Lembrete como .ics**
```http
GET /api/reminders/:id/export.ics
```
Retorna um arquivo `.ics` pronto para importação em calendários.

**7. Verificar e Disparar Notificações**
```http
POST /api/reminders/dispatch
```
Retorna lembretes que devem ser notificados no momento atual.

### Exemplos de Uso com cURL

**Criar um lembrete de prova:**
```bash
curl -X POST http://localhost:5000/api/reminders \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "title": "Prova de Física",
    "type": "exam_assignment",
    "description": "Capítulos 1-5",
    "dueAt": "2025-12-20T09:00:00Z",
    "remindBeforeMinutes": 60
  }'
```

**Criar um lembrete de reunião:**
```bash
curl -X POST http://localhost:5000/api/reminders \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "title": "Reunião do Grupo",
    "type": "work_meeting",
    "description": "Discussão do projeto final",
    "dueAt": "2025-12-13T15:00:00Z",
    "remindBeforeMinutes": 15,
    "repeat": "weekly"
  }'
```

**Exportar lembrete:**
```bash
curl -X GET http://localhost:5000/api/reminders/1/export.ics \
  -b cookies.txt \
  -o reminder.ics
```

**Verificar notificações pendentes:**
```bash
curl -X POST http://localhost:5000/api/reminders/dispatch \
  -b cookies.txt
```

### Configurando um Job de Notificações

Para notificações automáticas, configure um cron job ou agendador de tarefas para chamar o endpoint de dispatch periodicamente:

**Exemplo com cron (Linux/Mac):**
```bash
# Edite o crontab
crontab -e

# Adicione a linha (executa a cada 15 minutos)
*/15 * * * * curl -X POST http://localhost:5000/api/reminders/dispatch -H "Cookie: connect.sid=YOUR_SESSION_ID"
```

**Exemplo com Task Scheduler (Windows):**
Crie uma tarefa agendada que execute um script PowerShell:
```powershell
$response = Invoke-RestMethod -Uri "http://localhost:5000/api/reminders/dispatch" `
  -Method POST `
  -Headers @{"Cookie"="connect.sid=YOUR_SESSION_ID"}
Write-Host $response
```

## 🏗️ Estrutura do Projeto

```
ProjetoSmartPlan/
├── client/               # Frontend React
│   └── src/
│       ├── components/   # Componentes reutilizáveis
│       │   └── reminder-dialog.tsx  # Formulário de lembretes
│       ├── pages/        # Páginas da aplicação
│       │   └── reminders.tsx        # Página de lembretes
│       └── lib/          # Utilitários
├── server/               # Backend Express
│   ├── db.ts            # Configuração do banco
│   ├── index.ts         # Servidor principal
│   ├── routes.ts        # Rotas da API (inclui rotas de lembretes)
│   └── storage.ts       # Camada de dados (inclui métodos de lembretes)
└── shared/              # Código compartilhado
    └── schema.ts        # Esquemas do banco (inclui schema de lembretes)
```

## 🔒 Autenticação

O sistema utiliza autenticação por sessão. Todos os endpoints da API (exceto signup e login) requerem autenticação.

**Registrar:**
```bash
POST /api/auth/signup
{
  "email": "seuemail@ufu.br",
  "password": "SenhaForte@123",
  "first_name": "Nome",
  "last_name": "Sobrenome"
}
```

**Login:**
```bash
POST /api/auth/login
{
  "email": "seuemail@ufu.br",
  "password": "SenhaForte@123"
}
```

## 📊 Banco de Dados

O projeto utiliza PostgreSQL com Drizzle ORM. O schema de lembretes inclui:

**Tabela `reminders`:**
- `id`: Identificador único (auto-incremento)
- `user_id`: Referência ao usuário (FK)
- `type`: Tipo do lembrete (`exam_assignment` ou `work_meeting`)
- `title`: Título do lembrete
- `description`: Descrição opcional
- `due_at`: Data e hora do evento
- `remind_before_minutes`: Minutos antes para notificar
- `repeat`: Padrão de repetição
- `last_notified_at`: Última vez que foi notificado
- `created_at`: Data de criação
- `updated_at`: Data de última atualização

## 🛠️ Tecnologias Utilizadas

### Backend
- Node.js
- Express.js
- TypeScript
- Drizzle ORM
- PostgreSQL / Neon Database
- Express Session

### Frontend
- React
- TypeScript
- Tailwind CSS
- Radix UI
- React Query
- Wouter (routing)
- date-fns

## 📝 Licença

MIT

## 👥 Contribuindo

Contribuições são bem-vindas! Por favor, abra uma issue ou pull request para sugestões e melhorias.

## 📧 Contato

Para dúvidas ou sugestões, entre em contato através do GitHub.
