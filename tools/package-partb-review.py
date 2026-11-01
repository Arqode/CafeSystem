from pathlib import Path
import json, shutil, hashlib, zipfile, csv
from xml.sax.saxutils import escape
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, PageBreak, KeepTogether
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

root=Path(__file__).resolve().parent.parent
folder=root/'output/PartB_review'
evidence=folder/'evidence'
evidence.mkdir(exist_ok=True)
for p in (root/'output/evidence').iterdir():
    if p.is_file(): shutil.copy2(p,evidence/p.name)
for name in ['review-usability.mjs','test-browser.mjs','measure-performance.mjs']:
    (folder/'reproduction').mkdir(exist_ok=True)
    shutil.copy2(root/'tools'/name,folder/'reproduction'/name)
review=json.loads((folder/'review-results.json').read_text())
perf=json.loads((evidence/'performance.json').read_text())
browser=json.loads((evidence/'browser-tests.json').read_text())
pdfmetrics.registerFont(TTFont('Arial','C:/Windows/Fonts/arial.ttf'))
pdfmetrics.registerFont(TTFont('ArialBold','C:/Windows/Fonts/arialbd.ttf'))
styles=getSampleStyleSheet()
styles.add(ParagraphStyle(name='BodyRU',fontName='Arial',fontSize=10,leading=14,spaceAfter=7))
styles.add(ParagraphStyle(name='TitleRU',fontName='ArialBold',fontSize=25,leading=29,textColor=colors.HexColor('#1854ed'),spaceAfter=16))
styles.add(ParagraphStyle(name='HeadingRU',fontName='ArialBold',fontSize=16,leading=20,textColor=colors.HexColor('#1854ed'),spaceAfter=10))
styles.add(ParagraphStyle(name='SmallRU',fontName='Arial',fontSize=8,leading=11,spaceAfter=5))
styles.add(ParagraphStyle(name='CaptionRU',fontName='Arial',fontSize=8,leading=11,alignment=TA_CENTER,spaceAfter=10))
story=[]
def p(text,style='BodyRU'):
    return Paragraph(escape(str(text)),styles[style])
def add(text,style='BodyRU'):story.append(p(text,style))
def table(rows,widths=None):
    t=Table([[p(c,'SmallRU') for c in row] for row in rows],colWidths=widths,repeatRows=1,hAlign='LEFT')
    t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),colors.HexColor('#eaf0ff')),('GRID',(0,0),(-1,-1),.4,colors.HexColor('#cfdbef')),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),7),('RIGHTPADDING',(0,0),(-1,-1),7),('TOPPADDING',(0,0),(-1,-1),7),('BOTTOMPADDING',(0,0),(-1,-1),7)]))
    story.append(t);story.append(Spacer(1,10))
def image(name,w=70*mm,h=151*mm):
    im=Image(str(folder/'screenshots'/name)); scale=min(w/im.imageWidth,h/im.imageHeight)
    im.drawWidth=im.imageWidth*scale;im.drawHeight=im.imageHeight*scale;return im
def footer(c,doc):
    c.setFont('Arial',8);c.setFillColor(colors.HexColor('#64748b'));c.drawString(17*mm,12*mm,'DashFood | Внутренняя проверка | 01.11.2026');c.drawRightString(193*mm,12*mm,str(doc.page))

add('DashFood: самопроверка проекта','TitleRU')
add('Материалы к Part B Endterm','HeadingRU')
add('Дата: 1 ноября 2026. Подготовлено для автора проекта. Метод: автоматизированные сценарии Chrome и инструментальная проверка интерфейса; выполнение - Codex. Внешних участников: 0. Отзывы Medet, Nurdaulet и Iskander не записывались и в результаты не включены.')
add('B1. Проверка трёх критериев','HeadingRU')
table([['Критерий Stage 1','Проверка','Результат'],['Viewing the menu','Открытие меню, товаров и цен','Пройдено в автоматическом сценарии'],['Adding products to the cart','Добавление двух товаров, удаление одного, количество 2, перезагрузка','Пройдено; количество сохранено'],['Placing an order','Оформление, вход сотрудника, Preparing → Ready, чтение статуса клиентом','Пройдено; заказ сохранён в PostgreSQL']],[42*mm,87*mm,47*mm])
add('Доказательства: evidence/browser-tests.json; скриншоты A1-1 ... A1-6. Важно: таблица доказывает функциональный сценарий, а не тестирование с тремя людьми. Скорость выполнения автоматического сценария не является временем выполнения задания человеком.')
add('B2. Обнаруженные проблемы','HeadingRU')
table([['ID','Наблюдение','Статус'],['F01','Скрытые пункты навигации на телефоне','Воспроизведено; исправление запланировано'],['F02','Пробелы по краям поискового запроса дают пустой результат','Воспроизведено; исправление запланировано'],['F03','Форма редактирования появляется за пределами экрана','Воспроизведено; исправление запланировано']],[15*mm,114*mm,47*mm])
add('B1 с минимум тремя внешними пользователями остаётся незавершённым. Для B2 эти наблюдения представлены как внутренний UX-разбор. Последующие страницы содержат шаги воспроизведения, скриншоты, эвристики Nielsen и планы изменений.')

