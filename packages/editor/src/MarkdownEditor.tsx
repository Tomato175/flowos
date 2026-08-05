import React from 'react';
import { Input } from '@flow/ui';

export interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

/**
 * Markdown 编辑器占位组件
 * Phase 2 将替换为完整的编辑器实现（基于 TipTap / Milkdown）
 */
export function MarkdownEditor({ value, onChange, placeholder }: MarkdownEditorProps) {
  return (
    <div style={{ width: '100%' }}>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? '开始写点什么...'}
        style={{
          width: '100%',
          minHeight: 200,
          padding: 16,
          fontSize: 16,
          lineHeight: 1.6,
          border: '1.5px solid #d6d3d1',
          borderRadius: 12,
          resize: 'vertical',
          fontFamily: 'inherit',
          outline: 'none',
        }}
      />
    </div>
  );
}
