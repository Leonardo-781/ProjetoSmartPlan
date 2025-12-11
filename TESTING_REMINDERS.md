# Manual Testing Guide for Reminders Module

This document provides step-by-step instructions for manually testing the reminders module functionality.

## Prerequisites

1. Ensure the database is set up and migrations are applied:
```bash
npm run db:push
```

2. Start the development server:
```bash
npm run dev
```

3. Access the application at `http://localhost:5000`

4. Log in with a valid @ufu.br email account

## Test Cases

### 1. Navigation and Access

**Test**: Verify reminders page is accessible
- [ ] Click on "Lembretes" in the sidebar navigation
- [ ] Verify the page loads at `/lembretes`
- [ ] Verify the Bell icon is displayed in the header
- [ ] Verify statistics cards are displayed (Total, Provas/Trabalhos, Reuniões, Próximos)

### 2. Create Reminder - Exam/Assignment Type

**Test**: Create a new exam/assignment reminder

Steps:
1. Click "Novo Lembrete" button
2. Fill in the form:
   - Title: "Prova de Cálculo"
   - Type: "Prova/Trabalho"
   - Date/Time: Select a future date and time
   - Remind Before: 60 (minutes)
   - Repeat: "Não repetir"
   - Description: "Prova final de Cálculo I"
3. Click "Criar"

Expected Results:
- [ ] Success toast appears: "Lembrete criado"
- [ ] Dialog closes
- [ ] New reminder appears in the list
- [ ] Orange badge shows "Prova/Trabalho"
- [ ] Statistics update to show +1 in Total and Provas/Trabalhos

### 3. Create Reminder - Work Meeting Type

**Test**: Create a new work meeting reminder

Steps:
1. Click "Novo Lembrete" button
2. Fill in the form:
   - Title: "Reunião do Projeto"
   - Type: "Reunião de Trabalho"
   - Date/Time: Select a future date and time
   - Remind Before: 30 (minutes)
   - Repeat: "Semanalmente"
   - Description: "Reunião semanal da equipe"
3. Click "Criar"

Expected Results:
- [ ] Success toast appears
- [ ] New reminder appears with blue badge "Reunião de Trabalho"
- [ ] Badge shows "Semanal" for recurrence
- [ ] Statistics update

### 4. Edit Reminder

**Test**: Edit an existing reminder

Steps:
1. Click the pencil icon on a reminder
2. Modify the title to "Prova de Cálculo I - Atualizada"
3. Change remind before to 90 minutes
4. Click "Salvar"

Expected Results:
- [ ] Success toast: "Lembrete atualizado"
- [ ] Changes are visible in the list
- [ ] Updated information is correct

### 5. Delete Reminder

**Test**: Delete a reminder

Steps:
1. Click the trash icon on a reminder
2. Confirm deletion in the dialog

Expected Results:
- [ ] Confirmation dialog appears
- [ ] After confirming, success toast: "Lembrete excluído"
- [ ] Reminder is removed from the list
- [ ] Statistics update to reflect deletion

### 6. Filter Reminders by Type

**Test**: Filter functionality works correctly

Steps:
1. Create at least one reminder of each type
2. Select "Provas/Trabalhos" from the filter dropdown

Expected Results:
- [ ] Only exam/assignment reminders are shown
- [ ] Work meeting reminders are hidden

Steps:
3. Select "Reuniões" from the filter dropdown

Expected Results:
- [ ] Only work meeting reminders are shown
- [ ] Exam/assignment reminders are hidden

Steps:
4. Select "Todos os tipos"

Expected Results:
- [ ] All reminders are displayed

### 7. Export Reminder to ICS

**Test**: ICS file export works correctly

Steps:
1. Click the download icon on a reminder
2. Save the file when prompted

Expected Results:
- [ ] File download starts
- [ ] File name format: `reminder-{id}.ics`
- [ ] Success toast: "Exportado com sucesso"

**Verify ICS File Content:**
1. Open the downloaded `.ics` file in a text editor
2. Check for:
   - [ ] `BEGIN:VCALENDAR`
   - [ ] `SUMMARY` contains the reminder title
   - [ ] `DTSTART` contains the correct date/time
   - [ ] `VALARM` section with correct trigger time
   - [ ] If repeat is set, `RRULE` is present

