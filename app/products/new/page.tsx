'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, X, CheckCircle, Plus, Image as ImageIcon } from 'lucide-react';
import { productsApi, categoriesApi } from '@/lib/api';
import VendorLayout from '@/components/layout/VendorLayout';
import toast from 'react-hot-toast';

export default function NewProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);   // root categories (tree)
  const [subCategories, setSubCategories] = useState<any[]>([]); // children of selected root
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [images, setImages] = useState<string[]>(['', '', '']);
  const [form, setForm] = useState({
    nameAr: '',
    descriptionAr: '',
    price: '',
    stock: '',
    categoryId: '',    // root category
    subCategoryId: '', // sub category (optional)
  });

  useEffect(() => {
    categoriesApi.getAll().then((r) => setCategories(r.data || [])).catch(() => {});
  }, []);

  // When root category changes, load its sub-categories
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const rootId = e.target.value;
    const root = categories.find((c: any) => c.id === rootId);
    setSubCategories(root?.children || []);
    setForm({ ...form, categoryId: rootId, subCategoryId: '' });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImageChange = (index: number, value: string) => {
    const updated = [...images];
    updated[index] = value;
    setImages(updated);
  };

  const addImageField = () => {
    if (images.length < 8) setImages([...images, '']);
  };

  const removeImageField = (index: number) => {
    if (images.length <= 3) { toast.error('يجب إضافة 3 صور على الأقل'); return; }
    setImages(images.filter((_, i) => i !== index));
  };

  const validImages = images.filter((url) => url.trim() !== '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nameAr.trim()) { toast.error('يرجى إدخال اسم المنتج'); return; }
    if (!form.price || Number(form.price) <= 0) { toast.error('يرجى إدخال سعر صحيح'); return; }

    // Validate images - at least 3 valid URLs
    if (validImages.length < 3) {
      toast.error('يجب إضافة 3 صور على الأقل للمنتج');
      return;
    }

    // Basic URL validation
    const invalidUrls = validImages.filter((url) => {
      try { new URL(url); return false; } catch { return true; }
    });
    if (invalidUrls.length > 0) {
      toast.error('يرجى التأكد من صحة روابط الصور');
      return;
    }

    setLoading(true);
    try {
      // Use sub-category if selected, otherwise use root category
      const finalCategoryId = form.subCategoryId || form.categoryId || undefined;
      await productsApi.create({
        nameAr: form.nameAr,
        descriptionAr: form.descriptionAr,
        price: Number(form.price),
        stock: Number(form.stock) || 0,
        categoryId: finalCategoryId,
        images: validImages,
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
            <button onClick={() => { setDone(false); setForm({ nameAr:'', descriptionAr:'', price:'', stock:'', categoryId:'', subCategoryId:'' }); setImages(['','','']); setSubCategories([]); }} className="btn-primary">
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
          {/* Product Info */}
          <div className="card">
            <h2 className="font-semibold text-gray-800 mb-4 text-sm">معلومات المنتج</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">اسم المنتج (بالعربية) *</label>
                <input name="nameAr" value={form.nameAr} onChange={handleChange} required className="input-field" placeholder="مثال: حذاء رياضي أديداس" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">وصف المنتج (بالعربية)</label>
                <textarea name="descriptionAr" value={form.descriptionAr} onChange={handleChange} className="input-field" rows={4} placeholder="اكتب وصفاً تفصيلياً للمنتج، مميزاته، المواد المستخدمة..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">السعر (₪) *</label>
                  <input name="price" type="number" min="0" step="0.01" value={form.price} onChange={handleChange} required className="input-field" placeholder="99.90" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الكمية المتاحة *</label>
                  <input name="stock" type="number" min="0" value={form.stock} onChange={handleChange} required className="input-field" placeholder="100" />
                </div>
              </div>
              <div className="space-y-3">
                {/* Root category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الفئة الرئيسية</label>
                  <select value={form.categoryId} onChange={handleCategoryChange} className="input-field">
                    <option value="">-- اختر فئة رئيسية --</option>
                    {categories.map((cat: any) => (
                      <option key={cat.id} value={cat.id}>{cat.nameAr || cat.nameHe}</option>
                    ))}
                  </select>
                </div>
                {/* Sub-category - shown only if root has children */}
                {subCategories.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      الفئة الفرعية <span className="text-gray-400 font-normal">(اختياري)</span>
                    </label>
                    <select name="subCategoryId" value={form.subCategoryId}
                      onChange={e => setForm({ ...form, subCategoryId: e.target.value })}
                      className="input-field">
                      <option value="">-- كل {categories.find((c:any)=>c.id===form.categoryId)?.nameAr || 'الفئة'} --</option>
                      {subCategories.map((sub: any) => (
                        <option key={sub.id} value={sub.id}>{sub.nameAr || sub.nameHe}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Images Section */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-gray-800 text-sm">صور المنتج *</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  يجب إضافة <span className="font-bold text-red-500">3 صور على الأقل</span> - أدخل روابط URL للصور
                </p>
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${validImages.length >= 3 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                {validImages.length}/3 صور مطلوبة
              </span>
            </div>

            <div className="space-y-3">
              {images.map((url, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex gap-2 items-center">
                    <div className="flex-1 relative">
                      <input
                        type="url"
                        value={url}
                        onChange={(e) => handleImageChange(index, e.target.value)}
                        className={`input-field pl-9 text-sm ${index < 3 ? 'border-red-200 focus:border-red-400' : ''}`}
                        placeholder={`رابط الصورة ${index + 1}${index < 3 ? ' (مطلوب)' : ' (اختياري)'}`}
                        dir="ltr"
                      />
                      <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                    {index >= 3 && (
                      <button type="button" onClick={() => removeImageField(index)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {/* Image Preview */}
                  {url && (
                    <div className="mr-0">
                      <img
                        src={url}
                        alt={`صورة ${index + 1}`}
                        className="h-20 w-20 object-cover rounded-lg border border-gray-200"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        onLoad={(e) => { (e.target as HTMLImageElement).style.display = 'block'; }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {images.length < 8 && (
              <button type="button" onClick={addImageField} className="mt-3 flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium">
                <Plus className="w-4 h-4" />
                إضافة صورة أخرى
              </button>
            )}

            <p className="text-xs text-gray-400 mt-3">
              💡 يمكنك رفع صورك على <a href="https://imgbb.com" target="_blank" rel="noreferrer" className="text-primary-600 underline">imgbb.com</a> أو <a href="https://imgur.com" target="_blank" rel="noreferrer" className="text-primary-600 underline">imgur.com</a> ونسخ الرابط هنا
            </p>
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
