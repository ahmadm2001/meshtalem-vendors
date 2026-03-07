'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PlusCircle, Edit, Trash2, Package, Search, Save, X, AlertCircle, Eye } from 'lucide-react';
import { productsApi } from '@/lib/api';
import VendorLayout from '@/components/layout/VendorLayout';
import toast from 'react-hot-toast';

const statusMap: Record<string, { label: string; cls: string }> = {
  pending:  { label: 'قيد المراجعة', cls: 'badge-pending' },
  approved: { label: 'منشور',        cls: 'badge-approved' },
  rejected: { label: 'مرفوض',        cls: 'badge-rejected' },
  draft:    { label: 'مسودة',        cls: 'bg-gray-100 text-gray-600 text-xs font-medium px-2.5 py-0.5 rounded-full' },
};

export default function VendorProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  // Inline stock edit
  const [editStockId, setEditStockId] = useState<string | null>(null);
  const [editStockVal, setEditStockVal] = useState('');

  // Full edit modal
  const [editProduct, setEditProduct] = useState<any | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [editSaving, setEditSaving] = useState(false);

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

  const saveStock = async (id: string) => {
    await productsApi.update(id, { stock: Number(editStockVal) });
    setProducts((p) => p.map((x) => x.id === id ? { ...x, stock: Number(editStockVal) } : x));
    setEditStockId(null);
    toast.success('تم تحديث المخزون');
  };

  const openEdit = (product: any) => {
    setEditProduct(product);
    setEditForm({
      nameAr: product.nameAr || '',
      descriptionAr: product.descriptionAr || '',
      price: product.price || '',
      stock: product.stock || '',
      images: (product.images || []).join('\n'),
    });
  };

  const saveEdit = async () => {
    if (!editProduct) return;
    setEditSaving(true);
    try {
      const payload = {
        ...editForm,
        price: Number(editForm.price),
        stock: Number(editForm.stock),
        images: editForm.images.split('\n').map((s: string) => s.trim()).filter(Boolean),
      };
      const r = await productsApi.update(editProduct.id, payload);
      setProducts((p) => p.map((x) => x.id === editProduct.id ? { ...x, ...r.data } : x));
      setEditProduct(null);
      toast.success('✅ تم تحديث المنتج وإرساله للمراجعة');
    } finally { setEditSaving(false); }
  };

  const filtered = products.filter((p) => {
    const matchSearch = (p.nameAr || '').toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || p.status === filter;
    return matchSearch && matchFilter;
  });

  const counts = {
    all: products.length,
    pending: products.filter((p) => p.status === 'pending').length,
    approved: products.filter((p) => p.status === 'approved').length,
    rejected: products.filter((p) => p.status === 'rejected').length,
  };

  return (
    <VendorLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">منتجاتي</h1>
        <Link href="/products/new" className="btn-primary flex items-center gap-2 text-sm">
          <PlusCircle className="w-4 h-4" />
          إضافة منتج
        </Link>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث في المنتجات..." className="input-field pr-9" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {(['all','pending','approved','rejected'] as const).map((s) => (
              <button key={s} onClick={() => setFilter(s)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${filter === s ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {{ all:'الكل', pending:'معلق', approved:'منشور', rejected:'مرفوض' }[s]}
                {counts[s] > 0 && (
                  <span className={`text-xs rounded-full px-1.5 py-0.5 ${filter === s ? 'bg-white/20' : 'bg-gray-200'}`}>
                    {counts[s]}
                  </span>
                )}
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
        <div className="space-y-3">
          {filtered.map((p) => {
            const s = statusMap[p.status] || statusMap.pending;
            return (
              <div key={p.id} className={`card ${p.status === 'rejected' ? 'border-red-200 bg-red-50/30' : ''}`}>
                <div className="flex items-start gap-4">
                  {/* Thumbnail */}
                  <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                    {p.images?.[0] ? (
                      <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-5 h-5 text-gray-300" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900 text-sm" dir="rtl">{p.nameAr}</p>
                      <span className={s.cls}>{s.label}</span>
                    </div>
                    <div className="flex gap-3 mt-1 text-xs text-gray-500 flex-wrap items-center">
                      <span className="font-bold text-primary-600">₪{Number(p.price).toFixed(2)}</span>

                      {/* Inline stock edit */}
                      {editStockId === p.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={editStockVal}
                            onChange={(e) => setEditStockVal(e.target.value)}
                            className="w-16 border border-gray-300 rounded px-1.5 py-0.5 text-xs"
                            autoFocus
                          />
                          <button onClick={() => saveStock(p.id)} className="text-green-600 hover:text-green-700">
                            <Save className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setEditStockId(null)} className="text-gray-400 hover:text-gray-600">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setEditStockId(p.id); setEditStockVal(String(p.stock)); }}
                          className="flex items-center gap-1 hover:text-primary-600 transition-colors"
                          title="تعديل المخزون">
                          مخزون: <span className="font-medium">{p.stock}</span>
                          <Edit className="w-3 h-3 opacity-50" />
                        </button>
                      )}
                    </div>

                    {/* Rejection reason */}
                    {p.status === 'rejected' && p.rejectionReason && (
                      <div className="flex items-start gap-1.5 mt-2 text-xs text-red-600 bg-red-50 rounded-lg p-2">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span><strong>سبب الرفض:</strong> {p.rejectionReason}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {p.images?.[0] && (
                      <a href={p.images[0]} target="_blank" rel="noreferrer"
                        className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="عرض الصورة">
                        <Eye className="w-4 h-4" />
                      </a>
                    )}
                    <button onClick={() => openEdit(p)}
                      className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      title="تعديل المنتج">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteProduct(p.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="حذف">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Modal */}
      {editProduct && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setEditProduct(null)}>
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
              <h2 className="font-bold text-gray-900">تعديل المنتج</h2>
              <button onClick={() => setEditProduct(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">اسم المنتج *</label>
                <input value={editForm.nameAr} onChange={(e) => setEditForm({ ...editForm, nameAr: e.target.value })}
                  className="input-field" dir="rtl" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">وصف المنتج</label>
                <textarea value={editForm.descriptionAr} onChange={(e) => setEditForm({ ...editForm, descriptionAr: e.target.value })}
                  className="input-field" rows={3} dir="rtl" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">السعر (₪) *</label>
                  <input type="number" value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                    className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الكمية المتاحة *</label>
                  <input type="number" value={editForm.stock} onChange={(e) => setEditForm({ ...editForm, stock: e.target.value })}
                    className="input-field" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">روابط الصور (رابط في كل سطر)</label>
                <textarea value={editForm.images} onChange={(e) => setEditForm({ ...editForm, images: e.target.value })}
                  className="input-field font-mono text-xs" rows={3}
                  placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg" />
              </div>
              <p className="text-xs text-gray-400">⚠️ بعد التعديل سيُعاد إرسال المنتج للمراجعة</p>
            </div>
            <div className="p-4 border-t flex gap-3">
              <button onClick={saveEdit} disabled={editSaving}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold disabled:opacity-50">
                <Save className="w-5 h-5" />
                {editSaving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
              </button>
              <button onClick={() => setEditProduct(null)}
                className="px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl">
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </VendorLayout>
  );
}
