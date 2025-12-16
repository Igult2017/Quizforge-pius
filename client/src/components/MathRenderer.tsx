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
  const patterns = [
    { regex: /sqrt\(([^)]+)\)/g, replace: (m: string, p1: string) => `\\sqrt{${p1}}` },
    { regex: /(\d+)\/(\d+)/g, replace: (m: string, p1: string, p2: string) => `\\frac{${p1}}{${p2}}` },
    { regex: /(\w)\^(\d+)/g, replace: (m: string, p1: string, p2: string) => `${p1}^{${p2}}` },
    { regex: /(\w)\^{([^}]+)}/g, replace: (m: string, p1: string, p2: string) => `${p1}^{${p2}}` },
    { regex: /pi\b/g, replace: () => `\\pi` },
    { regex: /theta\b/g, replace: () => `\\theta` },
    { regex: />=/g, replace: () => `\\geq` },
    { regex: /<=/g, replace: () => `\\leq` },
    { regex: /!=/g, replace: () => `\\neq` },
    { regex: /infinity/g, replace: () => `\\infty` },
    { regex: /\+-/g, replace: () => `\\pm` },
  ];
  
  let result = text;
  let hasMath = false;
  
  for (const pattern of patterns) {
    if (pattern.regex.test(result)) {
      hasMath = true;
      result = result.replace(pattern.regex, pattern.replace as any);
    }
  }
  
  if (hasMath && result !== text) {
    return [{ content: result, isMath: true }];
  }
  
  return [{ content: text, isMath: false }];
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
