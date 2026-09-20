import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Youtube } from '../lib/lucide-react-compat';

const Footer = () => {
  return (
    <footer className="bg-[#c4a35a] text-white">
      {/* Locate Store Section */}
      <div className="w-full py-7 sm:py-8 text-center border-b border-white/30">
        <button className="w-[min(86vw,13rem)] border-2 border-white px-5 py-3 rounded-full hover:bg-white hover:text-[#c4a35a] transition font-semibold text-sm sm:text-base">
          LOCATE STORE
        </button>
      </div>

      {/* Main Footer */}
      <div className="w-full px-5 py-10 sm:px-8 sm:py-12 lg:px-12 xl:px-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-x-8 gap-y-10 lg:gap-x-10">
          {/* Company Info */}
          <div className="sm:col-span-2 lg:col-span-1">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6 leading-tight" style={{ fontFamily: 'Georgia, serif' }}>
              SAI SWARN PALACE
            </h2>
            <div className="space-y-4">
              <p className="flex items-start gap-3">
                <span>📍</span>
                <span>Sridevi Complex, Main Road, Narasannapeta, Andhra Pradesh - 532421.</span>
              </p>
              <p className="flex items-center gap-3">
                <span>✉️</span>
                <span className="min-w-0">Sales: <a href="mailto:support@saiswarnpalace@gmail.com" className="underline break-all">support@saiswarnpalace@gmail.com</a></span>
              </p>
              <p className="flex items-center gap-3">
                <span>📞</span>
                <span>(+91) (83053 69369)</span>
              </p>
            </div>
            <div className="flex flex-wrap gap-2 mt-6">
              <a href="https://www.facebook.com/Saibabapearls/" aria-label="Facebook" className="w-10 h-10 flex items-center justify-center hover:opacity-70 transition"><Facebook size={22} /></a>
              <a href="https://www.instagram.com/saibabapearls_saiswarnpalace/" aria-label="Instagram" className="w-10 h-10 flex items-center justify-center hover:opacity-70 transition"><Instagram size={22} /></a>
              <a href="https://x.com/saibaba_pearls" aria-label="Twitter" className="w-10 h-10 flex items-center justify-center hover:opacity-70 transition"><Twitter size={22} /></a>
              <a href="https://www.youtube.com/@SaiBabaPearls_SaiSwarnPalace/" aria-label="YouTube" className="w-10 h-10 flex items-center justify-center hover:opacity-70 transition"><Youtube size={22} /></a>
            </div>
          </div>

          {/* Policies */}
          <div>
            <h3 className="font-bold text-base sm:text-lg mb-4 leading-snug">SAI SWARN PALACE POLICIES</h3>
            <ul className="space-y-2">
              <li><Link to="#" className="hover:underline">Privacy Policy</Link></li>
              <li><Link to="#" className="hover:underline">Terms and Conditions</Link></li>
              <li><Link to="#" className="hover:underline">Shipping Policy</Link></li>
              <li><Link to="#" className="hover:underline">Return Policy</Link></li>
              <li><Link to="#" className="hover:underline">Cancellation Policy</Link></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="font-bold text-base sm:text-lg mb-4 leading-snug">CUSTOMER SERVICE</h3>
            <ul className="space-y-2">
              <li><Link to="#" className="hover:underline">Contact Us</Link></li>
              <li><Link to="#" className="hover:underline">FAQs</Link></li>
              <li><Link to="#" className="hover:underline">Return Request</Link></li>
              <li><Link to="#" className="hover:underline">Payment Options</Link></li>
              <li><Link to="#" className="hover:underline">Orders Tracking</Link></li>
            </ul>
          </div>

          {/* About */}
          <div>
            <h3 className="font-bold text-base sm:text-lg mb-4 leading-snug">ABOUT SAI SWARN PALACE</h3>
            <ul className="space-y-2">
              <li><Link to="#" className="hover:underline">About Us</Link></li>
              <li><Link to="#" className="hover:underline">Careers</Link></li>
              <li><Link to="#" className="hover:underline">Store Locator</Link></li>
              <li><Link to="#" className="hover:underline">Investor Information</Link></li>
              <li><Link to="#" className="hover:underline">Customer Testimonial</Link></li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-base sm:text-lg mb-4 leading-snug">QUICK LINKS</h3>
            <ul className="space-y-2">
              <li><Link to="#" className="hover:underline">Blog</Link></li>
              <li><Link to="#" className="hover:underline">CSR</Link></li>
              <li><Link to="#" className="hover:underline">News and Events</Link></li>
              <li><Link to="#" className="hover:underline">Sitemap</Link></li>
              <li><Link to="#" className="hover:underline">Video</Link></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-white/30 px-5 py-4 text-center text-xs sm:text-sm">
        <p>© 2025 Sai Swarn Palace. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
