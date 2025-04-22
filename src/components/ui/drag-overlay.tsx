'use client';

import React from 'react';

// Remove empty interface and use a record type for future extensibility
type DragOverlayProps = Record<string, never>;

export const DragOverlay: React.FC<DragOverlayProps> = () => {
  return (
    <div className="absolute inset-0 bg-primary/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
      <div className="bg-background p-4 rounded-lg shadow-lg text-center">
        <p className="text-primary font-medium">Drop images here</p>
        <p className="text-sm text-muted-foreground">Release to upload</p>
      </div>
    </div>
  );
};