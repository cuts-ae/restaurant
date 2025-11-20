/**
 * Geist Icons - Usage Examples
 *
 * This file demonstrates various ways to use the icon components
 */

import {
  User,
  Settings,
  Home,
  Menu,
  Search,
  Bell,
  Heart,
  ShoppingCart,
  TrendingUp,
  ChevronRight,
  type IconProps
} from './index';

// Example 1: Basic Usage
export function BasicIconExample() {
  return (
    <div className="flex gap-4">
      <User />
      <Settings />
      <Home />
    </div>
  );
}

// Example 2: Custom Sizes
export function CustomSizeExample() {
  return (
    <div className="flex gap-4 items-center">
      <User size={16} />
      <User size={24} />
      <User size={32} />
      <User size={48} />
    </div>
  );
}

// Example 3: Custom Colors
export function CustomColorExample() {
  return (
    <div className="flex gap-4">
      <Heart color="#ff0000" />
      <Heart color="#00ff00" />
      <Heart color="#0000ff" />
    </div>
  );
}

// Example 4: With Tailwind Classes
export function TailwindExample() {
  return (
    <div className="flex gap-4">
      <User className="text-blue-500 hover:text-blue-700" />
      <Settings className="text-gray-600 hover:text-gray-900" />
      <Bell className="text-red-500 hover:text-red-700" />
    </div>
  );
}

// Example 5: Custom Stroke Width
export function StrokeWidthExample() {
  return (
    <div className="flex gap-4">
      <User strokeWidth={1} />
      <User strokeWidth={1.5} />
      <User strokeWidth={2} />
      <User strokeWidth={3} />
    </div>
  );
}

// Example 6: All Props Combined
export function CombinedPropsExample() {
  return (
    <ShoppingCart
      className="text-indigo-600 hover:text-indigo-800 cursor-pointer"
      size={28}
      strokeWidth={2}
    />
  );
}

// Example 7: In a Navigation Menu
export function NavigationExample() {
  const navItems = [
    { icon: Home, label: 'Home', href: '/' },
    { icon: ShoppingCart, label: 'Cart', href: '/cart' },
    { icon: User, label: 'Profile', href: '/profile' },
    { icon: Settings, label: 'Settings', href: '/settings' },
  ];

  return (
    <nav className="flex gap-6">
      {navItems.map((item) => (
        <a
          key={item.label}
          href={item.href}
          className="flex items-center gap-2 hover:text-blue-600"
        >
          <item.icon size={20} />
          <span>{item.label}</span>
        </a>
      ))}
    </nav>
  );
}

// Example 8: In a Dashboard Card
export function DashboardCardExample() {
  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Revenue</h3>
        <TrendingUp className="text-green-500" size={24} />
      </div>
      <p className="text-3xl font-bold">$12,450</p>
      <p className="text-sm text-gray-500 flex items-center gap-1 mt-2">
        <ChevronRight size={16} />
        +12% from last month
      </p>
    </div>
  );
}

// Example 9: Icon Button Component
export function IconButton({
  icon: Icon,
  onClick,
  label
}: {
  icon: React.ComponentType<IconProps>;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
      aria-label={label}
    >
      <Icon size={20} />
    </button>
  );
}

// Example 10: Search Bar with Icon
export function SearchBarExample() {
  return (
    <div className="relative">
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        size={20}
      />
      <input
        type="text"
        placeholder="Search..."
        className="pl-10 pr-4 py-2 border rounded-lg w-full"
      />
    </div>
  );
}

// Example 11: Notification Badge
export function NotificationBadgeExample() {
  const unreadCount = 5;

  return (
    <div className="relative inline-block">
      <Bell size={24} className="text-gray-700" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
          {unreadCount}
        </span>
      )}
    </div>
  );
}

// Example 12: Loading State
export function LoadingStateExample() {
  return (
    <button className="px-4 py-2 bg-blue-500 text-white rounded-lg flex items-center gap-2">
      <Settings className="animate-spin" size={16} />
      Processing...
    </button>
  );
}
