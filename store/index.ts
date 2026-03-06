import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Cookies from 'js-cookie';

interface VendorUser {
  id: string;
  email: string;
  fullName: string;
  role: 'vendor';
  vendorStatus?: 'pending' | 'approved' | 'rejected';
}

interface AuthStore {
  user: VendorUser | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: VendorUser, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setAuth: (user, token) => {
        Cookies.set('vendor_token', token, { expires: 7 });
        set({ user, token, isAuthenticated: true });
      },
      logout: () => {
        Cookies.remove('vendor_token');
        set({ user: null, token: null, isAuthenticated: false });
        window.location.href = '/auth/login';
      },
    }),
    { name: 'meshtalem-vendor-auth' }
  )
);
