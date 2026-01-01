import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Zap, Shield, Smartphone, Heart, Sparkles } from "lucide-react";

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { StatsCard } from "@/components/StatsCard";
import Ad from "./Ad";
import Donation from "./Donation";
import Pricing from "./Pricing";
import ProSubscription from "./ProSubscription";
import { useLanguage } from "@/hooks/use-language";
import { ImageDeck } from "@/components/ImageDeck";
import { Button } from "@/components/ui/button";
import {
  containerVariants,
  itemVariants,
  revealViewport,
} from "@/lib/animations";
import { ProjectStartScreen } from "@/components/ProjectStartScreen";

function FeatureCard({
  icon: Icon,
  title,
  desc,
}: {
  icon: any;
  title: string;
  desc: string;
}) {
  return (
    <motion.div
      variants={itemVariants}
      className="p-6 rounded-2xl bg-muted/30 border dark:border-accent/40 border-border/50 hover:bg-muted/50 transition-colors"
    >
      <div className="w-12 h-12 bg-background rounded-xl flex items-center justify-center mb-4 shadow-sm border border-border">
        <Icon className="w-6 h-6 text-foreground" />
      </div>
      <h3 className="text-lg font-bold font-display mb-2">{title}</h3>
      <p className="text-muted-foreground leading-relaxed text-sm">{desc}</p>
    </motion.div>
  );
}

export default function Home() {
  const [isAdOpen, setIsAdOpen] = useState(false);
  const [isDonationOpen, setIsDonationOpen] = useState(false);
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [isProSubOpen, setIsProSubOpen] = useState(false);

  const { t } = useLanguage();

  useEffect(() => {
    const hasSeenAd = sessionStorage.getItem("zemenpix_ad_shown");
    if (!hasSeenAd) {
      const timer = setTimeout(() => {
        setIsAdOpen(true);
        sessionStorage.setItem("zemenpix_ad_shown", "true");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary selection:text-primary-foreground">
      <Header onPricingClick={() => setIsPricingOpen(true)} />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <section className="text-center py-4 md:py-8 mt-20 max-w-6xl mx-auto">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            viewport={revealViewport}
          >
            <motion.h1
              variants={itemVariants}
              className="text-5xl md:text-7xl font-display font-bold tracking-tight mb-0 bg-gradient-to-br from-foreground via-foreground/80 to-foreground/40 bg-clip-text text-transparent"
            >
              {t("hero.title.top")}
              <br />
              {t("hero.title.bottom")}
            </motion.h1>

            <motion.div variants={itemVariants}>
              <ImageDeck />
            </motion.div>

            <motion.p
              variants={itemVariants}
              className="text-sm md:text-base text-muted-foreground mb-4 max-w-2xl mx-auto leading-relaxed"
            >
              {t("hero.subtitle")}
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8"
            >
              <Button
                onClick={() => setIsDonationOpen(true)}
                icon={<Heart className="w-5 h-5 fill-black" />}
                className="bg-red-500/10 text-red-600 hover:bg-red-500/20 gap-3"
              >
                {t("hero.donate")}
              </Button>
              <Button
                onClick={() => {
                  const el = document.getElementById("tool");
                  el?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                {t("hero.getStarted")}
              </Button>
            </motion.div>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={revealViewport}
          >
            <StatsCard />
          </motion.div>
        </section>

        {/* Project Start Screen */}
        <section id="start-screen" className="max-w-7xl mx-auto mb-32">
          <ProjectStartScreen />
        </section>

        <section id="features" className="mb-20">
          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={revealViewport}
          >
            <FeatureCard
              icon={Zap}
              title={t("features.fast.title")}
              desc={t("features.fast.desc")}
            />
            <FeatureCard
              icon={Shield}
              title={t("features.privacy.title")}
              desc={t("features.privacy.desc")}
            />
            <FeatureCard
              icon={Smartphone}
              title={t("features.smart.title")}
              desc={t("features.smart.desc")}
            />
            <FeatureCard
              icon={Sparkles}
              title={t("features.upscale.title")}
              desc={t("features.upscale.desc")}
            />
          </motion.div>
        </section>
      </main>
      <Footer />

      <Ad
        isOpen={isAdOpen}
        onClose={() => setIsAdOpen(false)}
        onLearnMore={() => setIsPricingOpen(true)}
      />
      <Donation
        isOpen={isDonationOpen}
        onClose={() => setIsDonationOpen(false)}
      />
      <Pricing
        isOpen={isPricingOpen}
        onClose={() => setIsPricingOpen(false)}
        onSubscribe={() => setIsProSubOpen(true)}
      />
      <ProSubscription
        isOpen={isProSubOpen}
        onClose={() => setIsProSubOpen(false)}
      />
    </div>
  );
}
