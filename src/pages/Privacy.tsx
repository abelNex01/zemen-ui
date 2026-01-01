import { motion } from 'framer-motion';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Shield, Mail, MapPin } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';

export default function Privacy() {
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
              <Shield className="w-8 h-8 text-black dark:text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold">{t('privacy.title')}</h1>
            <p className="text-muted-foreground">{t('lastUpdated') || 'Last updated'}: December 25, 2025</p>
          </div>

          <div className="prose prose-zinc dark:prose-invert max-w-none space-y-8">
            <section className="space-y-4">
              <h2 className="text-2xl font-bold font-display">{t('privacy.intro.title')}</h2>
              <p className="text-muted-foreground leading-relaxed">
                {t('privacy.intro.desc')}
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold font-display">{t('privacy.local.title')}</h2>
              <p className="text-muted-foreground leading-relaxed">
                {t('privacy.local.desc')}
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold font-display">{t('privacy.collect.title')}</h2>
              <p className="text-muted-foreground leading-relaxed">
                {t('privacy.collect.desc')}
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>{t('privacy.collect.item1')}</li>
                <li>{t('privacy.collect.item2')}</li>
                <li>{t('privacy.collect.item3')}</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold font-display">{t('privacy.contact.title')}</h2>
              <p className="text-muted-foreground leading-relaxed">
                {t('privacy.contact.desc')}
              </p>
              
              <div className="grid md:grid-cols-2 gap-6 mt-8">
                <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl">
                      <Mail className="w-5 h-5" />
                    </div>
                    <span className="font-bold">Email</span>
                  </div>
                  <p className="text-sm text-muted-foreground">pixelbetstudio@gmail.com</p>
                </div>

                <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <span className="font-bold">Location</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Addis Ababa, Ethiopia</p>
                </div>
              </div>
            </section>

            <div className="pt-12 border-t border-border">
              <p className="text-sm text-muted-foreground italic">
                {t('privacy.ceo')}
              </p>
            </div>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
