import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  User, 
  Sparkles, 
  CheckCircle, 
  AlertCircle,
  Clock,
  ArrowRight,
  ChevronRight,
  ShieldCheck,
  TrendingUp,
  Wallet,
  HelpCircle,
  FileText,
  MessageSquare,
  Lock
} from "lucide-react";
import { LeadFormData } from "../types";
import MargoLogo from "./MargoLogo";

interface LeadFormProps {
  onSubmitSuccess: (newLead: any) => void;
  submittedLead?: any | null;
  onResetForm?: () => void;
}

const INITIAL_FORM_DATA: LeadFormData = {
  fullName: "",
  phone: "",
  email: "",
  dob: "",
  age: "",
  salaryRange: "",
  investmentMode: "",
  investmentBudget: "",
  margoHelp: [],
  additionalNotes: ""
};

export default function LeadForm({ onSubmitSuccess, submittedLead, onResetForm }: LeadFormProps) {
  const [formData, setFormData] = useState<LeadFormData>(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<"success" | "error" | null>(null);

  // Budget sub-state for 'Both' or specific choices
  const [monthlyBudgetChoice, setMonthlyBudgetChoice] = useState("");
  const [lumpSumBudgetChoice, setLumpSumBudgetChoice] = useState("");

  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);

  const isSubmitted = !!submittedLead;

  // Sync state when parent submittedLead changes
  useEffect(() => {
    if (submittedLead) {
      setFormData({
        fullName: submittedLead.fullName || "",
        phone: submittedLead.phone || "",
        email: submittedLead.email || "",
        dob: submittedLead.dob || "",
        age: String(submittedLead.age || ""),
        salaryRange: submittedLead.salaryRange || "",
        investmentMode: submittedLead.investmentMode || "",
        investmentBudget: submittedLead.investmentBudget || "",
        margoHelp: submittedLead.margoHelp || [],
        additionalNotes: submittedLead.additionalNotes || ""
      });
    } else {
      setFormData(INITIAL_FORM_DATA);
      setMonthlyBudgetChoice("");
      setLumpSumBudgetChoice("");
    }
  }, [submittedLead]);

  // Section Refs
  const section1Ref = useRef<HTMLDivElement>(null);
  const section2Ref = useRef<HTMLDivElement>(null);
  const section3Ref = useRef<HTMLDivElement>(null);
  const trackerRef = useRef<HTMLElement>(null);

  // Minimal floating progress tracker state for phone screens
  const [showFloatingMinimal, setShowFloatingMinimal] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(60);

  // Check validity of Section 1
  const isSection1Valid = 
    formData.fullName.trim() !== "" && 
    formData.dob.trim() !== "" && 
    formData.phone.trim() !== "" &&
    /^[0-9+() \-#]{7,17}$/.test(formData.phone.trim()) &&
    formData.email.trim() !== "" &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim());

  // Check validity of Section 2
  const isSection2Valid = 
    isSection1Valid && 
    formData.salaryRange.trim() !== "" &&
    formData.investmentMode !== "";

  // Active step state (1 to 3)
  const [activeStep, setActiveStep] = useState(1);

  // Calculate Progress percentage
  const calculateProgress = () => {
    let steps = 0;
    if (isSection1Valid) steps += 1;
    if (isSection2Valid) steps += 1;
    if (isSection1Valid && formData.margoHelp.length > 0) steps += 1;
    return Math.min(100, Math.round((steps / 3) * 100));
  };

  // Keep track of header height for pixel-perfect floating position
  useEffect(() => {
    const updateHeaderHeight = () => {
      const headerEl = document.querySelector("header");
      if (headerEl) {
        setHeaderHeight(headerEl.offsetHeight);
      }
    };
    updateHeaderHeight();
    window.addEventListener("resize", updateHeaderHeight);
    return () => window.removeEventListener("resize", updateHeaderHeight);
  }, []);

  // Monitor scroll position to swap in minimal progress bar on mobile
  useEffect(() => {
    const handleScroll = () => {
      // On desktop / wide screens (>= 1024px), always use the sticky sidebar tracker
      if (window.innerWidth >= 1024) {
        setShowFloatingMinimal(false);
        return;
      }

      const headerEl = document.querySelector("header");
      const currentHeaderH = headerEl ? headerEl.offsetHeight : 60;

      // Check if user has scrolled past the default progress tracker
      if (trackerRef.current) {
        const rect = trackerRef.current.getBoundingClientRect();
        // When bottom of default tracker scrolls past the bottom of the sticky header
        const isPast = rect.bottom <= currentHeaderH + 10;
        setShowFloatingMinimal(isPast);
      }

      // Dynamically reflect active section while scrolling through form
      const offsetThreshold = currentHeaderH + 80;
      const s3 = section3Ref.current?.getBoundingClientRect();
      const s2 = section2Ref.current?.getBoundingClientRect();
      const s1 = section1Ref.current?.getBoundingClientRect();

      if (s3 && s3.top <= offsetThreshold) {
        setActiveStep(3);
      } else if (s2 && s2.top <= offsetThreshold) {
        setActiveStep(2);
      } else if (s1 && s1.top <= offsetThreshold) {
        setActiveStep(1);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (isSubmitted) return;
    const { name, value } = e.target;

    if (name === "dob") {
      let computedAge = "";
      if (value) {
        const birthDate = new Date(value);
        const today = new Date();
        let ageNum = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          ageNum--;
        }
        if (!isNaN(ageNum) && ageNum >= 0 && ageNum <= 120) {
          computedAge = ageNum.toString();
        }
      }

      setFormData(prev => ({
        ...prev,
        dob: value,
        age: computedAge
      }));

      setErrors(prev => {
        const copy = { ...prev };
        delete copy.dob;
        return copy;
      });
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors(prev => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  const handleInvestmentModeSelect = (mode: "Monthly" | "Lump Sum" | "Both" | "Not sure yet") => {
    if (isSubmitted) return;
    
    setFormData(prev => ({
      ...prev,
      investmentMode: mode,
      investmentBudget: mode === "Not sure yet" ? "Not sure yet" : ""
    }));

    setMonthlyBudgetChoice("");
    setLumpSumBudgetChoice("");

    setErrors(prev => {
      const copy = { ...prev };
      delete copy.investmentMode;
      delete copy.investmentBudget;
      return copy;
    });
  };

  const handleMonthlyBudgetSelect = (val: string) => {
    if (isSubmitted) return;
    setMonthlyBudgetChoice(val);

    if (formData.investmentMode === "Both") {
      const budgetStr = [val ? `Monthly: ${val}` : "", lumpSumBudgetChoice ? `Lump Sum: ${lumpSumBudgetChoice}` : ""].filter(Boolean).join(" | ");
      setFormData(prev => ({ ...prev, investmentBudget: budgetStr }));
    } else {
      setFormData(prev => ({ ...prev, investmentBudget: `Monthly: ${val}` }));
    }
  };

  const handleLumpSumBudgetSelect = (val: string) => {
    if (isSubmitted) return;
    setLumpSumBudgetChoice(val);

    if (formData.investmentMode === "Both") {
      const budgetStr = [monthlyBudgetChoice ? `Monthly: ${monthlyBudgetChoice}` : "", val ? `Lump Sum: ${val}` : ""].filter(Boolean).join(" | ");
      setFormData(prev => ({ ...prev, investmentBudget: budgetStr }));
    } else {
      setFormData(prev => ({ ...prev, investmentBudget: `Lump Sum: ${val}` }));
    }
  };

  const handleToggleMargoHelp = (item: string) => {
    if (isSubmitted) return;
    setFormData(prev => {
      const current = prev.margoHelp || [];
      const updated = current.includes(item)
        ? current.filter(i => i !== item)
        : [...current, item];

      return {
        ...prev,
        margoHelp: updated
      };
    });

    setErrors(prev => {
      const copy = { ...prev };
      delete copy.margoHelp;
      return copy;
    });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full Name is required.";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone / WhatsApp Number is required.";
    } else if (!/^[0-9+() \-#]{7,17}$/.test(formData.phone.trim())) {
      newErrors.phone = "Please enter a valid phone number.";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email Address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (!formData.dob.trim()) {
      newErrors.dob = "Date of Birth is required.";
    }

    if (!formData.salaryRange) {
      newErrors.salaryRange = "Please select your Annual Income Range.";
    }

    if (!formData.investmentMode) {
      newErrors.investmentMode = "Please select your investment preference.";
    }

    if (formData.margoHelp.length === 0) {
      newErrors.margoHelp = "Please select at least one area Margo can help you with.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitted || isSubmitting) return;

    if (!validateForm()) {
      if (!isSection1Valid) {
        section1Ref.current?.scrollIntoView({ behavior: "smooth" });
        setActiveStep(1);
      } else if (!isSection2Valid) {
        section2Ref.current?.scrollIntoView({ behavior: "smooth" });
        setActiveStep(2);
      } else {
        section3Ref.current?.scrollIntoView({ behavior: "smooth" });
        setActiveStep(3);
      }
      return;
    }

    setIsSubmitting(true);
    setSubmitResult(null);

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error("Failed to submit form");
      }

      const result = await response.json();
      setSubmitResult("success");
      setIsSuccessModalOpen(true);
      onSubmitSuccess(result.lead);
    } catch (err) {
      console.error(err);
      setSubmitResult("error");
      setIsErrorModalOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollToSection = (ref: React.RefObject<HTMLDivElement | null>, stepNumber: number) => {
    if (!isSection1Valid && stepNumber > 1) {
      setErrors(prev => ({
        ...prev,
        sectionLock: "Please complete Full Name, Phone, Email, and Date of Birth in Section 1 to unlock further steps."
      }));
      if (section1Ref.current) {
        const headerEl = document.querySelector("header");
        const currentHeaderH = headerEl ? headerEl.offsetHeight : 60;
        const extraOffset = window.innerWidth < 1024 ? 54 : 24;
        const elementPosition = section1Ref.current.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({
          top: Math.max(0, elementPosition - currentHeaderH - extraOffset),
          behavior: "smooth"
        });
      }
      setActiveStep(1);
      return;
    }

    setErrors(prev => {
      const copy = { ...prev };
      delete copy.sectionLock;
      return copy;
    });
    setActiveStep(stepNumber);

    if (ref.current) {
      const headerEl = document.querySelector("header");
      const currentHeaderH = headerEl ? headerEl.offsetHeight : 60;
      const extraOffset = window.innerWidth < 1024 ? 54 : 24;
      const elementPosition = ref.current.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: Math.max(0, elementPosition - currentHeaderH - extraOffset),
        behavior: "smooth"
      });
    }
  };

  const handleResetForm = () => {
    setFormData(INITIAL_FORM_DATA);
    setMonthlyBudgetChoice("");
    setLumpSumBudgetChoice("");
    setActiveStep(1);
    setIsSuccessModalOpen(false);
    setIsErrorModalOpen(false);
    onResetForm?.();
  };

  return (
    <div className="w-full max-w-6xl mx-auto pb-10" id="form-container">
      {/* Minimal Floating Progress Tracker for Narrow/Phone Screens */}
      <AnimatePresence>
        {showFloatingMinimal && (
          <motion.div
            key="floating-minimal-tracker"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            style={{ top: `${headerHeight}px` }}
            className="fixed left-0 right-0 z-40 lg:hidden bg-[#FDFBF7]/95 backdrop-blur-md border-b border-[#C5A059]/30 shadow-sm px-4 py-2"
            id="floating-minimal-tracker"
          >
            <div className="max-w-md mx-auto flex items-center justify-between gap-3">
              {/* Minimal Numbers: 01, 02, 03 */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                {[
                  { step: 1, label: "01", ref: section1Ref },
                  { step: 2, label: "02", ref: section2Ref, locked: !isSection1Valid },
                  { step: 3, label: "03", ref: section3Ref, locked: !isSection1Valid }
                ].map((item, idx) => {
                  const isActive = activeStep === item.step;

                  return (
                    <React.Fragment key={item.step}>
                      {idx > 0 && (
                        <div
                          className={`h-0.5 w-3 sm:w-5 rounded-full transition-colors duration-300 ${
                            activeStep >= item.step ? "bg-[#C5A059]" : "bg-slate-200"
                          }`}
                        />
                      )}
                      <button
                        type="button"
                        disabled={item.locked}
                        onClick={() => scrollToSection(item.ref, item.step)}
                        className={`flex items-center justify-center rounded-full font-mono text-xs font-bold transition-all px-3 py-1 min-h-[32px] min-w-[32px] cursor-pointer ${
                          item.locked
                            ? "bg-slate-100 text-slate-400 opacity-40 cursor-not-allowed"
                            : isActive
                            ? "bg-[#121824] text-[#FAF5EA] ring-2 ring-[#C5A059] shadow-xs scale-105"
                            : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                        }`}
                        aria-label={`Step ${item.label}`}
                      >
                        <span>{item.label}</span>
                        {item.locked && (
                          <Lock className="w-2.5 h-2.5 ml-1 opacity-50" />
                        )}
                      </button>
                    </React.Fragment>
                  );
                })}
              </div>

              {/* Progress Percentage */}
              <div className="flex items-center gap-1.5 bg-[#FAF5EA] px-2.5 py-1 rounded-full border border-[#C5A059]/30 text-xs font-mono font-bold text-[#121824]">
                <span>{calculateProgress()}%</span>
              </div>
            </div>

            {/* Bottom micro-progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-slate-200/70 overflow-hidden">
              <div
                className="h-full bg-[#C5A059] transition-all duration-300 ease-out"
                style={{ width: `${calculateProgress()}%` }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* 2-Column High Density Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Advisor Card & Milestone Stepper (lg:span-4) */}
        <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-[100px] z-30">
          
          {/* Marianne Gomes - Advisor Card */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-lic-blue"></div>
            
            <div className="mb-2">
              <MargoLogo className="w-12 h-12" />
            </div>
            
            <h3 className="font-display font-bold text-base text-slate-800 leading-tight">Marianne Gomes</h3>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5 font-bold flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-lic-gold" /> Financial Advisor
            </p>
            <a 
              href="https://wa.me/919930074680?text=Hello%20Margo%20Advisory%2C%20I%20would%20like%20to%20know%20more%20about%20your%20services." 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 px-3 py-1 rounded-full font-semibold transition-all my-2 shadow-2xs"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
              WhatsApp: +91 9930074680
            </a>
            <a 
              href="mailto:margoadvisory@gmail.com"
              className="text-[11px] font-display text-slate-500 hover:text-lic-blue transition-colors"
            >
              margoadvisory@gmail.com
            </a>
          </div>

          {/* High Density Step Navigator */}
          <nav ref={trackerRef} className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 space-y-5">
            <div className="flex items-center gap-2 text-xs md:text-sm text-slate-700 bg-slate-50 p-2.5 rounded-2xl border border-slate-200 font-sans">
              <span className="text-lic-gold text-sm">🔒</span>
              <span className="font-semibold text-[#3B1F0A]">Your information is encrypted and kept confidential</span>
            </div>

            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block px-1">
              Enquiry Milestones
            </span>
            
            <div className="space-y-1">
              {[
                { step: 1, label: "Personal Information", icon: User },
                { step: 2, label: "Income & Investment Plan", icon: TrendingUp, locked: !isSection1Valid },
                { step: 3, label: "Services & Goals", icon: HelpCircle, locked: !isSection1Valid }
              ].map((item, index) => {
                const isActive = activeStep === item.step;
                
                return (
                  <button
                    key={index}
                    type="button"
                    disabled={item.locked}
                    onClick={() => {
                      if (item.step === 1) scrollToSection(section1Ref, 1);
                      if (item.step === 2) scrollToSection(section2Ref, 2);
                      if (item.step === 3) scrollToSection(section3Ref, 3);
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all text-left group ${
                      item.locked 
                        ? "opacity-40 cursor-not-allowed select-none bg-transparent" 
                        : isActive 
                          ? "bg-blue-50/80 text-lic-blue font-bold border-l-4 border-lic-blue shadow-sm" 
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50/80 cursor-pointer"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-5 h-5 rounded-full font-mono text-[9px] flex items-center justify-center font-bold ${
                        item.locked 
                          ? "bg-slate-100 text-slate-400" 
                          : isActive 
                            ? "bg-lic-blue text-white" 
                            : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
                      }`}>
                        {String(item.step).padStart(2, "0")}
                      </span>
                      <span className="text-xs transition-colors font-sans">
                        {item.label}
                      </span>
                    </div>

                    {!item.locked && isActive && (
                      <span className="text-[10px] text-lic-blue">
                        ●
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Completion Bar */}
            <div className="pt-4 px-1 border-t border-slate-100">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-sans uppercase font-bold tracking-wider text-[10px]">Progress</span>
                  <span className="font-mono font-bold text-[#3B1F0A]">{calculateProgress()}% Complete</span>
                </div>
                
                <div className="relative flex items-center h-4 w-full select-none pt-1">
                  <div className="absolute inset-y-1/2 left-0 right-0 h-0.5 bg-slate-200 -translate-y-1/2"></div>
                  <div 
                    className="absolute inset-y-1/2 left-0 h-0.5 bg-[#3B1F0A] -translate-y-1/2 transition-all duration-500 ease-out"
                    style={{ width: `${calculateProgress()}%` }}
                  ></div>
                  <div 
                    className="absolute w-3.5 h-3.5 rounded-full border-2 border-[#3B1F0A] bg-white flex items-center justify-center -translate-x-1/2 transition-all duration-500 ease-out"
                    style={{ left: `${calculateProgress()}%` }}
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-lic-gold"></div>
                  </div>
                </div>
              </div>
            </div>

          </nav>
        </aside>

        {/* RIGHT COLUMN: Streamlined Form Sections */}
        <div className="lg:col-span-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {isSubmitted && (
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-3xl text-emerald-800 text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in shadow-sm pointer-events-auto">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-display font-bold text-slate-800">Enquiry Received</h4>
                    <p className="text-xs text-slate-600">Your details have been submitted to Marianne Gomes at Margo Advisory.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="px-5 py-2.5 bg-lic-blue hover:bg-opacity-90 text-white font-display font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md flex items-center justify-center gap-1 flex-shrink-0"
                >
                  Start New Enquiry
                </button>
              </div>
            )}

            <fieldset disabled={isSubmitted} className="space-y-6 pointer-events-auto">
              
              {/* SECTION 1: Personal Contact Details */}
              <div 
                ref={section1Ref}
                className={`glass-panel p-6 md:p-8 rounded-3xl transition-all duration-300 relative overflow-hidden ${
                  activeStep === 1 
                    ? "ring-2 ring-lic-blue shadow-lg scale-[1.01]" 
                    : "opacity-95 hover:opacity-100 shadow-sm"
                }`}
                onClick={() => setActiveStep(1)}
                id="section-1"
              >
                {/* Section Header */}
                <div className="flex items-start gap-3.5 sm:gap-4 mb-6">
                  <div className={`p-2.5 sm:p-3 rounded-2xl ${activeStep === 1 ? 'bg-lic-blue text-white' : 'bg-blue-50 text-lic-blue'} shrink-0 shadow-2xs`}>
                    <User className="w-5 h-5" />
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-display text-xl font-bold text-lic-dark">
                        Personal Information
                      </h3>
                      <span className="text-red-500 text-xs font-bold font-mono">* Required</span>
                    </div>
                    <p className="text-slate-500 text-sm mt-0.5">
                      Help us know who we are planning for.
                    </p>
                  </div>
                </div>

                {/* Full Width Inputs */}
                <div className="w-full space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* 1. Full Name */}
                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                          1. Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="input-fullname"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleInputChange}
                          placeholder="Enter your full name"
                          className={`w-full px-4 py-3 rounded-xl border bg-slate-50/50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-lic-blue focus:bg-white transition-all text-sm ${
                            errors.fullName ? 'border-red-400 focus:ring-red-400' : 'border-slate-200'
                          }`}
                        />
                        {errors.fullName && (
                          <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> {errors.fullName}
                          </p>
                        )}
                      </div>

                      {/* 2. Phone / WhatsApp Number */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                          2. Phone / WhatsApp Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          id="input-phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="E.g., +91 98765 43210"
                          className={`w-full px-4 py-3 rounded-xl border bg-slate-50/50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-lic-blue focus:bg-white transition-all text-sm ${
                            errors.phone ? 'border-red-400 focus:ring-red-400' : 'border-slate-200'
                          }`}
                        />
                        {errors.phone && (
                          <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> {errors.phone}
                          </p>
                        )}
                      </div>

                      {/* 3. Email Address */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                          3. Email Address <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          id="input-email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="E.g., client@example.com"
                          className={`w-full px-4 py-3 rounded-xl border bg-slate-50/50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-lic-blue focus:bg-white transition-all text-sm ${
                            errors.email ? 'border-red-400 focus:ring-red-400' : 'border-slate-200'
                          }`}
                        />
                        {errors.email && (
                          <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> {errors.email}
                          </p>
                        )}
                      </div>

                      {/* 4. Date of Birth */}
                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                          4. Date of Birth <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
                          <input
                            type="date"
                            id="input-dob"
                            name="dob"
                            value={formData.dob}
                            onChange={handleInputChange}
                            className={`w-full px-4 py-3 rounded-xl border bg-slate-50/50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-lic-blue focus:bg-white transition-all text-sm ${
                              errors.dob ? 'border-red-400 focus:ring-red-400' : 'border-slate-200'
                            }`}
                          />
                          {formData.age ? (
                            <div className="text-xs text-slate-600 bg-slate-100/80 px-4 py-3 rounded-xl border border-slate-200 font-medium">
                              Age: <span className="font-mono font-bold text-lic-blue">{formData.age} years</span> (Auto-calculated)
                            </div>
                          ) : (
                            <div className="text-xs text-slate-400 italic px-2">
                              Select Date of Birth from calendar
                            </div>
                          )}
                        </div>
                        {errors.dob && (
                          <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> {errors.dob}
                          </p>
                        )}
                      </div>

                    </div>

                    {isSection1Valid && activeStep === 1 && (
                      <div className="pt-2 flex justify-end">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            scrollToSection(section2Ref, 2);
                          }}
                          className="px-5 py-2.5 bg-lic-blue hover:bg-blue-800 text-white font-medium text-xs rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer"
                        >
                          Next: Income & Investment Plan <ArrowRight className="w-4 h-4 text-lic-gold" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

              {/* SECTION 2: Income & Investment Preference */}
              <div 
                ref={section2Ref}
                className={`glass-panel p-6 md:p-8 rounded-3xl transition-all duration-300 relative overflow-hidden ${
                  activeStep === 2 
                    ? "ring-2 ring-lic-blue shadow-lg scale-[1.01]" 
                    : "opacity-95 hover:opacity-100 shadow-sm"
                }`}
                onClick={() => isSection1Valid ? setActiveStep(2) : setActiveStep(1)}
                id="section-2"
              >
                {/* Section Header */}
                <div className="flex items-start gap-3.5 sm:gap-4 mb-6">
                  <div className={`p-2.5 sm:p-3 rounded-2xl ${activeStep === 2 && isSection1Valid ? 'bg-lic-blue text-white' : 'bg-blue-50 text-lic-blue'} shrink-0 shadow-2xs`}>
                    <TrendingUp className="w-5 h-5" />
                  </div>

                  <div>
                    <h3 className="font-display text-xl font-bold text-lic-dark">
                      Income & Investment Plan
                    </h3>
                    <p className="text-slate-500 text-sm mt-0.5">
                      Tell us about your income bracket and investment comfort zone.
                    </p>
                  </div>
                </div>

                {/* Full Width Inputs */}
                <div className="w-full">
                  {!isSection1Valid ? (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-500 italic">
                      Please complete Section 1 (Name, Phone, Email, and Date of Birth) to unlock this section.
                    </div>
                  ) : (
                    <div className="space-y-6 pt-1">
                        
                        {/* 5. Annual Income Range */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                            5. Annual Income Range <span className="text-red-500">*</span>
                          </label>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                            {[
                              "Below ₹5 lakh",
                              "₹5–10 lakh",
                              "₹10–20 lakh",
                              "₹20–50 lakh",
                              "Above ₹50 lakh",
                              "Prefer not to say"
                            ].map((range) => {
                              const isSelected = formData.salaryRange === range;
                              return (
                                <button
                                  type="button"
                                  key={range}
                                  onClick={() => {
                                    setFormData(prev => ({ ...prev, salaryRange: range }));
                                    setErrors(prev => {
                                      const copy = { ...prev };
                                      delete copy.salaryRange;
                                      return copy;
                                    });
                                  }}
                                  className={`p-3 rounded-xl border text-xs font-medium transition-all text-left flex items-center justify-between cursor-pointer ${
                                    isSelected
                                      ? "bg-blue-50/80 border-lic-blue text-lic-blue ring-1 ring-lic-blue font-bold shadow-sm"
                                      : "bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700"
                                  }`}
                                >
                                  <span>{range}</span>
                                  {isSelected && <CheckCircle className="w-4 h-4 text-lic-blue shrink-0" />}
                                </button>
                              );
                            })}
                          </div>
                          {errors.salaryRange && (
                            <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> {errors.salaryRange}
                            </p>
                          )}
                        </div>

                        {/* 6. Investment Preference */}
                        <div className="space-y-4 border-t border-slate-100 pt-5">
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                              6. How would you prefer to invest? <span className="text-red-500">*</span>
                            </label>
                            <p className="text-slate-500 text-xs mb-3">
                              Select your preferred frequency or method.
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                              {[
                                { id: "Monthly", label: "Monthly" },
                                { id: "Lump Sum", label: "Lump Sum" },
                                { id: "Both", label: "Both" },
                                { id: "Not sure yet", label: "Not sure yet" }
                              ].map((item) => {
                                const isSelected = formData.investmentMode === item.id;
                                return (
                                  <button
                                    type="button"
                                    key={item.id}
                                    onClick={() => handleInvestmentModeSelect(item.id as any)}
                                    className={`p-3 rounded-xl border text-xs font-medium transition-all text-center flex flex-col items-center justify-center gap-1 cursor-pointer ${
                                      isSelected
                                        ? "bg-blue-50/80 border-lic-blue text-lic-blue ring-1 ring-lic-blue font-bold shadow-sm"
                                        : "bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700"
                                    }`}
                                  >
                                    <span>{item.label}</span>
                                  </button>
                                );
                              })}
                            </div>
                            {errors.investmentMode && (
                              <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" /> {errors.investmentMode}
                              </p>
                            )}
                          </div>

                          {/* Conditional Budget Ranges */}
                          {formData.investmentMode && formData.investmentMode !== "Not sure yet" && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 space-y-4"
                            >
                              <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wider">
                                What investment budget are you comfortable with? <span className="text-slate-400 font-normal italic">(Optional)</span>
                              </label>

                              {/* Monthly Ranges */}
                              {(formData.investmentMode === "Monthly" || formData.investmentMode === "Both") && (
                                <div className="space-y-2">
                                  <span className="text-[11px] font-bold text-slate-600 block">Monthly Budget:</span>
                                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                    {[
                                      "Below ₹2,000/mo",
                                      "₹2,000–₹5,000/mo",
                                      "₹5,000–₹10,000/mo",
                                      "₹10,000–₹25,000/mo",
                                      "Above ₹25,000/mo"
                                    ].map((b) => {
                                      const isSel = monthlyBudgetChoice === b || formData.investmentBudget.includes(b);
                                      return (
                                        <button
                                          type="button"
                                          key={b}
                                          onClick={() => handleMonthlyBudgetSelect(b)}
                                          className={`px-3 py-2 rounded-lg border text-xs text-left transition-all cursor-pointer ${
                                            isSel
                                              ? "bg-white border-lic-blue text-lic-blue font-bold shadow-xs"
                                              : "bg-white/80 border-slate-200 text-slate-700 hover:border-slate-300"
                                          }`}
                                        >
                                          {b}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {/* Lump Sum Ranges */}
                              {(formData.investmentMode === "Lump Sum" || formData.investmentMode === "Both") && (
                                <div className="space-y-2 pt-1">
                                  <span className="text-[11px] font-bold text-slate-600 block">Lump Sum Budget:</span>
                                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                    {[
                                      "Below ₹25,000",
                                      "₹25,000–₹1 lakh",
                                      "₹1–₹5 lakh",
                                      "₹5–₹10 lakh",
                                      "Above ₹10 lakh"
                                    ].map((b) => {
                                      const isSel = lumpSumBudgetChoice === b || formData.investmentBudget.includes(b);
                                      return (
                                        <button
                                          type="button"
                                          key={b}
                                          onClick={() => handleLumpSumBudgetSelect(b)}
                                          className={`px-3 py-2 rounded-lg border text-xs text-left transition-all cursor-pointer ${
                                            isSel
                                              ? "bg-white border-lic-blue text-lic-blue font-bold shadow-xs"
                                              : "bg-white/80 border-slate-200 text-slate-700 hover:border-slate-300"
                                          }`}
                                        >
                                          {b}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </motion.div>
                          )}

                        </div>

                        {activeStep === 2 && (
                          <div className="pt-2 flex justify-end">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                scrollToSection(section3Ref, 3);
                              }}
                              className="px-5 py-2.5 bg-lic-blue hover:bg-blue-800 text-white font-medium text-xs rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer"
                            >
                              Next: Services Needed <ArrowRight className="w-4 h-4 text-lic-gold" />
                            </button>
                          </div>
                        )}

                      </div>
                    )}
                  </div>
              </div>

              {/* SECTION 3: Advisory Services Needed & Additional Info */}
              <div 
                ref={section3Ref}
                className={`glass-panel p-6 md:p-8 rounded-3xl transition-all duration-300 relative overflow-hidden ${
                  activeStep === 3 
                    ? "ring-2 ring-lic-blue shadow-lg scale-[1.01]" 
                    : "opacity-95 hover:opacity-100 shadow-sm"
                }`}
                onClick={() => isSection1Valid ? setActiveStep(3) : setActiveStep(1)}
                id="section-3"
              >
                {/* Section Header */}
                <div className="flex items-start gap-3.5 sm:gap-4 mb-6">
                  <div className={`p-2.5 sm:p-3 rounded-2xl ${activeStep === 3 && isSection1Valid ? 'bg-lic-blue text-white' : 'bg-blue-50 text-lic-blue'} shrink-0 shadow-2xs`}>
                    <HelpCircle className="w-5 h-5" />
                  </div>

                  <div>
                    <h3 className="font-display text-xl font-bold text-lic-dark">
                      Services & Additional Details
                    </h3>
                    <p className="text-slate-500 text-sm mt-0.5">
                      Select what you would like Margo Advisory to assist you with.
                    </p>
                  </div>
                </div>

                {/* Full Width Inputs */}
                <div className="w-full">
                  {!isSection1Valid ? (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-500 italic">
                      Please complete Section 1 (Name, Phone, Email, and Date of Birth) to unlock this section.
                    </div>
                  ) : (
                    <div className="space-y-6">
                        
                        {/* 7. What can Margo help you with? */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                            7. What can Margo help you with? <span className="text-red-500">*</span>
                          </label>
                          <p className="text-slate-500 text-xs mb-3">
                            Select all that apply:
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                            {[
                              "LIC / Life Insurance",
                              "Mutual Funds",
                              "Health Insurance",
                              "ITR Filing",
                              "Tax Planning",
                              "Retirement Planning",
                              "Child Education Planning",
                              "Wealth Building / Investments",
                              "Not Sure — I Need Guidance"
                            ].map((service) => {
                              const isChecked = formData.margoHelp.includes(service);
                              return (
                                <button
                                  type="button"
                                  key={service}
                                  onClick={() => handleToggleMargoHelp(service)}
                                  className={`p-3 rounded-xl border text-left text-xs font-medium flex items-center justify-between transition-all cursor-pointer ${
                                    isChecked
                                      ? "bg-blue-50/80 border-lic-blue text-lic-blue ring-1 ring-lic-blue font-bold shadow-sm"
                                      : "bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700"
                                  }`}
                                >
                                  <span>{service}</span>
                                  <span className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 transition-all ${
                                    isChecked ? "bg-lic-blue border-lic-blue text-white" : "border-slate-300 bg-white"
                                  }`}>
                                    {isChecked && <CheckCircle className="w-3.5 h-3.5" />}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                          {errors.margoHelp && (
                            <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> {errors.margoHelp}
                            </p>
                          )}
                        </div>

                        {/* 8. Additional Information */}
                        <div className="border-t border-slate-100 pt-5">
                          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                            8. Anything you'd like us to know? <span className="text-slate-400 font-normal italic">(Optional)</span>
                          </label>
                          <textarea
                            id="input-notes"
                            name="additionalNotes"
                            value={formData.additionalNotes}
                            onChange={handleInputChange}
                            rows={3}
                            placeholder="Share any specific goals, questions, or preferences..."
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-lic-blue focus:bg-white transition-all text-sm resize-y"
                          />
                        </div>

                        {/* Submit Button & CTA */}
                        <div className="pt-4 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                            <span>Your details are kept 100% confidential.</span>
                          </div>
                          
                          <button
                            type="submit"
                            id="btn-submit"
                            disabled={isSubmitting}
                            className={`px-8 py-3.5 rounded-xl font-display font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                              isSubmitting 
                                ? "bg-slate-300 text-slate-500 cursor-not-allowed w-full md:w-auto" 
                                : "bg-lic-blue hover:bg-opacity-95 text-white bg-gradient-to-r hover:from-blue-900 hover:to-lic-blue w-full md:w-auto"
                            }`}
                          >
                            {isSubmitting ? (
                              <>
                                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Sending...
                              </>
                            ) : (
                              <>
                                Let’s Plan Together <Sparkles className="w-4 h-4 text-lic-gold" />
                              </>
                            )}
                          </button>
                        </div>

                      </div>
                    )}
                  </div>
              </div>

            </fieldset>

            {/* Global Lock/Warning Notification */}
            {errors.sectionLock && (
              <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl flex items-center gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-600" />
                <span>{errors.sectionLock}</span>
              </div>
            )}

            {/* Success Modal */}
            <AnimatePresence>
              {isSuccessModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0 bg-[#3B1F0A]/50 backdrop-blur-sm pointer-events-auto"
                  />

                  <motion.div
                    id="premium-modal-content"
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="bg-white rounded-[20px] shadow-2xl border border-slate-100 max-w-md w-full p-8 text-center relative z-10 pointer-events-auto overflow-hidden"
                  >
                    <div className="w-20 h-20 bg-[#FBF7F0] border-2 border-[#c9a46e]/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner relative success-pulse">
                      <ShieldCheck className="w-10 h-10 text-[#c9a46e]" />
                    </div>

                    <div className="space-y-3 mb-8 text-center">
                      <h2 className="font-display font-black text-2xl text-[#3B1F0A] tracking-tight">
                        Details Received!
                      </h2>
                      <div className="h-0.5 w-16 bg-[#c9a46e] mx-auto rounded-full"></div>
                      <p className="text-slate-600 text-sm leading-relaxed pt-2">
                        Thank you for reaching out to Margo Advisory. We’ve received your details and will connect with you shortly to understand your goals and help you plan your next steps.
                      </p>
                    </div>

                    <div className="flex flex-col gap-3">
                      <button
                        type="button"
                        onClick={handleResetForm}
                        className="w-full py-3.5 px-6 bg-[#3B1F0A] hover:bg-[#2d1607] text-white font-display font-bold text-sm rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                      >
                        Start Another Enquiry <Sparkles className="w-4 h-4 text-[#c9a46e]" />
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setIsSuccessModalOpen(false)}
                        className="w-full py-3 px-6 bg-white hover:bg-slate-50 text-[#3B1F0A] border-2 border-[#3B1F0A]/20 hover:border-[#3B1F0A]/40 font-display font-bold text-sm rounded-xl transition-all cursor-pointer"
                      >
                        Close
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* Error Modal */}
            <AnimatePresence>
              {isErrorModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0 bg-red-950/30 backdrop-blur-sm pointer-events-auto"
                  />

                  <motion.div
                    id="premium-modal-content"
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="bg-white rounded-[20px] shadow-2xl border border-red-100 max-w-md w-full p-8 text-center relative z-10 pointer-events-auto overflow-hidden"
                  >
                    <div className="w-20 h-20 bg-red-50 border-2 border-red-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner relative">
                      <AlertCircle className="w-10 h-10 text-red-600" />
                    </div>

                    <div className="space-y-3 mb-8 text-center">
                      <h2 className="font-display font-black text-2xl text-red-700 tracking-tight">
                        Submission Error
                      </h2>
                      <div className="h-0.5 w-16 bg-red-400 mx-auto rounded-full"></div>
                      <p className="text-slate-600 text-sm leading-relaxed pt-2">
                        An error occurred while submitting your details. Please check your network connection and try again.
                      </p>
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => setIsErrorModalOpen(false)}
                        className="w-full py-3.5 px-6 bg-red-600 hover:bg-red-700 text-white font-display font-bold text-sm rounded-xl transition-all shadow-md cursor-pointer"
                      >
                        Dismiss
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

          </form>
        </div>

      </div>
    </div>
  );
}
