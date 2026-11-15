import { expect, it } from 'vitest';
import { pageMetadata, siteBrandMetadata, SITE_URL } from '../../lib/siteMetadata';

it('gives each public route its own absolute canonical and share URL', () => {
  const paths = ['/', '/listings', '/report-lost', '/report-found', '/pets/example'];
  const canonicals = paths.map(path => {
    const metadata = pageMetadata({ path, title: 'Page | МӨР', description: 'Description' });
    const expected = new URL(path, SITE_URL).href;
    expect(metadata.alternates?.canonical).toBe(expected);
    expect(metadata.openGraph).toMatchObject({ url: expected });
    return metadata.alternates?.canonical;
  });
  expect(new Set(canonicals).size).toBe(paths.length);
});

it('does not let a root canonical or root share URL leak into child routes', () => {
  expect(siteBrandMetadata).not.toHaveProperty('alternates');
  expect(siteBrandMetadata.openGraph).not.toHaveProperty('url');
});
