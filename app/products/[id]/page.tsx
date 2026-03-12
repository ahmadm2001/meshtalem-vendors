'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Save, ArrowRight, Plus, Trash2, PlusCircle } from 'lucide-react';
import { productsApi, categoriesApi } from '@/lib/api';
import VendorLayout from '@/components/layout/VendorLayout';
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

const WARRANTY_OPTIONS = [
  { value: 'none', label: 'ללא אחריות' },
  { value: '6_months', label: 'חצי שנה' },
  { value: '1_year', label: 'שנה' },
  { value: '1.5_years', label: 'שנה וחצי' },
  { value: '2_years', label: 'שנתיים' },
  { value: '2.5_years', label: 'שנתיים וחצי' },
  { value: '3_years', label: 'שלוש שנים' },
  { value: '3.5_years', label: 'שלוש שנים וחצי' },
  { value: '4_years', label: 'ארבע שנים' },
  { value: '4.5_years', label: 'ארבע שנים וחצי' },
  { value: '5_years', label: 'חמש שנים' },
];

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
    productsApi.getById(id)
      .then((r) => {
        const p = r.data;
        setForm({
          nameAr: p.nameAr || p.nameHe || '',
          descriptionAr: p.descriptionAr || p.descriptionHe || '',
          price: String(p.price || ''),
          shippingFee: String(p.shippingFee || '0'),
          warranty: p.warranty || 'none',
          stock: String(p.stock || ''),
          categoryId: p.categoryId || '',
          subCategoryId: '',
          deliveryTime: p.deliveryTime || '',
        });
        // Load existing product options
        if (p.productOptions && Array.isArray(p.productOptions)) {
          setOptionGroups(p.productOptions);
        }
        // Load subcategories if category is set
        if (p.categoryId) {
          categoriesApi.getAll().then((r) => {
            const cats = r.data || [];
            const root = cats.find((c: any) => c.id === p.categoryId);
            if (root?.children) setSubCategories(root.children);
          }).catch(() => {});
        }
      })
      .catch(() => router.push('/products'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const rootId = e.target.value;
    const root = categories.find((c: any) => c.id === rootId);
    setSubCategories(root?.children || []);
    setForm({ ...form, categoryId: rootId, subCategoryId: '' });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nameAr.trim()) { toast.error('יש להזין שם מוצר'); return; }
    if (!form.price || Number(form.price) <= 0) { toast.error('יש להזין מחיר תקין'); return; }

    // Validate option groups
    for (const group of optionGroups) {
      if (!group.name.trim()) { toast.error('יש להזין שם לכל קבוצת אפשרויות'); return; }
      for (const val of group.values) {
        if (!val.label.trim()) { toast.error('יש להזין תווית לכל ערך באפשרויות'); return; }
      }
    }

    setSaving(true);
    try {
      const finalCategoryId = form.subCategoryId || form.categoryId || undefined;
      const validOptions = optionGroups.filter(g => g.name.trim() && g.values.length > 0);
      await productsApi.update(id, {
        nameAr: form.nameAr,
        descriptionAr: form.descriptionAr,
        price: Number(form.price),
        shippingFee: Number(form.shippingFee) || 0,
        warranty: form.warranty,
        stock: Number(form.stock) || 0,
        categoryId: finalCategoryId,
        deliveryTime: form.deliveryTime || undefined,
        productOptions: validOptions.length > 0 ? validOptions : [],
      });
      toast.success('המוצר עודכן ונשלח לאישור מחדש');
      router.push('/products');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'שגיאה בעדכון המוצר');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <VendorLayout>
      <div className="animate-pulse space-y-4">
        {[...Array(4)].map((_, i) => <div key={i} className="card h-12" />)}
      </div>
    </VendorLayout>
  );

  return (
    <VendorLayout>
      <div className="max-w-2xl mx-auto" dir="rtl">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary-600 mb-6 transition-colors">
          <ArrowRight className="w-4 h-4 rotate-180" />
          חזרה למוצרים
        </button>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">עריכת מוצר</h1>

        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-5 text-xs text-yellow-700">
          ⚠️ לאחר העריכה, המוצר יישלח לאישור מחדש על ידי הניהול לפני פרסומו.
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Basic Info */}
          <div className="card space-y-4">
            <h2 className="font-semibold text-gray-800 text-sm">פרטי המוצר</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">שם המוצר *</label>
              <input name="nameAr" value={form.nameAr} onChange={handleChange} required className="input-field" dir="rtl" placeholder="לדוגמה: שטיח בסלון, דלת כניסה..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">תיאור המוצר</label>
              <textarea name="descriptionAr" value={form.descriptionAr} onChange={handleChange} className="input-field" rows={4} dir="rtl" placeholder="תאר את המוצר בפירוט..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">מחיר (₪) *</label>
                <input name="price" type="number" min="0" step="0.01" value={form.price} onChange={handleChange} required className="input-field" placeholder="0.00" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">כמות במלאי *</label>
                <input name="stock" type="number" min="0" value={form.stock} onChange={handleChange} required className="input-field" placeholder="0" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">דמי משלוח (₪)</label>
              <input name="shippingFee" type="number" min="0" step="0.01" value={form.shippingFee} onChange={handleChange} className="input-field" placeholder="0" />
            </div>
          </div>

          {/* Warranty */}
          <div className="card">
            <h2 className="font-semibold text-gray-800 mb-3 text-sm">אחריות</h2>
            <select name="warranty" value={form.warranty} onChange={handleChange} className="input-field">
              {WARRANTY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div className="card">
            <h2 className="font-semibold text-gray-800 mb-3 text-sm">קטגוריה</h2>
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
                    <option value="">-- כל הקטגוריה --</option>
                    {subCategories.map((sub: any) => (
                      <option key={sub.id} value={sub.id}>{sub.nameHe || sub.nameAr}</option>
                    ))}
                  </select>
                </div>
              )}
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

          <button type="submit" disabled={saving} className="w-full btn-primary py-3 flex items-center justify-center gap-2">
            <Save className="w-4 h-4" />
            {saving ? 'שומר...' : 'שמור שינויים'}
          </button>
        </form>
      </div>
    </VendorLayout>
  );
}
