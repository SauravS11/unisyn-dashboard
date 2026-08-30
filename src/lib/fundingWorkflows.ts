// Incubators & Accelerators — funding programme configuration.
// This module is completely separate from the M&A / Deals workflow.

export type FieldType = "text" | "textarea" | "number" | "currency" | "date" | "select";

export interface FieldConfig {
  key: string;
  label: string;
  type: FieldType;
  options?: string[];
  placeholder?: string;
}

export const APPLICANT_TYPES = [
  "Startup",
  "SME",
  "Sole Proprietor",
  "Registered Company",
  "Cooperative",
  "Non-Profit",
  "Franchise",
  "Property Developer",
  "Other",
];

export const BUSINESS_STAGES = [
  "Idea / Concept Stage",
  "Pre-registration",
  "Registered but Pre-revenue",
  "MVP / Prototype",
  "Early Revenue",
  "Growth Stage",
  "Established SME",
  "Scaling Business",
  "Export-ready",
  "Procurement-ready",
  "Investment-ready",
];

export const CONTACT_ROLES = [
  "Founder",
  "Co-Founder",
  "CEO",
  "Managing Director",
  "Director",
  "Owner",
  "Finance Manager",
  "Operations Manager",
  "Programme Contact",
  "Other",
];

export const INDUSTRIES = [
  "Agriculture & Agri-processing",
  "Construction & Built Environment",
  "Property & Real Estate",
  "Manufacturing",
  "Logistics & Transport",
  "Retail & Wholesale",
  "Technology & Software",
  "Financial Services",
  "Professional Services",
  "Healthcare & Wellness",
  "Education & Training",
  "Energy & Utilities",
  "Tourism & Hospitality",
  "Mining & Resources",
  "Creative & Media",
  "Beauty, Wellness & Personal Care",
  "Textiles, Clothing & Footwear",
  "Green Economy / Recycling",
  "Other",
];

export const COMMON_FIELDS: FieldConfig[] = [
  { key: "business_name", label: "Business / Startup Name", type: "text" },
  { key: "registration_number", label: "Registration Number", type: "text" },
  { key: "applicant_type", label: "Applicant Type", type: "select", options: APPLICANT_TYPES },
  { key: "industry", label: "Industry / Sector", type: "select", options: INDUSTRIES },
  { key: "business_stage", label: "Business Stage", type: "select", options: BUSINESS_STAGES },
  { key: "country", label: "Country", type: "text" },
  { key: "province", label: "Province / Region", type: "text" },
  { key: "city_region", label: "City / Town", type: "text" },
  { key: "contact_name", label: "Primary Contact Name", type: "text" },
  { key: "contact_role", label: "Primary Contact Role", type: "select", options: CONTACT_ROLES },
  { key: "contact_email", label: "Primary Contact Email", type: "text" },
  { key: "contact_phone", label: "Primary Contact Number", type: "text" },
  { key: "website", label: "Website / Social Handle", type: "text" },
  { key: "programme_notes", label: "Programme Manager Notes", type: "textarea" },
];

const f = (label: string, type: FieldType = "text", options?: string[]): FieldConfig => ({
  key: label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""),
  label,
  type,
  options,
});

const YESNO = ["Yes", "No"];

