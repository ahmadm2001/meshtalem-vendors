'use client';
import { useEffect, useState } from 'react';
import { Save, User } from 'lucide-react';
import { vendorApi } from '@/lib/api';
import VendorLayout from '@/components/layout/VendorLayout';
import toast from 'react-hot-toast';

export default function VendorProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    businessName: '',
    description: '',
    phone: '',
    address: '',
    fullName: '',
  });

  useEffect(() => {
    vendorApi.getProfile()
      .then((r) => {
        const v = r.data;
        setForm({
          businessName: v.businessName || v.businessNameHe || '',
          description: v.description || '',
          phone: v.phone || v.user?.phone || '',
          address: v.address || '',
          fullName: v.user?.fullName || '',
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await vendorApi.updateProfile(form);
      toast.success('הפרופיל עודכן בהצלחה');
    } catch {
      toast.error('שגיאה בשמירה');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <VendorLayout><div className="animate-pulse space-y-4">{[...Array(5)].map((_, i) => <div key={i} className="card h-12" />)}</div></VendorLayout>;

  return (
    <VendorLayout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">פרופיל</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="card">
            <div className="flex items-center gap-3 mb-5">
              <div className="bg-primary-100 p-3 rounded-full">
                <User className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{form.fullName}</p>
                <p className="text-xs text-gray-400">פרטי החשבון</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">שם מלא</label>
                <input name="fullName" value={form.fullName} onChange={handleChange} className="input-field" dir="rtl" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">מספר טלפון</label>
                <input name="phone" value={form.phone} onChange={handleChange} className="input-field" placeholder="050-0000000" />
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="font-semibold text-gray-800 mb-4 text-sm">פרטי העסק</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">שם העסק</label>
                <input name="businessName" value={form.businessName} onChange={handleChange} className="input-field" dir="rtl" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">כתובת / עיר</label>
                <input name="address" value={form.address} onChange={handleChange} className="input-field" placeholder="לדוגמה: חיפה, רחוב הרצל 5" dir="rtl" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">תיאור העסק</label>
                <textarea name="description" value={form.description} onChange={handleChange} className="input-field" rows={3} dir="rtl" />
              </div>
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
