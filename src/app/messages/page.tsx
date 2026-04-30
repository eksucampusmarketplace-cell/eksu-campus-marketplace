"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Search, ArrowLeft, Loader2, Ban, MoreVertical } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";
import {
  conversations as mockConversations,
  chatMessages as mockMessages,
  currentUser as mockUser,
  type Conversation as MockConversation,
} from "@/data/mock";

interface ConvWithProfile {
  id: string;
  participant_one: string;
  participant_two: string;
  updated_at: string;
  other_user: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
  last_message?: string;
  unread_count: number;
}

interface DbMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export default function MessagesPage() {
  const { user } = useAuth();
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [conversations, setConversations] = useState<ConvWithProfile[]>([]);
  const [messages, setMessages] = useState<DbMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [useMock, setUseMock] = useState(false);
  const [mockActiveConv, setMockActiveConv] = useState<MockConversation | null>(null);
  const [blockedUsers, setBlockedUsers] = useState<Set<string>>(new Set());
  const [showConvMenu, setShowConvMenu] = useState(false);
  const [blockingUser, setBlockingUser] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const init = async () => {
      if (!user) {
        setUseMock(true);
        setLoading(false);
        return;
      }
      await fetchBlockedUsers();
      await fetchConvs();
    };

    const fetchBlockedUsers = async () => {
      const res = await fetch("/api/users/block");
      if (res.ok) {
        const data = await res.json();
        const ids = new Set<string>((data.blocks || []).map((b: { blocked_id: string }) => b.blocked_id));
        setBlockedUsers(ids);
      }
    };

    const fetchConvs = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .or(`participant_one.eq.${user.id},participant_two.eq.${user.id}`)
        .order("updated_at", { ascending: false });

      if (error || !data || data.length === 0) {
        setUseMock(true);
        setLoading(false);
        return;
      }

      const convsWithProfiles = await Promise.all(
        data.map(async (conv) => {
          const otherId = conv.participant_one === user.id ? conv.participant_two : conv.participant_one;
          const { data: otherUser } = await supabase
            .from("profiles")
            .select("id, full_name, avatar_url")
            .eq("id", otherId)
            .single();

          const { data: lastMsg } = await supabase
            .from("messages")
            .select("content")
            .eq("conversation_id", conv.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          const { count } = await supabase
            .from("messages")
            .select("id", { count: "exact", head: true })
            .eq("conversation_id", conv.id)
            .eq("is_read", false)
            .neq("sender_id", user.id);

          return {
            ...conv,
            other_user: otherUser || { id: otherId, full_name: "Unknown", avatar_url: null },
            last_message: lastMsg?.content,
            unread_count: count || 0,
          };
        })
      );

      setConversations(convsWithProfiles);
      setLoading(false);
    };

