# Graph Report - .  (2026-08-20)

## Corpus Check
- 392 files · ~423,313 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1477 nodes · 3195 edges · 120 communities (70 shown, 50 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.65)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Community 0
- Community 1
- Community 2
- Community 3
- Community 4
- Community 5
- Community 6
- Community 7
- Community 8
- Community 9
- Community 10
- Community 11
- Community 12
- Community 13
- Community 14
- Community 15
- Community 16
- Community 17
- Community 18
- Community 19
- Community 20
- Community 21
- Community 22
- Community 23
- Community 24
- Community 25
- Community 26
- Community 27
- Community 28
- Community 29
- Community 30
- Community 31
- Community 32
- Community 33
- Community 34
- Community 35
- Community 36
- Community 37
- Community 38
- Community 39
- Community 40
- Community 41
- Community 42
- Community 43
- Community 44
- Community 45
- Community 46
- Community 47
- Community 48
- Community 49
- Community 50
- Community 51
- Community 52
- Community 53
- Community 54
- Community 55
- Community 56
- Community 57
- Community 58
- Community 59
- Community 60
- Community 61
- Community 62
- Community 63
- Community 64
- Community 65
- Community 66
- Community 67
- Community 68
- Community 69
- Community 70
- Community 71
- Community 72
- Community 73
- Community 74
- Community 75
- Community 76
- Community 77
- Community 78
- Community 79
- Community 80
- Community 81
- Community 82
- Community 83
- Community 84
- Community 85
- Community 86
- Community 87
- Community 88
- Community 89
- Community 90
- Community 91
- Community 92
- Community 93
- Community 94
- Community 95
- Community 96
- Community 97
- Community 98
- Community 99
- Community 100
- Community 101
- Community 102
- Community 103
- Community 104
- Community 105
- Community 106
- Community 107
- Community 108
- Community 109
- Community 110
- Community 111
- Community 112
- Community 113
- Community 114
- Community 115
- Community 116
- Community 117
- Community 118
- Community 119

## God Nodes (most connected - your core abstractions)
1. `cn()` - 118 edges
2. `requireCapability()` - 99 edges
3. `Button()` - 29 edges
4. `react` - 29 edges
5. `formatEGP()` - 28 edges
6. `authOptions` - 17 edges
7. `listAgents()` - 16 edges
8. `compilerOptions` - 16 edges
9. `Calendar()` - 15 edges
10. `ensureCommissionForSession()` - 14 edges

## Surprising Connections (you probably didn't know these)
- `ExpenseTable()` --calls--> `formatEGP()`  [EXTRACTED]
  app/(root)/accounting/expenses/page.tsx → lib/commission.ts
- `BreakdownTile()` --calls--> `formatEGP()`  [EXTRACTED]
  app/(root)/accounting/expenses/page.tsx → lib/commission.ts
- `PaymentCountdown()` --references--> `react`  [EXTRACTED]
  app/(root)/bookings/[id]/PaymentCountdown.tsx → package.json
- `getFutureBookingPeopleTotalsByDate()` --indirect_call--> `dateKey()`  [INFERRED]
  lib/actions/booking.actions.ts → app/(root)/bookings/page.tsx
- `DroppableCell()` --calls--> `cn()`  [EXTRACTED]
  components/bookings/ScheduleBoard.tsx → lib/utils.ts

## Import Cycles
- None detected.

## Communities (120 total, 50 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.04
Nodes (45): @anthropic-ai/claude-code, babel-plugin-react-compiler, bufferutil, eslint, eslint-config-next, devDependencies, @anthropic-ai/claude-code, babel-plugin-react-compiler (+37 more)

### Community 1 - "Community 1"
Cohesion: 0.11
Nodes (33): money(), PaymentsPage(), dayUseBookingFormSchema, RATE_META, EVENT_HIGHLIGHTS, PHARAOH_DATE, PhoneInput, defaultUserValues (+25 more)

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (27): handler, BulkEmailForm(), Props, STATUS_OPTIONS, STAFF_ROLES, formatDuration(), MySchedulePage(), Props (+19 more)

### Community 3 - "Community 3"
Cohesion: 0.07
Nodes (32): PartyEditDialog(), Props, DayUseBookingForm(), PriceBreakdown(), RateDisplay(), KitesurfingBookingForm(), PharaohAirstyleBookingForm(), PriceBreakdown() (+24 more)

