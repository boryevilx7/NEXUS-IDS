import React from "react";
import NeuralBackground from "@/components/ui/flow-field-background";
import { Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { LiquidMetalButton } from "@/components/ui/liquid-metal-button";

export default function LandingPage() {
  const navigate = useNavigate();
  return (
    <div className="relative w-full h-screen bg-black text-white flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <NeuralBackground 
            color="#818cf8" // Indigo-400
            trailOpacity={0.1} // Lower = longer trails
            speed={0.8}
        />
      </div>
      
      <div className="relative z-10 text-center max-w-5xl px-4 flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8 shadow-xl">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span className="text-sm font-medium text-indigo-200">Introducing Nexus IDS Platform</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight mb-8">
          <span className="bg-gradient-to-r from-white via-indigo-100 to-white bg-clip-text text-transparent">
            NEXUS
          </span>
          <br />
          <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-lg">
            IDS
          </span>
        </h1>
        
        <p className="text-lg md:text-xl text-zinc-400 mb-12 max-w-2xl mx-auto leading-relaxed">
          Real-Time Network Security Monitoring System
        </p>
        
        <div className="flex flex-col sm:flex-row items-center gap-6 mt-6">
          <LiquidMetalButton 
            label="Get Started" 
            onClick={() => navigate('/login')} 
          />
        </div>
      </div>
      
      {/* Decorative gradients */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-indigo-500/10 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-full h-[300px] bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none" />
    </div>
  );
}
