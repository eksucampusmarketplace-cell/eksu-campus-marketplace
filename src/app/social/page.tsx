"use client";

import { useState } from "react";
import { Image as ImageIcon, Send } from "lucide-react";
import { posts, currentUser } from "@/data/mock";
import PostCard from "@/components/PostCard";

export default function SocialPage() {
  const [newPost, setNewPost] = useState("");

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Social Feed</h1>

      {/* Create post */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex gap-3">
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-10 h-10 rounded-full bg-gray-200"
          />
          <div className="flex-1">
            <textarea
              rows={3}
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="What's on your mind? Share with the EKSU community..."
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
            />
            <div className="flex items-center justify-between mt-3">
              <button className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-green-600 transition-colors">
                <ImageIcon className="w-4 h-4" />
                Photo
              </button>
              <button
                disabled={!newPost.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4" />
                Post
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Posts */}
      <div className="space-y-4">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}
