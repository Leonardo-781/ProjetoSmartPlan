# ProjetoSmartPlan - Agenda UFU

Sistema de gerenciamento acadêmico para estudantes da UFU, com funcionalidades de calendário, tarefas, metas de estudo e lembretes.

## 📋 Funcionalidades

- **Dashboard**: Visão geral das atividades e estatísticas
- **Calendário**: Visualização e gerenciamento de eventos acadêmicos
- **Disciplinas**: Cadastro e organização de disciplinas do semestre
- **Tarefas**: Gerenciamento de tarefas e trabalhos com prioridades
- **Metas**: Definição e acompanhamento de metas de estudo
- **Lembretes**: Sistema de lembretes para provas, trabalhos e reuniões

## 🚀 Tecnologias

### Backend
- **Node.js** + **Express.js**: Framework web
- **TypeScript**: Linguagem de programação
- **Drizzle ORM**: ORM para PostgreSQL
- **PostgreSQL**: Banco de dados relacional
- **Bcrypt**: Criptografia de senhas

### Frontend
- **React** + **TypeScript**: Biblioteca de UI
- **Wouter**: Roteamento
- **TanStack Query**: Gerenciamento de estado e cache
- **Radix UI**: Componentes de UI acessíveis
- **Tailwind CSS**: Framework CSS
- **Lucide React**: Ícones
- **date-fns**: Manipulação de datas

## 📦 Instalação

```bash
# Clone o repositório
git clone https://github.com/Leonardo-781/ProjetoSmartPlan.git
cd ProjetoSmartPlan

# Instale as dependências
npm install

# Configure as variáveis de ambiente
# Crie um arquivo .env na raiz do projeto:
# DATABASE_URL=postgresql://user:password@localhost:5432/smartplan
# SESSION_SECRET=your_secret_key_here

# Execute as migrações do banco de dados
npm run db:push

# Inicie o servidor de desenvolvimento
npm run dev
```

O servidor estará disponível em `http://localhost:5000` (ou a porta configurada).

## 🗄️ Banco de Dados

### Estrutura de Tabelas

#### Tabela `reminders`
Armazena os lembretes criados pelos usuários.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID (PK) | Identificador único do lembrete |
| `owner_email` | VARCHAR(255) | Email do proprietário do lembrete |
| `type` | VARCHAR(50) | Tipo: `exam_assignment` ou `work_meeting` |
| `title` | VARCHAR(255) | Título do lembrete |
| `description` | TEXT | Descrição opcional |
| `due_at` | TIMESTAMP (UTC) | Data e hora de vencimento |
| `remind_before_minutes` | INTEGER | Antecedência do lembrete (minutos) |
| `repeat` | VARCHAR(20) | Repetição: `none`, `daily`, `weekly`, `monthly` |
| `created_at` | TIMESTAMP | Data de criação |
| `updated_at` | TIMESTAMP | Data de última atualização |

#### Tabela `reminder_notifications`
Registra os lembretes que foram disparados.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID (PK) | Identificador único da notificação |
| `reminder_id` | UUID (FK) | Referência ao lembrete |
| `notified_at` | TIMESTAMP | Data e hora da notificação |

### Migrações

Para criar as tabelas no banco de dados:

```bash
npm run db:push
```

Este comando utiliza o Drizzle Kit para sincronizar o schema TypeScript com o banco PostgreSQL.

**Nota sobre PostgreSQL**: O schema utiliza `gen_random_uuid()` para gerar UUIDs automaticamente. Certifique-se de que a extensão `pgcrypto` está habilitada:

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

## 🔌 API de Lembretes

### Endpoints

#### `GET /api/reminders`
Lista todos os lembretes do usuário autenticado.

**Query Parameters:**
- `type` (opcional): Filtrar por tipo (`exam_assignment` ou `work_meeting`)
- `start` (opcional): Data inicial (ISO 8601)
- `end` (opcional): Data final (ISO 8601)

**Exemplo:**
```bash
curl -X GET "http://localhost:5000/api/reminders?type=exam_assignment&start=2024-01-01T00:00:00Z&end=2024-12-31T23:59:59Z" \
  -H "Cookie: connect.sid=..."
```

