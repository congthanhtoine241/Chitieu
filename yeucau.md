# MASTER PROMPT: PERSONAL FINANCE MANAGEMENT WEB APP

## 1. ROLE & WORKING MODE

You are a Senior Full-Stack Software Engineer, Software Architect, UI/UX Designer, Database Engineer, Security Engineer, and QA Engineer.

Your task is to analyze, design, implement, test, and deploy a complete Personal Finance Management Web Application.

You must work professionally, follow software engineering best practices, and leverage all relevant installed Agent Skills available in the current development environment.

**Project objective:** Build a modern, responsive personal expense management application using HTML, CSS, JavaScript, and Supabase as the persistent database, deployed entirely through GitHub Pages.

Do not treat this as a simple HTML demo. Build a functional application with real authentication, database operations, data visualization, and proper security.

---

## 2. SKILL DISCOVERY & UTILIZATION

Before writing any code, you MUST:

1. Inspect the current project directory.
2. Discover all available Agent Skills.
3. Find and read relevant `SKILL.md` files.
4. Inspect skill descriptions, references, workflows, and instructions.
5. Identify which skills are relevant to this project.
6. Create a skill utilization plan.

Prioritize skills related to:

- Software Engineering Planning
- Requirements Analysis
- System Architecture
- Frontend Development
- UI/UX Design
- HTML5 / CSS3 / JavaScript
- Responsive Web Design
- Supabase
- PostgreSQL
- Database Design
- Authentication & Authorization
- Application Security
- Data Validation
- API Integration
- Software Testing
- Debugging
- Performance Optimization
- Git & GitHub
- GitHub Pages Deployment
- Code Review

### Skill utilization rules

- Apply all relevant installed skills.
- Do not artificially apply irrelevant skills.
- If multiple skills overlap, combine their best practices.
- Follow the actual instructions in each SKILL.md.
- Do not assume a skill is available without inspecting it.
- If a required skill is missing, use established industry best practices instead.
- Do not merely list skills. Apply them throughout planning, implementation, testing, and review.

Create `docs/SKILL_USAGE.md` documenting:
- Skills discovered.
- Skills selected.
- Why each skill is relevant.
- Where each skill was applied.

---

## 3. TECHNOLOGY STACK

Use the following technology stack:

### Frontend
- HTML5
- CSS3
- Vanilla JavaScript (ES6+)
- JavaScript ES Modules
- Chart.js for charts
- Lucide Icons
- Google Fonts if necessary

### Backend / Database
- Supabase
- PostgreSQL
- Supabase JavaScript Client
- Supabase Authentication
- Supabase Row Level Security (RLS)

### Deployment
- GitHub
- GitHub Pages
- GitHub Actions if needed

### Technical constraints

- The application must run as a static website.
- Do not require Node.js or a backend server in production.
- Do not use PHP, Python, Java, or Express as a backend.
- Do not use LocalStorage as the primary database.
- LocalStorage may only be used for harmless preferences, such as theme selection.
- All financial data must persist in Supabase.
- Prefer Vanilla JavaScript instead of introducing a framework without a strong technical reason.
- Avoid unnecessary dependencies.

---

## 4. PRODUCT REQUIREMENTS

Build a Personal Finance Management application with the following modules.

### 4.1. Authentication

Implement:

- User registration.
- Email and password login.
- Logout.
- Password reset.
- Session persistence.
- Authentication state management.
- Protected application views.

Each user must have an independent financial data space.

Users must never be able to access another user's transactions, budgets, or financial information.

### 4.2. Dashboard

Create a financial overview dashboard displaying:

- Total income.
- Total expenses.
- Current balance.
- Monthly savings.
- Income versus expenses.
- Expense distribution by category.
- Recent transactions.
- Monthly financial trends.

Provide date filters:

- Today.
- This week.
- This month.
- Last month.
- This year.
- Custom date range.

Dashboard statistics must be calculated using actual Supabase data.

### 4.3. Transaction Management

Implement complete CRUD functionality:

- Create transaction.
- View transaction.
- Edit transaction.
- Delete transaction.
- Search transactions.
- Filter transactions.
- Sort transactions.
- Paginate transaction lists.

