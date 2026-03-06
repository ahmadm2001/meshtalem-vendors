'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LayoutDashboard, Package, PlusCircle, ShoppingBag, User, LogOut, Store } from 'lucide-react';
import { useAuthStore } from '@/store';

const navItems = [
  { href: '/dashboard',   icon: LayoutDashboard, label: 'لوحة التحكم' },
  { href: '/products',    icon: Package,         label: 'منتجاتي' },
  { href: '/products/new',icon: PlusCircle,      label: 'إضافة منتج' },
  { href: '/orders',      icon: ShoppingBag,     label: 'الطلبات' },
  { href: '/profile',     icon: User,            label: 'الملف الشخصي' },
];

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) router.replace('/auth/login');
  }, [isAuthenticated]);

  if (!isAuthenticated) return null;

  const isPending = user?.vendorStatus === 'pending';

  return (
    <div className="min-h-screen bg-gray-50 flex" dir="rtl">
      {/* Sidebar */}
      <aside className="w-60 bg-gray-900 text-white flex flex-col shrink-0 fixed h-full">
        <div className="p-5 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-primary-400" />
            <div>
              <p className="font-bold text-white">مشتالم</p>
              <p className="text-xs text-gray-400">بوابة الموردين</p>
            </div>
          </div>
        </div>

        {/* User info */}
        <div className="px-4 py-3 border-b border-gray-700 bg-gray-800">
          <p className="text-sm font-medium text-white truncate">{user?.fullName}</p>
          <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          {isPending && (
            <span className="mt-1 inline-block badge-pending text-xs">في انتظار الموافقة</span>
          )}
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active ? 'bg-primary-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}>
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-gray-700">
          <button onClick={logout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-gray-800 w-full transition-colors">
            <LogOut className="w-4 h-4" />
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 mr-60 p-6 overflow-auto">
        {isPending && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <div className="text-yellow-600 mt-0.5">⏳</div>
            <div>
              <p className="font-semibold text-yellow-800 text-sm">حسابك قيد المراجعة</p>
              <p className="text-yellow-700 text-xs mt-0.5">سيتم مراجعة حسابك من قِبل الإدارة. ستتمكن من إضافة المنتجات بعد الموافقة.</p>
            </div>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