story.append(PageBreak());add('F01. Навигация на телефоне','TitleRU')
add('Условия: Chrome, viewport 375 × 812. Полоса навигации имеет ширину 339 px, содержимое - 414 px. Insights находится за правым краем экрана. Требуется горизонтальная прокрутка, отдельной подсказки нет.')
story.append(image('F01-mobile-navigation.png'));add('F01-mobile-navigation.png - исходное состояние без прокрутки навигации.','CaptionRU')
add('Последствие: часть функций труднее обнаружить. Это наблюдение об интерфейсе; не утверждается, что конкретный человек не смог найти пункт.')
add('Эвристика: Recognition rather than recall; visibility of system status. План: явное мобильное меню либо заметная подсказка прокрутки. Повторная проверка: найти все пункты при ширине 320/375 px, проверить клавиатурную навигацию.')

story.append(PageBreak());add('F02. Поиск с пробелами','TitleRU')
add('Шаги: открыть Menu; ввести Cheeseburger - найден один товар. Ввести тот же запрос с пробелами в начале и конце: " Cheeseburger " - найдено ноль товаров.')
story.append(image('F02-search-spaces.png'));add('F02-search-spaces.png - пустой результат при существующем товаре.','CaptionRU')
add('Эвристика: Error prevention; flexibility and efficiency of use. План: перед сравнением названий применять trim() к строке поиска. Повторная проверка: оба варианта запроса должны находить один и тот же товар; пустая строка должна возвращать обычное меню.')

story.append(PageBreak());add('F03. Редактирование вне экрана','TitleRU')
add('Шаги: войти в Manage menu; прокрутить к последнему товару; нажать Edit. Форма создаётся вверху списка, но экран остаётся внизу. Фокус остаётся на Edit. Границы формы после нажатия: top = -1231 px, bottom = -785 px, то есть форма полностью выше viewport.')
t=Table([[image('F03-edit-after-click.png',73*mm,155*mm),image('F03-edit-form-above.png',73*mm,155*mm)],[p('Сразу после Edit: форма не видна.','CaptionRU'),p('После ручной прокрутки вверх: форма существует.','CaptionRU')]],colWidths=[88*mm,88*mm]);t.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP')]));story.append(t)
add('Эвристика: Visibility of system status. План: после открытия прокручивать к форме и переводить фокус в Name. Повторная проверка: Edit последнего товара на телефоне и ПК сразу показывает форму; Cancel возвращает пользователя к исходной позиции.')

story.append(PageBreak());add('B3. Производительность','TitleRU')
add('Фактические автоматические замеры 1 ноября 2026. Chrome DevTools Protocol, cache disabled, Fast 4G: download 1 012 500 bytes/s; upload 168 750 bytes/s; latency 165 ms; viewport 375 × 812, DPR 1. Три независимых загрузки каждого экрана.')
rows=[['Экран','Готовность 1, с','Готовность 2, с','Готовность 3, с','Среднее, с','Средний Load, с']]
for screen in ['menu','cart']:
    values=[r['interactiveMs']/1000 for r in perf['results'] if r['screen']==screen]
    avg=perf['averages'][screen]
    rows.append([screen.title(),*[f'{v:.3f}' for v in values],f"{avg['interactiveMs']/1000:.3f}",f"{avg['loadMs']/1000:.3f}"])