### Community 4 - "Community 4"
Cohesion: 0.08
Nodes (21): ClosedDateForm(), ClosedDatesPage(), AutoConfirmToggle(), BookingsDashboardPage(), STATUS_FILTERS, globalForPrisma, addClosedDate(), getClosedDates() (+13 more)

### Community 5 - "Community 5"
Cohesion: 0.09
Nodes (29): fmtDate(), fmtDay(), fmtMoney(), fmtQty(), Props, USER_TYPE_BADGE, UserDetailPage(), SessionRow (+21 more)

### Community 6 - "Community 6"
Cohesion: 0.10
Nodes (27): Props, RentalDetailPage(), NewRentalPage(), Props, RentalsPage(), EquipmentDraft, Guest, InventoryItem (+19 more)

### Community 7 - "Community 7"
Cohesion: 0.10
Nodes (28): AccordionContent(), AccordionItem(), AccordionTrigger(), Checkbox(), FieldContent(), FieldDescription(), FieldLegend(), FieldSeparator() (+20 more)

### Community 8 - "Community 8"
Cohesion: 0.09
Nodes (26): Props, money(), OpenOrdersPage(), EditPaymentForm(), METHODS, PaymentRow, toLocalDateTimeInput(), Props (+18 more)

### Community 9 - "Community 9"
Cohesion: 0.13
Nodes (15): STATUS_LABELS, LESSON_TYPES, TIME_SLOTS, UserResult, TIME_SLOTS, DayCount, Button(), buttonVariants (+7 more)

### Community 10 - "Community 10"
Cohesion: 0.09
Nodes (23): InventoryItemDetailPage(), Props, CONDITION_META, InventoryItem, InventoryItemsTable(), SizeSort, sortSizes(), handleCreate() (+15 more)

### Community 11 - "Community 11"
Cohesion: 0.10
Nodes (31): GET(), BookingEditForm(), isKitesurfingService(), ACTIVE_PENDING_STATUSES, addUtcDays(), AgentStatsResult, assignBookingAgent(), batchUpdateBookingSchedule() (+23 more)

### Community 12 - "Community 12"
Cohesion: 0.06
Nodes (30): BookingDepositData, bookingDepositSchema, BulkEmailData, bulkEmailSchema, CommissionUpdateData, CorporateBookingData, corporateBookingSchema, CreateInventoryItemData (+22 more)

### Community 13 - "Community 13"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 14 - "Community 14"
Cohesion: 0.15
Nodes (20): Props, LESSON_TYPES, LessonBookingEditSheet(), STATUSES, TIME_OPTIONS, Instructor, LessonBookingRow, Props (+12 more)

### Community 15 - "Community 15"
Cohesion: 0.10
Nodes (21): ExpenseRowActions(), Props, fieldLabel, inputBase, NewExpenseDialog(), Payee, Props, TYPE_OPTIONS (+13 more)

### Community 16 - "Community 16"
Cohesion: 0.11
Nodes (20): CopyWhatsAppButton(), Props, DownloadInvoiceButton(), Props, InstructorDetailPage(), parseStatus(), Props, CommissionsFilters() (+12 more)

### Community 17 - "Community 17"
Cohesion: 0.13
Nodes (20): BookingsHeaderActions(), CopyGuestsButton(), Guest, useCopyGuests(), adminGroups, NavGroup, NavLinkDef, DropdownMenu() (+12 more)

### Community 18 - "Community 18"
Cohesion: 0.13
Nodes (17): Props, CourseCardProps, courses, CATEGORY_LABEL, LESSON_TYPE_LABEL, Product, ProductDialog(), Props (+9 more)

### Community 19 - "Community 19"
Cohesion: 0.10
Nodes (15): AllExpensesView(), BreakdownTile(), ExpenseTable(), Row, SearchParams, StatementView(), STATUS_STYLES, TYPE_LABEL (+7 more)

### Community 20 - "Community 20"
Cohesion: 0.12
Nodes (18): BookingsAgentsPage(), Range, resolveRange(), AgentStatsCharts(), Props, SERVICE_COLORS, SERVICE_LABELS, serviceLabel() (+10 more)

### Community 21 - "Community 21"
Cohesion: 0.12
Nodes (20): Props, SettleCommissionsButton(), METHODS, Props, SettleCommissionsDialog(), CommissionListFilters, Db, durationMinutesBetween() (+12 more)

