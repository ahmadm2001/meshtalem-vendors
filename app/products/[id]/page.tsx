'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Save, ArrowRight } from 'lucide-react';
import { productsApi, categoriesApi } from '@/lib/api';
import VendorLayout from '@/components/layout/VendorLayout';
import toast from 'react-hot-toast';

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ nameAr: '', descriptionAr: '', price: '', stock: '', categoryId: '' });

  useEffect(() => {
    categoriesApi.getAll().then((r) => setCategories(r.data || [])).catch(() => {});
    productsApi.getById(id)
      .then((r) => {
        const p = r.data;
        setForm({ nameAr: p.nameAr || '', descriptionAr: p.descriptionAr || '', price: p.price, stock: p.stock, categoryId: p.categoryId || '' });
      })
      .catch(() => router.push('/products'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await productsApi.update(id, {
        nameAr: form.nameAr,
        descriptionAr: form.descriptionAr,
        price: Number(form.price),
        stock: Number(form.stock),
        categoryId: form.categoryId || undefined,
      });
      toast.success('تم تحديث المنتج وإرساله للمراجعة مجدداً');
      router.push('/products');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'حدث خطأ');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <VendorLayout><div className="animate-pulse space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="card h-12" />)}</div></VendorLayout>;

  return (
    <VendorLayout>
      <div className="max-w-2xl mx-auto">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary-600 mb-6 transition-colors">
          <ArrowRight className="w-4 h-4" />
          العودة للمنتجات
        </button>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">تعديل المنتج</h1>

        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-5 text-xs text-yellow-700">
          ⚠️ بعد التعديل، سيُعاد إرسال المنتج للمراجعة من قِبل الإدارة قبل نشره.
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">اسم المنتج (بالعربية) *</label>
            <input name="nameAr" value={form.nameAr} onChange={handleChange} required className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">وصف المنتج (بالعربية)</label>
            <textarea name="descriptionAr" value={form.descriptionAr} onChange={handleChange} className="input-field" rows={4} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">السعر (₪) *</label>
              <input name="price" type="number" min="0" step="0.01" value={form.price} onChange={handleChange} required className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الكمية المتاحة *</label>
              <input name="stock" type="number" min="0" value={form.stock} onChange={handleChange} required className="input-field" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الفئة</label>
            <select name="categoryId" value={form.categoryId} onChange={handleChange} className="input-field">
              <option value="">-- اختر فئة --</option>
              {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.nameAr || cat.nameHe}</option>)}
            </select>
          </div>
          <button type="submit" disabled={saving} className="w-full btn-primary py-3 flex items-center justify-center gap-2">
            <Save className="w-4 h-4" />
            {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
          </button>
        </form>
      </div>
    </VendorLayout>
  );
}
