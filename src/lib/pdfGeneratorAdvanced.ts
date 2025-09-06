import jsPDF from 'jspdf';
import { DocumentData } from '@/app/page';

// Uzlabots latviešu valodas atbalsts ar pilnu Unicode tabulu
const latvianChars: { [key: string]: string } = {
  'ā': 'ā', 'č': 'č', 'ē': 'ē', 'ģ': 'ģ', 'ī': 'ī', 'ķ': 'ķ', 'ļ': 'ļ', 'ņ': 'ņ', 'š': 'š', 'ū': 'ū', 'ž': 'ž',
  'Ā': 'Ā', 'Č': 'Č', 'Ē': 'Ē', 'Ģ': 'Ģ', 'Ī': 'Ī', 'Ķ': 'Ķ', 'Ļ': 'Ļ', 'Ņ': 'Ņ', 'Š': 'Š', 'Ū': 'Ū', 'Ž': 'Ž'
};

// Profesionālu krāsu paletes
const colorPalettes = {
  corporate: {
    primary: [0, 51, 102],      // Tumši zils
    secondary: [70, 130, 180],   // Gaiši zils
    accent: [220, 20, 60],       // Sarkans
    text: [33, 37, 41],          // Tumši pelēks
    lightGray: [248, 249, 250],  // Gaiši pelēks
    success: [40, 167, 69],      // Zaļš
    warning: [255, 193, 7],      // Dzeltens
    danger: [220, 53, 69]        // Sarkans
  }
};

// Uzlabots teksta apstrādes funkcijas
function processLatvianText(text: string): string {
  if (!text) return '';
  
  // Saglabājam latviešu burtus
  return text
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    .replace(/…/g, '...')
    .replace(/–/g, '-')
    .replace(/—/g, '-');
}

// Profesionāla PDF ģenerēšanas klase
export class AdvancedPDFGenerator {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number = 20;
  private yPosition: number = 20;
  private colors = colorPalettes.corporate;
  private currentPage: number = 1;
  private totalPages: number = 0;
  private headerHeight: number = 40;
  private footerHeight: number = 20;
  private logoData: string | null = null;
  private logoWidth: number = 0;
  private logoHeight: number = 0;

  constructor() {
    this.doc = new jsPDF('p', 'mm', 'a4');
    this.pageWidth = this.doc.internal.pageSize.width;
    this.pageHeight = this.doc.internal.pageSize.height;
  }

  // Logo ielāde un apstrāde
  async loadLogo(logoBase64: string): Promise<void> {
    if (!logoBase64) return;
    
    try {
      this.logoData = logoBase64;
      
      // Aprēķinām logo izmērus
      const img = new Image();
      img.src = logoBase64;
      
      await new Promise((resolve, reject) => {
        img.onload = () => {
          const maxWidth = 50;
          const maxHeight = 30;
          const ratio = Math.min(maxWidth / img.width, maxHeight / img.height);
          
          this.logoWidth = img.width * ratio;
          this.logoHeight = img.height * ratio;
          resolve(void 0);
        };
        img.onerror = reject;
      });
    } catch (error) {
      console.warn('Logo ielādes kļūda:', error);
      this.logoData = null;
    }
  }

