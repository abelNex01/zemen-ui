import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, Zap, ChevronDown, Crown } from "lucide-react";
import logo from '../assets/logo.svg';
import { useLanguage } from "@/hooks/use-language";
import { useProAccess } from "@/hooks/use-pro-access";
import { ThemeToggle } from "./ThemeToggle";
import { BuyCodebaseDialog } from "./BuyCodebaseDialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { containerVariants, itemVariants } from "@/lib/animations";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  onPricingClick?: () => void;
}

export function Header({ onPricingClick }: HeaderProps) {
  const { language, setLanguage, t } = useLanguage();
  const { isPro } = useProAccess();
  const [location, navigate] = useLocation();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const NavLinks = ({ className, mobile = false }: { className?: string; mobile?: boolean }) => (
    <div className={className}>
      {isPro ? (
        <Link 
          href="/pro" 
          className={cn(
            "relative text-sm font-semibold transition-all text-muted-foreground/70 hover:text-foreground group flex items-center gap-1.5",
            mobile && "text-left"
          )}
          onClick={() => mobile && setIsSheetOpen(false)}
        >
          <Crown className="w-4 h-4 text-amber-500" />
          Dashboard
          <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-foreground transition-all duration-300 group-hover:w-full" />
        </Link>
      ) : (
        <Dialog>
          <DialogTrigger asChild>
            <button className={cn(
              "relative text-sm font-semibold transition-all text-muted-foreground/70 hover:text-foreground group",
              mobile && "text-left"
            )}>
              Dashboard
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-foreground transition-all duration-300 group-hover:w-full" />
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Pro Feature</DialogTitle>
              <DialogDescription className="pt-4 flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Zap className="w-8 h-8 text-primary fill-primary" />
                </div>
                <span className="text-lg font-bold">Upgrade to Pro Version</span>
                <p className="text-muted-foreground">
                  Get access to advanced analytics, priority processing, and unlimited optimizations.
                </p>
                <Button className="w-full mt-4" onClick={() => {
                  onPricingClick?.();
                  setIsSheetOpen(false);
                }}>
                  View Pricing
                </Button>
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      )}
      <a 
        href="#features" 
        className={cn(
          "relative text-sm font-semibold transition-all text-muted-foreground/70 hover:text-foreground group",
          location === "/" && !mobile && ""
        )}
        onClick={() => mobile && setIsSheetOpen(false)}
      >
        {t('nav.features')}
        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-foreground transition-all duration-300 group-hover:w-full" />
      </a>
    </div>
  );

  return (
    <div className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <header className="w-full max-w-5xl bg-background/90 backdrop-blur-xl border dark:border-accent/80 border-border shadow-lg rounded-2xl h-16 pointer-events-auto">
        <motion.div 
          className="w-full h-full flex items-center px-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div className="flex-1 flex items-center" variants={itemVariants}>
            <Link href="/" className="flex items-center hover:opacity-80 transition-opacity shrink-0">
              <img src={logo} alt="ZemenPix Logo" className="h-8 w-auto dark:invert transition-all" />
            </Link>
          </motion.div>
          
          <motion.nav className="hidden md:flex items-center justify-center flex-1" variants={itemVariants}>
            <NavLinks className="flex items-center gap-10" />
          </motion.nav>

          <motion.div className="flex-1 flex items-center justify-end gap-3" variants={itemVariants}>
            <div className="hidden md:flex items-center gap-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-2 hover:bg-muted rounded-full text-muted-foreground/50 hover:text-foreground transition-colors group">
                    <Globe className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setLanguage('en')} className="flex items-center gap-2">
                     <span className="fi fi-us rounded-sm"></span> English
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLanguage('am')} className="flex items-center gap-2">
                     <span className="fi fi-et rounded-sm"></span> አማርኛ
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <BuyCodebaseDialog showText={false} />
            </div>


            <div className="hidden md:flex">
              <Button 
                onClick={onPricingClick}
                icon={<Zap className="w-4 h-4 fill-current" />}
                className="text-sm"
              >
                Upgrade to Pro 
              </Button>
            </div>


            <ThemeToggle />

            {/* Mobile Menu */}
            <div className="md:hidden">
              <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetTrigger asChild>
                  <button className="p-2 hover:bg-muted rounded-full transition-colors">
                    <Menu className="w-6 h-6" />
                  </button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                  <SheetHeader className="mb-8">
                    <SheetTitle className="text-left">
                      <img src={logo} alt="ZemenPix Logo" className="h-8 w-auto" />
                    </SheetTitle>
                  </SheetHeader>
                  <div className="flex flex-col gap-6">
                    <NavLinks className="flex flex-col gap-6 text-lg" mobile />
                    
                    <Button 
                      onClick={() => {
                        onPricingClick?.();
                        setIsSheetOpen(false);
                      }}
                      icon={<Zap className="w-4 h-4 fill-current" />}
                      className="w-full text-sm"
                    >
                      Upgrade to Pro 
                    </Button>
                    
                    <div className="pt-6 border-t border-border">
                      <p className="text-sm text-muted-foreground mb-4 font-medium">
                        {language === 'en' ? 'Select Language' : 'ቋንቋ ይምረጡ'}
                      </p>
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => setLanguage('en')}
                          className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all border w-full ${
                            language === 'en' 
                              ? 'bg-primary/5 border-primary text-primary shadow-sm' 
                              : 'bg-muted/50 border-border text-muted-foreground'
                          }`}
                        >
                          <span className="fi fi-us shadow-sm rounded-sm text-lg"></span>
                          <span className="font-semibold">English</span>
                        </button>
                        <button
                          onClick={() => setLanguage('am')}
                          className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all border w-full ${
                            language === 'am' 
                              ? 'bg-primary/5 border-primary text-primary shadow-sm' 
                              : 'bg-muted/50 border-border text-muted-foreground'
                          }`}
                        >
                          <span className="fi fi-et shadow-sm rounded-sm text-lg"></span>
                          <span className="font-semibold">አማርኛ</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </motion.div>
        </motion.div>
      </header>
    </div>
  );
}
