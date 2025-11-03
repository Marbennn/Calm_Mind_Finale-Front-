import api from "./client";

// ... existing code above ...

export async function fetchStudentsByDepartment() {
  const { data } = await api.get("/admin/students/by-department");
  return data;
}