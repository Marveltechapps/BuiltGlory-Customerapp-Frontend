declare module "qrcode" {
  interface QRCodeSymbol {
    modules: {
      size: number;
      get(row: number, col: number): boolean;
    };
  }
  const QRCode: {
    create(text: string, options?: { errorCorrectionLevel?: "L" | "M" | "Q" | "H" }): QRCodeSymbol;
  };
  export default QRCode;
}