Each transaction should contain:

- Transaction ID.
- User ID.
- Transaction type: INCOME / EXPENSE.
- Amount.
- Category.
- Description.
- Transaction date.
- Payment method.
- Created timestamp.
- Updated timestamp.

Support Vietnamese currency formatting (VND).

Use proper numeric handling. Never use floating-point arithmetic for financial calculations when exact decimal or integer arithmetic is appropriate.

### 4.4. Category Management

Provide default categories.

**Income:**
- Salary.
- Bonus.
- Business.
- Investment.
- Other income.

**Expenses:**
- Food and drinks.
- Transportation.
- Shopping.
- Entertainment.
- Education.
- Healthcare.
- Housing.
- Bills.
- Personal expenses.
- Other expenses.

Allow users to:

- Create categories.
- Edit categories.
- Delete categories.
- Choose category colors.
- Assign icons.
- Separate income and expense categories.

Prevent deletion of categories that are still referenced by transactions unless a safe reassignment strategy is implemented.

### 4.5. Budget Management

Allow users to:

- Set monthly budgets.
- Set budgets for individual categories.
- Track spending against budgets.
- Display remaining budget.
- Show percentage of budget consumed.
- Warn users when spending reaches 80%.
- Warn users when spending exceeds 100%.

### 4.6. Financial Reports

Create a reporting section featuring:

- Monthly income reports.
- Monthly expense reports.
- Category expense breakdown.
- Income versus expense charts.
- Savings trends.
- Top spending categories.
- Transaction history.

Use Chart.js.

Charts must update according to selected date filters and database data.

### 4.7. User Settings

Include:

- Profile information.
- Display name.
- Email information.
- Currency settings.
- Theme selection (Light / Dark).
- Account logout.

Default currency: VND.

Default language: Vietnamese.

---

## 5. UI/UX DESIGN REQUIREMENTS

Design a professional financial dashboard.

### Design direction

- Minimalist.
- Modern.
- Clean.
- Elegant.
- Financial dashboard aesthetic.
- Easy to understand.
- Suitable for daily use.

Avoid excessive gradients, unnecessary animations, excessive rounded cards, and decorative elements.

### Layout

Desktop:
- Sidebar navigation.
- Top navigation bar.
- Main dashboard content.
- Responsive data tables and charts.

Mobile:
- Mobile-first responsive layout.
- Collapsible navigation or bottom navigation.
- Touch-friendly buttons.
- Optimized transaction forms.
- Charts must fit small screens.

### Navigation

Include:

1. Dashboard.
2. Transactions.
3. Categories.
4. Budgets.
5. Reports.
6. Settings.

### UI requirements

- Consistent spacing system.
- Consistent typography.
- Reusable components.
- Clear visual hierarchy.
- Loading states.
- Empty states.
- Error states.
- Success notifications.
- Confirmation dialogs before destructive actions.
- Form validation feedback.

The interface must look like a real financial product, not a generic AI-generated admin template.

---

## 6. DATABASE ARCHITECTURE

Design the PostgreSQL database in Supabase.

Create appropriate tables, constraints, indexes, and relationships.

Suggested tables:

### profiles
- id (UUID, references auth.users)
- display_name
- created_at
- updated_at

### categories
- id (UUID)
- user_id
- name
- type
- icon
- color
- is_default
- created_at

### transactions
- id (UUID)
- user_id
- category_id
- type
- amount
- description
- payment_method
- transaction_date
- created_at
- updated_at

### budgets
- id (UUID)
- user_id
- category_id (nullable for overall budget)
- amount
- month
- year
- created_at
- updated_at

You may modify this schema if your architectural analysis identifies a better solution.

### Database requirements

- Use UUID primary keys.
- Define foreign keys.
- Define appropriate NOT NULL constraints.
- Add CHECK constraints for transaction types and positive amounts.
- Add indexes for frequently queried columns.
- Prevent duplicate monthly budgets where appropriate.
- Use timestamps consistently.
- Use appropriate ON DELETE behavior.
- Ensure data integrity.

