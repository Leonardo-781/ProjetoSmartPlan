# ProjetoSmartPlan - Sistema de Agenda UFU

Sistema de gerenciamento de agenda acadêmica com suporte a lembretes, tarefas, disciplinas, eventos e metas de estudo.

## 🚀 Tecnologias

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Radix UI
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL com Drizzle ORM
- **Autenticação**: Session-based com restrição para emails @ufu.br

## 📋 Funcionalidades

### ✅ Implementadas

- **Autenticação de Usuários**
  - Registro e login com emails @ufu.br
  - Validação de senha forte
  - Sessões seguras

- **Disciplinas**
  - CRUD completo de disciplinas
  - Associação de cores
  - Informações de professor e semestre

- **Eventos**
  - Criação de eventos (aulas, provas, apresentações)
  - Eventos recorrentes (diário, semanal, mensal)
  - Associação com disciplinas

- **Tarefas**
  - Gerenciamento de tarefas com prioridades
  - Status (todo, in_progress, completed)
  - Data de vencimento
  - Associação com disciplinas

- **Metas de Estudo**
  - Definição de metas de horas de estudo
  - Acompanhamento por período (semanal/mensal)

- **Lembretes** 📢 NOVO
  - Lembretes para provas/trabalhos e reuniões
  - Configuração de tempo de antecedência
  - Repetição (diária, semanal, mensal)
  - Exportação para formato .ics
  - Sistema de notificações programadas

## 🛠️ Setup do Projeto

### Pré-requisitos

- Node.js 18+ 
- PostgreSQL
- npm ou yarn

### Instalação

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
```bash
# Crie um arquivo .env na raiz do projeto
DATABASE_URL=postgresql://user:password@localhost:5432/smartplan
```

4. Execute as migrações do banco de dados:
```bash
# As migrações estão em /migrations
# Execute cada arquivo SQL na ordem:
psql -U user -d smartplan -f migrations/0001_add_reminders.sql
```

### Desenvolvimento

Execute o servidor de desenvolvimento:
```bash
npm run dev
```

O servidor estará disponível em `http://localhost:5000`

### Build para Produção

```bash
npm run build
npm start
```

## 📚 API de Lembretes

### Endpoints Disponíveis

#### `GET /api/reminders`
Lista todos os lembretes do usuário autenticado.

**Query Parameters:**
- `type` (opcional): Filtrar por tipo (`exam_assignment` ou `work_meeting`)
- `startDate` (opcional): Data inicial para filtro (ISO 8601)
- `endDate` (opcional): Data final para filtro (ISO 8601)

**Resposta:**
```json
[
  {
    "id": "uuid",
    "userId": "user-id",
    "type": "exam_assignment",
    "title": "Prova de Cálculo",
    "description": "Capítulos 1-5",
    "dueAt": "2024-12-15T10:00:00Z",
    "remindBeforeMinutes": 60,
    "repeat": "none",
    "createdAt": "2024-12-01T10:00:00Z",
    "updatedAt": "2024-12-01T10:00:00Z"
  }
]
```

#### `POST /api/reminders`
Cria um novo lembrete.

**Body:**
```json
{
  "type": "exam_assignment",
  "title": "Prova de Cálculo",
  "description": "Capítulos 1-5",
  "dueAt": "2024-12-15T10:00:00Z",
  "remindBeforeMinutes": 60,
  "repeat": "none"
}
```

**Validações:**
- `title` e `dueAt` são obrigatórios
- `remindBeforeMinutes` deve ser >= 0
- `type` deve ser `exam_assignment` ou `work_meeting`
- `repeat` deve ser `none`, `daily`, `weekly`, ou `monthly`

#### `GET /api/reminders/:id`
Retorna os detalhes de um lembrete específico.

#### `PUT /api/reminders/:id`
Atualiza um lembrete existente.

#### `DELETE /api/reminders/:id`
Remove um lembrete.

#### `GET /api/reminders/:id/export.ics`
Exporta um lembrete no formato iCalendar (.ics).

**Resposta:**
Arquivo .ics para download, compatível com Google Calendar, Apple Calendar, Outlook, etc.

#### `POST /api/reminders/dispatch`
Processa lembretes que estão na janela de notificação.

