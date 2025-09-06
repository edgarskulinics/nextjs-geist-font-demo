"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { generateAdvancedPDF } from '@/lib/pdfGeneratorAdvanced';
import { sendEmail } from '@/lib/emailService';
import { DocumentData } from '@/app/page';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';

interface PdfPreviewProps {
  data: DocumentData;
  fullSize?: boolean;
}

// Jaunas funkcijas un uzlabojumi
interface PreviewSettings {
  zoom: number;
  theme: 'light' | 'dark' | 'sepia';
  showGrid: boolean;
  showRuler: boolean;
  autoRefresh: boolean;
  quality: 'low' | 'medium' | 'high' | 'ultra';
  watermark: boolean;
  annotations: boolean;
  comparison: boolean;
  fullscreen: boolean;
}

interface EmailSettings {
  subject: string;
  message: string;
  priority: 'low' | 'normal' | 'high';
  requestReceipt: boolean;
  encryptPdf: boolean;
  passwordProtect: boolean;
  password: string;
  expirationDate: string;
  multipleRecipients: string[];
  ccRecipients: string[];
  bccRecipients: string[];
}

interface AnalyticsData {
  generationTime: number;
  fileSize: number;
  pageCount: number;
  viewCount: number;
  downloadCount: number;
  emailCount: number;
  lastModified: Date;
  version: number;
}

