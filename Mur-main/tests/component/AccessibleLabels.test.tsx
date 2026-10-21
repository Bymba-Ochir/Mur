import { it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LanguageProvider } from '../../lib/i18n';
import ThemeToggle from '../../components/ThemeToggle';
import PawTrail from '../../components/PawTrail';
it('announces theme action in English and updates after switching',()=>{
 localStorage.setItem('mur-lang','en');localStorage.setItem('mur-theme','light');
 render(<LanguageProvider><ThemeToggle/></LanguageProvider>);
 fireEvent.click(screen.getByRole('button',{name:'Switch to dark mode'}));
 expect(screen.getByRole('button',{name:'Switch to light mode'})).toBeInTheDocument();
 expect(document.documentElement).toHaveAttribute('data-theme','dark');
});
it('uses a translated step label and preserves explicit labels',()=>{
 localStorage.setItem('mur-lang','en');
 const {rerender}=render(<LanguageProvider><PawTrail labels={['One','Two']} current={0}/></LanguageProvider>);
 expect(screen.getByRole('list',{name:'Steps'})).toBeInTheDocument();
 rerender(<LanguageProvider><PawTrail labels={['One','Two']} current={0} ariaLabel="Report steps"/></LanguageProvider>);
 expect(screen.getByRole('list',{name:'Report steps'})).toBeInTheDocument();
});
