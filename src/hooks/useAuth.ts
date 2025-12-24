'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export interface User {
  id: string;
  name: string;
  username?: string;
  email: string;
  role: string;
  status: string;
  profilePicture?: string;
}

// Helper function to load user from localStorage
const loadUserFromStorage = (): User | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  
  const userData = localStorage.getItem('user');
  if (userData) {
    try {
      const parsedUser = JSON.parse(userData);
      // profilePicture'ı normalize et
      if (parsedUser.profilePicture) {
        const pic = parsedUser.profilePicture.trim();
        if (pic && !pic.startsWith('http') && !pic.startsWith('/')) {
          parsedUser.profilePicture = `/${pic}`;
        } else if (pic) {
          parsedUser.profilePicture = pic;
        }
      }
      return parsedUser;
    } catch (error) {
      localStorage.removeItem('user');
      return null;
    }
  }
  return null;
};

export function useAuth() {
  // Initial state'i localStorage'dan direkt al (SSR uyumlu)
  const [user, setUser] = useState<User | null>(() => loadUserFromStorage());
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadUser = () => {
    const loadedUser = loadUserFromStorage();
    setUser(loadedUser);
  };

  useEffect(() => {
    // İlk render'da zaten yüklendi, sadece loading'i false yap
    setLoading(false);

    // localStorage değişikliklerini dinle (diğer tab'lardan veya güncellemelerden)
    const handleStorageChange = (e?: StorageEvent) => {
      // Storage event'inde sadece 'user' key'i için reaksiyon göster
      if (!e || e.key === 'user' || !e.key) {
        loadUser();
      }
    };

    // Storage event'lerini dinle (diğer tab'lardan gelen değişiklikler için)
    window.addEventListener('storage', handleStorageChange);
    // Custom event için de dinle (aynı tab'da yapılan güncellemeler için)
    window.addEventListener('user-updated', handleStorageChange as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('user-updated', handleStorageChange as EventListener);
    };
  }, []);

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
      setUser(null);
      // Login sayfasına yönlendir (locale'i koru)
      // Hard navigation kullan - cache sorunlarını önler
      const currentPath = window.location.pathname;
      const locale = currentPath.split('/')[1] || 'tr';
      window.location.href = `/${locale}/auth/login`;
    }
  };

  const refreshUser = async () => {
    if (user?.id) {
      try {
        // Get tenant slug from cookie (set during login)
        const tenantSlug = typeof document !== 'undefined' 
          ? document.cookie.split('; ').find(row => row.startsWith('tenant-slug='))?.split('=')[1]
          : null;
        
        const headers: HeadersInit = {};
        if (tenantSlug) {
          headers['x-tenant-slug'] = tenantSlug;
          headers['x-tenant-source'] = 'cookie';
        }
        
        const response = await fetch(`/api/users/${user.id}`, { headers });
        if (response.ok) {
          const userData = await response.json();
          if (userData.profilePicture) {
            const updatedUser = {
              ...user,
              profilePicture: userData.profilePicture,
            };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);
          }
        }
      } catch (error) {
        // Error refreshing user - silently fail
      }
    }
  };

  return {
    user,
    loading,
    isAuthenticated: !!user,
    logout,
    refreshUser,
  };
}