### Community 22 - "Community 22"
Cohesion: 0.18
Nodes (9): ProductSearchOption, Sheet(), SheetContent(), SheetHeader(), SheetTitle(), SheetTrigger(), StudentRow, StagedLine (+1 more)

### Community 23 - "Community 23"
Cohesion: 0.11
Nodes (15): BulkEmail(), BulkEmailProps, FullyBookedEmail(), FullyBookedEmailProps, resend, serviceToStaffEmails, PasswordResetEmail(), PasswordResetEmailProps (+7 more)

### Community 24 - "Community 24"
Cohesion: 0.12
Nodes (17): CountryEntry, CountrySelectOptionProps, CountrySelectProps, InputComponent, PhoneInputProps, Command(), CommandDialog(), CommandEmpty() (+9 more)

### Community 25 - "Community 25"
Cohesion: 0.10
Nodes (12): metadata, DayUseHero(), DayUseHeroProps, heroComponents, KitesurfingHero(), KitesurfingHeroProps, RestaurantHero(), RestaurantHeroProps (+4 more)

### Community 26 - "Community 26"
Cohesion: 0.12
Nodes (15): CommissionCardData, formatLabel(), LESSON_TYPE_LABEL, LessonProductSearchField(), LessonProductSearchOption, GuestResult, inputStyle, labelStyle (+7 more)

### Community 27 - "Community 27"
Cohesion: 0.23
Nodes (21): ensureCommissionForSession(), addGuestToSession(), batchUpdateSessionSchedule(), chargeGuestForSession(), createLessonSessionFromForm(), createLessonSessionQuick(), deleteLessonSession(), getActiveLessonBundleProducts() (+13 more)

### Community 28 - "Community 28"
Cohesion: 0.17
Nodes (17): POST(), recordFlashPayment(), buildCanonicalPayloadString(), computeWebhookSignature(), createPaymentOrder(), CreatePaymentOrderInput, CreatePaymentOrderResult, FlashConfig (+9 more)

### Community 29 - "Community 29"
Cohesion: 0.12
Nodes (9): ConfirmedBody(), fmtEGP(), getVariant(), NextStepCard(), PaymentBody(), SCREENSHOT_STATUSES, TINT, Variant (+1 more)

### Community 30 - "Community 30"
Cohesion: 0.11
Nodes (18): aliases, components, hooks, lib, ui, utils, iconLibrary, registries (+10 more)

### Community 31 - "Community 31"
Cohesion: 0.16
Nodes (12): CopyButton(), PayDepositOnline(), PaymentLinkCard(), CountrySelect(), SignInForm(), AddGuestSection(), applyBookingStatusChange(), applyFlashPayment() (+4 more)

### Community 32 - "Community 32"
Cohesion: 0.17
Nodes (14): DroppableCell(), durationMs(), Instructor, LessonFormStudent, ListView(), replaceTime(), ScheduleBoard(), SessionBooking (+6 more)

### Community 33 - "Community 33"
Cohesion: 0.20
Nodes (13): createGuest(), currentRole(), hasCapability(), CAPABILITIES, Capability, roleHasCapability(), ADMIN_ROLES, RoleName (+5 more)

### Community 34 - "Community 34"
Cohesion: 0.19
Nodes (13): AccountingExpensesPage(), buildHref(), Props, ROLE_VALUES, titleCase(), UsersPage(), csvCell(), ExportUsersButton() (+5 more)

### Community 35 - "Community 35"
Cohesion: 0.16
Nodes (10): AgentFilter(), AgentOption, CopySummaryButton(), Props, BookingsByDatePage(), SERVICE_ACCENT, SERVICE_LABELS, STATUS_FILTERS (+2 more)

### Community 36 - "Community 36"
Cohesion: 0.28
Nodes (9): metadata, metadata, metadata, CourseAside(), CourseFlow(), CourseHero(), CourseIntro(), CourseLayout() (+1 more)

### Community 37 - "Community 37"
Cohesion: 0.17
Nodes (6): metadata, metadata, metadata, menuHighlights, metadata, buildMetadata()

### Community 38 - "Community 38"
Cohesion: 0.19
Nodes (10): NewLessonPage(), Props, Instructor, LESSON_TYPE_LABELS, LessonProductOption, NewLessonForm(), Student, Student (+2 more)

