import { NextResponse } from "next/server";
import { auth } from "@/auth";
import cloudinary from "@/lib/cloudinary";
import { validateImageFile } from "@/lib/validation";
import type { ApiResponse } from "@/types";

export const runtime = "nodejs"; // Cloudinary SDK + Buffer need Node, not Edge

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const formData = await req.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: "No file provided" },
      { status: 400 }
    );
  }

  const validation = validateImageFile(file);
  if (!validation.valid) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: validation.error },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "project-z",
          resource_type: "image",
          transformation: [{ width: 1600, height: 1600, crop: "limit" }],
        },
        (error, uploadResult) => {
          if (error || !uploadResult) return reject(error ?? new Error("Upload failed"));
          resolve(uploadResult as { secure_url: string });
        }
      );
      stream.end(buffer);
    });

    return NextResponse.json<ApiResponse<{ url: string }>>({
      success: true,
      data: { url: result.secure_url },
    });
  } catch (err) {
    console.error("Cloudinary upload failed:", err);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: "Upload failed. Please try again." },
      { status: 500 }
    );
  }
}