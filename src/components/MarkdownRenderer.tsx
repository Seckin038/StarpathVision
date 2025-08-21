import React from 'react';

const MarkdownRenderer = ({ text, className }: { text: string, className?: string }) => {
  // Process a single line for bold text
  const renderLine = (line: string) => {
    const parts = line.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold text-amber-200">{part.slice(2, -2)}</strong>;
      }
      return <React.Fragment key={i}>{part}</React.Fragment>;
    });
  };

  // Split the full text into paragraphs based on newlines
  const paragraphs = text.split('\n').filter(p => p.trim() !== '');

  return (
    <div className={className}>
      {paragraphs.map((paragraph, i) => (
        <p key={i} className="mb-4 last:mb-0">
          {renderLine(paragraph)}
        </p>
      ))}
    </div>
  );
};

export default MarkdownRenderer;