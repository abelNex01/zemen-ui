import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Input } from "@/components/ui/input";
import { Github, Check, ShoppingCart, Code2, Globe, Sparkles, ArrowRight, ShieldCheck, Mail, ExternalLink } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { motion, AnimatePresence } from "framer-motion";

export function BuyCodebaseDialog({ showText = true }: { showText?: boolean }) {
  const { t, language } = useLanguage();
  const [step, setStep] = useState<"info" | "purchase" | "success">("info");
  const [otpValue, setOtpValue] = useState("");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState(false);

  const validateEmail = (email: string) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  const handlePurchase = () => {
    if (validateEmail(email)) {
      setStep("purchase");
    } else {
      setEmailError(true);
    }
  };

  const handleVerify = () => {
    if (otpValue.length === 6) {
      setStep("success");
    }
  };

  const features = [
    { icon: <Code2 className="w-4 h-4" />, text: language === 'en' ? "Full Source Code" : "ሙሉ የኮድ ምንጭ" },
    { icon: <Globe className="w-4 h-4" />, text: language === 'en' ? "Commercial License" : "ለንግድ ስራ ፍቃድ" },
    { icon: <Sparkles className="w-4 h-4" />, text: language === 'en' ? "Lifetime Updates" : "የዘላለም ዝመናዎች" },
    { icon: <ShieldCheck className="w-4 h-4" />, text: language === 'en' ? "Premium Support" : "ፕሪሚየም ድጋፍ" },
  ];

  return (
    <Dialog onOpenChange={(open) => !open && setStep("info")}>
      <DialogTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-2 font-medium transition-all active:scale-95 group",
            showText 
              ? "text-sm text-muted-foreground hover:text-foreground hover:scale-105" 
              : "p-2 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground"
          )}
        >
          <Github className={cn("w-4 h-4 transition-transform group-hover:rotate-12", !showText && "w-5 h-5")} />
          {showText && (
            <span className="relative">
              {t('nav.github')}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
            </span>
          )}
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] overflow-hidden p-0 gap-0 border-none bg-gradient-to-b from-background to-muted/30">
        <AnimatePresence mode="wait">
          {step === "info" && (
            <motion.div
              key="info"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-8"
            >
              <DialogHeader className="mb-6">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-primary/10 rounded-2xl ring-1 ring-primary/20">
                    <ShoppingCart className="w-8 h-8 text-primary" />
                  </div>
                </div>
                <DialogTitle className="text-3xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                  {language === 'en' ? "Get the Full Project" : "ሙሉውን ፕሮጀክት ያግኙ"}
                </DialogTitle>
                <DialogDescription className="text-center text-lg mt-2">
                  {language === 'en' 
                    ? "Own the complete codebase of ZemenPix and start your own SaaS today." 
                    : "የዘመንፒክስን ሙሉ የኮድ ምንጭ ይገንዘቡ እና የራስዎን የSaaS ስራ ዛሬ ይጀምሩ።"}
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-4 mb-8">
                {features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-background/50 border border-border/50 shadow-sm">
                    <div className="text-primary">{feature.icon}</div>
                    <span className="text-sm font-medium">{feature.text}</span>
                  </div>
                ))}
              </div>

              <div className="bg-primary/5 border border-primary/10 rounded-2xl p-6 mb-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Sparkles className="w-16 h-16 text-primary" />
                </div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-4xl font-black text-primary">$999</span>
                  <span className="text-muted-foreground line-through">$1499</span>
                </div>
                <p className="text-sm text-muted-foreground font-medium">
                  {language === 'en' ? "One-time payment, unlimited use." : "አንድ ጊዜ ክፍያ፣ ገደብ የለሽ አጠቃቀም።"}
                </p>
              </div>

              <div className="space-y-2 mb-8">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder={language === 'en' ? "Enter your email address" : "ኢሜልዎን ያስገቡ"}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setEmailError(false);
                    }}
                    className={`h-14 pl-12 rounded-2xl border-2 transition-all ${
                      emailError 
                        ? "border-red-500/50 bg-red-500/5 focus-visible:ring-red-500/20" 
                        : "border-primary/10 bg-background/50 focus-visible:border-primary/30"
                    }`}
                  />
                </div>
                {emailError && (
                  <p className="text-sm text-red-500 font-medium pl-2">
                    {language === 'en' ? "Please enter a valid email address" : "እባክዎን ትክክለኛ ኢሜይል ያስገቡ"}
                  </p>
                )}
              </div>

              <Button 
                onClick={handlePurchase} 
                icon={<ArrowRight className="w-5 h-5" />}
                className="w-full h-14"
              >
                {language === 'en' ? "Purchase Now" : "አሁኑኑ ይግዙ"}
              </Button>
            </motion.div>
          )}

          {step === "purchase" && (
            <motion.div
              key="purchase"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="p-8"
            >
              <DialogHeader className="mb-8">
                <DialogTitle className="text-2xl font-bold text-center">
                  {language === 'en' ? "Verify Purchase Code" : "የግዢ ኮዱን ያረጋግጡ"}
                </DialogTitle>
                <DialogDescription className="text-center mt-2">
                  {language === 'en' 
                    ? `Enter the 6-digit verification code sent to ${email}.` 
                    : `ወደ ${email} የተላከ 6 አሃዝ የማረጋገጫ ኮድ ያስገቡ።`}
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-col items-center gap-8">
                <InputOTP
                  maxLength={6}
                  value={otpValue}
                  onChange={(val) => setOtpValue(val)}
                  onComplete={handleVerify}
                  className="gap-3"
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} className="w-12 h-14 text-xl rounded-xl border-2" />
                    <InputOTPSlot index={1} className="w-12 h-14 text-xl rounded-xl border-2" />
                    <InputOTPSlot index={2} className="w-12 h-14 text-xl rounded-xl border-2" />
                  </InputOTPGroup>
                  <InputOTPSeparator />
                  <InputOTPGroup>
                    <InputOTPSlot index={3} className="w-12 h-14 text-xl rounded-xl border-2" />
                    <InputOTPSlot index={4} className="w-12 h-14 text-xl rounded-xl border-2" />
                    <InputOTPSlot index={5} className="w-12 h-14 text-xl rounded-xl border-2" />
                  </InputOTPGroup>
                </InputOTP>

                <div className="w-full space-y-4">
                  <Button 
                    disabled={otpValue.length !== 6}
                    onClick={handleVerify}
                    className="w-full h-14"
                  >
                    {language === 'en' ? "Verify Code" : "ኮዱን አረጋግጥ"}
                  </Button>
                  <button 
                    onClick={() => setStep("info")}
                    className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
                  >
                    {language === 'en' ? "Back to Details" : "ወደ ዝርዝር ተመለስ"}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {step === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 text-center"
            >
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center border-2 border-green-500/20">
                  <Check className="w-10 h-10 text-green-500" />
                </div>
              </div>
              <DialogTitle className="text-3xl font-bold mb-4">
                {language === 'en' ? "Purchase Confirmed!" : "ግዢው ተረጋግጧል!"}
              </DialogTitle>
              <p className="text-muted-foreground mb-8 text-lg">
                {language === 'en' 
                  ? `Thank you for your purchase. The codebase has been sent to ${email}.` 
                  : `ለግዢዎ እናመሰግናለን። የኮድ ምንጩ ወደ ${email} ተልኳል::`}
              </p>
              <Button asChild className="w-full h-14" icon={<ExternalLink className="w-4 h-4" />}>
                 <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                    {language === 'en' ? "Go to Repository" : "ወደ ትርኢቱ ሂድ"}
                 </a>
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
