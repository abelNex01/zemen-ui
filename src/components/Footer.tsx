import { Heart } from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from "@/hooks/use-language";
import { motion } from "framer-motion";
import { containerVariants, itemVariants, revealViewport } from "@/lib/animations";
import logo from "../assets/logo.svg";

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="border-t dark:border-accent/60 border-border bg-muted/30 w-full overflow-hidden">
      <motion.div 
        className="container mx-auto px-6 py-12 lg:py-20"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={revealViewport}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          
          {/* Brand & Description */}
          <motion.div className="space-y-6" variants={itemVariants}>
            <div className="flex items-center gap-3">
              <img
                src={logo}
                alt="ZemenPix Logo"
                className="h-10 w-auto opacity-90 dark:invert"
              />
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              Advanced browser side image optimization and compression. Fast, secure, and privacy-focused.
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>©{new Date().getFullYear()}</span>
              <span>•</span>
              <span>All rights reserved.</span>
              <div className="flex gap-3">
                <Link
                  href="/privacy"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t("footer.privacy")}
                </Link>
                <Link
                  href="/terms"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t("footer.terms")}
                </Link>
              </div>
            </div>
          </motion.div>

          

          {/* Credits & Community */}
          <motion.div className="flex flex-col gap-6 md:items-end" variants={itemVariants}>
            <div className="flex flex-col gap-4 md:items-end">
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-background/50 border border-border px-4 py-2 rounded-full">
                <span>{t("footer.builtBy")}</span>
                <a
                  href="#"
                  className="font-semibold text-foreground hover:underline underline-offset-4 transition"
                >
                  PixelBet Studio.
                </a>
                <Heart className="h-4 w-4 text-red-500 fill-red-500" />
              </div>
            </div>
          </motion.div>

        </div>
      </motion.div>
    </footer>
  );
}
