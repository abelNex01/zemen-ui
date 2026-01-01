import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Bolt } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import { Button } from '@/components/ui/button';
import adImage from '../assets/ad.jfif';

interface AdProps {
  isOpen: boolean;
  onClose: () => void;
  onLearnMore?: () => void;
}

export default function Ad({ isOpen, onClose, onLearnMore }: AdProps) {
  const { t } = useLanguage();
  
  const handleAction = () => {
    onLearnMore?.();
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
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Ad Content */}
            <div className="relative aspect-[4/5] overflow-hidden">
              <img
                src={adImage}
                alt="Advertisement"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-white">
                <span className="inline-block px-3 py-1 mb-4 text-[10px] font-bold tracking-widest uppercase bg-white/20 backdrop-blur-md rounded-full border border-white/20">
                  {t('ad.sponsored')}
                </span>
                <h2 className="text-3xl font-display text-white font-bold mb-3 leading-tight">
                  {t('ad.title')}
                </h2>
                <p className="text-zinc-300 text-sm mb-6 max-w-xs leading-relaxed">
                  {t('ad.desc')}
                </p>
                <Button 
                  onClick={handleAction}
                  icon={<Bolt className="w-4 h-4" />}
                  className="w-full"
                >
                  {t('ad.btn')}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
