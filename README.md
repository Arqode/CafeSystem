# DashFood — café pickup ordering

Рабочий учебный проект: React + TypeScript + Vite, Express REST API,
PostgreSQL, Docker Compose. Клиент и сотрудник используют одну базу.
Интерфейс на английском для ICT-защиты; инструкции на русском.

## Самый простой запуск (Windows)

Нужен запущенный Docker Desktop. Откройте PowerShell в папке проекта:

```powershell
powershell -ExecutionPolicy Bypass -File .\setup.ps1
```

Первый запуск скачивает образы и зависимости, собирает сайт, создаёт базу,
восемь позиций меню, учётную запись сотрудника и 120 синтетических заказов.
Повторный запуск сохраняет заказы; seed не добавляет повторные 120 записей.

Открыть: http://localhost:4000
Вход сотрудника: **admin**. Пароль выводится при первом запуске и хранится
в корневом `.env` как ADMIN_PASSWORD. Не отправляйте .env с работой.
Секреты и пароль базы генерируются отдельно для этого проекта.

```powershell
docker compose ps                         # состояние db и app
docker compose logs --tail 60 app          # диагностика
docker compose up -d                       # повторный запуск
docker compose stop                        # остановка с сохранением данных
```

Данные находятся в volume cafe_dashfood_pgdata. Не удаляйте volume.
Старое хранилище предыдущей версии не удалено. Если старый cafe-api-1 занимает
порт 4000, остановите его: `docker stop cafe-api-1`, затем `docker compose up -d`.
Не меняйте DB_PASSWORD в .env после создания базы без смены пароля в PostgreSQL.
Изменение ADMIN_PASSWORD применяется при следующем старте app.

## HTTPS (R13)

```powershell
docker compose --profile https up -d https
```

Откройте https://localhost. Caddy использует локальный центр сертификации;
для доверенного сертификата на этом компьютере выполните:

```powershell
docker compose cp https:/data/caddy/pki/authorities/local/root.crt ./dashfood-local-root.crt
certutil -user -addstore Root ./dashfood-local-root.crt
```

Эта команда добавляет именно локальный CA Caddy в доверенные сертификаты вашего
пользователя Windows. Выполняйте её только на своём компьютере для своей разработки.
Затем перезапустите браузер. Без доверия будет предупреждение о локальном сертификате;
это не равнозначно доверенному публичному HTTPS. Для публичного сервера укажите свой
домен в DASHFOOD_DOMAIN в .env, направьте DNS на сервер, откройте 80/443 и
пересоздайте https: `docker compose --profile https up -d --force-recreate https`.
Caddy запрашивает публичный сертификат автоматически при доступном домене.
В production закройте внешний прямой порт 4000, оставив доступ через Caddy.

## Открыть на телефоне

Телефон и ПК должны находиться в одной Wi-Fi-сети. Узнайте IPv4 ПК через ipconfig,
откройте на телефоне http://IP_КОМПЬЮТЕРА:4000. Если Windows Firewall блокирует
доступ, разрешите порт 4000 только для частной сети. API использует тот же адрес,
поэтому заказы клиента видны сотруднику на ПК. localhost на телефоне означает сам
телефон. HTTPS с доменом — вариант для публичной демонстрации; локальный сертификат
ПК не становится автоматически доверенным на телефоне.

## Разработка без сборки Docker app

Нужны Node.js 22+, npm и PostgreSQL. Можно оставить базу в Docker:

```powershell
npm.cmd run setup
Copy-Item server/.env.example server/.env
# В server/.env задайте вашу DATABASE_URL, JWT_SECRET и ADMIN_PASSWORD.
# PostgreSQL должен быть доступен по этой DATABASE_URL.
npm.cmd run seed
npm.cmd run dev
```

Frontend: http://localhost:5173; backend: http://localhost:4000.
Vite перенаправляет /api на сервер. `web/.env.example` содержит VITE_API_URL=/.
Для отдельного браузерного preview можно поставить VITE_DEMO=true и перезапустить
Vite. Это только demo: localStorage не подходит для защиты A1 с общей базой.

