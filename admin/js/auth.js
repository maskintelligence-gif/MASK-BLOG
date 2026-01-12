import { supabase } from "./supabase.js";

// Redirect if already logged in
const { data: { session } } = await supabase.auth.getSession();
if (session) {
  window.location.href = "dashboard.html";
}

// Handle login
const form = document.getElementById("login-form");
const errorEl = document.getElementById("error");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    errorEl.textContent = error.message;
  } else {
    window.location.href = "dashboard.html";
  }
});
