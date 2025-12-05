import React, { useState, useRef, useEffect } from 'react';
import { SecurityStrategy, Placement, PlacementResponse, ChatMessage, DeviceSpec } from './types';
import { DEVICE_CATALOG } from './services/deviceCatalog';
import { analyzeFloorPlan, refinePlacements, fileToGenerativePart } from './services/geminiService';
import FloorPlanCanvas from './components/FloorPlanCanvas';

const App: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [base64Data, setBase64Data] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [strategy, setStrategy] = useState<SecurityStrategy>(SecurityStrategy.HIGHEST_SECURITY);
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [analysisText, setAnalysisText] = useState<string>("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const selectedFile = event.target.files[0];
      setFile(selectedFile);
      const src = URL.createObjectURL(selectedFile);
      setImageSrc(src);
      
      const b64 = await fileToGenerativePart(selectedFile);
      setBase64Data(b64);
      
      // Reset state for new plan
      setPlacements([]);
      setAnalysisText("");
      setChatHistory([]);
    }
  };

  const handleAnalysis = async () => {
    if (!base64Data) return;
    
    setIsLoading(true);
    try {
      setChatHistory(prev => [...prev, { role: 'user', text: `Analyze this floor plan with ${strategy} strategy.` }]);
      
      const result = await analyzeFloorPlan(base64Data, strategy);
      
      setPlacements(result.placements);
      setAnalysisText(result.analysis);
      setChatHistory(prev => [...prev, { 
        role: 'model', 
        text: result.analysis + "\n\nI have placed devices on the map based on your strategy.",
        isPlacementUpdate: true 
      }]);
    } catch (err) {
      console.error(err);
      setChatHistory(prev => [...prev, { role: 'model', text: "Sorry, I encountered an error analyzing the plan. Please check your API key or try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !base64Data) return;

    const userText = inputMessage;
    setInputMessage("");
    setChatHistory(prev => [...prev, { role: 'user', text: userText }]);
    setIsLoading(true);

    try {
      const result = await refinePlacements(base64Data, placements, chatHistory, userText);
      setPlacements(result.placements);
      setChatHistory(prev => [...prev, { 
        role: 'model', 
        text: "I've updated the plan based on your feedback. " + (result.analysis || ""),
        isPlacementUpdate: true
      }]);
    } catch (err) {
      console.error(err);
      setChatHistory(prev => [...prev, { role: 'model', text: "I couldn't process that request. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const removePlacement = (id: string) => {
    setPlacements(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden font-sans text-slate-900">
      {/* Sidebar - Controls & Chat */}
      <div className="w-1/3 min-w-[350px] max-w-md flex flex-col border-r border-slate-200 bg-white shadow-lg z-20">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 bg-slate-50">
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            SecurePlan AI
          </h1>
          <p className="text-sm text-slate-500 mt-1">Smart Security Design Assistant</p>
        </div>

        {/* Configuration */}
        <div className="p-4 space-y-4 overflow-y-auto border-b border-slate-100">
          {/* Upload */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">1. Upload Floor Plan</label>
            <input 
              type="file" 
              accept="image/*"
              onChange={handleFileUpload}
              className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors"
            />
          </div>

          {/* Strategy */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">2. Select Strategy</label>
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setStrategy(SecurityStrategy.HIGHEST_SECURITY)}
                className={`flex-1 py-2 px-3 text-xs font-medium rounded-md transition-all ${strategy === SecurityStrategy.HIGHEST_SECURITY ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Highest Security
              </button>
              <button
                onClick={() => setStrategy(SecurityStrategy.COST_EFFECTIVE)}
                className={`flex-1 py-2 px-3 text-xs font-medium rounded-md transition-all ${strategy === SecurityStrategy.COST_EFFECTIVE ? 'bg-white text-green-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Cost Effective
              </button>
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleAnalysis}
            disabled={!base64Data || isLoading}
            className={`w-full py-3 px-4 rounded-lg text-white font-semibold shadow-md transition-all transform active:scale-95 flex justify-center items-center gap-2
              ${!base64Data || isLoading ? 'bg-slate-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'}
            `}
          >
            {isLoading ? (
               <>
                 <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                 </svg>
                 Analyzing...
               </>
            ) : (
              'Generate Plan'
            )}
          </button>
        </div>

        {/* Chat / Analysis Output */}
        <div className="flex-1 flex flex-col min-h-0 bg-slate-50">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatHistory.length === 0 && (
              <div className="text-center text-slate-400 mt-10 text-sm">
                <p>Upload a plan and click generate to start.</p>
                <p className="mt-2 text-xs">AI will identify rooms and place devices automatically.</p>
              </div>
            )}
            {chatHistory.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-slate-700 border border-slate-100 rounded-bl-none'}`}>
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input */}
          <form onSubmit={handleChatSubmit} className="p-3 border-t border-slate-200 bg-white">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask to adjust placement..."
                disabled={!base64Data || isLoading}
                className="flex-1 border border-slate-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
              />
              <button 
                type="submit" 
                disabled={!inputMessage.trim() || isLoading}
                className="bg-slate-800 text-white rounded-full p-2 hover:bg-slate-900 disabled:opacity-50 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col relative bg-slate-200">
        
        {/* Toolbar / Legend */}
        <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-start pointer-events-none">
          <div className="bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-slate-200 pointer-events-auto max-w-2xl">
            <h3 className="text-xs font-bold uppercase text-slate-500 mb-2">Device Legend</h3>
            <div className="flex flex-wrap gap-3">
              {DEVICE_CATALOG.map(device => (
                <div key={device.id} className="flex items-center gap-2 group relative">
                   <div className="p-1 rounded-full text-white" style={{backgroundColor: device.color}}>
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d={device.icon}/></svg>
                   </div>
                   <span className="text-xs font-medium text-slate-700">{device.name}</span>
                   
                   {/* Tooltip for Legend */}
                   <div className="absolute bottom-full left-0 mb-2 w-48 bg-slate-800 text-white text-[10px] rounded p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                     <p className="font-bold">{device.type.toUpperCase()}</p>
                     <p>{device.specs.description}</p>
                     {device.specs.viewAngle && <p>FOV: {device.specs.viewAngle}°</p>}
                     {device.specs.range && <p>Range: {device.specs.range}m</p>}
                   </div>
                </div>
              ))}
            </div>
          </div>
          
          {placements.length > 0 && (
             <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full shadow border border-slate-200 pointer-events-auto">
               <span className="text-xs font-bold text-slate-600">Total Devices: {placements.length}</span>
             </div>
          )}
        </div>

        {/* Canvas */}
        <div className="flex-1 p-8 flex items-center justify-center overflow-auto">
          <div className="relative w-full h-full max-w-5xl max-h-[85vh] flex items-center justify-center">
            <FloorPlanCanvas 
              imageSrc={imageSrc} 
              placements={placements}
              onRemovePlacement={removePlacement}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
