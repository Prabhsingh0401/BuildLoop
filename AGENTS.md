# Agent Guidelines for BuildLoop

This file provides guidelines and instructions for agentic coding assistants working in this repository.

## Project Overview

BuildLoop is a monorepo with two main packages:
- **buildloop-frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **buildloop-backend**: Node.js + Express + MongoDB Atlas + Pinecone

## Build/Lint/Test Commands

### Root (run both services)
```bash
npm run dev              # Start both frontend + backend concurrently
```

### Frontend (buildloop-frontend/)
```bash
cd buildloop-frontend

# Development
npm run dev              # Start Vite dev server (port 5173)

# Production
npm run build            # Build for production
npm run preview          # Preview production build

# Linting
npm run lint             # Run ESLint on all files
```

### Backend (buildloop-backend/)
```bash
cd buildloop-backend

# Development
npm run dev              # Start server with nodemon (port 5000)

# Production
npm start                # Start server directly
```

### Running a Single Test
Currently, no test framework is configured. When adding tests:
```bash
# Vitest (recommended for frontend)
npm install -D vitest @testing-library/react
npm run test             # Run all tests
npm run test -- specific.test.js  # Run single test file

# Jest (alternative)
npm install -D jest
npx jest                 # Run all tests
npx jest specific.test.js  # Run single test file
```

## Code Style Guidelines

### General Principles
- Keep code concise and readable
- Follow existing patterns in each package
- Use TypeScript types for all function parameters and return values
- Handle errors gracefully with meaningful error messages

### Frontend Conventions

#### File Extensions
- React components: `.jsx`
- TypeScript files: `.ts`
- TypeScript React files: `.tsx`
- Config files: `.js` (ES modules with `export default`)

#### Component Structure
```jsx
// Named export for components used in imports
export function ComponentName({ prop1, prop2 }) {
  return (
    <div className="...">
      {/* JSX content */}
    </div>
  );
}

// Default export for page components
export default function PageName() {
  return <div>...</div>;
}
```

#### Tailwind CSS Usage
- Use utility classes for styling (no custom CSS unless necessary)
- Dark mode: Use `bg-black`, `text-white`, `opacity-XX` utilities
- Responsive: Use `md:`, `lg:` prefixes for larger screens
- Consistent spacing with Tailwind scale

#### Imports Order
1. React imports
2. External libraries (e.g., `react-router-dom`, `zustand`)
3. Internal components
4. Internal hooks/lib
5. Types
6. CSS/style imports

#### State Management
- Local state: `useState` hook
- Global state: Zustand store
- Server state: TanStack Query

### Backend Conventions

#### File Extensions
- JavaScript files: `.js` (CommonJS for now)
- TypeScript files: `.ts` (when migrating)

#### Module Style
Currently using CommonJS:
```javascript
const express = require('express');
const router = Router();

module.exports = router;
```

#### API Response Format
Always return consistent JSON structure:
```javascript
// Success
res.json({ success: true, data: {...} });

// Error
res.status(400).json({ success: false, message: 'Error description' });
```

#### Error Handling Pattern
```javascript
// In controllers
const controller = async (req, res, next) => {
  try {
    // logic
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// Global error handler (in index.js)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});
```

#### 404 Handler
```javascript
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});
```

## Naming Conventions

### Git Branches
```
feat/name-description    # New features
fix/name-description     # Bug fixes
chore/name-description  # Maintenance tasks
```

### Variables and Functions
- Use camelCase: `const userName`, `function fetchData()`
- Use PascalCase for React components: `UserProfile`, `FeedbackForm`
- Use SCREAMING_SNAKE_CASE for constants: `MAX_RETRIES`, `API_BASE_URL`
- Boolean variables: prefix with `is`, `has`, `should`: `isLoading`, `hasError`

### File Naming
- Components: `PascalCase.jsx` or `PascalCase.tsx`
- Hooks: `camelCase.ts` starting with `use`: `useAuth.ts`
- Utils: `camelCase.ts`: `formatDate.ts`
- Config: `kebab-case.js` or `camelCase.js`

## TypeScript Guidelines

### Type Definitions
```typescript
// Interface for objects
interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

// Type for union/utility types
type ApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
};

// Function types
type Handler = (req: Request, res: Response) => Promise<void>;
```

### TypeScript Config
- Strict mode enabled
- No implicit any
- Explicit return types for functions

## Environment Variables

### Backend (.env)
```env
PORT=5000
NODE_ENV=development
# Add other vars as needed: MONGODB_URI, PINEOCONE_API_KEY, etc.
```

