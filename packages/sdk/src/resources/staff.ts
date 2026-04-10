import type { StaffMember } from "@yt-harness/shared";
import type { HttpClient } from "../http/client.js";

export class StaffResource {
  constructor(private http: HttpClient) {}

  async list(): Promise<StaffMember[]> {
    return this.http.get<StaffMember[]>("/api/staff");
  }

  async upsert(data: Partial<StaffMember>): Promise<StaffMember> {
    return this.http.post<StaffMember>("/api/staff", data);
  }

  async delete(id: number): Promise<void> {
    return this.http.delete(`/api/staff/${id}`);
  }
}
