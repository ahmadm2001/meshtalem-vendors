'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PlusCircle, Edit, Trash2, Package, Search } from 'lucide-react';
import { productsApi } from '@/lib/api';
import VendorLayout from '@/components/layout/VendorLayout';
import toast from 'react-hot-toast';

const statusMap: Record<string, { label: string; cls: string }> = {
  pending:  { label: 'قيد المراجعة', cls: 'badge-pending' },
  approved: { label: 'منشور',        cls: 'badge-approved' },
  rejected: { label: 'مرفوض',        cls: 'badge-rejected' },
};

export default function VendorProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    productsApi.getMyProducts({ limit: 100 })
      .then((r) => setProducts(r.data?.products || r.data || []))
      .finally(() => setLoading(false));
  }, []);

  const deleteProduct = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;
    await productsApi.delete(id);
    setProducts((p) => p.filter((x) => x.id !== id));
    toast.success('تم حذف المنتج');
  };

  const filtered = products.filter((p) => {
    const matchSearch = (p.nameAr || '').toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || p.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <VendorLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">منتجاتي</h1>
        <Link href="/products/new" className="btn-primary flex items-center gap-2 text-sm">
          <PlusCircle className="w-4 h-4" />
          إضافة منتج
        </Link>
      </div>

      <div className="card mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث في المنتجات..." className="input-field pr-9" />
          </div>
          <div className="flex gap-2">
            {['all','pending','approved','rejected'].map((s) => (
              <button key={s} onClick={() => setFilter(s)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filter === s ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {{ all:'الكل', pending:'معلق', approved:'منشور', rejected:'مرفوض' }[s]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="card animate-pulse h-16" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12">
          <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 mb-4">لا توجد منتجات</p>
          <Link href="/products/new" className="btn-primary inline-flex items-center gap-2 text-sm">
            <PlusCircle className="w-4 h-4" />أضف أول منتج
          </Link>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-right px-4 py-3 text-gray-500 font-medium">اسم المنتج</th>
                <th className="text-right px-4 py-3 text-gray-500 font-medium">السعر</th>
                <th className="text-right px-4 py-3 text-gray-500 font-medium">المخزون</th>
                <th className="text-right px-4 py-3 text-gray-500 font-medium">الحالة</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const s = statusMap[p.status] || statusMap.pending;
                return (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{p.nameAr}</p>
                      {p.status === 'rejected' && p.rejectionReason && (
                        <p className="text-xs text-red-500 mt-0.5">سبب الرفض: {p.rejectionReason}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 font-bold text-primary-600">₪{Number(p.price).toFixed(2)}</td>
                    <td className="px-4 py-3 text-gray-600">{p.stock}</td>
                    <td className="px-4 py-3"><span className={s.cls}>{s.label}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Link href={`/products/${p.id}`} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button onClick={() => deleteProduct(p.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </VendorLayout>
  );
}
