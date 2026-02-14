import QRCode from 'qrcode'

export async function generateQRCode(data: string): Promise<string> {
  const qrCodeDataURL = await QRCode.toDataURL(data, {
    errorCorrectionLevel: 'H',
    type: 'image/png',
    width: 300,
    margin: 2,
  })

  return qrCodeDataURL
}
