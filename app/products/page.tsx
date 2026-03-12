'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PlusCircle, Edit, Trash2, Package, Search, Save, X, AlertCircle, Eye, PlusCircle as PlusCircleIcon } from 'lucide-react';
import { productsApi } from '@/lib/api';
import VendorLayout from '@/components/layout/VendorLayout';
import toast from 'react-hot-toast';

const statusMap: Record<string, { label: string; cls: string }> = {
  pending:  { label: 'בבדיקה',  cls: 'badge-pending' },
  approved: { label: 'פורסם',   cls: 'badge-approved' },
  rejected: { label: 'נדחה',    cls: 'badge-rejected' },
  draft:    { label: 'טיוטה',   cls: 'bg-gray-100 text-gray-600 text-xs font-medium px-2.5 py-0.5 rounded-full' },
};

interface OptionValue { label: string; priceModifier: number; }
interface OptionGroup { name: string; values: OptionValue[]; }

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
  const [editOptions, setEditOptions] = useState<OptionGroup[]>([]);
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => {
    productsApi.getMyProducts({ limit: 100 })
      .then((r) => setProducts(r.data?.products || r.data || []))
      .finally(() => setLoading(false));
  }, []);

  const deleteProduct = async (id: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק מוצר זה?')) return;
    await productsApi.delete(id);
    setProducts((p) => p.filter((x) => x.id !== id));
    toast.success('המוצר נמחק');
  };

  const saveStock = async (id: string) => {
    await productsApi.update(id, { stock: Number(editStockVal) });
    setProducts((p) => p.map((x) => x.id === id ? { ...x, stock: Number(editStockVal) } : x));
    setEditStockId(null);
    toast.success('המלאי עודכן');
  };

  const openEdit = (product: any) => {
    setEditProduct(product);
    setEditForm({
      nameAr: product.nameAr || product.nameHe || '',
      descriptionAr: product.descriptionAr || product.descriptionHe || '',
      price: product.vendorPrice || product.price || '',
      stock: product.stock || '',
      images: (product.images || []).join('\n'),
    });
    setEditOptions(product.productOptions ? JSON.parse(JSON.stringify(product.productOptions)) : []);
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
        productOptions: editOptions.length > 0 ? editOptions : undefined,
      };
      const r = await productsApi.update(editProduct.id, payload);
      setProducts((p) => p.map((x) => x.id === editProduct.id ? { ...x, ...r.data } : x));
      setEditProduct(null);
      toast.success('✅ המוצר עודכן ונשלח לאישור מחדש');
    } finally { setEditSaving(false); }
  };

  // Option group helpers
  const addEditGroup = () => setEditOptions([...editOptions, { name: '', values: [{ label: '', priceModifier: 0 }] }]);
  const removeEditGroup = (gi: number) => setEditOptions(editOptions.filter((_, i) => i !== gi));
  const updateEditGroupName = (gi: number, name: string) => {
    const u = [...editOptions]; u[gi] = { ...u[gi], name }; setEditOptions(u);
  };
  const addEditValue = (gi: number) => {
    const u = [...editOptions]; u[gi].values.push({ label: '', priceModifier: 0 }); setEditOptions(u);
  };
  const removeEditValue = (gi: number, vi: number) => {
    const u = [...editOptions];
    if (u[gi].values.length <= 1) { toast.error('חייב להיות לפחות ערך אחד'); return; }
    u[gi].values = u[gi].values.filter((_, i) => i !== vi); setEditOptions(u);
  };
  const updateEditValue = (gi: number, vi: number, field: 'label' | 'priceModifier', val: string) => {
    const u = [...editOptions];
    if (field === 'priceModifier') u[gi].values[vi].priceModifier = Number(val) || 0;
    else u[gi].values[vi].label = val;
    setEditOptions(u);
  };

  const filtered = products.filter((p) => {
    const name = p.nameHe || p.nameAr || '';
    const matchSearch = name.toLowerCase().includes(search.toLowerCase());
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
        <h1 className="text-2xl font-bold text-gray-900">המוצרים שלי</h1>
        <Link href="/products/new" className="btn-primary flex items-center gap-2 text-sm">
          <PlusCircle className="w-4 h-4" />
          הוסף מוצר
        </Link>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="חיפוש מוצרים..." className="input-field pr-9" dir="rtl" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {(['all','pending','approved','rejected'] as const).map((s) => (
              <button key={s} onClick={() => setFilter(s)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${filter === s ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {{ all:'הכל', pending:'בבדיקה', approved:'פורסם', rejected:'נדחה' }[s]}
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
          <p className="text-gray-500 mb-4">אין מוצרים</p>
          <Link href="/products/new" className="btn-primary inline-flex items-center gap-2 text-sm">
            <PlusCircle className="w-4 h-4" />הוסף מוצר ראשון
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
                      <p className="font-semibold text-gray-900 text-sm" dir="rtl">{p.nameHe || p.nameAr}</p>
                      <span className={s.cls}>{s.label}</span>
                      {p.productOptions && p.productOptions.length > 0 && (
                        <span className="bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded-full">
                          {p.productOptions.length} קבוצות אפשרויות
                        </span>
                      )}
                    </div>
                    <div className="flex gap-3 mt-1 text-xs text-gray-500 flex-wrap items-center">
                      <span className="font-bold text-primary-600">₪{Number(p.vendorPrice || p.price || 0).toFixed(2)}</span>

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
                          title="ערוך מלאי">
                          מלאי: <span className="font-medium">{p.stock}</span>
                          <Edit className="w-3 h-3 opacity-50" />
                        </button>
                      )}
                    </div>

                    {/* Rejection reason */}
                    {p.status === 'rejected' && p.rejectionReason && (
                      <div className="flex items-start gap-1.5 mt-2 text-xs text-red-600 bg-red-50 rounded-lg p-2">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span><strong>סיבת הדחייה:</strong> {p.rejectionReason}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {p.images?.[0] && (
                      <a href={p.images[0]} target="_blank" rel="noreferrer"
                        className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="הצג תמונה">
                        <Eye className="w-4 h-4" />
                      </a>
                    )}
                    <button onClick={() => openEdit(p)}
                      className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      title="ערוך מוצר">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteProduct(p.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="מחק">
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
              <h2 className="font-bold text-gray-900">עריכת מוצר</h2>
              <button onClick={() => setEditProduct(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">שם המוצר *</label>
                <input value={editForm.nameAr} onChange={(e) => setEditForm({ ...editForm, nameAr: e.target.value })}
                  className="input-field" dir="rtl" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">תיאור המוצר</label>
                <textarea value={editForm.descriptionAr} onChange={(e) => setEditForm({ ...editForm, descriptionAr: e.target.value })}
                  className="input-field" rows={3} dir="rtl" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">מחיר (₪) *</label>
                  <input type="number" value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                    className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">כמות במלאי *</label>
                  <input type="number" value={editForm.stock} onChange={(e) => setEditForm({ ...editForm, stock: e.target.value })}
                    className="input-field" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">קישורי תמונות (קישור בכל שורה)</label>
                <textarea value={editForm.images} onChange={(e) => setEditForm({ ...editForm, images: e.target.value })}
                  className="input-field font-mono text-xs" rows={3}
                  placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg" />
              </div>

              {/* Options section */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">אפשרויות למוצר</label>
                  <button type="button" onClick={addEditGroup}
                    className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                    <PlusCircleIcon className="w-3.5 h-3.5" />
                    הוסף קבוצה
                  </button>
                </div>
                <div className="space-y-3">
                  {editOptions.map((group, gi) => (
                    <div key={gi} className="border border-gray-200 rounded-xl p-3 bg-gray-50">
                      <div className="flex items-center gap-2 mb-2">
                        <input type="text" value={group.name} onChange={e => updateEditGroupName(gi, e.target.value)}
                          className="input-field flex-1 text-sm font-medium" placeholder="שם הקבוצה" dir="rtl" />
                        <button type="button" onClick={() => removeEditGroup(gi)}
                          className="p-1.5 text-red-400 hover:text-red-600 rounded-lg shrink-0">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="space-y-1.5">
                        {group.values.map((val, vi) => (
                          <div key={vi} className="flex items-center gap-2">
                            <input type="text" value={val.label} onChange={e => updateEditValue(gi, vi, 'label', e.target.value)}
                              className="input-field flex-1 text-xs" placeholder="שם הערך" dir="rtl" />
                            <div className="flex items-center gap-1 shrink-0">
                              <span className="text-xs text-gray-400">+₪</span>
                              <input type="number" min="0" value={val.priceModifier} onChange={e => updateEditValue(gi, vi, 'priceModifier', e.target.value)}
                                className="input-field w-16 text-xs text-center" />
                            </div>
                            <button type="button" onClick={() => removeEditValue(gi, vi)}
                              className="p-1 text-gray-400 hover:text-red-500 rounded shrink-0">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <button type="button" onClick={() => addEditValue(gi)}
                        className="mt-1.5 text-xs text-primary-600 hover:underline">+ הוסף ערך</button>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-xs text-gray-400">⚠️ לאחר עריכה, המוצר יישלח לאישור מחדש</p>
            </div>
            <div className="p-4 border-t flex gap-3">
              <button onClick={saveEdit} disabled={editSaving}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold disabled:opacity-50">
                <Save className="w-5 h-5" />
                {editSaving ? 'שומר...' : 'שמור שינויים'}
              </button>
              <button onClick={() => setEditProduct(null)}
                className="px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl">
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}
    </VendorLayout>
  );
}
