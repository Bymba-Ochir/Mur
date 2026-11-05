'use client';

import { useState, type ReactNode } from 'react';
import { useServerInsertedHTML } from 'next/navigation';
import { createStyleRegistry, StyleRegistry } from 'styled-jsx';

export default function NonceStyleRegistry({ children, nonce }: { children: ReactNode; nonce: string }) {
  const [registry] = useState(() => createStyleRegistry());
  useServerInsertedHTML(() => {
    const styles = registry.styles({ nonce });
    registry.flush();
    return <>{styles}</>;
  });
  return <StyleRegistry registry={registry}>{children}</StyleRegistry>;
}