Production без Docker: `npm.cmd run build`, затем `npm.cmd run seed` и
`npm.cmd start`. Сервер отдаёт и web/dist, и /api с одного адреса.
Для npm start переменные берутся из server/.env, для Docker — из корневого .env.

## Возможности

- Menu: фотографии WebP, поиск, категории, цены в тенге.
- Cart: добавление, удаление, количество 1–50, сумма, сохранение после обновления.
- Place order: самовывоз и оплата в кафе, расчёт по ценам сервера, транзакция БД.
- My orders: номер, состав, сумма и статус; обновление каждые 8 секунд.
- Staff orders: защищённый вход, все заказы, фильтры, Preparing → Ready → Completed;
  отмена New/Preparing. Завершённый заказ не возвращается на предыдущий этап.
- Manage menu: создание, редактирование, включение и отключение позиции.
- Insights: три запроса/графика, количество заказов, выручка и средний чек,
  демонстрационная оценка времени по очереди. Реальный IoT-датчик не подключён.

Логотип временный: замените web/public/logo.svg своим SVG. Если получите PNG,
положите его в public и поменяйте ссылки в App.tsx и index.html, затем пересоберите.
Существующие фотографии и credits сохранены.

## Проверка

При запущенном Docker-сайте:

```powershell
npm.cmd test
npm.cmd run build
npm.cmd --prefix tools ci
node tools/test-browser.mjs
```

Browser-тесту нужны Playwright и установленный Chrome. Он сохраняет скриншоты,
проверяет ширины 320/375/768/1440, корзину, оформление и статусы. API-тест создаёт
синтетический заказ и отключённый тестовый товар. Это изменяет только данные проекта;
результаты — output/evidence. Браузерные проверки не заменяют тесты B1 с людьми.

## База и анализ

```powershell
docker compose exec db psql -U cafe -d cafe
```

В psql вставьте запросы из docs/ANALYSIS.sql. Для выполнения всего файла:

```powershell
Get-Content -Raw docs/ANALYSIS.sql | docker compose exec -T db psql -U cafe -d cafe
```

120 заказов seed отмечены is_demo=true. Последующие ручные/автоматические заказы
попадают в ту же БД. Аналитика считает текущие данные; для фиксированной выборки
добавьте WHERE is_demo или AND is_demo. Синтетические данные показывают метод,
а не настоящий спрос посетителей.

## Материалы Endterm

- docs/DEFENSE_RU.md — сценарий 5–7 минут, план 8 слайдов, live demo и ответы.
- docs/TESTING.md — протокол B1/B2/B3 с полями для реальных результатов.
- docs/ANALYSIS.sql — повторяемые C1–C3 и запрос для демонстрации хранения.
- docs/ENDTERM_REPORT.md — отчёт A–D, матрица R1–R15, IoT, источники и план.
- output/evidence — реальные скриншоты и JSON автоматических проверок.

Перед сдачей заполните группу/команду и подтвердите личный вклад Artur, Adiyat и Erdaulet,
реальные пользовательские тесты и Fast 4G. Uptime 99% без мониторинга не доказан.
Сверьте обрезанный R11 с полным Stage 1 и приложите замечания преподавателя.

## Структура

web/src/pages — экраны; web/src/api.ts — запросы; web/src/store.tsx — состояние.
server/src/index.ts — API/доступ/валидация; server/schema.sql — схема;
server/src/seed.ts — воспроизводимые synthetic records. comparison/before —
старый неизменённый снимок Assignment 4. Старые отчёты PART_B_REPORT.md и
B3_ACCESSIBILITY.md относятся к предыдущей версии и не являются замерами Endterm.

API: GET /api/health; GET /api/products; POST /api/orders; GET /api/orders/:id;
POST /api/auth/login; защищённые GET /api/orders, GET /api/products?all=1,
POST /api/products, PUT /api/products/:id, PATCH /api/orders/:id/status,
GET /api/analytics. Пароли bcrypt, JWT 8 часов, SQL-параметры,
ограничение размера тела/попыток входа, серверная проверка цен и статусов.
