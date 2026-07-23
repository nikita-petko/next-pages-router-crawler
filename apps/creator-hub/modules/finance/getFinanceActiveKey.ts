const TAXES_ROUTE = '/dashboard/devex/taxes';

const getFinanceActiveKey = (pathname: string): string => {
  if (pathname === TAXES_ROUTE || pathname.startsWith(`${TAXES_ROUTE}/`)) {
    return 'taxes';
  }

  const segments = pathname.split('/');
  return segments[segments.length - 1] ?? '';
};

export default getFinanceActiveKey;
