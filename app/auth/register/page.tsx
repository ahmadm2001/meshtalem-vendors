'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { authApi } from '@/lib/api';
import toast from 'react-hot-toast';

export default function VendorRegisterPage() {
  const router = useRouter();
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    businessName: '',
    description: '',
    address: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error('הסיסמאות אינן תואמות');
      return;
    }
    setLoading(true);
    try {
      await authApi.registerVendor({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        phone: form.phone,
        businessName: form.businessName,
        description: form.description,
        address: form.address,
      });
      setDone(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'שגיאה בהרשמה');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-gray-100 flex items-center justify-center px-4" dir="rtl">
        <div className="card max-w-md w-full text-center shadow-lg py-10">
          <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">הבקשה נשלחה בהצלחה!</h2>
          <p className="text-gray-500 text-sm mb-6">
            הבקשה שלך תיבדק על ידי ההנהלה. תקבל הודעה בדואר האלקטרוני לאחר האישור.
          </p>
          <Link href="/auth/login" className="btn-primary inline-block px-8">
            התחברות
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-gray-100 flex items-center justify-center px-4 py-12" dir="rtl">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-600">משתלם</h1>
          <p className="text-gray-500 mt-1 text-sm">הירשם כספק והתחל למכור</p>
        </div>

        <div className="card shadow-lg">
          <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">יצירת חשבון ספק</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">שם מלא *</label>
                <input name="fullName" value={form.fullName} onChange={handleChange} required className="input-field" placeholder="ישראל ישראלי" dir="rtl" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">מספר טלפון *</label>
                <input name="phone" value={form.phone} onChange={handleChange} required className="input-field" placeholder="050-0000000" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">דואר אלקטרוני *</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} required className="input-field" placeholder="example@email.com" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">סיסמה *</label>
                <input name="password" type="password" value={form.password} onChange={handleChange} required className="input-field" placeholder="לפחות 8 תווים" minLength={8} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">אימות סיסמה *</label>
                <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} required className="input-field" placeholder="••••••••" />
              </div>
            </div>

            <hr className="border-gray-100" />
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">פרטי העסק</p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">שם העסק *</label>
              <input name="businessName" value={form.businessName} onChange={handleChange} required className="input-field" placeholder="חנות האלגנטיות" dir="rtl" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">כתובת</label>
              <input name="address" value={form.address} onChange={handleChange} className="input-field" placeholder="תל אביב, רחוב הרצל 5" dir="rtl" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">תיאור העסק</label>
              <textarea name="description" value={form.description} onChange={handleChange} className="input-field" rows={3} placeholder="כתוב תיאור קצר על העסק שלך..." dir="rtl" />
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-700">
              ⓘ הבקשה שלך תיבדק על ידי ההנהלה לפני הפעלת החשבון. הדבר עשוי לקחת 24-48 שעות.
            </div>

            <button type="submit" disabled={loading} className="w-full btn-primary py-3 text-base">
              {loading ? 'שולח...' : 'שלח בקשת הרשמה'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            כבר יש לך חשבון?{' '}
            <Link href="/auth/login" className="text-primary-600 hover:underline font-medium">התחבר</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
