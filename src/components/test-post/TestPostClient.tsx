"use client";

import { useState } from "react";
import { Loader2, Instagram, CheckCircle } from "lucide-react";
import Image from "next/image";

export default function TestPostClient() {
  const [isPublishing, setIsPublishing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string, postId?: string } | null>(null);

  const testImageUrl = "https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1080&auto=format&fit=crop";
  const testCaption = "Testing Operation Sparta Auto-Publisher! 🚀 The system is fully operational. #Automation #SaaS #AI";

  const handleTestPost = async () => {
    setIsPublishing(true);
    setFeedback(null);

    try {
      const response = await fetch('/api/test-post', { method: 'GET' });
      const data = await response.json();

      if (data.error) {
        setFeedback({ type: 'error', message: data.error });
      } else {
        setFeedback({ type: 'success', message: data.message, postId: data.postId });
      }
    } catch (error: any) {
      setFeedback({ type: 'error', message: "Network error occurred." });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Test Preview Card */}
      <div className="glass-dark border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl relative">
        <div className="relative w-full aspect-square bg-zinc-900">
           {/* Replace standard img with Next Image if you have hostname configured, else use raw img for unsplash */}
           <img 
             src={testImageUrl} 
             alt="Test Post Preview" 
             className="w-full h-full object-cover"
           />
           <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2">
              <Instagram size={14} />
              Instagram Preview
           </div>
        </div>

        <div className="p-8 space-y-6">
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Caption</h3>
            <p className="text-white text-lg">{testCaption}</p>
          </div>

          {feedback && (
             <div className={`p-4 rounded-xl border flex items-start gap-4 ${feedback.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                {feedback.type === 'success' && <CheckCircle className="shrink-0" />}
                <div>
                   <p className="font-bold">{feedback.message}</p>
                   {feedback.postId && <p className="text-xs opacity-75 font-mono mt-1">Post ID: {feedback.postId}</p>}
                </div>
             </div>
          )}

          <button 
            onClick={handleTestPost}
            disabled={isPublishing}
            className="w-full bg-gradient-to-r from-pink-600 to-amber-600 text-white rounded-2xl py-4 font-bold tracking-wide hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl"
          >
            {isPublishing ? (
               <>
                 <Loader2 className="animate-spin" />
                 Sending to Meta Graph API...
               </>
            ) : (
               <>
                 <Instagram size={20} />
                 Publish Test Post
               </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
