import { supabase } from "/admin/js/supabase.js";

// AUTH GUARD
const { data: { session } } = await supabase.auth.getSession();
if (!session) {
  window.location.href = "/admin/index.html";
  throw new Error("Not authenticated");
}

const params = new URLSearchParams(window.location.search);
const postId = params.get("id");

const form = document.getElementById("post-form");
const errorEl = document.getElementById("error");

const titleInput = document.getElementById("title");
const slugInput = document.getElementById("slug");
const contentInput = document.getElementById("content");
const publishedInput = document.getElementById("published");
const pageTitle = document.getElementById("page-title");

// EDIT MODE — load post
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
}

// SAVE HANDLER
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const payload = {
    title: titleInput.value,
    slug: slugInput.value,
    content: contentInput.value,
    published: publishedInput.checked
  };

  // If publishing, set published_at
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
  } else {
    window.location.href = "/admin/posts.html";
  }
});
