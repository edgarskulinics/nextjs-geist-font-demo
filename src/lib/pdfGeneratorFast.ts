import jsPDF from 'jspdf';
import { DocumentData } from '@/app/page';

// Ātrs un optimizēts PDF ģenerētājs
export class FastPDFGenerator {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number = 20;
  private yPos: number = 20;
  private lineHeight: number = 6;

  // Krāsu definīcijas
  private colors = {
    primary: [0, 51, 102] as [number, number, number],
    secondary: [70, 130, 180] as [number, number, number],
    text: [33, 37, 41] as [number, number, number],
    lightGray: [248, 249, 250] as [number, number, number],
    border: [200, 200, 200] as [number, number, number]
  };

  constructor() {
    this.doc = new jsPDF('p', 'mm', 'a4');
    this.pageWidth = this.doc.internal.pageSize.width;
    this.pageHeight = this.doc.internal.pageSize.height;
    this.doc.setFont('helvetica');
  }

  // Pārbauda lapas beigas
  private checkPageBreak(requiredSpace: number = 20): void {
    if (this.yPos + requiredSpace > this.pageHeight - 30) {
      this.doc.addPage();
      this.yPos = this.margin;
    }
  }

  // Teksta pievienošana
  private addText(
    text: string,
    options: {
      fontSize?: number;
      fontStyle?: 'normal' | 'bold' | 'italic';
      align?: 'left' | 'center' | 'right';
      color?: [number, number, number];
      maxWidth?: number;
    } = {}
  ): void {
    if (!text) return;

    const {
      fontSize = 11,
      fontStyle = 'normal',
      align = 'left',
      color = this.colors.text,
      maxWidth = this.pageWidth - 2 * this.margin
    } = options;

    this.checkPageBreak();

    this.doc.setFontSize(fontSize);
    this.doc.setFont('helvetica', fontStyle);
    this.doc.setTextColor(color[0], color[1], color[2]);

    let xPos = this.margin;
    
    // Teksta sadalīšana rindās, ja nepieciešams
    const lines = this.doc.splitTextToSize(text, maxWidth);
    
    for (const line of lines) {
      this.checkPageBreak();
      
      if (align === 'center') {
        const textWidth = this.doc.getTextWidth(line);
        xPos = (this.pageWidth - textWidth) / 2;
      } else if (align === 'right') {
        const textWidth = this.doc.getTextWidth(line);
        xPos = this.pageWidth - this.margin - textWidth;
      } else {
        xPos = this.margin;
      }
      
      this.doc.text(line, xPos, this.yPos);
      this.yPos += this.lineHeight;
    }
  }

  // Tabulas pievienošana
  private addTable(headers: string[], rows: string[][], fontSize: number = 10): void {
    const tableWidth = this.pageWidth - 2 * this.margin;
    const colWidth = tableWidth / headers.length;
    const rowHeight = 8;

    this.checkPageBreak(rowHeight * (rows.length + 2));

    // Tabulas galvene
    this.doc.setFillColor(this.colors.primary[0], this.colors.primary[1], this.colors.primary[2]);
    this.doc.setDrawColor(this.colors.border[0], this.colors.border[1], this.colors.border[2]);
    this.doc.rect(this.margin, this.yPos, tableWidth, rowHeight, 'FD');

    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(fontSize);
    this.doc.setFont('helvetica', 'bold');

    headers.forEach((header, index) => {
      const x = this.margin + index * colWidth + 2;
      const y = this.yPos + rowHeight / 2 + 2;
      this.doc.text(header, x, y);
    });

    this.yPos += rowHeight;

    // Tabulas rindas
    this.doc.setTextColor(this.colors.text[0], this.colors.text[1], this.colors.text[2]);
    this.doc.setFont('helvetica', 'normal');

    rows.forEach((row, rowIndex) => {
      const bgColor = rowIndex % 2 === 0 ? [255, 255, 255] : this.colors.lightGray;
      
      this.doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
      this.doc.rect(this.margin, this.yPos, tableWidth, rowHeight, 'FD');

      row.forEach((cell, cellIndex) => {
        const x = this.margin + cellIndex * colWidth + 2;
        const y = this.yPos + rowHeight / 2 + 2;
        
        // Teksta saīsināšana, ja nepieciešams
        let cellText = cell || '';
        const maxCellWidth = colWidth - 4;
        
        while (this.doc.getTextWidth(cellText) > maxCellWidth && cellText.length > 0) {
          cellText = cellText.slice(0, -1);
        }
        
        this.doc.text(cellText, x, y);
      });

      this.yPos += rowHeight;
    });

    // Tabulas robežas
    this.doc.setDrawColor(this.colors.border[0], this.colors.border[1], this.colors.border[2]);
    this.doc.setLineWidth(0.5);
    
    // Horizontālās līnijas
    for (let i = 0; i <= rows.length + 1; i++) {
      const y = this.yPos - (rows.length + 1 - i) * rowHeight;
      this.doc.line(this.margin, y, this.margin + tableWidth, y);
    }
    
    // Vertikālās līnijas
    for (let i = 0; i <= headers.length; i++) {
      const x = this.margin + i * colWidth;
      this.doc.line(x, this.yPos - (rows.length + 1) * rowHeight, x, this.yPos);
    }

    this.yPos += 10;
  }

