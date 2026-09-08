import html2pdf from 'html2pdf.js';

/**
 * Crea un iframe completamente aislado del DOM principal de Angular/Tailwind.
 * Esto evita que html2canvas intente procesar funciones de color 'oklch' provenientes
 * de las hojas de estilo globales de Tailwind CSS / DaisyUI del documento principal.
 */
function createIsolatedIframe(htmlContent: string): Promise<{ iframe: HTMLIFrameElement; elementToPrint: HTMLElement; cleanup: () => void }> {
  return new Promise((resolve) => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.left = '-9999px';
    iframe.style.top = '-9999px';
    iframe.style.width = '800px';
    iframe.style.height = '1150px';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';
    iframe.style.backgroundColor = '#ffffff';

    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) {
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.left = '-9999px';
      container.style.top = '-9999px';
      container.style.width = '794px';
      container.style.backgroundColor = '#ffffff';
      container.innerHTML = htmlContent.replace(/oklch\([^)]+\)/gi, '#000000');
      document.body.appendChild(container);

      resolve({
        iframe,
        elementToPrint: container,
        cleanup: () => {
          if (document.body.contains(container)) document.body.removeChild(container);
          if (document.body.contains(iframe)) document.body.removeChild(iframe);
        }
      });
      return;
    }

    // Escribir el contenido HTML limpio en el documento aislado del iframe
    const cleanHtml = htmlContent.replace(/oklch\([^)]+\)/gi, '#000000');
    doc.open();
    doc.write(cleanHtml);
    doc.close();

    // Permitir tiempo para el renderizado interno de tablas y SVGs
    setTimeout(() => {
      const targetElement = (doc.getElementById('pageContainer') || doc.body) as HTMLElement;
      resolve({
        iframe,
        elementToPrint: targetElement,
        cleanup: () => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }
      });
    }, 150);
  });
}

/**
 * Genera un Blob binario real en formato PDF (%PDF-1.7) a partir de una cadena HTML.
 */
export async function generatePdfBlobFromHtml(htmlContent: string): Promise<Blob> {
  const { elementToPrint, cleanup } = await createIsolatedIframe(htmlContent);

  try {
    const opt = {
      margin: 5,
      filename: 'documento.pdf',
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        logging: false,
        windowWidth: 800,
        backgroundColor: '#ffffff'
      },
      jsPDF: { unit: 'mm' as const, format: 'letter' as const, orientation: 'portrait' as const }
    };

    const pdfBlob: Blob = await html2pdf().set(opt).from(elementToPrint).outputPdf('blob');
    return pdfBlob;
  } catch (err) {
    console.error('Error al generar Blob PDF binario:', err);
    throw err;
  } finally {
    cleanup();
  }
}

/**
 * Genera y descarga un archivo PDF binario real (.pdf) a partir de una cadena HTML directamente a descargas.
 */
export async function downloadPdfFromHtml(htmlContent: string, filename: string): Promise<void> {
  const { elementToPrint, cleanup } = await createIsolatedIframe(htmlContent);

  try {
    const cleanFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;

    const opt = {
      margin: 5,
      filename: cleanFilename,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        logging: false,
        windowWidth: 800,
        backgroundColor: '#ffffff'
      },
      jsPDF: { unit: 'mm' as const, format: 'letter' as const, orientation: 'portrait' as const }
    };

    await html2pdf().set(opt).from(elementToPrint).save();
  } catch (err) {
    console.error('Error al descargar archivo PDF binario:', err);
  } finally {
    cleanup();
  }
}
