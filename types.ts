export interface DocumentState {
  originalImage: string | null;
  isAnalyzing: boolean;
  isGeneratingLogo: boolean;
  analysisError: string | null;
}

export interface LetterSettings {
  // Page Setup
  marginTop: number;
  marginRight: number;
  marginBottom: number;
  marginLeft: number;
  fontFamily: string;
  fontSize: number;

  // Header (Kop Surat)
  showKop: boolean;
  headerContent: string; // Changed from separate name/address to full HTML
  headerLineHeight: number;
  headerLineDouble: boolean;
  logoUrl: string;
  logoAspectRatio: string;

  // Content
  rawHtmlContent: string;
  
  // Variables (Dynamic Fields)
  variables: Variable[];

  // Signature
  showSignature: boolean;
  signatureType: 'wet' | 'qr';
  signatureName: string;
  signatureTitle: string;
}

export interface Variable {
  id: string;
  key: string;
  label: string;
  defaultValue: string;
}

export interface AnalysisResponse {
  institutionName: string; // Kept for legacy mapping from AI
  institutionAddress: string; // Kept for legacy mapping from AI
  htmlContent: string;
  detectedVariables: { key: string; label: string; defaultValue: string }[];
  signatureName?: string;
  signatureTitle?: string;
}

export enum TabView {
  UPLOAD = 'UPLOAD',
  EDITOR = 'EDITOR',
  PREVIEW = 'PREVIEW'
}