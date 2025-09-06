"use client";

import { useState } from 'react';
import DocumentForm from '@/components/DocumentForm';
import PdfPreview from '@/components/PdfPreview';
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
}

export default function Home() {
  const [documentData, setDocumentData] = useState<DocumentData>({
    title: "Pieņemšanas–nodošanas akts",
    date: new Date().toISOString().split('T')[0],
    location: "",
    actNumber: "",
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
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-900">
          Pieņemšanas-Nodošanas Aktu Sistēma
        </h1>
        
        <Tabs defaultValue="document" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="document">Dokumenta Izveide</TabsTrigger>
            <TabsTrigger value="preview">PDF Priekšskatījums</TabsTrigger>
            <TabsTrigger value="settings">Iestatījumi</TabsTrigger>
          </TabsList>
          
          <TabsContent value="document" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Dokumenta Dati</h2>
                <DocumentForm 
                  data={documentData} 
                  onChange={setDocumentData} 
                />
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Tiešsaistes Priekšskatījums</h2>
                <PdfPreview data={documentData} />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="preview" className="mt-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <PdfPreview data={documentData} fullSize={true} />
            </div>
          </TabsContent>
          
          <TabsContent value="settings" className="mt-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <Settings settings={settings} onChange={setSettings} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
