import html2pdf from 'html2pdf.js';

/**
 * Reemplaza temporalmente cualquier expresión oklch(...) en las etiquetas <style> del DOM por #000000,
 * impidiendo que html2canvas lance una excepción por funciones de color no soportadas.
 */
function sanitizeOklchInStyles(): () => void {
  const styleElements = Array.from(document.querySelectorAll('style'));
  const originalContents: { el: HTMLStyleElement; text: string }[] = [];

  for (const style of styleElements) {
    if (style.textContent && style.textContent.includes('oklch')) {
      originalContents.push({ el: style, text: style.textContent });
      style.textContent = style.textContent.replace(/oklch\([^)]+\)/g, '#000000');
    }
  }

  return () => {
    for (const item of originalContents) {
      item.el.textContent = item.text;
    }
  };
}

/**
 * Crea un contenedor independiente en el DOM para la generación del PDF.
 */
function createContainer(htmlContent: string): HTMLDivElement {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  container.style.width = '794px';
  container.style.zIndex = '-99999';
  container.style.pointerEvents = 'none';
  container.style.opacity = '0';
  container.style.backgroundColor = '#ffffff';
  container.innerHTML = htmlContent;
  document.body.appendChild(container);
  return container;
}

/**
 * Genera un Blob binario real en formato PDF (%PDF-1.7) a partir de una cadena HTML.
 */
export async function generatePdfBlobFromHtml(htmlContent: string): Promise<Blob> {
  const container = createContainer(htmlContent);
  const restoreStyles = sanitizeOklchInStyles();

  try {
    await new Promise(resolve => setTimeout(resolve, 80));

    const opt = {
      margin: 6,
      filename: 'documento.pdf',
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        logging: false,
        windowWidth: 800
      },
      jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
    };

    const pdfBlob: Blob = await html2pdf().set(opt).from(container).outputPdf('blob');
    return pdfBlob;
  } catch (err) {
    console.error('Error al generar Blob PDF binario:', err);
    throw err;
  } finally {
    restoreStyles();
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}

/**
 * Genera y descarga un archivo PDF binario real (.pdf) a partir de una cadena HTML directamente a descargas.
 */
export async function downloadPdfFromHtml(htmlContent: string, filename: string): Promise<void> {
  const container = createContainer(htmlContent);
  const restoreStyles = sanitizeOklchInStyles();

  try {
    await new Promise(resolve => setTimeout(resolve, 80));

    const cleanFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;

    const opt = {
      margin: 6,
      filename: cleanFilename,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        logging: false,
        windowWidth: 800
      },
      jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
    };

    await html2pdf().set(opt).from(container).save();
  } catch (err) {
    console.error('Error al descargar archivo PDF binario:', err);
  } finally {
    restoreStyles();
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}
