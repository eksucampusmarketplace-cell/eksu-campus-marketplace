"use client";

import { Heart, MessageCircle, Share2 } from "lucide-react";
import type { Post } from "@/data/mock";
import { useState } from "react";

export default function PostCard({ post }: { post: Post }) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes);

  const handleLike = () => {
    setLiked(!liked);
    setLikeCount(liked ? likeCount - 1 : likeCount + 1);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-start gap-3">
        <img
          src={post.author.avatar}
          alt={post.author.name}
          className="w-10 h-10 rounded-full bg-gray-200"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900 text-sm">
              {post.author.name}
            </span>
            <span className="text-xs text-gray-500">
              {post.author.department} · {post.author.level}
            </span>
          </div>
          <p className="text-xs text-gray-400">{post.createdAt}</p>
        </div>
      </div>

      <p className="mt-3 text-gray-800 text-sm leading-relaxed">{post.content}</p>

      {post.image && (
        <div className="mt-3 rounded-lg overflow-hidden">
          <img
            src={post.image}
            alt="Post image"
            className="w-full max-h-80 object-cover"
          />
        </div>
      )}

      <div className="flex items-center gap-6 mt-4 pt-3 border-t border-gray-100">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 text-sm transition-colors ${
            liked ? "text-red-500" : "text-gray-500 hover:text-red-500"
          }`}
        >
          <Heart className={`w-4 h-4 ${liked ? "fill-current" : ""}`} />
          <span>{likeCount}</span>
        </button>
        <button className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-500 transition-colors">
          <MessageCircle className="w-4 h-4" />
          <span>{post.comments}</span>
        </button>
        <button className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-green-500 transition-colors">
          <Share2 className="w-4 h-4" />
          <span>Share</span>
        </button>
      </div>
    </div>
  );
}
