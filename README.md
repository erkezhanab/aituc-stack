# AITUC Stack — ДЗ, оценки и рейтинг

Веб-приложение для клуба университета AITU: преподаватели создают предметы и домашние задания (PDF),
студенты сдают ответы (PDF/DOCX → PDF), преподаватели выставляют оценки по 12-балльной шкале,
система строит журнал и рейтинг с бонусом за своевременную сдачу.

## Стек

- **Next.js 16** (App Router, Server Actions, TypeScript), Tailwind CSS 4
- **Prisma 6 + Supabase Postgres** (pooled `DATABASE_URL` для рантайма, `DIRECT_URL` для миграций)
- Файлы (PDF заданий, сдачи студентов) — **Supabase Storage**, приватный bucket, выдача через сервер по signed URL
- Сессии — подписанный JWT в httpOnly-cookie (`jose`), пароли — `bcryptjs`
- Превью PDF — **PDF.js** (загружается с cdnjs), рендер всех страниц в canvas
- DOCX → PDF — **LibreOffice headless** (если установлен), иначе fallback: `mammoth` (текст) → `pdf-lib`

## Запуск

```bash
npm install
cp .env.example .env          # вставьте ключи Supabase (см. раздел «Настройка Supabase»), SESSION_SECRET, TEACHER_INVITE_CODE
npx prisma migrate deploy     # применит prisma/migrations к Supabase Postgres
npm run db:seed               # первый преподаватель + демо-студенты + предмет
npm run dev                   # http://localhost:3000
```

## Настройка Supabase

Проект использует один Supabase-проект и для базы (Postgres), и для файлов (Storage).

### 1. Проект и база данных

