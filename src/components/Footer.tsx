
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-white py-3 border-t border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap justify-center text-sm text-gray-500 gap-4 md:gap-6">
          <Link to="https://expandere-agentur.com/datenschutz" className="hover:text-orange-500 transition-colors">
            Datenschutz
          </Link>
          <Link to="https://expandere-agentur.com/agb" className="hover:text-orange-500 transition-colors">
            AGB
          </Link>
          <Link to="https://expandere-agentur.com/impressum" className="hover:text-orange-500 transition-colors">
            Impressum
          </Link>
          <Link to="https://expandere-agentur.com/cookie-einstellungen" className="hover:text-orange-500 transition-colors">
            Cookie-Einstellungen
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