### Community 39 - "Community 39"
Cohesion: 0.24
Nodes (8): SchedulePage(), InstructorsPage(), LessonsPage(), ServiceProduct, SessionWithBookings, getAllLessons(), getAllProducts(), listInstructors()

### Community 40 - "Community 40"
Cohesion: 0.23
Nodes (13): COMMISSION_LABEL, CommissionsSection(), EXPENSE_LABEL, formatDate(), formatDuration(), formatEGP(), formatTime(), InstructorInvoicePdf() (+5 more)

### Community 41 - "Community 41"
Cohesion: 0.17
Nodes (8): geistMono, geistSans, metadata, raleway, robotoMono, AuthProvider(), Props, contacts

### Community 42 - "Community 42"
Cohesion: 0.22
Nodes (9): BookingEditPage(), BookingDetailPage(), digits(), fmtEGP(), generateMetadata(), SERVICE_LABEL, STAFF_ROLES, STATUS_TONE (+1 more)

### Community 43 - "Community 43"
Cohesion: 0.21
Nodes (12): BookingsPage(), buildHref(), currentValue(), dateKey(), dateLabel(), NAV_LINKS, PARAM_DEFAULTS, SearchParams (+4 more)

### Community 44 - "Community 44"
Cohesion: 0.19
Nodes (9): UserCreateForm(), DeleteUserButton(), Props, createStudent(), createUserAsAdmin(), deleteUser(), SignUpFormData, signUpFormSchema (+1 more)

### Community 45 - "Community 45"
Cohesion: 0.15
Nodes (13): @neondatabase/serverless, dependencies, @neondatabase/serverless, @radix-ui/react-navigation-menu, react-phone-number-input, recharts, resend, @tanstack/react-devtools (+5 more)

### Community 46 - "Community 46"
Cohesion: 0.18
Nodes (5): facts, metadata, storageRates, KitesurfingRentalSection(), rentalItems

### Community 47 - "Community 47"
Cohesion: 0.24
Nodes (5): EmailVerificationBanner(), ResendVerificationButton(), Header(), NavScrollWrapper(), Toaster()

### Community 48 - "Community 48"
Cohesion: 0.21
Nodes (10): useAgents(), ALL_STATUSES, BookingComponent(), buildWaData(), SERVICE_META, STATUS_BORDER, STATUS_LABEL, STATUS_TEXT (+2 more)

### Community 50 - "Community 50"
Cohesion: 0.25
Nodes (7): DayUseReportPage(), parseMonth(), DayUseReportChart(), Props, Agent, DayUseReportFilters(), getDayUseMonthlyReport()

### Community 51 - "Community 51"
Cohesion: 0.22
Nodes (7): Props, STATUS_ORDER, StatusEditDialog(), ToneStyle, ActionSpec, BookingQuickActions(), updateBookingStatus()

### Community 52 - "Community 52"
Cohesion: 0.35
Nodes (8): KitesurfingBookingsPage(), RestaurantBookingsPage(), AgentOption, AgentsContext, AgentsProvider(), BookingWithAgent, getBookingsByService(), listAgents()

### Community 53 - "Community 53"
Cohesion: 0.18
Nodes (4): ACTIVITIES, ExperiencePanelProps, INCLUSIONS, metadata

### Community 54 - "Community 54"
Cohesion: 0.29
Nodes (9): CommissionCard(), Props, REASON_TEXT, CommissionEditDialog(), MarkPaidDialog(), Payment, Props, listPayoutPaymentsForInstructor() (+1 more)

### Community 55 - "Community 55"
Cohesion: 0.25
Nodes (8): AdminLinks(), AdminLinksMobile(), visibleGroupsForRole(), links, Menu(), Props, UserAuthButton(), SheetClose()

### Community 56 - "Community 56"
Cohesion: 0.38
Nodes (9): sendPasswordResetEmail(), sendVerificationEmail(), issueEmailVerificationForUser(), issueVerification(), requestPasswordReset(), resendVerification(), resetPassword(), generateToken() (+1 more)

### Community 57 - "Community 57"
Cohesion: 0.31
Nodes (8): GET(), parseDate(), GET(), parseDate(), UserEditFormClient(), updateUser(), hasRole(), STAFF_ROLES

### Community 58 - "Community 58"
Cohesion: 0.22
Nodes (8): AgentOption, BookingsFilters(), DIR_OPTIONS, pillClass(), RANGE_OPTIONS, SERVICE_OPTIONS, SORT_OPTIONS, STATUS_OPTIONS

