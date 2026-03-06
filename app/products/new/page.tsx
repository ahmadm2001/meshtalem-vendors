'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Upload, X, CheckCircle } from 'lucide-react';
import { productsApi, categoriesApi } from '@/lib/api';
import VendorLayout from '@/components/layout/VendorLayout';
import toast from 'react-hot-toast';

export default function NewProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    nameAr: '',
    descriptionAr: '',
    price: '',
    stock: '',
    categoryId: '',
  });

  useEffect(() => {
    categoriesApi.getAll().then((r) => setCategories(r.data || [])).catch(() => {});
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nameAr.trim()) { toast.error('يرجى إدخال اسم المنتج'); return; }
    if (!form.price || Number(form.price) <= 0) { toast.error('يرجى إدخال سعر صحيح'); return; }
    setLoading(true);
    try {
      await productsApi.create({
        nameAr: form.nameAr,
        descriptionAr: form.descriptionAr,
        price: Number(form.price),
        stock: Number(form.stock) || 0,
        categoryId: form.categoryId || undefined,
      });
      setDone(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'حدث خطأ أثناء إضافة المنتج');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <VendorLayout>
        <div className="max-w-lg mx-auto text-center py-16">
          <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">تم إرسال المنتج للمراجعة!</h2>
          <p className="text-gray-500 text-sm mb-2">
            سيتم ترجمة المنتج تلقائياً إلى العبرية بواسطة الذكاء الاصطناعي.
          </p>
          <p className="text-gray-500 text-sm mb-6">
            بعد مراجعة الإدارة وموافقتها، سيظهر المنتج في المتجر.
          </p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => { setDone(false); setForm({ nameAr:'', descriptionAr:'', price:'', stock:'', categoryId:'' }); }} className="btn-primary">
              إضافة منتج آخر
            </button>
            <button onClick={() => router.push('/products')} className="btn-secondary">
              قائمة منتجاتي
            </button>
          </div>
        </div>
      </VendorLayout>
    );
  }

  return (
    <VendorLayout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">إضافة منتج جديد</h1>

        {/* AI Translation Notice */}
        <div className="bg-gradient-to-l from-purple-50 to-blue-50 border border-purple-100 rounded-xl p-4 mb-6 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-purple-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-purple-800 text-sm">ترجمة تلقائية بالذكاء الاصطناعي</p>
            <p className="text-purple-600 text-xs mt-0.5">
              أدخل بيانات المنتج بالعربية. سيتم ترجمتها تلقائياً إلى العبرية بواسطة الذكاء الاصطناعي قبل عرضها للعملاء.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="card">
            <h2 className="font-semibold text-gray-800 mb-4 text-sm">معلومات المنتج</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  اسم المنتج (بالعربية) *
                </label>
                <input
                  name="nameAr"
                  value={form.nameAr}
                  onChange={handleChange}
                  required
                  className="input-field"
                  placeholder="مثال: حذاء رياضي أديداس"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  وصف المنتج (بالعربية)
                </label>
                <textarea
                  name="descriptionAr"
                  value={form.descriptionAr}
                  onChange={handleChange}
                  className="input-field"
                  rows={4}
                  placeholder="اكتب وصفاً تفصيلياً للمنتج، مميزاته، المواد المستخدمة..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">السعر (₪) *</label>
                  <input
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={handleChange}
                    required
                    className="input-field"
                    placeholder="99.90"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الكمية المتاحة *</label>
                  <input
                    name="stock"
                    type="number"
                    min="0"
                    value={form.stock}
                    onChange={handleChange}
                    required
                    className="input-field"
                    placeholder="100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الفئة</label>
                <select name="categoryId" value={form.categoryId} onChange={handleChange} className="input-field">
                  <option value="">-- اختر فئة --</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.nameAr || cat.nameHe}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="card bg-gray-50 border-dashed border-2 border-gray-200">
            <div className="text-center py-4">
              <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm font-medium text-gray-600">رفع صور المنتج</p>
              <p className="text-xs text-gray-400 mt-1">يمكنك إضافة الصور بعد حفظ المنتج</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={loading} className="flex-1 btn-primary py-3 text-base">
              {loading ? 'جاري الإرسال...' : 'إرسال للمراجعة'}
            </button>
            <button type="button" onClick={() => router.push('/products')} className="btn-secondary px-6">
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </VendorLayout>
  );
}
