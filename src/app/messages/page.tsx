"use client";

import { useState } from "react";
import { Send, Search, ArrowLeft } from "lucide-react";
import {
  conversations,
  chatMessages,
  currentUser,
  type Conversation,
} from "@/data/mock";

export default function MessagesPage() {
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [message, setMessage] = useState("");

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Messages</h1>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden" style={{ height: "70vh" }}>
        <div className="flex h-full">
          {/* Conversations list */}
          <div
            className={`w-full md:w-80 border-r border-gray-200 flex flex-col ${
              activeConv ? "hidden md:flex" : "flex"
            }`}
          >
            <div className="p-3 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setActiveConv(conv)}
                  className={`w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-left ${
                    activeConv?.id === conv.id ? "bg-green-50" : ""
                  }`}
                >
                  <div className="relative">
                    <img
                      src={conv.participant.avatar}
                      alt={conv.participant.name}
                      className="w-10 h-10 rounded-full bg-gray-200"
                    />
                    {conv.unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-600 text-white text-xs rounded-full flex items-center justify-center">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm text-gray-900 truncate">
                        {conv.participant.name}
                      </span>
                      <span className="text-xs text-gray-400">
                        {conv.lastMessageTime}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {conv.lastMessage}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Chat area */}
          <div
            className={`flex-1 flex flex-col ${
              activeConv ? "flex" : "hidden md:flex"
            }`}
          >
            {activeConv ? (
              <>
                {/* Chat header */}
                <div className="flex items-center gap-3 p-3 border-b border-gray-200">
                  <button
                    onClick={() => setActiveConv(null)}
                    className="md:hidden p-1 text-gray-500 hover:text-gray-700"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <img
                    src={activeConv.participant.avatar}
                    alt={activeConv.participant.name}
                    className="w-8 h-8 rounded-full bg-gray-200"
                  />
                  <div>
                    <p className="font-medium text-sm text-gray-900">
                      {activeConv.participant.name}
                    </p>
                    <p className="text-xs text-green-500">Online</p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {chatMessages.map((msg) => {
                    const isOwn = msg.sender.id === currentUser.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-xs px-4 py-2 rounded-2xl text-sm ${
                            isOwn
                              ? "bg-green-600 text-white rounded-br-md"
                              : "bg-gray-100 text-gray-900 rounded-bl-md"
                          }`}
                        >
                          <p>{msg.content}</p>
                          <p
                            className={`text-xs mt-1 ${
                              isOwn ? "text-green-200" : "text-gray-400"
                            }`}
                          >
                            {msg.createdAt}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Input */}
                <div className="p-3 border-t border-gray-200">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <button
                      disabled={!message.trim()}
                      className="p-2.5 bg-green-600 text-white rounded-full hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                    <Send className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="font-medium">Select a conversation</p>
                  <p className="text-sm mt-1">
                    Choose from your existing conversations or start a new one
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
