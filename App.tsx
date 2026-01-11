import React, { useState, useRef } from 'react';
import { analyzeDocumentImage } from './services/geminiService';
import { DocumentState, LetterSettings, TabView } from './types';
import EditorPanel from './components/EditorPanel';
import TemplatePreview from './components/TemplatePreview';

const DEFAULT_SETTINGS: LetterSettings = {
  marginTop: 4, // 4cm standard official letter top
  marginRight: 3,
  marginBottom: 3,
  marginLeft: 4, // 4cm standard official letter left
  fontFamily: '"Times New Roman", serif',
  fontSize: 12,
  showKop: true,
  institutionName: "UNIVERSITAS ISLAM NEGERI\nSUNAN GUNUNG DJATI BANDUNG",
  institutionAddress: "Jl. A.H. Nasution No. 105, Cibiru, Bandung 40614\nTelp. (022) 7800525 Fax. (022) 7803936 Website: www.uinsgd.ac.id",
  headerLineHeight: 3,
  headerLineDouble: true,
  logoUrl: "https://upload.wikimedia.org/wikipedia/commons/e/ec/Logo_UIN_Sunan_Gunung_Djati_Bandung.png", // Placeholder
  logoAspectRatio: "1:1",
  rawHtmlContent: "<p>Loading content...</p>",
  variables: [],
  showSignature: true,
  signatureType: 'wet',
  signatureName: "Prof. Dr. H. Rosihon Anwar, M.Ag",
  signatureTitle: "Rektor"
};