  // Uzlabota teksta pievienošana
  private addText(
    text: string, 
    options: {
      fontSize?: number;
      fontStyle?: 'normal' | 'bold' | 'italic';
      align?: 'left' | 'center' | 'right';
      color?: number[];
      x?: number;
      y?: number;
      maxWidth?: number;
      lineHeight?: number;
    } = {}
  ): void {
    const {
      fontSize = 11,
      fontStyle = 'normal',
      align = 'left',
      color = this.colors.text,
      x,
      y,
      maxWidth = this.pageWidth - 2 * this.margin,
      lineHeight = fontSize * 0.4 + 3
    } = options;

    if (!text) return;

    const processedText = processLatvianText(text);
    
    this.doc.setFontSize(fontSize);
    this.doc.setFont('helvetica', fontStyle);
    this.doc.setTextColor(color[0], color[1], color[2]);

    let xPos = x !== undefined ? x : this.margin;
    let yPos = y !== undefined ? y : this.yPosition;

    if (maxWidth && this.doc.getTextWidth(processedText) > maxWidth) {
      // Teksta sadalīšana rindās
      const lines = this.doc.splitTextToSize(processedText, maxWidth);
      
      for (const line of lines) {
        this.checkPageBreak(lineHeight);
        
        if (align === 'center') {
          const textWidth = this.doc.getTextWidth(line);
          xPos = (this.pageWidth - textWidth) / 2;
        } else if (align === 'right') {
          const textWidth = this.doc.getTextWidth(line);
          xPos = this.pageWidth - this.margin - textWidth;
        }
        
        this.doc.text(line, xPos, yPos);
        yPos += lineHeight;
      }
      
      if (y === undefined) {
        this.yPosition = yPos;
      }
    } else {
      if (align === 'center') {
        const textWidth = this.doc.getTextWidth(processedText);
        xPos = (this.pageWidth - textWidth) / 2;
      } else if (align === 'right') {
        const textWidth = this.doc.getTextWidth(processedText);
        xPos = this.pageWidth - this.margin - textWidth;
      }
      
      this.checkPageBreak(lineHeight);
      this.doc.text(processedText, xPos, yPos);
      
      if (y === undefined) {
        this.yPosition += lineHeight;
      }
    }
  }

  // Uzlabota tabulas izveide
  private addTable(
    headers: string[],
    rows: string[][],
    options: {
      headerBgColor?: number[];
      headerTextColor?: number[];
      rowBgColors?: number[][];
      borderColor?: number[];
      fontSize?: number;
      cellPadding?: number;
    } = {}
  ): void {
    const {
      headerBgColor = this.colors.primary,
      headerTextColor = [255, 255, 255],
      rowBgColors = [[255, 255, 255], [248, 249, 250]],
      borderColor = this.colors.text,
      fontSize = 10,
      cellPadding = 3
    } = options;

    const tableWidth = this.pageWidth - 2 * this.margin;
    const colWidth = tableWidth / headers.length;
    const rowHeight = fontSize + 2 * cellPadding;

    let currentY = this.yPosition;

    // Pārbaudām, vai tabula ietilpst lapā
    const tableHeight = (rows.length + 1) * rowHeight;
    this.checkPageBreak(tableHeight);
    currentY = this.yPosition;

    // Tabulas galvene
    this.doc.setFillColor(headerBgColor[0], headerBgColor[1], headerBgColor[2]);
    this.doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    this.doc.rect(this.margin, currentY, tableWidth, rowHeight, 'FD');

    this.doc.setTextColor(headerTextColor[0], headerTextColor[1], headerTextColor[2]);
    this.doc.setFontSize(fontSize);
    this.doc.setFont('helvetica', 'bold');

    headers.forEach((header, index) => {
      const x = this.margin + index * colWidth + cellPadding;
      const y = currentY + rowHeight / 2 + fontSize / 3;
      this.doc.text(processLatvianText(header), x, y);
    });

    currentY += rowHeight;

    // Tabulas rindas
    rows.forEach((row, rowIndex) => {
      const bgColor = rowBgColors[rowIndex % rowBgColors.length];
      
      this.doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
      this.doc.rect(this.margin, currentY, tableWidth, rowHeight, 'FD');

      this.doc.setTextColor(this.colors.text[0], this.colors.text[1], this.colors.text[2]);
      this.doc.setFont('helvetica', 'normal');

      row.forEach((cell, cellIndex) => {
        const x = this.margin + cellIndex * colWidth + cellPadding;
        const y = currentY + rowHeight / 2 + fontSize / 3;
        
        // Teksta saīsināšana, ja nepieciešams
        let cellText = processLatvianText(cell || '');
        const maxCellWidth = colWidth - 2 * cellPadding;
        
        if (this.doc.getTextWidth(cellText) > maxCellWidth) {
          while (this.doc.getTextWidth(cellText + '...') > maxCellWidth && cellText.length > 0) {
            cellText = cellText.slice(0, -1);
          }
          cellText += '...';
        }
        
        this.doc.text(cellText, x, y);
      });

      currentY += rowHeight;
    });

    // Tabulas ārējā robeža
    this.doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    this.doc.setLineWidth(0.5);
    this.doc.rect(this.margin, this.yPosition, tableWidth, currentY - this.yPosition);

    // Vertikālās līnijas
    for (let i = 1; i < headers.length; i++) {
      const x = this.margin + i * colWidth;
      this.doc.line(x, this.yPosition, x, currentY);
    }

    this.yPosition = currentY + 5;
  }

