# ProjetoSmartPlan - Agenda UFU

Sistema de gerenciamento acadêmico para estudantes da UFU (Universidade Federal de Uberlândia).

## Características

- **Autenticação**: Sistema de login/registro exclusivo para emails @ufu.br
- **Disciplinas**: Gerenciamento de matérias, professores e semestres
- **Eventos**: Aulas, provas, apresentações com suporte a recorrência
- **Tarefas**: Sistema de tarefas com prioridades e status
- **Metas de Estudo**: Acompanhamento de horas de estudo
- **Lembretes**: Sistema de lembretes para provas, trabalhos e reuniões

## Tecnologias

### Backend
- Node.js + TypeScript
- Express.js
- Drizzle ORM (PostgreSQL)
- Express Session

### Frontend
- React 18
- TypeScript
- Wouter (routing)
- TanStack Query
- Radix UI + Tailwind CSS

## Instalação e Configuração

### Pré-requisitos
- Node.js 20+
- PostgreSQL ou banco de dados compatível
- npm ou yarn

### Passos de Instalação

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
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
SESSION_SECRET=your-secret-key-here
PORT=5000
ENABLE_REMINDERS=true  # Habilita o módulo de lembretes (opcional, padrão: true)
```

4. Execute as migrações do banco de dados:
```bash
npm run db:push
```

5. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

O servidor estará disponível em `http://localhost:5000`

### Build para Produção

```bash
npm run build
npm start
```

## Módulo de Lembretes

O sistema de lembretes permite criar notificações para eventos importantes como provas, trabalhos e reuniões.

### Características dos Lembretes

- **Tipos de Lembretes**:
  - `exam_assignment`: Provas e trabalhos acadêmicos
  - `work_meeting`: Reuniões de trabalho

- **Recorrência**: Suporte para lembretes únicos ou recorrentes (diário, semanal, mensal)
- **Notificações**: Configure quantos minutos antes deseja ser lembrado
- **Exportação ICS**: Exporte lembretes para calendários externos (Google Calendar, Outlook, etc.)

### API Endpoints de Lembretes

#### GET /api/reminders
Lista todos os lembretes do usuário autenticado.

**Query Parameters:**
- `type` (opcional): Filtra por tipo (`exam_assignment` ou `work_meeting`)
- `start` (opcional): Data inicial para filtro (ISO 8601)
- `end` (opcional): Data final para filtro (ISO 8601)

**Exemplo:**
```bash
curl -X GET "http://localhost:5000/api/reminders?type=exam_assignment" \
  --cookie "connect.sid=your-session-cookie"
```

#### POST /api/reminders
Cria um novo lembrete.

**Body:**
```json
{
  "title": "Prova de Cálculo",
  "description": "Prova final de Cálculo I",
  "type": "exam_assignment",
  "dueAt": "2024-12-20T14:00:00Z",
  "remindBeforeMinutes": 60,
  "repeat": "none"
}
```

**Validações:**
- `title`: obrigatório
- `dueAt`: obrigatório (data/hora em formato ISO 8601)
- `remindBeforeMinutes`: deve ser >= 0 (padrão: 0)
- `type`: `exam_assignment` ou `work_meeting`
- `repeat`: `none`, `daily`, `weekly` ou `monthly`

#### GET /api/reminders/:id
Retorna detalhes de um lembrete específico.

#### PUT /api/reminders/:id
Atualiza um lembrete existente.

**Body:** Mesma estrutura do POST (todos os campos opcionais)

#### DELETE /api/reminders/:id
Remove um lembrete.

#### GET /api/reminders/:id/export.ics
Exporta um lembrete em formato ICS (iCalendar).

**Resposta:** Arquivo `.ics` para download

**Exemplo de uso:**
```bash
curl -X GET "http://localhost:5000/api/reminders/1/export.ics" \
  --cookie "connect.sid=your-session-cookie" \
  -o reminder.ics
```

O arquivo pode ser importado em:
- Google Calendar
- Apple Calendar
- Microsoft Outlook
- Qualquer aplicativo compatível com iCalendar

#### POST /api/reminders/dispatch
Executa o dispatcher de lembretes manualmente.

O dispatcher verifica quais lembretes precisam ser notificados e registra as notificações no banco de dados.

