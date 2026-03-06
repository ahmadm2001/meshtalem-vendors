'use client';
import { useEffect, useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import { ordersApi } from '@/lib/api';
import VendorLayout from '@/components/layout/VendorLayout';

const statusMap: Record<string, { label: string; cls: string }> = {
  pending:    { label: 'معلق',          cls: 'badge-pending' },
  confirmed:  { label: 'مؤكد',         cls: 'badge-approved' },
  processing: { label: 'قيد التنفيذ',  cls: 'bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full' },
  shipped:    { label: 'تم الشحن',     cls: 'bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded-full' },
  delivered:  { label: 'تم التسليم',   cls: 'badge-approved' },
  cancelled:  { label: 'ملغي',         cls: 'badge-rejected' },
};

export default function VendorOrdersPage() {
  // API returns OrderItem[] where each item has .order relation
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    ordersApi.getMyOrders()
      .then((r) => setItems(r.data || []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? items : items.filter((i) => i.order?.status === filter);

  return (
    <VendorLayout>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">الطلبات</h1>

      <div className="flex gap-2 mb-4 flex-wrap">
        {['all','pending','confirmed','processing','shipped','delivered','cancelled'].map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === s ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {{ all:'الكل', pending:'معلق', confirmed:'مؤكد', processing:'قيد التنفيذ', shipped:'مشحون', delivered:'مُسلَّم', cancelled:'ملغي' }[s]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="card animate-pulse h-20" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12"><ShoppingBag className="w-12 h-12 mx-auto mb-3 text-gray-300" /><p className="text-gray-500">لا توجد طلبات</p></div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const order = item.order || {};
            const s = statusMap[order.status] || statusMap.pending;
            return (
              <div key={item.id} className="card">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">طلب #{(item.orderId || item.id || '').slice(0,8).toUpperCase()}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString('ar-IL', { year:'numeric', month:'long', day:'numeric' }) : ''}
                    </p>
                  </div>
                  <span className={s.cls}>{s.label}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-600 mb-2">
                  <span>{item.productNameHe} ×{item.quantity}</span>
                  <span>₪{Number(item.lineTotal || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-500">{order.shippingCity || ''}</p>
                  <p className="font-bold text-primary-600 text-sm">₪{Number(item.lineTotal || 0).toFixed(2)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </VendorLayout>
  );
}
