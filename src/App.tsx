import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  FileSpreadsheet, 
  Users, 
  Sparkles, 
  ShieldCheck, 
  Heart, 
  Clock, 
  ArrowRight,
  ChevronDown,
  User,
  ExternalLink,
  ChevronRight,
  BookOpen,
  MousePointerClick
} from "lucide-react";
import LeadForm from "./components/LeadForm";
import AdminDashboard from "./components/AdminDashboard";
import MargoLogo from "./components/MargoLogo";

export default function App() {
  const [isSurveyOnly] = useState(() => {
    if (typeof window !== "undefined") {
      const pathname = window.location.pathname.toLowerCase();
      const isSubpath = pathname.endsWith("/portal") || pathname.endsWith("/survey") || pathname.includes("/portal/") || pathname.includes("/survey/");
      const params = new URLSearchParams(window.location.search);
      const isParam = params.get("survey") === "only" || params.get("mode") === "client" || params.get("view") === "survey";
      const isHash = window.location.hash.includes("survey=only") || window.location.hash.includes("view=survey") || window.location.hash.includes("portal");
      return isSubpath || isParam || isHash;
    }
    return false;
  });

  const [currentTab, setCurrentTab] = useState<"client" | "admin" >("client");
  const [postedLead, setPostedLead] = useState<any | null>(null);

  return (
    <div className="min-h-screen bg-[#fdf6ef] flex flex-col font-sans text-[#2d251e] antialiased selection:bg-lic-blue/15 selection:text-lic-blue">
      
      {/* Upper Brand Header and Navigator */}
      <header className="sticky top-0 z-50 w-full bg-[#FDFBF7]/90 backdrop-blur-md border-b border-[#C5A059]/20 py-3 px-4 sm:px-6 lg:px-8 shadow-xs transition-all duration-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Brand Logo & Title */}
          <div className="group flex items-center gap-3 select-none">
            <MargoLogo className="w-9 h-9 sm:w-10 sm:h-10" />

            <div className="flex flex-col">
              <span className="font-serif text-2xl font-semibold text-[#121824] tracking-tight leading-none group-hover:text-[#B89343] transition-colors">
                Margo
              </span>
              <span className="text-[10px] uppercase tracking-[0.25em] text-[#8C7A6B] font-medium mt-0.5">
                Advisory
              </span>
            </div>
          </div>

          {/* Navigation Toggles */}
          {!isSurveyOnly && (
            <div className="flex items-center gap-1.5 bg-[#FAF5EA] p-1 rounded-full border border-[#C5A059]/30 shadow-xs">
              <button
                type="button"
                id="tab-client"
                onClick={() => {
                  setCurrentTab("client");
                  setPostedLead(null);
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                  currentTab === "client" 
                    ? "bg-[#121824] text-[#FAF5EA] shadow-xs border border-[#C5A059]/30" 
                    : "text-[#121824]/75 hover:text-[#121824] hover:bg-white/60"
                }`}
              >
                <User className="w-3.5 h-3.5 text-[#C5A059]" /> Financial Profile
              </button>
              
              <button
                type="button"
                id="tab-admin"
                onClick={() => setCurrentTab("admin")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                  currentTab === "admin" 
                    ? "bg-[#121824] text-[#FAF5EA] shadow-xs border border-[#C5A059]/30" 
                    : "text-[#121824]/75 hover:text-[#121824] hover:bg-white/60"
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-[#C5A059]" /> Advisor Console
              </button>
            </div>
          )}

        </div>
      </header>

      {/* Main Body Stage */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 lg:p-12">
        <AnimatePresence mode="wait">
          
          {currentTab === "client" ? (
            <motion.div
              key="client-stage"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="space-y-8"
            >
              
              <div className="space-y-8">
                {/* Marketing Headline */}
                <div className="text-center max-w-2xl mx-auto">
                  <h2 className="font-display font-black text-3xl md:text-5xl text-lic-dark tracking-tight leading-tight">
                    Client Enquiry
                  </h2>
                </div>

                {/* Form Component */}
                <LeadForm 
                  onSubmitSuccess={(lead) => setPostedLead(lead)} 
                  submittedLead={postedLead}
                  onResetForm={() => setPostedLead(null)}
                />
              </div>

            </motion.div>
          ) : (
            <motion.div
              key="admin-workspace"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <AdminDashboard />
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Trust Badge Trust Blocks */}
      {currentTab === "client" && !postedLead && (
        <section className="bg-white border-t border-slate-100 py-16 md:py-24 px-6 mt-12">
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-16 text-center">
            <div className="space-y-4">
              <div className="mx-auto w-12 h-12 rounded-xl bg-blue-50 text-lic-blue flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <p className="font-display font-bold text-slate-800 text-base">✔ Secure & Compliant</p>
              <p className="text-slate-500 text-xs font-sans leading-relaxed max-w-xs mx-auto">Full compliance with the Personal Data Protection measures and active client security controls.</p>
            </div>
            
            <div className="space-y-4">
              <div className="mx-auto w-12 h-12 rounded-xl bg-blue-50 text-lic-blue flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <p className="font-display font-bold text-slate-800 text-base">✔ Financial Planning</p>
              <p className="text-slate-500 text-xs font-sans leading-relaxed max-w-xs mx-auto">Direct insights on policy premiums, endowment schemes, and customized pension advice.</p>
            </div>

            <div className="space-y-4">
              <div className="mx-auto w-12 h-12 rounded-xl bg-blue-50 text-lic-blue flex items-center justify-center">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <p className="font-display font-bold text-slate-800 text-base">✔ Client Reports</p>
              <p className="text-slate-500 text-xs font-sans leading-relaxed max-w-xs mx-auto">Tabular spreadsheets and advisory responses mapped seamlessly for personal client summaries.</p>
            </div>
          </div>
        </section>
      )}

      {/* Global Footer */}
      <footer className="bg-lic-blue text-white/90 border-t-2 border-lic-gold py-16 md:py-20 px-6 md:px-12 text-center md:text-left shadow-[0_-4px_16px_rgba(0,0,0,0.05)]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-3">
            <div className="flex flex-col gap-1.5">
              {currentTab === "admin" ? (
                <>
                  <p className="text-sm md:text-base text-lic-gold font-sans tracking-widest font-extrabold uppercase text-center md:text-left">
                    Margo Advisory
                  </p>
                  <div className="flex items-center gap-2.5 justify-center md:justify-start">
                    <div className="w-3 h-3 rounded-full bg-lic-gold animate-pulse"></div>
                    <p className="font-display font-extrabold text-base md:text-lg text-white tracking-wider">
                      Trusted Wealth Advisory
                    </p>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2.5 justify-center md:justify-start">
                  <div className="w-3 h-3 rounded-full bg-lic-gold animate-pulse"></div>
                  <p className="font-display font-extrabold text-base md:text-lg text-white tracking-wider">
                    Margo Advisory Client Portal
                  </p>
                </div>
              )}
            </div>
            <p className="text-sm md:text-base text-blue-50/90 max-w-xl font-sans leading-relaxed">
              Personalized financial planning and protection solutions, delivered with integrity, expertise, and regulatory compliance.
            </p>
          </div>

          <div className="text-center md:text-right space-y-2">
            <p className="text-xs md:text-sm text-lic-gold font-sans tracking-widest font-black uppercase">
              Authorized Advisor
            </p>
            <p className="text-lg md:text-xl font-display font-black text-white">
              Marianne Gomes
            </p>
            <a 
              href="https://wa.me/919930074680?text=Hello%20Margo%20Advisory%2C%20I%20would%20like%20to%20know%20more%20about%20your%20services." 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-emerald-300 hover:text-emerald-100 font-display font-medium tracking-wide transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              WhatsApp: +91 9930074680
            </a>
            <p className="text-xs text-blue-200/80 font-display tracking-wide">
              <a href="mailto:margoadvisory@gmail.com" className="hover:text-white transition-colors">
                margoadvisory@gmail.com
              </a>
            </p>
          </div>
        </div>

        {/* Bottom copyright line */}
        <div className="max-w-7xl mx-auto border-t border-white/10 mt-8 pt-6 flex flex-col md:flex-row justify-between items-center text-xs text-blue-200">
          <div className="hidden md:block"></div>
          <p className="text-[12px] md:ml-auto">
            Margo Advisory © 2026
          </p>
        </div>
      </footer>

    </div>
  );
}
