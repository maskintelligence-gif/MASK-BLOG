import { supabase } from "/admin/js/supabase.js";
import { renderMarkdown } from "/admin/js/markdown.js";

const previewEl = document.getElementById("markdown-preview");
const previewBtn = document.getElementById("preview-btn");

function updatePreview() {
  previewEl.innerHTML = renderMarkdown(contentInput.value);
}

contentInput.addEventListener("input", updatePreview);

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

const categoriesList = document.getElementById("categories-list");
const tagsList = document.getElementById("tags-list");

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

titleInput.addEventListener("input", () => {
  if (slugTouchedManually) return;
  slugInput.value = generateSlug(titleInput.value);
});

slugInput.addEventListener("input", () => {
  slugTouchedManually = true;
});

/* =========================================================
   LOAD CATEGORIES & TAGS
========================================================= */

async function loadCategories(selected = []) {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name")
    .order("name");

  if (error) return;

  categoriesList.innerHTML = "";

  data.forEach(cat => {
    const label = document.createElement("label");
    label.className = "checkbox";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.value = cat.id;
    input.checked = selected.includes(cat.id);

    label.appendChild(input);
    label.append(` ${cat.name}`);
    categoriesList.appendChild(label);
  });
}

async function loadTags(selected = []) {
  const { data, error } = await supabase
    .from("tags")
    .select("id, name")
    .order("name");

  if (error) return;

  tagsList.innerHTML = "";

  data.forEach(tag => {
    const label = document.createElement("label");
    label.className = "checkbox";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.value = tag.id;
    input.checked = selected.includes(tag.id);

    label.appendChild(input);
    label.append(` ${tag.name}`);
    tagsList.appendChild(label);
  });
}

/* =========================================================
   EDIT MODE — LOAD POST + RELATIONS
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

  slugTouchedManually = true;

  const { data: catLinks } = await supabase
    .from("blog_post_categories")
    .select("category_id")
    .eq("post_id", postId);

  const { data: tagLinks } = await supabase
    .from("blog_post_tags")
    .select("tag_id")
    .eq("post_id", postId);

  await loadCategories(catLinks?.map(c => c.category_id));
  await loadTags(tagLinks?.map(t => t.tag_id));

} else {
  // New post — load empty lists
  await loadCategories();
  await loadTags();
}

updatePreview();

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

  payload.published_at = payload.published
    ? new Date().toISOString()
    : null;

  let savedPostId = postId;

  if (postId) {
    const { error } = await supabase
      .from("blog_posts")
      .update(payload)
      .eq("id", postId);

    if (error) {
      errorEl.textContent = error.message;
      return;
    }

  } else {
    payload.author_id = session.user.id;

    const { data, error } = await supabase
      .from("blog_posts")
      .insert(payload)
      .select()
      .single();

    if (error) {
      errorEl.textContent = error.message;
      return;
    }

    savedPostId = data.id;
  }

  /* ===============================
     SAVE CATEGORIES
  ================================ */

  const selectedCategories = Array.from(
    categoriesList.querySelectorAll("input:checked")
  ).map(i => ({
    post_id: savedPostId,
    category_id: i.value
  }));

  await supabase
    .from("blog_post_categories")
    .delete()
    .eq("post_id", savedPostId);

  if (selectedCategories.length) {
    await supabase
      .from("blog_post_categories")
      .insert(selectedCategories);
  }

  /* ===============================
     SAVE TAGS
  ================================ */

  const selectedTags = Array.from(
    tagsList.querySelectorAll("input:checked")
  ).map(i => ({
    post_id: savedPostId,
    tag_id: i.value
  }));

  await supabase
    .from("blog_post_tags")
    .delete()
    .eq("post_id", savedPostId);

  if (selectedTags.length) {
    await supabase
      .from("blog_post_tags")
      .insert(selectedTags);
  }

  window.location.href = "/admin/posts.html";
});
