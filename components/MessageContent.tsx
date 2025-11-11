'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github.css'

interface MessageContentProps {
  content: string
  role: 'user' | 'assistant'
}

export default function MessageContent({ content, role }: MessageContentProps) {
  if (role === 'user') {
    return <div className="whitespace-pre-wrap">{content}</div>
  }

  return (
    <div className="prose prose-sm max-w-none dark:prose-invert">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          pre: ({ node, ...props }) => (
            <pre
              {...props}
              className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 overflow-x-auto text-sm"
            />
          ),
          code: ({ node, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '')
            const inline = !match
            
            return (
              <code
                className={
                  inline
                    ? 'bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm'
                    : 'block'
                }
                {...props}
              >
                {children}
              </code>
            )
          },
          blockquote: ({ node, ...props }) => (
            <blockquote
              {...props}
              className="border-l-4 border-gray-300 pl-4 italic text-gray-700 dark:text-gray-300 dark:border-gray-600"
            />
          ),
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto">
              <table
                {...props}
                className="min-w-full border-collapse border border-gray-300 dark:border-gray-600"
              />
            </div>
          ),
          th: ({ node, ...props }) => (
            <th
              {...props}
              className="border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 px-4 py-2 text-left"
            />
          ),
          td: ({ node, ...props }) => (
            <td
              {...props}
              className="border border-gray-300 dark:border-gray-600 px-4 py-2"
            />
          ),
          ul: ({ node, ...props }) => (
            <ul {...props} className="list-disc list-inside space-y-1" />
          ),
          ol: ({ node, ...props }) => (
            <ol {...props} className="list-decimal list-inside space-y-1" />
          ),
          h1: ({ node, ...props }) => (
            <h1 {...props} className="text-xl font-bold mb-2 mt-4" />
          ),
          h2: ({ node, ...props }) => (
            <h2 {...props} className="text-lg font-bold mb-2 mt-3" />
          ),
          h3: ({ node, ...props }) => (
            <h3 {...props} className="text-base font-bold mb-1 mt-2" />
          ),
          p: ({ node, ...props }) => (
            <p {...props} className="mb-2 leading-relaxed" />
          ),
          a: ({ node, ...props }) => (
            <a
              {...props}
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
              target="_blank"
              rel="noopener noreferrer"
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}