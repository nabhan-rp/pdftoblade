import React, { useState } from 'react';
import { LetterSettings, Variable } from '../types';
import { generateLogo } from '../services/geminiService';

interface EditorPanelProps {
  settings: LetterSettings;
  setSettings: React.Dispatch<React.SetStateAction<LetterSettings>>;
  onDownload: () => void;
}

const EditorPanel: React.FC<EditorPanelProps> = ({ settings, setSettings, onDownload }) => {
  const [logoPrompt, setLogoPrompt] = useState("");
  const [isGeneratingLogo, setIsGeneratingLogo] = useState(false);
  const [activeSection, setActiveSection] = useState<'layout' | 'header' | 'content' | 'variables'>('layout');

  const updateSetting = <K extends keyof LetterSettings>(key: K, value: LetterSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleGenerateLogo = async () => {
    if (!logoPrompt) return;
    setIsGeneratingLogo(true);
    try {
      const b64 = await generateLogo(logoPrompt, settings.logoAspectRatio);
      updateSetting('logoUrl', b64);
    } catch (e) {
      alert("Failed to generate logo. Try a different prompt.");
    } finally {
      setIsGeneratingLogo(false);
    }
  };

  const updateVariable = (id: string, field: keyof Variable, value: string) => {
    const newVars = settings.variables.map(v => v.id === id ? { ...v, [field]: value } : v);
    updateSetting('variables', newVars);
  };

  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <h2 className="font-bold text-gray-700">Template Settings</h2>
        <button 
          onClick={onDownload}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3 py-1.5 rounded flex items-center gap-1 shadow transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          Download .blade.php
        </button>
      </div>

      <div className="flex border-b border-gray-200 text-xs overflow-x-auto no-scrollbar">
        {['Layout', 'Header', 'Content', 'Variables'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveSection(tab.toLowerCase() as any)}
            className={`px-4 py-3 font-medium whitespace-nowrap transition-colors ${activeSection === tab.toLowerCase() ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        
        {/* LAYOUT SETTINGS */}
        {activeSection === 'layout' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Margins (cm)</label>
              <div className="grid grid-cols-2 gap-3">
                {['Top', 'Right', 'Bottom', 'Left'].map((side) => (
                  <div key={side}>
                    <label className="text-xs text-gray-400 block mb-1">{side}</label>
                    <input 
                      type="number" 
                      step="0.1"
                      value={settings[`margin${side}` as keyof LetterSettings] as number}
                      onChange={(e) => updateSetting(`margin${side}` as keyof LetterSettings, parseFloat(e.target.value))}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
               <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Typography</label>
               <div className="space-y-2">
                 <div>
                    <label className="text-xs text-gray-400">Font Family</label>
                    <select 
                      value={settings.fontFamily}
                      onChange={(e) => updateSetting('fontFamily', e.target.value)}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                    >
                      <option value='"Times New Roman", serif'>Times New Roman</option>
                      <option value='"Arial", sans-serif'>Arial</option>
                      <option value='"Calibri", sans-serif'>Calibri</option>
                    </select>
                 </div>
                 <div>
                    <label className="text-xs text-gray-400">Base Font Size (pt)</label>
                    <input 
                      type="number" 
                      value={settings.fontSize}
                      onChange={(e) => updateSetting('fontSize', parseInt(e.target.value))}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                    />
                 </div>
               </div>
            </div>
          </div>
        )}

        {/* HEADER SETTINGS */}
        {activeSection === 'header' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                checked={settings.showKop}
                onChange={(e) => updateSetting('showKop', e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm font-medium">Show Kop Surat</span>
            </div>

            {settings.showKop && (
              <>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <h3 className="text-xs font-bold text-gray-500 uppercase mb-3">Logo Settings</h3>
                    
                    {/* Aspect Ratio Selector */}
                    <div className="mb-3">
                        <label className="text-xs text-gray-400 block mb-1">Aspect Ratio</label>
                        <select
                            value={settings.logoAspectRatio}
                            onChange={(e) => updateSetting('logoAspectRatio', e.target.value)}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm mb-2"
                        >
                            <option value="1:1">1:1 (Square)</option>
                            <option value="4:3">4:3 (Standard)</option>
                            <option value="16:9">16:9 (Wide)</option>
                            <option value="3:4">3:4 (Portrait)</option>
                        </select>
                    </div>

                    <div className="mb-3">
                        <label className="text-xs text-gray-400 block mb-1">AI Generator</label>
                        <div className="flex gap-2">
                            <input 
                                type="text"
                                placeholder="e.g. Green shield university logo"
                                value={logoPrompt}
                                onChange={(e) => setLogoPrompt(e.target.value)}
                                className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
                            />
                            <button 
                                onClick={handleGenerateLogo}
                                disabled={isGeneratingLogo}
                                className="bg-indigo-600 text-white px-3 py-1 rounded text-xs hover:bg-indigo-700 disabled:opacity-50"
                            >
                                {isGeneratingLogo ? '...' : 'Gen'}
                            </button>
                        </div>
                    </div>
                </div>

                <div>
                  <label className="text-xs text-gray-400 block mb-1">Institution Name</label>
                  <input 
                    type="text" 
                    value={settings.institutionName}
                    onChange={(e) => updateSetting('institutionName', e.target.value)}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Address</label>
                  <textarea 
                    value={settings.institutionAddress}
                    onChange={(e) => updateSetting('institutionAddress', e.target.value)}
                    rows={2}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                  />
                </div>
                <div>
                    <label className="text-xs text-gray-400 block mb-1">Line Thickness (px)</label>
                    <input 
                      type="number"
                      value={settings.headerLineHeight}
                      onChange={(e) => updateSetting('headerLineHeight', parseInt(e.target.value))}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                    />
                </div>
                 <div className="flex items-center gap-2 mt-2">
                    <input 
                        type="checkbox" 
                        checked={settings.headerLineDouble}
                        onChange={(e) => updateSetting('headerLineDouble', e.target.checked)}
                        className="rounded text-indigo-600"
                    />
                    <span className="text-xs text-gray-600">Double Line Style</span>
                </div>
              </>
            )}
          </div>
        )}

        {/* CONTENT SETTINGS */}
        {activeSection === 'content' && (
          <div className="space-y-4">
             <div className="bg-yellow-50 p-3 rounded text-xs text-yellow-800 border border-yellow-200">
                Tip: The content below is raw HTML. Use the Variables tab to manage dynamic parts like names or dates.
             </div>
             <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Signature</label>
                <div className="space-y-2">
                    <input 
                        type="text" 
                        placeholder="Signer Name"
                        value={settings.signatureName}
                        onChange={(e) => updateSetting('signatureName', e.target.value)}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                    />
                    <input 
                        type="text" 
                        placeholder="Signer Title"
                        value={settings.signatureTitle}
                        onChange={(e) => updateSetting('signatureTitle', e.target.value)}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                    />
                </div>
             </div>
          </div>
        )}

        {/* VARIABLES SETTINGS */}
        {activeSection === 'variables' && (
          <div className="space-y-4">
            <p className="text-xs text-gray-500">These are the detected variables in your template (`{`{ $variable }`}`). Rename key to match your database.</p>
            {settings.variables.length === 0 && (
                <div className="text-center py-4 text-gray-400 text-sm">No variables detected.</div>
            )}
            {settings.variables.map((variable) => (
              <div key={variable.id} className="p-3 border border-gray-200 rounded bg-gray-50">
                <div className="grid gap-2">
                    <div>
                        <label className="text-[10px] uppercase font-bold text-gray-400">Blade Key ($)</label>
                        <input 
                            value={variable.key}
                            onChange={(e) => updateVariable(variable.id, 'key', e.target.value)}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm font-mono text-indigo-600"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] uppercase font-bold text-gray-400">Default/Preview Value</label>
                        <input 
                            value={variable.defaultValue}
                            onChange={(e) => updateVariable(variable.id, 'defaultValue', e.target.value)}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                        />
                    </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EditorPanel;