**Resposta:**
```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "ownerEmail": "user@ufu.br",
    "type": "exam_assignment",
    "title": "Prova de Cálculo",
    "description": "Prova sobre integrais",
    "dueAt": "2024-06-15T10:00:00.000Z",
    "remindBeforeMinutes": 30,
    "repeat": "none",
    "createdAt": "2024-06-01T12:00:00.000Z",
    "updatedAt": "2024-06-01T12:00:00.000Z"
  }
]
```

#### `POST /api/reminders`
Cria um novo lembrete.

**Body (JSON):**
```json
{
  "title": "Prova de Física",
  "description": "Capítulos 1-5",
  "type": "exam_assignment",
  "dueAt": "2024-06-20T14:00:00.000Z",
  "remindBeforeMinutes": 60,
  "repeat": "none"
}
```

**Validações:**
- `title`: obrigatório, não pode ser vazio
- `dueAt`: obrigatório, deve ser uma data válida em formato ISO 8601
- `remindBeforeMinutes`: deve ser >= 0 (padrão: 30)
- `type`: deve ser `exam_assignment` ou `work_meeting` (padrão: `exam_assignment`)
- `repeat`: deve ser `none`, `daily`, `weekly` ou `monthly` (padrão: `none`)

#### `GET /api/reminders/:id`
Obtém os detalhes de um lembrete específico.

#### `PUT /api/reminders/:id`
Atualiza um lembrete existente.

**Body (JSON):**
```json
{
  "title": "Prova de Física - Atualizado",
  "remindBeforeMinutes": 120
}
```

#### `DELETE /api/reminders/:id`
Exclui um lembrete.

#### `GET /api/reminders/:id/export.ics`
Exporta um lembrete como arquivo `.ics` (iCalendar).

**Resposta:** Arquivo `.ics` para download

**Exemplo:**
```bash
curl -X GET "http://localhost:5000/api/reminders/123e4567-e89b-12d3-a456-426614174000/export.ics" \
  -H "Cookie: connect.sid=..." \
  -o reminder.ics
```

O arquivo `.ics` gerado pode ser importado em:
- Google Calendar
- Outlook
- Apple Calendar
- Qualquer aplicativo compatível com iCalendar (RFC 5545)

#### `POST /api/reminders/dispatch`
Dispara manualmente o processamento de lembretes pendentes.

**Resposta:**
```json
{
  "success": true,
  "message": "Reminders dispatched successfully"
}
```

## ⚙️ Dispatcher de Lembretes

O dispatcher é um job que identifica lembretes que precisam ser notificados e registra essas notificações.

### Funcionamento

O dispatcher procura lembretes na janela de tempo:
```
(due_at - remind_before_minutes) <= now < (due_at + 1 minuto)
```

Para cada lembrete encontrado:
1. Verifica se já existe uma notificação recente (< 1 minuto)
2. Se não houver, cria um registro em `reminder_notifications`
3. Registra um log da notificação

**Nota**: Nesta fase, o dispatcher apenas registra as notificações. Em iterações futuras, pode ser estendido para enviar e-mails ou push notifications.

### Execução Manual

```bash
# Via API (requer autenticação)
curl -X POST "http://localhost:5000/api/reminders/dispatch" \
  -H "Cookie: connect.sid=..."

# Via script (standalone)
cd /home/runner/work/ProjetoSmartPlan/ProjetoSmartPlan
npx tsx server/jobs/reminderDispatcher.ts
```

### Logs

O dispatcher registra logs detalhados:
```
[ReminderDispatcher] Running at 2024-06-15T09:30:00.000Z
[ReminderDispatcher] Found 2 reminders to dispatch
[ReminderDispatcher] ✓ Notification created for reminder: {
  id: '123e4567-e89b-12d3-a456-426614174000',
  title: 'Prova de Cálculo',
  type: 'exam_assignment',
  ownerEmail: 'user@ufu.br',
  dueAt: 2024-06-15T10:00:00.000Z,
  remindBeforeMinutes: 30
}
[ReminderDispatcher] Completed successfully
```

### Agendamento (Futuro)

Para produção, recomenda-se agendar o dispatcher com cron ou um scheduler:

```bash
# Exemplo com cron (executar a cada minuto)
* * * * * cd /path/to/project && npx tsx server/jobs/reminderDispatcher.ts >> /var/log/reminders.log 2>&1
```

Ou usar ferramentas como:
- **node-cron**: Agendador em Node.js
- **Bull**: Sistema de filas com Redis
- **GitHub Actions**: Para ambientes Replit/GitHub

