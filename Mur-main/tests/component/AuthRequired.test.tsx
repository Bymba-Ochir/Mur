import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AuthRequired from '../../components/AuthRequired';
import { LanguageProvider } from '../../lib/i18n';

const { authState } = vi.hoisted(() => ({
  authState: {
    user: null as { id: string } | null,
    loading: false,
  },
}));

vi.mock('../../lib/useAuth', () => ({
  useAuth: () => authState,
}));

vi.mock('../../components/LoginModal', () => ({
  default: ({ onClose }: { onClose: () => void }) => (
    <div role="dialog">
      login
      <button onClick={onClose}>close</button>
    </div>
  ),
}));

describe('AuthRequired', () => {
  beforeEach(() => {
    authState.user = null;
    authState.loading = false;
  });

  it('keeps protected children unmounted until a user is authenticated', () => {
    render(
      <LanguageProvider>
        <AuthRequired>
          <div>protected form</div>
        </AuthRequired>
      </LanguageProvider>
    );

    expect(screen.queryByText('protected form')).not.toBeInTheDocument();
    expect(screen.getByText('Зар оруулахын тулд нэвтэрнэ үү')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Нэвтрэх' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('renders protected children for an authenticated user', () => {
    authState.user = { id: 'user-1' };

    render(
      <LanguageProvider>
        <AuthRequired>
          <div>protected form</div>
        </AuthRequired>
      </LanguageProvider>
    );

    expect(screen.getByText('protected form')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Нэвтрэх' })).not.toBeInTheDocument();
  });

  it('allows flow-specific copy without duplicating auth behavior', () => {
    render(
      <LanguageProvider>
        <AuthRequired title="Custom title" description="Custom description" loginLabel="Custom login">
          <div>protected form</div>
        </AuthRequired>
      </LanguageProvider>
    );

    expect(screen.getByText('Custom title')).toBeInTheDocument();
    expect(screen.getByText('Custom description')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Custom login' })).toBeInTheDocument();
  });
});