export const WORKFLOW_FIELDS: Record<string, FieldConfig[]> = {
  business_finance: [
    f("Years in Operation", "number"),
    f("Team Size", "number"),
    f("Annual Revenue Range"),
    f("Monthly Turnover Estimate", "currency"),
    f("Profitability Status", "select", ["Profitable", "Break-even", "Loss-making", "Pre-revenue"]),
    f("Funding Amount Requested", "currency"),
    f("Use of Funds", "textarea"),
    f("Funding Timeline"),
    f("Own Contribution Available", "currency"),
    f("Current Debt Obligations", "textarea"),
    f("Main Revenue Model"),
    f("Growth Objective", "textarea"),
    f("Main Products / Services", "textarea"),
    f("Key Customers / Customer Segment", "textarea"),
  ],
  property_finance: [
    f("Property Type"),
    f("Property Location"),
    f("Property Use"),
    f("Purchase Price / Development Value", "currency"),
    f("Funding Amount Requested", "currency"),
    f("Deposit / Own Contribution Available", "currency"),
    f("Ownership Status"),
    f("Property Transaction Stage"),
    f("Rental Income Expected", "select", YESNO),
    f("Estimated Monthly Rental Income", "currency"),
    f("Zoning Status"),
    f("Municipal Account Up to Date", "select", YESNO),
    f("Security / Collateral Notes", "textarea"),
  ],
  property_joint_venture_fund: [
    f("Project Name"),
    f("Applicant / Sponsor Name"),
    f("Development Location"),
    f("Project Type"),
    f("Development Stage"),
    f("Estimated Project Value", "currency"),
    f("Funding Amount Requested", "currency"),
    f("Expected Project Timeline"),
    f("Land Ownership Status"),
    f("JV Partner Status"),
    f("JV Partner Details", "textarea"),
    f("Proposed JV Structure", "textarea"),
    f("Project Readiness Notes", "textarea"),
  ],
  asset_finance: [
    f("Asset Type"),
    f("Asset Description", "textarea"),
    f("Asset Supplier"),
    f("Asset Value", "currency"),
    f("Asset Condition", "select", ["New", "Used", "Refurbished"]),
    f("Supplier Status"),
    f("Funding Amount Requested", "currency"),
    f("Deposit Available", "currency"),
    f("Repayment Period Requested"),
    f("Purpose of Asset", "textarea"),
    f("How the Asset Supports Revenue", "textarea"),
    f("Current Monthly Revenue", "currency"),
    f("Operational Need / Urgency"),
  ],
  short_term_finance: [
    f("Funding Amount Requested", "currency"),
    f("Funding Purpose", "textarea"),
    f("Urgency Level", "select", ["Low", "Medium", "High", "Critical"]),
    f("Requested Term"),
    f("Expected Repayment Source"),
    f("Expected Repayment Date", "date"),
    f("Linked to Contract / Order / Invoice", "select", YESNO),
    f("Contract / Order Value", "currency"),
    f("Customer / Debtor Name"),
    f("Customer / Debtor Status"),
    f("Current Monthly Revenue", "currency"),
    f("Cash Flow Pressure Level", "select", ["Low", "Medium", "High"]),
    f("Cash Flow Pressure Explanation", "textarea"),
  ],
  basadi_women_growth_fund: [
    f("Women-Owned Business Confirmation", "select", YESNO),
    f("Female Founder / Director Name"),
    f("Women Ownership Percentage", "number"),
    f("Ownership Structure Summary", "textarea"),
    f("Years in Operation", "number"),
    f("Team Size", "number"),
    f("Funding Amount Requested", "currency"),
    f("Growth Funding Purpose", "textarea"),
    f("Expansion Plan", "textarea"),
    f("Jobs Supported / Created", "number"),
    f("Communities Served / Impact Area", "textarea"),
    f("B-BBEE Status"),
    f("Tax Clearance Available", "select", YESNO),
    f("Growth Potential", "textarea"),
  ],
  sme_youth_jobs_fund: [
    f("Current Employee Count", "number"),
    f("Current Youth Employee Count", "number"),
    f("Youth Jobs to Be Created", "number"),
    f("Job Roles to Be Created", "textarea"),
    f("Job Type", "select", ["Permanent", "Fixed-term", "Learnership", "Internship", "Apprenticeship"]),
    f("Hiring Timeline"),
    f("Training Support Needed", "select", YESNO),
    f("Skills Development Plan Status"),
    f("Skills Development Plan", "textarea"),
    f("Funding Amount Requested", "currency"),
    f("Funding Purpose", "textarea"),
    f("Implementation Timeline"),
    f("Payroll System in Place", "select", YESNO),
    f("EMP201 Returns Available", "select", YESNO),
    f("Employment Contracts Available", "select", YESNO),
    f("Business Growth Link to Job Creation", "textarea"),
  ],
};

export const APPLICATION_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  request_sent: "Request Sent",
  in_progress: "Application in Progress",
  submitted_for_review: "Submitted for Review",
  clarification_requested: "Clarification Requested",
  in_review: "Application in Review",
  approved: "Approved",
};

export const SECTION_STATUS_LABELS: Record<string, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  needs_attention: "Needs Attention",
  submitted: "Submitted",
  in_review: "In Review",
  completed: "Completed",
  approved: "Approved",
};
