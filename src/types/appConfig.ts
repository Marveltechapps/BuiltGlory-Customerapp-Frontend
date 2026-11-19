/** GET /app/config — public version, maintenance, support and payment configuration. */
export interface AppConfig {
  versions: { current: string; minimumSupported: string; latest: string };
  storeUrls: { ios: string | null; android: string | null };
  maintenance: {
    enabled: boolean;
    message?: string;
    expectedBackAt?: string | null;
  };
  featureFlags: Record<string, unknown>;
  payment: {
    tokenAmount: number;
    escrow: {
      accountHolder?: string;
      bankName?: string;
      accountNumber?: string;
      ifsc?: string;
      branch?: string;
      upiId?: string;
      chequePayee?: string;
      chequeInstructions?: string[];
    } | null;
  };
  support: {
    supportPhone: string;
    supportPhoneE164: string;
    supportEmail: string;
    whatsappNumber: string;
    whatsappUrl: string;
    telUrl: string;
    supportWhatsAppMessage: string;
    phone?: string;
  };
  dashboardOptions?: Record<string, any>;
}
