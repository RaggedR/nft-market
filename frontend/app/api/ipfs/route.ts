import { NextRequest, NextResponse } from "next/server";

// Server-side only - these keys are NOT exposed to the client
const PINATA_API_KEY = process.env.PINATA_API_KEY || "";
const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY || "";

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      // Handle image upload
      const formData = await request.formData();
      const file = formData.get("file") as File;

      if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
      }

      const pinataFormData = new FormData();
      pinataFormData.append("file", file);

      const response = await fetch(
        "https://api.pinata.cloud/pinning/pinFileToIPFS",
        {
          method: "POST",
          headers: {
            pinata_api_key: PINATA_API_KEY,
            pinata_secret_api_key: PINATA_SECRET_KEY,
          },
          body: pinataFormData,
        }
      );

      if (!response.ok) {
        const error = await response.text();
        return NextResponse.json(
          { error: "Failed to upload to IPFS", details: error },
          { status: response.status }
        );
      }

      const data = await response.json();
      return NextResponse.json({ ipfsHash: data.IpfsHash });
    } else {
      // Handle JSON metadata upload
      const metadata = await request.json();

      const response = await fetch(
        "https://api.pinata.cloud/pinning/pinJSONToIPFS",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            pinata_api_key: PINATA_API_KEY,
            pinata_secret_api_key: PINATA_SECRET_KEY,
          },
          body: JSON.stringify(metadata),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        return NextResponse.json(
          { error: "Failed to upload metadata to IPFS", details: error },
          { status: response.status }
        );
      }

      const data = await response.json();
      return NextResponse.json({ ipfsHash: data.IpfsHash });
    }
  } catch (error) {
    console.error("IPFS upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