  // Uzlabota lapas pārtraukuma pārbaude
  private checkPageBreak(requiredSpace: number = 20): void {
    if (this.yPosition + requiredSpace > this.pageHeight - this.footerHeight - this.margin) {
      this.addPage();
    }
  }

  // Jaunas lapas pievienošana
  private addPage(): void {
    this.doc.addPage();
    this.currentPage++;
    this.yPosition = this.margin + this.headerHeight;
    this.addHeader();
  }

  // Lapas galvenes pievienošana
  private addHeader(): void {
    if (this.currentPage === 1) return; // Pirmajā lapā nav galvenes

    const headerY = 15;
    
    // Logo galvenē
    if (this.logoData && this.logoWidth > 0) {
      try {
        this.doc.addImage(
          this.logoData,
          'JPEG',
          this.margin,
          headerY - 10,
          this.logoWidth * 0.7,
          this.logoHeight * 0.7
        );
      } catch (error) {
        console.warn('Logo pievienošanas kļūda galvenē:', error);
      }
    }

    // Dokumenta nosaukums galvenē
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(this.colors.text[0], this.colors.text[1], this.colors.text[2]);
    this.doc.text('Pieņemšanas-nodošanas akts', this.pageWidth - this.margin, headerY, { align: 'right' });

    // Līnija zem galvenes
    this.doc.setDrawColor(this.colors.primary[0], this.colors.primary[1], this.colors.primary[2]);
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin, headerY + 5, this.pageWidth - this.margin, headerY + 5);
  }

  // Lapas kājenes pievienošana
  private addFooter(): void {
    const footerY = this.pageHeight - 15;
    
    // Lapas numurs
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(100, 100, 100);
    this.doc.text(
      `Lapa ${this.currentPage} no ${this.totalPages}`,
      this.pageWidth / 2,
      footerY,
      { align: 'center' }
    );

    // Ģenerēšanas datums un laiks
    const now = new Date();
    const timestamp = `Ģenerēts: ${now.toLocaleDateString('lv-LV')} ${now.toLocaleTimeString('lv-LV')}`;
    this.doc.text(timestamp, this.pageWidth - this.margin, footerY, { align: 'right' });

    // Līnija virs kājenes
    this.doc.setDrawColor(this.colors.primary[0], this.colors.primary[1], this.colors.primary[2]);
    this.doc.setLineWidth(0.3);
    this.doc.line(this.margin, footerY - 5, this.pageWidth - this.margin, footerY - 5);
  }

  // Galvenā PDF ģenerēšanas metode
  async generatePDF(data: DocumentData): Promise<Blob> {
    // Ielādējam logo, ja tas ir
    if (data.companyLogo) {
      await this.loadLogo(data.companyLogo);
    }

    this.yPosition = this.margin;

    // ===== TITULLAPA =====
    await this.createTitlePage(data);

    // ===== GALVENAIS DOKUMENTS =====
    this.addPage();
    await this.createMainDocument(data);

    // Pievienojam kājenes visām lapām
    this.totalPages = this.doc.getNumberOfPages();
    for (let i = 1; i <= this.totalPages; i++) {
      this.doc.setPage(i);
      this.currentPage = i;
      this.addFooter();
    }

    return this.doc.output('blob');
  }

  // Titullapas izveide
  private async createTitlePage(data: DocumentData): Promise<void> {
    // Uzņēmuma logo (ja ir)
    if (this.logoData && this.logoWidth > 0) {
      try {
        this.doc.addImage(
          this.logoData,
          'JPEG',
          this.margin,
          this.yPosition,
          this.logoWidth,
          this.logoHeight
        );
        this.yPosition += this.logoHeight + 10;
      } catch (error) {
        console.warn('Logo pievienošanas kļūda:', error);
      }
    }

    // Dekoratīvs elements
    this.doc.setDrawColor(this.colors.primary[0], this.colors.primary[1], this.colors.primary[2]);
    this.doc.setLineWidth(3);
    this.doc.line(this.margin, this.yPosition, this.pageWidth - this.margin, this.yPosition);
    this.yPosition += 20;

    // Galvenais virsraksts
    this.yPosition = this.pageHeight / 3;
    this.addText(data.title.toUpperCase(), {
      fontSize: 28,
      fontStyle: 'bold',
      align: 'center',
      color: this.colors.primary
    });

    this.yPosition += 10;

    // Akta numurs
    if (data.actNumber) {
      this.addText(`Nr. ${data.actNumber}`, {
        fontSize: 18,
        fontStyle: 'bold',
        align: 'center',
        color: this.colors.secondary
      });
    }

    this.yPosition += 20;

    // Datums un vieta
    const dateLocation = `${data.date}${data.location ? `, ${data.location}` : ''}`;
    this.addText(dateLocation, {
      fontSize: 14,
      align: 'center',
      color: this.colors.text
    });

    this.yPosition += 40;

    // Pušu informācija tabulā
    const partyHeaders = ['NODODĒJS', 'PIEŅĒMĒJS'];
    const partyRows = [
      [
        data.handoverParty.name || '',
        data.receivingParty.name || ''
      ],
      [
        data.handoverParty.registrationNumber ? `Reģ. Nr.: ${data.handoverParty.registrationNumber}` : '',
        data.receivingParty.registrationNumber ? `Reģ. Nr.: ${data.receivingParty.registrationNumber}` : ''
      ]
    ];

    this.addTable(partyHeaders, partyRows, {
      headerBgColor: this.colors.primary,
      fontSize: 12
    });

    this.yPosition += 30;

    // Pamatojums
    if (data.contractReference) {
      this.addText('PAMATOJUMS:', {
        fontSize: 14,
        fontStyle: 'bold',
        color: this.colors.primary
      });
      
      this.yPosition += 5;
      
      this.addText(data.contractReference, {
        fontSize: 12,
        maxWidth: this.pageWidth - 2 * this.margin - 20
      });
    }

    // Dekoratīvs apakšējais elements
    this.yPosition = this.pageHeight - 60;
    this.doc.setDrawColor(this.colors.secondary[0], this.colors.secondary[1], this.colors.secondary[2]);
    this.doc.setLineWidth(1);
    this.doc.line(this.margin, this.yPosition, this.pageWidth - this.margin, this.yPosition);
  }

  // Galvenā dokumenta izveide
  private async createMainDocument(data: DocumentData): Promise<void> {
    // Dokumenta virsraksts
    this.addText(data.title.toUpperCase(), {
      fontSize: 20,
      fontStyle: 'bold',
      align: 'center',
      color: this.colors.primary
    });

    if (data.actNumber) {
      this.addText(`Nr. ${data.actNumber}`, {
        fontSize: 14,
        fontStyle: 'bold',
        align: 'center',
        color: this.colors.secondary
      });
    }

    const dateLocation = `${data.date}${data.location ? `, ${data.location}` : ''}`;
    this.addText(dateLocation, {
      fontSize: 12,
      align: 'center'
    });

    this.yPosition += 10;

    // Horizontāla līnija
    this.doc.setDrawColor(this.colors.primary[0], this.colors.primary[1], this.colors.primary[2]);
    this.doc.setLineWidth(1);
    this.doc.line(this.margin, this.yPosition, this.pageWidth - this.margin, this.yPosition);
    this.yPosition += 15;

    // 1. LĪGUMSLĒDZĒJAS PUSES
    this.addText('1. LĪGUMSLĒDZĒJAS PUSES', {
      fontSize: 16,
      fontStyle: 'bold',
      color: this.colors.primary
    });

    this.yPosition += 5;

    // Detalizēta pušu informācija
    await this.addPartyDetails('1.1. NODODĒJS:', data.handoverParty);
    this.yPosition += 8;
    await this.addPartyDetails('1.2. PIEŅĒMĒJS:', data.receivingParty);

    this.yPosition += 15;

    // 2. PAMATOJUMS
    if (data.contractReference) {
      this.addText('2. PAMATOJUMS', {
        fontSize: 16,
        fontStyle: 'bold',
        color: this.colors.primary
      });

      this.yPosition += 5;
      this.addText(data.contractReference);
      this.yPosition += 15;
    }

    // 3. NODODAMĀS LIETAS
    this.addText('3. NODODAMĀS/PIEŅEMAMĀS LIETAS', {
      fontSize: 16,
      fontStyle: 'bold',
      color: this.colors.primary
    });

    this.yPosition += 10;

    // Lietu tabula
    if (data.items && data.items.length > 0) {
      const itemHeaders = [
        'Nr.',
        'Nosaukums',
        'Ražotājs/Modelis',
        'Sērijas Nr.',
        'Daudzums',
        'Stāvoklis'
      ];

      const itemRows = data.items.map((item, index) => [
        (index + 1).toString(),
        item.name || '',
        `${item.manufacturer || ''} ${item.model || ''}`.trim(),
        item.serialNumber || '',
        `${item.quantity} gab.`,
        item.condition || ''
      ]);

      this.addTable(itemHeaders, itemRows, {
        fontSize: 9,
        cellPadding: 2
      });

      // Detalizēta informācija par katru lietu
      this.yPosition += 10;
      
      data.items.forEach((item, index) => {
        this.checkPageBreak(30);
        
        this.addText(`3.${index + 1}. ${item.name}`, {
          fontSize: 12,
          fontStyle: 'bold',
          color: this.colors.primary
        });

        if (item.components) {
          this.addText(`Komplektācija: ${item.components}`, {
            fontSize: 10
          });
        }

        if (item.defects) {
          this.addText(`Defekti un bojājumi: ${item.defects}`, {
            fontSize: 10,
            color: this.colors.danger
          });
        }

        this.yPosition += 5;
      });
    }

    // 4. PAPILDU NOTEIKUMI
    if (data.warranty || data.documents || data.specialConditions || data.responsibility) {
      this.checkPageBreak(40);
      
      this.addText('4. PAPILDU NOTEIKUMI UN INFORMĀCIJA', {
        fontSize: 16,
        fontStyle: 'bold',
        color: this.colors.primary
      });

      this.yPosition += 5;

      if (data.warranty) {
        this.addText('4.1. Garantijas noteikumi:', {
          fontSize: 12,
          fontStyle: 'bold'
        });
        this.addText(data.warranty);
        this.yPosition += 5;
      }

      if (data.documents) {
        this.addText('4.2. Piederīgie dokumenti:', {
          fontSize: 12,
          fontStyle: 'bold'
        });
        this.addText(data.documents);
        this.yPosition += 5;
      }

      if (data.specialConditions) {
        this.addText('4.3. Īpašie nosacījumi:', {
          fontSize: 12,
          fontStyle: 'bold'
        });
        this.addText(data.specialConditions);
        this.yPosition += 5;
      }

      if (data.responsibility) {
        this.addText('4.4. Atbildības sadalījums:', {
          fontSize: 12,
          fontStyle: 'bold'
        });
        this.addText(data.responsibility);
        this.yPosition += 5;
      }
    }

    // 5. NOSLĒGUMA NOTEIKUMI
    this.checkPageBreak(60);
    this.yPosition += 10;

    this.doc.setDrawColor(this.colors.primary[0], this.colors.primary[1], this.colors.primary[2]);
    this.doc.setLineWidth(1);
    this.doc.line(this.margin, this.yPosition, this.pageWidth - this.margin, this.yPosition);
    this.yPosition += 10;

    this.addText('5. NOSLĒGUMA NOTEIKUMI', {
      fontSize: 16,
      fontStyle: 'bold',
      color: this.colors.primary
    });

    this.yPosition += 5;

    const conclusions = [
      '5.1. Puses apliecina, ka mantas stāvoklis ir pārbaudīts un atbilst šajā aktā norādītajam aprakstam.',
      '5.2. Pretenzijas pret nodoto mantu uz akta parakstīšanas brīdi pusēm nav.',
      '5.3. No šī akta parakstīšanas brīža visa atbildība par nodoto mantu pāriet no nododēja uz pieņēmēju.',
      '5.4. Akts sastādīts 2 eksemplāros, pa vienam katrai pusei.',
      '5.5. Akts stājas spēkā ar abu pušu parakstīšanas brīdi.'
    ];

    conclusions.forEach(conclusion => {
      this.addText(conclusion);
      this.yPosition += 2;
    });

    this.yPosition += 15;

    // PARAKSTU SADAĻA
    this.checkPageBreak(100);
    
    this.doc.setDrawColor(this.colors.primary[0], this.colors.primary[1], this.colors.primary[2]);
    this.doc.setLineWidth(1);
    this.doc.line(this.margin, this.yPosition, this.pageWidth - this.margin, this.yPosition);
    this.yPosition += 15;

    if (data.useElectronicSignature) {
      // Elektroniskais paraksts
      const electronicText = 'ŠIS DOKUMENTS IR PARAKSTĪTS AR DROŠU ELEKTRONISKO PARAKSTU UN SATUR LAIKA ZĪMOGU';
      
      const rectWidth = this.pageWidth - 2 * this.margin - 20;
      const rectHeight = 30;
      const rectX = this.margin + 10;
      const rectY = this.yPosition;

      // Dekoratīvs fons
      this.doc.setFillColor(this.colors.primary[0], this.colors.primary[1], this.colors.primary[2]);
      this.doc.setDrawColor(this.colors.primary[0], this.colors.primary[1], this.colors.primary[2]);
      this.doc.roundedRect(rectX, rectY, rectWidth, rectHeight, 3, 3, 'FD');

      // Teksts
      this.doc.setFontSize(11);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(255, 255, 255);

      const textLines = this.doc.splitTextToSize(electronicText, rectWidth - 10);
      let textY = rectY + 12;

      textLines.forEach((line: string) => {
        const textWidth = this.doc.getTextWidth(line);
        const textX = rectX + (rectWidth - textWidth) / 2;
        this.doc.text(line, textX, textY);
        textY += 6;
      });

      this.yPosition += rectHeight + 15;

      // Laika zīmogs
      const timestamp = new Date().toLocaleString('lv-LV');
      this.addText(`Elektroniskā paraksta laika zīmogs: ${timestamp}`, {
        fontSize: 10,
        align: 'center',
        color: this.colors.secondary
      });

    } else {
      // Fiziskie paraksti ar uzlabotu dizainu
      this.addText('PARAKSTI:', {
        fontSize: 14,
        fontStyle: 'bold',
        color: this.colors.primary
      });

      this.yPosition += 15;

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
      const signatureY = this.yPosition + 20;

      this.doc.setDrawColor(this.colors.text[0], this.colors.text[1], this.colors.text[2]);
      this.doc.setLineWidth(0.5);
      
      // Kreisā paraksta līnija
      this.doc.line(this.margin + 20, signatureY, this.margin + colWidth - 20, signatureY);
      // Labā paraksta līnija  
      this.doc.line(this.pageWidth / 2 + 20, signatureY, this.pageWidth - this.margin - 20, signatureY);

      this.yPosition = signatureY + 10;

      // Parakstītāju informācija
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(this.colors.text[0], this.colors.text[1], this.colors.text[2]);

      // Nododējs
      if (data.handoverParty.representative.name) {
        this.doc.text(
          processLatvianText(data.handoverParty.representative.name),
          this.margin + 20,
          this.yPosition
        );
      }
      if (data.handoverParty.representative.position) {
        this.doc.text(
          processLatvianText(data.handoverParty.representative.position),
          this.margin + 20,
          this.yPosition + 5
        );
      }

      // Pieņēmējs
      if (data.receivingParty.representative.name) {
        this.doc.text(
          processLatvianText(data.receivingParty.representative.name),
          this.pageWidth / 2 + 20,
          this.yPosition
        );
      }
      if (data.receivingParty.representative.position) {
        this.doc.text(
          processLatvianText(data.receivingParty.representative.position),
          this.pageWidth / 2 + 20,
          this.yPosition + 5
        );
      }

      this.yPosition += 20;
    }

    // Parakstīšanas datums
    this.yPosition += 10;
    this.addText(`Parakstīšanas datums: ${data.date}`, {
      fontSize: 11,
      align: 'center',
      color: this.colors.secondary
    });
  }

  // Pušu detalizētas informācijas pievienošana
  private async addPartyDetails(title: string, party: any): Promise<void> {
    this.addText(title, {
      fontSize: 12,
      fontStyle: 'bold',
      color: this.colors.secondary
    });

    if (party.name) {
      this.addText(`Nosaukums: ${party.name}`);
    }

    if (party.registrationNumber) {
      this.addText(`Reģistrācijas numurs: ${party.registrationNumber}`);
    }

    if (party.address) {
      this.addText(`Juridiskā adrese: ${party.address}`);
    }

    if (party.representative?.name || party.representative?.position) {
      const repInfo = [
        party.representative.name,
        party.representative.position
      ].filter(Boolean).join(', ');
      
      if (repInfo) {
        this.addText(`Pārstāvis: ${repInfo}`);
      }
    }
  }

  // Dekoratīvu elementu pievienošana
  private addDecorative(type: 'line' | 'box' | 'circle', options: any = {}): void {
    const {
      color = this.colors.primary,
      thickness = 1,
      x = this.margin,
      y = this.yPosition,
      width = this.pageWidth - 2 * this.margin,
      height = 10
    } = options;

    this.doc.setDrawColor(color[0], color[1], color[2]);
    this.doc.setLineWidth(thickness);

    switch (type) {
      case 'line':
        this.doc.line(x, y, x + width, y);
        break;
      case 'box':
        this.doc.rect(x, y, width, height);
        break;
      case 'circle':
        this.doc.circle(x, y, width);
        break;
    }
  }
}

