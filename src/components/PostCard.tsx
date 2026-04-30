"use client";

import { Heart, MessageCircle, Share2 } from "lucide-react";
import { useState } from "react";

interface PostCardProps {
  post: {
    id: string;
    content: string;
    image?: string;
    image_url?: string | null;
    likes?: number;
    likes_count?: number;
    comments?: number;
    comments_count?: number;
    createdAt?: string;
    created_at?: string;
    user_has_liked?: boolean;
    author?: {
      name?: string;
      full_name?: string;
      avatar?: string;
      avatar_url?: string | null;
      department?: string | null;
      level?: string | null;
    } | null;
    author_id?: string;
  };
  onLike?: (postId: string) => void;
}

export default function PostCard({ post, onLike }: PostCardProps) {
  const [liked, setLiked] = useState(post.user_has_liked || false);
  const [likeCount, setLikeCount] = useState(post.likes ?? post.likes_count ?? 0);

  const authorName = post.author?.name || post.author?.full_name || "Anonymous";
  const authorAvatar = post.author?.avatar || post.author?.avatar_url || `https://api.dicebear.com/9.x/initials/svg?seed=${authorName}`;
  const postImage = post.image || post.image_url;
  const commentCount = post.comments ?? post.comments_count ?? 0;
  const timeDisplay = post.createdAt || (post.created_at ? formatTimeAgo(post.created_at) : "");

  const handleLike = () => {
    setLiked(!liked);
    setLikeCount(liked ? likeCount - 1 : likeCount + 1);
    onLike?.(post.id);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-start gap-3">
        <img
          src={authorAvatar}
          alt={authorName}
          className="w-10 h-10 rounded-full bg-gray-200"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900 text-sm">{authorName}</span>
            {(post.author?.department || post.author?.level) && (
              <span className="text-xs text-gray-500">
                {post.author?.department}{post.author?.department && post.author?.level ? " · " : ""}{post.author?.level}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400">{timeDisplay}</p>
        </div>
      </div>

      <p className="mt-3 text-gray-800 text-sm leading-relaxed">{post.content}</p>

      {postImage && (
        <div className="mt-3 rounded-lg overflow-hidden">
          <img src={postImage} alt="Post image" className="w-full max-h-80 object-cover" />
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
          <span>{commentCount}</span>
        </button>
        <button className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-green-500 transition-colors">
          <Share2 className="w-4 h-4" />
          <span>Share</span>
        </button>
      </div>
    </div>
  );
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}
