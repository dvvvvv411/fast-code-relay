import { Link } from 'react-router-dom';
const Header = () => {
  return <header className="bg-white py-4 px-6 shadow-sm">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <Link to="/" className="flex items-center">
            <img src="https://ulbgpsjexsgcpivphrxq.supabase.co/storage/v1/object/public/branding/logo_dark_1741580695335.png" alt="SMS Relay Logo" className="h-10 mr-3" />
            
          </Link>
        </div>
        <nav>
          <ul className="flex space-x-6">
            <li>
              <Link to="/" className="text-gray-600 hover:text-orange transition-colors">
                Home
              </Link>
            </li>
            <li>
              <Link to="/admin" className="text-gray-600 hover:text-orange transition-colors">
                Admin
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>;
};
export default Header;