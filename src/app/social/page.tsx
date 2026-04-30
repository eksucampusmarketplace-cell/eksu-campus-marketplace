"use client";

import { useState, useEffect } from "react";
import { Image as ImageIcon, Send, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";
import PostCard from "@/components/PostCard";
import { posts as mockPosts, currentUser as mockUser } from "@/data/mock";

interface PostWithAuthor {
  id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  author_id: string;
  author: {
    full_name: string;
    avatar_url: string | null;
    department: string | null;
    level: string | null;
  } | null;
  likes_count: number;
  comments_count: number;
  user_has_liked: boolean;
}

export default function SocialPage() {
  const [newPost, setNewPost] = useState("");
  const [dbPosts, setDbPosts] = useState<PostWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const { user, profile } = useAuth();
  const supabase = createClient();

  useEffect(() => {
    const fetchPosts = async () => {
      const { data } = await supabase
        .from("posts")
        .select("*, author:profiles(*)")
        .order("created_at", { ascending: false });

      if (data && data.length > 0) {
        const postsWithCounts = await Promise.all(
          data.map(async (post) => {
            const [likesRes, commentsRes] = await Promise.all([
              supabase.from("likes").select("id", { count: "exact", head: true }).eq("post_id", post.id),
              supabase.from("comments").select("id", { count: "exact", head: true }).eq("post_id", post.id),
            ]);

            let userHasLiked = false;
            if (user) {
              const { data: likeData } = await supabase
                .from("likes")
                .select("id")
                .eq("post_id", post.id)
                .eq("user_id", user.id)
                .maybeSingle();
              userHasLiked = !!likeData;
            }

            return {
              ...post,
              likes_count: likesRes.count || 0,
              comments_count: commentsRes.count || 0,
              user_has_liked: userHasLiked,
            };
          })
        );
        setDbPosts(postsWithCounts);
      }
      setLoading(false);
    };

    fetchPosts();
  }, [supabase, user]);

  const handlePost = async () => {
    if (!newPost.trim() || !user) return;
    setPosting(true);

    const { data, error } = await supabase
      .from("posts")
      .insert({ author_id: user.id, content: newPost })
      .select("*, author:profiles(*)")
      .single();

    if (!error && data) {
      setDbPosts([{ ...data, likes_count: 0, comments_count: 0, user_has_liked: false }, ...dbPosts]);
      setNewPost("");
    }
    setPosting(false);
  };

  const handleLike = async (postId: string) => {
    if (!user) return;

    const { data: existing } = await supabase
      .from("likes")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      await supabase.from("likes").delete().eq("id", existing.id);
    } else {
      await supabase.from("likes").insert({ user_id: user.id, post_id: postId });
    }
  };

  const avatarUrl = profile?.avatar_url || mockUser.avatar;
  const userName = profile?.full_name || mockUser.name;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Social Feed</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex gap-3">
          <img
            src={avatarUrl}
            alt={userName}
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
                onClick={handlePost}
                disabled={!newPost.trim() || posting}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {posting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Post
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-green-600" />
        </div>
      ) : (
        <div className="space-y-4">
          {dbPosts.map((post) => (
            <PostCard key={post.id} post={post} onLike={handleLike} />
          ))}
          {dbPosts.length === 0 &&
            mockPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
        </div>
      )}
    </div>
  );
}
