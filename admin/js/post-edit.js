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
   ELEMENTS & STATE
========================================================= */

const params = new URLSearchParams(window.location.search);
const postId = params.get("id");

const form = document.getElementById("post-form");
const errorEl = document.getElementById("error");

const titleInput = document.getElementById("title");
const slugInput = document.getElementById("slug");
const contentInput = document.getElementById("content");
const publishedInput = document.getElementById("published");
const pageTitle = document.getElementById("page-title");

/* =========================================================
   SLUG AUTO-GENERATION
========================================================= */

let slugTouchedManually = false;

function generateSlug(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// Auto-generate slug from title (only if user hasn't edited slug)
titleInput.addEventListener("input", () => {
  if (slugTouchedManually) return;
  slugInput.value = generateSlug(titleInput.value);
});

// Detect manual slug edits
slugInput.addEventListener("input", () => {
  slugTouchedManually = true;
});

/* =========================================================
   EDIT MODE — LOAD POST
========================================================= */

if (postId) {
  pageTitle.textContent = "Edit Post";

  const { data: post, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("id", postId)
    .single();

  if (error) {
    errorEl.textContent = error.message;
    throw error;
  }

  titleInput.value = post.title;
  slugInput.value = post.slug;
  contentInput.value = post.content;
  publishedInput.checked = post.published;

  // IMPORTANT:
  // If editing an existing post, we assume slug is intentional
  slugTouchedManually = true;
}

/* =========================================================
   SAVE HANDLER
========================================================= */

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorEl.textContent = "";

  const payload = {
    title: titleInput.value.trim(),
    slug: slugInput.value.trim(),
    content: contentInput.value,
    published: publishedInput.checked
  };

  // Handle published_at correctly
  if (payload.published) {
    payload.published_at = new Date().toISOString();
  } else {
    payload.published_at = null;
  }

  let result;

  if (postId) {
    // UPDATE
    result = await supabase
      .from("blog_posts")
      .update(payload)
      .eq("id", postId);
  } else {
    // CREATE
    payload.author_id = session.user.id;

    result = await supabase
      .from("blog_posts")
      .insert(payload);
  }

  if (result.error) {
    errorEl.textContent = result.error.message;
    return;
  }

  window.location.href = "/admin/posts.html";
});
