import React, { useMemo } from 'react';
import { LetterSettings, Variable } from '../types';

interface TemplatePreviewProps {
  settings: LetterSettings;
  scale?: number;
}

const TemplatePreview: React.FC<TemplatePreviewProps> = ({ settings, scale = 1 }) => {

  const replaceVariables = (html: string) => {
    let content = html;
    settings.variables.forEach(v => {
      // Regex to replace {{ $key }} or {{$key}} or {{ $key}} etc.
      const regex = new RegExp(`\\{\\{\\s*\\$${v.key}\\s*\\}\\}`, 'g');
      content = content.replace(regex, `<span class="bg-yellow-100 text-yellow-800 px-1 rounded border border-yellow-300" title="$${v.key}">${v.defaultValue || v.key}</span>`);
    });
    return content;
  };

  // Replace variables in the content with their default values for preview
  const processedContent = useMemo(() => replaceVariables(settings.rawHtmlContent), [settings.rawHtmlContent, settings.variables]);
  
  // Process header content too
  const processedHeader = useMemo(() => replaceVariables(settings.headerContent), [settings.headerContent, settings.variables]);

  // CSS for the lines
  const lineStyle = {
    borderBottomWidth: `${settings.headerLineHeight}px`,
    borderBottomStyle: settings.headerLineDouble ? 'double' : 'solid',
    borderColor: 'black'
  };

  return (
    <div 
      className="a4-preview relative bg-white text-black box-border shadow-2xl transition-transform origin-top"
      style={{
        transform: `scale(${scale})`,
        paddingTop: `${settings.marginTop}cm`,
        paddingRight: `${settings.marginRight}cm`,
        paddingBottom: `${settings.marginBottom}cm`,
        paddingLeft: `${settings.marginLeft}cm`,
        fontFamily: settings.fontFamily,
        fontSize: `${settings.fontSize}pt`,
        color: '#000000' // Force black text
      }}
    >
      {/* Header / Kop Surat */}
      {settings.showKop && (
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-2">
            {settings.logoUrl && (
              <div className="flex-shrink-0" style={{ width: '80px' }}>
                <img 
                   src={settings.logoUrl} 
                   alt="Logo" 
                   className="w-full h-auto object-contain"
                />
              </div>
            )}
            {/* Header Content Area (Rich Text) */}
            <div 
                className="flex-grow text-center leading-tight text-black"
                dangerouslySetInnerHTML={{ __html: processedHeader }}
            />
          </div>
          {/* Header Line */}
          <div style={lineStyle} className="w-full mb-1"></div>
          {settings.headerLineDouble && <div className="w-full border-b border-black h-0.5"></div>}
        </div>
      )}

      {/* Content Body */}
      <div 
        className="content-body leading-relaxed text-black"
        dangerouslySetInnerHTML={{ __html: processedContent }}
      />

      {/* Signature */}
      {settings.showSignature && (
        <div className="mt-12 flex justify-end">
          <div className="text-center min-w-[200px] text-black">
            <p className="mb-2">Bandung, <span className="bg-yellow-100 px-1">{`{{ $tanggal }}`}</span></p>
            
            {settings.signatureType === 'wet' ? (
                // Wet Signature: Space for signing
                <div className="h-24"></div>
            ) : (
                // QR Signature: Placeholder
                <div className="h-24 flex items-center justify-center my-2">
                    <div className="border-2 border-dashed border-gray-400 p-2 rounded bg-gray-50 opacity-75">
                         {/* Simple QR placeholder using a public API or just a static image for preview */}
                         <img 
                            src="https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=ESignPreview" 
                            alt="QR Placeholder" 
                            className="w-20 h-20 opacity-80 mix-blend-multiply"
                         />
                         <p className="text-[8px] text-gray-500 mt-1">E-Sign</p>
                    </div>
                </div>
            )}

            <p className="font-bold underline mt-2">{settings.signatureName}</p>
            <p>{settings.signatureTitle}</p>
          </div>
        </div>
      )}
      
      {/* Watermark for preview mode */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-5 pointer-events-none text-6xl font-black rotate-45 select-none text-black">
        PREVIEW MODE
      </div>
    </div>
  );
};

export default TemplatePreview;