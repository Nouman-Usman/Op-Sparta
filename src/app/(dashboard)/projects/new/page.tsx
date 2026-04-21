"use client";

import { useState } from "react";
import { 
  ArrowLeft, 
  Globe, 
  Palette, 
  Users, 
  MessageSquare, 
  Zap,
  CheckCircle2,
  ChevronRight,
  Sparkles
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const steps = [
  { id: "product", name: "Product", icon: Globe, description: "What are we promoting?" },
  { id: "brand", name: "Brand Kit", icon: Palette, description: "Visual identity & style" },
  { id: "audience", name: "Audience", icon: Users, description: "Who is this for?" },
  { id: "tone", name: "Tone", icon: MessageSquare, description: "Voice & personality" },
];

export default function NewProjectPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    productUrl: "",
    productDescription: "",
    brandColors: "",
    targetAudience: "",
    tone: "professional",
  });

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 0));

  return (
    <div className="p-8 max-w-4xl mx-auto w-full">
      <Link 
        href="/" 
        className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors mb-8 group w-fit"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        Back to Dashboard
      </Link>

      <div className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight text-white mb-3">Create New Project</h1>
        <p className="text-muted-foreground text-lg">Let&apos;s set up your brand identity for AI generation.</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-between mb-12 relative">
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-border -translate-y-1/2 -z-10" />
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;

          return (
            <div key={step.id} className="flex flex-col items-center gap-3 bg-background px-4">
              <div 
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                  isActive ? "border-accent bg-accent/10 text-accent shadow-[0_0_15px_rgba(var(--accent),0.3)]" : 
                  isCompleted ? "border-emerald-500 bg-emerald-500 text-white" : 
                  "border-border bg-muted text-muted-foreground"
                )}
              >
                {isCompleted ? <CheckCircle2 size={24} /> : <Icon size={22} />}
              </div>
              <div className="text-center">
                <p className={cn("text-xs font-bold uppercase tracking-wider", isActive ? "text-accent" : "text-muted-foreground")}>
                  {step.name}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Form Content */}
      <div className="glass-dark rounded-3xl p-8 border border-border shadow-2xl min-h-[400px] flex flex-col">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">{steps[currentStep].name}</h2>
          <p className="text-muted-foreground">{steps[currentStep].description}</p>
        </div>

        <div className="flex-1">
          {currentStep === 0 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Product URL (Optional)</label>
                <input 
                  type="url" 
                  placeholder="https://yourproduct.com"
                  className="w-full bg-muted/30 border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-accent transition-all"
                  value={formData.productUrl}
                  onChange={(e) => setFormData({ ...formData, productUrl: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Product Description</label>
                <textarea 
                  placeholder="Describe your product, its features, and main benefits..."
                  rows={5}
                  className="w-full bg-muted/30 border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-accent transition-all resize-none"
                  value={formData.productDescription}
                  onChange={(e) => setFormData({ ...formData, productDescription: e.target.value })}
                />
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Primary Brand Color</label>
                  <div className="flex gap-2">
                    <input 
                      type="color" 
                      className="w-12 h-12 rounded-lg bg-transparent border-none cursor-pointer"
                    />
                    <input 
                      type="text" 
                      placeholder="#000000"
                      className="flex-1 bg-muted/30 border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-accent transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Brand Style</label>
                  <select className="w-full bg-muted/30 border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-accent transition-all">
                    <option>Minimalist</option>
                    <option>Vibrant & Bold</option>
                    <option>Professional & Corporate</option>
                    <option>Luxury & Elegant</option>
                  </select>
                </div>
              </div>
              <div className="p-6 rounded-2xl bg-accent/5 border border-accent/20 flex items-start gap-4">
                <Sparkles className="text-accent shrink-0" />
                <p className="text-sm text-accent/80 italic">
                  Tip: Uploading a logo or brand kit will help the AI maintain consistency across all generated creatives.
                </p>
              </div>
            </div>
          )}

          {currentStep > 1 && (
             <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                  <Zap size={32} />
                </div>
                <h3 className="text-xl font-semibold text-white">More options coming soon</h3>
                <p className="text-muted-foreground max-w-xs">We&apos;re finalizing the Audience and Tone analysis modules.</p>
             </div>
          )}
        </div>

        <div className="mt-12 flex items-center justify-between pt-8 border-t border-border">
          <button 
            onClick={prevStep}
            disabled={currentStep === 0}
            className="px-6 py-2.5 rounded-xl text-muted-foreground hover:text-white hover:bg-muted transition-all disabled:opacity-0"
          >
            Previous
          </button>
          
          <button 
            onClick={currentStep === steps.length - 1 ? () => {} : nextStep}
            className="flex items-center gap-2 bg-accent hover:bg-accent/90 text-accent-foreground px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-accent/20 active:scale-[0.98]"
          >
            {currentStep === steps.length - 1 ? "Finish & Generate" : "Continue"}
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
