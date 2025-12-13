import React from 'react';
import ReactMarkdown from 'react-markdown';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  return (
    <ReactMarkdown
      skipHtml
      components={{
        h1: ({ children }) => (
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 fantasy-font mb-4">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-xl sm:text-2xl font-bold text-slate-100 fantasy-font mt-8 mb-3">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-lg font-semibold text-slate-100 mt-6 mb-2">{children}</h3>
        ),
        p: ({ children }) => (
          <p className="text-slate-300 leading-7 text-sm sm:text-base mb-4">{children}</p>
        ),
        ul: ({ children }) => (
          <ul className="list-disc pl-6 text-slate-300 leading-7 text-sm sm:text-base mb-4">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal pl-6 text-slate-300 leading-7 text-sm sm:text-base mb-4">
            {children}
          </ol>
        ),
        li: ({ children }) => <li className="mb-1">{children}</li>,
        a: ({ href, children }) => (
          <a
            href={href}
            className="text-cyan-300 hover:text-cyan-200 underline underline-offset-2"
            target="_blank"
            rel="noreferrer noopener"
          >
            {children}
          </a>
        ),
        code: ({ children }) => (
          <code className="px-1 py-0.5 rounded bg-slate-800/70 border border-white/10 text-slate-100 text-xs">
            {children}
          </code>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-amber-500/40 pl-4 text-slate-300 italic my-4">
            {children}
          </blockquote>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
};

export default MarkdownRenderer;