  // Logo pievienošana
  private addLogo(logoBase64: string): void {
    if (!logoBase64) return;
    
    try {
      const logoWidth = 40;
      const logoHeight = 25;
      
      this.doc.addImage(
        logoBase64,
        'JPEG',
        this.margin,
        this.yPos,
        logoWidth,
        logoHeight
      );
      
      this.yPos += logoHeight + 10;
    } catch (error) {
      console.warn('Logo pievienošanas kļūda:', error);
    }
  }

  // Līnijas pievienošana
  private addLine(color: [number, number, number] = this.colors.border, thickness: number = 0.5): void {
    this.doc.setDrawColor(color[0], color[1], color[2]);
    this.doc.setLineWidth(thickness);
    this.doc.line(this.margin, this.yPos, this.pageWidth - this.margin, this.yPos);
    this.yPos += 5;
  }

  // Atstarpes pievienošana
  private addSpace(space: number = 10): void {
    this.yPos += space;
  }

  // Galvenā PDF ģenerēšanas metode
  async generatePDF(data: DocumentData): Promise<Blob> {
    this.yPos = this.margin;

    // Logo (ja ir)
    if (data.companyLogo) {
      this.addLogo(data.companyLogo);
    }

    // Virsraksts
    this.addText(data.title.toUpperCase(), {
      fontSize: 20,
      fontStyle: 'bold',
      align: 'center',
      color: this.colors.primary
    });

    // Akta numurs
    if (data.actNumber) {
      this.addText(`Nr. ${data.actNumber}`, {
        fontSize: 14,
        fontStyle: 'bold',
        align: 'center',
        color: this.colors.secondary
      });
    }

    // Datums un vieta
    const dateLocation = `${data.date}${data.location ? `, ${data.location}` : ''}`;
    this.addText(dateLocation, {
      fontSize: 12,
      align: 'center'
    });

    this.addLine(this.colors.primary, 1);
    this.addSpace(10);

    // 1. LĪGUMSLĒDZĒJAS PUSES
    this.addText('1. LĪGUMSLĒDZĒJAS PUSES', {
      fontSize: 14,
      fontStyle: 'bold',
      color: this.colors.primary
    });

    this.addSpace(5);

    // Nododējs
    this.addText('1.1. NODODĒJS:', {
      fontSize: 12,
      fontStyle: 'bold',
      color: this.colors.secondary
    });

    if (data.handoverParty.name) {
      this.addText(`Nosaukums: ${data.handoverParty.name}`);
    }
    if (data.handoverParty.registrationNumber) {
      this.addText(`Reģ. Nr.: ${data.handoverParty.registrationNumber}`);
    }
    if (data.handoverParty.address) {
      this.addText(`Adrese: ${data.handoverParty.address}`);
    }
    if (data.handoverParty.representative.name || data.handoverParty.representative.position) {
      const rep = [data.handoverParty.representative.name, data.handoverParty.representative.position]
        .filter(Boolean).join(', ');
      this.addText(`Pārstāvis: ${rep}`);
    }

    this.addSpace(8);

    // Pieņēmējs
    this.addText('1.2. PIEŅĒMĒJS:', {
      fontSize: 12,
      fontStyle: 'bold',
      color: this.colors.secondary
    });

    if (data.receivingParty.name) {
      this.addText(`Nosaukums: ${data.receivingParty.name}`);
    }
    if (data.receivingParty.registrationNumber) {
      this.addText(`Reģ. Nr.: ${data.receivingParty.registrationNumber}`);
    }
    if (data.receivingParty.address) {
      this.addText(`Adrese: ${data.receivingParty.address}`);
    }
    if (data.receivingParty.representative.name || data.receivingParty.representative.position) {
      const rep = [data.receivingParty.representative.name, data.receivingParty.representative.position]
        .filter(Boolean).join(', ');
      this.addText(`Pārstāvis: ${rep}`);
    }

    this.addSpace(15);

    // 2. PAMATOJUMS
    if (data.contractReference) {
      this.addText('2. PAMATOJUMS', {
        fontSize: 14,
        fontStyle: 'bold',
        color: this.colors.primary
      });
      this.addSpace(5);
      this.addText(data.contractReference);
      this.addSpace(15);
    }

    // 3. NODODAMĀS LIETAS
    this.addText('3. NODODAMĀS/PIEŅEMAMĀS LIETAS', {
      fontSize: 14,
      fontStyle: 'bold',
      color: this.colors.primary
    });

    this.addSpace(10);

    // Lietu tabula
    if (data.items && data.items.length > 0) {
      const headers = ['Nr.', 'Nosaukums', 'Ražotājs', 'Modelis', 'Sērijas Nr.', 'Daudzums', 'Stāvoklis'];
      const rows = data.items.map((item, index) => [
        (index + 1).toString(),
        item.name || '',
        item.manufacturer || '',
        item.model || '',
        item.serialNumber || '',
        `${item.quantity} gab.`,
        item.condition || ''
      ]);

      this.addTable(headers, rows, 9);

      // Detalizēta informācija
      data.items.forEach((item, index) => {
        if (item.components || item.defects) {
          this.checkPageBreak(20);
          
          this.addText(`3.${index + 1}. ${item.name}`, {
            fontSize: 11,
            fontStyle: 'bold',
            color: this.colors.secondary
          });

          if (item.components) {
            this.addText(`Komplektācija: ${item.components}`, { fontSize: 10 });
          }

          if (item.defects) {
            this.addText(`Defekti: ${item.defects}`, { 
              fontSize: 10,
              color: [220, 53, 69] as [number, number, number]
            });
          }

          this.addSpace(5);
        }
      });
    }

    this.addSpace(15);

    // 4. PAPILDU INFORMĀCIJA
    if (data.warranty || data.documents || data.specialConditions || data.responsibility) {
      this.addText('4. PAPILDU INFORMĀCIJA', {
        fontSize: 14,
        fontStyle: 'bold',
        color: this.colors.primary
      });

      this.addSpace(5);

      if (data.warranty) {
        this.addText('4.1. Garantija:', { fontSize: 11, fontStyle: 'bold' });
        this.addText(data.warranty, { fontSize: 10 });
        this.addSpace(5);
      }

      if (data.documents) {
        this.addText('4.2. Dokumenti:', { fontSize: 11, fontStyle: 'bold' });
        this.addText(data.documents, { fontSize: 10 });
        this.addSpace(5);
      }

      if (data.specialConditions) {
        this.addText('4.3. Īpašie nosacījumi:', { fontSize: 11, fontStyle: 'bold' });
        this.addText(data.specialConditions, { fontSize: 10 });
        this.addSpace(5);
      }

      if (data.responsibility) {
        this.addText('4.4. Atbildība:', { fontSize: 11, fontStyle: 'bold' });
        this.addText(data.responsibility, { fontSize: 10 });
        this.addSpace(5);
      }

      this.addSpace(15);
    }

    // 5. NOSLĒGUMA NOTEIKUMI
    this.addLine(this.colors.primary, 1);
    this.addSpace(10);

    this.addText('5. NOSLĒGUMA NOTEIKUMI', {
      fontSize: 14,
      fontStyle: 'bold',
      color: this.colors.primary
    });

    this.addSpace(5);

    const conclusions = [
      '5.1. Puses apliecina, ka mantas stāvoklis ir pārbaudīts un atbilst aprakstam.',
      '5.2. Pretenzijas pret nodoto mantu nav.',
      '5.3. Atbildība par mantu pāriet pieņēmējam.',
      '5.4. Akts sastādīts 2 eksemplāros.',
      '5.5. Akts stājas spēkā ar parakstīšanu.'
    ];

    conclusions.forEach(conclusion => {
      this.addText(conclusion, { fontSize: 10 });
    });

    this.addSpace(20);

    // PARAKSTI
    this.addLine(this.colors.primary, 1);
    this.addSpace(10);

    if (data.useElectronicSignature) {
      // Elektroniskais paraksts
      const electronicText = 'ŠIS DOKUMENTS IR PARAKSTĪTS AR DROŠU ELEKTRONISKO PARAKSTU UN SATUR LAIKA ZĪMOGU';
      
      this.doc.setFillColor(this.colors.primary[0], this.colors.primary[1], this.colors.primary[2]);
      this.doc.rect(this.margin + 10, this.yPos, this.pageWidth - 2 * this.margin - 20, 20, 'F');

      this.addText(electronicText, {
        fontSize: 10,
        fontStyle: 'bold',
        align: 'center',
        color: [255, 255, 255] as [number, number, number]
      });

      this.addSpace(10);

      const timestamp = new Date().toLocaleString('lv-LV');
      this.addText(`Laika zīmogs: ${timestamp}`, {
        fontSize: 9,
        align: 'center',
        color: this.colors.secondary
      });

    } else {
      // Fiziskie paraksti
      this.addText('PARAKSTI:', {
        fontSize: 12,
        fontStyle: 'bold',
        color: this.colors.primary
      });

      this.addSpace(15);

      // Parakstu tabula
      const signatureHeaders = ['NODODĒJS', 'PIEŅĒMĒJS'];
      const signatureRows = [
        ['', ''],
        ['', ''],
        [
          data.handoverParty.representative.name || '',
          data.receivingParty.representative.name || ''
        ],
        [
          data.handoverParty.representative.position || '',
          data.receivingParty.representative.position || ''
        ]
      ];

      // Parakstu līnijas
      const colWidth = (this.pageWidth - 2 * this.margin) / 2;
      
      this.doc.setDrawColor(this.colors.text[0], this.colors.text[1], this.colors.text[2]);
      this.doc.setLineWidth(0.5);
      
      // Kreisā paraksta līnija
      this.doc.line(this.margin + 20, this.yPos, this.margin + colWidth - 20, this.yPos);
      // Labā paraksta līnija  
      this.doc.line(this.pageWidth / 2 + 20, this.yPos, this.pageWidth - this.margin - 20, this.yPos);

      this.yPos += 10;

      // Parakstītāju vārdi
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'normal');

      if (data.handoverParty.representative.name) {
        this.doc.text(data.handoverParty.representative.name, this.margin + 20, this.yPos);
      }
      if (data.receivingParty.representative.name) {
        this.doc.text(data.receivingParty.representative.name, this.pageWidth / 2 + 20, this.yPos);
      }

      this.yPos += 5;

      // Amati
      if (data.handoverParty.representative.position) {
        this.doc.text(data.handoverParty.representative.position, this.margin + 20, this.yPos);
      }
      if (data.receivingParty.representative.position) {
        this.doc.text(data.receivingParty.representative.position, this.pageWidth / 2 + 20, this.yPos);
      }

      this.addSpace(15);
    }

    // Parakstīšanas datums
    this.addText(`Parakstīšanas datums: ${data.date}`, {
      fontSize: 10,
      align: 'center',
      color: this.colors.secondary
    });

    // Kājene
    this.yPos = this.pageHeight - 20;
    const timestamp = new Date().toLocaleString('lv-LV');
    this.addText(`Ģenerēts: ${timestamp}`, {
      fontSize: 8,
      align: 'center',
      color: [128, 128, 128] as [number, number, number]
    });

    return this.doc.output('blob');
  }
}

// Eksportējam ātro PDF ģenerēšanas funkciju
export async function generateFastPDF(data: DocumentData): Promise<Blob> {
  const generator = new FastPDFGenerator();
  return await generator.generatePDF(data);
}

// Akta numura ģenerēšana
export function generateActNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const time = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0');
  const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  
  return `AKT-${year}-${month}${day}-${time}-${random}`;
}
