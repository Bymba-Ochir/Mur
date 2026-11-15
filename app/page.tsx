import HomePage from './HomePage';
import { pageMetadata, SITE_DESCRIPTION, SITE_TITLE } from '../lib/siteMetadata';

export const metadata = pageMetadata({ path: '/', title: SITE_TITLE, description: SITE_DESCRIPTION });

export default function Home() {
  return <HomePage />;
}
