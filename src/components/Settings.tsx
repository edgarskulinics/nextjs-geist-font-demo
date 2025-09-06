"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { testEmailConfiguration } from '@/lib/emailService';

interface SettingsData {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  defaultSender: string;
}

interface SettingsProps {
  settings: SettingsData;
  onChange: (settings: SettingsData) => void;
}

export default function Settings({ settings, onChange }: SettingsProps) {
  const [localSettings, setLocalSettings] = useState<SettingsData>(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string>('');
  const [testStatus, setTestStatus] = useState<string>('');

  // Ielādē iestatījumus no localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('emailSettings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      setLocalSettings(parsed);
      onChange(parsed);
    }
  }, [onChange]);

  const updateSetting = (key: keyof SettingsData, value: string | number) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
  };

  const saveSettings = async () => {
    try {
      setIsSaving(true);
      setSaveStatus('Saglabā iestatījumus...');
      
      // Validācija
      if (!localSettings.smtpHost || !localSettings.smtpUser || !localSettings.smtpPassword) {
        setSaveStatus('Lūdzu, aizpildiet visus obligātos laukus');
        return;
      }

      // Saglabā localStorage
      localStorage.setItem('emailSettings', JSON.stringify(localSettings));
      
      // Atjaunina parent komponenti
      onChange(localSettings);
      
      setSaveStatus('Iestatījumi veiksmīgi saglabāti!');
      
      // Notīra statusu pēc 3 sekundēm
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      console.error('Kļūda iestatījumu saglabāšanā:', error);
      setSaveStatus('Kļūda iestatījumu saglabāšanā');
    } finally {
      setIsSaving(false);
    }
  };

  const testEmailSettings = async () => {
    try {
      setIsTesting(true);
      setTestStatus('Testē e-pasta konfigurāciju...');
      
      // Validācija
      if (!localSettings.smtpHost || !localSettings.smtpUser || !localSettings.smtpPassword) {
        setTestStatus('Lūdzu, aizpildiet visus obligātos laukus pirms testēšanas');
        return;
      }

      const isSuccess = await testEmailConfiguration(localSettings);
      
      if (isSuccess) {
        setTestStatus('E-pasta konfigurācija ir pareiza! Tests e-pasts nosūtīts.');
      } else {
        setTestStatus('E-pasta konfigurācijas tests neizdevās. Pārbaudiet iestatījumus.');
      }
      
      // Notīra statusu pēc 5 sekundēm
      setTimeout(() => setTestStatus(''), 5000);
    } catch (error) {
      console.error('Kļūda e-pasta testēšanā:', error);
      setTestStatus('Kļūda e-pasta konfigurācijas testēšanā');
    } finally {
      setIsTesting(false);
    }
  };

  const resetSettings = () => {
    const defaultSettings: SettingsData = {
      smtpHost: '',
      smtpPort: 587,
      smtpUser: '',
      smtpPassword: '',
      defaultSender: ''
    };
    
    setLocalSettings(defaultSettings);
    localStorage.removeItem('emailSettings');
    onChange(defaultSettings);
    setSaveStatus('Iestatījumi atiestatīti');
    setTimeout(() => setSaveStatus(''), 3000);
  };

  const exportSettings = () => {
    const dataStr = JSON.stringify(localSettings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'email-settings.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        setLocalSettings(imported);
        setSaveStatus('Iestatījumi importēti. Neaizmirstiet tos saglabāt!');
        setTimeout(() => setSaveStatus(''), 3000);
      } catch (error) {
        setSaveStatus('Kļūda iestatījumu importēšanā. Pārbaudiet faila formātu.');
      }
    };
    reader.readAsText(file);
    
    // Notīra input
    event.target.value = '';
  };

  return (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto">
      {/* E-pasta iestatījumi */}
      <Card>
        <CardHeader>
          <CardTitle>SMTP E-pasta Iestatījumi</CardTitle>
          <p className="text-sm text-gray-600">
            Konfigurējiet SMTP iestatījumus, lai varētu sūtīt dokumentus pa e-pastu
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="smtp-host">SMTP Serveris *</Label>
              <Input
                id="smtp-host"
                value={localSettings.smtpHost}
                onChange={(e) => updateSetting('smtpHost', e.target.value)}
                placeholder="smtp.gmail.com"
              />
            </div>
            <div>
              <Label htmlFor="smtp-port">SMTP Ports</Label>
              <Input
                id="smtp-port"
                type="number"
                value={localSettings.smtpPort}
                onChange={(e) => updateSetting('smtpPort', parseInt(e.target.value) || 587)}
                placeholder="587"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="smtp-user">E-pasta Adrese *</Label>
            <Input
              id="smtp-user"
              type="email"
              value={localSettings.smtpUser}
              onChange={(e) => updateSetting('smtpUser', e.target.value)}
              placeholder="jūsu.epasts@gmail.com"
            />
          </div>
          
          <div>
            <Label htmlFor="smtp-password">Parole/App Password *</Label>
            <Input
              id="smtp-password"
              type="password"
              value={localSettings.smtpPassword}
              onChange={(e) => updateSetting('smtpPassword', e.target.value)}
              placeholder="Jūsu e-pasta parole vai app password"
            />
          </div>
          
          <div>
            <Label htmlFor="default-sender">Noklusējuma Sūtītājs</Label>
            <Input
              id="default-sender"
              type="email"
              value={localSettings.defaultSender}
              onChange={(e) => updateSetting('defaultSender', e.target.value)}
              placeholder="Atstājiet tukšu, lai izmantotu e-pasta adresi"
            />
          </div>
          
          <Separator />
          
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={saveSettings}
              disabled={isSaving}
              className="flex-1 min-w-[120px]"
            >
              {isSaving ? 'Saglabā...' : 'Saglabāt Iestatījumus'}
            </Button>
            
            <Button 
              onClick={testEmailSettings}
              disabled={isTesting || !localSettings.smtpHost}
              variant="outline"
              className="flex-1 min-w-[120px]"
            >
              {isTesting ? 'Testē...' : 'Testēt E-pastu'}
            </Button>
          </div>
          
          {saveStatus && (
            <p className={`text-sm ${
              saveStatus.includes('veiksmīgi') || saveStatus.includes('importēti') || saveStatus.includes('atiestatīti')
                ? 'text-green-600' 
                : saveStatus.includes('Kļūda') 
                ? 'text-red-600' 
                : 'text-blue-600'
            }`}>
              {saveStatus}
            </p>
          )}
          
          {testStatus && (
            <p className={`text-sm ${
              testStatus.includes('pareiza') 
                ? 'text-green-600' 
                : testStatus.includes('neizdevās') || testStatus.includes('Kļūda')
                ? 'text-red-600' 
                : 'text-blue-600'
            }`}>
              {testStatus}
            </p>
          )}
        </CardContent>
      </Card>

      {/* SMTP konfigurācijas palīdzība */}
      <Card>
        <CardHeader>
          <CardTitle>SMTP Konfigurācijas Palīdzība</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Populāri SMTP iestatījumi:</h4>
            <div className="space-y-2 text-sm">
              <div className="bg-gray-50 p-3 rounded">
                <strong>Gmail:</strong><br />
                Serveris: smtp.gmail.com<br />
                Ports: 587<br />
                <em>Piezīme: Izmantojiet App Password, nevis parasto paroli</em>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <strong>Outlook/Hotmail:</strong><br />
                Serveris: smtp-mail.outlook.com<br />
                Ports: 587
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <strong>Yahoo:</strong><br />
                Serveris: smtp.mail.yahoo.com<br />
                Ports: 587 vai 465
              </div>
            </div>
          </div>
          
          <Separator />
          
          <div>
            <h4 className="font-semibold mb-2">Drošības piezīmes:</h4>
            <ul className="text-sm space-y-1 text-gray-600">
              <li>• Gmail: Ieslēdziet 2-faktoru autentifikāciju un izveidojiet App Password</li>
              <li>• Outlook: Iespējams, būs nepieciešams ieslēgt "Less secure app access"</li>
              <li>• Paroles tiek saglabātas lokāli jūsu pārlūkprogrammā</li>
              <li>• Nekad nedodiet savas paroles citiem</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Iestatījumu pārvaldība */}
      <Card>
        <CardHeader>
          <CardTitle>Iestatījumu Pārvaldība</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={exportSettings}
              variant="outline"
              className="flex-1 min-w-[120px]"
            >
              Eksportēt Iestatījumus
            </Button>
            
            <div className="flex-1 min-w-[120px]">
              <input
                type="file"
                accept=".json"
                onChange={importSettings}
                className="hidden"
                id="import-settings"
              />
              <Button 
                onClick={() => document.getElementById('import-settings')?.click()}
                variant="outline"
                className="w-full"
              >
                Importēt Iestatījumus
              </Button>
            </div>
            
            <Button 
              onClick={resetSettings}
              variant="destructive"
              className="flex-1 min-w-[120px]"
            >
              Atiestatīt Iestatījumus
            </Button>
          </div>
          
          <p className="text-xs text-gray-500">
            Eksportējiet iestatījumus, lai tos varētu izmantot citā ierīcē vai kā rezerves kopiju.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
