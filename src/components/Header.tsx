
import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header className="bg-white py-4 px-6 shadow-sm">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <div className="text-orange font-bold text-2xl">SMS Relay</div>
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
    </header>
  );
};

export default Header;
