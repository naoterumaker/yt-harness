export type StaffRole = "admin" | "editor" | "viewer";

export interface StaffMember {
  id: number;
  email: string;
  name: string;
  role: StaffRole;
  created_at: string;
  updated_at: string;
}
