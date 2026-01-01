import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface ProAccessContextType {
  isPro: boolean;
  proExpiry: number | null;
  licenseKey: string | null;
  activatePro: (confirmationKey: string) => boolean;
  deactivatePro: () => void;
  daysRemaining: number;
}

const ProAccessContext = createContext<ProAccessContextType | undefined>(undefined);

const PRO_STORAGE_KEY = 'zemenpix-pro-status';
const PRO_DURATION_DAYS = 30;

function generateBrowserFingerprint(): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('ZemenPix', 2, 2);
  }
  const canvasData = canvas.toDataURL();
  
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset().toString(),
    canvasData.slice(0, 50)
  ];
  
  let hash = 0;
  const str = components.join('|');
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

function validateConfirmationKey(key: string): boolean {
  const cleanKey = key.trim().toUpperCase();
  if (cleanKey.length < 6) return false;
  
  const validPrefixes = ['ZP', 'PRO', 'CBE', 'TEL'];
  const hasValidPrefix = validPrefixes.some(prefix => cleanKey.startsWith(prefix));
  const hasNumbers = /\d/.test(cleanKey);
  
  return hasValidPrefix && hasNumbers;
}

interface ProStatus {
  activated: boolean;
  expiry: number;
  fingerprint: string;
  licenseKey: string;
}

export const ProAccessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [proStatus, setProStatus] = useState<ProStatus | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(PRO_STORAGE_KEY);
      if (stored) {
        const status: ProStatus = JSON.parse(stored);
        const currentFingerprint = generateBrowserFingerprint();
        
        if (status.fingerprint === currentFingerprint && status.expiry > Date.now()) {
          setProStatus(status);
        } else if (status.expiry <= Date.now()) {
          localStorage.removeItem(PRO_STORAGE_KEY);
        }
      }
    } catch (e) {
      console.error('Error loading pro status:', e);
    }
  }, []);

  const activatePro = useCallback((confirmationKey: string): boolean => {
    if (!validateConfirmationKey(confirmationKey)) {
      return false;
    }

    const fingerprint = generateBrowserFingerprint();
    const expiry = Date.now() + (PRO_DURATION_DAYS * 24 * 60 * 60 * 1000);
    
    const status: ProStatus = {
      activated: true,
      expiry,
      fingerprint,
      licenseKey: confirmationKey.trim().toUpperCase()
    };

    localStorage.setItem(PRO_STORAGE_KEY, JSON.stringify(status));
    setProStatus(status);
    return true;
  }, []);

  const deactivatePro = useCallback(() => {
    localStorage.removeItem(PRO_STORAGE_KEY);
    setProStatus(null);
  }, []);

  const isPro = proStatus?.activated && proStatus.expiry > Date.now();
  const daysRemaining = proStatus?.expiry 
    ? Math.max(0, Math.ceil((proStatus.expiry - Date.now()) / (24 * 60 * 60 * 1000)))
    : 0;

  return (
    <ProAccessContext.Provider value={{
      isPro: !!isPro,
      proExpiry: proStatus?.expiry || null,
      licenseKey: proStatus?.licenseKey || null,
      activatePro,
      deactivatePro,
      daysRemaining
    }}>
      {children}
    </ProAccessContext.Provider>
  );
};

export const useProAccess = () => {
  const context = useContext(ProAccessContext);
  if (context === undefined) {
    throw new Error('useProAccess must be used within a ProAccessProvider');
  }
  return context;
};
