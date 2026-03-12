'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Plus, Trash2, PlusCircle, ChevronDown, ChevronUp, Settings2 } from 'lucide-react';
import { productsApi, categoriesApi } from '@/lib/api';
import VendorLayout from '@/components/layout/VendorLayout';
import ImageUploader from '@/components/ImageUploader';
import toast from 'react-hot-toast';
import { DELIVERY_TIME_OPTIONS } from '@/lib/colors';

// ─── Full Configurator Schema Types ──────────────────────────────────────────

type OptionDisplayType = 'visual_card' | 'color_grid' | 'single_radio' | 'multi_checkbox';

interface OptionValue {
  id: string;
  label: string;
  priceModifier: number;
  colorCode?: string;
  description?: string;
  imageOverride?: string;
}

interface OptionGroup {
  id: string;
  name: string;
  type: OptionDisplayType;
  step: number;
  required: boolean;
  adminCategory: string;
  dependsOn?: { groupId: string; valueId: string };
  values: OptionValue[];
}

const DISPLAY_TYPE_OPTIONS: { value: OptionDisplayType; label: string }[] = [
  { value: 'single_radio', label: 'בחירה בודדת (רדיו)' },
  { value: 'visual_card', label: 'כרטיסים ויזואליים' },
  { value: 'color_grid', label: 'רשת צבעים' },
  { value: 'multi_checkbox', label: 'בחירה מרובה (תיבות סימון)' },
];

const ADMIN_CATEGORY_OPTIONS = [
  { value: 'structure', label: 'מבנה' },
  { value: 'design', label: 'עיצוב' },
  { value: 'upgrades', label: 'שדרוגים' },
  { value: 'installation', label: 'התקנה' },
  { value: 'general', label: 'כללי' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const slugify = (str: string) =>
  str
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_\u0590-\u05ff]/g, '')
    .slice(0, 40) || `group_${Date.now()}`;

const newGroup = (step: number): OptionGroup => ({
  id: `group_${step}_${Date.now()}`,
  name: '',
  type: 'single_radio',
  step,
  required: true,
  adminCategory: 'general',
  values: [{ id: `val_${Date.now()}`, label: '', priceModifier: 0 }],
});

