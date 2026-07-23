import Head from "next/head";

export interface TMaintenanceMetaHeadLayoutProps {
  children: React.ReactNode;

  title?: string;
  description?: string;
}

const TestAppMetaLayout: React.FC<TMaintenanceMetaHeadLayoutProps> = ({ children, title, description }) => {
  const pageTitle = title ? `${title} - Web Blox Test App` : 'Web Blox Test App';

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta property="og:title" content={pageTitle} />
        <meta name="twitter:title" content={pageTitle} />

        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@webblox" />

        {description && (
          <>
            <meta name="description" content={description} />
            <meta property="og:description" content={description} />
            <meta name="twitter:description" content={description} />
          </>
        )}
      </Head>

      {children}
    </>
  )
}

export default TestAppMetaLayout;
