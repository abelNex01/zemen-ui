import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Copy, Check } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import { Button } from '@/components/ui/button';
import telebirrLogo from '../assets/telebirr.svg';
import cbeLogo from '../assets/cbe.svg';

interface DonationProps {
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

export default function Donation({ isOpen, onClose }: DonationProps) {
  const { t } = useLanguage();
  const [amount, setAmount] = useState('');
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

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

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDonateComplete = () => {
    setIsSuccess(true);
    // Optionally auto-close after some time
    setTimeout(() => {
        // onClose(); // Keep it open so they can read the thank you message
    }, 5000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-[2rem] overflow-hidden shadow-2xl p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-400"
            >
              <X className="w-5 h-5" />
            </button>

            <AnimatePresence mode="wait">
              {!isSuccess ? (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <div className="flex flex-col items-center text-center mb-8">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mb-4">
                      <Heart className="w-8 h-8 text-red-500 fill-red-500" />
                    </div>
                    <h2 className="text-2xl font-display font-bold mb-2">{t('donation.title')}</h2>
                    <p className="text-zinc-500 text-sm max-w-xs">
                      {t('donation.desc')}
                    </p>
                  </div>

                  <div className="space-y-6">
                    {/* Amount Input */}
                    <div className="relative">
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2 ml-1">
                        {t('donation.amountLabel')}
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-zinc-400">Birr</span>
                        <input
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-full pl-16 pr-4 py-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl font-display text-xl font-bold focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all"
                        />
                      </div>
                    </div>

                    {/* Bank Selection */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-3 ml-1">
                        {t('donation.bankLabel')}
                      </label>
                      <div className="grid grid-cols-2 gap-4">
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
                    </div>

                    {/* Display Account Details */}
                    <AnimatePresence mode="wait">
                      {selectedBank && (
                        <motion.div
                          key={selectedBank.id}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className={`p-6 rounded-2xl ${selectedBank.color} border ${selectedBank.borderColor} relative group overflow-hidden`}
                        >
                          <div className="flex items-center justify-between relative z-10">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">
                                {t('donation.accountLabel')}
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
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <Button
                      onClick={handleDonateComplete}
                      disabled={!amount || !selectedBank}
                      className="w-full h-14"
                    >
                      {t('donation.btn')} {amount && `${amount} ETB`}
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center text-center py-12"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.2 }}
                    className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-8"
                  >
                    <Check className="w-12 h-12 text-green-500 stroke-[3px]" />
                  </motion.div>
                  
                    <motion.h2 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-3xl font-display font-bold mb-4"
                  >
                    {t('donation.thanks')}
                  </motion.h2>
                  
                  <motion.p 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-zinc-500 max-w-xs leading-relaxed mb-10"
                  >
                    {t('donation.thanksDesc').replace('{amount}', amount)}
                  </motion.p>
                  
                   <Button
                    onClick={onClose}
                    className="bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 h-12"
                  >
                    {t('donation.back')}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
