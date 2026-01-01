import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Copy, Check, CreditCard, ArrowRight, Shield } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import { useProAccess } from '@/hooks/use-pro-access';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import telebirrLogo from '../assets/telebirr.svg';
import cbeLogo from '../assets/cbe.svg';

interface ProSubscriptionProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Bank {
  id: string;
  name: string;
  logo: string;
  account: string;
  color: string;
  borderColor: string;
  accent: string;
}

export default function ProSubscription({ isOpen, onClose }: ProSubscriptionProps) {
  const { t } = useLanguage();
  const { activatePro } = useProAccess();
  const [, navigate] = useLocation();
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [confirmationKey, setConfirmationKey] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [step, setStep] = useState<'info' | 'payment' | 'confirm'>('info');

  const banks: Bank[] = [
    {
      id: 'cbe',
      name: 'Commercial Bank of Ethiopia',
      logo: cbeLogo,
      account: '1000521265527',
      color: 'bg-[#9333ea]/10',
      borderColor: 'border-[#9333ea]/20',
      accent: 'text-[#9333ea]'
    },
    {
      id: 'telebirr',
      name: 'Telebirr',
      logo: telebirrLogo,
      account: '0978004968',
      color: 'bg-[#005bb7]/10',
      borderColor: 'border-[#005bb7]/20',
      accent: 'text-[#005bb7]'
    }
  ];

  const proFeatures = [
    'Batch process 100+ images',
    'AI-powered upscaling (2x, 4x)',
    'Advanced format conversion',
    'Priority compression algorithms',
    'Processing history & analytics'
  ];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = () => {
    setError('');
    
    if (!confirmationKey.trim()) {
      setError('Please enter your confirmation key');
      return;
    }
    
    const success = activatePro(confirmationKey);
    
    if (success) {
      setIsSuccess(true);
      setTimeout(() => {
        onClose();
        navigate('/pro');
      }, 2000);
    } else {
      setError('Invalid confirmation key. Please check and try again.');
    }
  };

  const resetAndClose = () => {
    setStep('info');
    setSelectedBank(null);
    setConfirmationKey('');
    setError('');
    setIsSuccess(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={resetAndClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-[2rem] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={resetAndClose}
              className="absolute top-6 right-6 p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <AnimatePresence mode="wait">
              {isSuccess ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center text-center p-12"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.2 }}
                    className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-8"
                  >
                    <Check className="w-12 h-12 text-green-500 stroke-[3px]" />
                  </motion.div>
                  <h2 className="text-3xl font-display font-bold mb-4">Welcome to Pro!</h2>
                  <p className="text-zinc-500 mb-6">Your Pro access is now active. Redirecting to dashboard...</p>
                </motion.div>
              ) : step === 'info' ? (
                <motion.div
                  key="info"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="p-8"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-black dark:bg-white rounded-2xl flex items-center justify-center">
                      <Zap className="w-6 h-6 text-white dark:text-black fill-current" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-display font-bold">ZemenPix Pro</h2>
                      <p className="text-zinc-500 text-sm">Unlock advanced features</p>
                    </div>
                  </div>

                  <div className="flex items-baseline gap-2 mb-6">
                    <span className="text-4xl font-display font-bold">999 ETB</span>
                    <span className="text-zinc-500">/month</span>
                  </div>

                  <div className="space-y-3 mb-8">
                    {proFeatures.map((feature, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="p-1 bg-black dark:bg-white rounded-full">
                          <Check className="w-3 h-3 text-white dark:text-black" />
                        </div>
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-zinc-500 mb-6 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                    <Shield className="w-4 h-4" />
                    <span>Your images never leave your device</span>
                  </div>

                  <Button
                    onClick={() => setStep('payment')}
                    className="w-full"
                    icon={<ArrowRight className="w-5 h-5" />}
                  >
                    Continue to Payment
                  </Button>
                </motion.div>
              ) : step === 'payment' ? (
                <motion.div
                  key="payment"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="p-8"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center">
                      <CreditCard className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-display font-bold">Select Payment Method</h2>
                      <p className="text-zinc-500 text-sm">Transfer 999 ETB to activate</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {banks.map((bank) => (
                      <button
                        key={bank.id}
                        onClick={() => setSelectedBank(bank)}
                        className={`
                          relative p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-3
                          ${selectedBank?.id === bank.id 
                            ? 'border-black dark:border-white bg-zinc-50 dark:bg-zinc-800/50 scale-[1.02]' 
                            : 'border-zinc-100 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'}
                        `}
                      >
                        <div className="h-10 w-full flex items-center justify-center">
                          <img src={bank.logo} alt={bank.name} className="max-h-full max-w-full object-contain" />
                        </div>
                        <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-tighter">
                          {bank.name}
                        </span>
                      </button>
                    ))}
                  </div>

                  <AnimatePresence mode="wait">
                    {selectedBank && (
                      <motion.div
                        key={selectedBank.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className={`p-6 rounded-2xl ${selectedBank.color} border ${selectedBank.borderColor} mb-6`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">
                              Account Number
                            </p>
                            <p className={`text-xl font-display font-bold ${selectedBank.accent}`}>
                              {selectedBank.account}
                            </p>
                          </div>
                          <button
                            onClick={() => handleCopy(selectedBank.account)}
                            className="p-3 bg-white dark:bg-zinc-900 rounded-xl shadow-sm hover:scale-110 active:scale-95 transition-all text-zinc-600 dark:text-zinc-300"
                          >
                            {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                          </button>
                        </div>
                        <p className="text-xs text-zinc-500 mt-3">
                          Transfer exactly <span className="font-bold">999 ETB</span> to this account
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex gap-3">
                    <Button
                      onClick={() => setStep('info')}
                      variant="outline"
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={() => setStep('confirm')}
                      disabled={!selectedBank}
                      className="flex-1"
                    >
                      I've Paid
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="confirm"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="p-8"
                >
                  <div className="flex flex-col items-center text-center mb-8">
                    <div className="w-16 h-16 bg-black dark:bg-white rounded-2xl flex items-center justify-center mb-4">
                      <Zap className="w-8 h-8 text-white dark:text-black fill-current" />
                    </div>
                    <h2 className="text-2xl font-display font-bold mb-2">Enter Confirmation Key</h2>
                    <p className="text-zinc-500 text-sm max-w-xs">
                      Enter the transaction reference or confirmation number from your payment
                    </p>
                  </div>

                  <div className="mb-6">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2 ml-1">
                      Confirmation Key / Reference
                    </label>
                    <input
                      type="text"
                      value={confirmationKey}
                      onChange={(e) => {
                        setConfirmationKey(e.target.value);
                        setError('');
                      }}
                      placeholder="e.g. ZP-123456 or CBE-789012"
                      className="w-full px-4 py-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl font-mono text-lg focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all"
                    />
                    {error && (
                      <p className="text-red-500 text-sm mt-2 ml-1">{error}</p>
                    )}
                  </div>

                  <p className="text-xs text-zinc-400 mb-6 text-center">
                    Format: Start with ZP, PRO, CBE, or TEL followed by numbers
                  </p>

                  <div className="flex gap-3">
                    <Button
                      onClick={() => setStep('payment')}
                      variant="outline"
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      className="flex-1"
                      icon={<Zap className="w-5 h-5 fill-current" />}
                    >
                      Activate Pro
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
