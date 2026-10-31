import ReactMarkdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import 'katex/dist/katex.min.css';
import { cn } from '@/lib/utils';

const isFormula = (text) => /\\[a-zA-Z]|[=^]/.test(text);
const oneLine = (text) => text.replace(/\s+/g, ' ').trim();

/** Whether a line following this text belongs to a list, judged by the last unindented line. */
function endsInList(text) {
  const lines = text.split('\n').filter((line) => /^\S/.test(line));
  return /^(?:[-*+]|\d+[.)])\s/.test(lines.at(-1) || '');
}

/**
 * The model writes LaTeX between \[ \] and \( \), which Markdown would treat as escaped
 * brackets. Rewrite both as $$ math. A display formula keeps its indent inside a list so it stays
 * in that item; anywhere else the indent goes, because Markdown would make it a code block.
 */
function normalizeMath(text) {
  return text
    .replace(/^([ \t]*)(.*?)\\\[([\s\S]+?)\\\]/gm, (match, indent, before, tex, offset, whole) => {
      if (!isFormula(tex)) return match;
      const pad = endsInList(whole.slice(0, offset)) ? indent : '';
      return `${pad}${before}\n\n${pad}$$\n${pad}${oneLine(tex)}\n${pad}$$\n`;
    })
    .replace(/\\\(([\s\S]+?)\\\)/g, (match, tex) => (isFormula(tex) ? `$$\\displaystyle ${oneLine(tex)}$$` : match));
}

// Single dollar signs stay plain text: in this app they're currency, not math.
const remarkPlugins = [remarkGfm, [remarkMath, { singleDollarTextMath: false }]];
const rehypePlugins = [[rehypeKatex, { fleqn: true, strict: 'ignore', errorColor: 'currentColor' }]];

const components = {
  h1: ({ children }) => <h3 className="mb-2 mt-4 font-display text-base font-medium text-ink first:mt-0">{children}</h3>,
  h2: ({ children }) => <h4 className="mb-2 mt-4 font-display text-[15px] font-medium text-ink first:mt-0">{children}</h4>,
  h3: ({ children }) => <h5 className="mb-1.5 mt-3 text-sm font-semibold text-ink first:mt-0">{children}</h5>,
  p: ({ children }) => <p className="mb-2.5 leading-relaxed last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-ink">{children}</strong>,
  ul: ({ children }) => <ul className="mb-2.5 list-disc space-y-1 pl-5 marker:text-faint">{children}</ul>,
  ol: ({ children }) => <ol className="mb-2.5 list-decimal space-y-1 pl-5 marker:text-faint">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  code: ({ children }) => (
    <code className="rounded bg-subtle px-1.5 py-0.5 font-mono text-[0.85em] text-ink">{children}</code>
  ),
  pre: ({ children }) => (
    <pre className="mb-2.5 overflow-x-auto rounded-lg border border-line bg-subtle p-3 font-mono text-xs [&_code]:bg-transparent [&_code]:p-0">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="mb-3 overflow-x-auto rounded-lg border border-line">
      <table className="w-full border-collapse text-[13px] tabular-nums">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-subtle">{children}</thead>,
  th: ({ children }) => <th className="border-b border-line px-3 py-2 text-left font-medium text-ink">{children}</th>,
  td: ({ children }) => <td className="border-b border-line px-3 py-2 align-top">{children}</td>,
  tr: ({ children }) => <tr className="last:[&>td]:border-b-0">{children}</tr>,
  blockquote: ({ children }) => (
    <blockquote className="my-2.5 border-l-2 border-line-strong pl-3 text-muted">{children}</blockquote>
  ),
  hr: () => <hr className="my-4 border-line" />,
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-brand underline underline-offset-2 hover:text-brand-hover">
      {children}
    </a>
  ),
};

/** Renders AI output (GitHub-flavoured markdown) in the app's typography. */
export default function Markdown({ children, className }) {
  return (
    <div className={cn('text-sm text-ink-2', className)}>
      <ReactMarkdown remarkPlugins={remarkPlugins} rehypePlugins={rehypePlugins} components={components}>
        {normalizeMath(children || '')}
      </ReactMarkdown>
    </div>
  );
}
