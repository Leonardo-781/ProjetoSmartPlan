# ProjetoSmartPlan

Sistema de gerenciamento de estudos para alunos da UFU, desenvolvido com React, Express e PostgreSQL.

## Funcionalidades

- **Dashboard**: Visão geral das atividades
- **Calendário**: Visualização de eventos e compromissos
- **Disciplinas**: Gerenciamento de matérias
- **Tarefas**: Controle de atividades pendentes
- **Metas**: Definição de objetivos de estudo
- **Lembretes**: Sistema de notificações para provas, trabalhos e reuniões

## Módulo de Lembretes

O módulo de lembretes permite criar, gerenciar e exportar lembretes para:
- **Provas e Trabalhos**: Receba lembretes antes das datas de entrega
- **Reuniões de Trabalho**: Organize e seja notificado sobre reuniões importantes

### Recursos

1. **CRUD Completo**
   - Criar, visualizar, editar e excluir lembretes
   - Filtros por tipo e período
   - Notificações personalizáveis (minutos antes do evento)

2. **Recorrência**
   - Lembretes únicos ou recorrentes (diário, semanal, mensal)

3. **Exportação .ics**
   - Exporte lembretes para importar em calendários externos (Google Calendar, Outlook, etc.)
   - Compatível com padrão iCalendar

4. **Visualização em Calendário**
   - Calendário mensal integrado
   - Visualização rápida de todos os lembretes do mês

### API Endpoints

Todos os endpoints requerem autenticação via sessão.

#### Listar Lembretes
```http
GET /api/reminders
Query params: type, start, end

Exemplo:
GET /api/reminders?type=exam_assignment&start=2025-01-01&end=2025-01-31
```

#### Criar Lembrete
```http
POST /api/reminders
Content-Type: application/json

{
  "type": "exam_assignment",
  "title": "Prova de Cálculo",
  "description": "Prova final do semestre",
  "dueAt": "2025-12-20T14:00:00Z",
  "remindBeforeMinutes": 60,
  "repeat": "none"
}
```

#### Obter Lembrete
```http
GET /api/reminders/:id
```

#### Atualizar Lembrete
```http
PUT /api/reminders/:id
Content-Type: application/json

{
  "title": "Prova de Cálculo II",
  "remindBeforeMinutes": 120
}
```

#### Excluir Lembrete
```http
DELETE /api/reminders/:id
```

#### Exportar .ics
```http
GET /api/reminders/:id/export.ics
```

#### Dispatcher de Notificações
```http
POST /api/reminders/dispatch
```
Executa o dispatcher que identifica lembretes que devem ser notificados e registra no log.

### Database Migration

Execute a migração para criar as tabelas necessárias:

```bash
# Se usar Drizzle Kit
npm run db:push

# Ou execute manualmente o SQL
psql $DATABASE_URL < migrations/0001_add_reminders.sql
```

### Estrutura de Dados

#### Tabela: `reminders`
- `id`: UUID (chave primária)
- `user_id`: VARCHAR (referência a users.id)
- `type`: VARCHAR(50) - 'exam_assignment' ou 'work_meeting'
- `title`: VARCHAR(255)
- `description`: TEXT (opcional)
- `due_at`: TIMESTAMP WITH TIME ZONE
- `remind_before_minutes`: INTEGER (>= 0)
- `repeat`: VARCHAR(20) - 'none', 'daily', 'weekly', 'monthly'
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP

#### Tabela: `reminder_notifications`
- `id`: INTEGER (chave primária)
- `reminder_id`: VARCHAR (referência a reminders.id)
- `notified_at`: TIMESTAMP

## Desenvolvimento

### Instalação

```bash
npm install
```

### Executar em Desenvolvimento

```bash
npm run dev
```

### Build

```bash
npm run build
npm start
```

### Verificar Tipagem

```bash
npm run check
```

## Tecnologias

- **Frontend**: React 18, TypeScript, Vite, TanStack Query, Wouter, Radix UI, Tailwind CSS
- **Backend**: Express, TypeScript, Drizzle ORM
- **Database**: PostgreSQL com Neon Serverless
- **Autenticação**: Session-based authentication

## Licença

MIT
