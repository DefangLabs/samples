import ClientComponent from './clientComponent';

const HomePage = async () => {
  return (
    <div>
      <h1>Home Page (Server Side)</h1>
      <ClientComponent  />
    </div>
  );
};

export default HomePage;