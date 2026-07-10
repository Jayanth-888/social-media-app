"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { validateImageFile } from "@/lib/validation";
import type { ApiResponse, Post } from "@/types";

// CLIENT COMPONENT.
// A controlled <textarea> and a submit handler both require React state
// and event listeners — this only works as a Client Component. After a
// successful post, router.refresh() re-runs the Server Component tree
// (FeedPage) so the new post appears without a full page reload.
export function CreatePost() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [content, setContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error ?? "Invalid image");
      e.target.value = "";
      return;
    }

    setError(null);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  function clearImage() {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;
    setIsSubmitting(true);
    setError(null);

    try {
      let imageUrl: string | undefined;

      // Only hits /api/upload if the user actually attached an image.
      if (selectedFile) {
        const uploadFormData = new FormData();
        uploadFormData.append("file", selectedFile);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: uploadFormData,
        });
        const uploadJson: ApiResponse<{ url: string }> = await uploadRes.json();

        if (!uploadRes.ok || !uploadJson.success || !uploadJson.data) {
          throw new Error(uploadJson.error ?? "Image upload failed");
        }

        imageUrl = uploadJson.data.url;
      }

      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, ...(imageUrl ? { imageUrl } : {}) }),
      });
      const json: ApiResponse<Post> = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error ?? "Failed to create post");

      setContent("");
      clearImage();
      router.refresh(); // re-fetches the Server Component's initial page of posts
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-4 flex flex-col gap-2 border-b border-border pb-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What's on your mind?"
        rows={3}
        maxLength={2000}
        className="w-full resize-none rounded-lg border border-border p-3 text-[15px]"
      />

      {previewUrl && (
        <div className="relative">
          {/* Plain <img>, not next/image: this is a local blob: URL until
              the post is submitted, which next/image's optimizer can't fetch. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Selected image preview"
            className="max-h-64 w-full rounded-lg border border-border object-cover"
          />
          <button
            type="button"
            onClick={clearImage}
            className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-1 text-xs text-white hover:bg-black/80"
          >
            Remove
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex items-center justify-between">
        <div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            {previewUrl ? "Change image" : "Add image"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
        <Button type="submit" disabled={isSubmitting || !content.trim()}>
          {isSubmitting ? "Posting..." : "Post"}
        </Button>
      </div>
    </form>
  );
}