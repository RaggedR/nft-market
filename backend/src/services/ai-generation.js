/**
 * AI Image Generation Service
 * Integrates with Stability AI for image generation
 */

const USE_MOCK_AI = process.env.USE_MOCK_AI === 'true';
const STABILITY_API_KEY = process.env.STABILITY_API_KEY;
const STABILITY_API_URL = 'https://api.stability.ai/v2beta/stable-image/generate/ultra';

// In-memory storage for generations (mock mode)
const mockGenerations = new Map();

// Placeholder image (1x1 blue PNG)
const PLACEHOLDER_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

/**
 * Generate images using Stability AI
 * @param {string} prompt - Text prompt for image generation
 * @param {string} style - Style preset (e.g., 'photographic', 'digital-art', 'anime')
 * @param {number} count - Number of images to generate (1 or 4)
 * @returns {Promise<Array<{buffer: Buffer, seed: number}>>}
 */
async function generateImage(prompt, style = 'photographic', count = 1) {
  if (USE_MOCK_AI) {
    return mockGenerateImage(prompt, style, count);
  }

  if (!STABILITY_API_KEY) {
    throw new Error('STABILITY_API_KEY not configured');
  }

  // Generate all images in parallel for speed
  const generateOne = async () => {
    const seed = Math.floor(Math.random() * 2147483647);

    const formData = new FormData();
    formData.append('prompt', prompt);
    formData.append('output_format', 'png');
    formData.append('seed', seed.toString());
    if (style) {
      formData.append('style_preset', style);
    }

    const response = await fetch(STABILITY_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STABILITY_API_KEY}`,
        'Accept': 'image/*',
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Stability AI error: ${response.status} - ${error}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    return { buffer, seed };
  };

  const promises = Array.from({ length: count }, () => generateOne());
  return Promise.all(promises);
}

/**
 * Mock image generation for testing
 */
function mockGenerateImage(prompt, style, count) {
  console.log(`[Mock AI] Generating ${count} images for prompt: "${prompt}" (style: ${style})`);

  const images = [];
  for (let i = 0; i < count; i++) {
    const seed = Math.floor(Math.random() * 2147483647);
    // Return placeholder PNG for each image
    images.push({
      buffer: Buffer.from(PLACEHOLDER_PNG),
      seed,
    });
  }

  return images;
}

/**
 * Store a generation result
 * @param {string} generationId - Unique ID for this generation
 * @param {Object} data - Generation data including images
 */
function storeGeneration(generationId, data) {
  mockGenerations.set(generationId, {
    ...data,
    createdAt: new Date(),
  });
}

/**
 * Get a stored generation
 * @param {string} generationId - The generation ID to retrieve
 * @returns {Object|null}
 */
function getGeneration(generationId) {
  return mockGenerations.get(generationId) || null;
}

/**
 * Get supported style presets
 * @returns {Array<{id: string, name: string}>}
 */
function getStylePresets() {
  return [
    { id: 'photographic', name: 'Photographic' },
    { id: 'digital-art', name: 'Digital Art' },
    { id: 'anime', name: 'Anime' },
    { id: 'cinematic', name: 'Cinematic' },
    { id: '3d-model', name: '3D Model' },
    { id: 'fantasy-art', name: 'Fantasy Art' },
    { id: 'neon-punk', name: 'Neon Punk' },
    { id: 'origami', name: 'Origami' },
    { id: 'pixel-art', name: 'Pixel Art' },
    { id: 'line-art', name: 'Line Art' },
  ];
}

/**
 * Reset mock storage (for testing)
 */
function resetMock() {
  mockGenerations.clear();
}

/**
 * Get all mock generations (for testing)
 */
function getMockGenerations() {
  return Object.fromEntries(mockGenerations);
}

module.exports = {
  generateImage,
  storeGeneration,
  getGeneration,
  getStylePresets,
  resetMock,
  getMockGenerations,
};