### Community 59 - "Community 59"
Cohesion: 0.29
Nodes (9): formatDate(), formatEGP(), InvoiceExpense, InvoicePayee, InvoicePdf(), InvoiceProps, Section(), styles (+1 more)

### Community 60 - "Community 60"
Cohesion: 0.31
Nodes (7): DeletePaymentButton(), DepositPaymentsPage(), fmtEGP(), METHOD_TONE, STAFF_ROLES, deleteDepositPayment(), getAllDepositPayments()

### Community 61 - "Community 61"
Cohesion: 0.33
Nodes (5): dayLabel(), hoursLeft(), ReceptionPage(), Badge(), badgeVariants

### Community 62 - "Community 62"
Cohesion: 0.43
Nodes (6): createProduct(), LessonFields, parseCategory(), parseLessonFields(), toggleProductActive(), updateProduct()

### Community 63 - "Community 63"
Cohesion: 0.29
Nodes (6): buildCanonical(), canonical, env, flatten(), payload, signature

### Community 64 - "Community 64"
Cohesion: 0.48
Nodes (5): Page(), NewUserPage(), getUserById(), ADMIN_ROLES, requireRolePage()

### Community 66 - "Community 66"
Cohesion: 0.40
Nodes (3): metadata, ResetPasswordForm(), resetPasswordSchema

### Community 67 - "Community 67"
Cohesion: 0.47
Nodes (5): fmtEGP(), METHODS, PayDepositDialog(), Props, payBookingDeposit()

### Community 68 - "Community 68"
Cohesion: 0.33
Nodes (5): ClassifyArgs, classifyBooking(), Contribution, Db, QUALIFYING_STATUSES

### Community 69 - "Community 69"
Cohesion: 0.50
Nodes (4): Props, SendFullyBookedButton(), sendFullyBookedEmail(), sendFullyBookedEmails()

### Community 71 - "Community 71"
Cohesion: 0.50
Nodes (4): metadata, Props, VerifyEmailPage(), verifyEmail()

### Community 72 - "Community 72"
Cohesion: 0.67
Nodes (3): SignUpForm(), sendRegistrationEmail(), createUser()

## Knowledge Gaps
- **437 isolated node(s):** `metadata`, `TYPE_LABEL`, `STATUS_STYLES`, `SearchParams`, `Row` (+432 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **50 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `Community 31` to `Community 2`, `Community 3`, `Community 4`, `Community 69`, `Community 70`, `Community 66`, `Community 72`, `Community 67`, `Community 9`, `Community 11`, `Community 44`, `Community 43`, `Community 45`, `Community 47`, `Community 51`, `Community 57`, `Community 60`, `Community 29`?**
  _High betweenness centrality (0.203) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Community 45` to `Community 0`, `Community 31`, `Community 75`, `Community 76`, `Community 77`, `Community 78`, `Community 79`, `Community 81`, `Community 82`, `Community 83`, `Community 85`, `Community 86`, `Community 87`, `Community 88`, `Community 89`, `Community 90`, `Community 92`, `Community 93`, `Community 94`, `Community 95`, `Community 96`, `Community 97`, `Community 98`, `Community 99`, `Community 100`, `Community 101`, `Community 102`, `Community 103`, `Community 104`, `Community 105`, `Community 106`, `Community 107`, `Community 108`, `Community 109`, `Community 110`, `Community 111`, `Community 112`, `Community 113`, `Community 114`, `Community 115`, `Community 116`, `Community 117`?**
  _High betweenness centrality (0.201) - this node is a cross-community bridge._
- **Why does `requireCapability()` connect `Community 27` to `Community 1`, `Community 3`, `Community 4`, `Community 6`, `Community 8`, `Community 9`, `Community 10`, `Community 11`, `Community 15`, `Community 16`, `Community 19`, `Community 21`, `Community 31`, `Community 32`, `Community 33`, `Community 34`, `Community 35`, `Community 38`, `Community 39`, `Community 44`, `Community 50`, `Community 52`, `Community 54`, `Community 60`, `Community 62`, `Community 68`?**
  _High betweenness centrality (0.095) - this node is a cross-community bridge._
- **What connects `metadata`, `TYPE_LABEL`, `STATUS_STYLES` to the rest of the system?**
  _437 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.043478260869565216 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.11400966183574879 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.0613107822410148 - nodes in this community are weakly interconnected._