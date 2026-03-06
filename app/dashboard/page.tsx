'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Package, ShoppingBag, TrendingUp, Clock, PlusCircle, AlertCircle } from 'lucide-react';
import { ordersApi, productsApi } from '@/lib/api';
import VendorLayout from '@/components/layout/VendorLayout';

export default function VendorDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [pendingProducts, setPendingProducts] = useState<any[]>([]);

  useEffect(() => {
    ordersApi.getStats().then((r) => setStats(r.data)).catch(() => {});
    ordersApi.getMyOrders({ limit: 5 }).then((r) => setRecentOrders(r.data?.orders || r.data || [])).catch(() => {});
    productsApi.getMyProducts({ status: 'pending', limit: 3 }).then((r) => setPendingProducts(r.data?.products || r.data || [])).catch(() => {});
  }, []);

  const cards = [
    { label: 'إجمالي المبيعات', value: stats ? `₪${Number(stats.totalRevenue || 0).toFixed(0)}` : '...', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'الطلبات الكلية', value: stats?.totalOrders ?? '...', icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'منتجات نشطة', value: stats?.activeProducts ?? '...', icon: Package, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'طلبات معلقة', value: stats?.pendingOrders ?? '...', icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  const statusMap: Record<string, { label: string; cls: string }> = {
    pending:    { label: 'معلق',    cls: 'badge-pending' },
    confirmed:  { label: 'مؤكد',   cls: 'badge-approved' },
    processing: { label: 'قيد التنفيذ', cls: 'bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full' },
    shipped:    { label: 'تم الشحن', cls: 'bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded-full' },
    delivered:  { label: 'تم التسليم', cls: 'badge-approved' },
    cancelled:  { label: 'ملغي',   cls: 'badge-rejected' },
  };

  return (
    <VendorLayout>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">لوحة التحكم</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {cards.map((c) => (
          <div key={c.label} className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">{c.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{c.value}</p>
              </div>
              <div className={`${c.bg} p-3 rounded-xl`}>
                <c.icon className={`w-5 h-5 ${c.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900 text-sm">آخر الطلبات</h2>
            <Link href="/orders" className="text-xs text-primary-600 hover:underline">عرض الكل</Link>
          </div>
          {recentOrders.length === 0 ? (
            <div className="text-center py-6 text-gray-400 text-sm">لا توجد طلبات بعد</div>
          ) : (
            <div className="space-y-2">
              {recentOrders.map((order) => {
                const s = statusMap[order.status] || statusMap.pending;
                return (
                  <div key={order.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-800 text-sm">#{order.id.slice(0,8).toUpperCase()}</p>
                      <p className="text-xs text-gray-400">₪{Number(order.totalAmount || 0).toFixed(2)}</p>
                    </div>
                    <span className={s.cls}>{s.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pending Products */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-500" />
              منتجات قيد المراجعة
            </h2>
            <Link href="/products" className="text-xs text-primary-600 hover:underline">عرض الكل</Link>
          </div>
          {pendingProducts.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-400 text-sm mb-3">لا توجد منتجات معلقة</p>
              <Link href="/products/new" className="btn-primary text-sm flex items-center gap-2 justify-center w-fit mx-auto px-4">
                <PlusCircle className="w-4 h-4" />
                أضف منتجاً جديداً
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {pendingProducts.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-2 bg-yellow-50 rounded-lg border border-yellow-100">
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{p.nameAr}</p>
                    <p className="text-xs text-gray-400">₪{Number(p.price).toFixed(2)}</p>
                  </div>
                  <span className="badge-pending">قيد المراجعة</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </VendorLayout>
  );
}
