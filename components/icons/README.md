# Geist Icons Library

A comprehensive collection of clean, minimal SVG icons following the Geist design system aesthetic.

## Installation

The icons are already included in your project at `/components/icons`.

## Usage

Import icons from the index file:

```typescript
import { User, Settings, Home, Menu } from '@/components/icons';

// Use in your component
function MyComponent() {
  return (
    <div>
      <User size={24} color="currentColor" />
      <Settings size={20} color="#666" strokeWidth={2} />
    </div>
  );
}
```

## Props

All icons accept the following props:

- `className?: string` - CSS class name
- `size?: number` - Width and height (default: 24)
- `color?: string` - Stroke color (default: "currentColor")
- `strokeWidth?: number` - Stroke width (default: 1.5)

## Available Icons

### Navigation & UI
User, LogOut, Menu, X, Home, Settings, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Search

### Actions
Plus, Minus, Check, Edit, Trash, Upload, Download, Copy, Cut, Paste

### Status & Alerts
AlertCircle, Info, Eye, EyeOff, CheckCircle, CheckCircle2, Loader2

### Time & Calendar
Clock, Calendar

### Communication
Mail, Phone, MessageSquare, MessageCircle, Send, Bell, Inbox

### Location
MapPin

### Social & Engagement
Heart, Star, Share

### E-commerce & Business
Package, ShoppingCart, DollarSign, Store

### Analytics & Charts
TrendingUp, BarChart, PieChart, Activity

### Achievements & Goals
Award, Target, Zap

### Security
Shield, Lock, Unlock, Key

### Users & People
User, Users, UserPlus, UserMinus, UserCheck

### Files & Documents
File, FileText, Folder, Image, Video, Music, Archive, Clipboard

### Links
ExternalLink, Link, Unlink

### View Controls
Filter, SortAsc, SortDesc, RefreshCw, RotateCw, Maximize, Minimize, ZoomIn, ZoomOut

### Layout
Grid, List, Columns, Layers

### Shapes
Square, Circle, Triangle

## Examples

```typescript
// Basic usage
<Home />

// Custom size
<User size={32} />

// Custom color
<Heart color="#ff0000" />

// Custom stroke width
<Settings strokeWidth={2} />

// With Tailwind classes
<Menu className="text-blue-500 hover:text-blue-700" size={20} />

// Combining props
<Search
  className="search-icon"
  size={18}
  color="#333"
  strokeWidth={1.5}
/>
```

## Icon Format

All icons are:
- 24x24 viewBox by default
- Scalable SVG format
- Stroke-based (not filled)
- Rounded line caps and joins
- Minimal and clean design
- Following Geist design principles

## TypeScript Support

Full TypeScript support with the `IconProps` interface:

```typescript
import type { IconProps } from '@/components/icons';

function CustomIcon({ className, size = 24, color = "currentColor", strokeWidth = 1.5 }: IconProps) {
  // Your custom icon implementation
}
```