### Row Level Security

RLS is mandatory.

Enable RLS on every user-owned table.

Policies must ensure:

- SELECT: users can only read their own data.
- INSERT: users can only create records associated with their own user ID.
- UPDATE: users can only modify their own records.
- DELETE: users can only delete their own records.

Validate ownership using `auth.uid()`.

Do not rely solely on frontend authorization.

Create SQL files:

- `supabase/schema.sql`
- `supabase/policies.sql`
- `supabase/seed.sql`

Include instructions for setting up the database through the Supabase SQL Editor.

---

## 7. SECURITY REQUIREMENTS

Security is a critical requirement.

- Never expose the Supabase service_role key.
- Never put secret keys in frontend JavaScript.
- Only use the Supabase publishable key or legacy anon key intended for public clients.
- Enforce RLS for all user-owned data.
- Validate all user inputs.
- Prevent unauthorized database operations.
- Handle expired sessions.
- Sanitize user-generated content before rendering HTML.
- Avoid unsafe innerHTML usage with untrusted input.
- Handle authentication errors safely.
- Do not expose sensitive database errors to end users.

Remember:

GitHub Pages is a public static hosting environment. Frontend configuration is visible to everyone. Security must be enforced by Supabase, not by hiding frontend code.

---

## 8. PROJECT STRUCTURE

Organize the project using a maintainable structure.

Suggested structure:

```text
personal-finance-app/
│
├── index.html
├── README.md
├── .gitignore
│
├── assets/
│   ├── css/
│   │   ├── main.css
│   │   ├── variables.css
│   │   ├── components.css
│   │   └── responsive.css
│   │
│   ├── js/
│   │   ├── app.js
│   │   ├── config.js
│   │   ├── supabase.js
│   │   ├── auth.js
│   │   ├── dashboard.js
│   │   ├── transactions.js
│   │   ├── categories.js
│   │   ├── budgets.js
│   │   ├── reports.js
│   │   ├── settings.js
│   │   ├── utils.js
│   │   └── components/
│   │
│   └── images/
│
├── supabase/
│   ├── schema.sql
│   ├── policies.sql
│   └── seed.sql
│
├── docs/
│   ├── REQUIREMENTS.md
│   ├── ARCHITECTURE.md
│   ├── DATABASE_DESIGN.md
│   ├── SECURITY.md
│   ├── TESTING.md
│   └── SKILL_USAGE.md
│
└── .github/
    └── workflows/
        └── deploy.yml
```

You may adjust this structure when necessary, but maintain separation of concerns.

---

## 9. GITHUB PAGES DEPLOYMENT

The final application must work on GitHub Pages.

Requirements:

- Configure GitHub Pages deployment.
- Ensure relative paths work under a GitHub repository subpath.
- Avoid root-relative asset paths that break under repository subpaths.
- Ensure JavaScript modules load correctly.
- Configure GitHub Actions if required.
- Avoid backend-dependent routing.
- Provide deployment instructions.

The application must work after deployment at:

`https://USERNAME.github.io/REPOSITORY/`

Do not assume a custom domain.

---

## 10. ERROR HANDLING & PERFORMANCE

Implement:

- Centralized error handling.
- Loading indicators.
- Database request error handling.
- Authentication error handling.
- Form validation.
- Empty-state handling.
- Duplicate submission prevention.
- Pagination for large transaction histories.
- Efficient database queries.
- Proper async/await usage.
- Event listener cleanup where appropriate.

Do not fetch the entire transaction history unnecessarily.

Avoid duplicated code and unnecessary database requests.

---

## 11. TESTING & QUALITY ASSURANCE

Before declaring the project complete, test:

### Authentication
- Registration.
- Login.
- Logout.
- Session persistence.
- Password reset.

### Transactions
- Create income.
- Create expense.
- Edit transaction.
- Delete transaction.
- Search and filtering.
- Invalid amount validation.

### Database
- Data persistence after refresh.
- Foreign key constraints.
- RLS isolation between two different accounts.
- Unauthorized database access.

