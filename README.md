# Restaurant Portal - Ultra-Premium Management System

An ultra-premium restaurant management portal built with Next.js 15, featuring a brutalist minimalist design inspired by Next.js and Vercel websites.

## Features

### Authentication

- Beautiful centered login page with gradient mesh background
- Smooth animations and error states
- Minimal, distraction-free design

### Dashboard

- Restaurant selection interface
- Quick stats overview (orders today, revenue)
- Elegant card-based layout with hover effects
- Add new restaurant functionality

### Restaurant Management

#### Menu Management

- Grid-based menu item display
- Search functionality
- Real-time availability toggle
- Complete nutritional information display
- Quick edit and delete actions
- Beautiful card hover effects

#### Order Management

- Real-time order feed with status badges
- Filter by order status (All, Pending, Preparing, Ready)
- Detailed order cards with customer info
- Action buttons for status updates
- Accept/Reject pending orders
- Mark orders as ready for pickup

#### Analytics Dashboard

- Key metrics cards with trend indicators
- Revenue overview chart
- Popular items ranking
- Recent activity feed
- Time range filters (Today, Week, Month)

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui (heavily customized)
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Theme**: next-themes (dark mode primary)

## Design Philosophy

- **Brutalist Minimalism**: Maximum whitespace, intentional pixels
- **Typography-First**: Clear hierarchy with large, bold headings
- **Subtle Animations**: 200-300ms transitions everywhere
- **Generous Spacing**: p-8, p-12, p-16 throughout
- **Dark Mode Primary**: Pure blacks (#000), soft grays (#171717, #262626)
- **Micro-interactions**: Hover states, scale effects, smooth transitions

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Run the development server:

```bash
npm run dev
```

3. Open [http://localhost:45001](http://localhost:45001)

## Project Structure

```
app/
├── login/              # Authentication page
├── dashboard/          # Restaurant selection
├── restaurant/[id]/    # Restaurant management
│   ├── layout.tsx      # Main layout with tabs
│   ├── menu/           # Menu management
│   ├── orders/         # Order management
│   └── analytics/      # Analytics dashboard
├── globals.css         # Design system & utilities
└── layout.tsx          # Root layout with theme

components/
├── ui/                 # shadcn/ui components
│   ├── button.tsx
│   ├── card.tsx
│   ├── input.tsx
│   └── tabs.tsx
└── theme-provider.tsx  # Dark mode provider

lib/
└── utils.ts            # Utility functions

middleware.ts           # Auth protection
```

## API Integration

The app is ready to integrate with the backend API at `http://localhost:45000/v1`:

- Base URL: Configure in environment variables
- Authentication: JWT stored in httpOnly cookie
- Protected routes: Middleware checks auth
- Error handling: Toast notifications
- Loading states: Skeleton UI

## Design System

### Colors

- Dark mode: `#000` (background), `#171717`, `#262626` (grays)
- Light mode: Clean whites, soft grays
- Accent: Refined gradients (primary)
- Status: Green (#10b981), Amber (#f59e0b), Red (#ef4444)

### Typography

- Headings: text-4xl to text-6xl, font-bold
- Body: text-base, line-height 1.7
- Code/Numbers: Monospace (Geist Mono)

### Spacing

- Content max-width: 1400px
- Generous padding: p-8, p-12, p-16
- Large gaps between sections

### Animations

- Page transitions: fade-in, slide-in
- Hover: scale-[1.02], shadow-xl
- Active: active:scale-95
- Duration: 200-300ms

## Performance

- Server Components by default
- Client Components only when needed
- Route prefetching with next/link
- Image optimization ready (next/image)
- Fast page transitions (<200ms)
- Turbopack for faster builds

## Next Steps

1. Connect to backend API (../api folder)
2. Implement real-time order updates
3. Add form validation with Zod
4. Implement image upload for menu items
5. Add authentication with JWT
6. Deploy to production

## Production Checklist

- [ ] Environment variables configured
- [ ] API endpoints connected
- [ ] Authentication flow complete
- [ ] Image upload working
- [ ] Error tracking setup (Sentry)
- [ ] Analytics configured
- [ ] SEO metadata optimized
- [ ] Performance monitoring active

## License

Private - Cuts.ae Restaurant Portal
