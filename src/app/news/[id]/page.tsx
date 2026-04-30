import Link from "next/link";
import { ArrowLeft, Clock, Share2 } from "lucide-react";
import { newsArticles } from "@/data/mock";
import { notFound } from "next/navigation";

export default async function NewsArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const article = newsArticles.find((a) => a.id === id);
  if (!article) notFound();

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-6">
      <Link
        href="/news"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to News
      </Link>

      <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
        {article.category}
      </span>

      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mt-4">
        {article.title}
      </h1>

      <div className="flex items-center gap-4 mt-4">
        <div className="flex items-center gap-2">
          <img
            src={article.author.avatar}
            alt={article.author.name}
            className="w-10 h-10 rounded-full bg-gray-200"
          />
          <div>
            <p className="font-medium text-sm text-gray-900">
              {article.author.name}
            </p>
            <p className="text-xs text-gray-400">
              {article.author.department}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 ml-auto text-sm text-gray-400">
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {article.readTime}
          </span>
          <span>{article.createdAt}</span>
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="mt-6 rounded-xl overflow-hidden">
        <img
          src={article.image}
          alt={article.title}
          className="w-full max-h-96 object-cover"
        />
      </div>

      <div className="mt-8 prose prose-sm max-w-none">
        {article.content.split("\n\n").map((paragraph, i) => (
          <p key={i} className="text-gray-700 leading-relaxed mb-4">
            {paragraph}
          </p>
        ))}
      </div>

      {/* Related articles */}
      <div className="mt-12 border-t border-gray-200 pt-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">More News</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {newsArticles
            .filter((a) => a.id !== article.id)
            .slice(0, 2)
            .map((a) => (
              <Link
                key={a.id}
                href={`/news/${a.id}`}
                className="group flex gap-4 bg-white rounded-lg border border-gray-200 p-3 hover:shadow-md transition-shadow"
              >
                <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={a.image}
                    alt={a.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 text-sm line-clamp-2">
                    {a.title}
                  </h3>
                  <p className="text-xs text-gray-400 mt-2">
                    {a.createdAt} · {a.readTime}
                  </p>
                </div>
              </Link>
            ))}
        </div>
      </div>
    </div>
  );
}
