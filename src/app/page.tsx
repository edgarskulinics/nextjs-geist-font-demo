"use client";

import { useState } from 'react';
import DocumentForm from '@/components/DocumentFormComplete';
import PdfPreviewAdvanced from '@/components/PdfPreviewAdvanced';
import Settings from '@/components/Settings';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export interface DocumentData {
  // Dokumenta pamata daļa
  title: string;
  date: string;
  location: string;
  actNumber: string;
  companyLogo?: string; // Base64 logo
  documentType?: string;
  priority?: string;
  deadline?: string;
  category?: string;
  tags?: string[];
  notes?: string;
  totalValue?: number;
  currency?: string;
  status?: string;
  createdBy?: string;
  lastModified?: string;

  // Puses
  handoverParty: {
    name: string;
    registrationNumber: string;
    address: string;
    representative: {
      name: string;
      position: string;
    };
  };
  receivingParty: {
    name: string;
    registrationNumber: string;
    address: string;
    representative: {
      name: string;
      position: string;
    };
  };
  contractReference: string;

  // Nododamās lietas
  items: Array<{
    name: string;
    manufacturer: string;
    model: string;
    serialNumber: string;
    components: string;
    quantity: number;
    condition: string;
    defects: string;
    value?: number;
    currency?: string;
    category?: string;
    warranty?: string;
    notes?: string;
  }>;

  // Papildu informācija
  warranty: string;
  documents: string;
  specialConditions: string;
  responsibility: string;

  // Pielikumi
  attachments: string[];

  // Elektroniskais paraksts
  useElectronicSignature: boolean;
}

export interface SavedParty {
  id: string;
  name: string;
  registrationNumber: string;
  address: string;
  representative: {
    name: string;
    position: string;
  };
  createdAt: string;
  category?: string;
  tags?: string[];
}

export default function Home() {
  const [documentData, setDocumentData] = useState<DocumentData>({
    title: "Pieņemšanas–nodošanas akts",
    date: new Date().toISOString().split('T')[0],
    location: "",
    actNumber: "",
    companyLogo: "",
    handoverParty: {
      name: "",
      registrationNumber: "",
      address: "",
      representative: { name: "", position: "" }
    },
    receivingParty: {
      name: "",
      registrationNumber: "",
      address: "",
      representative: { name: "", position: "" }
    },
    contractReference: "",
    items: [{
      name: "",
      manufacturer: "",
      model: "",
      serialNumber: "",
      components: "",
      quantity: 1,
      condition: "",
      defects: ""
    }],
    warranty: "",
    documents: "",
    specialConditions: "",
    responsibility: "",
    attachments: [],
    useElectronicSignature: false
  });

  const [settings, setSettings] = useState({
    smtpHost: "",
    smtpPort: 587,
    smtpUser: "",
    smtpPassword: "",
    defaultSender: ""
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto py-8 px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Pieņemšanas-Nodošanas Aktu Sistēma
          </h1>
          <p className="text-lg text-gray-600">
            Profesionāla dokumentu pārvaldības sistēma ar reāllaika PDF ģenerēšanu
          </p>
        </div>
        
        <Tabs defaultValue="document" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="document" className="text-lg py-3">
              📝 Dokumenta Izveide
            </TabsTrigger>
            <TabsTrigger value="preview" className="text-lg py-3">
              📄 PDF Priekšskatījums
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-lg py-3">
              ⚙️ Iestatījumi
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="document" className="mt-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold text-gray-800">Dokumenta Dati</h2>
                  <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    Uzlabotā versija
                  </div>
                </div>
                <DocumentForm 
                  data={documentData} 
                  onChange={setDocumentData} 
                />
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold text-gray-800">Tiešsaistes Priekšskatījums</h2>
                  <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    Reāllaiks
                  </div>
                </div>
              <PdfPreviewAdvanced data={documentData} />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="preview" className="mt-6">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-gray-800">Pilna PDF Priekšskatījums</h2>
                <div className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                  Profesionāls formāts
                </div>
              </div>
              <PdfPreviewAdvanced data={documentData} fullSize={true} />
            </div>
          </TabsContent>
          
          <TabsContent value="settings" className="mt-6">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-gray-800">Sistēmas Iestatījumi</h2>
                <div className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                  SMTP konfigurācija
                </div>
              </div>
              <Settings settings={settings} onChange={setSettings} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
