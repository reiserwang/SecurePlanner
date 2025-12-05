import React, { useRef, useState, useEffect } from 'react';
import { Placement, DeviceSpec } from '../types';
import { DEVICE_CATALOG } from '../services/deviceCatalog';

interface FloorPlanCanvasProps {
  imageSrc: string | null;
  placements: Placement[];
  onRemovePlacement: (id: string) => void;
}

const FloorPlanCanvas: React.FC<FloorPlanCanvasProps> = ({ imageSrc, placements, onRemovePlacement }) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (!imageSrc) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 border-2 border-dashed border-slate-300 rounded-xl text-slate-400">
        <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p>Upload a floor plan to begin analysis</p>
      </div>
    );
  }

  return (
    <div id="floor-plan-capture-area" className="relative w-full h-full bg-slate-200 overflow-hidden rounded-xl shadow-inner group inline-block">
      <img
        src={imageSrc}
        alt="Floor Plan"
        className="w-full h-full object-contain"
      />
      
      {placements.map((placement) => {
        const device = DEVICE_CATALOG.find(d => d.id === placement.deviceId);
        if (!device) return null;

        const isHovered = hoveredId === placement.id;

        return (
          <div
            key={placement.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 z-10"
            style={{ left: `${placement.x}%`, top: `${placement.y}%` }}
            onMouseEnter={() => setHoveredId(placement.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            {/* Range Circle (visualize coverage approx) */}
            {isHovered && device.specs.range && (
               <div 
                 className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full opacity-20 pointer-events-none transition-all duration-300"
                 style={{ 
                    width: `${device.specs.range * 20}px`, // Mock scaling: 1m = 10px roughly for visualization
                    height: `${device.specs.range * 20}px`,
                    backgroundColor: device.color 
                 }}
               />
            )}

            {/* Icon */}
            <div 
                className={`relative p-2 rounded-full shadow-lg border-2 transition-transform ${isHovered ? 'scale-125 z-20' : 'scale-100'}`}
                style={{ backgroundColor: 'white', borderColor: device.color, color: device.color }}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path d={device.icon} />
              </svg>
              
              {/* Tooltip */}
              {isHovered && (
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-48 bg-slate-800 text-white text-xs rounded-md py-2 px-3 shadow-xl z-50 pointer-events-none">
                  <div className="font-bold mb-1">{device.name}</div>
                  <div className="mb-1 opacity-90">{placement.reason}</div>
                  <div className="text-slate-400 italic text-[10px]">Click X to remove</div>
                </div>
              )}

              {/* Remove Button */}
              {isHovered && (
                 <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemovePlacement(placement.id);
                    }}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] hover:bg-red-600"
                 >
                    ✕
                 </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default FloorPlanCanvas;