**Test Import to Calendar:**
1. Import the `.ics` file to Google Calendar or another calendar app
2. Verify:
   - [ ] Event appears with correct title
   - [ ] Date and time are correct
   - [ ] Reminder/alarm is set correctly

### 8. Reminder Dispatcher - Manual Execution

**Test**: Dispatcher can be triggered manually via UI

Steps:
1. Create a reminder with:
   - Due date: Current time + 10 minutes
   - Remind before: 15 minutes (so it should trigger now)
2. Click "Executar Dispatcher" button

Expected Results:
- [ ] Toast appears with processing results
- [ ] Message shows: "Processados: X, Notificados: Y"
- [ ] Check console logs for dispatcher output

**Test**: Dispatcher via npm script

Steps:
1. Open terminal
2. Run: `npm run reminders:dispatch`

Expected Results:
- [ ] Script runs without errors
- [ ] Console shows: "Starting reminder dispatcher..."
- [ ] Shows processed and notified counts
- [ ] Script exits successfully

**Test**: Dispatcher via API

Steps:
1. Use curl or Postman:
```bash
curl -X POST http://localhost:5000/api/reminders/dispatch \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE"
```

Expected Results:
- [ ] Response JSON: `{ "success": true, "processed": N, "notified": M }`
- [ ] Status code: 200

### 9. Dispatcher Logic - Notification Window

**Test**: Verify dispatcher finds reminders in notification window

Setup:
1. Create reminder 1:
   - Due: Current time + 5 minutes
   - Remind before: 10 minutes
   - Expected: Should be notified now

2. Create reminder 2:
   - Due: Current time + 2 hours
   - Remind before: 15 minutes
   - Expected: Should NOT be notified now

Steps:
1. Run dispatcher

Expected Results:
- [ ] Reminder 1 is notified (in notification window)
- [ ] Reminder 2 is NOT notified (outside notification window)
- [ ] Check database for `reminder_notifications` entries

### 10. Validation Tests

**Test**: Required field validation

Steps:
1. Click "Novo Lembrete"
2. Try to submit with empty title
3. Try to submit with empty date/time

Expected Results:
- [ ] Form shows validation error: "Título é obrigatório"
- [ ] Form shows validation error: "Data/hora é obrigatória"
- [ ] Form does not submit

**Test**: Remind before minutes validation

Steps:
1. Create a reminder
2. Set remind before to -10 (negative number)
3. Try to submit

Expected Results:
- [ ] Form shows validation error: "Deve ser um número >= 0"
- [ ] Form does not submit

### 11. Authentication and Authorization

**Test**: Verify reminders are user-specific

Steps:
1. Log in as User A
2. Create 2 reminders
3. Log out
4. Log in as User B
5. Navigate to reminders page

Expected Results:
- [ ] User B sees 0 reminders
- [ ] User B cannot see User A's reminders

Steps:
6. Log out and log back in as User A
7. Navigate to reminders page

Expected Results:
- [ ] User A sees their 2 reminders
- [ ] Both reminders are accessible

### 12. ENABLE_REMINDERS Configuration

**Test**: Module can be disabled via environment variable

Steps:
1. Stop the server
2. Set `ENABLE_REMINDERS=false` in .env
3. Start the server
4. Try to access `/api/reminders`

Expected Results:
- [ ] API returns 403 status
- [ ] Response: `{ "detail": "Reminders module is disabled" }`

Steps:
5. Remove or set `ENABLE_REMINDERS=true`
6. Restart server
7. Access `/api/reminders`

Expected Results:
- [ ] API works normally
- [ ] Returns reminders list

### 13. Sorting and Display

**Test**: Reminders are sorted by due date

Steps:
1. Create 3 reminders with different due dates:
   - Reminder A: Tomorrow
   - Reminder B: Next week
   - Reminder C: Today
2. View the reminders list

Expected Results:
- [ ] Reminders appear in chronological order
- [ ] Order: Reminder C (today), Reminder A (tomorrow), Reminder B (next week)

### 14. Responsive Design

**Test**: UI works on different screen sizes

