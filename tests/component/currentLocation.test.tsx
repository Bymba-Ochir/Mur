import { act, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { expect, it } from 'vitest';
import { useCurrentLocation } from '../../lib/useCurrentLocation';

function ShareLocation() {
  return <span data-testid="share-location">{useCurrentLocation()}</span>;
}

it('renders sharing controls on the server without reading the browser URL', () => {
  expect(renderToString(<ShareLocation />)).toBe('<span data-testid="share-location"></span>');
});

it('updates the share URL when the browser location changes', () => {
  const original = window.location.href;
  const { unmount } = render(<ShareLocation />);
  try {
    expect(screen.getByTestId('share-location')).toHaveTextContent(original);
    act(() => {
      window.history.replaceState(null, '', '#shared-section');
      window.dispatchEvent(new Event('hashchange'));
    });
    expect(screen.getByTestId('share-location')).toHaveTextContent(window.location.href);
  } finally {
    unmount();
    window.history.replaceState(null, '', original);
  }
});
