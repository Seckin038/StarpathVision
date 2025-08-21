import React from 'react';

const MarkdownRenderer = ({ text, className }: { text: string, className?: string }) => {
  // Split text by the bold markers, keeping the markers
  const parts = text.split(/(\*\*.*?\*\*)/g);

  return (
    <div className={className}>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          // If it's a bold part, render it as <strong>
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        // Otherwise, render it as plain text
        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </div>
  );
};

export default MarkdownRenderer;