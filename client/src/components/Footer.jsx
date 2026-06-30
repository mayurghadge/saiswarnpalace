import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-[#c4a35a] text-white">
      {/* Locate Store Section */}
      <div className="py-8 text-center border-b border-white/30">
        <button className="border-2 border-white px-12 py-3 rounded-full hover:bg-white hover:text-[#c4a35a] transition font-semibold">
          LOCATE STORE
        </button>
      </div>

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Company Info */}
          <div className="col-span-2 md:col-span-1">
            <h2 className="text-4xl font-bold mb-6" style={{ fontFamily: 'Georgia, serif' }}>
              SAI SWARN PALACE
            </h2>
            <div className="space-y-4">
              <p className="flex items-start gap-3">
                <span>📍</span>
                <span>No 48, Whites Road, Royapettah, Chennai - 600 014</span>
              </p>
              <p className="flex items-center gap-3">
                <span>✉️</span>
                <span>Sales: <a href="mailto:support@saiswarnpalace.com" className="underline">support@saiswarnpalace.com</a></span>
              </p>
              <p className="flex items-center gap-3">
                <span>📞</span>
                <span>(044)-42297700</span>
              </p>
            </div>
            <div className="flex gap-4 mt-6">
              <a href="#" className="hover:opacity-70 transition"><Facebook size={24} /></a>
              <a href="#" className="hover:opacity-70 transition"><Instagram size={24} /></a>
              <a href="#" className="hover:opacity-70 transition"><Twitter size={24} /></a>
            </div>
          </div>

          {/* Policies */}
          <div>
            <h3 className="font-bold text-lg mb-4">SAI SWARN PALACE POLICIES</h3>
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
            <h3 className="font-bold text-lg mb-4">CUSTOMER SERVICE</h3>
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
            <h3 className="font-bold text-lg mb-4">ABOUT SAI SWARN PALACE</h3>
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
            <h3 className="font-bold text-lg mb-4">QUICK LINKS</h3>
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
      <div className="border-t border-white/30 py-4 text-center text-sm">
        <p>© 2025 Sai Swarn Palace. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
