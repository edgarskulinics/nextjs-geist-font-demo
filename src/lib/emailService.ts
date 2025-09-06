import { DocumentData } from '@/app/page';

interface EmailSettings {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  defaultSender: string;
}

// Iegūst e-pasta iestatījumus no localStorage
function getEmailSettings(): EmailSettings {
  if (typeof window === 'undefined') {
    throw new Error('E-pasta iestatījumi nav konfigurēti');
  }

  const settings = localStorage.getItem('emailSettings');
  if (!settings) {
    throw new Error('E-pasta iestatījumi nav konfigurēti. Lūdzu, dodieties uz iestatījumu sadaļu.');
  }

  return JSON.parse(settings);
}

// Sūta e-pastu ar PDF pielikumu
export async function sendEmail(
  recipient: string, 
  pdfBlob: Blob, 
  documentData: DocumentData
): Promise<void> {
  try {
    const settings = getEmailSettings();
    
    // Pārvērš PDF blob uz base64
    const pdfBase64 = await blobToBase64(pdfBlob);
    
    // Sagatavo e-pasta saturu
    const emailData = {
      to: recipient,
      from: settings.defaultSender || settings.smtpUser,
      subject: `Pieņemšanas-nodošanas akts ${documentData.actNumber ? `Nr. ${documentData.actNumber}` : ''}`,
      html: generateEmailHTML(documentData),
      attachments: [
        {
          filename: `Pienemšanas-nodošanas-akts-${documentData.actNumber || 'bez-numura'}.pdf`,
          content: pdfBase64.split(',')[1], // Noņem "data:application/pdf;base64," prefiksu
          type: 'application/pdf',
          disposition: 'attachment'
        }
      ],
      smtp: {
        host: settings.smtpHost,
        port: settings.smtpPort,
        secure: settings.smtpPort === 465, // true for 465, false for other ports
        auth: {
          user: settings.smtpUser,
          pass: settings.smtpPassword
        }
      }
    };

    // Sūta e-pastu caur API endpoint
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Kļūda e-pasta sūtīšanā');
    }

    console.log('E-pasts veiksmīgi nosūtīts');
  } catch (error) {
    console.error('Kļūda e-pasta sūtīšanā:', error);
    throw error;
  }
}

// Pārvērš Blob uz base64 string
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Ģenerē e-pasta HTML saturu
function generateEmailHTML(documentData: DocumentData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Pieņemšanas-nodošanas akts</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }
            .header {
                background-color: #f8f9fa;
                padding: 20px;
                border-radius: 5px;
                margin-bottom: 20px;
                text-align: center;
            }
            .content {
                background-color: #ffffff;
                padding: 20px;
                border: 1px solid #dee2e6;
                border-radius: 5px;
            }
            .info-section {
                margin-bottom: 15px;
            }
            .info-label {
                font-weight: bold;
                color: #495057;
            }
            .footer {
                margin-top: 20px;
                padding: 15px;
                background-color: #f8f9fa;
                border-radius: 5px;
                font-size: 12px;
                color: #6c757d;
                text-align: center;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Pieņemšanas-nodošanas akts</h1>
            ${documentData.actNumber ? `<p><strong>Nr. ${documentData.actNumber}</strong></p>` : ''}
            <p>${documentData.date}${documentData.location ? `, ${documentData.location}` : ''}</p>
        </div>
        
        <div class="content">
            <div class="info-section">
                <div class="info-label">Nododējs:</div>
                <p>${documentData.handoverParty.name}</p>
                ${documentData.handoverParty.registrationNumber ? `<p>Reģ. Nr.: ${documentData.handoverParty.registrationNumber}</p>` : ''}
            </div>
            
            <div class="info-section">
                <div class="info-label">Pieņēmējs:</div>
                <p>${documentData.receivingParty.name}</p>
                ${documentData.receivingParty.registrationNumber ? `<p>Reģ. Nr.: ${documentData.receivingParty.registrationNumber}</p>` : ''}
            </div>
            
            ${documentData.contractReference ? `
            <div class="info-section">
                <div class="info-label">Pamatojums:</div>
                <p>${documentData.contractReference}</p>
            </div>
            ` : ''}
            
            <div class="info-section">
                <div class="info-label">Nododamās lietas:</div>
                <ul>
                    ${documentData.items.map((item, index) => `
                        <li>
                            <strong>${item.name}</strong>
                            ${item.manufacturer ? `<br>Ražotājs: ${item.manufacturer}` : ''}
                            ${item.model ? `<br>Modelis: ${item.model}` : ''}
                            ${item.serialNumber ? `<br>Sērijas Nr.: ${item.serialNumber}` : ''}
                            ${item.quantity > 1 ? `<br>Skaits: ${item.quantity}` : ''}
                        </li>
                    `).join('')}
                </ul>
            </div>
        </div>
        
        <div class="footer">
            <p>Šis e-pasts satur pieņemšanas-nodošanas aktu PDF formātā.</p>
            <p>Lūdzu, saglabājiet šo dokumentu savos arhīvos.</p>
        </div>
    </body>
    </html>
  `;
}

// Testē e-pasta konfigurāciju
export async function testEmailConfiguration(settings: EmailSettings): Promise<boolean> {
  try {
    const testEmailData = {
      to: settings.smtpUser, // Sūta uz sevi kā testu
      from: settings.defaultSender || settings.smtpUser,
      subject: 'E-pasta konfigurācijas tests',
      html: `
        <h2>E-pasta konfigurācijas tests</h2>
        <p>Ja jūs saņemat šo e-pastu, tad e-pasta iestatījumi ir konfigurēti pareizi.</p>
        <p>Datums: ${new Date().toLocaleString('lv-LV')}</p>
      `,
      smtp: {
        host: settings.smtpHost,
        port: settings.smtpPort,
        secure: settings.smtpPort === 465,
        auth: {
          user: settings.smtpUser,
          pass: settings.smtpPassword
        }
      }
    };

    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testEmailData)
    });

    return response.ok;
  } catch (error) {
    console.error('Kļūda e-pasta testa sūtīšanā:', error);
    return false;
  }
}
