import React, { useRef, useEffect, useState } from 'react';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  defaultFontFamily: string;
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
  { label: '18pt', value: '18pt' },
  { label: '24pt', value: '24pt' },
];

const FONT_FAMILIES = [
  { label: 'Times New Roman', value: '"Times New Roman", serif' },
  { label: 'Arial', value: 'Arial, Helvetica, sans-serif' },
  { label: 'Calibri', value: 'Calibri, sans-serif' },
  { label: 'Verdana', value: 'Verdana, sans-serif' },
  { label: 'Courier New', value: '"Courier New", monospace' },
];

const RichTextEditor: React.FC<RichTextEditorProps> = ({ 
  content, 
  onChange, 
  defaultFontFamily, 
  placeholder, 
  availableVariables = [],
  onAddVariable,
  minHeight = '200px'
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showVarMenu, setShowVarMenu] = useState(false);

  // CRITICAL FIX FOR CURSOR BUG:
  // We do NOT use dangerouslySetInnerHTML in the render return.
  // We only sync the content IF it's different from the DOM and we aren't focused 
  // (or if it's an external update like variable insertion).
  useEffect(() => {
    if (editorRef.current) {
        const currentHtml = editorRef.current.innerHTML;
        // Only update DOM if content prop is significantly different
        // This prevents React from resetting the cursor position on every keystroke
        if (content !== currentHtml) {
             // If the element is focused, we have to be careful. 
             // Usually we only update from props if NOT focused, unless it's a forced external change.
             // However, for variable insertion, we need to update.
             // The check below ensures we don't overwrite typing.
             if (document.activeElement !== editorRef.current) {
                editorRef.current.innerHTML = content;
             } else {
                 // Even if focused, if the difference is huge (e.g. variable inserted via button), 
                 // we might want to update, but usually variable insertion is handled by execCommand which updates DOM first, then state.
                 // So we can mostly skip updating innerHTML while focused to avoid cursor jumping.
                 
                 // Edge case: If content is empty string, clear it
                 if (content === '' && currentHtml !== '') {
                     editorRef.current.innerHTML = '';
                 }
             }
        }
    }
  }, [content]);

  // Handle Input specifically to sync back to parent
  const handleInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      if (html !== content) {
          onChange(html);
      }
    }
  };

  const execCmd = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  const insertTable = () => {
    const tableHtml = `
      <table style="width: 100%; border-collapse: collapse; margin: 10px 0;">
        <thead>
          <tr>
            <th style="border: 1px solid #000; padding: 5px; background: #f0f0f0;">No</th>
            <th style="border: 1px solid #000; padding: 5px; background: #f0f0f0;">Item</th>
            <th style="border: 1px solid #000; padding: 5px; background: #f0f0f0;">Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border: 1px solid #000; padding: 5px;">1</td>
            <td style="border: 1px solid #000; padding: 5px;">Example Item</td>
            <td style="border: 1px solid #000; padding: 5px;">Details here</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 5px;">2</td>
            <td style="border: 1px solid #000; padding: 5px;">...</td>
            <td style="border: 1px solid #000; padding: 5px;">...</td>
          </tr>
        </tbody>
      </table>
      <p><br></p>
    `;
    document.execCommand('insertHTML', false, tableHtml);
    handleInput();
  };

  const handleFontSize = (size: string) => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const span = document.createElement('span');
      span.style.fontSize = size;
      
      try {
         if (!range.collapsed) {
             range.surroundContents(span);
         } else {
             span.appendChild(document.createTextNode('\u200B'));
             range.insertNode(span);
             range.setStart(span, 1);
             range.setEnd(span, 1);
         }
      } catch (e) {
          document.execCommand('fontSize', false, '3');
      }
      selection.removeAllRanges();
      selection.addRange(range);
      handleInput();
    }
  };

  const handleFontFamily = (font: string) => {
    document.execCommand('fontName', false, font);
    handleInput();
  };

  const insertVariable = (key: string) => {
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
    <div className="border border-gray-300 rounded-lg overflow-hidden bg-white flex flex-col shadow-sm w-full">
      {/* Classic Editor Toolbar */}
      <div className="bg-gray-100 border-b border-gray-300 p-1.5 flex flex-wrap gap-1 items-center sticky top-0 z-10">
        
        {/* Row 1: Formatting */}
        <div className="flex bg-white rounded border border-gray-300 mr-1 shadow-sm">
          <button onClick={() => execCmd('bold')} className="p-1.5 hover:bg-gray-200 text-gray-700" title="Bold"><b>B</b></button>
          <button onClick={() => execCmd('italic')} className="p-1.5 hover:bg-gray-200 text-gray-700" title="Italic"><i>I</i></button>
          <button onClick={() => execCmd('underline')} className="p-1.5 hover:bg-gray-200 text-gray-700" title="Underline"><u>U</u></button>
          <button onClick={() => execCmd('strikeThrough')} className="p-1.5 hover:bg-gray-200 text-gray-700" title="Strike"><s>S</s></button>
        </div>

        {/* Alignment */}
        <div className="flex bg-white rounded border border-gray-300 mr-1 shadow-sm">
            <button onClick={() => execCmd('justifyLeft')} className="p-1.5 hover:bg-gray-200 text-gray-600" title="Left"><span className="block w-3 h-0.5 bg-current mb-0.5"></span><span className="block w-2 h-0.5 bg-current mb-0.5"></span><span className="block w-3 h-0.5 bg-current"></span></button>
            <button onClick={() => execCmd('justifyCenter')} className="p-1.5 hover:bg-gray-200 text-gray-600" title="Center"><span className="block w-3 h-0.5 bg-current mb-0.5 mx-auto"></span><span className="block w-2 h-0.5 bg-current mb-0.5 mx-auto"></span><span className="block w-3 h-0.5 bg-current mx-auto"></span></button>
            <button onClick={() => execCmd('justifyRight')} className="p-1.5 hover:bg-gray-200 text-gray-600" title="Right"><span className="block w-3 h-0.5 bg-current mb-0.5 ml-auto"></span><span className="block w-2 h-0.5 bg-current mb-0.5 ml-auto"></span><span className="block w-3 h-0.5 bg-current ml-auto"></span></button>
            <button onClick={() => execCmd('justifyFull')} className="p-1.5 hover:bg-gray-200 text-gray-600" title="Justify"><span className="block w-3 h-0.5 bg-current mb-0.5"></span><span className="block w-3 h-0.5 bg-current mb-0.5"></span><span className="block w-3 h-0.5 bg-current"></span></button>
        </div>

        {/* Lists & Indent */}
        <div className="flex bg-white rounded border border-gray-300 mr-1 shadow-sm">
           <button onClick={() => execCmd('insertUnorderedList')} className="p-1.5 hover:bg-gray-200" title="Bullet List">•</button>
           <button onClick={() => execCmd('insertOrderedList')} className="p-1.5 hover:bg-gray-200" title="Numbered List">1.</button>
        </div>

        {/* Table & HR */}
        <div className="flex bg-white rounded border border-gray-300 mr-1 shadow-sm">
            <button onClick={insertTable} className="p-1.5 hover:bg-gray-200 text-xs font-bold px-2" title="Insert Table">Table</button>
            <button onClick={() => execCmd('insertHorizontalRule')} className="p-1.5 hover:bg-gray-200 text-xs px-2" title="Horizontal Line">HR</button>
        </div>

        <div className="w-full h-0 basis-full lg:hidden"></div> {/* Break row on small screens */}

        {/* Fonts */}
        <select onChange={(e) => handleFontFamily(e.target.value)} className="text-xs border border-gray-300 rounded h-8 px-1 mr-1 bg-white" defaultValue="">
            <option value="" disabled>Font Family</option>
            {FONT_FAMILIES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>

        <select onChange={(e) => handleFontSize(e.target.value)} className="text-xs border border-gray-300 rounded h-8 px-1 mr-1 bg-white" defaultValue="">
            <option value="" disabled>Size</option>
            {FONT_SIZES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>

        {/* Variables */}
        <div className="relative ml-auto">
            <button 
                onClick={() => setShowVarMenu(!showVarMenu)}
                className="flex items-center gap-1 bg-indigo-600 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-indigo-700 shadow-sm"
            >
                <span>{`{ }`}</span> Add Variable
            </button>
            
            {showVarMenu && (
                <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-gray-200 rounded shadow-xl z-50 max-h-60 overflow-y-auto">
                    <button onClick={promptNewVariable} className="w-full text-left px-3 py-2 text-xs text-indigo-600 font-bold hover:bg-gray-50 border-b border-gray-100">+ New Variable...</button>
                    {availableVariables.map(v => (
                        <button key={v.id} onClick={() => insertVariable(v.key)} className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 flex justify-between group">
                            <span>${v.key}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
      </div>

      {/* Editor Content Area */}
      <div 
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="flex-1 p-8 outline-none prose prose-sm max-w-none focus:bg-white text-left cursor-text overflow-auto"
        style={{ 
            fontFamily: defaultFontFamily,
            minHeight,
            resize: 'vertical',
            textAlign: 'left', 
            width: '100%' 
        }}
        // Removed dangerouslySetInnerHTML to prevent React re-render conflicts
      />
    </div>
  );
};

export default RichTextEditor;