    init();
  }, [user, supabase]);

  useEffect(() => {
    if (!activeConvId || !user) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", activeConvId)
        .order("created_at", { ascending: true });

      setMessages(data || []);

      await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("conversation_id", activeConvId)
        .neq("sender_id", user.id);
    };

    fetchMessages();

    const channel = supabase
      .channel(`messages-${activeConvId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${activeConvId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as DbMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeConvId, user, supabase]);

  const handleSend = async () => {
    if (!message.trim() || !activeConvId || !user) return;
    setSending(true);

    await supabase.from("messages").insert({
      conversation_id: activeConvId,
      sender_id: user.id,
      content: message,
    });

    await supabase
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", activeConvId);

    setMessage("");
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  // Fallback to mock data if no Supabase conversations
  if (useMock) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Messages</h1>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden" style={{ height: "70vh" }}>
          <div className="flex h-full">
            <div className={`w-full md:w-80 border-r border-gray-200 flex flex-col ${mockActiveConv ? "hidden md:flex" : "flex"}`}>
              <div className="p-3 border-b border-gray-200">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="text" placeholder="Search conversations..." className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {mockConversations.map((conv) => (
                  <button key={conv.id} onClick={() => setMockActiveConv(conv)} className={`w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-left ${mockActiveConv?.id === conv.id ? "bg-green-50" : ""}`}>
                    <div className="relative">
                      <img src={conv.participant.avatar} alt={conv.participant.name} className="w-10 h-10 rounded-full bg-gray-200" />
                      {conv.unreadCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-600 text-white text-xs rounded-full flex items-center justify-center">{conv.unreadCount}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm text-gray-900 truncate">{conv.participant.name}</span>
                        <span className="text-xs text-gray-400">{conv.lastMessageTime}</span>
                      </div>
                      <p className="text-xs text-gray-500 truncate mt-0.5">{conv.lastMessage}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className={`flex-1 flex flex-col ${mockActiveConv ? "flex" : "hidden md:flex"}`}>
              {mockActiveConv ? (
                <>
                  <div className="flex items-center gap-3 p-3 border-b border-gray-200">
                    <button onClick={() => setMockActiveConv(null)} className="md:hidden p-1 text-gray-500 hover:text-gray-700"><ArrowLeft className="w-5 h-5" /></button>
                    <img src={mockActiveConv.participant.avatar} alt={mockActiveConv.participant.name} className="w-8 h-8 rounded-full bg-gray-200" />
                    <div>
                      <p className="font-medium text-sm text-gray-900">{mockActiveConv.participant.name}</p>
                      <p className="text-xs text-green-500">Online</p>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {mockMessages.map((msg) => {
                      const isOwn = msg.sender.id === mockUser.id;
                      return (
                        <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-xs px-4 py-2 rounded-2xl text-sm ${isOwn ? "bg-green-600 text-white rounded-br-md" : "bg-gray-100 text-gray-900 rounded-bl-md"}`}>
                            {msg.content}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="p-3 border-t border-gray-200">
                    <div className="flex items-center gap-2">
                      <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type a message..." className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                      <button className="p-2 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors"><Send className="w-4 h-4" /></button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-400">
                  <p>Select a conversation to start messaging</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const activeConv = conversations.find((c) => c.id === activeConvId);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Messages</h1>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden" style={{ height: "70vh" }}>
        <div className="flex h-full">
          <div className={`w-full md:w-80 border-r border-gray-200 flex flex-col ${activeConvId ? "hidden md:flex" : "flex"}`}>
            <div className="p-3 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" placeholder="Search conversations..." className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setActiveConvId(conv.id)}
                  className={`w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-left ${activeConvId === conv.id ? "bg-green-50" : ""}`}
                >
                  <div className="relative">
                    <img
                      src={conv.other_user.avatar_url || `https://api.dicebear.com/9.x/initials/svg?seed=${conv.other_user.full_name}`}
                      alt={conv.other_user.full_name}
                      className="w-10 h-10 rounded-full bg-gray-200"
                    />
                    {conv.unread_count > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-600 text-white text-xs rounded-full flex items-center justify-center">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-sm text-gray-900 truncate block">
                      {conv.other_user.full_name}
                    </span>
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {conv.last_message || "No messages yet"}
                    </p>
                  </div>
                </button>
              ))}
              {conversations.length === 0 && (
                <div className="p-4 text-center text-sm text-gray-400">
                  No conversations yet
                </div>
              )}
            </div>
          </div>

          <div className={`flex-1 flex flex-col ${activeConvId ? "flex" : "hidden md:flex"}`}>
            {activeConv ? (
              <>
                <div className="flex items-center gap-3 p-3 border-b border-gray-200">
                  <button onClick={() => setActiveConvId(null)} className="md:hidden p-1 text-gray-500 hover:text-gray-700">
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <img
                    src={activeConv.other_user.avatar_url || `https://api.dicebear.com/9.x/initials/svg?seed=${activeConv.other_user.full_name}`}
                    alt={activeConv.other_user.full_name}
                    className="w-8 h-8 rounded-full bg-gray-200"
                  />
                  <p className="font-medium text-sm text-gray-900 flex-1">{activeConv.other_user.full_name}</p>
                  <div className="relative">
                    <button
                      onClick={() => setShowConvMenu(!showConvMenu)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    {showConvMenu && (
                      <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 w-40">
                        <button
                          onClick={async () => {
                            setBlockingUser(true);
                            const otherId = activeConv.other_user.id;
                            const currentlyBlocked = blockedUsers.has(otherId);
                            if (currentlyBlocked) {
                              await fetch(`/api/users/block?blocked_id=${otherId}`, { method: "DELETE" });
                              setBlockedUsers((prev) => { const s = new Set(prev); s.delete(otherId); return s; });
                            } else {
                              await fetch("/api/users/block", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ blocked_id: otherId, reason: "Blocked from messages" }),
                              });
                              setBlockedUsers((prev) => new Set(prev).add(otherId));
                            }
                            setBlockingUser(false);
                            setShowConvMenu(false);
                          }}
                          disabled={blockingUser}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          <Ban className="w-4 h-4" />
                          {blockedUsers.has(activeConv.other_user.id) ? "Unblock User" : "Block User"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map((msg) => {
                    const isOwn = msg.sender_id === user?.id;
                    return (
                      <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-xs px-4 py-2 rounded-2xl text-sm ${isOwn ? "bg-green-600 text-white rounded-br-md" : "bg-gray-100 text-gray-900 rounded-bl-md"}`}>
                          {msg.content}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                <div className="p-3 border-t border-gray-200">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <button
                      onClick={handleSend}
                      disabled={!message.trim() || sending}
                      className="p-2 bg-green-600 text-white rounded-full hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <p>Select a conversation to start messaging</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