**Resposta:**
```json
{
  "count": 3,
  "notifications": [
    {
      "reminder": { ... },
      "notification": {
        "id": 1,
        "reminderId": "uuid",
        "notifiedAt": "2024-12-15T09:00:00Z",
        "status": "sent"
      }
    }
  ]
}
```

## 📅 Usando Lembretes

### Criando um Lembrete

1. Acesse a página "Lembretes" no menu lateral
2. Clique em "Novo Lembrete"
3. Preencha:
   - **Título**: Nome do lembrete
   - **Descrição**: Detalhes adicionais (opcional)
   - **Tipo**: Prova/Trabalho ou Reunião de Trabalho
   - **Data e Hora**: Quando o evento acontece
   - **Lembrar antes**: Quantos minutos antes deseja ser notificado
   - **Repetição**: Se o lembrete deve se repetir

### Exportando para Calendário Externo

1. Na lista de lembretes, clique no ícone de download (⬇️)
2. O arquivo .ics será baixado
3. Importe no seu calendário:
   - **Google Calendar**: Settings → Import & Export → Import
   - **Apple Calendar**: File → Import
   - **Outlook**: File → Open & Export → Import/Export

### Processando Notificações

O dispatcher processa lembretes que estão dentro da janela de notificação:

```bash
# Via API (requer autenticação)
curl -X POST http://localhost:5000/api/reminders/dispatch \
  -H "Cookie: your-session-cookie"
```

**Janela de Notificação:**
- Um lembrete é notificado quando: `due_at - remind_before_minutes <= now < due_at + 1 minuto`
- Cada notificação é registrada na tabela `reminder_notifications`

### Automatizando o Dispatcher

Para produção, configure um cron job ou scheduler:

**Exemplo com cron (Linux/Mac):**
```bash
# Executar a cada 5 minutos
*/5 * * * * curl -X POST http://localhost:5000/api/reminders/dispatch -H "Cookie: session=..."
```

**Exemplo com Windows Task Scheduler:**
1. Crie um script PowerShell ou batch
2. Configure para executar a cada 5 minutos

## 🗃️ Estrutura do Banco de Dados

### Tabela `reminders`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | varchar (UUID) | Identificador único |
| user_id | varchar | FK para users.id |
| type | varchar(50) | Tipo do lembrete |
| title | varchar(255) | Título |
| description | text | Descrição (opcional) |
| due_at | timestamp | Data/hora do evento |
| remind_before_minutes | integer | Minutos antes para notificar |
| repeat | varchar(20) | Padrão de repetição |
| created_at | timestamp | Data de criação |
| updated_at | timestamp | Data de atualização |

### Tabela `reminder_notifications`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | integer | Identificador único |
| reminder_id | varchar | FK para reminders.id |
| notified_at | timestamp | Quando foi notificado |
| status | varchar(20) | Status da notificação |

## 🧪 Desenvolvimento

### Verificar Tipos TypeScript

```bash
npm run check
```

### Build do Projeto

```bash
npm run build
```

### Estrutura de Arquivos

```
ProjetoSmartPlan/
├── client/                 # Frontend React
│   └── src/
│       ├── components/     # Componentes reutilizáveis
│       │   ├── reminder-dialog.tsx
│       │   └── ...
│       ├── pages/          # Páginas da aplicação
│       │   ├── reminders.tsx
│       │   └── ...
│       └── App.tsx
├── server/                 # Backend Express
│   ├── db.ts              # Configuração Drizzle
│   ├── routes.ts          # Rotas da API
│   ├── storage.ts         # Interface de dados
│   ├── ics-generator.ts   # Gerador de .ics
│   └── index.ts
├── shared/                 # Código compartilhado
│   └── schema.ts          # Schema Drizzle + tipos
├── migrations/            # Migrações SQL
│   └── 0001_add_reminders.sql
└── package.json
```

## 🔒 Segurança

- Senhas são hasheadas com bcrypt
- Sessões com cookies HTTP-only
- Validação de email @ufu.br apenas
- Proteção CSRF em rotas autenticadas
- Validação de entrada em todos os endpoints

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

MIT License - veja LICENSE para detalhes

## 👥 Autores

- Leonardo-781

## 🐛 Reportar Bugs

Encontrou um bug? [Abra uma issue](https://github.com/Leonardo-781/ProjetoSmartPlan/issues)
