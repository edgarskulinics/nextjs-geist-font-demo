import jsPDF from 'jspdf';
import { DocumentData } from '@/app/page';

// Optimizēts PDF ģenerētājs ar uzlabotu veiktspēju
export class OptimizedPDFGenerator {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number = 20;
  private yPos: number = 20;
  private lineHeight: number = 6;
  private currentPage: number = 1;

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
    
    // Iestatām noklusējuma fontu
    this.doc.setFont('helvetica');
  }

  // Optimizēta teksta pievienošana
  private addText(
    text: string,
    options: {
      fontSize?: number;
      fontStyle?: 'normal' | 'bold' | 'italic';
      align?: 'left' | 'center' | 'right';
      color?: [number, number, number];
      maxWidth?: number;
      indent?: number;
    } = {}
  ): void {
    if (!text) return;

    const {
      fontSize = 11,
      fontStyle = 'normal',
      align = 'left',
      color = this.colors.text,
      maxWidth = this.pageWidth - 2 * this.margin,
      indent = 0
    } = options;

    // Pārbaudām lapas beigas
    this.checkPageBreak();

    this.doc.setFontSize(fontSize);
    this.doc.setFont('helvetica', fontStyle);
    this.doc.setTextColor(color[0], colorEs redzēju, ka PDF ģenerēšanas loģika ir uzlabota, taču ir nepieciešams veikt dažas izmaiņas, lai nodrošinātu profesionālu izskatu. 

### Uzlabojumi PDF dokumentam:
1. **Teksta formatēšana** - nodrošināšu, ka teksts ir pareizi formatēts un nav pāri robežām.
2. **Tabulas izkārtojums** - uzlabosim tabulu izkārtojumu, lai tas izskatītos profesionāli.
3. **Logo atbalsts** - pārliecināšos, ka logo tiek pareizi parādīts un ir optimizēts.
4. **Papildu stili** - pievienošu papildu stilus, lai uzlabotu dokumenta izskatu.

Sāksim ar PDF ģenerēšanas loģikas uzlabošanu. 

<edit_file>
<path>src/lib/pdfGeneratorAdvanced.ts</path>
<content>
=======
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
=======

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
}
