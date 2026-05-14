export interface DealCategoryDefinition {
  id: string;
  title: string;
  description: string;
}

export const DEAL_CATEGORIES: DealCategoryDefinition[] = [
  { id: "A", title: "Historical Financials", description: "Audited statements, management accounts, tax & cashflow" },
  { id: "B", title: "Forecasting & Financial Models", description: "3–5 year forecasts, assumptions & sensitivity" },
  { id: "C", title: "Legal, Corporate & Compliance", description: "MOI, shareholders, CIPC, governance" },
  { id: "D", title: "Assets", description: "Owned assets, leases, valuations & maintenance" },
  { id: "E", title: "Borrowings & Liabilities", description: "Loans, facilities, guarantees & covenants" },
  { id: "F", title: "Material Contracts", description: "Customer, supplier, JV & distribution contracts" },
  { id: "G", title: "Employees", description: "Contracts, salaries, benefits & HR policies" },
  { id: "H", title: "Intellectual Property", description: "Trademarks, patents, licenses & domains" },
  { id: "I", title: "Insurance", description: "Policies, schedules, claims & broker info" },
  { id: "J", title: "Operations & Processes", description: "SOPs, quality, ISO & technology systems" },
  { id: "K", title: "Customer & Revenue", description: "Concentration, retention & sales pipeline" },
  { id: "L", title: "Litigation & Disputes", description: "Ongoing litigation, threats & settlements" },
  { id: "M", title: "Tax & Statutory", description: "Income tax, VAT, PAYE & BEE compliance" },
  { id: "N", title: "Environmental & Social", description: "EIAs, permits, sustainability & CSR" },
];
