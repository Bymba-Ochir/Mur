import { it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
vi.mock('../../lib/useAuth',()=>({useAuth:()=>({user:null,loading:false})}));
vi.mock('../../lib/usePetForm',()=>({TYPE_VALUES:[],usePhotoUpload:vi.fn(),usePetLocation:vi.fn(),usePetSubmit:vi.fn()}));
vi.mock('../../components/LocationMap',()=>({default:()=>null}));
vi.mock('../../components/PetPreviewCard',()=>({default:()=>null}));
vi.mock('../../components/BreedSelect',()=>({default:()=>null}));
vi.mock('../../components/LoginModal',()=>({default:()=> <div role="dialog">login</div>}));
import PetForm from '../../components/PetForm';
import { LanguageProvider } from '../../lib/i18n';
it.each(['lost','found'] as const)('requires login before %s form hooks or uploads mount',status=>{
 render(<LanguageProvider><PetForm status={status}/></LanguageProvider>);
 expect(screen.getByText('Зар оруулахын тулд нэвтэрнэ үү')).toBeInTheDocument();
 expect(document.querySelector('input[type=file]')).toBeNull();
 fireEvent.click(screen.getByRole('button',{name:'Нэвтрэх'}));
 expect(screen.getByRole('dialog')).toBeInTheDocument();
});
