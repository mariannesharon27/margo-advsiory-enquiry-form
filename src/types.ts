export interface LeadFormData {
  // Required Contact & Personal Info
  fullName: string;
  phone: string;
  email: string;
  dob: string;
  age: string; // Calculated automatically from DOB

  // Financial Profile
  salaryRange: "Below ₹5 lakh" | "₹5–10 lakh" | "₹10–20 lakh" | "₹20–50 lakh" | "Above ₹50 lakh" | "Prefer not to say" | string;
  investmentMode: "Monthly" | "Lump Sum" | "Both" | "Not sure yet" | "";
  investmentBudget: string;

  // Services & Information
  margoHelp: string[]; // Selected services
  additionalNotes: string; // Optional notes

  // Legacy / Optional fields for backwards compatibility with server/admin
  maritalStatus?: string;
  familyMembers?: string;
  fatherName?: string;
  motherName?: string;
  parentAges?: string;
  dependents?: string;
  otherIncome?: string;
  existingInvestments?: string[];
  otherExistingInvestments?: string;
}

export interface LeadSubmission extends LeadFormData {
  id: string;
  timestamp: string;
  status: "New" | "Contacted" | "In Progress" | "Closed" | "Deleted";
  isDeleted?: boolean;
}