export default function PdfPreview({ data, fullSize = false }: PdfPreviewProps) {
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [emailRecipient, setEmailRecipient] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [emailStatus, setEmailStatus] = useState<string>('');
  const [generationProgress, setGenerationProgress] = useState(0);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    generationTime: 0,
    fileSize: 0,
    pageCount: 0,
    viewCount: 0,
    downloadCount: 0,
    emailCount: 0,
    lastModified: new Date(),
    version: 1
  });
  
  // Jaunas funkcijas - Priekšskatījuma iestatījumi
  const [previewSettings, setPreviewSettings] = useState<PreviewSettings>({
    zoom: 100,
    theme: 'light',
    showGrid: false,
    showRuler: false,
    autoRefresh: true,
    quality: 'high',
    watermark: false,
    annotations: false,
    comparison: false,
    fullscreen: false
  });

  // Jaunas funkcijas - E-pasta iestatījumi
  const [emailSettings, setEmailSettings] = useState<EmailSettings>({
    subject: `Pieņemšanas-nodošanas akts Nr. ${data.actNumber || 'bez-numura'}`,
    message: 'Labdien!\n\nPievienoju pieņemšanas-nodošanas aktu.\n\nAr cieņu',
    priority: 'normal',
    requestReceipt: false,
    encryptPdf: false,
    passwordProtect: false,
    password: '',
    expirationDate: '',
    multipleRecipients: [],
    ccRecipients: [],
    bccRecipients: []
  });

  // Jaunas funkcijas - Versiju kontrole
  const [versions, setVersions] = useState<Array<{id: string, date: Date, changes: string}>>([]);
  const [currentVersion, setCurrentVersion] = useState<string>('latest');
  
  // Jaunas funkcijas - Komentāri un anotācijas
  const [comments, setComments] = useState<Array<{id: string, text: string, author: string, date: Date, page: number}>>([]);
  const [newComment, setNewComment] = useState('');
  
  // Jaunas funkcijas - Eksporta opcijas
  const [exportFormat, setExportFormat] = useState<'pdf' | 'docx' | 'html' | 'txt' | 'json'>('pdf');
  const [compressionLevel, setCompressionLevel] = useState<'none' | 'low' | 'medium' | 'high'>('medium');
  
  // Jaunas funkcijas - Drošības iestatījumi
  const [securitySettings, setSecuritySettings] = useState({
    allowPrint: true,
    allowCopy: true,
    allowModify: false,
    allowAnnotations: true,
    allowFormFilling: true,
    allowScreenReaders: true,
    allowAssembly: false,
    allowDegradedPrinting: true
  });

  const previewRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<number[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);

  // Ģenerē PDF priekšskatījumu reālajā laikā
  useEffect(() => {
    const generatePreview = async () => {
      try {
        setIsGenerating(true);
        const pdfBlob = await generatePDF(data);
        const url = URL.createObjectURL(pdfBlob);
        
        // Atbrīvo iepriekšējo URL
        if (pdfUrl) {
          URL.revokeObjectURL(pdfUrl);
        }
        
        setPdfUrl(url);
      } catch (error) {
        console.error('Kļūda PDF ģenerēšanā:', error);
      } finally {
        setIsGenerating(false);
      }
    };

    generatePreview();

    // Cleanup funkcija
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [data]);

  const handleDownload = async () => {
    try {
      const pdfBlob = await generatePDF(data);
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Pienemšanas-nodošanas-akts-${data.actNumber || 'bez-numura'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Kļūda PDF lejupielādē:', error);
    }
  };

  const handleSendEmail = async () => {
    if (!emailRecipient) {
      setEmailStatus('Lūdzu, ievadiet e-pasta adresi');
      return;
    }

    try {
      setIsSending(true);
      setEmailStatus('Sūta e-pastu...');
      
      const pdfBlob = await generatePDF(data);
      await sendEmail(emailRecipient, pdfBlob, data);
      
      setEmailStatus('E-pasts veiksmīgi nosūtīts!');
      setEmailRecipient('');
    } catch (error) {
      console.error('Kļūda e-pasta sūtīšanā:', error);
      setEmailStatus('Kļūda e-pasta sūtīšanā. Lūdzu, pārbaudiet iestatījumus.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* PDF Priekšskatījums */}
      <div 
        ref={previewRef}
        className={`border rounded-lg bg-white ${
          fullSize ? 'h-[80vh]' : 'h-96'
        } overflow-hidden relative`}
      >
        {isGenerating ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-600">Ģenerē PDF...</p>
            </div>
          </div>
        ) : pdfUrl ? (
          <iframe
            src={pdfUrl}
            className="w-full h-full"
            title="PDF Priekšskatījums"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">PDF priekšskatījums nav pieejams</p>
          </div>
        )}
      </div>

      {/* Darbību pogas */}
      <div className="flex flex-wrap gap-2">
        <Button 
          onClick={handleDownload}
          disabled={!pdfUrl || isGenerating}
          className="flex-1 min-w-[120px]"
        >
          Lejupielādēt PDF
        </Button>
      </div>

      {/* E-pasta sūtīšana */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Nosūtīt pa E-pastu</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="email-recipient">Saņēmēja E-pasta Adrese</Label>
            <Input
              id="email-recipient"
              type="email"
              value={emailRecipient}
              onChange={(e) => setEmailRecipient(e.target.value)}
              placeholder="piemers@epasts.lv"
            />
          </div>
          
          <Button 
            onClick={handleSendEmail}
            disabled={!emailRecipient || isSending || !pdfUrl}
            className="w-full"
          >
            {isSending ? 'Sūta...' : 'Nosūtīt E-pastu'}
          </Button>
          
          {emailStatus && (
            <p className={`text-sm ${
              emailStatus.includes('veiksmīgi') 
                ? 'text-green-600' 
                : emailStatus.includes('Kļūda') 
                ? 'text-red-600' 
                : 'text-blue-600'
            }`}>
              {emailStatus}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Dokumenta HTML priekšskatījums (rezerves variants) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dokumenta Saturs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-white p-6 border rounded text-sm space-y-4 max-h-96 overflow-y-auto">
            <div className="text-center">
              <h1 className="text-xl font-bold mb-2">{data.title}</h1>
              <p>Nr. {data.actNumber}</p>
              <p>{data.date}, {data.location}</p>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-semibold">Nododējs:</h3>
              <p>{data.handoverParty.name}</p>
              <p>Reģ. Nr.: {data.handoverParty.registrationNumber}</p>
              <p>{data.handoverParty.address}</p>
              {data.handoverParty.representative.name && (
                <p>Pārstāvis: {data.handoverParty.representative.name}, {data.handoverParty.representative.position}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <h3 className="font-semibold">Pieņēmējs:</h3>
              <p>{data.receivingParty.name}</p>
              <p>Reģ. Nr.: {data.receivingParty.registrationNumber}</p>
              <p>{data.receivingParty.address}</p>
              {data.receivingParty.representative.name && (
                <p>Pārstāvis: {data.receivingParty.representative.name}, {data.receivingParty.representative.position}</p>
              )}
            </div>
            
            {data.contractReference && (
              <div>
                <h3 className="font-semibold">Pamatojums:</h3>
                <p>{data.contractReference}</p>
              </div>
            )}
            
            <div>
              <h3 className="font-semibold">Nododamās lietas:</h3>
              {data.items.map((item, index) => (
                <div key={index} className="ml-4 mb-2">
                  <p><strong>{index + 1}. {item.name}</strong></p>
                  {item.manufacturer && <p>Ražotājs: {item.manufacturer}</p>}
                  {item.model && <p>Modelis: {item.model}</p>}
                  {item.serialNumber && <p>Sērijas Nr.: {item.serialNumber}</p>}
                  {item.quantity > 1 && <p>Skaits: {item.quantity}</p>}
                  {item.condition && <p>Stāvoklis: {item.condition}</p>}
                  {item.components && <p>Komplekts: {item.components}</p>}
                  {item.defects && <p>Defekti: {item.defects}</p>}
                </div>
              ))}
            </div>
            
            {data.useElectronicSignature && (
              <div className="text-center mt-8 p-4 border-2 border-gray-300">
                <p className="font-bold text-lg">
                  ŠIS DOKUMENTS PARAKSTĪTS AR DROŠU ELEKTRONISKO PARAKSTU UN SATUR LAIKA ZĪMOGU
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
