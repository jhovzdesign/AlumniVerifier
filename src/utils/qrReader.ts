import jsQR from 'jsqr';
import QRCode from 'qrcode';

/**
 * Decodes a QR code from an image File or Blob
 */
export async function decodeQRCodeFromImage(file: File | Blob): Promise<{ success: boolean; data?: string; error?: string }> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (!ctx) {
            resolve({ success: false, error: 'Could not create canvas context.' });
            return;
          }

          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0, img.width, img.height);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          let code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'attemptBoth',
          });

          // If not detected at original size (common with high-res phone camera photos), try multi-scale passes
          if (!code || !code.data) {
            const scales = [1200, 800, 500];
            for (const maxDim of scales) {
              if (img.width > maxDim || img.height > maxDim) {
                const scale = Math.min(maxDim / img.width, maxDim / img.height);
                const sw = Math.round(img.width * scale);
                const sh = Math.round(img.height * scale);
                canvas.width = sw;
                canvas.height = sh;
                ctx.drawImage(img, 0, 0, sw, sh);
                const scaledImgData = ctx.getImageData(0, 0, sw, sh);
                const scaledCode = jsQR(scaledImgData.data, sw, sh, {
                  inversionAttempts: 'attemptBoth'
                });
                if (scaledCode && scaledCode.data) {
                  code = scaledCode;
                  break;
                }
              }
            }
          }

          if (code && code.data) {
            resolve({ success: true, data: code.data });
          } else {
            resolve({ success: false, error: 'QR CODE COULD NOT BE READ: Please upload a clear QR code image.' });
          }
        } catch (err: any) {
          resolve({ success: false, error: err.message || 'Error processing image.' });
        }
      };
      img.onerror = () => {
        resolve({ success: false, error: 'Failed to load image file.' });
      };
      img.src = reader.result as string;
    };
    reader.onerror = () => {
      resolve({ success: false, error: 'Failed to read image file.' });
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Generates a Data URL QR Code image from a string payload
 */
export async function generateQRCodeDataUrl(text: string, options?: { width?: number; margin?: number; darkColor?: string }): Promise<string> {
  if (!text || !text.trim()) return '';
  const cleanText = text.trim();
  const width = options?.width || 300;
  const margin = options?.margin !== undefined ? options.margin : 2;
  const darkColor = options?.darkColor || '#0f172a';

  // 1. Try standard PNG DataURL (Canvas)
  try {
    const pngUrl = await QRCode.toDataURL(cleanText, {
      width,
      margin,
      color: {
        dark: darkColor,
        light: '#ffffff'
      },
      errorCorrectionLevel: 'M'
    });
    if (pngUrl && pngUrl.startsWith('data:image/')) {
      return pngUrl;
    }
  } catch (err) {
    console.warn('QRCode.toDataURL png failed, trying SVG fallback:', err);
  }

  // 2. Fallback to SVG DataURL (pure vector string, does not require canvas context)
  try {
    const svgString = await QRCode.toString(cleanText, {
      type: 'svg',
      width,
      margin,
      color: {
        dark: darkColor,
        light: '#ffffff'
      },
      errorCorrectionLevel: 'M'
    });
    if (svgString && svgString.includes('<svg')) {
      return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
    }
  } catch (svgErr) {
    console.error('QRCode.toString SVG fallback failed:', svgErr);
  }

  // 3. Fallback to server-side API generation
  try {
    const res = await fetch('/api/generate-qr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: cleanText, width })
    });
    if (res.ok) {
      const json = await res.json();
      if (json.qr_image_url) {
        return json.qr_image_url;
      }
    }
  } catch (apiErr) {
    console.warn('Server-side QR generation fallback failed:', apiErr);
  }

  return '';
}
