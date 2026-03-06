'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store';
import toast from 'react-hot-toast';

export default function VendorLoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authApi.login(form);
      const { user, accessToken } = res.data;
      const access_token = accessToken;
      if (user.role !== 'vendor') {
        toast.error('هذه البوابة مخصصة للموردين فقط');
        return;
      }
      setAuth({ ...user, vendorStatus: user.vendor?.status }, access_token);
      toast.success(`أهلاً بك، ${user.fullName}!`);
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'خطأ في تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-gray-100 flex items-center justify-center px-4 py-12" dir="rtl">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-600">مشتالم</h1>
          <p className="text-gray-500 mt-1 text-sm">بوابة الموردين</p>
        </div>

        <div className="card shadow-lg">
          <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">تسجيل الدخول</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required className="input-field" placeholder="example@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">كلمة المرور</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required className="input-field" placeholder="••••••••"
              />
            </div>
            <button type="submit" disabled={loading} className="w-full btn-primary py-3 text-base">
              {loading ? 'جاري الدخول...' : 'تسجيل الدخول'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            ليس لديك حساب؟{' '}
            <Link href="/auth/register" className="text-primary-600 hover:underline font-medium">
              سجّل كمورد
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
