import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    
    // Sanitize filename to prevent directory traversal attacks
    const sanitizedFilename = path.basename(filename);
    const filepath = path.join(process.cwd(), "upload", "images", sanitizedFilename);

    const file = await readFile(filepath);

    // Determine content type based on file extension
    const ext = path.extname(filename).toLowerCase();
    const contentType = ext === ".png" 
      ? "image/png" 
      : ext === ".jpg" || ext === ".jpeg" 
        ? "image/jpeg" 
        : "application/octet-stream";

    return new NextResponse(file, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Error serving image:", error);
    return NextResponse.json(
      { error: "Image not found" },
      { status: 404 },
    );
  }
}
