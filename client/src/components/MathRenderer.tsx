import 'katex/dist/katex.min.css';
import { BlockMath, InlineMath } from 'react-katex';
import { useState, useRef, useCallback, useEffect } from 'react';
import { X, Image as ImageIcon } from 'lucide-react';

interface MathRendererProps {
  text: string;
  className?: string;
}

export function MathRenderer({ text, className = "" }: MathRendererProps) {
  if (!text) return null;

  const parts = text.split(/(\$\$[\s\S]*?\$\$|\$[^$]+\$)/g);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (part.startsWith('$$') && part.endsWith('$$')) {
          const mathContent = part.slice(2, -2);
          return (
            <span key={index} className="block my-2">
              <BlockMath math={mathContent} />
            </span>
          );
        }
        if (part.startsWith('$') && part.endsWith('$')) {
          const mathContent = part.slice(1, -1);
          return <InlineMath key={index} math={mathContent} />;
        }
        const asciiMathParts = parseAsciiMath(part);
        return (
          <span key={index}>
            {asciiMathParts.map((asciiPart, i) => 
              asciiPart.isMath ? (
                <InlineMath key={i} math={asciiPart.content} />
              ) : (
                <span key={i}>{asciiPart.content}</span>
              )
            )}
          </span>
        );
      })}
    </span>
  );
}

interface AsciiMathPart {
  content: string;
  isMath: boolean;
}

function parseAsciiMath(text: string): AsciiMathPart[] {
  const parts: AsciiMathPart[] = [];
  
  // Pattern to match actual math expressions (not just any text with a slash)
  // Match: numbers with operators, fractions like 1/15, exponents, sqrt, etc.
  const mathPattern = /(\d+\s*[*×]\s*\d+|\d+\s*\^\s*[\d\w(][^)\s]*\)?|\d+\/\d+|sqrt\([^)]+\)|(?<!\w)\bpi\b(?!\w)|(?<!\w)\btheta\b(?!\w)|>=|<=|!=|\+-|infinity)/gi;
  
  let lastIndex = 0;
  let match;
  
  while ((match = mathPattern.exec(text)) !== null) {
    // Add text before the match as plain text
    if (match.index > lastIndex) {
      parts.push({ content: text.slice(lastIndex, match.index), isMath: false });
    }
    
    // Convert the matched math expression to LaTeX
    let mathExpr = match[0];
    
    // Handle exponents with parentheses: 2^(t/3) -> 2^{t/3}
    mathExpr = mathExpr.replace(/\^(\([^)]+\))/g, (m, p1) => `^{${p1.slice(1, -1)}}`);
    
    // Handle simple exponents: x^2 -> x^{2}
    mathExpr = mathExpr.replace(/\^(\d+)/g, '^{$1}');
    mathExpr = mathExpr.replace(/\^(\w)/g, '^{$1}');
    
    // Handle square roots: sqrt(x) -> \sqrt{x}
    mathExpr = mathExpr.replace(/sqrt\(([^)]+)\)/g, '\\sqrt{$1}');
    
    // Handle fractions: a/b -> \frac{a}{b}
    mathExpr = mathExpr.replace(/(\d+)\/(\d+)/g, '\\frac{$1}{$2}');
    
    // Handle multiplication: * -> \times
    mathExpr = mathExpr.replace(/\s*[*×]\s*/g, ' \\times ');
    
    // Handle Greek letters
    mathExpr = mathExpr.replace(/\bpi\b/gi, '\\pi');
    mathExpr = mathExpr.replace(/\btheta\b/gi, '\\theta');
    
    // Handle comparison operators
    mathExpr = mathExpr.replace(/>=/g, '\\geq');
    mathExpr = mathExpr.replace(/<=/g, '\\leq');
    mathExpr = mathExpr.replace(/!=/g, '\\neq');
    
    // Handle special symbols
    mathExpr = mathExpr.replace(/infinity/gi, '\\infty');
    mathExpr = mathExpr.replace(/\+-/g, '\\pm');
    
    parts.push({ content: mathExpr, isMath: true });
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({ content: text.slice(lastIndex), isMath: false });
  }
  
  return parts.length > 0 ? parts : [{ content: text, isMath: false }];
}

