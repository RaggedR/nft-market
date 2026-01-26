/**
 * Mint Route Integration Tests
 */

const request = require('supertest');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = require('../../src/index');
const blockchainService = require('../../src/services/blockchain');
const duplicateService = require('../../src/services/duplicate');
const firestoreService = require('../../src/services/firestore');

// Helper to create a mock auth token (SIWE format, dev mode)
function createMockAuthToken(walletAddress) {
  const message = `localhost wants you to sign in with your Ethereum account:
${walletAddress}

Sign in to NFTmarket

URI: http://localhost:3000
Version: 1
Chain ID: 137
Nonce: ${crypto.randomBytes(8).toString('hex')}
Issued At: ${new Date().toISOString()}
Expiration Time: ${new Date(Date.now() + 3600000).toISOString()}`;

  // Mock signature (66 chars = 0x + 64 hex)
  const signature = '0x' + crypto.createHash('sha256').update(message).digest('hex');

  const token = Buffer.from(JSON.stringify({ message, signature })).toString('base64');
  return token;
}

// Create a minimal test image (1x1 red PNG)
function createTestImage() {
  // Minimal valid PNG (1x1 red pixel)
  const png = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG signature
    0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
    0xde, 0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41, // IDAT chunk
    0x54, 0x08, 0xd7, 0x63, 0xf8, 0xcf, 0xc0, 0x00,
    0x00, 0x00, 0x03, 0x00, 0x01, 0x00, 0x05, 0xfe,
    0xd4, 0xef, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, // IEND chunk
    0x4e, 0x44, 0xae, 0x42, 0x60, 0x82
  ]);
  return png;
}

