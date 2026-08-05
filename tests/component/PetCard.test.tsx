import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// next/navigation-ийн useRouter() нь бодит App Router context шаарддаг тул
// jsdom орчинд mock хийнэ (Playwright байхгүй үед энэ бол хамгийн ойрхон
// баталгаажуулах арга — бодит browser биш ч бодит React render/interaction).
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const { default: PetCard } = await import('../../components/PetCard');

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
  photoURL: null,
  embedding: null,
  lat: null,
  lng: null,
  resolved: false,
  createdBy: null,
  createdAt: new Date().toISOString(),
};

describe('PetCard — утасны дугаар нуух/харуулах', () => {
  it('эхлээд дугаараа маскдсан хэлбэрээр харуулна', () => {
    render(<PetCard pet={pet} />);
    expect(screen.getByText(/99\*+33/)).toBeInTheDocument();
    expect(screen.queryByText('☎ 99112233')).not.toBeInTheDocument();
  });

  it('"Дугаар харах" дарахад бүтэн дугаар гарч ирнэ', () => {
    render(<PetCard pet={pet} />);
    fireEvent.click(screen.getByText(/Дугаар харах/));
    expect(screen.getByText('99112233')).toBeInTheDocument();
  });

  it('"АЛДСАН" badge зөв харагдана', () => {
    render(<PetCard pet={pet} />);
    expect(screen.getByText('АЛДСАН')).toBeInTheDocument();
  });

  it('зурган бус үед PetIcon (SVG) харагдана', () => {
    const { container } = render(<PetCard pet={pet} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});
