
import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header className="bg-white py-4 px-6 shadow-sm">
      <div className="container mx-auto flex justify-center">
        <div className="flex items-center">
          <Link to="/" className="flex items-center">
            <img src="https://ulbgpsjexsgcpivphrxq.supabase.co/storage/v1/object/public/branding/logo_dark_1741580695335.png" alt="SMS Relay Logo" className="h-10 mr-3" />
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
