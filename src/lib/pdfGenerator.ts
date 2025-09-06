import jsPDF from 'jspdf';
import { DocumentData } from '@/app/page';

// Pievienojam latviešu valodas atbalstu
const latvianChars: { [key: string]: string } = {
  'ā': 'a', 'č': 'c', 'ē': 'e', 'ģ': 'g', 'ī': 'i', 'ķ': 'k', 'ļ': 'l', 'ņ': 'n', 'š': 's', 'ū': 'u', 'ž': 'z',
  'Ā': 'A', 'Č': 'C', 'Ē': 'E', 'Ģ': 'G', 'Ī': 'I', 'Ķ': 'K', 'Ļ': 'L', 'Ņ': 'N', 'Š': 'S', 'Ū': 'U', 'Ž': 'Z'
};

function processLatvianText(text: string): string {
  return text.replace(/[āčēģīķļņšūžĀČĒĢĪĶĻŅŠŪŽ]/g, (match) => latvianChars[match] || match);
}

export async function generatePDF(data: DocumentData): Promise<Blob> {
  const doc = new jsPDF('p', 'mm', 'a4');
  
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 25;
  const contentWidth = pageWidth - 2 * margin;
  let yPosition = margin;
  
  // Profesionāls fonts un krāsas
  const primaryColor = [0, 0, 0]; // Melns
  const secondaryColor = [100, 100, 100]; // Pelēks
  const accentColor = [0, 51, 102]; // Tumši zils
  
  // Palīgfunkcijas
  const addText = (text: string, fontSize: number = 11, style: 'normal' | 'bold' = 'normal', align: 'left' | 'center' | 'right' = 'left', color: number[] = primaryColor) => {
    const processedText = processLatvianText(text);
    doc.setFontSize(fontSize);
    doc.setFont('times', style);
    doc.setTextColor(color[0], color[1], color[2]);
    
    let x = margin;
    if (align === 'center') {
      const textWidth = doc.getTextWidth(processedText);
      x = (pageWidth - textWidth) / 2;
    } else if (align === 'right') {
      const textWidth = doc.getTextWidth(processedText);
      x = pageWidth - margin - textWidth;
    }
    
    doc.text(processedText, x, yPosition);
    yPosition += fontSize * 0.4 + 3;
  };

  const addWrappedText = (text: string, fontSize: number = 11, style: 'normal' | 'bold' = 'normal', color: number[] = primaryColor) => {
    if (!text) return;
    
    doc.setFontSize(fontSize);
    doc.setFont('times', style);
    doc.setTextColor(color[0], color[1], color[2]);
    
    const processedText = processLatvianText(text);
    const lines = doc.splitTextToSize(processedText, contentWidth);
    
    for (const line of lines) {
      checkPageBreak();
      doc.text(line, margin, yPosition);
      yPosition += fontSize * 0.4 + 3;
    }
  };

  const checkPageBreak = (requiredSpace: number = 20) => {
    if (yPosition + requiredSpace > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
    }
  };

  const addLine = (thickness: number = 0.5, color: number[] = primaryColor) => {
    doc.setDrawColor(color[0], color[1], color[2]);
    doc.setLineWidth(thickness);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 5;
  };

  const addSpace = (space: number = 5) => {
    yPosition += space;
  };

  // ===== TITULLAPA =====
  yPosition = pageHeight / 4;

  // Uzņēmuma logo vieta (ja būs)
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(1);
  doc.rect(margin, 30, 50, 30);
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('LOGO', margin + 20, 50);

  // Galvenais virsraksts
  addText(data.title.toUpperCase(), 24, 'bold', 'center', accentColor);
  addSpace(10);

  // Akta numurs
  if (data.actNumber) {
    addText(`Nr. ${data.actNumber}`, 16, 'bold', 'center');
    addSpace(15);
  }

  // Datums un vieta
  addText(`${data.date}${data.location ? `, ${data.location}` : ''}`, 14, 'normal', 'center');
  addSpace(30);

  // Puses
  doc.setFontSize(12);
  doc.setFont('times', 'bold');
  doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
  
  const leftColumn = margin;
  const rightColumn = pageWidth / 2 + 10;
  const currentY = yPosition;

  // Nododējs (kreisā puse)
  yPosition = currentY;
  doc.text('NODODĒJS:', leftColumn, yPosition);
  yPosition += 8;
  
  doc.setFont('times', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text(processLatvianText(data.handoverParty.name || ''), leftColumn, yPosition);
  yPosition += 6;
  
  if (data.handoverParty.registrationNumber) {
    doc.text(`Reģ. Nr.: ${data.handoverParty.registrationNumber}`, leftColumn, yPosition);
    yPosition += 6;
  }

  // Pieņēmējs (labā puse)
  yPosition = currentY;
  doc.setFont('times', 'bold');
  doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.text('PIEŅĒMĒJS:', rightColumn, yPosition);
  yPosition += 8;
  
  doc.setFont('times', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text(processLatvianText(data.receivingParty.name || ''), rightColumn, yPosition);
  yPosition += 6;
  
  if (data.receivingParty.registrationNumber) {
    doc.text(`Reģ. Nr.: ${data.receivingParty.registrationNumber}`, rightColumn, yPosition);
  }

  yPosition = Math.max(yPosition, currentY + 40);
  addSpace(20);

  // Pamatojums
  if (data.contractReference) {
    addText('PAMATOJUMS:', 12, 'bold', 'left', accentColor);
    addWrappedText(data.contractReference, 11);
    addSpace(10);
  }

  // Jauna lapa dokumentam
  doc.addPage();
  yPosition = margin;

  // ===== GALVENAIS DOKUMENTS =====
  
  // Dokumenta virsraksts
  addText(data.title.toUpperCase(), 18, 'bold', 'center', accentColor);
  if (data.actNumber) {
    addText(`Nr. ${data.actNumber}`, 14, 'bold', 'center');
  }
  addText(`${data.date}${data.location ? `, ${data.location}` : ''}`, 12, 'normal', 'center');
  addSpace(15);
  addLine(1, accentColor);
  addSpace(10);

  // Detalizēta informācija par pusēm
  addText('1. LĪGUMSLĒDZĒJAS PUSES', 14, 'bold', 'left', accentColor);
  addSpace(5);

  addText('1.1. NODODĒJS:', 12, 'bold');
  addWrappedText(`Nosaukums: ${data.handoverParty.name}`);
  if (data.handoverParty.registrationNumber) {
    addWrappedText(`Reģistrācijas numurs: ${data.handoverParty.registrationNumber}`);
  }
  if (data.handoverParty.address) {
    addWrappedText(`Juridiskā adrese: ${data.handoverParty.address}`);
  }
  if (data.handoverParty.representative.name) {
    addWrappedText(`Pārstāvis: ${data.handoverParty.representative.name}${data.handoverParty.representative.position ? `, ${data.handoverParty.representative.position}` : ''}`);
  }
  addSpace(8);

  addText('1.2. PIEŅĒMĒJS:', 12, 'bold');
  addWrappedText(`Nosaukums: ${data.receivingParty.name}`);
  if (data.receivingParty.registrationNumber) {
    addWrappedText(`Reģistrācijas numurs: ${data.receivingParty.registrationNumber}`);
  }
  if (data.receivingParty.address) {
    addWrappedText(`Juridiskā adrese: ${data.receivingParty.address}`);
  }
  if (data.receivingParty.representative.name) {
    addWrappedText(`Pārstāvis: ${data.receivingParty.representative.name}${data.receivingParty.representative.position ? `, ${data.receivingParty.representative.position}` : ''}`);
  }
  addSpace(10);

  // Pamatojums
  if (data.contractReference) {
    addText('2. PAMATOJUMS', 14, 'bold', 'left', accentColor);
    addSpace(5);
    addWrappedText(data.contractReference);
    addSpace(10);
  }

  // Nododamās lietas
  checkPageBreak(30);
  addText('3. NODODAMĀS/PIEŅEMAMĀS LIETAS', 14, 'bold', 'left', accentColor);
  addSpace(5);

  data.items.forEach((item, index) => {
    checkPageBreak(40);
    
    addText(`3.${index + 1}. ${item.name}`, 12, 'bold');
    
    if (item.manufacturer) {
      addWrappedText(`Ražotājs: ${item.manufacturer}`, 10);
    }
    if (item.model) {
      addWrappedText(`Modelis/Marka: ${item.model}`, 10);
    }
    if (item.serialNumber) {
      addWrappedText(`Sērijas numurs: ${item.serialNumber}`, 10);
    }
    if (item.quantity > 1) {
      addWrappedText(`Daudzums: ${item.quantity} gab.`, 10);
    }
    if (item.condition) {
      addWrappedText(`Tehniskais stāvoklis: ${item.condition}`, 10);
    }
    if (item.components) {
      addWrappedText(`Komplektācija: ${item.components}`, 10);
    }
    if (item.defects) {
      addWrappedText(`Defekti un bojājumi: ${item.defects}`, 10, 'normal', [200, 0, 0]);
    }
    
    addSpace(8);
  });

  // Papildu informācija
  if (data.warranty || data.documents || data.specialConditions || data.responsibility) {
    checkPageBreak(30);
    addText('4. PAPILDU NOTEIKUMI UN INFORMĀCIJA', 14, 'bold', 'left', accentColor);
    addSpace(5);
    
    if (data.warranty) {
      addText('4.1. Garantijas noteikumi:', 12, 'bold');
      addWrappedText(data.warranty);
      addSpace(5);
    }
    
    if (data.documents) {
      addText('4.2. Piederīgie dokumenti:', 12, 'bold');
      addWrappedText(data.documents);
      addSpace(5);
    }
    
    if (data.specialConditions) {
      addText('4.3. Īpašie nosacījumi:', 12, 'bold');
      addWrappedText(data.specialConditions);
      addSpace(5);
    }
    
    if (data.responsibility) {
      addText('4.4. Atbildības sadalījums:', 12, 'bold');
      addWrappedText(data.responsibility);
      addSpace(5);
    }
  }

  // Juridiskās frāzes
  checkPageBreak(50);
  addSpace(10);
  addLine(1, accentColor);
  addSpace(5);
  
  addText('5. NOSLĒGUMA NOTEIKUMI', 14, 'bold', 'left', accentColor);
  addSpace(5);
  
  addWrappedText('5.1. Puses apliecina, ka mantas stāvoklis ir pārbaudīts un atbilst šajā aktā norādītajam aprakstam.');
  addWrappedText('5.2. Pretenzijas pret nodoto mantu uz akta parakstīšanas brīdi pusēm nav.');
  addWrappedText('5.3. No šī akta parakstīšanas brīža visa atbildība par nodoto mantu pāriet no nododēja uz pieņēmēju.');
  addWrappedText('5.4. Akts sastādīts 2 eksemplāros, pa vienam katrai pusei.');
  
  addSpace(15);

  // Parakstu sadaļa
  checkPageBreak(80);
  addLine(1, accentColor);
  addSpace(10);
  
  if (data.useElectronicSignature) {
    // Elektroniskais paraksts
    const electronicText = 'ŠIS DOKUMENTS IR PARAKSTĪTS AR DROŠU ELEKTRONISKO PARAKSTU UN SATUR LAIKA ZĪMOGU';
    
    doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.setLineWidth(2);
    
    const rectWidth = contentWidth - 20;
    const rectHeight = 25;
    const rectX = margin + 10;
    const rectY = yPosition;
    
    doc.rect(rectX, rectY, rectWidth, rectHeight);
    
    doc.setFontSize(12);
    doc.setFont('times', 'bold');
    doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
    
    const textLines = doc.splitTextToSize(electronicText, rectWidth - 10);
    let textY = rectY + 10;
    
    textLines.forEach((line: string) => {
      const textWidth = doc.getTextWidth(line);
      const textX = rectX + (rectWidth - textWidth) / 2;
      doc.text(line, textX, textY);
      textY += 6;
    });
    
    yPosition += rectHeight + 10;
  } else {
    // Fiziskie paraksti
    addText('PARAKSTI:', 12, 'bold', 'left', accentColor);
    addSpace(10);
    
    const signatureY = yPosition;
    
    // Nododēja paraksts
    doc.setFont('times', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('NODODĒJS:', margin, signatureY);
    doc.line(margin, signatureY + 15, margin + 80, signatureY + 15);
    doc.setFont('times', 'normal');
    doc.setFontSize(10);
    doc.text(processLatvianText(data.handoverParty.representative.name || ''), margin, signatureY + 20);
    doc.text(processLatvianText(data.handoverParty.representative.position || ''), margin, signatureY + 25);
    
    // Pieņēmēja paraksts
    const rightX = pageWidth / 2 + 10;
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.text('PIEŅĒMĒJS:', rightX, signatureY);
    doc.line(rightX, signatureY + 15, rightX + 80, signatureY + 15);
    doc.setFont('times', 'normal');
    doc.setFontSize(10);
    doc.text(processLatvianText(data.receivingParty.representative.name || ''), rightX, signatureY + 20);
    doc.text(processLatvianText(data.receivingParty.representative.position || ''), rightX, signatureY + 25);
    
    yPosition = signatureY + 35;
  }

  // Parakstīšanas datums
  addSpace(10);
  addText(`Parakstīšanas datums: ${data.date}`, 11, 'normal', 'center');

  // Lapas numurēšana
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`${i} / ${totalPages}`, pageWidth - margin - 15, pageHeight - 10);
  }

  return doc.output('blob');
}

// Funkcija akta numura automātiskai ģenerēšanai
export function generateActNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const time = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0');
  
  return `AKT-${year}-${month}${day}-${time}`;
}
