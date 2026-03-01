import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 },
      );
    }

    // Validate file type
    const validTypes = ["image/png", "image/jpeg", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload PNG or JPG format only" },
        { status: 400 },
      );
    }

    // Create upload directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), "upload", "images");
    await mkdir(uploadDir, { recursive: true });

    // Generate unique filename to avoid conflicts
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const fileExtension = file.name.split(".").pop() || "png";
    const filename = `${timestamp}-${randomStr}.${fileExtension}`;
    const filepath = path.join(uploadDir, filename);

    // Convert file to buffer and write to disk
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Return the URL path to the uploaded file
    const imageUrl = `/api/upload/images/${filename}`;

    return NextResponse.json(
      { success: true, imageUrl },
      { status: 200 },
    );
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 },
    );
  }
}
