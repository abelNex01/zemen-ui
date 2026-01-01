import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, Crown, Trash2, Download, Shield } from 'lucide-react';
import { useProAccess } from '@/hooks/use-pro-access';
import { getPreferences, savePreferences, clearHistory } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { containerVariants, itemVariants } from '@/lib/animations';

export default function Settings() {
  const { isPro, licenseKey, daysRemaining, deactivatePro } = useProAccess();
  const [defaultQuality, setDefaultQuality] = useState(80);
  const [defaultFormat, setDefaultFormat] = useState('image/webp');
  const [autoDownload, setAutoDownload] = useState(false);
  const [sharpenEnabled, setSharpenEnabled] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    const prefs = await getPreferences();
    if (prefs) {
      setDefaultQuality(prefs.defaultQuality);
      setDefaultFormat(prefs.defaultFormat);
      setAutoDownload(prefs.autoDownload);
      setSharpenEnabled(prefs.sharpenEnabled);
    }
  };

  const handleSave = async () => {
    await savePreferences({
      defaultQuality,
      defaultFormat,
      autoDownload,
      sharpenEnabled
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClearData = async () => {
    await clearHistory();
    localStorage.removeItem('zemenpix-pro-status');
    window.location.reload();
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 max-w-2xl"
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">Customize your Pro experience</p>
      </motion.div>

      <motion.div variants={itemVariants} className="p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <Crown className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold">Pro Subscription</h3>
            <p className="text-sm text-muted-foreground">
              {daysRemaining} days remaining
            </p>
          </div>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">License Key</span>
            <span className="font-mono">{licenseKey || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status</span>
            <span className="text-green-500 font-medium">Active</span>
          </div>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-border space-y-6">
        <div className="flex items-center gap-2">
          <SettingsIcon className="w-5 h-5" />
          <h3 className="font-bold">Default Settings</h3>
        </div>

        <div className="space-y-6">
          <div>
            <Label className="text-sm">Default Quality: {defaultQuality}%</Label>
            <Slider
              value={[defaultQuality]}
              onValueChange={([v]) => setDefaultQuality(v)}
              min={10}
              max={100}
              step={5}
              className="mt-2"
            />
          </div>

          <div>
            <Label className="text-sm mb-2 block">Default Output Format</Label>
            <Select value={defaultFormat} onValueChange={setDefaultFormat}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="image/jpeg">JPEG</SelectItem>
                <SelectItem value="image/png">PNG</SelectItem>
                <SelectItem value="image/webp">WebP</SelectItem>
                <SelectItem value="image/avif">AVIF</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm">Auto-Download</Label>
              <p className="text-xs text-muted-foreground">Download images immediately after processing</p>
            </div>
            <Switch checked={autoDownload} onCheckedChange={setAutoDownload} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm">Smart Sharpening</Label>
              <p className="text-xs text-muted-foreground">Apply sharpening by default</p>
            </div>
            <Switch checked={sharpenEnabled} onCheckedChange={setSharpenEnabled} />
          </div>
        </div>

        <Button onClick={handleSave} className="w-full">
          {saved ? 'Saved!' : 'Save Settings'}
        </Button>
      </motion.div>

      <motion.div variants={itemVariants} className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-border space-y-4">
        <h3 className="font-bold flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Privacy & Data
        </h3>
        
        <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
          <p className="text-sm text-green-700 dark:text-green-400">
            ✓ Your images are processed locally and never uploaded to any server
          </p>
        </div>

        <div className="space-y-3">
          <Button 
            onClick={() => clearHistory()}
            variant="outline"
            className="w-full"
            icon={<Trash2 className="w-4 h-4" />}
          >
            Clear Processing History
          </Button>

          <Button 
            onClick={handleClearData}
            variant="outline"
            className="w-full text-destructive hover:text-destructive"
          >
            Clear All Data & Sign Out
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
