"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { validateImageFile } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import type { ApiResponse } from "@/types";

interface EditProfileFormProps {
  userId: string;
  initialBio: string | null;
  initialHeadline: string | null;
  initialProfileImage: string | null;
}

export function EditProfileForm({
  userId,
  initialBio,
  initialHeadline,
  initialProfileImage,
}: EditProfileFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [bio, setBio] = useState(initialBio ?? "");
  const [headline, setHeadline] = useState(initialHeadline ?? "");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialProfileImage);
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      let profileImageUrl = initialProfileImage ?? undefined;

      // Only hits /api/upload if the user actually picked a new file.
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

        profileImageUrl = uploadJson.data.url;
      }

      const patchRes = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bio,
          headline,
          ...(profileImageUrl ? { profileImage: profileImageUrl } : {}),
        }),
      });
      const patchJson: ApiResponse<unknown> = await patchRes.json();

      if (!patchRes.ok || !patchJson.success) {
        throw new Error(patchJson.error ?? "Failed to save profile");
      }

      router.refresh();
      router.push(`/profile/${userId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-md">
      <div className="flex items-center gap-4">
        <div className="relative h-20 w-20 overflow-hidden rounded-full bg-gray-100">
          {previewUrl ? (
            // Plain <img>, not next/image: the preview is a local blob: URL
            // before submit, which next/image's optimizer can't fetch.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="Profile preview" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
              No image
            </div>
          )}
        </div>
        <div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            Change photo
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png"
            onChange={handleFileChange}
            className="hidden"
          />
          <p className="mt-1 text-xs text-gray-500">JPG or PNG, up to 5MB.</p>
        </div>
      </div>

      <div>
        <label htmlFor="headline" className="block text-sm font-medium text-gray-700">
          Headline
        </label>
        <input
          id="headline"
          type="text"
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          maxLength={100}
          placeholder="What you're about, in a few words"
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
          Bio
        </label>
        <textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={280}
          rows={4}
          placeholder="Tell people a bit about yourself"
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <p className="mt-1 text-right text-xs text-gray-400">{bio.length}/280</p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : "Save changes"}
      </Button>
    </form>
  );
}