**Resposta:**
```json
{
  "success": true,
  "processed": 10,
  "notified": 3
}
```

### Como Importar Lembretes em Calendários

#### Google Calendar
1. Faça o download do arquivo `.ics` através da exportação
2. Acesse Google Calendar
3. Clique em "Configurações" > "Importar e exportar"
4. Selecione o arquivo `.ics` e escolha o calendário de destino

#### Apple Calendar (macOS/iOS)
1. Baixe o arquivo `.ics`
2. Clique duas vezes no arquivo
3. O evento será adicionado automaticamente ao Calendar

#### Microsoft Outlook
1. Baixe o arquivo `.ics`
2. Abra o Outlook
3. Vá em "Arquivo" > "Abrir e Exportar" > "Importar/Exportar"
4. Selecione "Importar arquivo iCalendar (.ics)"

### Dispatcher de Lembretes

O dispatcher é responsável por encontrar lembretes que precisam ser notificados e registrar as notificações.

**Lógica do Dispatcher:**
- Procura lembretes onde `(dueAt - remindBeforeMinutes) <= now < (dueAt + 1 minuto)`
- Verifica se não há notificação recente (última hora)
- Cria registro na tabela `reminder_notifications`
- Registra log da notificação

**Execução Manual:**
```bash
# Via npm script
npm run reminders:dispatch

# Via API
curl -X POST http://localhost:5000/api/reminders/dispatch \
  --cookie "connect.sid=your-session-cookie"
```

**Execução Automática:**
Para executar o dispatcher automaticamente, você pode configurar um cron job ou scheduler:

```javascript
// Exemplo com node-cron
import cron from 'node-cron';
import { dispatchReminders } from './server/jobs/reminderDispatcher';

// Executa a cada 5 minutos
cron.schedule('*/5 * * * *', async () => {
  await dispatchReminders();
});
```

### Estrutura do Banco de Dados

#### Tabela `reminders`
- `id`: ID único do lembrete
- `user_id`: Referência ao usuário
- `type`: Tipo do lembrete (exam_assignment | work_meeting)
- `title`: Título do lembrete
- `description`: Descrição opcional
- `due_at`: Data/hora do evento (UTC)
- `remind_before_minutes`: Minutos antes para notificar
- `repeat`: Tipo de recorrência (none | daily | weekly | monthly)
- `created_at`: Data de criação
- `updated_at`: Data da última atualização

#### Tabela `reminder_notifications`
- `id`: ID único da notificação
- `reminder_id`: Referência ao lembrete
- `notified_at`: Data/hora em que a notificação foi enviada

### Interface do Usuário

Acesse a página de lembretes através do menu lateral ou navegando para `/lembretes`.

**Funcionalidades da Interface:**
- Visualização de todos os lembretes em lista
- Filtros por tipo (Provas/Trabalhos, Reuniões)
- Criação e edição de lembretes através de modal
- Exclusão de lembretes com confirmação
- Exportação individual de lembretes para formato ICS
- Execução manual do dispatcher
- Estatísticas: Total, por tipo, e próximos lembretes

## Estrutura do Projeto

```
ProjetoSmartPlan/
├── client/                 # Frontend React
│   └── src/
│       ├── components/     # Componentes React
│       ├── hooks/          # React Hooks customizados
│       ├── lib/            # Utilitários e configurações
│       │   └── api/        # Funções de API
│       └── pages/          # Páginas da aplicação
├── server/                 # Backend Express
│   ├── jobs/               # Jobs e tarefas agendadas
│   ├── utils/              # Utilitários do servidor
│   ├── db.ts               # Configuração do banco de dados
│   ├── index.ts            # Ponto de entrada do servidor
│   ├── routes.ts           # Definição de rotas
│   └── storage.ts          # Camada de armazenamento
└── shared/                 # Código compartilhado
    └── schema.ts           # Schemas Drizzle ORM
```

## Segurança

- Validação de email @ufu.br obrigatória
- Senhas com requisitos de complexidade (8+ caracteres, maiúscula, minúscula, número, símbolo)
- Senhas hasheadas com bcrypt
- Sessões seguras com express-session
- Validação de entrada com Zod

## Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## Licença

MIT License

## Suporte

Para problemas ou dúvidas, abra uma issue no GitHub.
