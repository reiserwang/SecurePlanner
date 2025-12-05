import React, { useState } from 'react';
import { Placement } from '../../types';
import { API } from '../../backend';

interface FloorPlanCanvasProps {
  imageSrc: string | null;
  placements: Placement[];
  onRemovePlacement: (id: string) => void;
  showCoverage: boolean;
}

const FloorPlanCanvas: React.FC<FloorPlanCanvasProps> = ({ imageSrc, placements, onRemovePlacement, showCoverage }) => {
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

  // Access catalog from Backend API
  const deviceCatalog = API.Catalog.getAll;

  // Helper to generate SVG path for a circular sector (wedge)
  const getWedgePath = (radius: number, startAngleDeg: number, endAngleDeg: number) => {
    if (endAngleDeg - startAngleDeg >= 360) {
        return `M 0 0 m -${radius}, 0 a ${radius},${radius} 0 1,0 ${radius * 2},0 a ${radius},${radius} 0 1,0 -${radius * 2},0`;
    }

    // Convert to radians. 
    // SVG coordinate system adjustment:
    // 0 deg (North) should be -90 deg in standard Unit Circle.
    // So we subtract 90 from the input degrees.
    const startRad = (startAngleDeg - 90) * (Math.PI / 180);
    const endRad = (endAngleDeg - 90) * (Math.PI / 180);

    const x1 = radius * Math.cos(startRad);
    const y1 = radius * Math.sin(startRad);
    const x2 = radius * Math.cos(endRad);
    const y2 = radius * Math.sin(endRad);

    const largeArcFlag = endAngleDeg - startAngleDeg <= 180 ? "0" : "1";

    return `M 0 0 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
  };

  return (
    // Outer container: Handles the background and centers the canvas
    <div className="w-full h-full bg-slate-200 overflow-auto flex items-center justify-center p-4">
      
      {/* 
         Wrapper: "Shrinks" to fit the image exactly. 
         This ensures 'absolute' positioning children (0-100%) map 1:1 to image pixels 
         without letterboxing gaps.
      */}
      <div 
        id="floor-plan-capture-area" 
        className="relative shadow-2xl rounded-sm bg-white"
        style={{ width: 'fit-content', height: 'fit-content' }}
      >
        <img
          src={imageSrc}
          alt="Floor Plan"
          // Max dimensions ensure it fits within the user's viewport while maintaining aspect ratio
          className="block max-w-full max-h-[80vh] w-auto h-auto"
        />
        
        {placements.map((placement) => {
          const device = deviceCatalog.find(d => d.id === placement.deviceId);
          if (!device) return null;

          const isHovered = hoveredId === placement.id;
          
          const viewAngle = device.specs.viewAngle || 360;
          const orientation = placement.orientation || 0;
          
          // Symbolic radius for the directional indicator
          const SYMBOLIC_RADIUS = 60; 
          const isDirectional = viewAngle < 360;
          const shouldShowVisuals = (showCoverage || isHovered);

          return (
            <div
              key={placement.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 z-10"
              style={{ left: `${placement.x}%`, top: `${placement.y}%` }}
              onMouseEnter={() => setHoveredId(placement.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              {/* Directional Indicator (The "Cone") */}
              {shouldShowVisuals && isDirectional && (
                  <div 
                      className="absolute top-1/2 left-1/2 pointer-events-none" 
                      style={{ 
                          width: 0, 
                          height: 0, 
                          overflow: 'visible',
                          zIndex: -1 
                      }}
                  >
                      <svg 
                          width={SYMBOLIC_RADIUS * 2} 
                          height={SYMBOLIC_RADIUS * 2} 
                          viewBox={`-${SYMBOLIC_RADIUS} -${SYMBOLIC_RADIUS} ${SYMBOLIC_RADIUS * 2} ${SYMBOLIC_RADIUS * 2}`}
                          className="overflow-visible"
                          // Fix: Center the SVG itself relative to the parent div
                          style={{ transform: 'translate(-50%, -50%)' }}
                      >
                           <path 
                              d={getWedgePath(SYMBOLIC_RADIUS, orientation - viewAngle / 2, orientation + viewAngle / 2)}
                              fill={device.color} 
                              fillOpacity={isHovered ? 0.4 : 0.25}
                              stroke={device.color}
                              strokeWidth={1.5}
                              strokeOpacity={0.8}
                           />
                           <line 
                              x1="0" y1="0" 
                              x2={SYMBOLIC_RADIUS * Math.cos((orientation - 90) * Math.PI/180)} 
                              y2={SYMBOLIC_RADIUS * Math.sin((orientation - 90) * Math.PI/180)}
                              stroke={device.color}
                              strokeWidth="2"
                              strokeDasharray="3 3"
                              strokeOpacity={0.8}
                           />
                      </svg>
                  </div>
              )}
              
              {/* 360 Range Indicator */}
              {shouldShowVisuals && !isDirectional && (
                   <div 
                   className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed opacity-40 pointer-events-none"
                   style={{ 
                      width: '80px', 
                      height: '80px',
                      borderColor: device.color,
                      backgroundColor: isHovered ? `${device.color}22` : 'transparent'
                   }}
                 />
              )}

              {/* Icon Container */}
              <div className="relative">
                  <div 
                      className={`relative p-2 rounded-full shadow-md border-2 bg-white transition-transform ${isHovered ? 'scale-110 shadow-xl' : 'scale-100'}`}
                      style={{ 
                          borderColor: device.color, 
                          color: device.color,
                          zIndex: 10
                      }}
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                      <path d={device.icon} />
                    </svg>
                  </div>

                  {/* Tooltip */}
                  {isHovered && (
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-3 w-56 bg-slate-900 text-white text-xs rounded-lg py-3 px-4 shadow-xl z-50 pointer-events-none text-left border border-slate-700">
                      <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45 border-l border-t border-slate-700"></div>
                      <div className="font-bold text-sm text-slate-100">{device.name}</div>
                      <div className="mt-1 mb-2 text-slate-300 leading-relaxed">{placement.reason}</div>
                      <div className="flex items-center gap-3 pt-2 border-t border-slate-700 text-[10px] text-slate-400 font-mono">
                          {isDirectional ? (
                            <>
                                <span className="bg-slate-800 px-1.5 py-0.5 rounded">FOV: {viewAngle}°</span>
                                <span className="bg-slate-800 px-1.5 py-0.5 rounded">DIR: {orientation}°</span>
                            </>
                          ) : (
                              <span className="bg-slate-800 px-1.5 py-0.5 rounded">360° Coverage</span>
                          )}
                      </div>
                    </div>
                  )}

                  {/* Remove Button */}
                  {isHovered && (
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            onRemovePlacement(placement.id);
                        }}
                        className="absolute -top-2 -right-2 bg-white text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full w-5 h-5 flex items-center justify-center shadow-sm border border-slate-200 transition-colors z-50"
                        title="Remove Device"
                    >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FloorPlanCanvas;