## 🎨 Frontend - Módulo de Lembretes

### Página `/lembretes`

A interface de lembretes oferece:

1. **Visualização em Lista**
   - Filtragem por tipo (Prova/Trabalho ou Trabalho/Reunião)
   - Exibição de data/hora de vencimento
   - Indicadores de lembretes vencidos
   - Badges para repetição

2. **Visualização em Calendário**
   - Calendário interativo com reminders destacados
   - Seleção de data para ver lembretes do dia
   - Integração com date-fns para localização em PT-BR

3. **Formulário de Criação/Edição**
   - Título (obrigatório)
   - Tipo (Prova/Trabalho ou Trabalho/Reunião)
   - Descrição (opcional)
   - Data e hora de vencimento
   - Antecedência do lembrete (em minutos)
   - Opção de repetição

4. **Ações**
   - ✏️ Editar lembrete
   - 🗑️ Excluir lembrete
   - 📥 Exportar como .ics

### Componentes

- `<ReminderForm>`: Formulário de criação/edição
- `<ReminderList>`: Lista de lembretes com filtros
- `<ReminderCalendar>`: Visualização em calendário

### API Wrapper

O arquivo `client/src/api/reminders.ts` fornece uma interface TypeScript para a API:

```typescript
import { remindersApi } from "@/api/reminders";

// Listar lembretes
const reminders = await remindersApi.getReminders({
  type: "exam_assignment",
  start: "2024-01-01T00:00:00Z",
  end: "2024-12-31T23:59:59Z"
});

// Criar lembrete
await remindersApi.createReminder({
  title: "Reunião de projeto",
  type: "work_meeting",
  dueAt: "2024-06-20T15:00:00.000Z",
  remindBeforeMinutes: 30,
  repeat: "weekly"
});

// Exportar lembrete
await remindersApi.exportReminder(reminderId);
```

## 🔒 Autenticação

Todos os endpoints de lembretes requerem autenticação. O sistema utiliza sessões com cookies.

- Email deve terminar com `@ufu.br`
- Senha deve ter pelo menos 8 caracteres, com maiúscula, minúscula, número e símbolo

## 🔐 Segurança

- Senhas são criptografadas com bcrypt (10 rounds)
- Sessões HTTP-only cookies
- Validação de entrada em todos os endpoints
- Proteção contra SQL injection via Drizzle ORM
- Permissões: usuários só podem acessar seus próprios lembretes

## 🧪 Testes

O projeto não possui infraestrutura de testes configurada no momento. Para adicionar testes:

1. Instalar dependências:
```bash
npm install --save-dev jest @types/jest ts-jest supertest @types/supertest
```

2. Configurar Jest no `package.json`:
```json
{
  "scripts": {
    "test": "jest"
  }
}
```

3. Criar arquivo `tests/reminders.test.ts` com testes de CRUD e export.

## 🚧 Feature Flag

O módulo de lembretes pode ser controlado via variável de ambiente:

```bash
ENABLE_REMINDERS=true
```

Atualmente, a feature está sempre habilitada. Para desabilitar, adicione checagens no código:

```typescript
if (process.env.ENABLE_REMINDERS !== "true") {
  return res.status(404).json({ detail: "Feature not enabled" });
}
```

## 📝 Notas Técnicas

### Migração Futura: owner_email → user_id

Atualmente, os lembretes usam `owner_email` para identificar o proprietário. Em uma futura iteração, quando o sistema de usuários estiver mais robusto, migrar para `user_id`:

```typescript
// Futura estrutura
export const reminders = pgTable("reminders", {
  // ...
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  // Remover ownerEmail
});
```

### Timezone UTC

Todos os timestamps são armazenados em UTC no banco de dados. O frontend deve:
1. Enviar datas em formato ISO 8601 (UTC)
2. Converter para timezone local apenas na exibição

```typescript
// Frontend
const localDate = new Date(reminder.dueAt); // Conversão automática para timezone local
```

### Formato .ics

O utilitário `utils/ics.ts` gera arquivos compatíveis com RFC 5545 (iCalendar):
- VEVENT para o evento principal
- VALARM para o lembrete
- Suporte a recorrência (RRULE)

## 📚 Referências

- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Express.js Documentation](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [RFC 5545 - iCalendar](https://datatracker.ietf.org/doc/html/rfc5545)

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feat/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'feat: adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feat/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 Licença

MIT
