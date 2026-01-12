import { supabase } from "./supabase.js";

// Enforce authentication
const { data: { session } } = await supabase.auth.getSession();

if (!session) {
  window.location.href = "index.html";
  throw new Error("Not authenticated");
}

// Show user info
document.getElementById("user-info").textContent =
  `Logged in as: ${session.user.email}`;

// Fetch role from user_roles
const { data: roles, error } = await supabase
  .from("user_roles")
  .select("role")
  .eq("user_id", session.user.id);

if (error || !roles.length) {
  document.getElementById("role-info").textContent = "Role: unknown";
} else {
  document.getElementById("role-info").textContent =
    `Role: ${roles.map(r => r.role).join(", ")}`;
}

// Logout
document.getElementById("logout").addEventListener("click", async () => {
  await supabase.auth.signOut();
  window.location.href = "index.html";
});
