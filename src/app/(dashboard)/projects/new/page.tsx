"use client";

import { useState, useTransition } from "react";
import { 
  ArrowLeft, 
  Plus,
  Loader2,
  CheckCircle2,
  Sparkles,
  Zap,
  Globe,
  MessageSquare,
  Users,
  Palette,
  ArrowRight
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createProject } from "@/app/actions/projects";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";

const STEPS = [
  { id: "brand", name: "Product Info", icon: Globe, description: "Your product details" },
  { id: "context", name: "Strategy", icon: TargetIcon, description: "Audience & Tone" },
  { id: "visual", name: "Visuals", icon: Palette, description: "Colors & Style" },
];

function TargetIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
  );
}

export default function NewProjectPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
    productDesc: "",
    brandColor: "#000000",
    brandVoice: "aggressive",
    productImage: "", // Will hold the pasted URL if in URL mode
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [imageInputMode, setImageInputMode] = useState<"upload" | "url">("upload");

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setLocalPreview(URL.createObjectURL(file));
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    startTransition(async () => {
      let finalImageUrl = formData.productImage;

      // Wait until submission to upload the file to Supabase if in upload mode
      if (imageInputMode === "upload" && selectedFile) {
        try {
          const supabase = createClient();
          const fileExt = selectedFile.name.split('.').pop();
          const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
          const filePath = `products/${fileName}`;

          const { error } = await supabase.storage
            .from('project-assets')
            .upload(filePath, selectedFile);

          if (error) throw error;

          const { data: { publicUrl } } = supabase.storage
            .from('project-assets')
            .getPublicUrl(filePath);

          finalImageUrl = publicUrl;
        } catch (error: any) {
          console.error('Upload error:', error);
          alert('Failed to upload image. Please check your Supabase Storage bucket policy.');
          return;
        }
      }

      const result = await createProject({
        name: formData.name,
        productDesc: formData.productDesc,
        brandColor: formData.brandColor,
        brandVoice: formData.brandVoice,
        productImage: finalImageUrl,
      });

      if (result.success) {
        router.push(`/studio?projectId=${result.projectId}`);
      } else {
        alert(result.error || "Failed to create project");
      }
    });
  };

  return (
    <div className="p-8 max-w-4xl mx-auto w-full">
      <Link 
        href="/overview"
        className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-8 group w-fit"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        Back to Dashboard
      </Link>

      <div className="mb-12">
        <h1 className="text-5xl font-extrabold tracking-tight text-white mb-4 bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">
          New Brand Engine
        </h1>
        <p className="text-zinc-400 text-lg">Define your brand identity to power our AI supervision layer.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-8 glass-dark p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Brand Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Tesla Cybergear"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:ring-2 focus:ring-accent transition-all"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Brand Color</label>
                    <div className="flex bg-white/5 border border-white/10 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-accent transition-all">
                      <input 
                        type="color" 
                        className="h-14 w-16 p-2 bg-transparent cursor-pointer"
                        value={formData.brandColor}
                        onChange={(e) => setFormData({ ...formData, brandColor: e.target.value })}
                      />
                      <input 
                        type="text"
                        className="w-full bg-transparent py-4 px-4 text-white focus:outline-none font-mono text-sm"
                        value={formData.brandColor}
                        onChange={(e) => setFormData({ ...formData, brandColor: e.target.value })}
                      />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Brand Voice</label>
                    <select 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:ring-2 focus:ring-accent transition-all appearance-none"
                      value={formData.brandVoice}
                      onChange={(e) => setFormData({ ...formData, brandVoice: e.target.value })}
                    >
                      <option value="minimalist">Minimalist</option>
                      <option value="aggressive">Aggressive & Bold</option>
                      <option value="luxury">Luxury & Elegant</option>
                      <option value="funny">Entertaining & Viral</option>
                    </select>
                </div>
              </div>

              <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Product Description</label>
                  <textarea 
                    placeholder="e.g. This is a high-performance active noise cancelling headphone designed for travelers..."
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:ring-2 focus:ring-accent transition-all resize-none"
                    value={formData.productDesc}
                    onChange={(e) => setFormData({ ...formData, productDesc: e.target.value })}
                    required
                  />
              </div>

              <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Brand Voice</label>
                    <select 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:ring-2 focus:ring-accent transition-all appearance-none"
                      value={formData.brandVoice}
                      onChange={(e) => setFormData({ ...formData, brandVoice: e.target.value })}
                    >
                      <option value="minimalist">Minimalist</option>
                      <option value="aggressive">Aggressive & Bold</option>
                      <option value="luxury">Luxury & Elegant</option>
                      <option value="funny">Entertaining & Viral</option>
                    </select>
                </div>

              {/* Product Image Toggle Block */}
              <div className="space-y-0">
                <div className="flex items-center justify-between ml-1 mb-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Product Image</label>
                  <div className="flex bg-black/40 rounded-lg p-1 border border-white/5">
                    <button 
                      type="button" 
                      onClick={() => setImageInputMode("upload")}
                      className={cn("text-[10px] px-3 py-1.5 rounded-md uppercase font-bold tracking-wider transition-all", imageInputMode === "upload" ? "bg-white/10 text-white shadow-sm" : "text-zinc-600 hover:text-zinc-300")}
                    >Upload</button>
                    <button 
                      type="button" 
                      onClick={() => setImageInputMode("url")}
                      className={cn("text-[10px] px-3 py-1.5 rounded-md uppercase font-bold tracking-wider transition-all", imageInputMode === "url" ? "bg-white/10 text-white shadow-sm" : "text-zinc-600 hover:text-zinc-300")}
                    >Link URL</button>
                  </div>
                </div>

                {imageInputMode === "upload" ? (
                  <div className="relative border-2 border-dashed border-white/10 rounded-[2rem] p-8 text-center hover:bg-white/5 hover:border-white/20 transition-all group overflow-hidden">
                    
                    {isPending ? (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                        <Loader2 className="animate-spin text-accent mb-2" size={32} />
                        <p className="text-xs font-bold text-white uppercase tracking-widest">Uploading & Creating...</p>
                      </div>
                    ) : localPreview ? (
                      <div className="absolute inset-0 bg-black z-0">
                        <img src={localPreview} alt="Selected product preview" className="w-full h-full object-cover opacity-60" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                           <p className="text-white font-bold text-sm bg-black/50 px-4 py-2 rounded-xl backdrop-blur-md">Click to Replace</p>
                        </div>
                      </div>
                    ) : null}

                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                      title="Upload Product Image"
                    />

                    <div className={cn("relative z-10 pointer-events-none transition-opacity", localPreview ? "opacity-0" : "opacity-100")}>
                      <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                        <Palette className="text-zinc-400 group-hover:text-accent transition-colors" size={24} />
                      </div>
                      <h4 className="text-white font-bold mb-1">Upload Product Image</h4>
                      <p className="text-xs text-zinc-500">Drag and drop or click to browse</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-black/20 border border-white/5 rounded-3xl p-6">
                    <input 
                      type="url" 
                      placeholder="e.g. https://example.com/image.png"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:ring-2 focus:ring-accent transition-all mb-4"
                      value={formData.productImage}
                      onChange={(e) => setFormData({ ...formData, productImage: e.target.value })}
                    />
                    {formData.productImage && (
                      <div className="w-full aspect-video rounded-xl border border-white/10 overflow-hidden relative bg-black/50">
                        <img src={formData.productImage} alt="Preview" className="w-full h-full object-contain" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isPending || !formData.name}
              className="w-full bg-white text-black py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-[1.02] transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isPending ? <Loader2 className="animate-spin" /> : <>Initialize Project <ArrowRight size={18} /></>}
            </button>
          </form>
        </div>

        <div className="space-y-6">
          <div className="glass-dark border border-white/5 p-8 rounded-[2.5rem]">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
              <Sparkles size={18} className="text-accent" />
              SaaS Engine Pro
            </h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              When you initialize a project, our AI 10.0 supervisor creates a brand kit specifically for this niche. Every n8n generation will follow these rules.
            </p>
            <div className="mt-6 space-y-3">
              {[
                "Global n8n Workflow sync",
                "Automated Instagram Discovery",
                "Brand voice enforcement",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  <CheckCircle2 size={12} className="text-accent" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="p-8 rounded-[2.5rem] bg-indigo-600/10 border border-indigo-600/20">
             <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center mb-4 text-white">
                <Zap size={20} fill="currentColor" />
             </div>
             <h4 className="text-white font-bold mb-1">Instant Generation</h4>
             <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Post-setup trigger</p>
          </div>
        </div>
      </div>
    </div>
  );
}
