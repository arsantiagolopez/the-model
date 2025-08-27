# Starter Application

A comprehensive full-stack React application starter template built with modern technologies and best practices.

## Tech Stack Overview

### Core Framework
- **React Router v7** - Modern full-stack React framework with SSR
- **React 19** - Latest React with concurrent features
- **TypeScript** - Type-safe development environment
- **Vite** - Fast build tool and development server

### Authentication & Authorization
- **Clerk** - Complete authentication solution with:
  - Social logins, email/password, and passwordless auth
  - User management and session handling
  - Theme integration with custom provider

### UI & Styling
- **Tailwind CSS v4** - Utility-first CSS framework
- **Radix UI** - Comprehensive primitive component library:
  - 30+ accessible, unstyled UI primitives
  - Dialog, Dropdown, Navigation, Form controls, and more
- **shadcn/ui** - Beautiful component system built on Radix UI
- **Lucide React** - Modern icon library (500+ icons)
- **next-themes** - Advanced theme switching with system preference detection

### Form Handling & Validation
- **React Hook Form** - Performant forms with minimal re-renders
- **Zod** - TypeScript-first schema validation
- **@hookform/resolvers** - Zod integration for forms

### Data Visualization & UI Components
- **Recharts** - Composable charting library
- **date-fns** - Modern date utility library
- **Embla Carousel** - Flexible carousel component
- **Sonner** - Toast notifications
- **cmdk** - Command palette component

### Development & Build Tools
- **Vite** - Lightning-fast build tool with HMR
- **TypeScript** - Static type checking
- **Tailwind CSS with Vite plugin** - Optimized CSS processing with v4 features
- **vite-tsconfig-paths** - Path mapping support
- **tw-animate-css** - Enhanced animation utilities

## Architecture & Features

### Server-Side Rendering (SSR)
- Full SSR support enabled by default (`ssr: true`)
- Automatic code splitting and optimizations
- SEO-friendly with proper meta tags and links

### File-Based Routing
- Type-safe routing with React Router v7
- Automatic route generation
- Nested layouts and error boundaries
- Special handling for auth callbacks (`login/*`, `register/*`)

### Authentication Flow
- Integrated Clerk authentication with SSR support
- Custom theme provider for consistent styling
- Automatic user session management
- Protected routes and auth state handling

### Component Architecture
- **Atomic Design** - Well-organized component structure
- **UI Components** - 30+ pre-built components in `app/components/ui/`
- **Custom Hooks** - Mobile detection, mounting state, and utilities
- **Theme System** - Dark/light/system theme switching

### Styling System
- **Modular CSS Architecture** - Organized into separate files (`base.css`, `colors.css`, `fonts.css`)
- **OKLCH Color System** - Modern perceptual color space for better accessibility
- **CSS Variables** - Comprehensive design tokens with light/dark theme support
- **Advanced Theme System** - Complete color palette with chart, sidebar, and component variants
- **Tailwind CSS v4** - Latest version with `@theme` directive and CSS imports
- **Component Variants** - Type-safe component styling with `class-variance-authority`
- **Animation Library** - `tw-animate-css` for enhanced animations

### Type Safety
- **End-to-end TypeScript** - Fully typed application
- **Route Types** - Automatic type generation for routes
- **Component Props** - Strongly typed component interfaces
- **Form Validation** - Runtime and compile-time validation

## Getting Started

### Installation

Install the dependencies:

```bash
npm install
```

### Development

Start the development server with HMR:

```bash
npm run dev
```

Your application will be available at `http://localhost:5173`.

### Type Checking

Run TypeScript type checking:

```bash
npm run typecheck
```

## Project Structure

```
starter/
├── app/                          # Application source code
│   ├── components/               # Reusable components
│   │   ├── ui/                   # shadcn/ui components (30+ components)
│   │   └── theme-switch.tsx      # Theme switching component
│   ├── hooks/                    # Custom React hooks
│   │   └── use-mobile.ts         # Mobile detection hook
│   ├── lib/                      # Utility libraries
│   │   ├── hooks/                # Additional hooks
│   │   └── utils/                # Helper functions
│   ├── providers/                # React context providers
│   │   └── clerk-theme-provider.tsx  # Clerk theme integration
│   ├── routes/                   # Route components
│   │   ├── home.tsx              # Home page
│   │   ├── login.tsx             # Authentication login
│   │   ├── register.tsx          # User registration
│   │   └── resources/            # Resource routes
│   ├── styles/                   # Modular CSS architecture
│   │   ├── index.css             # Main stylesheet with imports
│   │   ├── base.css              # Base styles and Tailwind imports
│   │   ├── colors.css            # OKLCH color system and theme variables
│   │   └── fonts.css             # Typography and font definitions
│   ├── root.tsx                  # Root component with providers
│   └── routes.ts                 # Route configuration
├── public/                       # Static assets
├── components.json               # shadcn/ui configuration
├── react-router.config.ts        # React Router configuration
├── vite.config.ts               # Vite configuration
├── tsconfig.json                # TypeScript configuration
└── Dockerfile                   # Container configuration
```

## Building for Production

Create a production build:

```bash
npm run build
```

This generates:
- `build/client/` - Static assets and client-side code
- `build/server/` - Server-side rendering code

## Deployment Options

### Docker Deployment

The application includes a production-ready Dockerfile:

```bash
docker build -t starter-app .
docker run -p 3000:3000 starter-app
```

Compatible with all major container platforms:
- AWS ECS/Fargate
- Google Cloud Run
- Azure Container Apps  
- Digital Ocean App Platform
- Fly.io
- Railway

### Traditional Node.js Deployment

The built-in server is production-ready. Deploy the build output:

```bash
npm run build
npm start
```

### Environment Variables

Configure these environment variables for production:

```bash
# Clerk Authentication
CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...

# Optional: Custom domains
CLERK_SIGN_IN_URL=/login
CLERK_SIGN_UP_URL=/register
```

## Development Features

### Hot Module Replacement (HMR)
- Instant updates during development
- Preserves component state
- CSS updates without page refresh

### Developer Experience
- TypeScript IntelliSense and error checking
- Automatic route type generation
- Component prop validation
- Build-time optimizations

### Code Organization
- Path aliases configured (`~/components`, `~/lib`, etc.)
- Consistent file naming conventions
- Separation of concerns (components, hooks, utilities)
- Modular architecture for scalability

## Extending the Starter

### Adding New Routes
1. Create route file in `app/routes/`
2. Add route to `app/routes.ts`
3. Types are automatically generated

### Adding Components
1. Create component in appropriate directory
2. Export from `app/components/ui/` for UI components
3. Use existing patterns and conventions

### Customizing Themes
- **Color System**: Modify OKLCH values in `app/styles/colors.css`
- **Typography**: Update font settings in `app/styles/fonts.css`
- **Base Styles**: Adjust global styles in `app/styles/base.css`
- **Component Theme**: Update `components.json` for shadcn/ui configuration
- **Clerk Integration**: Customize authentication UI in `clerk-theme-provider.tsx`

### Database Integration
- Add your preferred database (Prisma, Drizzle, etc.)
- Configure in `react-router.config.ts`
- Add loaders/actions for data fetching

---

Built with modern React ecosystem best practices for scalable, production-ready applications.