// Eksportējam uzlaboto PDF ģenerēšanas funkciju
export async function generateAdvancedPDF(data: DocumentData): Promise<Blob> {
  const generator = new AdvancedPDFGenerator();
  return await generator.generatePDF(data);
}

// Funkcija akta numura automātiskai ģenerēšanai ar uzlabojumiem
export function generateActNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  
  // Pievienojam nejaušu skaitli unikālumam
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  
  return `AKT-${year}-${month}${day}-${hours}${minutes}${seconds}-${random}`;
}

// Papildu utilītu funkcijas
export const pdfUtils = {
  // Teksta garuma aprēķināšana
  calculateTextWidth: (text: string, fontSize: number = 11): number => {
    const doc = new jsPDF();
    doc.setFontSize(fontSize);
    return doc.getTextWidth(processLatvianText(text));
  },

  // Optimāla fonta izmēra aprēķināšana
  calculateOptimalFontSize: (text: string, maxWidth: number, maxFontSize: number = 16): number => {
    const doc = new jsPDF();
    let fontSize = maxFontSize;
    
    while (fontSize > 8) {
      doc.setFontSize(fontSize);
      if (doc.getTextWidth(processLatvianText(text)) <= maxWidth) {
        return fontSize;
      }
      fontSize--;
    }
    
    return 8;
  },

  // Krāsu konvertēšana
  hexToRgb: (hex: string): number[] => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : [0, 0, 0];
  },

  // Teksta formatēšana
  formatCurrency: (amount: number, currency: string = 'EUR'): string => {
    return new Intl.NumberFormat('lv-LV', {
      style: 'currency',
      currency: currency
    }).format(amount);
  },

  // Datuma formatēšana
  formatDate: (date: string | Date, format: 'short' | 'long' = 'short'): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (format === 'long') {
      return dateObj.toLocaleDateString('lv-LV', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    
    return dateObj.toLocaleDateString('lv-LV');
  }
};
