export async function generateRecapCanvas(
  doc: Document,
  partyName: string,
  assignments: any[],
  results: boolean[],
  photoStore: Map<string, string>
): Promise<HTMLCanvasElement> {
  const canvas = doc.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const width = 800;
  const headerHeight = 160;
  const rowHeight = 140;
  const footerHeight = 100;
  const height = headerHeight + assignments.length * rowHeight + footerHeight;

  canvas.width = width;
  canvas.height = height;

  // Background
  ctx.fillStyle = '#111827';
  ctx.fillRect(0, 0, width, height);

  // Header
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 42px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${partyName || '파티'} 결과`, width / 2, 80);
  
  const today = new Date().toLocaleDateString();
  ctx.fillStyle = '#9CA3AF';
  ctx.font = '24px sans-serif';
  ctx.fillText(today, width / 2, 120);

  // Connection mapping (color mapping for pairs)
  const pairColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
  const assignedColors = new Map<string, string>();
  let colorIdx = 0;

  // Track coordinates for connections
  const pairCoords = new Map<string, number[]>();

  // Draw rows
  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve) => {
      const img = new (globalThis as any).Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => resolve(img);
      img.src = src;
    });
  };

  const photoCache = new Map<string, HTMLImageElement>();
  for (const a of assignments) {
    const src = photoStore.get(a.name);
    if (src) {
      const img = await loadImage(src);
      if (img.width > 0) photoCache.set(a.name, img);
    }
  }

  // Draw guests
  for (let i = 0; i < assignments.length; i++) {
    const a = assignments[i];
    const success = results[i];
    const yCenter = headerHeight + i * rowHeight + rowHeight / 2;
    
    // Draw row background
    ctx.fillStyle = '#1F2937';
    ctx.fillRect(40, yCenter - rowHeight/2 + 10, width - 80, rowHeight - 20);

    // Record pair coordinates for connections
    if (a.pairId && a.partnerIndex !== null) {
      if (!pairCoords.has(a.pairId)) pairCoords.set(a.pairId, []);
      pairCoords.get(a.pairId)!.push(yCenter);
      
      if (!assignedColors.has(a.pairId)) {
        assignedColors.set(a.pairId, pairColors[colorIdx % pairColors.length]);
        colorIdx++;
      }
    }

    // Photo
    const photo = photoCache.get(a.name);
    const photoSize = 80;
    const photoX = 60;
    const photoY = yCenter - photoSize / 2;

    if (photo) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(photoX + photoSize/2, photoY + photoSize/2, photoSize/2, 0, Math.PI * 2);
      ctx.clip();
      
      // Calculate cover drawing
      const scale = Math.max(photoSize / photo.width, photoSize / photo.height);
      const drawW = photo.width * scale;
      const drawH = photo.height * scale;
      const drawX = photoX + (photoSize - drawW) / 2;
      const drawY = photoY + (photoSize - drawH) / 2;
      
      ctx.drawImage(photo, drawX, drawY, drawW, drawH);
      ctx.restore();
    } else {
      ctx.fillStyle = '#374151';
      ctx.beginPath();
      ctx.arc(photoX + photoSize/2, photoY + photoSize/2, photoSize/2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Name & Verdict
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(a.name, 160, yCenter - 10);

    ctx.fillStyle = success ? '#3B82F6' : '#EF4444';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(success ? '성공' : '실패', 160, yCenter + 25);

    // Mission text
    ctx.fillStyle = '#D1D5DB';
    ctx.font = '20px sans-serif';
    
    // Simple text wrapping (very basic)
    const text = a.mission.text;
    
    // We'll just draw it on one line and let it truncate if necessary, or just simple split
    // For our case, let's keep it simple
    ctx.fillText(text.substring(0, 40) + (text.length > 40 ? '...' : ''), 240, yCenter + 5);
  }

  // Draw connections
  for (const [pairId, coords] of pairCoords.entries()) {
    if (coords.length === 2) {
      const [y1, y2] = coords;
      const minY = Math.min(y1, y2);
      const maxY = Math.max(y1, y2);
      const color = assignedColors.get(pairId) || '#3B82F6';
      
      ctx.strokeStyle = color;
      ctx.lineWidth = 4;
      ctx.beginPath();
      const x = width - 20;
      
      ctx.moveTo(width - 40, minY);
      ctx.lineTo(x, minY);
      ctx.lineTo(x, maxY);
      ctx.lineTo(width - 40, maxY);
      ctx.stroke();
    }
  }

  // Footer
  ctx.fillStyle = '#6B7280';
  ctx.font = 'bold 24px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('미션나잇', width / 2, height - 40);

  return canvas;
}
