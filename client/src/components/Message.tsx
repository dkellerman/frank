import { Marked } from 'marked';
import { cn } from '@/lib/utils';

const marked = new Marked({ breaks: true });

type Props = {
  role: 'user' | 'assistant';
  content: string;
  showCursor: boolean;
};

const CURSOR_HTML = `
  <span class="mr-1" />
  <span class="inline-block w-2 h-5 bg-gray-800 animate-pulse" style="animation-duration: 0.6s;" />
`;

export default function Message({ role, content, showCursor }: Props) {
  return (
    <div
      className={cn(
        'prose prose-md prose-neutral',
        role === 'user'
          ? 'w-fit max-w-[80%] self-end bg-blue-100 p-3 rounded-2xl shadow-sm'
          : 'self-start bg-transparent p-0 rounded-none dark:prose-invert'
      )}
      dangerouslySetInnerHTML={{ __html: marked.parse(content) + (showCursor ? CURSOR_HTML : '') }}
    />
  );
}
