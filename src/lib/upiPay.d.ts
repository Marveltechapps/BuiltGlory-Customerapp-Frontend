export function isValidUpiId(upiId: string): boolean;
export function buildUpiPayUri(input: {
  upiId: string;
  payee?: string;
  amount: number;
  note?: string;
  transactionRef?: string;
}): string;
