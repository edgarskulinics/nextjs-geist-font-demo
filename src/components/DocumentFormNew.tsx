"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DocumentData, SavedParty } from '@/app/page';
import { generateActNumber } from '@/lib/pdfGenerator';

interface DocumentFormProps {
  data: DocumentData;
  onChange: (data: DocumentData) => void;
}

export default function DocumentFormNew({ data, onChange }: DocumentFormProps) {
  const [savedParties, setSavedParties] = useState<SavedParty[]>([]);
  const [logoPreview, setLogoPreview] = useState<string>('');

  // Ielādē saglabātās puses
  useEffect(() => {
    const saved = localStorage.getItem('savedParties');
    if (saved) {
      setSavedParties(JSON.parse(saved));
    }
  }, []);

  const updateData = (field: string, value: any) => {
    onChange({ ...data, [field]: value });
  };

  // Automātiska akta numura ģenerēšana
  const generateNewActNumber = () => {
    const newNumber = generateActNumber();
    updateData('actNumber', newNumber);
  };

  // Logo augšupielāde
  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        setLogoPreview(base64);
        updateData('companyLogo', base64);
      };
      reader.readAsDataURL(file);
    }
  };

  // Saglabā pusi
  const saveParty = (type: 'handover' | 'receiving') => {
    const party = type === 'handover' ? data.handoverParty : data.receivingParty;
    if (!party.name) return;

    const savedParty: SavedParty = {
      id: Date.now().toString(),
      ...party,
      createdAt: new Date().toISOString()
    };

    const updated = [...savedParties, savedParty];
    setSavedParties(updated);
    localStorage.setItem('savedParties', JSON.stringify(updated));
  };

  // Ielādē saglabāto pusi
  const loadSavedParty = (partyId: string, type: 'handover' | 'receiving') => {
    const party = savedParties.find(p => p.id === partyId);
    if (party) {
      const { id, createdAt, ...partyData } = party;
      if (type === 'handover') {
        updateData('handoverParty', partyData);
      } else {
        updateData('receivingParty', partyData);
      }
    }
  };

  // Dzēš saglabāto pusi
  const deleteSavedParty = (partyId: string) => {
    const updated = savedParties.filter(p => p.id !== partyId);
    setSavedParties(updated);
    localStorage.setItem('savedParties', JSON.stringify(updated));
  };

  const updatePartyData = (party: 'handoverParty' | 'receivingParty', field: string, value: any) => {
    if (field.includes('.')) {
      const [parentField, childField] = field.split('.');
      const currentParty = data[party];
      onChange({
        ...data,
        [party]: {
          ...currentParty,
          [parentField]: {
            ...(currentParty as any)[parentField],
            [childField]: value
          }
        }
      });
    } else {
      onChange({
        ...data,
        [party]: {
          ...data[party],
          [field]: value
        }
      });
    }
  };

  const updateItemData = (index: number, field: string, value: any) => {
    const newItems = [...data.items];
    newItems[index] = { ...newItems[index], [field]: value };
    onChange({ ...data, items: newItems });
  };

  const addItem = () => {
    onChange({
      ...data,
      items: [...data.items, {
        name: "",
        manufacturer: "",
        model: "",
        serialNumber: "",
        components: "",
        quantity: 1,
        condition: "",
        defects: ""
      }]
    });
  };

  const removeItem = (index: number) => {
    const newItems = data.items.filter((_, i) => i !== index);
    onChange({ ...data, items: newItems });
  };

  return (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto">
      {/* Uzņēmuma Logo */}
      <Card>
        <CardHeader>
          <CardTitle>Uzņēmuma Logo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="logo">Augšupielādēt Logo</Label>
            <Input
              id="logo"
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="mt-2"
            />
            {(logoPreview || data.companyLogo) && (
              <div className="mt-4">
                <img 
                  src={logoPreview || data.companyLogo} 
                  alt="Uzņēmuma logo" 
                  className="max-w-32 max-h-20 object-contain border rounded"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dokumenta pamata daļa */}
      <Card>
        <CardHeader>
          <CardTitle>Dokumenta Pamata Informācija</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Dokumenta Nosaukums</Label>
            <Input
              id="title"
              value={data.title}
              onChange={(e) => updateData('title', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Datums</Label>
              <Input
                id="date"
                type="date"
                value={data.date}
                onChange={(e) => updateData('date', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="actNumber">Akta Numurs</Label>
              <div className="flex gap-2">
                <Input
                  id="actNumber"
                  value={data.actNumber}
                  onChange={(e) => updateData('actNumber', e.target.value)}
                  placeholder="Piem.: AKT-2024-001"
                />
                <Button 
                  type="button" 
                  onClick={generateNewActNumber}
                  variant="outline"
                  size="sm"
                >
                  Ģenerēt
                </Button>
              </div>
            </div>
          </div>
          <div>
            <Label htmlFor="location">Vieta</Label>
            <Input
              id="location"
              value={data.location}
              onChange={(e) => updateData('location', e.target.value)}
              placeholder="Piem.: Rīga"
            />
          </div>
        </CardContent>
      </Card>

      {/* Nododējs ar saglabāšanas funkciju */}
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            Nododējs
            <div className="flex gap-2">
              <Select onValueChange={(value) => loadSavedParty(value, 'handover')}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Ielādēt saglabāto" />
                </SelectTrigger>
                <SelectContent>
                  {savedParties.map((party) => (
                    <SelectItem key={party.id} value={party.id}>
                      {party.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                onClick={() => saveParty('handover')} 
                variant="outline" 
                size="sm"
                disabled={!data.handoverParty.name}
              >
                Saglabāt
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="handover-name">Nosaukums/Vārds, Uzvārds</Label>
            <Input
              id="handover-name"
              value={data.handoverParty.name}
              onChange={(e) => updatePartyData('handoverParty', 'name', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="handover-reg">Reģistrācijas Numurs/Personas Kods</Label>
            <Input
              id="handover-reg"
              value={data.handoverParty.registrationNumber}
              onChange={(e) => updatePartyData('handoverParty', 'registrationNumber', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="handover-address">Juridiskā Adrese</Label>
            <Textarea
              id="handover-address"
              value={data.handoverParty.address}
              onChange={(e) => updatePartyData('handoverParty', 'address', e.target.value)}
            />
          </div>
          <Separator />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="handover-rep-name">Pārstāvja Vārds, Uzvārds</Label>
              <Input
                id="handover-rep-name"
                value={data.handoverParty.representative.name}
                onChange={(e) => updatePartyData('handoverParty', 'representative.name', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="handover-rep-position">Amats</Label>
              <Input
                id="handover-rep-position"
                value={data.handoverParty.representative.position}
                onChange={(e) => updatePartyData('handoverParty', 'representative.position', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pieņēmējs ar saglabāšanas funkciju */}
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            Pieņēmējs
            <div className="flex gap-2">
              <Select onValueChange={(value) => loadSavedParty(value, 'receiving')}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Ielādēt saglabāto" />
                </SelectTrigger>
                <SelectContent>
                  {savedParties.map((party) => (
                    <SelectItem key={party.id} value={party.id}>
                      {party.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                onClick={() => saveParty('receiving')} 
                variant="outline" 
                size="sm"
                disabled={!data.receivingParty.name}
              >
                Saglabāt
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="receiving-name">Nosaukums/Vārds, Uzvārds</Label>
            <Input
              id="receiving-name"
              value={data.receivingParty.name}
              onChange={(e) => updatePartyData('receivingParty', 'name', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="receiving-reg">Reģistrācijas Numurs/Personas Kods</Label>
            <Input
              id="receiving-reg"
              value={data.receivingParty.registrationNumber}
              onChange={(e) => updatePartyData('receivingParty', 'registrationNumber', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="receiving-address">Juridiskā Adrese</Label>
            <Textarea
              id="receiving-address"
              value={data.receivingParty.address}
              onChange={(e) => updatePartyData('receivingParty', 'address', e.target.value)}
            />
          </div>
          <Separator />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="receiving-rep-name">Pārstāvja Vārds, Uzvārds</Label>
              <Input
                id="receiving-rep-name"
                value={data.receivingParty.representative.name}
                onChange={(e) => updatePartyData('receivingParty', 'representative.name', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="receiving-rep-position">Amats</Label>
              <Input
                id="receiving-rep-position"
                value={data.receivingParty.representative.position}
                onChange={(e) => updatePartyData('receivingParty', 'representative.position', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Saglabāto pušu pārvaldība */}
      {savedParties.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Saglabātās Puses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {savedParties.map((party) => (
                <div key={party.id} className="flex justify-between items-center p-2 border rounded">
                  <div>
                    <span className="font-medium">{party.name}</span>
                    <span className="text-sm text-gray-500 ml-2">
                      ({new Date(party.createdAt).toLocaleDateString('lv-LV')})
                    </span>
                  </div>
                  <Button 
                    onClick={() => deleteSavedParty(party.id)} 
                    variant="destructive" 
                    size="sm"
                  >
                    Dzēst
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Līguma atsauce */}
      <Card>
        <CardHeader>
          <CardTitle>Līguma Atsauce</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="contract-ref">Pamatojums</Label>
            <Input
              id="contract-ref"
              value={data.contractReference}
              onChange={(e) => updateData('contractReference', e.target.value)}
              placeholder="Piem.: saskaņā ar līgumu Nr. 123 no 2024.01.15"
            />
          </div>
        </CardContent>
      </Card>

      {/* Nododamās lietas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            Nododamās/Pieņemamās Lietas
            <Button onClick={addItem} size="sm">
              Pievienot Lietu
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {data.items.map((item, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Lieta #{index + 1}</h4>
                {data.items.length > 1 && (
                  <Button 
                    onClick={() => removeItem(index)} 
                    variant="destructive" 
                    size="sm"
                  >
                    Dzēst
                  </Button>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nosaukums</Label>
                  <Input
                    value={item.name}
                    onChange={(e) => updateItemData(index, 'name', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Ražotājs</Label>
                  <Input
                    value={item.manufacturer}
                    onChange={(e) => updateItemData(index, 'manufacturer', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Modelis/Marka</Label>
                  <Input
                    value={item.model}
                    onChange={(e) => updateItemData(index, 'model', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Sērijas Numurs</Label>
                  <Input
                    value={item.serialNumber}
                    onChange={(e) => updateItemData(index, 'serialNumber', e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <Label>Komplekts</Label>
                <Textarea
                  value={item.components}
                  onChange={(e) => updateItemData(index, 'components', e.target.value)}
                  placeholder="Aprakstiet komplektā ietilpstošās daļas"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Skaits</Label>
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItemData(index, 'quantity', parseInt(e.target.value) || 1)}
                  />
                </div>
                <div>
                  <Label>Tehniskais Stāvoklis</Label>
                  <Input
                    value={item.condition}
                    onChange={(e) => updateItemData(index, 'condition', e.target.value)}
                    placeholder="Piem.: jauns, lietots, bojāts"
                  />
                </div>
              </div>
              
              <div>
                <Label>Defekti</Label>
                <Textarea
                  value={item.defects}
                  onChange={(e) => updateItemData(index, 'defects', e.target.value)}
                  placeholder="Aprakstiet defektus, ja tādi ir"
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Papildu informācija */}
      <Card>
        <CardHeader>
          <CardTitle>Papildu Informācija</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="warranty">Garantija</Label>
            <Textarea
              id="warranty"
              value={data.warranty}
              onChange={(e) => updateData('warranty', e.target.value)}
              placeholder="Garantijas nosacījumi"
            />
          </div>
          <div>
            <Label htmlFor="documents">Piederīgie Dokumenti</Label>
            <Textarea
              id="documents"
              value={data.documents}
              onChange={(e) => updateData('documents', e.target.value)}
              placeholder="Instrukcijas, sertifikāti, licences u.c."
            />
          </div>
          <div>
            <Label htmlFor="special-conditions">Īpašie Nosacījumi</Label>
            <Textarea
              id="special-conditions"
              value={data.specialConditions}
              onChange={(e) => updateData('specialConditions', e.target.value)}
              placeholder="Lietošanas ierobežojumi, atbildības sadalījums u.c."
            />
          </div>
          <div>
            <Label htmlFor="responsibility">Atbildība</Label>
            <Textarea
              id="responsibility"
              value={data.responsibility}
              onChange={(e) => updateData('responsibility', e.target.value)}
              placeholder="Atbildības sadalījums pēc nodošanas"
            />
          </div>
        </CardContent>
      </Card>

      {/* Elektroniskais paraksts */}
      <Card>
        <CardHeader>
          <CardTitle>Parakstīšanas Veids</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="electronic-signature"
              checked={data.useElectronicSignature}
              onCheckedChange={(checked) => updateData('useElectronicSignature', checked)}
            />
            <Label htmlFor="electronic-signature">
              Izmantot elektronisko parakstu
            </Label>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Ja atzīmēts, dokumentā tiks norādīts, ka tas parakstīts ar drošu elektronisko parakstu
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
