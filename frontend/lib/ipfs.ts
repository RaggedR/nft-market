// IPFS upload using Pinata
// Get your API keys at https://app.pinata.cloud/

const PINATA_API_KEY = process.env.NEXT_PUBLIC_PINATA_API_KEY || "";
const PINATA_SECRET_KEY = process.env.NEXT_PUBLIC_PINATA_SECRET_KEY || "";

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

export async function uploadImageToPinata(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(
    "https://api.pinata.cloud/pinning/pinFileToIPFS",
    {
      method: "POST",
      headers: {
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_SECRET_KEY,
      },
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error("Failed to upload image to IPFS");
  }

  const data = await response.json();
  return `ipfs://${data.IpfsHash}`;
}

export async function uploadMetadataToPinata(
  metadata: NFTMetadata
): Promise<string> {
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
    throw new Error("Failed to upload metadata to IPFS");
  }

  const data = await response.json();
  return `ipfs://${data.IpfsHash}`;
}

export function ipfsToHttp(ipfsUri: string): string {
  if (ipfsUri.startsWith("ipfs://")) {
    return ipfsUri.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/");
  }
  return ipfsUri;
}
