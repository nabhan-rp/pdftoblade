import React, { useMemo } from 'react';
import { LetterSettings, Variable } from '../types';

interface TemplatePreviewProps {
  settings: LetterSettings;
  scale?: number;
}

const TemplatePreview: React.FC<TemplatePreviewProps> = ({ settings, scale = 1 }) => {

  // Replace variables in the content with their default values for preview
  const processedContent = useMemo(() => {
    let content = settings.rawHtmlContent;
    settings.variables.forEach(v => {
      // Regex to replace {{ $key }} or {{$key}}
      const regex = new RegExp(`\\{\\{\\s*\\$${v.key}\\s*\\}\\}`, 'g');
      content = content.replace(regex, `<span class="bg-yellow-100 text-yellow-800 px-1 rounded border border-yellow-300" title="$${v.key}">${v.defaultValue || v.key}</span>`);
    });
    return content;
  }, [settings.rawHtmlContent, settings.variables]);

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
        fontSize: `${settings.fontSize}pt`
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
            <div className="flex-grow text-center uppercase leading-tight">
              <h1 className="font-bold text-lg">{settings.institutionName}</h1>
              <p className="text-sm font-normal normal-case">{settings.institutionAddress}</p>
            </div>
          </div>
          {/* Header Line */}
          <div style={lineStyle} className="w-full mb-1"></div>
          {settings.headerLineDouble && <div className="w-full border-b border-black h-0.5"></div>}
        </div>
      )}

      {/* Content Body */}
      <div 
        className="content-body leading-relaxed"
        dangerouslySetInnerHTML={{ __html: processedContent }}
      />

      {/* Signature */}
      {settings.showSignature && (
        <div className="mt-12 flex justify-end">
          <div className="text-center min-w-[200px]">
            <p className="mb-16">Bandung, <span className="bg-yellow-100 px-1">{`{{ $tanggal }}`}</span></p>
            <p className="font-bold underline">{settings.signatureName}</p>
            <p>{settings.signatureTitle}</p>
          </div>
        </div>
      )}
      
      {/* Watermark for preview mode */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-5 pointer-events-none text-6xl font-black rotate-45">
        PREVIEW MODE
      </div>
    </div>
  );
};

export default TemplatePreview;