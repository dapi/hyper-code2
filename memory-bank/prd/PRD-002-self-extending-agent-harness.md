---
title: "PRD-002: Self-Extending Agent Harness"
doc_kind: prd
doc_function: canonical
purpose: Фиксирует source-backed premise, решения владельца этого форка, продуктовую гипотезу и границы инициативы саморасширяющегося агентского харнесса без представления гипотез или implementation gaps как подтверждённого поведения.
derived_from:
  - ../product/context.md
  - ../product/vision.md
  - ../product/customers.md
  - ../product/metrics.md
  - ../product/sources/README.md
  - ../domain/rules.md
  - ../domain/states.md
  - ../engineering/security-boundary.md
status: active
audience: humans_and_agents
must_not_define:
  - implementation_sequence
  - architecture_decision
  - feature_level_verify_contract
---

# PRD-002: Self-Extending Agent Harness

## Evidence And Decision Boundary

Документ различает три класса утверждений:

1. **Source-backed premise** — тезисы, сформулированные Николаем в исходном
   созвоне.
2. **Owner decisions** — продуктовые решения владельца этого форка. Они задают
   scope инициативы, даже если не были сформулированы Николаем.
3. **Current implementation evidence** — поведение, подтверждённое текущим кодом
   и тестами. Goal или product rule сами по себе не означают, что поведение уже
   реализовано.

Владелец этого форка принял следующие решения:

- конкретная interaction surface, включая web/HTML или TUI, является
  поддерживающим механизмом, а не сутью продукта;
- multi-user access и team workflow совместимы с дальнейшим развитием, но не
  входят в эту инициативу;
- reflection, bounded sleep и context consolidation входят в goals;
- значения секретов не должны проходить через LLM;
- кроме developer/operator инициатива рассматривает harness builders и domain
  practitioners как целевые, но пока не подтверждённые рынком роли.
- follow-up requirement Николая о явном «самоосознании» принято как требование
  к инспектируемой модели собственной реализации агента и bounded self-change,
  а не как утверждение о сознании модели.

## Acceptance

Danil Pismenny принял этот PRD 2026-08-13 как экспериментальную продуктовую
инициативу и является её decision owner. Принятие делает authoritative problem,
product hypothesis, users, goals, non-goals, scope, product rules и описанную
risk/validation posture. Оно не означает, что рыночный спрос, сравнительное
преимущество или заявленные outcomes уже подтверждены.

`VAL-01…VAL-09` достаточны как направления проверки для активации PRD. Baseline,
порог успеха, measurement method и measurement owner должны быть зафиксированы
до начала соответствующего эксперимента или delivery unit; они не выдумываются
в этом PRD при отсутствии evidence.

## Source-Backed Premise

Инициатива исходит из тезиса Николая: современные LLM достаточно хорошо пишут,
читают и компонуют код, чтобы язык, SDK и функции проекта могли стать основным
способом выполнения и расширения возможностей агента. Это исходная предпосылка,
а не доказанный результат пользовательского или сравнительного исследования.

Код в этой модели одновременно является действием, новой capability и
процедурной памятью. Вместо обязательной упаковки каждой capability в отдельный
tool или CLI-обёртку агент получает возможность работать с обычными функциями и
компоновать их средствами полноценного языка.