### Dashboard
- Correct income calculation.
- Correct expense calculation.
- Correct balance calculation.
- Correct monthly filtering.
- Correct chart data.

### Budgets
- Budget creation.
- Budget updates.
- Spending calculations.
- Budget warning thresholds.

### Deployment
- GitHub Pages loading.
- Asset paths.
- JavaScript module loading.
- Supabase connectivity.
- Mobile responsiveness.

Do not claim a test passed unless it was actually executed.

Document testing results in `docs/TESTING.md`.

---

## 12. DEVELOPMENT WORKFLOW

Do not immediately generate the entire application in one uncontrolled operation.

Follow these phases:

### Phase 1: Discovery & Planning
- Inspect the project.
- Discover Agent Skills.
- Analyze requirements.
- Identify technical constraints.
- Define architecture.
- Identify potential risks.
- Create an implementation plan.

Deliver:
- `docs/REQUIREMENTS.md`
- `docs/ARCHITECTURE.md`
- `docs/SKILL_USAGE.md`

### Phase 2: Database Design
- Design ERD.
- Define PostgreSQL schema.
- Create SQL scripts.
- Implement RLS policies.
- Review database security.

Deliver:
- `docs/DATABASE_DESIGN.md`
- SQL files.

### Phase 3: Frontend Foundation
- Create project structure.
- Build layout.
- Implement navigation.
- Establish design system.
- Implement responsive behavior.

### Phase 4: Supabase Integration
- Configure Supabase client.
- Implement authentication.
- Connect database.
- Implement CRUD operations.
- Verify RLS behavior.

### Phase 5: Business Features
- Dashboard.
- Transactions.
- Categories.
- Budgets.
- Reports.
- Settings.

### Phase 6: Testing & Refinement
- Test functionality.
- Test security.
- Fix bugs.
- Optimize performance.
- Review UI/UX.

### Phase 7: Deployment
- Configure GitHub Pages.
- Deploy the application.
- Verify production behavior.
- Write deployment documentation.

---

## 13. IMPORTANT WORKING RULES

1. Think before coding.
2. Read relevant skills before implementation.
3. Follow the approved architecture.
4. Implement real functionality, not placeholder buttons.
5. Do not fabricate database data in production.
6. Do not hardcode financial statistics.
7. Do not use LocalStorage as a replacement for Supabase.
8. Do not ignore RLS.
9. Do not expose secret credentials.
10. Do not create unnecessary abstractions.
11. Keep the code readable and maintainable.
12. Test every major feature.
13. Fix errors before moving to the next phase.
14. Update documentation when architecture changes.
15. Do not silently skip requirements.
16. If something is technically impossible under GitHub Pages, explain the limitation and propose an appropriate solution.

### Configuration

Create a clear configuration file.

Use placeholders for:

- SUPABASE_URL
- SUPABASE_PUBLISHABLE_KEY

Provide clear instructions explaining where users should obtain these values from their Supabase project.

Never request or store the service_role key in frontend files.

---

## 14. DEFINITION OF DONE

The project is complete only when:

- Users can register and log in.
- Users can manage income and expenses.
- Users can manage categories.
- Users can create and track budgets.
- Dashboard statistics are based on actual database records.
- Reports and charts work correctly.
- Data persists after refreshing the page.
- Different users cannot access each other's financial data.
- RLS policies are verified.
- The application works on desktop and mobile.
- The application is deployed and accessible through GitHub Pages.
- Setup and deployment documentation is complete.
- No critical functionality is left as a placeholder.

---

## 15. FINAL INSTRUCTION

Start with Phase 1.

First inspect the project environment and all available Agent Skills.

Then present:

1. Skills discovered and selected.
2. Requirement analysis.
3. Proposed architecture.
4. Database design overview.
5. Project structure.
6. Implementation roadmap.
7. Security considerations.
8. Potential technical risks.

Do not start implementation until the planning phase has been completed and the architecture is clearly established.

After planning, proceed phase by phase, maintaining a working application throughout development.

Your ultimate goal is to deliver a production-minded, secure, maintainable, responsive Personal Finance Management application that runs on GitHub Pages and uses Supabase as its persistent backend.