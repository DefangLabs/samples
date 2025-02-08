import ClientComponent from './clientComponent';

export const dynamic = 'force-dynamic'; // Ensure the page is always rendered on the server

const HomePage = async () => {
  const serverUrl = (process.env.NEXT_PUBLIC_PROXY_SERVER_URL || 'http://localhost:4000') + "/forward";

  return (
    <div>
      <h1>Home Page (Server Side)</h1>
      <ClientComponent serverUrl={serverUrl} />
    </div>
  );
};

export default HomePage;