import React, { useRef, useEffect, useState } from 'react';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  fontFamily: string;
  placeholder?: string;
  availableVariables?: { key: string; label: string }[];
  onAddVariable?: (key: string) => void;
  minHeight?: string;
}

const FONT_SIZES = [
  { label: '10pt', value: '10pt' },
  { label: '11pt', value: '11pt' },
  { label: '12pt', value: '12pt' },
  { label: '14pt', value: '14pt' },
  { label: '16pt', value: '16pt' },
  { label: '18pt', value: '18pt' },
  { label: '20pt', value: '20pt' },
  { label: '24pt', value: '24pt' },
];

const RichTextEditor: React.FC<RichTextEditorProps> = ({ 
  content, 
  onChange, 
  fontFamily, 
  placeholder, 
  availableVariables = [],
  onAddVariable,
  minHeight = '200px'
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showVarMenu, setShowVarMenu] = useState(false);

  // Sync content updates strictly when needed to avoid cursor jumping
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== content) {
      // Only update if significantly different to prevent loop, 
      // but in contentEditable generic usage, this is tricky. 
      // We rely on initial load mainly or external reset.
      if (document.activeElement !== editorRef.current) {
         editorRef.current.innerHTML = content;
      }
    }
  }, [content]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCmd = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  const handleFontSize = (size: string) => {
    // execCommand fontSize only supports 1-7. We need spans for specific pt sizes.
    // This is a workaround to wrap selection in span.
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const span = document.createElement('span');
      span.style.fontSize = size;
      
      if (range.collapsed) {
         // If no text selected, we can't easily insert a span that stays 'active' without typing.
         // Fallback: simpler execCommand for basic size or strict toggle.
         // Creating a text node inside:
         span.appendChild(document.createTextNode('\u200B')); // zero width space
         range.insertNode(span);
         range.setStart(span, 1);
         range.setEnd(span, 1);
      } else {
         try {
             range.surroundContents(span);
         } catch (e) {
             // Fallback for complex overlapping tags
             execCmd('fontSize', '7'); // Make it huge so user sees change, then apply style via regex? Hard.
             // Better fallback: document.execCommand('insertHTML')
             const content = range.extractContents();
             span.appendChild(content);
             range.insertNode(span);
         }
      }
      selection.removeAllRanges();
      selection.addRange(range);
      handleInput();
    }
  };

  const insertVariable = (key: string) => {
    // Insert Blade syntax
    const text = `{{ $${key} }}`;
    document.execCommand('insertText', false, text);
    setShowVarMenu(false);
    handleInput();
    if (onAddVariable) onAddVariable(key);
  };

  const promptNewVariable = () => {
    const name = prompt("Enter variable name (e.g. nomor_surat):");
    if (name) {
      const cleanName = name.replace(/[^a-zA-Z0-9_]/g, '');
      insertVariable(cleanName);
    }
  };

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden bg-white flex flex-col shadow-sm">
      {/* Toolbar */}
      <div className="bg-gray-50 border-b border-gray-200 p-2 flex flex-wrap gap-1 items-center sticky top-0 z-10">
        
        {/* Font Style Group */}
        <div className="flex bg-white rounded border border-gray-300 mr-2">
          <button onClick={() => execCmd('bold')} className="p-1.5 hover:bg-gray-100 text-gray-700" title="Bold">
            <b className="font-serif">B</b>
          </button>
          <button onClick={() => execCmd('italic')} className="p-1.5 hover:bg-gray-100 text-gray-700" title="Italic">
            <i className="font-serif">I</i>
          </button>
          <button onClick={() => execCmd('underline')} className="p-1.5 hover:bg-gray-100 text-gray-700" title="Underline">
            <u className="font-serif">U</u>
          </button>
        </div>

        {/* Alignment Group */}
        <div className="flex bg-white rounded border border-gray-300 mr-2">
            <button onClick={() => execCmd('justifyLeft')} className="p-1.5 hover:bg-gray-100 text-gray-600" title="Align Left">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="17" y1="10" x2="3" y2="10"></line><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="14" x2="3" y2="14"></line><line x1="17" y1="18" x2="3" y2="18"></line></svg>
            </button>
            <button onClick={() => execCmd('justifyCenter')} className="p-1.5 hover:bg-gray-100 text-gray-600" title="Align Center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="21" y1="10" x2="3" y2="10"></line><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="14" x2="3" y2="14"></line><line x1="21" y1="18" x2="3" y2="18"></line></svg>
            </button>
            <button onClick={() => execCmd('justifyRight')} className="p-1.5 hover:bg-gray-100 text-gray-600" title="Align Right">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="21" y1="10" x2="7" y2="10"></line><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="14" x2="3" y2="14"></line><line x1="21" y1="18" x2="7" y2="18"></line></svg>
            </button>
            <button onClick={() => execCmd('justifyFull')} className="p-1.5 hover:bg-gray-100 text-gray-600" title="Justify">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="21" y1="10" x2="3" y2="10"></line><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="14" x2="3" y2="14"></line><line x1="21" y1="18" x2="3" y2="18"></line></svg>
            </button>
        </div>

        {/* Font Size */}
        <select 
            onChange={(e) => handleFontSize(e.target.value)} 
            className="text-xs border border-gray-300 rounded h-8 px-1 mr-2 bg-white text-gray-700 outline-none"
            defaultValue=""
        >
            <option value="" disabled>Size</option>
            {FONT_SIZES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>

        {/* Variables Button */}
        <div className="relative">
            <button 
                onClick={() => setShowVarMenu(!showVarMenu)}
                className="flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2 py-1.5 rounded border border-indigo-200 text-xs font-medium hover:bg-indigo-100"
            >
                <span>{`{ }`}</span> Insert Variable
            </button>
            
            {showVarMenu && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded shadow-xl z-50 max-h-60 overflow-y-auto">
                    <button 
                        onClick={promptNewVariable}
                        className="w-full text-left px-3 py-2 text-xs text-indigo-600 font-bold hover:bg-gray-50 border-b border-gray-100"
                    >
                        + New Variable...
                    </button>
                    {availableVariables.map(v => (
                        <button 
                            key={v.id}
                            onClick={() => insertVariable(v.key)}
                            className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 flex justify-between group"
                        >
                            <span>${v.key}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
        
        {/* Clear formatting */}
        <button onClick={() => execCmd('removeFormat')} className="ml-auto text-xs text-gray-400 hover:text-red-500 px-2" title="Clear Formatting">
            Clear Format
        </button>
      </div>

      {/* Editor Content Area */}
      <div 
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="flex-1 p-4 outline-none prose prose-sm max-w-none focus:bg-gray-50/30 transition-colors"
        style={{ 
            fontFamily,
            minHeight,
            // Allow user to resize vertically if needed
            resize: 'vertical',
            overflow: 'auto'
        }}
        // Initialize content only once on mount is handled by useEffect
        dangerouslySetInnerHTML={{ __html: content }} 
      />
    </div>
  );
};

export default RichTextEditor;