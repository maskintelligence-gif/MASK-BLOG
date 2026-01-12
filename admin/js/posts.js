import { supabase } from "/admin/js/supabase.js";

/* =========================================================
   AUTH GUARD
========================================================= */

const {
  data: { session }
} = await supabase.auth.getSession();

if (!session) {
  window.location.href = "/admin/index.html";
  throw new Error("Not authenticated");
}

/* =========================================================
   ELEMENTS
========================================================= */

const tbody = document.getElementById("posts-body");
const errorEl = document.getElementById("error");

/* =========================================================
   CHECK ROLE (EDITOR / ADMIN)
========================================================= */

async function isEditor() {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", session.user.id);

  if (error) return false;

  return data.some(r => r.role === "editor" || r.role === "admin");
}

const canDelete = await isEditor();

/* =========================================================
   LOAD POSTS
========================================================= */

const { data: posts, error } = await supabase
  .from("blog_posts")
  .select("id, title, published")
  .order("published_at", { ascending: false })
  .order("created_at", { ascending: false });

if (error) {
  errorEl.textContent = error.message;
  throw error;
}

/* =========================================================
   RENDER TABLE
========================================================= */

posts.forEach(post => {
  const tr = document.createElement("tr");

  const titleTd = document.createElement("td");
  titleTd.textContent = post.title;

  const statusTd = document.createElement("td");
  statusTd.textContent = post.published ? "Published" : "Draft";

  const actionsTd = document.createElement("td");

  const editLink = document.createElement("a");
  editLink.href = `/admin/post-edit.html?id=${post.id}`;
  editLink.textContent = "Edit";
  actionsTd.appendChild(editLink);

  if (canDelete) {
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.className = "danger";

    deleteBtn.addEventListener("click", async () => {
      const confirmed = confirm(
        `Delete "${post.title}"?\nThis cannot be undone.`
      );

      if (!confirmed) return;

      const { error } = await supabase
        .from("blog_posts")
        .delete()
        .eq("id", post.id);

      if (error) {
        alert(error.message);
        return;
      }

      tr.remove();
    });

    actionsTd.append(" ");
    actionsTd.appendChild(deleteBtn);
  }

  tr.appendChild(titleTd);
  tr.appendChild(statusTd);
  tr.appendChild(actionsTd);

  tbody.appendChild(tr);
});