const newValue = (): OptionValue => ({
  id: `val_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
  label: '',
  priceModifier: 0,
});

// ─── Component ───────────────────────────────────────────────────────────────

export default function NewProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [images, setImages] = useState<string[]>(['']);
  const [optionGroups, setOptionGroups] = useState<OptionGroup[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());
  const [advancedGroups, setAdvancedGroups] = useState<Set<number>>(new Set());
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

  // ─── Option Group Handlers ────────────────────────────────────────────────

  const addOptionGroup = () => {
    const step = optionGroups.length + 1;
    const g = newGroup(step);
    setOptionGroups([...optionGroups, g]);
    setExpandedGroups(prev => new Set(Array.from(prev).concat(optionGroups.length)));
  };

  const removeOptionGroup = (idx: number) => {
    const updated = optionGroups.filter((_, i) => i !== idx).map((g, i) => ({ ...g, step: i + 1 }));
    setOptionGroups(updated);
    setExpandedGroups(prev => { const s = new Set(prev); s.delete(idx); return s; });
    setAdvancedGroups(prev => { const s = new Set(prev); s.delete(idx); return s; });
  };

  const updateGroup = (idx: number, patch: Partial<OptionGroup>) => {
    const updated = [...optionGroups];
    updated[idx] = { ...updated[idx], ...patch };
    // Auto-generate stable ID from name if ID still looks auto-generated
    if (patch.name !== undefined && updated[idx].id.startsWith('group_')) {
      const slug = slugify(patch.name);
      if (slug) updated[idx].id = slug;
    }
    setOptionGroups(updated);
  };

  const toggleExpand = (idx: number) => {
    setExpandedGroups(prev => {
      const s = new Set(prev);
      s.has(idx) ? s.delete(idx) : s.add(idx);
      return s;
    });
  };

  const toggleAdvanced = (idx: number) => {
    setAdvancedGroups(prev => {
      const s = new Set(prev);
      s.has(idx) ? s.delete(idx) : s.add(idx);
      return s;
    });
  };

  // ─── Option Value Handlers ────────────────────────────────────────────────

  const addOptionValue = (groupIdx: number) => {
    const updated = [...optionGroups];
    updated[groupIdx].values.push(newValue());
    setOptionGroups(updated);
  };

  const removeOptionValue = (groupIdx: number, valueIdx: number) => {
    const updated = [...optionGroups];
    if (updated[groupIdx].values.length <= 1) { toast.error('חייב להיות לפחות ערך אחד בקבוצה'); return; }
    updated[groupIdx].values = updated[groupIdx].values.filter((_, i) => i !== valueIdx);
    setOptionGroups(updated);
  };

  const updateOptionValue = (groupIdx: number, valueIdx: number, patch: Partial<OptionValue>) => {
    const updated = [...optionGroups];
    const val = { ...updated[groupIdx].values[valueIdx], ...patch };
    // Auto-generate stable ID from label if ID still looks auto-generated
    if (patch.label !== undefined && val.id.startsWith('val_')) {
      const slug = slugify(patch.label);
      if (slug) val.id = `${updated[groupIdx].id}_${slug}`;
    }
    updated[groupIdx].values[valueIdx] = val;
    setOptionGroups(updated);
  };

  // ─── Submit ───────────────────────────────────────────────────────────────

  const validImages = images.filter((url) => url.trim() !== '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nameAr.trim()) { toast.error('יש להזין שם מוצר'); return; }
    if (!form.price || Number(form.price) <= 0) { toast.error('יש להזין מחיר תקין'); return; }
    if (validImages.length < 1) { toast.error('יש להוסיף לפחות תמונה אחת למוצר'); return; }

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
    setForm({ nameAr: '', descriptionAr: '', price: '', shippingFee: '0', warranty: 'none', stock: '', categoryId: '', subCategoryId: '', deliveryTime: '' });
    setImages(['']);
    setSubCategories([]);
    setOptionGroups([]);
    setExpandedGroups(new Set());
    setAdvancedGroups(new Set());
  };

  if (done) {
    return (
      <VendorLayout>
        <div className="max-w-lg mx-auto text-center py-16">
          <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">המוצר נשלח לאישור!</h2>
          <p className="text-gray-500 text-sm mb-6">לאחר בדיקת הנהלה ואישורה, המוצר יוצג בחנות.</p>
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
      <div className="max-w-2xl mx-auto" dir="rtl">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">הוספת מוצר חדש</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Product Info */}
          <div className="card">
            <h2 className="font-semibold text-gray-800 mb-4 text-sm">פרטי המוצר</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">שם המוצר *</label>
                <input name="nameAr" value={form.nameAr} onChange={handleChange} required className="input-field" placeholder="לדוגמה: דלת כניסה פרמיום" dir="rtl" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">תיאור המוצר</label>
                <textarea name="descriptionAr" value={form.descriptionAr} onChange={handleChange} className="input-field" rows={4} placeholder="כתוב תיאור מפורט של המוצר..." dir="rtl" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">מחיר בסיס (₪) *</label>
                  <input name="price" type="number" min="0" step="0.01" value={form.price} onChange={handleChange} required className="input-field" placeholder="0.00" />
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
                    <option value="6_months">חצי שנה</option>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">קטגוריית משנה <span className="text-gray-400 font-normal">(אופציונלי)</span></label>
                    <select name="subCategoryId" value={form.subCategoryId} onChange={e => setForm({ ...form, subCategoryId: e.target.value })} className="input-field">
                      <option value="">-- כל הקטגוריה --</option>
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
            <select name="deliveryTime" value={form.deliveryTime} onChange={handleChange} className="input-field">
              <option value="">-- בחר זמן אספקה --</option>
              {DELIVERY_TIME_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.labelHe}</option>
              ))}
            </select>
          </div>

          {/* ─── Product Options Builder ─────────────────────────────────── */}
          <div className="card">
            <div className="flex items-center justify-between mb-1">
              <div>
                <h2 className="font-semibold text-gray-800 text-sm">אפשרויות למוצר</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  הוסף קבוצות כגון: סוג דלת, צבע, שדרוגים — כל ערך יכול להוסיף עלות
                </p>
              </div>
              <button type="button" onClick={addOptionGroup} className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium shrink-0">
                <PlusCircle className="w-4 h-4" />
                הוסף קבוצה
              </button>
            </div>

            {optionGroups.length === 0 && (
              <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl mt-3">
                <Settings2 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400 mb-2">אין אפשרויות עדיין</p>
                <button type="button" onClick={addOptionGroup} className="text-sm text-primary-600 hover:underline font-medium">
                  + הוסף קבוצת אפשרויות ראשונה
                </button>
              </div>
            )}

            <div className="space-y-3 mt-3">
              {optionGroups.map((group, groupIdx) => {
                const isExpanded = expandedGroups.has(groupIdx);
                const isAdvanced = advancedGroups.has(groupIdx);
                return (
                  <div key={group.id} className="border border-gray-200 rounded-xl bg-gray-50 overflow-hidden">
                    {/* Group Header Row */}
                    <div className="flex items-center gap-2 p-3 bg-white border-b border-gray-100">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-xs font-bold flex items-center justify-center">
                        {group.step}
                      </span>
                      <input
                        type="text"
                        value={group.name}
                        onChange={e => updateGroup(groupIdx, { name: e.target.value })}
                        className="input-field flex-1 font-medium text-sm py-1.5"
                        placeholder="שם הקבוצה (למשל: סוג דלת, צבע, שדרוגים)"
                        dir="rtl"
                      />
                      <button type="button" onClick={() => toggleExpand(groupIdx)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg shrink-0" title={isExpanded ? 'כווץ' : 'הרחב'}>
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      <button type="button" onClick={() => removeOptionGroup(groupIdx)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg shrink-0" title="מחק קבוצה">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Expanded Body */}
                    {isExpanded && (
                      <div className="p-3 space-y-3">
                        {/* Type + Required + Category row */}
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">סוג תצוגה</label>
                            <select
                              value={group.type}
                              onChange={e => updateGroup(groupIdx, { type: e.target.value as OptionDisplayType })}
                              className="input-field text-xs py-1.5"
                            >
                              {DISPLAY_TYPE_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">קטגוריה (אדמין)</label>
                            <select
                              value={group.adminCategory}
                              onChange={e => updateGroup(groupIdx, { adminCategory: e.target.value })}
                              className="input-field text-xs py-1.5"
                            >
                              {ADMIN_CATEGORY_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">חובה לבחור?</label>
                            <select
                              value={group.required ? 'yes' : 'no'}
                              onChange={e => updateGroup(groupIdx, { required: e.target.value === 'yes' })}
                              className="input-field text-xs py-1.5"
                            >
                              <option value="yes">כן — חובה</option>
                              <option value="no">לא — אופציונלי</option>
                            </select>
                          </div>
                        </div>

                        {/* Advanced: dependsOn */}
                        <div>
                          <button type="button" onClick={() => toggleAdvanced(groupIdx)} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
                            <Settings2 className="w-3 h-3" />
                            {isAdvanced ? 'הסתר הגדרות מתקדמות' : 'הגדרות מתקדמות (תלות)'}
                          </button>
                          {isAdvanced && (
                            <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                              <p className="text-xs text-yellow-700 mb-2 font-medium">הצג קבוצה זו רק כאשר:</p>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-xs text-gray-500 mb-1">מזהה קבוצת הורה (ID)</label>
                                  <input
                                    type="text"
                                    value={group.dependsOn?.groupId || ''}
                                    onChange={e => updateGroup(groupIdx, {
                                      dependsOn: e.target.value
                                        ? { groupId: e.target.value, valueId: group.dependsOn?.valueId || '' }
                                        : undefined
                                    })}
                                    className="input-field text-xs py-1.5"
                                    placeholder="לדוגמה: door_type"
                                    dir="ltr"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-500 mb-1">מזהה ערך נדרש (ID)</label>
                                  <input
                                    type="text"
                                    value={group.dependsOn?.valueId || ''}
                                    onChange={e => updateGroup(groupIdx, {
                                      dependsOn: group.dependsOn?.groupId
                                        ? { groupId: group.dependsOn.groupId, valueId: e.target.value }
                                        : undefined
                                    })}
                                    className="input-field text-xs py-1.5"
                                    placeholder="לדוגמה: double_door"
                                    dir="ltr"
                                  />
                                </div>
                              </div>
                              {group.dependsOn?.groupId && (
                                <button type="button" onClick={() => updateGroup(groupIdx, { dependsOn: undefined })} className="mt-2 text-xs text-red-500 hover:underline">
                                  הסר תלות
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Values */}
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-2">ערכים</label>
                          <div className="space-y-2">
                            {group.values.map((val, valueIdx) => (
                              <div key={val.id} className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={val.label}
                                  onChange={e => updateOptionValue(groupIdx, valueIdx, { label: e.target.value })}
                                  className="input-field flex-1 text-sm py-1.5"
                                  placeholder="שם הערך (למשל: שחור, 2x2, חכם)"
                                  dir="rtl"
                                />
                                {group.type === 'color_grid' && (
                                  <input
                                    type="color"
                                    value={val.colorCode || '#000000'}
                                    onChange={e => updateOptionValue(groupIdx, valueIdx, { colorCode: e.target.value })}
                                    className="w-9 h-9 rounded border border-gray-200 cursor-pointer shrink-0"
                                    title="צבע"
                                  />
                                )}
                                <div className="flex items-center gap-1 shrink-0">
                                  <span className="text-xs text-gray-500">+₪</span>
                                  <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={val.priceModifier}
                                    onChange={e => updateOptionValue(groupIdx, valueIdx, { priceModifier: Number(e.target.value) || 0 })}
                                    className="input-field w-20 text-sm text-center py-1.5"
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
                          <button type="button" onClick={() => addOptionValue(groupIdx)} className="mt-2 flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium">
                            <Plus className="w-3.5 h-3.5" />
                            הוסף ערך
                          </button>
                        </div>

                        {/* ID preview */}
                        <p className="text-xs text-gray-300 font-mono">ID: {group.id}</p>
                      </div>
                    )}

                    {/* Collapsed summary */}
                    {!isExpanded && (
                      <div className="px-3 py-2 flex items-center gap-2 flex-wrap">
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                          {DISPLAY_TYPE_OPTIONS.find(t => t.value === group.type)?.label || group.type}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${group.required ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                          {group.required ? 'חובה' : 'אופציונלי'}
                        </span>
                        <span className="text-xs text-gray-400">{group.values.length} ערכים</span>
                        {group.dependsOn?.groupId && (
                          <span className="text-xs bg-yellow-50 text-yellow-600 px-2 py-0.5 rounded-full">
                            תלוי ב: {group.dependsOn.groupId}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Images Section */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-gray-800 text-sm">תמונות המוצר *</h2>
                <p className="text-xs text-gray-500 mt-0.5">הוסף תמונות באמצעות קישור URL או העלה מהמכשיר</p>
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${validImages.length >= 1 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                {validImages.length} תמונות
              </span>
            </div>
            <div className="space-y-4">
              {images.map((url, index) => (
                <div key={index}>
                  <p className="text-xs font-medium text-gray-500 mb-1.5">תמונה {index + 1}{index === 0 ? ' (ראשית)' : ''}</p>
                  <ImageUploader value={url} onChange={(val) => handleImageChange(index, val)} index={index} required={index === 0} showRemove={index >= 1} onRemove={() => removeImageField(index)} />
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
