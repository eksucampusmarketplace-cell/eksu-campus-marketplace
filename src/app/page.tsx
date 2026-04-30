import Link from "next/link";
import {
  ShoppingBag,
  Users,
  MessageCircle,
  Newspaper,
  ArrowRight,
  TrendingUp,
  Shield,
  Zap,
} from "lucide-react";
import { products, posts, newsArticles } from "@/data/mock";
import ProductCard from "@/components/ProductCard";

const features = [
  {
    icon: ShoppingBag,
    title: "Campus Marketplace",
    description:
      "Buy and sell textbooks, electronics, furniture, and more with fellow students.",
    href: "/marketplace",
    color: "bg-green-50 text-green-600",
  },
  {
    icon: Users,
    title: "Social Feed",
    description:
      "Connect with classmates, share updates, and stay in the loop on campus life.",
    href: "/social",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: MessageCircle,
    title: "Instant Messaging",
    description:
      "Chat directly with buyers, sellers, and friends in real time.",
    href: "/messages",
    color: "bg-purple-50 text-purple-600",
  },
  {
    icon: Newspaper,
    title: "Campus News",
    description:
      "Stay updated with the latest EKSU news, events, and announcements.",
    href: "/news",
    color: "bg-orange-50 text-orange-500",
  },
];

export default function HomePage() {
  return (
    <div className="pb-20 md:pb-0">
      {/* Hero */}
      <section className="bg-gradient-to-br from-green-700 via-green-600 to-green-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-24">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">
              Your Campus,{" "}
              <span className="text-green-200">Your Marketplace</span>
            </h1>
            <p className="mt-4 text-lg text-green-100 leading-relaxed">
              Buy, sell, connect, and stay informed. EKSUMarket is the all-in-one
              platform built for Ekiti State University students.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/marketplace"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-green-700 font-semibold rounded-lg hover:bg-green-50 transition-colors"
              >
                <ShoppingBag className="w-5 h-5" />
                Browse Marketplace
              </Link>
              <Link
                href="/auth/register"
                className="inline-flex items-center gap-2 px-6 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white/10 transition-colors"
              >
                Join Now
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-2xl md:text-3xl font-bold text-green-600">2,500+</p>
              <p className="text-sm text-gray-500 mt-1">Active Students</p>
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-bold text-green-600">1,200+</p>
              <p className="text-sm text-gray-500 mt-1">Products Listed</p>
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-bold text-green-600">500+</p>
              <p className="text-sm text-gray-500 mt-1">Daily Transactions</p>
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-bold text-green-600">50+</p>
              <p className="text-sm text-gray-500 mt-1">Departments</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="text-2xl font-bold text-gray-900 text-center">
          Everything You Need on Campus
        </h2>
        <p className="text-gray-500 text-center mt-2 max-w-lg mx-auto">
          One platform for all your campus needs — from buying and selling to
          socializing and staying informed.
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-10">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Link
                key={feature.href}
                href={feature.href}
                className="group p-6 bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-shadow"
              >
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center ${feature.color}`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-gray-900 mt-4">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-500 mt-2">
                  {feature.description}
                </p>
                <span className="inline-flex items-center gap-1 text-sm text-green-600 font-medium mt-3 group-hover:gap-2 transition-all">
                  Explore <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Recent Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Latest Listings</h2>
          <Link
            href="/marketplace"
            className="text-sm text-green-600 font-medium hover:text-green-700 flex items-center gap-1"
          >
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.slice(0, 4).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Recent News */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Campus News</h2>
          <Link
            href="/news"
            className="text-sm text-green-600 font-medium hover:text-green-700 flex items-center gap-1"
          >
            All news <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {newsArticles.slice(0, 3).map((article) => (
            <Link
              key={article.id}
              href={`/news/${article.id}`}
              className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="aspect-video overflow-hidden">
                <img
                  src={article.image}
                  alt={article.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-4">
                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                  {article.category}
                </span>
                <h3 className="font-semibold text-gray-900 mt-2 line-clamp-2">
                  {article.title}
                </h3>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                  {article.excerpt}
                </p>
                <p className="text-xs text-gray-400 mt-3">
                  {article.createdAt} · {article.readTime}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Why EKSUMarket */}
      <section className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
          <h2 className="text-2xl font-bold text-gray-900 text-center">
            Why Students Love EKSUMarket
          </h2>
          <div className="grid md:grid-cols-3 gap-8 mt-10">
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto">
                <Shield className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mt-4">
                Safe & Verified
              </h3>
              <p className="text-sm text-gray-500 mt-2">
                All users are verified EKSU students. Trade with confidence
                within your campus community.
              </p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mx-auto">
                <Zap className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mt-4">
                Fast & Easy
              </h3>
              <p className="text-sm text-gray-500 mt-2">
                List items in seconds, find what you need instantly, and connect
                with buyers/sellers on campus.
              </p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-purple-50 flex items-center justify-center mx-auto">
                <TrendingUp className="w-7 h-7 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mt-4">
                Stay Connected
              </h3>
              <p className="text-sm text-gray-500 mt-2">
                Beyond buying and selling — join discussions, read campus news,
                and build your network.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-green-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 text-center">
          <h2 className="text-2xl md:text-3xl font-bold">
            Ready to Join the EKSU Community?
          </h2>
          <p className="mt-3 text-green-100 max-w-lg mx-auto">
            Sign up today and start buying, selling, and connecting with fellow
            students on campus.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link
              href="/auth/register"
              className="px-8 py-3 bg-white text-green-700 font-semibold rounded-lg hover:bg-green-50 transition-colors"
            >
              Create Account
            </Link>
            <Link
              href="/marketplace"
              className="px-8 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white/10 transition-colors"
            >
              Explore
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
