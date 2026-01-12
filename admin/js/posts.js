import { supabase } from "/admin/js/supabase.js";

// AUTH GUARD
const { data: { session } } = await supabase.auth.getSession();
if (!session) {
  window.location.href = "/admin/index.html";
  throw new Error("Not authenticated");
}

// FETCH POSTS
const { data: posts, error } = await supabase
  .from("blog_posts")
  .select("id, title, published, created_at")
  .order("created_at", { ascending: false });

if (error) {
  alert(error.message);
  throw error;
}

const tbody = document.querySelector("#posts-table tbody");

posts.forEach(post => {
  const tr = document.createElement("tr");

  tr.innerHTML = `
    <td>${post.title}</td>
    <td>${post.published ? "Published" : "Draft"}</td>
    <td>${new Date(post.created_at).toLocaleDateString()}</td>
    <td>
      <a href="/admin/post-edit.html?id=${post.id}">Edit</a>
    </td>
  `;

  tbody.appendChild(tr);
});