### Frontend
- Use `.env.local` for client-side variables with `VITE_` prefix
- Never expose sensitive keys on frontend

## Git Workflow

### Commit Messages
```
feat: add user authentication
fix: resolve dashboard loading issue
chore: update dependencies
refactor: simplify feedback parser
```

### Pull Requests
- Keep PRs scoped to one feature
- Require 1 review before merge to `main`
- Include description of changes

## Adding New Features

### Frontend
1. Create component in appropriate `src/components/` subdirectory
2. Export from parent `index.js` if using barrel exports
3. Use existing UI components from `components/ui/`
4. Add Zustand store slice if global state needed

### Backend
1. Add route in `src/routes/`
2. Create controller in `src/controllers/`
3. Add service layer for complex logic in `src/services/`
4. Add model if MongoDB schema needed in `src/models/`

## Dependencies

### Frontend Key Dependencies
- React 19.2
- Tailwind CSS (styling)
- shadcn/ui (UI components)

### Backend Key Dependencies
- Express (web framework)
- Mongoose (MongoDB ODM)
- dotenv (environment config)
- cors (cross-origin)

## Common Tasks

### Adding a new API endpoint
1. Add route: `backend/src/routes/featureRoutes.js`
2. Create controller: `backend/src/controllers/featureController.js`
3. Implement logic or delegate to service
4. Update main routes: `backend/src/routes/index.js`

### Adding a new frontend page
1. Create page component: `frontend/src/pages/PageName.jsx`
2. Add route in router configuration
3. Add any required store slices

### Adding environment variables
1. Add to `.env.example` with default values
2. Document in this file
3. Access via `process.env.VAR_NAME` (backend) or `import.meta.env.VITE_VAR_NAME` (frontend)

## Notes

- The backend currently uses CommonJS; consider migrating to ES modules/TypeScript in future
- No test framework is configured yet; add one before shipping critical features
- Use Clerk for authentication integration

---

## UI Consistency Subagent

A specialized subagent should be assigned to enforce visual consistency across the frontend. Reference `DESIGN.md` for full glassmorphism guidelines.

### Design Philosophy
BuildLoop uses **modern glassmorphism** with dark backgrounds, frosted glass surfaces with backdrop-blur, semi-transparent overlays, and high contrast text.

### Primary Responsibilities

1. **Tailwind Config Validation** - Ensure `tailwind.config.js` includes all glassmorphism design tokens:
   - Base backgrounds: `base` (#0a0a0f), `base-2`, `base-3`
   - Brand/colors: `brand`, `success`, `warn`, `danger`
   - Fonts: `Plus Jakarta Sans` (sans), `JetBrains Mono` (mono)
   - Border radius: `card` (12px), `input` (8px), `pill` (9999px)
   - Shadows: `glow-brand`, `glow-success`

2. **Font Usage Enforcement**
   - No Inter, Roboto, or system-ui fonts
   - Use `font-semibold` (600) max — never `font-bold` (700)
   - JetBrains Mono for code, monospace elements only

3. **Glassmorphism Patterns**
   - Cards: `bg-white/10 backdrop-blur-md border border-white/20 rounded-card p-5`
   - Inputs: `bg-white/5 border border-white/20 rounded-input`
   - Buttons must include `backdrop-blur-sm` and `focus-visible:ring-2 focus-visible:ring-brand/50`
   - All buttons need `disabled:opacity-50 disabled:cursor-not-allowed`

4. **Color Usage Enforcement**
   - No raw hex values in JSX
   - Use glass utilities: `bg-white/10`, `bg-white/5`, `text-white`, `text-white/70`
   - Use brand/semantic: `text-brand`, `bg-success/20`, `text-emerald-400`
   - NO random AI gradients like `from-purple-500 to-pink-500`

5. **Icon Library** - Only Lucide React allowed

### Files to Monitor
- `tailwind.config.js` - Design tokens
- `src/index.css` - Font imports, dark background
- `src/components/ui/` - Reusable UI components
- `src/App.jsx` - Main layout
- Any new components in `src/components/`

### Violations to Flag
- Random AI-generated gradients (e.g., `bg-gradient-to-r from-purple-500`)
- Inline styles with hex colors
- Hardcoded pixel values (`style={{ padding: '20px' }}`)
- Low contrast combinations (text-white/20 on bg-white/10)
- Missing backdrop-blur on glass elements
- Missing focus rings with proper offset
- Wrong font families or weights
