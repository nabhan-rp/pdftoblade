export interface DocumentState {
  originalImage: string | null;
  isAnalyzing: boolean;
  isGeneratingLogo: boolean;
  analysisError: string | null;
}

export interface Signature {
  id: string;
  name: string;
  title: string;
  type: 'wet' | 'qr';
  label?: string; // e.g., "Mengetahui," or "Hormat Kami,"
}

export interface LetterSettings {
  // Page Setup
  marginTop: number;
  marginRight: number;
  marginBottom: number;
  marginLeft: number;
  
  // Font Settings (Global & Section specific)
  globalFontFamily: string;
  headerFontFamily: string;
  contentFontFamily: string;
  attachmentFontFamily: string;
  fontSize: number;

  // Header (Kop Surat)
  showKop: boolean;
  headerContent: string;
  headerLineHeight: number;
  headerLineDouble: boolean;
  logoUrl: string;
  logoAspectRatio: string;

  // Content
  rawHtmlContent: string;
  
  // Footer
  showFooter: boolean;
  footerContent: string;

  // Attachments (Lampiran)
  hasAttachment: boolean;
  attachmentShowKop: boolean; // New: Repeat header on attachment page
  attachmentContent: string;

  // Variables (Dynamic Fields)
  variables: Variable[];

  // Signatures
  showSignature: boolean;
  signatures: Signature[];
}

export interface Variable {
  id: string;
  key: string;
  label: string;
  defaultValue: string;
}

export interface AnalysisResponse {
  institutionName: string;
  institutionAddress: string;
  htmlContent: string;
  attachmentContent?: string; // Separated attachment content
  detectedVariables: { key: string; label: string; defaultValue: string }[];
  signatureName?: string;
  signatureTitle?: string;
}

export enum TabView {
  UPLOAD = 'UPLOAD',
  EDITOR = 'EDITOR',
  PREVIEW = 'PREVIEW'
}