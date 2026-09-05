import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { fileURLToPath } from "url";

// Safe ES Module setup for __dirname and __filename in both tsx and bundled CJS
let myFilename = "";
try {
  if (typeof import.meta !== "undefined" && import.meta.url) {
    myFilename = fileURLToPath(import.meta.url);
  } else {
    myFilename = __filename;
  }
} catch (e) {
  myFilename = typeof __filename !== "undefined" ? __filename : "";
}

const myDirname = typeof __dirname !== "undefined" ? __dirname : path.dirname(myFilename);

async function startServer() {
  const app = express();
  const PORT = 3000;
  
  app.use(express.json());

  const LEADS_FILE = path.join(process.cwd(), "leads.json");
  const PASSCODE_FILE = path.join(process.cwd(), "passcode.json");

  // Helper to read leads
  function readLeads() {
    if (!fs.existsSync(LEADS_FILE)) {
      return [];
    }
    try {
      const data = fs.readFileSync(LEADS_FILE, "utf-8");
      return JSON.parse(data);
    } catch (e) {
      return [];
    }
  }

  // Helper to write leads
  function writeLeads(leads: any[]) {
    fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2), "utf-8");
  }

  // Helper to read passcode locally
  function readLocalPasscode() {
    if (!fs.existsSync(PASSCODE_FILE)) {
      return "amberemily";
    }
    try {
      const data = fs.readFileSync(PASSCODE_FILE, "utf-8");
      const parsed = JSON.parse(data);
      return parsed.passcode || "amberemily";
    } catch (e) {
      return "amberemily";
    }
  }

  // Helper to write passcode locally
  function writeLocalPasscode(newPasscode: string) {
    fs.writeFileSync(PASSCODE_FILE, JSON.stringify({ passcode: newPasscode }, null, 2), "utf-8");
  }

  // Fetch passcode from Google Sheets (Settings row / key: advisor_password)
  async function fetchPasscodeFromGoogleSheets(): Promise<string | null> {
    const SHEET_ID = "1SZkmVQ3Ms5at-VmNk0za6d8_nHI9fVOHFu00MKlFcWE";
    const API_KEY = "AIzaSyC2UKbBLxN-05LqaOEFQH1y_OrFEbxFHJc";
    // We try Settings first, then fallback sheets in case they appended there
    const rangesToTry = ["Settings!A1:C100", "lic!A1:T100", "Sheet1!A1:T100"];
    
    for (const range of rangesToTry) {
      try {
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(range)}?key=${API_KEY}`;
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json() as any;
          if (data && data.values) {
            // Search from bottom to top to get the latest updated value
            for (let i = data.values.length - 1; i >= 0; i--) {
              const row = data.values[i];
              if (row && row[0] === "advisor_password") {
                if (row[1] && row[1].trim()) {
                  console.log("Found latest advisor_password in Google Sheet:", row[1]);
                  return row[1].trim();
                }
              }
            }
          }
        }
      } catch (err) {
        console.error(`Error reading passcode from range ${range}:`, err);
      }
    }
    return null;
  }

  // Save passcode to Google Sheets
  async function savePasscodeToGoogleSheets(newPasscode: string): Promise<boolean> {
    const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyj_zsMhptZq5Htsaqza9E_Xn5K_2eoFponIm0IL5Vz2o7HMHv6ay8L9ogd7p7HiwyG/exec";
    if (!APPS_SCRIPT_URL) return false;

    try {
      console.log("Saving passcode to Google Sheet settings...");
      const payload = {
        sheetName: "Settings",
        values: [
          ["advisor_password", newPasscode, new Date().toISOString()]
        ]
      };

      const response = await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const resJson = await response.json() as any;
        if (resJson && resJson.result === "success") {
          console.log("Successfully saved passcode to Google Sheet settings!");
          return true;
        }
      }
    } catch (err) {
      console.error("Failed saving passcode to Google Sheets:", err);
    }
    return false;
  }

  // Get latest passcode (sync with Google Sheets, fallback to local cache)
  async function getLatestPasscode(): Promise<string> {
    const sheetPasscode = await fetchPasscodeFromGoogleSheets();
    if (sheetPasscode) {
      writeLocalPasscode(sheetPasscode);
      return sheetPasscode;
    }
    return readLocalPasscode();
  }

  // Fetch leads from Google Sheets (Centralized Database)
  async function fetchLeadsFromGoogleSheets(): Promise<any[] | null> {
    const SHEET_ID = "1SZkmVQ3Ms5at-VmNk0za6d8_nHI9fVOHFu00MKlFcWE";

    try {
      const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json`;
      const response = await fetch(url);
      if (response.ok) {
        const text = await response.text();
        const jsonStr = text.substring(text.indexOf("{"), text.lastIndexOf("}") + 1);
        const data = JSON.parse(jsonStr);

        if (data?.table?.rows && data.table.rows.length > 0) {
          console.log(`Successfully fetched ${data.table.rows.length} rows from Google Sheets.`);
          const parsedLeads = data.table.rows.map((r: any) => {
            const row = r.c.map((cell: any) => cell ? (cell.f || cell.v) : "");
            if (!row || row.length < 3 || !row[2]) return null;

            // Detect format:
            // If row[13], row[15], or row[19] has data, it was saved under the temporary 20-column shifted layout
            const isShifted20 = Boolean(row[13] || row[15] || row[16] || row[19]);

            const timestamp = row[0] || new Date().toISOString();
            const id = row[1] || Math.random().toString(36).substring(2, 11);
            const fullName = row[2] || "";
            const dob = row[3] || "";
            const age = row[4] ? Number(row[4]) : 0;
            const phone = row[5] ? String(row[5]) : "";
            const email = row[6] || "";

            let salaryRange = "";
            let margoHelp: string[] = [];
            let investmentPreference = "";
            let additionalNotes = "";
            let status = "New";

            if (isShifted20) {
              salaryRange = row[13] || row[7] || "Not Specified";
              const helpStr = row[15] || row[8] || "";
              margoHelp = helpStr ? helpStr.split(",").map((s: string) => s.trim()).filter(Boolean) : [];
              investmentPreference = row[16] || row[9] || "";
              additionalNotes = row[14] || "";
              status = row[19] || row[12] || "New";
            } else {
              // Standard format:
              // Legacy 13-column rows had Tax Assessee at row[10], Notes at row[11], Status at row[12]
              // Clean 12-column rows have Notes at row[10], Status at row[11]
              salaryRange = row[7] || "Not Specified";
              const helpStr = row[8] || "";
              margoHelp = helpStr ? helpStr.split(",").map((s: string) => s.trim()).filter(Boolean) : [];
              investmentPreference = row[9] || "";
              
              if (row.length >= 13 && (row[10] === "Yes" || row[10] === "No" || row[10] === "N/A")) {
                additionalNotes = row[11] || "";
                status = row[12] || "New";
              } else {
                additionalNotes = row[10] || "";
                status = row[11] || "New";
              }
            }

            return {
              timestamp,
              id,
              fullName,
              dob,
              age,
              phone,
              email,
              salaryRange,
              margoHelp,
              existingInvestments: margoHelp,
              investmentPreference,
              investmentBudget: investmentPreference,
              otherExistingInvestments: investmentPreference,
              additionalNotes,
              status: status === "Deleted" ? "Deleted" : status,
              isDeleted: status === "Deleted"
            };
          }).filter(Boolean);

          // Google Sheets returns oldest first, so we reverse to newest-first
          parsedLeads.reverse();
          return parsedLeads;
        }
      }
    } catch (err) {
      console.error("Error reading leads from Google Sheets:", err);
    }
    return null;
  }

  // Update lead status/deletion centrally in Google Sheets
  async function updateLeadInGoogleSheets(leadId: string, updates: { status?: string; isDeleted?: boolean }): Promise<boolean> {
    const SHEET_ID = "1SZkmVQ3Ms5at-VmNk0za6d8_nHI9fVOHFu00MKlFcWE";
    const API_KEY = "AIzaSyC2UKbBLxN-05LqaOEFQH1y_OrFEbxFHJc";
    const rangesToTry = ["lic!A1:M2000", "Sheet1!A1:M2000", "A1:M2000"];
    
    for (const range of rangesToTry) {
      try {
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(range)}?key=${API_KEY}`;
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json() as any;
          if (data && data.values) {
            const rowIndex = data.values.findIndex((row: any[]) => row && row[1] === leadId);
            if (rowIndex !== -1) {
              const matchedRow = data.values[rowIndex];
              const rowNumber = rowIndex + 1;
              const sheetName = range.split("!")[0];
              // If row has 13 or more columns (legacy rows with Tax Assessee), status is in Col M (13th).
              // For new 12-column rows, status is in Col L (12th).
              const statusCol = (matchedRow && matchedRow.length >= 13) ? "M" : "L";
              const cellRange = `${sheetName}!${statusCol}${rowNumber}`;
              const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(cellRange)}?valueInputOption=USER_ENTERED&key=${API_KEY}`;
              
              let newStatus = updates.status;
              if (updates.isDeleted) {
                newStatus = "Deleted";
              }

              if (newStatus) {
                const updateRes = await fetch(updateUrl, {
                  method: "PUT",
                  headers: {
                    "Content-Type": "application/json"
                  },
                  body: JSON.stringify({
                    values: [[newStatus]]
                  })
                });

                if (updateRes.ok) {
                  console.log(`Successfully updated Google Sheets cell ${cellRange} to: ${newStatus}`);
                  return true;
                } else {
                  console.warn(`Failed to write to Google Sheets cell ${cellRange}:`, await updateRes.text());
                }
              }
            }
          }
        }
      } catch (err) {
        console.error(`Error updating lead in range ${range}:`, err);
      }
    }
    return false;
  }

  // API Route - Submit form
  app.post("/api/leads", async (req, res) => {
    try {
      const lead = req.body;
      if (!lead.fullName || !lead.dob || !lead.phone || !lead.email) {
        return res.status(400).json({ error: "Name, Date of Birth, Phone Number, and Email ID are required fields." });
      }

      // Ensure age is calculated from DOB if missing
      let computedAge = lead.age;
      if (!computedAge && lead.dob) {
        const birthDate = new Date(lead.dob);
        const today = new Date();
        let ageNum = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          ageNum--;
        }
        computedAge = (!isNaN(ageNum) && ageNum >= 0) ? String(ageNum) : "";
      }

      const leads = readLeads();
      const newLead = {
        id: Math.random().toString(36).substring(2, 11), // custom id fallback inside CJS/ESM
        ...lead,
        age: computedAge || lead.age || "N/A",
        timestamp: new Date().toISOString(),
        status: "New" // New, Contacted, In Progress, Closed
      };
      
      leads.unshift(newLead); // newest first
      writeLeads(leads);

      // Google Sheets Integration
      const SHEET_ID = "1SZkmVQ3Ms5at-VmNk0za6d8_nHI9fVOHFu00MKlFcWE";
      const API_KEY = "AIzaSyC2UKbBLxN-05LqaOEFQH1y_OrFEbxFHJc";
      const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyj_zsMhptZq5Htsaqza9E_Xn5K_2eoFponIm0IL5Vz2o7HMHv6ay8L9ogd7p7HiwyG/exec";

      try {
        const margoHelpStr = Array.isArray(newLead.margoHelp) ? newLead.margoHelp.join(", ") : "";
        const invPrefStr = [newLead.investmentMode, newLead.investmentBudget].filter(Boolean).join(" | ");

        const schemaValue = [
          newLead.timestamp,
          newLead.id,
          newLead.fullName,
          newLead.dob,
          newLead.age,
          newLead.phone,
          newLead.email,
          newLead.salaryRange || "Not Specified",
          margoHelpStr || (Array.isArray(newLead.existingInvestments) ? newLead.existingInvestments.join(", ") : ""),
          invPrefStr || newLead.otherExistingInvestments || "",
          newLead.additionalNotes || newLead.otherIncome || "",
          newLead.status || "New"
        ];

        let success = false;
        let lastError = "";

        // If the user configures a Google Apps Script Web App, use it first!
        // It compiles and appends instantly to Google Sheets without OAuth constraints.
        if (APPS_SCRIPT_URL) {
          try {
            console.log("Attempting to append form submission via Google Apps Script Web App...");
            const appsScriptResponse = await fetch(APPS_SCRIPT_URL, {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                values: [schemaValue]
              })
            });

            if (appsScriptResponse.ok) {
              const resJson = await appsScriptResponse.json() as any;
              if (resJson && resJson.result === "success") {
                console.log("Successfully appended row to Google Sheet via Apps Script Web App!");
                success = true;
              } else {
                lastError = resJson?.error || "Apps Script returned an error status";
                console.warn("Apps Script returned error:", lastError);
              }
            } else {
              lastError = await appsScriptResponse.text();
              console.warn("Apps Script Web App request failed with status:", appsScriptResponse.status);
            }
          } catch (appsScriptErr: any) {
            lastError = appsScriptErr.message || String(appsScriptErr);
            console.error("Failed appending via Google Apps Script Web App:", appsScriptErr);
          }
        }

        // Fallback to standard Google Sheets API (which might fail with API key write restriction)
        if (!success) {
          const rangesToTry = ["lic!A1", "Sheet1!A1", "A1"];
          for (const range of rangesToTry) {
            try {
              const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(range)}:append?valueInputOption=RAW&key=${API_KEY}`;
              
              const sheetsResponse = await fetch(appendUrl, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({
                  values: [schemaValue]
                })
              });

              if (sheetsResponse.ok) {
                console.log(`Successfully appended row to Google Sheet using range: ${range}`);
                success = true;
                break;
              } else {
                const errMsg = await sheetsResponse.text();
                lastError = errMsg;
                console.warn(`Appending with range "${range}" returned status ${sheetsResponse.status}: ${errMsg}`);
              }
            } catch (err: any) {
              lastError = err.message || String(err);
              console.error(`Fetch error trying range "${range}":`, err);
            }
          }
        }

        if (!success) {
          console.error("All Google Sheets sync strategies failed. Last error:", lastError);
        }
      } catch (sheetErr) {
        console.error("Failed to append row to Google Sheet:", sheetErr);
      }

      res.status(201).json({ success: true, lead: newLead });
    } catch (error: any) {
      console.error("Error submitting lead:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // API Route - Verify Passcode
  app.post("/api/auth/verify", async (req, res) => {
    try {
      const { passcode } = req.body;
      const correctPasscode = await getLatestPasscode();
      if (passcode === correctPasscode) {
        return res.json({ success: true });
      }
      return res.status(401).json({ error: "Incorrect password." });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // API Route - Change Passcode
  app.post("/api/auth/change-passcode", async (req, res) => {
    try {
      const { currentPasscode, newPasscode } = req.body;
      const correctPasscode = await getLatestPasscode();
      
      if (currentPasscode !== correctPasscode) {
        return res.status(401).json({ error: "Incorrect current passcode." });
      }
      
      if (!newPasscode || newPasscode.trim().length < 3) {
        return res.status(400).json({ error: "New passcode must be at least 3 characters long." });
      }
      
      const newPasscodeTrimmed = newPasscode.trim();

      // Update backend (Google Sheets) first
      const isSynced = await savePasscodeToGoogleSheets(newPasscodeTrimmed);
      if (!isSynced) {
        return res.status(500).json({ 
          error: "Failed to update passcode in Google Sheets settings. Old passcode remains active." 
        });
      }

      // Sync local cache
      writeLocalPasscode(newPasscodeTrimmed);
      res.json({ success: true, message: "Passcode updated successfully in Google Sheets and local cache." });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // API Route - Get all leads
  app.get("/api/leads", async (req, res) => {
    try {
      const { passcode } = req.query;
      const correctPasscode = await getLatestPasscode();
      
      if (passcode !== correctPasscode) {
        return res.status(401).json({ error: "Unauthorized. Invalid advisor passcode." });
      }

      // 1. Fetch live from Google Sheets
      const sheetLeads = await fetchLeadsFromGoogleSheets();
      const localLeads = readLeads();

      if (sheetLeads && sheetLeads.length > 0) {
        // Create a map of local leads to preserve status and deletion edits
        const localLeadsMap = new Map<string, any>(localLeads.map((l: any) => [l.id, l]));

        // Merge sheet leads with local states (preserving advisor changes made on this instance)
        const mergedLeads = sheetLeads.map((sheetLead: any) => {
          const localLead = localLeadsMap.get(sheetLead.id);
          if (localLead) {
            return {
              ...sheetLead,
              status: localLead.status !== undefined ? localLead.status : sheetLead.status,
              isDeleted: localLead.isDeleted !== undefined ? localLead.isDeleted : sheetLead.isDeleted
            };
          }
          return sheetLead;
        });

        // Also add any local leads that might not have synced to Sheets yet
        const sheetLeadIds = new Set(sheetLeads.map((s: any) => s.id));
        const onlyLocalLeads = localLeads.filter((l: any) => !sheetLeadIds.has(l.id));

        const finalLeads = [...onlyLocalLeads, ...mergedLeads];

        // Sort newest first
        finalLeads.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        // Update local backup cache
        writeLeads(finalLeads);
        return res.json(finalLeads);
      }

      // 2. Fallback to local leads.json if Google Sheets fetch fails or is empty
      res.json(localLeads);
    } catch (error) {
      console.error("Error in GET /api/leads:", error);
      try {
        const leads = readLeads();
        res.json(leads);
      } catch (e) {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  });

  // API Route - Update lead status
  app.patch("/api/leads/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { status, passcode } = req.body;
      const correctPasscode = await getLatestPasscode();
      
      if (passcode !== correctPasscode) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const leads = readLeads();
      const index = leads.findIndex((l: any) => l.id === id);
      if (index === -1) {
        return res.status(404).json({ error: "Lead not found" });
      }

      leads[index].status = status;
      writeLeads(leads);

      // Attempt to sync status update to central Google Sheet in background
      updateLeadInGoogleSheets(id, { status }).catch(err => {
        console.error("Background Google Sheet status update failed:", err);
      });

      res.json({ success: true, lead: leads[index] });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // API Route - Delete lead
  app.post("/api/leads/delete/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { passcode } = req.body;
      const correctPasscode = await getLatestPasscode();
      
      if (passcode !== correctPasscode) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const leads = readLeads();
      const index = leads.findIndex((l: any) => l.id === id);
      
      if (index === -1) {
        return res.status(404).json({ error: "Lead not found" });
      }

      // Toggle state
      const isCurrentlyDeleted = leads[index].isDeleted || leads[index].status === "Deleted";
      const nextIsDeleted = !isCurrentlyDeleted;
      leads[index].isDeleted = nextIsDeleted;
      leads[index].status = nextIsDeleted ? "Deleted" : "New";

      writeLeads(leads);

      // Attempt to sync deletion update to central Google Sheet in background
      updateLeadInGoogleSheets(id, { status: leads[index].status, isDeleted: nextIsDeleted }).catch(err => {
        console.error("Background Google Sheet deletion update failed:", err);
      });

      res.json({ success: true, lead: leads[index] });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Vite Integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server starting on http://localhost:${PORT}`);
  });
}

startServer();