1. [supabase.com](https://supabase.com) → **New project**. Запомните пароль базы — он входит в строки подключения.
2. **Project Settings → Database → Connection string** (переключатель *URI*):
   - **Transaction pooler** (порт `6543`) → `DATABASE_URL`. Добавьте в конец `?pgbouncer=true`
     (Prisma отключит prepared statements, которые PgBouncer в transaction-режиме не поддерживает).
   - **Session pooler** (порт `5432`) или **Direct connection** → `DIRECT_URL`. Используется только `prisma migrate`.
3. Подставьте обе строки в `.env` (в `<password>` — пароль из шага 1).

### 2. Storage

1. **Storage → New bucket**: имя `assignments` (или другое — тогда задайте `SUPABASE_STORAGE_BUCKET`).
2. **Public bucket — выключено.** Bucket должен быть приватным: приложение читает объекты только через
   короткоживущие signed URL после собственной проверки прав (студент видит только свои сдачи, преподаватель — сдачи по своим предметам).
3. Политики RLS для bucket не нужны — сервер ходит с service-role ключом. Ничего в bucket публиковать не надо.

Файлы хранятся под ключами `assignments/<file>.pdf` и `submissions/<file>.(pdf|docx)`; в БД (`filePath`, `originalPath`, `pdfPath`) записывается именно ключ объекта.

### 3. Ключи API

**Project Settings → API**:

- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **service_role** (секция *Project API keys*, secret) → `SUPABASE_SERVICE_ROLE_KEY`.
  Ключ обходит RLS — он используется только на сервере (`src/lib/supabase.ts` помечен `server-only`) и никогда не должен попадать в клиентский бандл или в git.

### 4. Миграции и сид

```bash
npx prisma migrate deploy     # создаёт таблицы в Supabase Postgres (использует DIRECT_URL)
npx prisma generate           # (выполняется и в postinstall)
npm run db:seed               # опционально: демо-данные
```

Для дальнейших изменений схемы локально — `npx prisma migrate dev --name <что_изменили>`, на проде — снова `migrate deploy`.

История SQLite-миграций сохранена в `prisma/migrations_sqlite/` (не применяется; см. README там же).

### 5. Переменные окружения на хостинге

На Vercel/другом хостинге задайте те же переменные, что в `.env.example`: `DATABASE_URL`, `DIRECT_URL`,
`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET`, `SESSION_SECRET`, `APP_URL`, `TEACHER_INVITE_CODE`.
На serverless-хостинге LibreOffice недоступен — DOCX конвертируется fallback-рендером (`mammoth` → `pdf-lib`, только текст).

Учётные записи после `db:seed`:

| Роль          | Email                                  | Пароль       |
|---------------|----------------------------------------|--------------|
| Преподаватель | teacher@aitu.kz                        | teacher123   |
| Студенты      | damir@aitu.kz, aliya@aitu.kz, timur@aitu.kz | student123 |

Код записи на демо-предмет: `DEMO01`. Код приглашения преподавателя по умолчанию: `AITU-TEACH-2026` (`TEACHER_INVITE_CODE` в `.env`).

Для качественной конвертации DOCX (локально / на VPS) установите LibreOffice (`brew install --cask libreoffice`) — путь
определяется автоматически, либо задайте `SOFFICE_PATH` в `.env`.

## Роли и доступ

- **Вход** — одна форма с переключателем «студент / преподаватель»; аккаунт другой роли не пустит.
- **Регистрация** (`/register`) — пользователь явно выбирает роль:
  - *студент* — открытая регистрация;
  - *преподаватель* — требуется **код приглашения** `TEACHER_INVITE_CODE` из `.env` (сравнение constant-time);
    без верного кода аккаунт с ролью teacher не создаётся.
- Подтверждения email нет: аккаунт сохраняется сразу, после чего пользователь входит на `/login` по email и паролю.
- Студент записывается на предмет по коду (выдаёт преподаватель) или преподаватель добавляет его по email.
- Файлы отдаются через `/api/files/...` только владельцу сдачи и преподавателю предмета; задания — записанным студентам.

## Интерфейс

- **Дизайн-система** — семантические токены в `src/app/globals.css` (`--bg`, `--surface`, `--accent`, `--success`…),
  подключённые в Tailwind через `@theme inline`; шрифт Manrope; компоненты `.card`, `.btn-*`, `.badge-*`, `.chip-*`.
- **Тема** — переключатель ☀/☾ в шапке; выбор хранится в `localStorage.theme`, по умолчанию — `prefers-color-scheme`;
  класс `dark` ставится на `<html>` инлайн-скриптом до первой отрисовки (без мигания).
- **Языки RU / KZ** — словари `src/i18n/ru.json`, `src/i18n/kz.json` (плоские ключи). Серверные компоненты берут `getT()`,
  клиентские — `useT()`; сообщения Server Actions возвращаются как ключи и переводятся на клиенте.
  Выбранный язык хранится в cookie `lang` (год) и дублируется в `localStorage`.
- **Дедлайн** — отдельные поля даты и времени + пресеты (23:59, 18:00…); в базу пишется точный момент (ISO, с учётом часового пояса преподавателя).

## Страницы

| Путь                    | Кто            | Что                                                                 |
|-------------------------|----------------|---------------------------------------------------------------------|
| `/login`, `/register`   | все            | вход с выбором роли; регистрация с выбором роли (препод — по коду)  |
| `/teacher`              | преподаватель  | предметы (код записи), формы «Создать предмет», «Создать ДЗ», инвайт|
| `/teacher/gradebook`    | преподаватель  | журнал студент × ДЗ по предмету, клик по ячейке → выставить оценку  |
| `/teacher/leaderboard`  | преподаватель  | рейтинг по своим предметам (фильтры: период / предмет), полные имена|
| `/student`              | студент        | предметы, ДЗ с дедлайнами (просроченные подсвечены), запись по коду |
| `/student/grades`       | студент        | все свои оценки, средний балл, комментарии                          |
| `/student/leaderboard`  | студент        | общий рейтинг (другие — анонимно `Студент #XXXXXX`), своё место     |
| `/subjects/[id]`        | оба            | предмет, преподаватель, список ДЗ со статусами; у препода — создание ДЗ и студенты |
| `/assignments/[id]`     | оба            | описание, PDF задания (PDF.js), дедлайн; студент — форма сдачи и своя оценка; препод — все сдачи с превью и формой оценки |

## Правила

- Задание — только PDF (проверка расширения **и** сигнатуры `%PDF-`), до 20 МБ.
- Ответ — PDF или DOCX (сигнатура zip), до 20 МБ; DOCX конвертируется в PDF, оригинал тоже сохраняется.
- Статус сдачи `on_time` / `late` ставится автоматически по времени сервера относительно дедлайна.
- До выставления оценки студент может перезалить работу (статус пересчитывается); после оценки — нет.
- Оценка 1–12 (целое) + комментарий; повторное выставление обновляет оценку.
- **Рейтинг** = средний балл оценённых работ + **бонус 0.5**, если ни одна оценённая работа не была просрочена
  (кап 12). Фильтры: всё время / 30 дней / предмет. Топ-3 выделены медалями. Константы — `src/lib/rating.ts`.

## Структура

```
prisma/schema.prisma      модели User, Subject, Enrollment, Assignment, Submission, Grade (PostgreSQL)
prisma/migrations/        активные миграции (Postgres); migrations_sqlite/ — архив
prisma/seed.ts            первичные данные
src/lib/auth.ts           сессии, requireUser(role)
src/lib/files.ts          валидация типов, загрузка/выдача через Supabase Storage, DOCX→PDF
src/lib/supabase.ts       серверный Supabase-клиент (service role, server-only)
src/lib/rating.ts         расчёт лидерборда
src/actions/*.ts          Server Actions (auth / teacher / student)
src/app/(auth)/*          login, register (лендинг + формы)
src/i18n/*                словари ru/kz, серверный и клиентский t()
src/app/(app)/*           защищённые страницы (teacher, student, subjects, assignments)
src/app/api/files/*       выдача файлов из Storage с проверкой прав (401/403/404)
src/components/PdfViewer  PDF.js-просмотрщик
```