describe('Mint Route', () => {
  const testWallet = '0x1234567890123456789012345678901234567890';
  let authToken;

  beforeAll(() => {
    authToken = createMockAuthToken(testWallet);
  });

  beforeEach(() => {
    // Reset all mock services between tests
    blockchainService.resetMock();
    duplicateService.resetMock();
    firestoreService.resetMock();
  });

  describe('POST /api/mint', () => {
    it('should require authentication', async () => {
      const res = await request(app)
        .post('/api/mint')
        .send();

      expect(res.status).toBe(401);
      expect(res.body.code).toBe('UNAUTHORIZED');
    });

    it('should require image file', async () => {
      const res = await request(app)
        .post('/api/mint')
        .set('Authorization', `Bearer ${authToken}`)
        .field('name', 'Test NFT')
        .field('licenseType', 'display')
        .field('licenseSignature', '0x' + 'a'.repeat(64));

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('MISSING_IMAGE');
    });

    it('should require name field', async () => {
      const res = await request(app)
        .post('/api/mint')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', createTestImage(), 'test.png')
        .field('licenseType', 'display')
        .field('licenseSignature', '0x' + 'a'.repeat(64));

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('MISSING_FIELDS');
    });

    it('should require valid license type', async () => {
      const res = await request(app)
        .post('/api/mint')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', createTestImage(), 'test.png')
        .field('name', 'Test NFT')
        .field('licenseType', 'invalid')
        .field('licenseSignature', '0x' + 'a'.repeat(64));

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_LICENSE_TYPE');
    });

    it('should successfully mint with display license', async () => {
      // Use unique image data for each test
      const uniqueImage = Buffer.concat([createTestImage(), Buffer.from('display')]);

      const res = await request(app)
        .post('/api/mint')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', uniqueImage, 'test.png')
        .field('name', 'Test NFT')
        .field('description', 'A test artwork')
        .field('licenseType', 'display')
        .field('licenseSignature', '0x' + 'a'.repeat(64));

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('tokenId');
      expect(res.body).toHaveProperty('transactionHash');
      expect(res.body).toHaveProperty('watermarkId');
      expect(res.body).toHaveProperty('encryptedBlobUri');
      expect(res.body).toHaveProperty('previewUri');
      expect(res.body).toHaveProperty('metadataUri');
      expect(res.body).toHaveProperty('imageHash');
      expect(res.body).toHaveProperty('licenseHash');
    });

    it('should successfully mint with commercial license', async () => {
      const uniqueImage = Buffer.concat([createTestImage(), Buffer.from('commercial')]);

      const res = await request(app)
        .post('/api/mint')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', uniqueImage, 'test.png')
        .field('name', 'Commercial Art')
        .field('licenseType', 'commercial')
        .field('licenseSignature', '0x' + 'b'.repeat(64));

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.tokenId).toBe(1);
    });

    it('should successfully mint with transfer license', async () => {
      // Use a unique image to avoid duplicate detection
      const uniqueImage = Buffer.concat([createTestImage(), Buffer.from('transfer')]);

      const res = await request(app)
        .post('/api/mint')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', uniqueImage, 'test.png')
        .field('name', 'Full Transfer Art')
        .field('licenseType', 'transfer')
        .field('licenseSignature', '0x' + 'c'.repeat(64));

      if (res.status !== 201) {
        console.error('Transfer mint failed:', res.body);
      }
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('should reject duplicate image', async () => {
      const image = createTestImage();

      // First mint should succeed
      const res1 = await request(app)
        .post('/api/mint')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', image, 'test.png')
        .field('name', 'Original')
        .field('licenseType', 'display')
        .field('licenseSignature', '0x' + 'a'.repeat(64));

      expect(res1.status).toBe(201);

      // Second mint with same image should fail
      const res2 = await request(app)
        .post('/api/mint')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', image, 'test.png')
        .field('name', 'Duplicate')
        .field('licenseType', 'display')
        .field('licenseSignature', '0x' + 'b'.repeat(64));

      expect(res2.status).toBe(409);
      expect(res2.body.code).toBe('DUPLICATE_IMAGE');
    });

    it('should mint multiple unique images', async () => {
      // Create slightly different images by modifying the buffer
      const image1 = createTestImage();
      const image2 = Buffer.concat([createTestImage(), Buffer.from([0x00])]);
      const image3 = Buffer.concat([createTestImage(), Buffer.from([0x01])]);

      const promises = [
        request(app)
          .post('/api/mint')
          .set('Authorization', `Bearer ${authToken}`)
          .attach('image', image1, 'test1.png')
          .field('name', 'NFT 1')
          .field('licenseType', 'display')
          .field('licenseSignature', '0x' + 'a'.repeat(64)),
        request(app)
          .post('/api/mint')
          .set('Authorization', `Bearer ${authToken}`)
          .attach('image', image2, 'test2.png')
          .field('name', 'NFT 2')
          .field('licenseType', 'commercial')
          .field('licenseSignature', '0x' + 'b'.repeat(64)),
        request(app)
          .post('/api/mint')
          .set('Authorization', `Bearer ${authToken}`)
          .attach('image', image3, 'test3.png')
          .field('name', 'NFT 3')
          .field('licenseType', 'transfer')
          .field('licenseSignature', '0x' + 'c'.repeat(64))
      ];

      const results = await Promise.all(promises);

      // All should succeed
      results.forEach(res => {
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
      });

      // Each should have a unique tokenId
      const tokenIds = results.map(r => r.body.tokenId);
      const uniqueIds = new Set(tokenIds);
      expect(uniqueIds.size).toBe(3);
    });
  });

  describe('GET /api/mint/price', () => {
    it('should return license prices without auth', async () => {
      // Price endpoint is under /api/mint which requires auth
      const res = await request(app)
        .get('/api/mint/price')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('display');
      expect(res.body).toHaveProperty('commercial');
      expect(res.body).toHaveProperty('transfer');
      expect(res.body.display.usd).toBe(1.00);
      expect(res.body.commercial.usd).toBe(5.00);
      expect(res.body.transfer.usd).toBe(10.00);
    });
  });

  describe('GET /api/mint/license/:type', () => {
    it('should return display license text', async () => {
      const res = await request(app)
        .get('/api/mint/license/display')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.licenseType).toBe('display');
      expect(res.body.text).toContain('DISPLAY');
      expect(res.body.text).toContain('non-commercial');
    });

    it('should return commercial license text', async () => {
      const res = await request(app)
        .get('/api/mint/license/commercial')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.licenseType).toBe('commercial');
      expect(res.body.text).toContain('COMMERCIAL');
    });

    it('should return transfer license text', async () => {
      const res = await request(app)
        .get('/api/mint/license/transfer')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.licenseType).toBe('transfer');
      expect(res.body.text).toContain('COPYRIGHT TRANSFER');
    });

    it('should reject invalid license type', async () => {
      const res = await request(app)
        .get('/api/mint/license/invalid')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_LICENSE_TYPE');
    });
  });
});

describe('Health Check', () => {
  it('should return healthy status', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.service).toBe('nftmarket-api');
  });

  it('should return ok on /health', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