Steps:
1. Resize browser window to mobile size (< 768px)

Expected Results:
- [ ] Statistics cards stack vertically
- [ ] Reminder cards remain readable
- [ ] Buttons are accessible
- [ ] Dialog/form is usable

### 15. API Direct Testing

**Test**: All API endpoints work correctly

Use curl or Postman to test:

```bash
# List reminders
curl -X GET http://localhost:5000/api/reminders

# Create reminder
curl -X POST http://localhost:5000/api/reminders \
  -H "Content-Type: application/json" \
  -d '{
    "title": "API Test",
    "type": "exam_assignment",
    "dueAt": "2024-12-25T14:00:00Z",
    "remindBeforeMinutes": 30,
    "repeat": "none"
  }'

# Get reminder by ID
curl -X GET http://localhost:5000/api/reminders/1

# Update reminder
curl -X PUT http://localhost:5000/api/reminders/1 \
  -H "Content-Type: application/json" \
  -d '{"title": "Updated Title"}'

# Delete reminder
curl -X DELETE http://localhost:5000/api/reminders/1

# Export ICS
curl -X GET http://localhost:5000/api/reminders/1/export.ics \
  -o reminder.ics
```

Expected Results:
- [ ] All endpoints return appropriate status codes
- [ ] Data is correctly created, read, updated, and deleted
- [ ] ICS file is generated correctly

## Edge Cases to Test

### Empty State
- [ ] Verify empty state message appears when no reminders exist
- [ ] Verify "Crie seu primeiro lembrete!" message displays

### Long Text
- [ ] Create reminder with very long title (250+ characters)
- [ ] Verify text truncates with ellipsis
- [ ] Verify full text is visible when editing

### Past Due Dates
- [ ] Create reminder with past due date
- [ ] Verify it's still created (no validation against past dates)
- [ ] Verify it appears in the list

### Special Characters
- [ ] Create reminder with special characters in title: `Test @#$%^&*`
- [ ] Verify it saves and displays correctly
- [ ] Verify ICS export escapes special characters correctly

### Concurrent Users
- [ ] Open application in two browser windows with same user
- [ ] Create reminder in window 1
- [ ] Refresh window 2
- [ ] Verify reminder appears (after manual refresh)

## Database Verification

After testing, verify database state:

```sql
-- Check reminders table
SELECT * FROM reminders;

-- Check notifications table
SELECT * FROM reminder_notifications;

-- Verify foreign key relationships
SELECT r.*, rn.notified_at 
FROM reminders r 
LEFT JOIN reminder_notifications rn ON r.id = rn.reminder_id;
```

Expected:
- [ ] All created reminders exist in database
- [ ] Deleted reminders are removed
- [ ] Notifications are linked to correct reminders
- [ ] Timestamps are in UTC

## Performance Testing

- [ ] Create 50+ reminders and verify:
  - List loads in reasonable time
  - Filtering is responsive
  - No browser lag when scrolling

## Accessibility Testing

- [ ] Navigate using keyboard only (Tab, Enter, Escape)
- [ ] Verify all interactive elements are accessible
- [ ] Test with screen reader if available

## Checklist Summary

- [ ] All navigation works
- [ ] CRUD operations function correctly
- [ ] Filters work properly
- [ ] ICS export generates valid files
- [ ] Dispatcher executes successfully
- [ ] Validation prevents invalid data
- [ ] Authorization prevents unauthorized access
- [ ] Configuration flag works
- [ ] UI is responsive and user-friendly
- [ ] API endpoints return correct responses

## Known Limitations

1. **Email notifications**: Not implemented in initial version. Dispatcher only logs and stores notifications in database.
2. **Database-specific**: UUID generation may differ between PostgreSQL and SQLite.
3. **Timezone handling**: All dates stored in UTC. Frontend should handle local timezone conversion.
4. **Automatic dispatcher**: No automatic execution. Must be triggered manually or via scheduled job.

## Next Steps

After successful manual testing:
1. Consider adding automated tests with Jest/Supertest
2. Set up CI/CD pipeline to run tests automatically
3. Configure automatic dispatcher execution (cron job)
4. Implement email notifications if SMTP credentials are available
