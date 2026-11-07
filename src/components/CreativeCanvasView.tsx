import React, { useState, useRef, useEffect } from 'react';
import { MindMapNode, StickyNote, DrawStroke, Notebook } from '../types';
import {
  BrainCircuit, PenTool, Plus, Trash2, Download, Sparkles,
  BookOpen, RotateCcw, Palette, Layers, ZoomIn, ZoomOut, Check,
  ArrowRight, StickyNote as StickyNoteIcon, Eraser
} from 'lucide-react';

interface CreativeCanvasViewProps {
  notebooks: Notebook[];
  onCreateNotebookFromCanvas: (notebook: Notebook) => void;
  subjectOptions: string[];
}

export const CreativeCanvasView: React.FC<CreativeCanvasViewProps> = ({
  notebooks,
  onCreateNotebookFromCanvas,
  subjectOptions,
}) => {
  const [activeTab, setActiveTab] = useState<'mindmap' | 'whiteboard'>('mindmap');

  // ================= MIND MAP STATE =================
  const [rootNode, setRootNode] = useState<MindMapNode>({
    id: 'root',
    label: 'Prinsip Kedaulatan & Konstitusi',
    description: 'Pusat integrasi prinsip ketatanegaraan dan pemisahan kekuasaan.',
    color: '#EAE8E3',
    children: [
      {
        id: 'node-1',
        label: '1. Trias Politika Montesquieu',
        description: 'Pemisahan kekuasaan antara legislatif, eksekutif, dan yudikatif.',
        color: '#E8F0FE',
        children: [
          { id: 'node-1-1', label: 'Cabang Legislatif', description: 'Pembentukan undang-undang dan pengawasan.', color: '#E8F0FE' },
          { id: 'node-1-2', label: 'Cabang Eksekutif', description: 'Pelaksanaan kebijakan dan kepemimpinan negara.', color: '#E8F0FE' },
          { id: 'node-1-3', label: 'Cabang Yudikatif', description: 'Pengadilan dan penegakan hukum independen.', color: '#E8F0FE' },
        ],
      },
      {
        id: 'node-2',
        label: '2. Checks and Balances',
        description: 'Mekanisme saling mengawasi dan mengimbangi antar-institusi.',
        color: '#FEF7E0',
        children: [
          { id: 'node-2-1', label: 'Uji Materiil (Judicial Review)', description: 'Pengujian undang-undang oleh Mahkamah Konstitusi.', color: '#FEF7E0' },
          { id: 'node-2-2', label: 'Hak Angket & Interpelasi', description: 'Instrumen kontrol parlemen terhadap pemerintah.', color: '#FEF7E0' },
        ],
      },
      {
        id: 'node-3',
        label: '3. Stabilitas Presidensial',
        description: 'Masa jabatan tetap (fixed term) dan akuntabilitas hukum.',
        color: '#E6F4EA',
        children: [
          { id: 'node-3-1', label: 'Fixed Term of Office', description: 'Kepastian periode kepemimpinan tanpa mosi tidak percaya.', color: '#E6F4EA' },
          { id: 'node-3-2', label: 'Prosedur Impeachment', description: 'Pembuktian yuridis atas pelanggaran hukum berat.', color: '#E6F4EA' },
        ],
      },
    ],
  });

  const [selectedNodeId, setSelectedNodeId] = useState<string>('root');
  const [mindmapPrompt, setMindmapPrompt] = useState('');
  const [selectedSourceNotebookId, setSelectedSourceNotebookId] = useState<string>('');
  const [isGeneratingMindmap, setIsGeneratingMindmap] = useState(false);
  const [isConvertingToNotebook, setIsConvertingToNotebook] = useState(false);
  const [convertFeedback, setConvertFeedback] = useState<string | null>(null);

  // Helper to find node
  const findNodeById = (node: MindMapNode, id: string): MindMapNode | null => {
    if (node.id === id) return node;
    if (node.children) {
      for (const child of node.children) {
        const found = findNodeById(child, id);
        if (found) return found;
      }
    }
    return null;
  };

  // Helper to update node
  const updateNodeRecursive = (
    node: MindMapNode,
    id: string,
    updater: (target: MindMapNode) => MindMapNode
  ): MindMapNode => {
    if (node.id === id) {
      return updater(node);
    }
    if (node.children) {
      return {
        ...node,
        children: node.children.map((child) => updateNodeRecursive(child, id, updater)),
      };
    }
    return node;
  };

  // Helper to delete node
  const deleteNodeRecursive = (node: MindMapNode, id: string): MindMapNode => {
    if (!node.children) return node;
    return {
      ...node,
      children: node.children
        .filter((child) => child.id !== id)
        .map((child) => deleteNodeRecursive(child, id)),
    };
  };

  const selectedNode = findNodeById(rootNode, selectedNodeId);

  // Add child to selected node
  const handleAddChildNode = () => {
    if (!selectedNodeId) return;
    const newChild: MindMapNode = {
      id: `node-${Date.now()}`,
      label: 'Cabang Konsep Baru',
      description: 'Deskripsi dan penjelasan konsep pendukung...',
      color: '#F4F3EE',
    };
    setRootNode((prev) =>
      updateNodeRecursive(prev, selectedNodeId, (target) => ({
        ...target,
        children: [...(target.children || []), newChild],
      }))
    );
    setSelectedNodeId(newChild.id);
  };

  // Delete selected node (cannot delete root)
  const handleDeleteSelectedNode = () => {
    if (selectedNodeId === rootNode.id) return;
    setRootNode((prev) => deleteNodeRecursive(prev, selectedNodeId));
    setSelectedNodeId(rootNode.id);
  };

  // Generate Mind Map with AI
  const handleGenerateMindmap = async (e: React.FormEvent) => {
    e.preventDefault();
    let topicToUse = mindmapPrompt.trim();
    let contentToUse = '';

    if (!topicToUse && selectedSourceNotebookId) {
      const nb = notebooks.find((n) => n.id === selectedSourceNotebookId);
      if (nb) {
        topicToUse = nb.title;
        contentToUse = nb.summary + '\n' + nb.sections.map((s) => s.title + ': ' + s.content).join('\n');
      }
    }

    if (!topicToUse) return;

    setIsGeneratingMindmap(true);
    try {
      const res = await fetch('/api/generate-mindmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topicToUse,
          sourceContent: contentToUse,
        }),
      });
      const data = await res.json();
      if (data.success && data.root) {
        setRootNode(data.root);
        setSelectedNodeId(data.root.id);
        setMindmapPrompt('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingMindmap(false);
    }
  };

  // Convert Mind Map to Notebook Studio Notebook
  const handleConvertMindmapToNotebook = async () => {
    setIsConvertingToNotebook(true);
    setConvertFeedback(null);
    try {
      const res = await fetch('/api/mindmap-to-notebook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rootNode,
          subject: subjectOptions[0] || 'Umum',
        }),
      });
      const data = await res.json();
      if (data.success && data.notebook) {
        onCreateNotebookFromCanvas(data.notebook);
        setConvertFeedback('Notebook berhasil dibuat dan tersimpan di Notebook Studio!');
        setTimeout(() => setConvertFeedback(null), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsConvertingToNotebook(false);
    }
  };

  // ================= WRITE BOARD / FREEFORM STATE =================
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [strokeColor, setStrokeColor] = useState<string>('#191918');
  const [strokeWidth, setStrokeWidth] = useState<number>(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokes, setStrokes] = useState<DrawStroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<DrawStroke | null>(null);

  // Sticky Notes on the Write Board
  const [stickyNotes, setStickyNotes] = useState<StickyNote[]>([
    {
      id: 'sticky-1',
      x: 60,
      y: 60,
      text: 'Ide Inti: Buat hubungan antara termodinamika dan laju reaksi kimia.',
      color: '#FEF7E0',
    },
    {
      id: 'sticky-2',
      x: 320,
      y: 80,
      text: 'Persamaan penting:\nΔG = ΔH - TΔS\nReaksi spontan bila ΔG < 0.',
      color: '#E8F0FE',
    },
  ]);

  // Redraw canvas
  useEffect(() => {
    if (activeTab !== 'whiteboard') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (const stroke of strokes) {
      if (stroke.points.length < 2) continue;
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    }

    if (currentStroke && currentStroke.points.length >= 2) {
      ctx.beginPath();
      ctx.strokeStyle = currentStroke.color;
      ctx.lineWidth = currentStroke.width;
      ctx.moveTo(currentStroke.points[0].x, currentStroke.points[0].y);
      for (let i = 1; i < currentStroke.points.length; i++) {
        ctx.lineTo(currentStroke.points[i].x, currentStroke.points[i].y);
      }
      ctx.stroke();
    }
  }, [strokes, currentStroke, activeTab]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    setCurrentStroke({
      color: tool === 'eraser' ? '#FBFBF9' : strokeColor,
      width: tool === 'eraser' ? 20 : strokeWidth,
      points: [{ x, y }],
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentStroke) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setCurrentStroke((prev) => (prev ? { ...prev, points: [...prev.points, { x, y }] } : null));
  };

  const handleMouseUp = () => {
    if (isDrawing && currentStroke) {
      setStrokes((prev) => [...prev, currentStroke]);
      setCurrentStroke(null);
    }
    setIsDrawing(false);
  };

  const handleClearWhiteboard = () => {
    setStrokes([]);
    setCurrentStroke(null);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const handleAddSticky = () => {
    const newSticky: StickyNote = {
      id: `sticky-${Date.now()}`,
      x: 100 + Math.random() * 200,
      y: 100 + Math.random() * 150,
      text: 'Catatan konsep baru...',
      color: ['#FEF7E0', '#E8F0FE', '#E6F4EA', '#FCE8E6'][Math.floor(Math.random() * 4)],
    };
    setStickyNotes((prev) => [...prev, newSticky]);
  };

  const handleDownloadWhiteboard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `webby_freeform_whiteboard_${Date.now()}.png`;
    a.click();
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-[#EAE8E3]">
        <div>
          <h1 className="text-2xl font-semibold text-[#191918]">Creative Canvas & Studio</h1>
          <p className="text-xs text-[#7A7874] mt-1 max-w-xl">
            Ruang eksplorasi visual terpadu: buat peta konsep hierarkis (Mind Map) dan whiteboard bebas (Freeform) yang dapat langsung dikonversi menjadi Notebook Studio.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 p-1 bg-[#EAE8E3] rounded-lg text-xs font-medium">
          <button
            onClick={() => setActiveTab('mindmap')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'mindmap'
                ? 'bg-white text-[#191918] shadow-2xs font-semibold'
                : 'text-[#646461] hover:text-[#191918]'
            }`}
          >
            <BrainCircuit className="w-4 h-4" />
            <span>Peta Konsep (Mind Map)</span>
          </button>
          <button
            onClick={() => setActiveTab('whiteboard')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'whiteboard'
                ? 'bg-white text-[#191918] shadow-2xs font-semibold'
                : 'text-[#646461] hover:text-[#191918]'
            }`}
          >
            <PenTool className="w-4 h-4" />
            <span>Whiteboard (Freeform)</span>
          </button>
        </div>
      </div>

      {/* ================= TAB A: MIND MAP STUDIO ================= */}
      {activeTab === 'mindmap' && (
        <div className="space-y-6">
          {/* AI Generator Bar & Convert to Notebook Action */}
          <div className="p-4 bg-white border border-[#EAE8E3] rounded-lg shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <form onSubmit={handleGenerateMindmap} className="flex-1 flex flex-wrap items-center gap-2">
              <input
                type="text"
                placeholder="Buat mind map dari topik baru... (e.g. Struktur Pasar Monopoli)"
                value={mindmapPrompt}
                onChange={(e) => setMindmapPrompt(e.target.value)}
                className="flex-1 min-w-[220px] px-3 py-1.5 text-xs bg-[#FAF9F6] border border-[#DDDCD6] rounded-md focus:outline-none focus:ring-1 focus:ring-[#191918]"
              />

              {notebooks.length > 0 && (
                <select
                  value={selectedSourceNotebookId}
                  onChange={(e) => {
                    setSelectedSourceNotebookId(e.target.value);
                    if (e.target.value) setMindmapPrompt('');
                  }}
                  className="px-2.5 py-1.5 text-xs bg-[#FAF9F6] border border-[#DDDCD6] rounded-md text-[#4A4946] focus:outline-none"
                >
                  <option value="">Atau ambil dari Notebook Studio...</option>
                  {notebooks.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.title}
                    </option>
                  ))}
                </select>
              )}

              <button
                type="submit"
                disabled={isGeneratingMindmap}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-[#191918] hover:bg-[#2C2C2A] disabled:opacity-50 rounded-md transition-colors shadow-2xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isGeneratingMindmap ? 'Menyusun...' : 'Generate AI'}</span>
              </button>
            </form>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleConvertMindmapToNotebook}
                disabled={isConvertingToNotebook}
                className="flex items-center gap-2 px-4 py-1.5 text-xs font-semibold text-[#191918] bg-[#EAE8E3] hover:bg-[#DDDCD6] rounded-md transition-colors shadow-2xs"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>{isConvertingToNotebook ? 'Mengonversi...' : 'Jadikan Notebook Studio'}</span>
              </button>
            </div>
          </div>

          {convertFeedback && (
            <div className="p-3 bg-[#E6F4EA] border border-[#CEEAD6] text-[#137333] text-xs rounded-md flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{convertFeedback}</span>
            </div>
          )}

          {/* Interactive Node Tree Canvas & Node Editor Split */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Visual Node Tree */}
            <div className="lg:col-span-8 bg-white border border-[#EAE8E3] rounded-xl p-6 min-h-[520px] shadow-2xs relative overflow-x-auto">
              <div className="space-y-6 min-w-[500px]">
                {/* Root Node */}
                <div className="flex items-center justify-center">
                  <div
                    onClick={() => setSelectedNodeId(rootNode.id)}
                    style={{ backgroundColor: rootNode.color || '#EAE8E3' }}
                    className={`cursor-pointer p-4 rounded-xl border max-w-sm text-center shadow-xs transition-all ${
                      selectedNodeId === rootNode.id
                        ? 'border-[#191918] ring-2 ring-[#191918]/20 scale-105'
                        : 'border-[#DDDCD6] hover:border-[#191918]'
                    }`}
                  >
                    <div className="text-xs font-bold text-[#191918]">{rootNode.label}</div>
                    {rootNode.description && (
                      <p className="text-[11px] text-[#4A4946] mt-1 leading-snug line-clamp-2">
                        {rootNode.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Level 1 Branches */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-[#F0EFEA]">
                  {(rootNode.children || []).map((branch) => (
                    <div key={branch.id} className="space-y-3">
                      <div
                        onClick={() => setSelectedNodeId(branch.id)}
                        style={{ backgroundColor: branch.color || '#E8F0FE' }}
                        className={`cursor-pointer p-3 rounded-lg border shadow-3xs transition-all ${
                          selectedNodeId === branch.id
                            ? 'border-[#191918] ring-2 ring-[#191918]/20'
                            : 'border-[#DDDCD6] hover:border-[#191918]'
                        }`}
                      >
                        <div className="text-xs font-semibold text-[#191918]">{branch.label}</div>
                        {branch.description && (
                          <p className="text-[10px] text-[#646461] mt-0.5 leading-snug">
                            {branch.description}
                          </p>
                        )}
                      </div>

                      {/* Level 2 Sub-branches */}
                      <div className="space-y-2 pl-3 border-l-2 border-[#EAE8E3]">
                        {(branch.children || []).map((sub) => (
                          <div
                            key={sub.id}
                            onClick={() => setSelectedNodeId(sub.id)}
                            style={{ backgroundColor: sub.color || '#FAF9F6' }}
                            className={`cursor-pointer p-2 rounded border text-xs shadow-3xs transition-all ${
                              selectedNodeId === sub.id
                                ? 'border-[#191918] ring-1 ring-[#191918]'
                                : 'border-[#EAE8E3] hover:border-[#DDDCD6]'
                            }`}
                          >
                            <div className="text-[11px] font-medium text-[#191918]">{sub.label}</div>
                            {sub.description && (
                              <p className="text-[10px] text-[#7A7874] mt-0.5 line-clamp-2">
                                {sub.description}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Selected Node Inspector & Actions */}
            <div className="lg:col-span-4 bg-white border border-[#EAE8E3] rounded-xl p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#F0EFEA]">
                <span className="text-xs font-semibold text-[#191918] uppercase tracking-wider">
                  Inspeksi Node Konsep
                </span>
                <span className="text-[10px] text-[#8C8A84]">
                  {selectedNode?.id === rootNode.id ? 'Root Topic' : 'Cabang Konsep'}
                </span>
              </div>

              {selectedNode ? (
                <div className="space-y-3.5">
                  <div>
                    <label className="text-[11px] font-medium text-[#7A7874] block mb-1">
                      Label / Nama Konsep
                    </label>
                    <input
                      type="text"
                      value={selectedNode.label}
                      onChange={(e) =>
                        setRootNode((prev) =>
                          updateNodeRecursive(prev, selectedNode.id, (t) => ({
                            ...t,
                            label: e.target.value,
                          }))
                        )
                      }
                      className="w-full px-3 py-1.5 text-xs bg-[#FAF9F6] border border-[#DDDCD6] rounded-md focus:outline-none focus:ring-1 focus:ring-[#191918]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-[#7A7874] block mb-1">
                      Penjelasan & Elaborasi
                    </label>
                    <textarea
                      rows={3}
                      value={selectedNode.description || ''}
                      onChange={(e) =>
                        setRootNode((prev) =>
                          updateNodeRecursive(prev, selectedNode.id, (t) => ({
                            ...t,
                            description: e.target.value,
                          }))
                        )
                      }
                      className="w-full p-2.5 text-xs bg-[#FAF9F6] border border-[#DDDCD6] rounded-md focus:outline-none focus:ring-1 focus:ring-[#191918] leading-relaxed"
                    />
                  </div>

                  {/* Accent Color Chooser */}
                  <div>
                    <label className="text-[11px] font-medium text-[#7A7874] block mb-1.5">
                      Warna Aksen Node
                    </label>
                    <div className="flex items-center gap-2">
                      {['#EAE8E3', '#E8F0FE', '#FEF7E0', '#E6F4EA', '#FCE8E6'].map((c) => (
                        <button
                          key={c}
                          onClick={() =>
                            setRootNode((prev) =>
                              updateNodeRecursive(prev, selectedNode.id, (t) => ({
                                ...t,
                                color: c,
                              }))
                            )
                          }
                          style={{ backgroundColor: c }}
                          className={`w-6 h-6 rounded-md border transition-transform ${
                            selectedNode.color === c ? 'border-[#191918] scale-110' : 'border-[#DDDCD6]'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Node Actions */}
                  <div className="pt-2 border-t border-[#F0EFEA] space-y-2">
                    <button
                      onClick={handleAddChildNode}
                      className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-white bg-[#191918] hover:bg-[#2C2C2A] rounded-md transition-colors shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah Sub-Cabang</span>
                    </button>

                    {selectedNode.id !== rootNode.id && (
                      <button
                        onClick={handleDeleteSelectedNode}
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-[#B43425] hover:bg-[#FDF0EE] border border-[#F5C2BC] rounded-md transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus Cabang Ini</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-[#8C8A84] py-8 text-center">
                  Klik node pada kanvas untuk mengedit label atau menambahkan cabang baru.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB B: WRITE BOARD (FREEFORM) ================= */}
      {activeTab === 'whiteboard' && (
        <div className="space-y-4">
          {/* Whiteboard Toolbar */}
          <div className="p-3 bg-white border border-[#EAE8E3] rounded-lg shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {/* Tool selector */}
              <div className="flex items-center gap-1 p-0.5 bg-[#EAE8E3] rounded-md text-xs">
                <button
                  onClick={() => setTool('pen')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded transition-colors ${
                    tool === 'pen' ? 'bg-white text-[#191918] shadow-2xs font-semibold' : 'text-[#646461]'
                  }`}
                >
                  <PenTool className="w-3.5 h-3.5" />
                  <span>Pena</span>
                </button>
                <button
                  onClick={() => setTool('eraser')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded transition-colors ${
                    tool === 'eraser' ? 'bg-white text-[#191918] shadow-2xs font-semibold' : 'text-[#646461]'
                  }`}
                >
                  <Eraser className="w-3.5 h-3.5" />
                  <span>Penghapus</span>
                </button>
              </div>

              {/* Color picker */}
              {tool === 'pen' && (
                <div className="flex items-center gap-1.5">
                  {['#191918', '#1A73E8', '#D93025', '#188038', '#F29900'].map((col) => (
                    <button
                      key={col}
                      onClick={() => setStrokeColor(col)}
                      style={{ backgroundColor: col }}
                      className={`w-5 h-5 rounded-full border transition-transform ${
                        strokeColor === col ? 'scale-125 border-white ring-2 ring-[#191918]' : 'border-transparent'
                      }`}
                    />
                  ))}
                </div>
              )}

              {/* Stroke width */}
              <div className="flex items-center gap-1 text-xs text-[#7A7874] ml-2">
                <span>Tebal:</span>
                <select
                  value={strokeWidth}
                  onChange={(e) => setStrokeWidth(Number(e.target.value))}
                  className="px-1.5 py-0.5 bg-[#FAF9F6] border border-[#DDDCD6] rounded text-xs"
                >
                  <option value={2}>2px</option>
                  <option value={4}>4px</option>
                  <option value={8}>8px</option>
                </select>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleAddSticky}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#191918] bg-[#FAF9F6] border border-[#DDDCD6] hover:bg-[#F2F1ED] rounded-md transition-colors"
              >
                <StickyNoteIcon className="w-3.5 h-3.5" />
                <span>+ Sticky Note</span>
              </button>

              <button
                onClick={handleClearWhiteboard}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#646461] hover:text-[#B43425] hover:bg-[#FDF0EE] rounded-md transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Bersihkan</span>
              </button>

              <button
                onClick={handleDownloadWhiteboard}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#191918] bg-white border border-[#DDDCD6] hover:bg-[#FAF9F6] rounded-md transition-colors shadow-3xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Gambar</span>
              </button>
            </div>
          </div>

          {/* Interactive Drawing & Sticky Canvas */}
          <div className="relative bg-[#FBFBF9] border border-[#EAE8E3] rounded-xl overflow-hidden shadow-2xs h-[560px]">
            {/* HTML5 Canvas Surface */}
            <canvas
              ref={canvasRef}
              width={1100}
              height={560}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className="absolute inset-0 w-full h-full cursor-crosshair"
            />

            {/* Floating Draggable-style Sticky Notes */}
            {stickyNotes.map((note, idx) => (
              <div
                key={note.id}
                style={{
                  top: `${note.y}px`,
                  left: `${note.x}px`,
                  backgroundColor: note.color,
                }}
                className="absolute w-52 p-3 rounded-lg shadow-sm border border-black/10 z-10 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase text-black/50">Sticky Note</span>
                  <button
                    onClick={() => setStickyNotes((prev) => prev.filter((_, i) => i !== idx))}
                    className="text-black/40 hover:text-black text-xs"
                  >
                    ×
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={note.text}
                  onChange={(e) => {
                    const updated = [...stickyNotes];
                    updated[idx] = { ...updated[idx], text: e.target.value };
                    setStickyNotes(updated);
                  }}
                  className="w-full text-xs bg-transparent border-none focus:outline-none resize-none text-[#191918] leading-snug"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