В follow-up комментарии Николай предложил сделать самоосознание явным:
«я бы добавил еще самоосознание более явно - те агент знает как он написан и
может себя менять ;)». [Исходное сообщение в Telegram](https://t.me/c/1951583351/97428)
и [локальный source capture](../product/sources/2026-08-13-niquola-self-awareness-comment.txt)
сохраняют исходную формулировку. В этом PRD она интерпретируется как проверяемое
знание агентом своей текущей реализации и управляемая способность изменять
разрешённые части среды.

## Product Hypothesis

Если агент и пользователь развивают одну программируемую среду, в которой агент
может находить существующие функции, собирать из них task-specific код и
сохранять полезные решения для дальнейшего использования, то повторяющаяся
работа будет адаптироваться быстрее и с большим накопительным эффектом, чем при
последовательном добавлении изолированных tools, CLI-обёрток и prompts.

Эта гипотеза пока не подтверждена сравнительным benchmark, пользовательскими
исследованиями, аналитикой переиспользования или утверждёнными метриками.

Web/HTML, TUI, headless/API surfaces, hot reload, durable sessions и forks не
являются самостоятельной сутью инициативы. Это допустимые поддерживающие
механизмы программируемой и инспектируемой среды. Текущая реализация имеет
browser surface; в этом форке также допускается развитие TUI. PRD не предписывает
единственный пользовательский интерфейс.

## Problem

В исходном созвоне фиксированные coding-agent харнессы критикуются за заранее
заданный набор инструментов, интерфейс и рабочие сценарии. В предложенной модели
повторяющиеся процессы, оставшиеся промптами, CLI-обёртками и разовыми цепочками
действий, не образуют растущую библиотеку компонуемого кода.

Фиксированный харнесс делает агента потребителем возможностей, выбранных его
разработчиком. Для новой интеграции или повторяющейся работы приходится
проектировать отдельный tool/CLI-контракт, переносить промежуточные данные через
контекст и поддерживать ещё одну изолированную сущность. Это ограничивает
естественную для кода композицию и не превращает выполненную работу в растущую
процедурную среду.

Инициатива предполагает потребность в среде, где агент и пользователь могут
непосредственно программировать способ работы: обнаруживать доступные функции,
компоновать их с SDK, исполнять task-specific код, сохранять полезные решения и
использовать их в дальнейшей работе. Для внешних пользователей эта потребность
ещё не подтверждена customer discovery.

## Users And Jobs

Роли наследуются из [Customers And Users](../product/customers.md). Только
developer/operator подтверждён текущим репозиторием. Harness builder и domain
practitioner следуют из примеров и видения Николая и приняты владельцем этого
форка как продуктовые гипотезы; внешнего подтверждения для них нет.

| Segment | Provisional Job To Be Done | Evidence status |
| --- | --- | --- |
| Developer operating coding agents | Вместе с агентом адаптировать программируемую среду к повторяющейся работе и превращать полезные решения в переиспользуемый код | Repository-backed; JTBD требует customer discovery |
| Process or harness builder | Собирать из функций, policies и extension points специализированные процессы, interaction surfaces и агентские приложения | Source-backed and owner-accepted; market-unvalidated |
| Domain practitioner using a specialized harness | Выполнять и адаптировать предметную работу через специализированный харнесс, не поддерживая базовый agent runtime | Source-backed example and owner-accepted; market-unvalidated |

Buyer, purchasing context и organization segment остаются неизвестными. Domain
practitioner не должен неявно получать raw `eval`, shell или process authority
только потому, что использует специализированную поверхность.

## Goals

- `G-01` Агент решает задачи, непосредственно используя полноценный язык,
  доступные SDK и функции проекта, а не только фиксированный перечень
  специализированных tools.
- `G-02` Перед созданием новой capability агент может найти и понять релевантные
  существующие функции, а затем скомпоновать их в task-specific программу.
- `G-03` Полезное task-specific решение можно оформить как проверяемую
  переиспользуемую функцию и применить в последующей релевантной работе.
- `G-04` Агент и пользователь могут изменять функции, interaction surfaces,
  memory/context policy и другие extension points в одной инспектируемой
  программной среде.
- `G-05` Изменение среды становится доступно без потери текущей работы, а его
  действия, результаты и ошибки остаются наблюдаемыми.
- `G-06` Durable sessions и управляемые forks позволяют продолжать работу и
  экспериментировать с agent loop. Неизменяемая граница fork и полный возврат
  результата делегирования являются требуемым контрактом, даже пока реализация
  покрывает их не полностью.
- `G-07` Harness builder может собирать специализированный процесс или
  приложение из общих capabilities, а domain practitioner — использовать его
  через ограниченную предметную поверхность.
- `G-08` Оператор или harness builder может задавать инспектируемые reflection-
  и bounded sleep-процессы как программируемые extension points agent loop.
- `G-09` Длительная сессия может породить проверяемый консолидированный
  successor context без удаления исходной истории и без неявного переключения
  пользователя.
- `G-10` Агент может получить актуальную, source-grounded модель собственной
  реализации, состояния, capabilities, effective overrides и authority
  boundaries, а разрешённое self-change выполнить как наблюдаемое, проверяемое
  и обратимое изменение.

## Non-Goals

- `NG-01` Эта инициатива не поставляет multi-user access, shared sessions,
  team roles/workflows или multi-tenant SaaS. Они совместимы с направлением
  продукта, но остаются будущими инициативами.
- `NG-02` Полноценный adversarial sandbox для недоверенного агента или
  произвольного пользовательского кода.
- `NG-03` Неограниченное или скрытое фоновое изменение исполняемой среды.
  Bounded reflection, sleep и context consolidation, запущенные принятой
  пользовательской policy и оставляющие наблюдаемый результат, остаются in scope.
- `NG-04` Полностью автоматическое курирование большой библиотеки функций.
- `NG-05` Автоматическое слияние веток и разрешение конфликтующих результатов.
- `NG-06` Гарантия решения любых нетехнических задач общего назначения.
- `NG-07` Каталог или маркетплейс расширений.
- `NG-08` Полноценная долговременная semantic-memory система за пределами
  bounded reflection и context consolidation этой инициативы.

## Product Scope

### Initiative Capabilities

- прямое использование агентом функций и SDK из полноценного языка;
- поиск и runtime introspection доступных функций до дублирования capability;
- композиция существующих функций в task-specific программы, выходящие за
  пределы удобной CLI/bash-композиции;
- создание, проверка, сохранение и последующее переиспользование функций без
  предписания единственного promotion workflow;
- единая конвенция, позволяющая функциям вызывать друг друга и наращивать
  библиотеку как один программный проект;
- программируемые extension points харнесса, включая interaction surfaces,
  подготовку контекста, reflection и bounded sleep;
- создание консолидированного successor context с сохранением исходной истории;
- сборка специализированных процессных и предметных харнессов поверх общей
  среды;
- secret-handling contract, при котором значения секретов не проходят через LLM.
- runtime-derived self-description с provenance к текущему коду и effective
  runtime composition;
- bounded self-change с явными proposal, verification, approval, activation,
  observation и rollback outcomes без обязательного единственного внутреннего
  механизма для всех change surfaces.

### Interaction-Surface Boundary

Пользователь должен иметь наблюдаемую и расширяемую interaction surface, но этот
PRD не выбирает один обязательный UI. Текущая browser/HTML surface, развиваемая
TUI и headless/API integrations могут реализовывать разные части одного
продуктового outcome. Выбор конкретной реализации принадлежит downstream design.

### Existing Enabling Baseline

Следующие механизмы уже существуют полностью или частично и поддерживают
инициативу, но сами по себе не являются её net-new delivery scope:

- marker-driven action loop, code evaluation, файловые операции и shell;
- текущая browser surface с наблюдаемыми событиями и rich HTML;
- SQLite-backed sessions;
- базовая горячая загрузка функций и routes;
- fork и awaited delegation primitives;
- локальные и удалённые LLM-провайдеры.

Наличие этих primitives не подтверждает полный self-extension, reflection или
context-consolidation scenario.

### Deferred To Future Initiatives

- multi-user access, shared sessions, team roles и coordination workflows;
- публичное или multi-tenant размещение;
- автоматическое сведение веток;
- отдельный marketplace extensions.

## Inherited Constraints

Эти правила уже принадлежат active canonical owners и не являются новыми
решениями этого PRD:

- `IC-01` Agent conversation и activity history восстанавливаются после
  обычного перезапуска — [`DR-01`](../domain/rules.md).
- `IC-02` Action и его result/error сохраняют структурную пару —
  [`DR-02`](../domain/rules.md).
- `IC-03` System-produced action result не является новым operator intent —
  [`DR-03`](../domain/rules.md).
- `IC-04` Fork наследует контекст до фиксированной границы и затем имеет
  независимое продолжение — [`DR-05`](../domain/rules.md). Текущая реализация
  использует live parent reference и ещё не обеспечивает полную неизменяемость
  унаследованного содержимого.
- `IC-05` Delegation ограничена явной задачей и return contract —
  [`DR-06`](../domain/rules.md). Awaited path существует; полный async return
  остаётся implementation gap.
- `IC-06` `eval`, shell, filesystem, environment и credentials имеют права
  server process; продукт не является sandbox —
  [Trust And Security Boundary](../engineering/security-boundary.md).

## Product Rules

- `BR-01` Function capability является обычным читаемым кодом с доступным
  callable contract и может компоноваться без обязательной CLI-обёртки.
- `BR-02` Перед дублированием capability агент должен иметь доступный способ
  поиска или introspection существующей библиотеки; PRD не фиксирует конкретный
  index, embedding или retrieval implementation.
- `BR-03` Сохранение task-specific решения как функции является явным,
  наблюдаемым изменением программного проекта, которое можно проверить и
  отменить обычными средствами работы с кодом.
- `BR-04` Capability считается переиспользуемой, когда её callable contract
  доступен для обнаружения, а поведение можно проверить. Запись файла или reload
  сами по себе недостаточны.
- `BR-05` Значения секретов не передаются LLM и не возвращаются в LLM-visible
  action-result context. Это target contract, а не подтверждённое текущее
  поведение; способ реализации выбирается downstream security design.
- `BR-06` Reflection и sleep ограничены принятой policy, оставляют наблюдаемый
  результат и не выполняют скрытую неограниченную модификацию среды.
- `BR-07` Context consolidation сохраняет исходную историю, показывает
  полученный successor context и не переключает пользователя неявно.
- `BR-08` Внутреннее представление LLM о себе не является evidence текущей
  реализации. Self-description заземляется в runtime introspection, current
  source и durable records, называет provenance и различает known, inferred и
  unavailable facts.
- `BR-09` Self-change является явным, attributable, наблюдаемым, проверяемым и
  обратимым изменением. Требуемое подтверждение зависит от change surface;
  reflection или внешний контент не могут молча активировать code, prompt,
  policy или durable behavioral change.

## Success Metrics And Validation Plan

У проекта нет утверждённых product metrics, baseline, targets, measurement
owner или analytics source; canonical gap зафиксирован в
[Product metrics](../product/metrics.md). Поэтому таблица содержит validation
questions и способы сбора evidence, а не утверждённые acceptance targets.

Этот PRD не задаёт обязательную последовательность `discover → compose → save →
verify → reuse`. Она была синтезом предыдущей редакции PRD, а не формулировкой
Николая или решением владельца форка. Downstream use cases могут описывать
наблюдаемые сценарии, но не должны превращать эту последовательность в
обязательный lifecycle без отдельного решения.

| Evidence ID | Validation question | Current evidence | Evidence collection approach |
| --- | --- | --- | --- |
| `VAL-01` | Может ли агент решить representative task, скомпоновав существующие функции и SDK? | Отдельные demonstrations есть только в source talk | Наблюдать выбранные functions, task-specific code, outcome и ошибки на эталонных задачах |
| `VAL-02` | Можно ли оформить полезную capability и применить её в последующей релевантной работе? | End-to-end scenario не подтверждён | Сравнить повторную задачу с выполнением без сохранённой capability по времени, шагам, ошибкам и context use |
| `VAL-03` | Как быстро появляется проверяемая callable capability? | Baseline отсутствует | Измерять время от пользовательского intent до успешного контрольного вызова |
| `VAL-04` | Находит ли агент релевантные функции при росте библиотеки? | Raw introspection и поиск существуют; предел не измерен | Измерять recall релевантных functions и ненужное дублирование на библиотеках разного размера |
| `VAL-05` | Сохраняются ли наблюдаемость и текущая работа при изменении среды? | Есть component-level code/tests, но нет полного end-to-end evidence | Проверить action/result trace, reload и сохранность durable work в одном сценарии |
| `VAL-06` | Даёт ли reflection или bounded sleep инспектируемый и полезный результат? | Design exists; runtime behavior не подтверждено | Review результата, trigger policy, затрат и влияния на следующую работу |
| `VAL-07` | Создаётся ли usable successor context без потери source history и неявного переключения? | Не реализовано как подтверждённый scenario | Сравнить source и successor context, проверить provenance и explicit switch |
| `VAL-08` | Не попадают ли secret values в model input или action-result context? | Гарантия отсутствует | Проверка model-visible inputs и results с контролируемым sentinel value |
| `VAL-09` | Может ли агент корректно описать затрагиваемую часть собственной реализации, предложить bounded change, пройти применимые approval/verification gates и восстановить прежнее поведение после неуспешной активации? | Raw runtime introspection, file writes и hot reload существуют; unified self-model, change ledger и rollback contract отсутствуют | Проверить provenance и freshness self-description, denied/approval paths, activation trace, live behavior, session preservation и rollback на контролируемых изменениях |

## Risks And Open Questions

- `RISK-01` Текущий HTTP server слушает все interfaces, а privileged REPL route
  не имеет authentication. Trusted-local boundary сейчас является operating
  assumption, а доступный network caller может получить process-level authority.
- `RISK-02` При росте библиотеки агент может чаще дублировать код, чем находить и
  компоновать существующие capabilities; накопительное преимущество не возникнет.
- `RISK-03` Библиотека без контрактов, проверки и понятных границ может стать
  труднее сопровождаемым аналогом разросшегося набора skills.
- `RISK-04` Текущие unrestricted process environment и action-result path не
  обеспечивают secret non-transit; подход к реализации ещё не выбран.
- `RISK-05` Domain practitioner не должен наследовать raw process authority
  developer-operated харнесса; specialized surface нуждается в отдельной границе.
- `RISK-06` Reflection и consolidation без bounded policy и review могут
  накапливать ошибочные правила или терять существенный контекст.
- `RISK-07` Self-change без независимого source grounding, approval classes и
  rollback может закрепить ошибочное или prompt-injected поведение либо сломать
  механизм собственного восстановления.
- `OQ-01` По каким сигналам task-specific code следует сохранять как функцию и
  какой уровень пользовательского подтверждения нужен?
- `OQ-02` Как сводить несколько веток и разрешать конфликтующие результаты?
- `OQ-03` Кто является buyer и какой product/organization context соответствует
  трём принятым пользовательским ролям?
- `OQ-04` Какой набор реальных задач станет baseline для качества и скорости?
- `OQ-05` Где находится граница, после которой runtime introspection и обычный
  поиск перестают обеспечивать достаточный function awareness?
- `OQ-06` Какие triggers, budgets, retention и review policy допустимы для
  reflection, sleep и context consolidation?
- `OQ-07` Какая bounded interaction и authority model нужна domain practitioner?
- `OQ-08` Какие компоненты входят в canonical self-model и как доказываются их
  freshness, provenance и effective override?
- `OQ-09` Какие approval, isolation, atomic activation и rollback contracts
  применяются к runtime overlay, shipped core, base prompt, migrations и
  security-sensitive surfaces?

## Downstream Use Cases And Delivery

### Initiative Use Cases

Этот PRD является прямым product upstream для всех project-level use cases
инициативы. `UC-001…004` остаются active contracts существующих supporting
scenarios. `UC-005…007` остаются draft до собственного Activation Gate.
Owner-accepted `UC-008` является active требуемым сценарием, но его active status
не означает, что unified self-model или bounded self-change уже реализованы.

| Use case | Role in initiative | Status | Implementation evidence |
| --- | --- | --- | --- |
| [`UC-001`](../use-cases/UC-001-run-agent-task.md) | Durable task and outcome baseline | active | Current runtime |
| [`UC-002`](../use-cases/UC-002-execute-agent-action.md) | Observable action/result baseline | active | Marker runtime |
| [`UC-003`](../use-cases/UC-003-fork-and-delegate.md) | Fork and delegation baseline | active | Partial: primitives exist; immutable prefix and full async return are gaps |
| [`UC-004`](../use-cases/UC-004-hot-reload-capability.md) | Live extension baseline | active | Partial component-level evidence |
| [`UC-005`](../use-cases/UC-005-extend-and-reuse-capability.md) | Central capability extension and later reuse | draft | No complete end-to-end evidence |
| [`UC-006`](../use-cases/UC-006-reflect-on-agent-work.md) | Bounded reflection over agent work | draft | Design direction only |
| [`UC-007`](../use-cases/UC-007-consolidate-context.md) | Bounded sleep and successor context | draft | Design direction only |
| [`UC-008`](../use-cases/UC-008-inspect-and-evolve-agent.md) | Inspect current agent implementation and perform policy-bounded self-change | active | Existing primitives only; unified scenario not implemented |

### Candidate Delivery Units

Current delivery orchestration is owned by
[EP-001](../epics/EP-001/README.md) and
[GitHub epic #24](https://github.com/dapi/hyper-code2/issues/24). It routes
separate units for:

- central self-extension/reuse scenario;
- immutable fork inheritance and transcript identity;
- закрытие текущего unauthenticated network-to-process-authority gap без
  предрешения механизма;
- обеспечение secret non-transit contract без предрешения механизма.

Reflection and bounded sleep, context consolidation, complete delegation return,
and a bounded specialized surface for domain practitioners remain candidate
future initiatives. PRD-002 keeps them as goals or gaps, but EP-001 does not route
their delivery.

Inspectable self-model, bounded self-change and reflection-to-candidate delivery
are separately orchestrated by [EP-002](../epics/EP-002/README.md). EP-002 does
not reopen EP-001 evidence or silently absorb its security work.

## Evidence And Confidence Boundary

### Verified Current Primitives And Known Gaps

- Action/result loop и browser surface подтверждены кодом и тестами.
- SQLite persistence и startup rehydration реализованы, но настоящий
  process-restart end-to-end test не зафиксирован.
- Basic function/route reload реализован; полный live-change scenario и reload
  long-running behavior не подтверждены.
- Fork и awaited delegation primitives существуют; immutable inherited content
  и полный async parent-return contract не реализованы.
- Reflection, sleep, context consolidation и secret non-transit являются goals,
  но не verified current mechanisms.

### Source-Backed Product Intent

[Исходный созвон от 2026-08-12](../product/sources/2026-08-12-self-extending-ai-harness-transcript.txt)
подтверждает функции и SDK вместо ограниченной CLI/skills-композиции
(03:37–10:46, 30:10–39:36), runtime introspection (33:45–46:51), расширяемую
web/HTML surface (54:28–57:31), изменение среды в runtime (58:49–59:51),
reflection/sleep/context experiments (48:32–53:57, 01:22:56–01:24:48), forks
для параллельного исследования (01:19:09–01:21:52), multi-user как возможное
продолжение (59:51–01:03:00), domain harness examples (01:11:32–01:14:44) и
намерение не пропускать secret values через LLM (01:04:23–01:05:24).

[Follow-up Telegram-комментарий Николая](https://t.me/c/1951583351/97428)
добавляет исходное требование сделать явным, что агент знает, как он написан, и
может себя менять. [Source capture](../product/sources/2026-08-13-niquola-self-awareness-comment.txt)
сохраняет точную формулировку; owner-accepted interpretation принадлежит этому PRD.

Транскрипт подтверждает, что тезисы были сформулированы и механизмы
демонстрировались. Он не доказывает performance, claimed implementation time,
security guarantee, масштабирование discovery или customer demand.

### Unverified Initiative Claims

- self-extension даёт преимущество по времени, качеству, стоимости или context
  use относительно tool/CLI-подхода;
- сохранённые функции достаточно часто находятся и переиспользуются;
- runtime introspection и поиск масштабируются до практически полезного размера;
- builder и domain-practitioner roles соответствуют реальному рынку;
- reflection и consolidation дают устойчивую пользу без деградации контекста;
- runtime-derived self-model остаётся корректным при reload, overrides и росте
  capability library;
- bounded self-change можно безопасно активировать и откатывать без потери
  durable work;
- product rules дают правильный баланс автономии, контроля,
  безопасности и стоимости сопровождения.
