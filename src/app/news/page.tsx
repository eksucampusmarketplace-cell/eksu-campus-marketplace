import Link from "next/link";
import { newsArticles } from "@/data/mock";

export default function NewsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-6">
      <h1 className="text-2xl font-bold text-gray-900">Campus News</h1>
      <p className="text-sm text-gray-500 mt-1 mb-8">
        Stay updated with the latest happenings at EKSU
      </p>

      {/* Featured article */}
      {newsArticles[0] && (
        <Link
          href={`/news/${newsArticles[0].id}`}
          className="group block bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow mb-8"
        >
          <div className="md:flex">
            <div className="md:w-1/2 aspect-video md:aspect-auto overflow-hidden">
              <img
                src={newsArticles[0].image}
                alt={newsArticles[0].title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="p-6 md:w-1/2 flex flex-col justify-center">
              <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full w-fit">
                {newsArticles[0].category}
              </span>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mt-3">
                {newsArticles[0].title}
              </h2>
              <p className="text-gray-500 mt-2 line-clamp-3">
                {newsArticles[0].excerpt}
              </p>
              <div className="flex items-center gap-3 mt-4">
                <img
                  src={newsArticles[0].author.avatar}
                  alt={newsArticles[0].author.name}
                  className="w-8 h-8 rounded-full bg-gray-200"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {newsArticles[0].author.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {newsArticles[0].createdAt} · {newsArticles[0].readTime}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Link>
      )}

      {/* All articles */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {newsArticles.slice(1).map((article) => (
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
              <div className="flex items-center gap-2 mt-3">
                <img
                  src={article.author.avatar}
                  alt={article.author.name}
                  className="w-6 h-6 rounded-full bg-gray-200"
                />
                <p className="text-xs text-gray-400">
                  {article.author.name} · {article.createdAt}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
