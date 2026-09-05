import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  FileSpreadsheet, 
  Search, 
  Trash2, 
  RotateCw, 
  CheckCircle, 
  AlertCircle, 
  Lock, 
  Unlock, 
  Key,
  HelpCircle, 
  ArrowUpRight, 
  Filter, 
  BarChart2, 
  Plus, 
  UserCheck, 
  FileText,
  TrendingUp,
  Inbox,
  LogOut,
  ChevronDown,
  BookOpen,
  Clipboard,
  Phone,
  Mail,
  Calendar,
  ExternalLink,
  Copy,
  MessageSquare,
  Download
} from "lucide-react";
import { LeadSubmission } from "../types";
import { googleSignIn, initAuth, logout, hasFirebaseSetup } from "../lib/firebase";

export default function AdminDashboard() {
  const [passcode, setPasscode] = useState("");
  const [activePasscode, setActivePasscode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("margo_advisor_passcode") || "amberemily";
    }
    return "amberemily";
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState("");

  // Change Passcode Modal States
  const [isChangePasscodeModalOpen, setIsChangePasscodeModalOpen] = useState(false);
  const [currentPasscode, setCurrentPasscode] = useState("");
  const [newPasscode, setNewPasscode] = useState("");
  const [confirmNewPasscode, setConfirmNewPasscode] = useState("");
  const [changePasscodeError, setChangePasscodeError] = useState("");
  const [changePasscodeSuccess, setChangePasscodeSuccess] = useState("");
  const [isSubmittingChangePasscode, setIsSubmittingChangePasscode] = useState(false);
  
  const [leads, setLeads] = useState<LeadSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  // Share Client Survey states
  const [clientLink, setClientLink] = useState("");
  const [isCopied, setIsCopied] = useState(false);

  // Deletion confirmation custom state
  const [deleteConfirmLead, setDeleteConfirmLead] = useState<{ id: string; fullName: string; isDeleted: boolean } | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      let origin = window.location.origin;
      // Convert development domain (ais-dev-) to public preview domain (ais-pre-) so clients bypass Google AI login
      if (origin.includes("ais-dev-")) {
        origin = origin.replace("ais-dev-", "ais-pre-");
      }
      setClientLink(`${origin}/portal`);
    }
  }, []);

  const getPublicShareUrl = () => {
    if (clientLink) return clientLink;
    if (typeof window === "undefined") return "";
    let origin = window.location.origin;
    if (origin.includes("ais-dev-")) {
      origin = origin.replace("ais-dev-", "ais-pre-");
    }
    return `${origin}/portal`;
  };

  const [copiedType, setCopiedType] = useState<"rich" | "plain" | "template" | null>(null);

  const handleCopyRichLink = () => {
    const targetUrl = getPublicShareUrl();
    if (navigator.clipboard) {
      try {
        const plainText = targetUrl;
        const htmlText = `<a href="${targetUrl}">Margo Advisory Portal</a>`;
        
        const blobPlain = new Blob([plainText], { type: "text/plain" });
        const blobHtml = new Blob([htmlText], { type: "text/html" });
        
        const item = new ClipboardItem({
          "text/plain": blobPlain,
          "text/html": blobHtml,
        });
        
        navigator.clipboard.write([item])
          .then(() => {
            setCopiedType("rich");
            setTimeout(() => setCopiedType(null), 3000);
          })
          .catch(() => {
            navigator.clipboard.writeText(plainText)
              .then(() => {
                setCopiedType("rich");
                setTimeout(() => setCopiedType(null), 3000);
              });
          });
      } catch (err) {
        navigator.clipboard.writeText(targetUrl);
        setCopiedType("rich");
        setTimeout(() => setCopiedType(null), 3000);
      }
    } else {
      setCopiedType("rich");
      setTimeout(() => setCopiedType(null), 3000);
    }
  };

  const handleCopyPlainLink = () => {
    const targetUrl = getPublicShareUrl();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(targetUrl)
        .then(() => {
          setCopiedType("plain");
          setTimeout(() => setCopiedType(null), 3000);
        });
    } else {
      setCopiedType("plain");
      setTimeout(() => setCopiedType(null), 3000);
    }
  };

  const handleCopyTemplateLink = () => {
    const targetUrl = getPublicShareUrl();
    const message = `Please complete your financial profile on the Margo Advisory Portal here: Margo Advisory Portal (${targetUrl})`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(message)
        .then(() => {
          setCopiedType("template");
          setTimeout(() => setCopiedType(null), 3000);
        });
    } else {
      setCopiedType("template");
      setTimeout(() => setCopiedType(null), 3000);
    }
  };
  
  // Google sheets status
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [isLinkingGoogle, setIsLinkingGoogle] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ status: "idle" | "success" | "error"; message?: string; url?: string }>({ status: "idle" });

  // Sandbox simulation states
  const [isSandboxPopupOpen, setIsSandboxPopupOpen] = useState(false);
  const [isSimulatedUser, setIsSimulatedUser] = useState(false);
  const [simulatedProgress, setSimulatedProgress] = useState("");
  const [spreadsheetPreviewData, setSpreadsheetPreviewData] = useState<any[][] | null>(null);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [spreadsheetTitle, setSpreadsheetTitle] = useState("");
  const [spreadsheetSearchQuery, setSpreadsheetSearchQuery] = useState("");

  // Clipboard copies
  const [copiedText, setCopiedText] = useState("");

  useEffect(() => {
    // If authenticated previously, load leads
    if (isAuthenticated) {
      loadLeads();
    }
  }, [isAuthenticated]);



  useEffect(() => {
    // Listen for Firebase login status if Firebase setups are valid
    if (hasFirebaseSetup()) {
      initAuth(
        (user, token) => {
          setGoogleUser(user);
          setGoogleToken(token);
        },
        () => {
          setGoogleUser(null);
          setGoogleToken(null);
        }
      );
    }
  }, []);

  const handlePasscodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode || !passcode.trim()) {
      setAuthError("Please enter password.");
      return;
    }
    try {
      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode })
      });
      if (response.ok) {
        setIsAuthenticated(true);
        setAuthError("");
        setActivePasscode(passcode);
        if (typeof window !== "undefined") {
          localStorage.setItem("margo_advisor_passcode", passcode);
        }
      } else {
        setAuthError("Incorrect password.");
      }
    } catch (err) {
      // Fallback for offline/development if server has not fully compiled yet
      if (passcode === "amberemily") {
        setIsAuthenticated(true);
        setAuthError("");
        setActivePasscode(passcode);
        if (typeof window !== "undefined") {
          localStorage.setItem("margo_advisor_passcode", passcode);
        }
      } else {
        setAuthError("Incorrect password.");
      }
    }
  };

  const handleChangePasscodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangePasscodeError("");
    setChangePasscodeSuccess("");

    if (newPasscode !== confirmNewPasscode) {
      setChangePasscodeError("New passcodes do not match.");
      return;
    }

    if (newPasscode.trim().length < 3) {
      setChangePasscodeError("New passcode must be at least 3 characters.");
      return;
    }

    setIsSubmittingChangePasscode(true);
    try {
      const response = await fetch("/api/auth/change-passcode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPasscode,
          newPasscode: newPasscode.trim()
        })
      });

      if (response.ok) {
        setChangePasscodeSuccess("Passcode updated successfully!");
        setActivePasscode(newPasscode.trim());
        if (typeof window !== "undefined") {
          localStorage.setItem("margo_advisor_passcode", newPasscode.trim());
        }
        setCurrentPasscode("");
        setNewPasscode("");
        setConfirmNewPasscode("");
        setTimeout(() => {
          setIsChangePasscodeModalOpen(false);
          setChangePasscodeSuccess("");
        }, 1500);
      } else {
        const data = await response.json().catch(() => ({}));
        setChangePasscodeError(data.error || "Failed to update passcode. Verify your current passcode.");
      }
    } catch (err) {
      setChangePasscodeError("Server error. Please try again later.");
    } finally {
      setIsSubmittingChangePasscode(false);
    }
  };

  const loadLeads = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/leads?passcode=${encodeURIComponent(activePasscode)}`);
      if (response.ok) {
        const data = await response.json();
        setLeads(data);
      } else {
        console.error("Failed to load leads");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, passcode: activePasscode })
      });
      if (response.ok) {
        setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus as any } : l));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteLead = (leadId: string, leadName: string, isCurrentlyDeleted: boolean) => {
    setDeleteConfirmLead({ id: leadId, fullName: leadName, isDeleted: isCurrentlyDeleted });
  };

  const executeDeleteLead = async () => {
    if (!deleteConfirmLead) return;
    const { id: leadId } = deleteConfirmLead;
    try {
      const response = await fetch(`/api/leads/delete/${leadId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode: activePasscode })
      });
      if (response.ok) {
        const data = await response.json();
        const updatedLead = data.lead;
        setLeads(prev => prev.map(l => l.id === leadId ? { ...l, isDeleted: updatedLead.isDeleted, status: updatedLead.status } : l));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteConfirmLead(null);
    }
  };



  // Google OAuth Login
  const handleGoogleLogin = async () => {
    if (!hasFirebaseSetup()) {
      // Open the high-fidelity Sandbox OAuth popup overlay
      setIsSandboxPopupOpen(true);
      return;
    }

    setIsLinkingGoogle(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setGoogleUser(result.user);
        setGoogleToken(result.accessToken);
      }
    } catch (err: any) {
      alert(err.message || "OAuth Setup failed. Check configuration.");
    } finally {
      setIsLinkingGoogle(false);
    }
  };

  const handleGoogleLogout = async () => {
    if (!hasFirebaseSetup()) {
      setGoogleUser(null);
      setGoogleToken(null);
      setSpreadsheetPreviewData(null);
      setSyncStatus({ status: "idle" });
      setIsSimulatedUser(false);
      return;
    }
    await logout();
    setGoogleUser(null);
    setGoogleToken(null);
  };

  // Export leads directly to CSV file
  const handleExportCSV = () => {
    if (leads.length === 0) {
      alert("No leads found to export.");
      return;
    }
    const headers = [
      "Timestamp",
      "Lead ID",
      "Full Name",
      "Date of Birth",
      "Age",
      "Phone Number",
      "Email ID",
      "Annual Income",
      "Services Requested",
      "Investment Preference & Budget",
      "Client Notes",
      "Lead Status"
    ];

    const rows = leads.map(l => [
      `"${new Date(l.timestamp).toLocaleString("en-IN")}"`,
      `"${l.id}"`,
      `"${(l.fullName || "").replace(/"/g, '""')}"`,
      `"${l.dob || ""}"`,
      `"${l.age || ""}"`,
      `"${l.phone || ""}"`,
      `"${(l.email || "").replace(/"/g, '""')}"`,
      `"${(l.salaryRange || "Not Specified").replace(/"/g, '""')}"`,
      `"${(Array.isArray(l.margoHelp) && l.margoHelp.length > 0 ? l.margoHelp.join(", ") : (Array.isArray(l.existingInvestments) ? l.existingInvestments.join(", ") : "None")).replace(/"/g, '""')}"`,
      `"${([l.investmentMode, l.investmentBudget].filter(Boolean).join(" | ") || l.otherExistingInvestments || "None").replace(/"/g, '""')}"`,
      `"${(l.additionalNotes || l.otherIncome || "").replace(/"/g, '""')}"`,
      `"${l.status || "New"}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `margo_advisory_leads_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Google Sheets Sync (Supports real API & Sandbox simulation)
  const handleSyncToSheets = async () => {
    const isSandboxMock = !hasFirebaseSetup() || googleToken === "sandbox-mock-access-token-2026";

    if (!googleToken && !isSandboxMock) {
      alert("Please login with Google first.");
      return;
    }

    if (leads.length === 0) {
      alert("No leads found on server. Submissions will populate here.");
      return;
    }

    setIsSyncing(true);
    setSyncStatus({ status: "idle" });
    setSimulatedProgress("Initiating Google Drive socket session...");

    const headers = [
      "Timestamp",
      "Lead ID",
      "Full Name",
      "Date of Birth",
      "Age",
      "Phone Number",
      "Email ID",
      "Annual Income",
      "Services Requested",
      "Investment Preference & Budget",
      "Client Notes",
      "Lead Status"
    ];

    const sheetRows = [
      headers,
      ...leads.map(l => [
        new Date(l.timestamp).toLocaleString("en-IN"),
        l.id,
        l.fullName,
        l.dob || "N/A",
        l.age,
        l.phone || "N/A",
        l.email || "N/A",
        l.salaryRange || "Not Specified",
        Array.isArray(l.margoHelp) && l.margoHelp.length > 0 
          ? l.margoHelp.join(", ") 
          : (Array.isArray(l.existingInvestments) && l.existingInvestments.length > 0 ? l.existingInvestments.join(", ") : "None"),
        [l.investmentMode, l.investmentBudget].filter(Boolean).join(" | ") || l.otherExistingInvestments || "N/A",
        l.additionalNotes || l.otherIncome || "None",
        l.status || "New"
      ])
    ];

    if (isSandboxMock) {
      // Simulate authentic, animated spreadsheet creation steps
      setTimeout(() => {
        setSimulatedProgress("Creating a new spreadsheet: 'Margo Advisory Leads - Jun 2026'...");
        
        setTimeout(() => {
          setSimulatedProgress(`Compiling table schemas & pushing ${leads.length} rows to Sheet1...`);
          
          setTimeout(() => {
            setSimulatedProgress("Applying styled Google Sheets table alignments & conditional cell formatting...");
            
            setTimeout(() => {
              const formattedDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
              setSpreadsheetTitle(`Margo Advisory Leads - ${formattedDate}`);
              setSpreadsheetPreviewData(sheetRows);
              setIsSyncing(false);
              setSyncStatus({
                status: "success",
                message: `Successfully synchronized ${leads.length} lead ${leads.length === 1 ? 'entry' : 'entries'} into Excel-compatible tabular format! View the sandbox spreadsheet below.`,
                url: "#google-sheets-preview"
              });
            }, 800);
          }, 800);
        }, 800);
      }, 600);

      return;
    }

    // Real OAuth API Pathway
    try {
      // 1. Create Spreadsheet via Google Sheets API
      const createResponse = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${googleToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          properties: {
            title: `Margo Advisory Leads - ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}`
          }
        })
      });

      if (!createResponse.ok) {
        throw new Error("Failed to create spreadsheet on Google Drive. Verify app permissions.");
      }

      const sheetData = await createResponse.json();
      const spreadsheetId = sheetData.spreadsheetId;
      const spreadsheetUrl = sheetData.spreadsheetUrl;

      // 2. Write tabular data to Sheet1
      const writeResponse = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1:L${sheetRows.length}?valueInputOption=USER_ENTERED`,
        {
          method: "PUT",
          headers: {
            "Authorization": `Bearer ${googleToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            range: `Sheet1!A1:L${sheetRows.length}`,
            majorDimension: "ROWS",
            values: sheetRows
          })
        }
      );

      if (!writeResponse.ok) {
        throw new Error("Spreadsheet created, but cell values insertion failed. Please try again.");
      }

      setSpreadsheetTitle(`Margo Advisory Leads - ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}`);
      setSpreadsheetPreviewData(sheetRows);
      setSyncStatus({
        status: "success",
        message: `Successfully synchronized ${leads.length} lead ${leads.length === 1 ? 'entry' : 'entries'} into Excel-compatible tabular format!`,
        url: spreadsheetUrl
      });
    } catch (err: any) {
      console.error(err);
      setSyncStatus({
        status: "error",
        message: err.message || "An exception occurred during real sheets synchronization."
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => {
      setCopiedText("");
    }, 2000);
  };

  // Filtering leads based on search and status
  const filteredLeads = leads.filter(l => {
    // Hide deleted leads completely from the advisor workspace
    if (l.isDeleted || l.status === "Deleted") return false;

    const matchesSearch = l.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          l.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "All" || l.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Basic computed analytics
  const activeLeads = leads.filter(l => !l.isDeleted && l.status !== "Deleted");
  const totalLeadsCount = activeLeads.length;
  const newLeadsCount = activeLeads.filter(l => l.status === "New" || !l.status).length;
  const contactedCount = activeLeads.filter(l => l.status === "Contacted").length;
  const inProgressCount = activeLeads.filter(l => l.status === "In Progress").length;
  const averageAge = activeLeads.length > 0 
    ? Math.round(activeLeads.reduce((acc, current) => acc + Number(current.age || 0), 0) / activeLeads.length) 
    : 0;

  // Render Passcode Screen if not logged in
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-16 bg-white p-8 rounded-3xl shadow-lg border border-slate-100 flex flex-col justify-center">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 text-lic-blue flex items-center justify-center mx-auto mb-6">
          <Lock className="w-7 h-7" />
        </div>
        
        <div className="text-center space-y-1 mb-6">
          <h2 className="font-display font-black text-3xl text-lic-dark tracking-tight">
            Advisor Desk
          </h2>
          <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold font-sans">
            Margo Advisory
          </p>
          <p className="text-xs text-slate-500 pt-2 max-w-[280px] mx-auto leading-relaxed">
            Please enter your administrator passcode to access client portfolios.
          </p>
        </div>

        <form onSubmit={handlePasscodeSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Passcode
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-center font-mono focus:outline-none focus:ring-2 focus:ring-lic-blue text-lg"
              autoFocus
            />
            <p className="text-right text-[10px] text-slate-400 mt-1">Hint: flowers</p>
          </div>

          {authError && (
            <div className="p-3 bg-red-50 border border-red-100 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-lic-blue hover:bg-blue-800 text-white font-display font-semibold rounded-xl tracking-wide transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            Unlock Console <Unlock className="w-4 h-4 text-lic-gold" />
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Advisor Dashboard Header Banner */}
      <div className="bg-gradient-to-r from-lic-dark to-slate-900 text-white p-6 md:p-8 rounded-3xl shadow-md relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Background blobs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-lic-blue/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-10 w-48 h-48 bg-lic-gold/5 rounded-full blur-2xl pointer-events-none"></div>

        <div className="space-y-2 relative">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-lic-gold text-lic-dark rounded-md">
              Advisor Console
            </span>
          </div>
          <h2 className="font-display font-extrabold text-3xl md:text-4xl text-white">
            Marianne Gomes
          </h2>
          <p className="text-blue-100 font-sans text-sm max-w-md">
            Prepared by
          </p>
        </div>

        <div className="flex items-center gap-3 relative flex-wrap md:flex-nowrap">
          <button 
            type="button"
            onClick={loadLeads}
            disabled={isLoading}
            className="p-3 bg-white/10 hover:bg-white/15 text-white rounded-xl transition-all cursor-pointer"
            title="Refresh Leads"
          >
            <RotateCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-4 py-2.5 bg-emerald-700/80 hover:bg-emerald-600 text-white font-sans text-xs font-semibold rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-sm"
            title="Download all leads as a CSV spreadsheet file"
          >
            <Download className="w-3.5 h-3.5" /> Download CSV
          </button>

          <button
            type="button"
            onClick={() => setIsChangePasscodeModalOpen(true)}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/15 hover:text-lic-gold text-white font-sans text-xs font-semibold rounded-xl flex items-center gap-2 transition-all cursor-pointer"
          >
            <Key className="w-3.5 h-3.5" /> Change Passcode
          </button>
          
          <button
            type="button"
            onClick={() => setIsAuthenticated(false)}
            className="px-4 py-2.5 bg-[#3B1F0A] hover:bg-red-600 text-white font-sans text-xs font-semibold rounded-xl flex items-center gap-2 transition-all cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5" /> Lock Terminal
          </button>
        </div>
      </div>

      {/* Client Share Link Quick Panel */}
      <div className="bg-[#FAF6F0] border-2 border-[#E9DFD3] p-5 rounded-3xl flex flex-col gap-5 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-[#3B1F0A]"></div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pl-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#3B1F0A] animate-pulse"></span>
              <h3 className="font-display font-black text-sm text-slate-800 uppercase tracking-wider">Share Client Profile Link</h3>
            </div>
            <p className="text-xs text-slate-600 font-sans font-medium leading-relaxed max-w-2xl">
              Anyone with this link can fill out the form securely. No Google authentication or login is required.
            </p>
          </div>
          
          <div className="bg-white border border-[#E9DFD3] text-sm text-slate-700 px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-sm self-start md:self-auto">
            <span className="text-xs text-slate-400 uppercase tracking-wide font-medium">Hyperlink Preview:</span>
            {clientLink ? (
              <a 
                href={clientLink} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-lic-blue hover:text-blue-800 hover:underline inline-flex items-center gap-1 font-display tracking-tight"
                title={clientLink}
              >
                Margo Advisory Portal <ExternalLink className="w-3.5 h-3.5" />
              </a>
            ) : (
              <span className="text-slate-400 font-mono text-xs">Generating link...</span>
            )}
          </div>
        </div>

        {/* Dynamic Action Buttons Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pl-2">
          
          {/* Button 1: Copy Rich Hyperlink */}
          <button
            type="button"
            onClick={handleCopyRichLink}
            className={`px-4 py-3 text-xs font-bold font-sans rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm border ${
              copiedType === "rich" 
                ? "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700" 
                : "bg-[#3B1F0A] hover:bg-[#2c1607] text-white border-[#3B1F0A]"
            }`}
          >
            {copiedType === "rich" ? (
              <>
                <CheckCircle className="w-4 h-4" /> Copied Rich Hyperlink!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" /> Copy Clickable "Margo Advisory Portal" Link
              </>
            )}
          </button>

          {/* Button 2: Copy Raw URL */}
          <button
            type="button"
            onClick={handleCopyPlainLink}
            className={`px-4 py-3 text-xs font-bold font-sans rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm border ${
              copiedType === "plain" 
                ? "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700" 
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            {copiedType === "plain" ? (
              <>
                <CheckCircle className="w-4 h-4" /> Copied Raw URL!
              </>
            ) : (
              <>
                <Clipboard className="w-4 h-4" /> Copy Raw URL Text
              </>
            )}
          </button>

          {/* Button 3: Copy WhatsApp Message Template */}
          <button
            type="button"
            onClick={handleCopyTemplateLink}
            className={`px-4 py-3 text-xs font-bold font-sans rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm border ${
              copiedType === "template" 
                ? "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700" 
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            {copiedType === "template" ? (
              <>
                <CheckCircle className="w-4 h-4" /> Copied Client Invitation!
              </>
            ) : (
              <>
                <MessageSquare className="w-4 h-4" /> Copy Invitation Template
              </>
            )}
          </button>

        </div>

        {/* Helper instruction tooltip depending on clipboard action */}
        <div className="pl-2 flex items-center gap-1.5 text-[11px] text-slate-400">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>
            {copiedType === "rich" 
              ? "Tip: You can now paste this directly in Outlook, Gmail, Word, WhatsApp, or any rich text editor, and it will paste as a styled clickable hyperlink!"
              : copiedType === "template"
              ? "Tip: Message template is ready to send to clients via WhatsApp, iMessage, or email!"
              : copiedType === "plain"
              ? "Tip: Plain URL copied to clipboard!"
              : "Use the options above to copy the link in your preferred format. The first option copies a neat hyperlinked 'Margo Advisory Portal' text."
            }
          </span>
        </div>
      </div>

      {/* Analytics bento grids */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        
        <div className="bg-[#f4f7f5] border border-[#e3ebe5] p-5 rounded-2xl shadow-sm space-y-2">
          <p className="text-[#5C7265] text-xs font-semibold uppercase tracking-wider">Total Leads</p>
          <div className="flex items-baseline justify-between">
            <span className="font-display font-medium text-3xl text-[#3B4D43]">{totalLeadsCount}</span>
            <Inbox className="w-5 h-5 text-[#7A9986]" />
          </div>
        </div>

        <div className="bg-[#f4f7f5] border border-[#e3ebe5] p-5 rounded-2xl shadow-sm space-y-2">
          <p className="text-[#5C7265] text-xs font-semibold uppercase tracking-wider">New Clients</p>
          <div className="flex items-baseline justify-between">
            <span className="font-display font-medium text-3xl text-[#3B4D43]">{newLeadsCount}</span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#7A9986] animate-pulse"></span>
          </div>
        </div>

        <div className="bg-[#f4f7f5] border border-[#e3ebe5] p-5 rounded-2xl shadow-sm space-y-2">
          <p className="text-[#5C7265] text-xs font-semibold uppercase tracking-wider">In Discussion</p>
          <div className="flex items-baseline justify-between">
            <span className="font-display font-medium text-3xl text-[#3B4D43]">{contactedCount}</span>
            <UserCheck className="w-5 h-5 text-[#7A9986]" />
          </div>
        </div>

        <div className="bg-[#f4f7f5] border border-[#e3ebe5] p-5 rounded-2xl shadow-sm space-y-2">
          <p className="text-[#5C7265] text-xs font-semibold uppercase tracking-wider">Planning</p>
          <div className="flex items-baseline justify-between">
            <span className="font-display font-medium text-3xl text-[#3B4D43]">{inProgressCount}</span>
            <CheckCircle className="w-5 h-5 text-[#7A9986]" />
          </div>
        </div>

        <div className="bg-[#f4f7f5] border border-[#e3ebe5] p-5 rounded-2xl col-span-2 md:col-span-1 shadow-sm space-y-2">
          <p className="text-[#5C7265] text-xs font-semibold uppercase tracking-wider">Avg. Client Age</p>
          <div className="flex items-baseline justify-between">
            <span className="font-display font-medium text-3xl text-[#3B4D43]">{averageAge || "-"} yrs</span>
            <BarChart2 className="w-5 h-5 text-[#7A9986]" />
          </div>
        </div>

      </div>

      {/* Primary Workspace Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Table & Filtering leads Workspace (Col-span 2) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-6">
            
            {/* Table Filters & Toolbar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                <input
                  type="text"
                  placeholder="Search clients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-lic-blue focus:border-transparent bg-slate-50/50"
                />
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200 text-xs">
                  <span className="text-slate-500 pl-2">Filter</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-transparent font-medium text-slate-700 focus:outline-none pr-2 cursor-pointer"
                  >
                    <option value="All">All Leads</option>
                    <option value="New">New Enquiries</option>
                    <option value="Contacted">Contacted</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Structured Tabular Grid (Excel Mimic) */}
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 text-[11px] tracking-wide font-semibold border-b border-slate-100">
                    <th className="py-4 px-4 min-w-[130px]">Date & Time</th>
                    <th className="py-4 px-4 min-w-[190px]">Client / Contact Info</th>
                    <th className="py-4 px-4 min-w-[130px]">Annual Income</th>
                    <th className="py-4 px-4 min-w-[180px]">Services Needed</th>
                    <th className="py-4 px-4 min-w-[160px]">Investment Preference</th>
                    <th className="py-4 px-4 min-w-[150px]">Client Notes</th>
                    <th className="py-4 px-4 min-w-[130px]">Lead Status</th>
                    <th className="py-4 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {isLoading ? (
                    <tr>
                      <td colSpan={8} className="text-center py-10 text-slate-400">
                        <div className="flex flex-col items-center gap-2 justify-center">
                          <svg className="animate-spin h-6 w-6 text-lic-blue" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          <span>Fetching responses from server...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredLeads.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-slate-400">
                        <div className="flex flex-col items-center gap-2">
                          <FileText className="w-10 h-10 text-slate-200" />
                          <p className="font-semibold text-slate-600 text-base">No client profiles yet</p>
                          <p className="text-xs text-slate-400">Share your Financial Profile link to receive your first client submission.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredLeads.map((lead) => {
                      const isDeleted = lead.isDeleted || lead.status === "Deleted";
                      const cleanPhone = (lead.phone || "").replace(/[^0-9]/g, "");
                      const servicesList = (Array.isArray(lead.margoHelp) && lead.margoHelp.length > 0)
                        ? lead.margoHelp
                        : (Array.isArray(lead.existingInvestments) && lead.existingInvestments.length > 0
                          ? lead.existingInvestments
                          : []);
                      const invDisplay = [lead.investmentMode, lead.investmentBudget].filter(Boolean).join(" | ") || lead.otherExistingInvestments;

                      return (
                        <tr key={lead.id} className={`hover:bg-slate-50/50 transition-all ${isDeleted ? "opacity-60 bg-rose-50/20 line-through text-slate-450" : ""}`}>
                          {/* 1. Date & Time */}
                          <td className="py-4 px-4">
                            <div className="text-xs text-slate-700 font-mono flex flex-col">
                              <span className="font-medium">{new Date(lead.timestamp).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                              <span className="text-[10px] text-slate-400">{new Date(lead.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </td>

                          {/* 2. Client / Contact Info */}
                          <td className="py-4 px-4">
                            <div className="flex flex-col">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`font-semibold ${isDeleted ? "text-slate-400 line-through" : "text-lic-dark"}`}>{lead.fullName}</span>
                                {isDeleted && (
                                  <span className="bg-red-100 text-red-700 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider font-sans">Deleted</span>
                                )}
                              </div>
                              <span className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5 font-sans">
                                <span>Age: {lead.age || "N/A"}</span>
                                {lead.dob && (
                                  <>
                                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                    <span className="text-indigo-600 flex items-center gap-1 font-medium">
                                      <Calendar className="w-3 h-3 text-indigo-500 shrink-0" />
                                      {new Date(lead.dob).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                                    </span>
                                  </>
                                )}
                              </span>

                              {(lead.phone || lead.email) && (
                                <div className="flex flex-col gap-1 mt-2 border-t border-slate-100 pt-1.5">
                                  {lead.phone && (
                                    <div className="flex items-center gap-2">
                                      <span className="text-[11px] text-slate-600 flex items-center gap-1 font-sans">
                                        <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                                        <a href={`tel:${lead.phone}`} className="hover:underline hover:text-lic-blue transition-all font-mono font-medium">{lead.phone}</a>
                                      </span>
                                      {cleanPhone && (
                                        <a
                                          href={`https://wa.me/${cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone}?text=${encodeURIComponent(`Hello ${lead.fullName}, thank you for contacting Margo Advisory. We have received your financial inquiry.`)}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-[10px] bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 px-1.5 py-0.5 rounded flex items-center gap-1 font-sans font-semibold transition-all"
                                          title="Open WhatsApp chat"
                                        >
                                          <MessageSquare className="w-2.5 h-2.5" /> WhatsApp
                                        </a>
                                      )}
                                    </div>
                                  )}
                                  {lead.email && (
                                    <span className="text-[11px] text-slate-600 flex items-center gap-1.5 font-sans">
                                      <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                                      <a href={`mailto:${lead.email}`} className="hover:underline hover:text-lic-blue transition-all font-mono font-light truncate max-w-[170px]" title={lead.email}>{lead.email}</a>
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>

                          {/* 3. Annual Income */}
                          <td className="py-4 px-4 font-medium text-slate-700">
                            <span className={`text-xs text-indigo-900 bg-indigo-50 px-2 py-1 font-bold rounded-lg inline-block ${isDeleted ? "opacity-60" : ""}`}>
                              {lead.salaryRange || "Not Specified"}
                            </span>
                          </td>

                          {/* 4. Services Needed */}
                          <td className="py-4 px-4">
                            <div className="flex flex-wrap gap-1 max-w-[180px]">
                              {servicesList.length > 0 ? (
                                servicesList.map((service) => (
                                  <span key={service} className="text-[10px] bg-blue-50 text-blue-700 border border-blue-100/60 px-1.5 py-0.5 rounded font-medium">
                                    {service}
                                  </span>
                                ))
                              ) : (
                                <span className="text-slate-400 text-xs">None specified</span>
                              )}
                            </div>
                          </td>

                          {/* 5. Investment Preference & Budget */}
                          <td className="py-4 px-4">
                            {invDisplay ? (
                              <div className="flex flex-col text-xs text-slate-700">
                                <span className="font-semibold text-slate-800">{lead.investmentMode || "Flexible"}</span>
                                {lead.investmentBudget && (
                                  <span className="text-[11px] text-slate-500 font-mono mt-0.5">{lead.investmentBudget}</span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 text-xs">Not specified</span>
                            )}
                          </td>

                          {/* 6. Client Notes */}
                          <td className="py-4 px-4">
                            <div className="text-xs text-slate-600 max-w-[160px] break-words">
                              {lead.additionalNotes || lead.otherIncome ? (
                                <p className="italic text-slate-700 leading-relaxed font-sans bg-slate-50 p-2 rounded-lg border border-slate-100">
                                  "{lead.additionalNotes || lead.otherIncome}"
                                </p>
                              ) : (
                                <span className="text-slate-400 text-xs">—</span>
                              )}
                            </div>
                          </td>

                          {/* 7. Lead Status */}
                          <td className="py-4 px-4">
                            <select
                              id={`status-dropdown-${lead.id}`}
                              value={lead.status || "New"}
                              onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                              disabled={isDeleted}
                              className={`text-xs font-bold px-2 py-1.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-lik-blue ${
                                lead.status === "Deleted" 
                                  ? "bg-red-100 text-red-700 border border-red-200" 
                                  : lead.status === "Closed" 
                                    ? "bg-slate-200 text-slate-700" 
                                    : lead.status === "In Progress"
                                      ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                      : lead.status === "Contacted"
                                        ? "bg-blue-50 text-blue-700 border border-blue-100"
                                        : "bg-amber-50 text-amber-700 border border-amber-100"
                              } ${isDeleted ? "cursor-not-allowed opacity-75" : "cursor-copy"}`}
                            >
                              {lead.status === "Deleted" && <option value="Deleted">Deleted</option>}
                              <option value="New">New Enquiries</option>
                              <option value="Contacted">Contacted</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Closed">Closed</option>
                            </select>
                          </td>

                          {/* 8. Actions */}
                          <td className="py-4 px-4 text-center">
                            <button
                              type="button"
                              id={`btn-delete-${lead.id}`}
                              onClick={() => handleDeleteLead(lead.id, lead.fullName, isDeleted)}
                              className={`p-2 rounded-lg transition-all cursor-pointer ${
                                isDeleted 
                                  ? "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 bg-emerald-50/40" 
                                  : "text-red-400 hover:text-red-600 hover:bg-red-50"
                              }`}
                              title={isDeleted ? "Restore Lead" : "Delete Lead"}
                            >
                              {isDeleted ? (
                                <RotateCw className="w-4 h-4 animate-hover" />
                              ) : (
                                <Trash2 className="w-4.5 h-4.5" />
                              )}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Real Google Sheets Synchronization Panel (Col-span 1 on desktop) */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-bold text-lg text-lic-dark">
                    Google Sheets Synchronizer
                  </h3>
                  {!hasFirebaseSetup() && (
                    <span className="px-2 py-0.5 text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-md">
                      AI Studio Sandbox Mode
                    </span>
                  )}
                </div>
                <p className="text-slate-500 text-sm">
                  Export client portfolios directly to your personal admin Google Drive on demand.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-sans font-medium">Integration State:</span>
                <span className={`px-2.5 py-0.5 rounded-full font-bold font-mono text-[10px] ${
                  googleToken 
                    ? "bg-green-50 text-green-600 border border-green-200" 
                    : "bg-amber-100 text-amber-700 border border-amber-200"
                }`}>
                  {googleToken 
                    ? "CONNECTED / AUTHORIZED" 
                    : (hasFirebaseSetup() ? "OAUTH CONFIGURED" : "SANDBOX INTERACTION READY")}
                </span>
              </div>

              <div className="space-y-3">
                {!googleUser ? (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-500 font-sans leading-relaxed">
                      Securely authenticate with Google using the button below to authorize appending lead listings into Google Drive spreadsheet files.
                    </p>
                    <button
                      type="button"
                      onClick={handleGoogleLogin}
                      disabled={isLinkingGoogle}
                      className="gsi-material-button w-full shadow-sm cursor-pointer hover:shadow-md transition-all rounded-xl overflow-hidden py-1 border border-slate-200"
                    >
                      <div className="gsi-material-button-state"></div>
                      <div className="gsi-material-button-content-wrapper flex items-center justify-center gap-3">
                        <div className="gsi-material-button-icon">
                          <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: "block", width: "1.25rem", height: "1.25rem" }}>
                            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                            <path fill="none" d="M0 0h48v48H0z"></path>
                          </svg>
                        </div>
                        <span className="gsi-material-button-contents font-sans font-semibold text-xs text-slate-700">Connect Google Sheets</span>
                      </div>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between bg-emerald-50/50 p-3 rounded-xl border border-emerald-100/60 text-xs">
                      <div className="flex items-center gap-2">
                        <img 
                          src={googleUser.photoURL} 
                          alt="Avatar" 
                          className="w-6 h-6 rounded-full border border-emerald-200" 
                          referrerPolicy="no-referrer" 
                        />
                        <div className="flex flex-col text-left">
                          <span className="font-sans font-bold text-slate-700 leading-none">{googleUser.displayName || googleUser.email}</span>
                          <span className="text-[10px] text-slate-500">{googleUser.email}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleGoogleLogout}
                        className="text-red-500 font-bold hover:underline cursor-pointer text-[11px]"
                      >
                        Disconnect
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleSyncToSheets}
                      disabled={isSyncing}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm shadow-emerald-200 cursor-pointer"
                    >
                      {isSyncing ? (
                        <>
                          <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          <span>Synchronizing leads data...</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" /> Export All {leads.length} Leads to Live Google Spreadsheet
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Sync outputs & Live simulated progress indicators */}
            <AnimatePresence>
              {isSyncing && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl space-y-2 text-left overflow-hidden"
                >
                  <div className="flex items-center gap-2">
                    <svg className="animate-spin h-3.5 w-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span className="text-[11px] font-bold font-mono tracking-wide text-emerald-800 uppercase">Synchronizer Pipeline:</span>
                  </div>
                  <p className="text-[11px] text-slate-600 font-mono italic leading-relaxed pl-5">
                    {simulatedProgress}
                  </p>
                </motion.div>
              )}

              {syncStatus.status === "success" && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 15 }}
                  className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl space-y-3"
                >
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-display font-bold text-slate-800 text-sm">Sync Complete</p>
                      <p className="text-xs text-slate-500 leading-relaxed mt-0.5">{syncStatus.message}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {syncStatus.url && !syncStatus.url.startsWith("#") ? (
                      <a
                        href={syncStatus.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-bold hover:underline bg-emerald-100/60 px-3 py-1.5 rounded-lg border border-emerald-200"
                      >
                        Open Live Google Sheet <ArrowUpRight className="w-3.5 h-3.5" />
                      </a>
                    ) : (
                      <a
                        href="#google-sheets-preview"
                        className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-bold hover:underline bg-emerald-100/60 px-3 py-1.5 rounded-lg border border-emerald-200"
                      >
                        Jump to Sandbox Sheet Preview ↓
                      </a>
                    )}
                  </div>
                </motion.div>
              )}

              {syncStatus.status === "error" && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 15 }}
                  className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3"
                >
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-display font-bold text-slate-800 text-sm">Synchronization Failed</p>
                    <p className="text-xs text-red-600 leading-relaxed mt-0.5">{syncStatus.message}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Setup documentation instructions directly for admin */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="font-display font-bold text-lg text-lic-dark">
                Admin Setup Guide
              </h3>
            </div>

            <p className="text-slate-500 text-xs">
              Review instructions on compiling, configuring the Google Sheets API, and hosting steps for production below:
            </p>

            <div className="space-y-2.5 max-h-[190px] overflow-y-auto pr-1">
              
              <details className="group border border-slate-100 rounded-xl bg-slate-50/50 p-2 text-xs">
                <summary className="font-semibold text-slate-705 cursor-pointer list-none flex items-center justify-between">
                  <span>1. How to authorize Google Sheets API?</span>
                  <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-all" />
                </summary>
                <div className="mt-2 text-[11px] text-slate-500 leading-relaxed font-sans space-y-2 pt-1 border-t border-slate-100">
                  <p>
                    A. Request Google Workspace integration scope in the chat window of Google AI Studio. 
                  </p>
                  <p>
                    B. After approving the popup card, AI Studio's automation registers OAuth client certificates in Google Cloud and populates the actual credentials into your <code className="font-mono bg-white px-1 border border-slate-200">firebase-applet-config.json</code> file automatically.
                  </p>
                  <p>
                    C. Click "Connect Google Sheets" on this panel, sign-in with your email, and let the secure frontend establish real spreadsheets!
                  </p>
                </div>
              </details>

              <details className="group border border-slate-105 rounded-xl bg-slate-50/50 p-2 text-xs">
                <summary className="font-semibold text-slate-705 cursor-pointer list-none flex items-center justify-between">
                  <span>2. Firebase / Netlify Deployment steps</span>
                  <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-all" />
                </summary>
                <div className="mt-2 text-[11px] text-slate-500 leading-relaxed font-sans space-y-2 pt-1 border-t border-slate-100">
                  <p><b className="text-slate-700">Deploy to Firebase Hosting:</b></p>
                  <ol className="list-decimal pl-4 space-y-1">
                    <li>Install Firebase CLI: <code className="font-mono bg-white px-1">npm install -g firebase-tools</code></li>
                    <li>Authenticate: <code className="font-mono bg-white px-1">firebase login</code></li>
                    <li>Initialize files: <code className="font-mono bg-white px-1">firebase init hosting</code> choosing the built <code className="font-mono bg-white px-1">dist</code> folder</li>
                    <li>Build and Publish: Run <code className="font-mono">npm run build</code> then <code className="font-mono">firebase deploy</code></li>
                  </ol>
                  <p className="pt-1"><b className="text-slate-700">Deploy to Netlify or Vercel:</b></p>
                  <ol className="list-decimal pl-4 space-y-1">
                    <li>Create site connected to repository (Github)</li>
                    <li>Configure build command: <code className="font-mono bg-white px-1">npm run build</code></li>
                    <li>Configure output directory: <code className="font-mono bg-white px-1">dist</code></li>
                    <li>Publish! Standard serverless builds fetch files safely</li>
                  </ol>
                </div>
              </details>

              <details className="group border border-slate-105 rounded-xl bg-slate-50/50 p-2 text-xs">
                <summary className="font-semibold text-slate-705 cursor-pointer list-none flex items-center justify-between">
                  <span>3. Google Sheets API Activation (Manual App)</span>
                  <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-all" />
                </summary>
                <div className="mt-2 text-[11px] text-slate-500 leading-relaxed font-sans space-y-2 pt-1 border-t border-slate-100">
                  <p>
                    If building a standalone OAuth application outside AI Studio:
                  </p>
                  <ol className="list-decimal pl-4 space-y-1">
                    <li>Go to the <span className="underline cursor-alias font-medium text-blue-600">Google Cloud Console</span>.</li>
                    <li>Select or Create your project, and search for <strong className="font-medium text-slate-700">"Google Sheets API"</strong>, and click <strong className="font-semibold text-slate-700">"Enable"</strong>.</li>
                    <li>Set up the OAuth Consent Screen, specifying <code className="font-mono">.../auth/spreadsheets</code> as an Authorized Scope, and publish as an active app.</li>
                    <li>Establish user sign-in directly in your Google App configurations.</li>
                  </ol>
                </div>
              </details>

            </div>

          </div>

        </div>

        {/* HIGH-FIDELITY INTERACTIVE GOOGLE SHEETS LIVE SPREADSHEET PREVIEWER */}
        {spreadsheetPreviewData && (
          <div 
            id="google-sheets-preview" 
            className="lg:col-span-3 bg-white rounded-3xl shadow-md border border-slate-200 overflow-hidden space-y-0 text-left"
          >
            {/* Google Sheets Header & File Title info */}
            <div className="bg-slate-50 px-5 py-3.5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-600 text-white shadow-sm flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={spreadsheetTitle}
                      onChange={(e) => setSpreadsheetTitle(e.target.value)}
                      className="font-display font-bold text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-transparent px-1 rounded hover:bg-slate-200/60 transition-all max-w-[280px]"
                    />
                    <span className="px-2 py-0.5 bg-emerald-100 text-[9px] font-bold text-emerald-800 rounded-full font-sans uppercase">
                      Active Spreadsheet
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-sans">
                    All modifications instantly cached • Tabular format configured for Margo Advisory agency export
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    const rowText = spreadsheetPreviewData.map(r => r.join("\t")).join("\n");
                    navigator.clipboard.writeText(rowText);
                    alert("Spreadsheet grid copied to clipboard as Excel-compatible tab-separated values!");
                  }}
                  className="px-3 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-600 font-semibold rounded-lg flex items-center gap-1.5 transition-all text-[11px] cursor-pointer"
                >
                  <Clipboard className="w-3.5 h-3.5" /> Copy Tabular Grid
                </button>
              </div>
            </div>

            {/* Google Sheets Menu Mock */}
            <div className="px-5 py-2 border-b border-slate-200 bg-white hidden md:flex items-center gap-6 text-[11px] text-slate-600 font-sans border-t border-slate-200/60 font-medium">
              <span className="cursor-pointer hover:bg-slate-100 px-2 py-1 rounded transition-all">File</span>
              <span className="cursor-pointer hover:bg-slate-100 px-2 py-1 rounded transition-all">Edit</span>
              <span className="cursor-pointer hover:bg-slate-100 px-2 py-1 rounded transition-all">View</span>
              <span className="cursor-pointer hover:bg-slate-100 px-2 py-1 rounded transition-all">Insert</span>
              <span className="cursor-pointer hover:bg-slate-100 px-2 py-1 rounded transition-all">Format</span>
              <span className="cursor-pointer hover:bg-slate-100 px-2 py-1 rounded transition-all">Data</span>
              <span className="cursor-pointer hover:bg-slate-100 px-2 py-1 rounded transition-all">Tools</span>
              <span className="cursor-pointer hover:bg-slate-100 px-2 py-1 rounded transition-all">Extensions</span>
              <span className="cursor-pointer hover:bg-slate-100 px-2 py-1 rounded transition-all">Help</span>
            </div>

            {/* Formula Bar & Dynamic Cell Interactivity */}
            <div className="px-4 py-2 border-b border-slate-200 bg-slate-50 flex items-center gap-3">
              <div className="flex items-center gap-1 rounded bg-white px-2.5 py-1 text-slate-500 font-mono text-[11px] border border-slate-200 shadow-inner select-none font-bold">
                {selectedCell 
                  ? `${["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q"][selectedCell.col]}${selectedCell.row + 1}` 
                  : "A1"}
              </div>
              <div className="text-slate-400 text-xs italic select-none">fx</div>
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Select a cell to view or modify its contents in real-time..."
                  value={selectedCell ? spreadsheetPreviewData[selectedCell.row][selectedCell.col] : ""}
                  onChange={(e) => {
                    if (selectedCell) {
                      const updated = [...spreadsheetPreviewData];
                      updated[selectedCell.row][selectedCell.col] = e.target.value;
                      setSpreadsheetPreviewData(updated);
                    }
                  }}
                  className="w-full bg-white border border-slate-200 rounded-md px-3 py-1 text-[11px] font-mono text-slate-700 shadow-inner focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div className="text-xs text-slate-400 font-sans flex items-center gap-1">
                <Search className="w-3.5 h-3.5" /> Filter Preview:
                <input
                  type="text"
                  placeholder="Search values..."
                  value={spreadsheetSearchQuery}
                  onChange={(e) => setSpreadsheetSearchQuery(e.target.value)}
                  className="w-32 bg-white border border-slate-200 rounded px-1.5 py-0.5 text-[11px] focus:outline-none"
                />
              </div>
            </div>

            {/* Spreadsheet Scrollable Sheet Body */}
            <div className="overflow-x-auto overflow-y-auto max-h-[380px] bg-slate-200/50">
              <table className="border-collapse w-full select-none table-fixed">
                <thead>
                  <tr className="bg-slate-100 text-center text-[10px] tracking-wide font-bold text-slate-500 select-none border-b border-slate-300">
                    <th className="py-1 border border-slate-200 bg-slate-50 text-slate-400 text-center font-mono font-medium pointer-events-none sticky left-0 z-10 w-[45px]"></th>
                    {["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q"].map((letter, idx) => (
                      <th 
                        key={idx} 
                        className={`py-1 border border-slate-300 min-w-[145px] text-center font-mono pointer-events-none ${
                          selectedCell?.col === idx ? "bg-emerald-100/70 text-emerald-700 font-extrabold shadow-sm" : "bg-slate-50"
                        }`}
                      >
                        {letter}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {spreadsheetPreviewData
                    .filter((row, rowIndex) => {
                      if (rowIndex === 0) return true; // Keep headers
                      if (!spreadsheetSearchQuery) return true;
                      return row.some(cellValue => 
                        String(cellValue).toLowerCase().includes(spreadsheetSearchQuery.toLowerCase())
                      );
                    })
                    .map((row, rowIndex) => {
                      // We need to keep a mapping to correct absolute indices for selectedCell referencing
                      const absoluteRowIndex = rowIndex; 
                      return (
                        <tr 
                          key={absoluteRowIndex} 
                          className="border-b border-slate-200"
                        >
                          {/* Row Number Left Header (sticky) */}
                          <td className="py-1 border border-slate-300 bg-slate-50 text-[10px] font-bold font-mono text-slate-400 text-center sticky left-0 z-10 select-none cursor-pointer">
                            {absoluteRowIndex + 1}
                          </td>
                          {row.map((val, colIndex) => {
                            const isHeader = absoluteRowIndex === 0;
                            const isSelected = selectedCell?.row === absoluteRowIndex && selectedCell?.col === colIndex;
                            
                            // Apply custom style Highlights mimicking Google Sheets conditional rules!
                            let cellBgClass = "bg-white";
                            let textClass = "text-slate-700 font-sans text-xs";
                            
                            if (isHeader) {
                              cellBgClass = "bg-slate-50";
                              textClass = "text-slate-800 font-sans text-[11px] font-bold tracking-tight text-center";
                            } else if (val === "New") { // New Status
                              cellBgClass = "bg-amber-50/50";
                              textClass = "text-amber-600 font-medium text-xs text-center";
                            } else if (val === "Contacted") {
                              cellBgClass = "bg-blue-50/50";
                              textClass = "text-blue-600 font-medium text-xs text-center";
                            } else if (val === "In Progress") {
                              cellBgClass = "bg-emerald-50/50";
                              textClass = "text-emerald-600 font-bold text-xs text-center font-semibold";
                            } else if (val === "Closed") {
                              cellBgClass = "bg-slate-100";
                              textClass = "text-slate-500 font-medium text-xs text-center";
                            }

                            return (
                              <td
                                key={colIndex}
                                onClick={() => setSelectedCell({ row: absoluteRowIndex, col: colIndex })}
                                className={`p-2 border border-slate-200 font-sans text-xs truncate transition-all cursor-cell relative outline-none ${cellBgClass} ${textClass} ${
                                  isSelected ? "ring-2 ring-emerald-500 z-10 shadow-sm" : "hover:bg-slate-50/40"
                                }`}
                                title={`${["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q"][colIndex]}${absoluteRowIndex + 1}: ${val}`}
                              >
                                {val}
                                {isSelected && (
                                  <div className="absolute bottom-0 right-0 w-1.5 h-1.5 bg-emerald-600 border border-white cursor-se-resize"></div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            {/* Sheets Sheet Tabs & Explorer Navigation Bottom Bar */}
            <div className="bg-slate-50 px-4 py-1.5 border-t border-slate-200 flex items-center justify-between font-sans text-xs text-slate-500">
              <div className="flex items-center gap-1.5 text-[11px] font-medium border-r border-slate-200 pr-4 block">
                <span className="p-1 rounded hover:bg-slate-200 cursor-pointer text-slate-600 font-bold font-sans text-xs">+</span>
                <span className="p-1 rounded hover:bg-slate-200 cursor-pointer text-slate-500">≡</span>
                <div className="px-3.5 py-1 bg-white border-x border-t border-slate-300 text-emerald-700 font-bold rounded-t-md text-[11px] flex items-center gap-1.5 text-center select-none shadow-sm relative top-[5px] z-10 cursor-pointer">
                  <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full"></span>
                  Sheet1 (Margo Leads)
                </div>
              </div>
              <div className="flex items-center gap-4 text-[10px] text-slate-400">
                <span>Total Columns: A-Q (17)</span>
                <span>Active Leads Sync Count: {spreadsheetPreviewData.length - 1} rows</span>
                <span className="hidden md:inline">Mode: Live Google Workspace Client Simulator</span>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* REUSABLE HIGH-FIDELITY SANDBOX GOOGLE OAUTH POPUP ACCOUNT SELECTOR */}
      <AnimatePresence>
        {isSandboxPopupOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white max-w-sm w-full p-6 rounded-3xl shadow-2xl border border-slate-100 flex flex-col space-y-6 text-left relative"
            >
              {/* Google Brand Logo */}
              <div className="flex flex-col items-center text-center space-y-4 pt-2">
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-10 h-10 select-none">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  <path fill="none" d="M0 0h48v48H0z"></path>
                </svg>

                <div className="space-y-1">
                  <h3 className="font-display font-black text-xl text-slate-800 leading-none">
                    Sign in with Google
                  </h3>
                  <p className="text-[11px] text-slate-400 font-serif leading-tight">
                    to continue to Margo Advisor Console
                  </p>
                </div>
              </div>

              {/* Developer notice */}
              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl leading-relaxed text-[10px] text-indigo-800 leading-relaxed space-y-1">
                <p className="font-bold">Google API Scope Requested:</p>
                <code className="block font-mono bg-white p-1 rounded border border-indigo-200">
                  .../auth/spreadsheets<br/>
                  .../auth/drive.file
                </code>
              </div>

              {/* Accounts list */}
              <div className="space-y-2.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Select administrator account:
                </span>

                <div 
                  onClick={() => {
                    setIsLinkingGoogle(true);
                    setTimeout(() => {
                      setGoogleUser({
                        displayName: "Marianne Gomes",
                        email: "marianne.sharon27@gmail.com",
                        photoURL: "https://lh3.googleusercontent.com/9/acg8ocj1_default-user-portraits-m-s-gomes=s96-c"
                      });
                      setGoogleToken("sandbox-mock-access-token-2026");
                      setIsLinkingGoogle(false);
                      setIsSandboxPopupOpen(false);
                    }, 500);
                  }}
                  className="w-full flex items-center justify-between border border-slate-200 p-3 rounded-2xl hover:bg-slate-100 cursor-pointer transition-all hover:border-emerald-505"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-emerald-700 font-sans font-extrabold text-white flex items-center justify-center shadow-sm text-sm">
                      M
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="font-sans font-bold text-slate-705 leading-none">Marianne Gomes</span>
                      <span className="text-[10px] text-slate-500 font-mono">marianne.sharon27@gmail.com</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                    Advisor
                  </span>
                </div>

                <div 
                  onClick={() => {
                    setIsSandboxPopupOpen(false);
                    alert("Netlify / Standalone flow detected. Add your client configurations in the admin guide FAQs to connect custom production credentials.");
                  }}
                  className="w-full text-center py-2.5 rounded-xl border border-dashed border-slate-300 hover:bg-slate-50 cursor-pointer text-[11px] text-slate-500 font-semibold"
                >
                  Use Another Account (Custom Client)
                </div>
              </div>

              {/* Footer cancel */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100 pt-4">
                <span>Safe Sandbox</span>
                <button
                  type="button"
                  onClick={() => setIsSandboxPopupOpen(false)}
                  className="text-red-500 font-bold hover:underline"
                >
                  Cancel Auth
                </button>
              </div>

            </motion.div>
          </div>
        )}

        {/* Custom Deletion Confirmation Dialog */}
        {deleteConfirmLead && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 shadow-xl max-w-sm w-full border border-slate-100 space-y-6"
            >
              <div className="text-center space-y-2">
                <div className={`w-12 h-12 rounded-full ${deleteConfirmLead.isDeleted ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'} flex items-center justify-center mx-auto mb-4`}>
                  {deleteConfirmLead.isDeleted ? <RotateCw className="w-5 h-5" /> : <Trash2 className="w-5 h-5" />}
                </div>
                <h3 className="font-display font-bold text-lg text-slate-900">
                  {deleteConfirmLead.isDeleted ? "Restore Lead Record?" : "Mark Lead as Deleted?"}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {deleteConfirmLead.isDeleted 
                    ? `Are you sure you want to restore "${deleteConfirmLead.fullName}"? This will return the lead status to active.`
                    : `Are you sure you want to mark lead for "${deleteConfirmLead.fullName}" as Deleted? Its entry will remain in records but will be marked clearly in exports.`
                  }
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmLead(null)}
                  className="flex-1 py-2.5 text-xs text-slate-600 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 font-bold rounded-xl transition-all border border-slate-200 cursor-pointer"
                >
                  No, Keep It
                </button>
                <button
                  type="button"
                  onClick={executeDeleteLead}
                  className={`flex-1 py-2.5 text-xs text-white ${deleteConfirmLead.isDeleted ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'} font-bold rounded-xl transition-all shadow-sm cursor-pointer`}
                >
                  {deleteConfirmLead.isDeleted ? "Yes, Restore" : "Yes, Delete"}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Change Passcode Dialog */}
        {isChangePasscodeModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 shadow-xl max-w-sm w-full border border-slate-100 space-y-4"
            >
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-blue-50 text-lic-blue flex items-center justify-center mx-auto mb-2">
                  <Key className="w-5 h-5" />
                </div>
                <h3 className="font-display font-bold text-lg text-slate-900">
                  Change Access Passcode
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Update the passcode used to log in and authorize administrative requests.
                </p>
              </div>

              <form onSubmit={handleChangePasscodeSubmit} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Current Passcode
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={currentPasscode}
                    onChange={(e) => setCurrentPasscode(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50 font-mono focus:outline-none focus:ring-2 focus:ring-lic-blue"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    New Passcode
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={newPasscode}
                    onChange={(e) => setNewPasscode(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50 font-mono focus:outline-none focus:ring-2 focus:ring-lic-blue"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Confirm New Passcode
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={confirmNewPasscode}
                    onChange={(e) => setConfirmNewPasscode(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50 font-mono focus:outline-none focus:ring-2 focus:ring-lic-blue"
                    required
                  />
                </div>

                {changePasscodeError && (
                  <div className="p-2.5 bg-red-50 border border-red-100 text-red-700 text-xs rounded-xl flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{changePasscodeError}</span>
                  </div>
                )}

                {changePasscodeSuccess && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs rounded-xl flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{changePasscodeSuccess}</span>
                  </div>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsChangePasscodeModalOpen(false);
                      setChangePasscodeError("");
                      setChangePasscodeSuccess("");
                    }}
                    className="flex-1 py-2 text-xs text-slate-600 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 font-bold rounded-xl transition-all border border-slate-200 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingChangePasscode}
                    className="flex-1 py-2 text-xs text-white bg-lic-blue hover:bg-blue-800 font-bold rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingChangePasscode ? "Saving..." : "Save Passcode"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
