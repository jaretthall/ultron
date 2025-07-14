// Mock problematic ES module import
jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn(),
  GenerateContentResponse: jest.fn(),
}));

import * as ExportService from '../exportService';

describe('ExportService', () => {
  it('should have exported functions', () => {
    expect(typeof ExportService).toBe('object');
  });
  // Add more specific tests as needed
}); 