const App: React.FC = () => {
  const [docState, setDocState] = useState<DocumentState>({
    originalImage: null,
    isAnalyzing: false,
    isGeneratingLogo: false,
    analysisError: null,
  });

  const [settings, setSettings] = useState<LetterSettings>(DEFAULT_SETTINGS);
  const [view, setView] = useState<TabView>(TabView.UPLOAD);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check for Word documents specifically to give a helpful error
    if (file.name.endsWith('.docx') || file.name.endsWith('.doc') || 
        file.type.includes('wordprocessingml') || file.type.includes('msword')) {
        alert("For Word (.docx) or Google Docs, please 'File > Save as PDF' first. The AI needs the PDF layout to accurately detect margins, logos, and headers.");
        return;
    }

    // Validate MIME types: Allow Images and PDF
    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf';

    if (!isImage && !isPdf) {
        alert("Unsupported file type. Please upload a PDF or an Image (JPG/PNG).");
        return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64Result = e.target?.result as string;
      
      // For PDF, we can't display a preview easily in the background without pdf.js, 
      // so we just show a generic icon or the first page if we implemented rendering.
      // For now, we store it but only use it for analysis.
      setDocState(prev => ({ 
        ...prev, 
        originalImage: isImage ? base64Result : null, // Only set image preview if it's an image
        isAnalyzing: true, 
        analysisError: null 
      }));
      
      try {
        // Strip prefix for API (data:image/jpeg;base64, or data:application/pdf;base64,)
        const base64Data = base64Result.split(',')[1];
        
        // Pass the actual mime type to Gemini
        const analysis = await analyzeDocumentImage(base64Data, file.type);
        
        setSettings(prev => ({
          ...prev,
          institutionName: analysis.institutionName || prev.institutionName,
          institutionAddress: analysis.institutionAddress || prev.institutionAddress,
          rawHtmlContent: analysis.htmlContent,
          variables: analysis.detectedVariables.map((v, i) => ({ ...v, id: `var-${i}` })),
          signatureName: analysis.signatureName || prev.signatureName,
          signatureTitle: analysis.signatureTitle || prev.signatureTitle
        }));
        
        setView(TabView.EDITOR);
      } catch (err) {
        console.error(err);
        setDocState(prev => ({ ...prev, analysisError: "Failed to analyze document. If using a large PDF, try a single page screenshot." }));
      } finally {
        setDocState(prev => ({ ...prev, isAnalyzing: false }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDownloadBlade = () => {
    // Construct the full blade file
    const bladeContent = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{ $title ?? 'Document' }}</title>
    <style>
        @page {
            margin: ${settings.marginTop}cm ${settings.marginRight}cm ${settings.marginBottom}cm ${settings.marginLeft}cm;
        }
        body {
            font-family: ${settings.fontFamily.replace(/"/g, "'")};
            font-size: ${settings.fontSize}pt;
            line-height: 1.5;
            color: #000;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
        }
        .header-logo {
            float: left;
            width: 80px;
            height: auto;
        }
        .header-text {
            text-transform: uppercase;
            font-weight: bold;
        }
        .header-address {
            font-size: 10pt;
            font-weight: normal;
            text-transform: none;
        }
        .header-line {
            border-bottom: ${settings.headerLineHeight}px ${settings.headerLineDouble ? 'double' : 'solid'} black;
            margin-top: 8px;
            width: 100%;
        }
        .signature {
            margin-top: 50px;
            float: right;
            text-align: center;
            width: 250px;
        }
        .signature-img {
            width: 80px;
            height: 80px;
            margin: 10px auto;
        }
        .clear { clear: both; }
    </style>
</head>
<body>
    @if(${settings.showKop ? 'true' : 'false'})
    <div class="header">
        <img src="${settings.logoUrl}" class="header-logo" alt="Logo">
        <div class="header-text">
            <div style="font-size: 14pt;">${settings.institutionName.replace(/\n/g, '<br>')}</div>
            <div class="header-address">${settings.institutionAddress.replace(/\n/g, '<br>')}</div>
        </div>
        <div class="clear"></div>
        <div class="header-line"></div>
    </div>
    @endif

    <div class="content">
        ${settings.rawHtmlContent}
    </div>

    @if(${settings.showSignature ? 'true' : 'false'})
    <div class="signature">
        <p>Bandung, {{ $tanggal }}</p>
        
        @if(${settings.signatureType === 'wet' ? 'true' : 'false'})
           <br><br><br>
        @else
           <!-- QR Code E-Sign Placeholder -->
           <!-- Inject the QR URL in your controller: $qr_code -->
           <img src="{{ $qr_code ?? '' }}" alt="QR Signature" class="signature-img">
        @endif
        
        <p style="font-weight: bold; text-decoration: underline;">${settings.signatureName}</p>
        <p>${settings.signatureTitle}</p>
    </div>
    @endif
</body>
</html>`;

    const blob = new Blob([bladeContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'template.blade.php';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex h-screen w-screen bg-gray-100 overflow-hidden font-sans">
      
      {/* View Switcher Mobile/Tablet */}
      {view !== TabView.UPLOAD && (
         <div className="lg:hidden absolute top-4 left-4 z-50 flex bg-white rounded-lg shadow-md p-1">
             <button onClick={() => setView(TabView.EDITOR)} className={`px-3 py-1 text-sm rounded ${view === TabView.EDITOR ? 'bg-indigo-100 text-indigo-700' : ''}`}>Edit</button>
             <button onClick={() => setView(TabView.PREVIEW)} className={`px-3 py-1 text-sm rounded ${view === TabView.PREVIEW ? 'bg-indigo-100 text-indigo-700' : ''}`}>Preview</button>
         </div>
      )}

      {/* Editor Panel (Sidebar) */}
      {(view === TabView.UPLOAD || view === TabView.EDITOR) && (
          <div className={`w-full lg:w-[400px] flex-shrink-0 h-full transition-all duration-300 ${view === TabView.UPLOAD ? 'lg:w-full items-center justify-center' : ''} ${view === TabView.PREVIEW ? 'hidden lg:block' : ''}`}>
             
             {view === TabView.UPLOAD ? (
                 <div className="max-w-xl w-full p-8 bg-white rounded-2xl shadow-xl text-center mx-4">
                    <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16"></polyline><line x1="12" y1="12" x2="12" y2="21"></line><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"></path><polyline points="16 16 12 12 8 16"></polyline></svg>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">BladeRunner</h1>
                    <p className="text-gray-500 mb-8">Upload a PDF or Image of your document. Gemini AI will convert it into a dynamic Laravel Blade template.</p>
                    
                    <div className="relative group">
                        <input 
                            type="file" 
                            accept="image/*,.pdf,.docx,.doc" 
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            disabled={docState.isAnalyzing}
                        />
                        <button className={`w-full py-4 rounded-xl border-2 border-dashed border-indigo-300 bg-indigo-50 text-indigo-700 font-medium group-hover:bg-indigo-100 transition-colors ${docState.isAnalyzing ? 'animate-pulse cursor-wait' : ''}`}>
                            {docState.isAnalyzing ? 'Analyzing Document with Gemini...' : 'Click to Upload PDF or Image'}
                        </button>
                    </div>
                    {docState.analysisError && (
                        <p className="text-red-500 mt-4 text-sm">{docState.analysisError}</p>
                    )}
                    <div className="mt-6 text-xs text-gray-400">
                        <p className="font-semibold mb-1">Supported:</p>
                        <ul className="list-disc pl-4 space-y-1">
                            <li><span className="font-medium text-gray-600">PDF</span> (Recommended for best layout)</li>
                            <li><span className="font-medium text-gray-600">JPG/PNG</span> (Screenshots/Scans)</li>
                        </ul>
                        <p className="mt-3 text-yellow-600">
                            * For Word/Google Docs, please <b>Export as PDF</b> first.
                        </p>
                    </div>
                 </div>
             ) : (
                 <EditorPanel 
                    settings={settings} 
                    setSettings={setSettings} 
                    onDownload={handleDownloadBlade} 
                 />
             )}
          </div>
      )}

      {/* Preview Area */}
      {view !== TabView.UPLOAD && (
        <div className={`flex-1 bg-gray-200 overflow-auto flex items-start justify-center p-8 lg:p-12 ${view === TabView.EDITOR ? 'hidden lg:flex' : ''}`}>
           <TemplatePreview settings={settings} />
        </div>
      )}
    </div>
  );
};

export default App;