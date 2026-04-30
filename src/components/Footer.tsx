import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-lg bg-green-600 flex items-center justify-center">
                <span className="text-white font-bold text-lg">E</span>
              </div>
              <span className="font-bold text-xl text-white">
                EKSU<span className="text-green-500">Market</span>
              </span>
            </div>
            <p className="text-sm">
              The #1 marketplace and social platform for Ekiti State University
              students. Buy, sell, connect, and stay informed.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-white mb-3">Marketplace</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/marketplace" className="hover:text-white transition-colors">
                  Browse Products
                </Link>
              </li>
              <li>
                <Link href="/marketplace/create" className="hover:text-white transition-colors">
                  Sell an Item
                </Link>
              </li>
              <li>
                <Link href="/marketplace" className="hover:text-white transition-colors">
                  Categories
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-white mb-3">Community</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/social" className="hover:text-white transition-colors">
                  Social Feed
                </Link>
              </li>
              <li>
                <Link href="/news" className="hover:text-white transition-colors">
                  Campus News
                </Link>
              </li>
              <li>
                <Link href="/messages" className="hover:text-white transition-colors">
                  Messages
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-white mb-3">Support</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  Help Centre
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  Safety Tips
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-sm text-center">
          &copy; {new Date().getFullYear()} EKSUMarket. Built for EKSU students,
          by EKSU students.
        </div>
      </div>
    </footer>
  );
}
