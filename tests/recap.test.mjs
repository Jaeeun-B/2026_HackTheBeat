import test from 'node:test';
import assert from 'node:assert';
import { generateRecapCanvas } from '../src/lib/recap.ts';

test('recap generates a row per guest and handles zero photos', async () => {
  const mockCtx = {
    fillRect: () => {},
    fillText: () => {},
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    stroke: () => {},
    drawImage: () => {},
    arc: () => {},
    clip: () => {},
    restore: () => {},
    save: () => {},
    measureText: () => ({ width: 100 }),
    strokeRect: () => {},
    fill: () => {},
    fillStyle: '',
    font: '',
    textAlign: '',
    strokeStyle: '',
    lineWidth: 0
  };

  const mockCanvas = {
    getContext: () => mockCtx,
    width: 0,
    height: 0,
    toDataURL: () => 'data:image/png;base64,123'
  };

  const mockDocument = {
    createElement: (tag) => {
      if (tag === 'canvas') return mockCanvas;
      if (tag === 'img') return { src: '', onload: null, onerror: null };
      return {};
    }
  };

  const assignments = [
    { name: 'Alice', mission: { text: 'M1' }, pairId: 'p1', partnerIndex: 1 },
    { name: 'Bob', mission: { text: 'M2' }, pairId: 'p1', partnerIndex: 0 },
  ];
  const results = [true, false];
  const photoStore = new Map(); // zero photos

  const origImage = global.Image;
  global.Image = function() {
    setTimeout(() => { if (this.onerror) this.onerror(new Error('no img')); }, 0);
    return this;
  };

  try {
    const canvas = await generateRecapCanvas(mockDocument, 'Test Party', assignments, results, photoStore);
    assert.strictEqual(canvas, mockCanvas);
    assert.ok(canvas.height > 0); // Should set a height
  } finally {
    global.Image = origImage;
  }
});