table(rows,[23*mm,30*mm,30*mm,30*mm,30*mm,33*mm])
add('Готовность - момент, когда карточки меню или управление количеством корзины обнаружены сценарием, относительно начала навигации. Оба средних результата меньше 2 секунд. Это локальная инструментальная оценка R12, не пользовательское время оформления заказа.')
add('Доказательства: evidence/performance.json; B3-menu-1/2/3.png и B3-cart-1/2/3.png. Скриншоты показывают экран приложения, а не открытую панель Network. Для точного формата B3 из задания следует добавить ручные снимки Network с видимыми Fast 4G и Disable cache.')
add('Что остаётся для сдачи','HeadingRU')
add('1. Провести одинаковые три задания с Medet, Nurdaulet и Iskander вне команды. Записать устройства, исходы, помощь и реальные наблюдения. Формы в TESTERS_PENDING.md пока не заполнены.')
add('2. Дополнить наблюдения внутреннего UX-разбора реальными трудностями участников. Если проблема не встретилась людям, не приписывать её участнику.')
add('3. Добавить ручные Network-скриншоты и включить завершённый Part B в общий отчёт Group_Team_ICT_ProjectStage2.pdf. Этот PDF является приложением самопроверки и не заменяет полный отчёт A-D.')
add('Воспроизводимость и источники','HeadingRU')
add('Данные проверки: review-results.json и evidence/*.json. Сценарии: reproduction/*.mjs (запускаются из корня исходного проекта, требуют .env с локальным паролем сотрудника, Chrome и Playwright). Архив не содержит паролей, токенов или .env. SHA256SUMS.csv позволяет проверить целостность файлов.','SmallRU')
add('Сеть Fast 4G: https://chromium.googlesource.com/devtools/devtools-frontend/+/HEAD/front_end/core/sdk/NetworkManager.ts. Учебные требования: приложенный Endterm_Week_9 (1).pdf, Part B B1-B3.','SmallRU')
doc=SimpleDocTemplate(str(folder/'DashFood_PartB_SelfReview.pdf'),pagesize=(210*mm,297*mm),rightMargin=17*mm,leftMargin=17*mm,topMargin=17*mm,bottomMargin=20*mm,title='DashFood Part B - Internal self-review',author='DashFood project - browser-assisted review')
doc.build(story,onFirstPage=footer,onLaterPages=footer)

(folder/'README_RU.md').write_text('''# DashFood: архив внутренней проверки Part B

Это реальная проверка проекта с помощью автоматизированного Chrome, подготовленная для автора.
Дата: 1 ноября 2026. Внешних участников в этой проверке: 0.

- DashFood_PartB_SelfReview.pdf: B1 функциональный сценарий, три проблемы B2, измерения B3.
- screenshots/: четыре свежих снимка трёх воспроизводимых UX-проблем.
- review-results.json: исходные координаты, условия и результаты проверки.
- evidence/: скриншоты пути клиента/сотрудника, журналы и три замера Menu/Cart.
- TESTERS_PENDING.md: незаполненные формы для трёх будущих внешних участников.
- reproduction/: исходные сценарии; запуск из корня DashFood.
- SHA256SUMS.csv: контрольные суммы файлов.

Это приложение к отчёту, не готовая замена обязательного B1 с тремя внешними пользователями.
Отзывы Medet, Nurdaulet и Iskander не записывались и не представлены как состоявшиеся.
Скриншоты B3 показывают приложение, а не панель Network: добавьте ручные снимки панели.
Найденные UX-проблемы не исправлялись в рамках этой проверки; планы исправления есть в PDF.
Результаты api-tests.json и https-health.json сохранены с предыдущей проверки; их даты не обновлялись.
''',encoding='utf-8')
forms=['# Запланированное внешнее тестирование\n\nСтатус: ещё не проведено. Не представлять пустые формы как результаты.\n']
for name in ['Medet','Nurdaulet','Iskander']:
    forms.append(f'''## {name}

- Дата: [после проведения]
- Устройство и браузер: [заполнить]
- Не состоит в команде проекта: [подтвердить]
- Viewing the menu: [успешно / неуспешно; наблюдение]
- Adding products to the cart: [успешно / неуспешно; наблюдение]
- Placing an order: [успешно / неуспешно; номер заказа]
- Понадобилась помощь: [какая]
- Время выполнения, если измерялось: [реальное значение, секунд]
- Замеченная проблема или комментарий: [реальные слова участника]
- Скриншоты: [имена файлов]

''')
forms.append('''## Единое задание

Без подсказок найдите Cheeseburger и цену. Добавьте Cheeseburger и Cola,
откройте Cart, увеличьте Cheeseburger до 2, удалите Cola, оформите заказ,
найдите номер и статус. Сотрудник переводит заказ в Ready; проверьте обновление.
Не называйте участнику заранее обнаруженные проблемы. После задания спросите,
какие действия были непонятны. Запишите факт, а не ожидаемый отзыв.
''')
(folder/'TESTERS_PENDING.md').write_text('\n'.join(forms),encoding='utf-8')
manifest=folder/'SHA256SUMS.csv'
with manifest.open('w',encoding='utf-8-sig',newline='') as stream:
    writer=csv.writer(stream);writer.writerow(['file','bytes','sha256'])
    for file in sorted(folder.rglob('*')):
        if file.is_file() and file!=manifest:
            writer.writerow([file.relative_to(folder).as_posix(),file.stat().st_size,hashlib.sha256(file.read_bytes()).hexdigest()])
archive=root/'output/DashFood_PartB_SelfReview.zip'
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED) as z:
    for file in sorted(folder.rglob('*')):
        if file.is_file(): z.write(file,Path('DashFood_PartB_SelfReview')/file.relative_to(folder))
print('Created',archive.name,'and PDF; external participant results remain pending.')
