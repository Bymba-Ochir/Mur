import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// next/navigation-ийн useRouter() нь бодит App Router context шаарддаг тул
// jsdom орчинд mock хийнэ (Playwright байхгүй үед энэ бол хамгийн ойрхон
// баталгаажуулах арга — бодит browser биш ч бодит React render/interaction).
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const { default: PetCard } = await import('../../components/PetCard');
const { LanguageProvider } = await import('../../lib/i18n');

import type { Pet } from '../../lib/types';

const pet: Pet = {
  id: 'test-id',
  status: 'lost',
  type: 'Нохой',
  name: 'Богино',
  color: 'хар халзан',
  district: 'Баянзүрх',
  place: 'дэлгүүрийн ойролцоо',
  phone: '99112233',
  hasReward: false,
  reward: null,
  photoURL: null,
  embedding: null,
  lat: null,
  lng: null,
  resolved: false,
  createdBy: null,
  createdAt: new Date().toISOString(),
};

function renderCard() {
  return render(
    <LanguageProvider>
      <PetCard pet={pet} />
    </LanguageProvider>
  );
}

describe('PetCard — утасны дугаар нуух/харуулах', () => {
  it('эхлээд дугаараа маскдсан хэлбэрээр харуулна', () => {
    renderCard();
    expect(screen.getByText(/99\*+33/)).toBeInTheDocument();
    expect(screen.queryByText('☎ 99 11 22 33')).not.toBeInTheDocument();
  });

  it('"Дугаар харах" дарахад бүтэн дугаар гарч ирнэ (форматлагдсан: 99 11 22 33)', () => {
    renderCard();
    fireEvent.click(screen.getByText(/Дугаар харах/));
    expect(screen.getByText('99 11 22 33')).toBeInTheDocument();
  });

  it('"АЛДСАН" badge зөв харагдана', () => {
    renderCard();
    expect(screen.getByText('АЛДСАН')).toBeInTheDocument();
  });

  it('hasReward үед "Шагналтай" харагдана, дүн нь нууц', () => {
    render(
      <LanguageProvider>
        <PetCard pet={{ ...pet, hasReward: true, reward: 50000 }} />
      </LanguageProvider>
    );
    expect(screen.getByText('Шагналтай')).toBeInTheDocument();
    expect(screen.queryByText(/50000/)).not.toBeInTheDocument();
  });

  it('зурган бус үед PetIcon (SVG) харагдана', () => {
    const { container } = renderCard();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});
