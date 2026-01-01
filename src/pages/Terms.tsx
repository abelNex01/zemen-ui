import { motion } from 'framer-motion';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';

export default function Terms() {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <Header />
      
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-12"
        >
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <FileText className="w-8 h-8 text-black dark:text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold">{t('terms.title')}</h1>
            <p className="text-muted-foreground">{t('lastUpdated') || 'Last updated'}: December 25, 2025</p>
          </div>

          <div className="prose prose-zinc dark:prose-invert max-w-none space-y-8">
            <section className="space-y-4">
              <h2 className="text-2xl font-bold font-display">{t('terms.intro.title')}</h2>
              <p className="text-muted-foreground leading-relaxed">
                {t('terms.intro.desc')}
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold font-display">{t('terms.use.title')}</h2>
              <p className="text-muted-foreground leading-relaxed">
                {t('terms.use.desc')}
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold font-display">{t('terms.ip.title')}</h2>
              <p className="text-muted-foreground leading-relaxed">
                {t('terms.ip.desc')}
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold font-display">{t('terms.disclaimer.title')}</h2>
              <div className="p-6 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-100 dark:border-amber-900/30 flex gap-4">
                <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  {t('terms.disclaimer.desc')}
                </p>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold font-display">{t('terms.law.title')}</h2>
              <p className="text-muted-foreground leading-relaxed">
                {t('terms.law.desc')}
              </p>
            </section>

            <div className="pt-12 border-t border-border mt-12">
              <div className="flex flex-col md:flex-row justify-between gap-8">
                <div>
                  <h3 className="font-bold mb-2">{t('terms.footer.company')}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Pixel Bet<br />
                    {t('terms.footer.location')}
                  </p>
                </div>
                <div>
                  <h3 className="font-bold mb-2">{t('terms.footer.contact')}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {t('terms.footer.inquiry')} pixelbetstudio@gmail.com<br />
                    {t('terms.footer.support')} contact@pixelbet.com
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
