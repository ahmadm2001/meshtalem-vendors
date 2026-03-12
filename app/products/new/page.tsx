'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Plus, Trash2, PlusCircle } from 'lucide-react';
import { productsApi, categoriesApi } from '@/lib/api';
import VendorLayout from '@/components/layout/VendorLayout';
import ImageUploader from '@/components/ImageUploader';
import toast from 'react-hot-toast';
import { DELIVERY_TIME_OPTIONS } from '@/lib/colors';

interface OptionValue {
  label: string;
  priceModifier: number;
}

interface OptionGroup {
  name: string;
  values: OptionValue[];
}

export default function NewProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [images, setImages] = useState<string[]>(['']);
  const [optionGroups, setOptionGroups] = useState<OptionGroup[]>([]);
  const [form, setForm] = useState({
    nameAr: '',
    descriptionAr: '',
    price: '',
    shippingFee: '0',
    warranty: 'none',
    stock: '',
    categoryId: '',
    subCategoryId: '',
    deliveryTime: '',
  });

  useEffect(() => {
    categoriesApi.getAll().then((r) => setCategories(r.data || [])).catch(() => {});
  }, []);

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
    if (images.length <= 1) { toast.error('יש להוסיף לפחות תמונה אחת'); return; }
    setImages(images.filter((_, i) => i !== index));
  };

  // ─── Option Groups ───────────────────────────────────────────────────────────

  const addOptionGroup = () => {
    setOptionGroups([...optionGroups, { name: '', values: [{ label: '', priceModifier: 0 }] }]);
  };

  const removeOptionGroup = (groupIdx: number) => {
    setOptionGroups(optionGroups.filter((_, i) => i !== groupIdx));
  };

  const updateGroupName = (groupIdx: number, name: string) => {
    const updated = [...optionGroups];
    updated[groupIdx] = { ...updated[groupIdx], name };
    setOptionGroups(updated);
  };

  const addOptionValue = (groupIdx: number) => {
    const updated = [...optionGroups];
    updated[groupIdx].values.push({ label: '', priceModifier: 0 });
    setOptionGroups(updated);
  };

  const removeOptionValue = (groupIdx: number, valueIdx: number) => {
    const updated = [...optionGroups];
    if (updated[groupIdx].values.length <= 1) { toast.error('חייב להיות לפחות ערך אחד בקבוצה'); return; }
    updated[groupIdx].values = updated[groupIdx].values.filter((_, i) => i !== valueIdx);
    setOptionGroups(updated);
  };

  const updateOptionValue = (groupIdx: number, valueIdx: number, field: 'label' | 'priceModifier', val: string) => {
    const updated = [...optionGroups];
    if (field === 'priceModifier') {
      updated[groupIdx].values[valueIdx].priceModifier = Number(val) || 0;
    } else {
      updated[groupIdx].values[valueIdx].label = val;
    }
    setOptionGroups(updated);
  };

  const validImages = images.filter((url) => url.trim() !== '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nameAr.trim()) { toast.error('יש להזין שם מוצר'); return; }
    if (!form.price || Number(form.price) <= 0) { toast.error('יש להזין מחיר תקין'); return; }
    if (validImages.length < 1) {
      toast.error('יש להוסיף לפחות תמונה אחת למוצר');
      return;
    }

    // Validate option groups
    for (const group of optionGroups) {
      if (!group.name.trim()) { toast.error('יש להזין שם לכל קבוצת אפשרויות'); return; }
      for (const val of group.values) {
        if (!val.label.trim()) { toast.error('יש להזין תווית לכל ערך באפשרויות'); return; }
      }
    }

    setLoading(true);
    try {
      const finalCategoryId = form.subCategoryId || form.categoryId || undefined;
      const validOptions = optionGroups.filter(g => g.name.trim() && g.values.length > 0);
      await productsApi.create({
        nameAr: form.nameAr,
        descriptionAr: form.descriptionAr,
        price: Number(form.price),
        shippingFee: Number(form.shippingFee) || 0,
        warranty: form.warranty,
        stock: Number(form.stock) || 0,
        categoryId: finalCategoryId,
        images: validImages,
        deliveryTime: form.deliveryTime || undefined,
        productOptions: validOptions.length > 0 ? validOptions : undefined,
      });
      setDone(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'שגיאה בהוספת המוצר');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setDone(false);
    setForm({ nameAr:'', descriptionAr:'', price:'', shippingFee:'0', warranty:'none', stock:'', categoryId:'', subCategoryId:'', deliveryTime:'' });
    setImages(['']);
    setSubCategories([]);
    setOptionGroups([]);
  };

  if (done) {
    return (
      <VendorLayout>
        <div className="max-w-lg mx-auto text-center py-16">
          <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">המוצר נשלח לאישור!</h2>
          <p className="text-gray-500 text-sm mb-6">
            לאחר בדיקת הנהלה ואישורה, המוצר יוצג בחנות.
          </p>
          <div className="flex gap-3 justify-center">
            <button onClick={resetForm} className="btn-primary">הוסף מוצר נוסף</button>
            <button onClick={() => router.push('/products')} className="btn-secondary">רשימת המוצרים שלי</button>
          </div>
        </div>
      </VendorLayout>
    );
  }

  return (
    <VendorLayout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">הוספת מוצר חדש</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Product Info */}
          <div className="card">
            <h2 className="font-semibold text-gray-800 mb-4 text-sm">פרטי המוצר</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">שם המוצר *</label>
                <input name="nameAr" value={form.nameAr} onChange={handleChange} required className="input-field" placeholder="לדוגמה: שטיח סלון מעוצב" dir="rtl" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">תיאור המוצר</label>
                <textarea name="descriptionAr" value={form.descriptionAr} onChange={handleChange} className="input-field" rows={4} placeholder="כתוב תיאור מפורט של המוצר, יתרונות, חומרים..." dir="rtl" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">מחיר המוצר (₪) *</label>
                  <input name="price" type="number" min="0" step="0.01" value={form.price} onChange={handleChange} required className="input-field" placeholder="99.90" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">דמי משלוח (₪)</label>
                  <input name="shippingFee" type="number" min="0" step="0.01" value={form.shippingFee} onChange={handleChange} className="input-field" placeholder="0" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">אחריות</label>
                  <select name="warranty" value={form.warranty} onChange={handleChange} className="input-field">
                    <option value="none">ללא אחריות</option>
                    <option value="6_months">חצי שנה (6 חודשים)</option>
                    <option value="1_year">שנה</option>
                    <option value="1.5_years">שנה וחצי</option>
                    <option value="2_years">שנתיים</option>
                    <option value="2.5_years">שנתיים וחצי</option>
                    <option value="3_years">שלוש שנים</option>
                    <option value="3.5_years">שלוש שנים וחצי</option>
                    <option value="4_years">ארבע שנים</option>
                    <option value="4.5_years">ארבע שנים וחצי</option>
                    <option value="5_years">חמש שנים</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">כמות במלאי *</label>
                  <input name="stock" type="number" min="0" value={form.stock} onChange={handleChange} required className="input-field" placeholder="100" />
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">קטגוריה ראשית</label>
                  <select value={form.categoryId} onChange={handleCategoryChange} className="input-field">
                    <option value="">-- בחר קטגוריה ראשית --</option>
                    {categories.map((cat: any) => (
                      <option key={cat.id} value={cat.id}>{cat.nameHe || cat.nameAr}</option>
                    ))}
                  </select>
                </div>
                {subCategories.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      קטגוריית משנה <span className="text-gray-400 font-normal">(אופציונלי)</span>
                    </label>
                    <select name="subCategoryId" value={form.subCategoryId}
                      onChange={e => setForm({ ...form, subCategoryId: e.target.value })}
                      className="input-field">
                      <option value="">-- כל {categories.find((c:any)=>c.id===form.categoryId)?.nameHe || 'הקטגוריה'} --</option>
                      {subCategories.map((sub: any) => (
                        <option key={sub.id} value={sub.id}>{sub.nameHe || sub.nameAr}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Delivery Time */}
          <div className="card">
            <h2 className="font-semibold text-gray-800 mb-1 text-sm">זמן אספקה</h2>
            <p className="text-xs text-gray-500 mb-3">הזמן הצפוי לאספקת המוצר ללקוח</p>
            <select name="deliveryTime" value={form.deliveryTime} onChange={handleChange} className="input-field">
              <option value="">-- בחר זמן אספקה --</option>
              {DELIVERY_TIME_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.labelHe}</option>
              ))}
            </select>
          </div>

          {/* Product Options */}
          <div className="card">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-semibold text-gray-800 text-sm">אפשרויות למוצר</h2>
              <button
                type="button"
                onClick={addOptionGroup}
                className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                <PlusCircle className="w-4 h-4" />
                הוסף קבוצת אפשרויות
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              הוסף אפשרויות כגון: צבע, מידה, חומר — כל ערך יכול להוסיף עלות נוספת למחיר הבסיסי
            </p>

            {optionGroups.length === 0 && (
              <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-xl">
                <p className="text-sm text-gray-400">אין אפשרויות עדיין</p>
                <button
                  type="button"
                  onClick={addOptionGroup}
                  className="mt-2 text-sm text-primary-600 hover:underline font-medium"
                >
                  + הוסף קבוצת אפשרויות ראשונה
                </button>
              </div>
            )}

            <div className="space-y-4">
              {optionGroups.map((group, groupIdx) => (
                <div key={groupIdx} className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                  {/* Group header */}
                  <div className="flex items-center gap-2 mb-3">
                    <input
                      type="text"
                      value={group.name}
                      onChange={e => updateGroupName(groupIdx, e.target.value)}
                      className="input-field flex-1 font-medium"
                      placeholder="שם הקבוצה (למשל: צבע, מידה, חומר)"
                      dir="rtl"
                    />
                    <button
                      type="button"
                      onClick={() => removeOptionGroup(groupIdx)}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg shrink-0"
                      title="מחק קבוצה"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Values */}
                  <div className="space-y-2">
                    {group.values.map((val, valueIdx) => (
                      <div key={valueIdx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={val.label}
                          onChange={e => updateOptionValue(groupIdx, valueIdx, 'label', e.target.value)}
                          className="input-field flex-1 text-sm"
                          placeholder="שם הערך (למשל: שחור, 2x2, פרמיום)"
                          dir="rtl"
                        />
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-xs text-gray-500">+₪</span>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={val.priceModifier}
                            onChange={e => updateOptionValue(groupIdx, valueIdx, 'priceModifier', e.target.value)}
                            className="input-field w-20 text-sm text-center"
                            placeholder="0"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeOptionValue(groupIdx, valueIdx)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => addOptionValue(groupIdx)}
                    className="mt-2 flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    הוסף ערך
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Images Section */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-gray-800 text-sm">תמונות המוצר *</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  הוסף תמונות באמצעות קישור URL או העלה מהמכשיר
                </p>
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${validImages.length >= 1 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                {validImages.length} תמונות
              </span>
            </div>

            <div className="space-y-4">
              {images.map((url, index) => (
                <div key={index}>
                  <p className="text-xs font-medium text-gray-500 mb-1.5">
                    תמונה {index + 1}{index === 0 ? ' (ראשית)' : ''}
                  </p>
                  <ImageUploader
                    value={url}
                    onChange={(val) => handleImageChange(index, val)}
                    index={index}
                    required={index === 0}
                    showRemove={index >= 1}
                    onRemove={() => removeImageField(index)}
                  />
                </div>
              ))}
            </div>

            {images.length < 8 && (
              <button type="button" onClick={addImageField} className="mt-4 flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium">
                <Plus className="w-4 h-4" />
                הוסף תמונה נוספת
              </button>
            )}
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={loading} className="flex-1 btn-primary py-3 text-base">
              {loading ? 'שולח...' : 'שלח לאישור'}
            </button>
            <button type="button" onClick={() => router.push('/products')} className="btn-secondary px-6">
              ביטול
            </button>
          </div>
        </form>
      </div>
    </VendorLayout>
  );
}