interface MathTextareaProps {
  value: string;
  onChange: (value: string) => void;
  onImagesChange?: (images: string[]) => void;
  images?: string[];
  placeholder?: string;
  className?: string;
  [key: string]: any;
}

export function MathTextarea({ 
  value, 
  onChange, 
  onImagesChange,
  images = [],
  placeholder,
  className = "",
  ...props 
}: MathTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [localImages, setLocalImages] = useState<string[]>(images);

  // Sync localImages with images prop when parent clears/updates
  useEffect(() => {
    setLocalImages(images);
  }, [images]);

  const mathSymbols = [
    { label: 'Fraction', insert: '$\\frac{a}{b}$' },
    { label: 'Square Root', insert: '$\\sqrt{x}$' },
    { label: 'Exponent', insert: '$x^{2}$' },
    { label: 'Subscript', insert: '$x_{n}$' },
    { label: 'Plus/Minus', insert: '$\\pm$' },
    { label: 'Pi', insert: '$\\pi$' },
    { label: 'Sum', insert: '$\\sum_{i=1}^{n}$' },
    { label: 'Integral', insert: '$\\int_{a}^{b}$' },
    { label: 'Greater/Equal', insert: '$\\geq$' },
    { label: 'Less/Equal', insert: '$\\leq$' },
    { label: 'Not Equal', insert: '$\\neq$' },
    { label: 'Infinity', insert: '$\\infty$' },
  ];

  const insertSymbol = (symbol: string) => {
    onChange(value + symbol);
  };

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const base64 = event.target?.result as string;
            const newImages = [...localImages, base64];
            setLocalImages(newImages);
            onImagesChange?.(newImages);
          };
          reader.readAsDataURL(file);
        }
        return;
      }
    }
  }, [localImages, onImagesChange]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const base64 = event.target?.result as string;
          const newImages = [...localImages, base64];
          setLocalImages(newImages);
          onImagesChange?.(newImages);
        };
        reader.readAsDataURL(file);
      }
    });
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    const newImages = localImages.filter((_, i) => i !== index);
    setLocalImages(newImages);
    onImagesChange?.(newImages);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1 mb-2">
        <span className="text-xs text-muted-foreground mr-2">Math:</span>
        {mathSymbols.map((sym) => (
          <button
            key={sym.label}
            type="button"
            onClick={() => insertSymbol(sym.insert)}
            className="text-xs px-2 py-1 rounded border hover-elevate bg-background"
            title={`Insert ${sym.label}`}
            data-testid={`button-insert-${sym.label.toLowerCase().replace(/\s+/g, '-')}`}
          >
            {sym.label}
          </button>
        ))}
        <span className="mx-2 text-muted-foreground">|</span>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="text-xs px-2 py-1 rounded border hover-elevate bg-background flex items-center gap-1"
          title="Add image (or paste screenshot)"
          data-testid="button-add-image"
        >
          <ImageIcon className="h-3 w-3" />
          Add Image
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          data-testid="input-image-upload"
        />
      </div>

      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onPaste={handlePaste}
        placeholder={placeholder || "Type text here. Paste screenshots (Ctrl+V) or use Add Image button. Use $ for math notation."}
        className={`w-full min-h-[100px] p-3 border rounded-md resize-y ${className}`}
        {...props}
      />

      {localImages.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Attached Images ({localImages.length}):</p>
          <div className="flex flex-wrap gap-2">
            {localImages.map((img, index) => (
              <div key={index} className="relative group">
                <img 
                  src={img} 
                  alt={`Attached ${index + 1}`} 
                  className="h-24 w-auto rounded border object-contain bg-white"
                  data-testid={`image-preview-${index}`}
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove image"
                  data-testid={`button-remove-image-${index}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {value && value.includes('$') && (
        <div className="p-3 border rounded-md bg-muted/50">
          <p className="text-xs text-muted-foreground mb-2">Math Preview:</p>
          <MathRenderer text={value} />
        </div>
      )}
    </div>
  );
}
