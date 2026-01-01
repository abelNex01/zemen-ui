import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'am';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, Record<string, string>> = {
  en: {

    'nav.features': 'Features',
    'nav.github': 'GitHub',
    'nav.pricing': 'Pricing',
    'nav.support': 'Support Project',
    

    'hero.title.top': 'Smart Compression,',
    'hero.title.bottom': 'Stunning Quality',
    'hero.subtitle': 'Compress and upscale your images intelligently without sacrificing quality. Fast, secure, and completely local in your browser.',
    'hero.donate': 'Support Project',
    'hero.getStarted': 'Get Started',
    

    'tool.dropzone.title': 'Drop your image here',
    'tool.dropzone.subtitle': 'or click to browse from your device',
    'tool.maxWidth': 'Max Width',
    'tool.width': 'Width',
    'tool.sharpen': 'Smart Sharpening',
    'tool.download': 'Download',
    'tool.optimizing': 'Optimizing...',
    

    'features.fast.title': 'Lightning Fast',
    'features.fast.desc': 'Compression happens instantly in your browser. No server uploads means zero latency.',
    'features.privacy.title': 'Privacy First',
    'features.privacy.desc': 'Your photos never leave your device. All processing is done locally via WebAssembly.',
    'features.smart.title': 'Smart Compression',
    'features.smart.desc': 'Intelligent algorithms reduce file size by up to 80% while maintaining visual quality.',
    'features.upscale.title': 'AI Upscaling',
    'features.upscale.desc': 'Enhance image resolution and clarity using advanced AI algorithms directly in your browser.',
    

    'donation.title': 'Support Our Project',
    'donation.desc': 'Your contributions help us keep the servers running and develop new features.',
    'donation.amountLabel': 'Amount (ETB)',
    'donation.bankLabel': 'Select Payment Method',
    'donation.accountLabel': 'Account Number',
    'donation.btn': "I've Donated",
    'donation.thanks': 'Thank You!',
    'donation.thanksDesc': 'Your donation of {amount} Birr has been noted. We truly appreciate your support!',
    'donation.back': 'Back to Editor',
    

    'ad.sponsored': 'Sponsored',
    'ad.title': 'Unlock Premium Features Today',
    'ad.desc': 'Support our platform and get access to high-fidelity AI upscaling and unlimited batch processing.',
    'ad.btn': 'Learn More',
    

    'pricing.title': 'Simple, Transparent Pricing',
    'pricing.desc': 'Choose the plan that fits your workflow. No hidden fees.',
    'pricing.comingSoon': 'Coming Soon',
    'pricing.free.title': 'Basic',
    'pricing.free.price': 'Free',
    'pricing.free.desc': 'For casual users',
    'pricing.free.feat1': 'Basic optimization',
    'pricing.free.feat2': 'Single image process',
    'pricing.free.feat3': 'Standard formats',
    'pricing.pro.title': 'Pro',
    'pricing.pro.price': '999 ETB',
    'pricing.pro.priceSub': '/month',
    'pricing.pro.desc': 'For professionals',
    'pricing.pro.feat1': 'AI-driven upscaling',
    'pricing.pro.feat2': 'Unlimited batch processing',
    'pricing.pro.feat3': 'Priority support',
    'pricing.pro.feat4': 'Advanced formats (AVIF)',
    'pricing.ent.title': 'Enterprise',
    'pricing.ent.price': '2999 ETB',
    'pricing.ent.priceSub': '/month',
    'pricing.ent.desc': 'For power users & teams',
    'pricing.ent.feat1': 'Everything in Pro',
    'pricing.ent.feat2': 'Advanced Video optimization',
    'pricing.ent.feat3': 'API Access (Next.js/React)',
    'pricing.ent.feat4': 'Custom watermarking',
    'pricing.ent.feat5': 'Unlimited cloud storage',
    'pricing.cta.free': 'Current Plan',
    'pricing.cta.pro': 'Upgrade to Pro',
    'pricing.cta.ent': 'Contact Sales',
    

    'footer.rights': 'All rights reserved.',
    'footer.builtBy': 'Built with focus by',
    'footer.privacy': 'Privacy',
    'footer.terms': 'Terms',
    

    'privacy.title': 'Privacy Policy',
    'terms.title': 'Terms of Service',
    'lastUpdated': 'Last updated',
    

    'privacy.intro.title': '1. Introduction',
    'privacy.intro.desc': 'At ZemenPix, we take your privacy seriously. This Privacy Policy explains how Pixel Bet ("we", "us", or "our") collects, uses, and protects your information when you use our image optimization services.',
    'privacy.local.title': '2. Local Processing',
    'privacy.local.desc': 'Important: Our application processes all images locally in your browser. We do not upload your images to any servers. Your visual data remains entirely on your device and is never stored or seen by us.',
    'privacy.collect.title': '3. Information We Collect',
    'privacy.collect.desc': 'We may collect minimal usage statistics to improve our service, such as:',
    'privacy.collect.item1': 'Compression ratios achieved',
    'privacy.collect.item2': 'Preferred image formats',
    'privacy.collect.item3': 'Device type (mobile/desktop)',
    'privacy.contact.title': '4. Contact Information',
    'privacy.contact.desc': 'If you have any questions or concerns regarding this Privacy Policy, please contact us:',
    'privacy.ceo': 'Pixel Bet is led by Abel Assefa, CEO. We are committed to digital privacy and high-quality software development.',


    'terms.intro.title': '1. Acceptance of Terms',
    'terms.intro.desc': 'By accessing and using ZemenPix, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you must not use our service.',
    'terms.use.title': '2. Use of Service',
    'terms.use.desc': 'ZemenPix provides browser-based image optimization. You are responsible for the content you process. Since all processing happens locally, we do not monitor or control the images you optimize.',
    'terms.ip.title': '3. Intellectual Property',
    'terms.ip.desc': 'The software, design, and branding of ZemenPix are the exclusive property of Pixel Bet. You may not reproduce, distribute, or create derivative works without our express permission.',
    'terms.disclaimer.title': '4. Disclaimer of Warranties',
    'terms.disclaimer.desc': 'The service is provided "as is" without any warranties. Pixel Bet and its CEO, Abel Assefa, are not liable for any data loss or damages arising from the use of this tool.',
    'terms.law.title': '5. Governing Law',
    'terms.law.desc': 'These terms are governed by and construed in accordance with the laws of Ethiopia, without regard to its conflict of law principles.',
    'terms.footer.company': 'Company Information',
    'terms.footer.contact': 'Contact',
    'terms.footer.ceo': 'CEO: Abel Assefa',
    'terms.footer.location': 'Addis Ababa, Ethiopia',
    'terms.footer.inquiry': 'For inquiries:',
    'terms.footer.support': 'Support:'
  },
  am: {

    'nav.features': 'አገልግሎት',
    'nav.github': 'GitHub',
    'nav.pricing': 'የሂሳብ ተመን',
    'nav.support': 'ፕሮጀክቱን ይደግፉ',
    

    'hero.title.top': 'ትንሽ የምስል መጠን,',
    'hero.title.bottom': 'አስገራሚ የምስል ጥራት',
    'hero.subtitle': 'ምስሎችዎን ጥራታቸውን ሳይቀንሱ እና መጠን ሳይጨምሩ በጥሩ ሁኔታ ያሳንሱ እና ጥራቱን ያሳድጉ። ፈጣን፣ ደህንነቱ የተጠበቀ እና ሙሉ በሙሉ በእርስዎ ብሮውዘር ላይ የሚሰራ።',
    'hero.donate': 'ፕሮጀክቱን ይደግፉ',
    'hero.getStarted': 'ይጀምሩ',
    

    'tool.dropzone.title': 'ምስልዎን እዚህ ያስገቡ',
    'tool.dropzone.subtitle': 'ወይም በመሣሪያው ላይ ይፈልጉ',
    'tool.maxWidth': 'ከፍተኛ ስፋት',
    'tool.width': 'ስፋት',
    'tool.sharpen': 'ብልህ ማሳመሪያ (Smart Sharpening)',
    'tool.download': 'አውርድ',
    'tool.optimizing': 'በማመቻቸት ላይ...',
    

    'features.fast.title': 'በጣም ፈጣን',
    'features.fast.desc': 'ማሳነሱ ወዲያውኑ በእርስዎ ብሮውዘር ላይ ይከናወናል። ወደ ሰርቨር መላክ ስለሌለ ምንም መዘግየት የለም።',
    'features.privacy.title': 'ለግል መረጃ ቅድሚያ',
    'features.privacy.desc': 'ምስሎችዎ መቼም ከመሣሪያዎ አይወጡም። ሁሉም ስራዎች በብሮውዘርዎ ውስጥ በ WebAssembly በኩል ይከናወናሉ።',
    'features.smart.title': 'ብልህ ማመቻቻ',
    'features.smart.desc': 'ብልህ አልጎሪዝም የምስል ጥራትን ሳይቀንስ መጠኑን እስከ 80% ይቀንሳል።',
    'features.upscale.title': 'AI ማሳደጊያ (Upscaling)',
    'features.upscale.desc': 'የምስሉን ጥራት እና መጠን በላቁ AI አልጎሪዝም በብሮውዘርዎ ላይ በቀጥታ ያሳድጉ።',
    

    'donation.title': 'ፕሮጀክታችንን ይደግፉ',
    'donation.desc': 'የእርስዎ ድጋፍ ሰርቨሮችን ለማስኬድ እና አዳዲስ ባህሪዎችን ለማልማት ይረዳናል።',
    'donation.amountLabel': 'መጠን (ETB)',
    'donation.bankLabel': 'የመክፈያ ዘዴ ይምረጡ',
    'donation.accountLabel': 'የሂሳብ ቁጥር',
    'donation.btn': "ለግሻለሁ",
    'donation.thanks': 'እናመሰግናለን!',
    'donation.thanksDesc': 'የእርስዎ {amount} ብር ልገሳ ተመዝግቧል። ለድጋፍዎ በጣም እናመሰግናለን!',
    'donation.back': 'ወደ ኤዲተሩ ይመለሱ',
    

    'ad.sponsored': 'ማስታወቂያ',
    'ad.title': 'ዛሬ የፕሪሚየም ባህሪዎችን ያግኙ',
    'ad.desc': 'የእኛን ፕላትፎርም ይደግፉ እና ከፍተኛ ጥራት ያለው የ AI ምስል ማሳደጊያ እና ገደብ የለሽ ስራዎችን ያግኙ።',
    'ad.btn': 'ተጨማሪ ይወቁ',
    

    'pricing.title': 'ግልጽ የዋጋ ዝርዝር',
    'pricing.desc': 'ለስራዎ የሚመቸውን አማራጭ ይምረጡ። ምንም የተደበቀ ክፍያ የለም።',
    'pricing.comingSoon': 'በቅርቡ ይጠብቁ',
    'pricing.free.title': 'መሰረታዊ',
    'pricing.free.price': 'በነጻ',
    'pricing.free.desc': 'ለነጻ ተጠቃሚዎች',
    'pricing.free.feat1': 'መሰረታዊ ማመቻቻ',
    'pricing.free.feat2': 'አንድ ምስል በአንድ ጊዜ',
    'pricing.free.feat3': 'መደበኛ አይነቶች',
    'pricing.pro.title': 'ፕሮ',
    'pricing.pro.price': '999 ብር',
    'pricing.pro.priceSub': '/በወር',
    'pricing.pro.desc': 'ለባለሙያዎች',
    'pricing.pro.feat1': 'በ AI የታገዘ ማሳደጊያ',
    'pricing.pro.feat2': 'ያልተገደበ የቡድን ስራ',
    'pricing.pro.feat3': 'የቅድሚያ ድጋፍ',
    'pricing.pro.feat4': 'የላቁ የምስል አይነቶች (AVIF)',
    'pricing.ent.title': 'ኢንተርፕራይዝ',
    'pricing.ent.price': '2999 ብር',
    'pricing.ent.priceSub': '/በወር',
    'pricing.ent.desc': 'ለትላልቅ ድርጅቶች እና ቡድኖች',
    'pricing.ent.feat1': 'በፕሮ ውስጥ ያሉ ሁሉንም',
    'pricing.ent.feat2': 'የላቀ የቪዲዮ ማመቻቻ',
    'pricing.ent.feat3': 'የ API አገልግሎት',
    'pricing.ent.feat4': 'የራስዎ የውሃ ምልክት',
    'pricing.ent.feat5': 'ያልተገደበ የክላውድ ማከማቻ',
    'pricing.cta.free': 'የአሁኑ አማራጭ',
    'pricing.cta.pro': 'ወደ ፕሮ ይለውጡ',
    'pricing.cta.ent': 'ሽያጭ ያግኙ',
    

    'footer.rights': 'መብቱ በህግ የተጠበቀ ነው።',
    'footer.builtBy': 'በጥንቃቄ የሰራው',
    'footer.privacy': 'የግል መረጃ ጥበቃ',
    'footer.terms': 'የአጠቃቀም ደንቦች',
    

    'privacy.title': 'የግል መረጃ ጥበቃ',
    'terms.title': 'የአጠቃቀም ደንቦች',
    'lastUpdated': 'ለመጨረሻ ጊዜ የተሻሻለው',


    'privacy.intro.title': '1. መግቢያ',
    'privacy.intro.desc': 'በ ZemenPix የእርስዎን ግላዊነት በቁም ነገር እንመለከተዋለን። ይህ የግላዊነት ፖሊሲ የእኛን የምስል ማመቻቻ አገልግሎቶችን ሲጠቀሙ PixelBet Studio ("እኛ" ወይም "የእኛ") የእርስዎን መረጃ እንዴት እንደሚሰበስብ፣ እንደሚጠቀም እና እንደሚጠብቅ ያብራራል።',
    'privacy.local.title': '2. የአገር ውስጥ ሂደት',
    'privacy.local.desc': 'አስፈላጊ፡ መተግበሪያችን ሁሉንም ምስሎች በእርስዎ ብሮውዘር ላይ ያከናውናል። ምስሎችዎን ወደ የትኛውም ሰርቨር አንልክም። የእርስዎ ምስል መረጃ ሙሉ በሙሉ በእርስዎ መሣሪያ ላይ ይቆያል እና በእኛ መቼም አይከማችም ወይም አይታይም።',
    'privacy.collect.title': '3. የምንሰበስበው መረጃ',
    'privacy.collect.desc': 'አገልግሎታችንን ለማሻሻል አነስተኛ የአጠቃቀም ስታቲስቲክስን ልንሰበስብ እንችላለን፣ ለምሳሌ፡',
    'privacy.collect.item1': 'የተገኘው የማሳነሻ መጠን',
    'privacy.collect.item2': 'ተመራጭ የምስል አይነቶች',
    'privacy.collect.item3': 'የመሣሪያ አይነት (ሞባይል/ዴስክቶፕ)',
    'privacy.contact.title': '4. የእውቂያ መረጃ',
    'privacy.contact.desc': 'የዚህን የግላዊነት ፖሊሲ በተመለከተ ማንኛውም ጥያቄ ወይም ስጋት ካለዎት እባክዎ ያነጋግሩን፡',
    'privacy.ceo': 'ፒክስል ቤትን የሚመራው አቤል አሰፋ (CEO) ነው። ለዲጂታል ግላዊነት እና ለከፍተኛ ጥራት የሶፍትዌር ልማት ቁርጠኞች ነን።',


    'terms.intro.title': '1. ደንቦችን መቀበል',
    'terms.intro.desc': 'ZemenPix-ን በመጠቀም በእነዚህ የአጠቃቀም ደንቦች ለመገዛት ተስማምተዋል። በማንኛውም የእነዚህ ደንቦች አካል ካልተስማሙ አገልግሎቱን መጠቀም የለብዎትም።',
    'terms.use.title': '2. የአገልግሎቱ አጠቃቀም',
    'terms.use.desc': 'ZemenPix በብሮውዘር ላይ የተመሰረተ የምስል ማመቻቸት ያቀርባል። ለሚያከናውኑት ይዘት እርስዎ ተጠያቂ ነዎት። ሁሉም ሂደቶች በአገር ውስጥ ስለሚከናወኑ የሚያመቻቹትን ምስሎች አንቆጣጠርም።',
    'terms.ip.title': '3. የአእምሮአዊ ንብረት',
    'terms.ip.desc': 'የ ZemenPix ሶፍትዌር፣ ዲዛይን እና ብራንዲንግ PixelBet Studio ብቸኛ ንብረት ናቸው። ያለእኛ ግልጽ ፈቃድ ማባዛት ወይም ማሰራጨት አይችሉም።',
    'terms.disclaimer.title': '4. የዋስትና ማስተባበያ',
    'terms.disclaimer.desc': 'አገልግሎቱ "ባለበት ሁኔታ" ያለ ምንም ዋስትና ይሰጣል። PixelBet Studio እና የኩባንያው መሪ አቤል አሰፋ ይህንን መሳሪያ በመጠቀም ለሚደርስ ማንኛውም የመረጃ መጥፋት ወይም ጉዳት ተጠያቂ አይደሉም።',
    'terms.law.title': '5. የሚተዳደርበት ህግ',
    'terms.law.desc': 'እነዚህ ደንቦች በኢትዮጵያ ህጎች የሚተዳደሩ እና የሚተረጎሙ ናቸው።',
    'terms.footer.company': 'የኩባንያ መረጃ',
    'terms.footer.contact': 'እውቂያ',
    'terms.footer.location': 'አዲስ አበባ፣ ኢትዮጵያ',
    'terms.footer.inquiry': 'ለጥያቄዎች፡',
    'terms.footer.support': 'ድጋፍ፡'
  }
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('app-language');
    return (saved as Language) || 'en';
  });

  useEffect(() => {
    localStorage.setItem('app-language', language);
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string) => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
