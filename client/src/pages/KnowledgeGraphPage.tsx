import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Share2,
  Sparkles,
  Search,
  Filter,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  BookOpen,
  ArrowRight,
  Layers,
  User,
  Building2,
  CheckCircle2,
  Info,
} from 'lucide-react';
import api from '../services/api';
import { GraphNode, GraphLink } from '../types';

export const KnowledgeGraphPage: React.FC = () => {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [links, setLinks] = useState<GraphLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('ALL');
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const svgRef = useRef<SVGSVGElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchGraph = async () => {
      try {
        setLoading(true);
        const res = await api.get('/ai/knowledge-graph');
        if (res.data.success) {
          const rawNodes: GraphNode[] = res.data.nodes || [];
          const rawLinks: GraphLink[] = res.data.links || [];

          // Initialize circular or force layout coordinates
          const width = 900;
          const height = 600;
          const centerX = width / 2;
          const centerY = height / 2;

          const initializedNodes = rawNodes.map((node, i) => {
            let radius = 180;
            if (node.type === 'department') radius = 70;
            else if (node.type === 'author') radius = 170;
            else radius = 270;

            const angle = (i / rawNodes.length) * 2 * Math.PI + (Math.random() * 0.2);
            return {
              ...node,
              x: centerX + radius * Math.cos(angle) + (Math.random() - 0.5) * 40,
              y: centerY + radius * Math.sin(angle) + (Math.random() - 0.5) * 40,
            };
          });

          setNodes(initializedNodes);
          setLinks(rawLinks);
        }
      } catch (err) {
        console.error('Knowledge graph fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchGraph();
  }, []);

  // Filtered nodes
  const filteredNodes = nodes.filter((n) => {
    const matchesDept =
      selectedDeptFilter === 'ALL' ||
      n.group === selectedDeptFilter ||
      n.label === selectedDeptFilter;
    const matchesSearch =
      !searchQuery ||
      n.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (n.fullTitle && n.fullTitle.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesDept && matchesSearch;
  });

  const filteredNodeIds = new Set(filteredNodes.map((n) => n.id));

  // Filter links where both source and target are visible
  const filteredLinks = links.filter((l) => {
    const srcId = typeof l.source === 'string' ? l.source : l.source.id;
    const tgtId = typeof l.target === 'string' ? l.target : l.target.id;
    return filteredNodeIds.has(srcId) && filteredNodeIds.has(tgtId);
  });

  const getNodeColor = (node: GraphNode) => {
    if (node.type === 'department') return '#4f46e5'; // Indigo
    if (node.type === 'author') return '#059669'; // Emerald
    return '#2563eb'; // Brand Blue
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === svgRef.current || (e.target as HTMLElement).tagName === 'rect') {
      setIsDraggingCanvas(true);
      setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingCanvas) {
      setPanOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDraggingCanvas(false);
  };

  const departmentsList = Array.from(
    new Set(nodes.filter((n) => n.type === 'department').map((n) => n.label))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-brand-950 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden border border-brand-900/40">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 border border-brand-400/30 text-brand-300 text-xs font-bold uppercase mb-4 tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            2D Interactive Entity Graph
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-3">
            Library Knowledge & Curriculum Graph
          </h1>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Explore interconnected clusters between departments, key authors, textbook prerequisites, and specialized research subjects across our catalog.
          </p>
        </div>
      </div>

      {/* Graph Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search author, book, or subject node..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Department Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedDeptFilter}
            onChange={(e) => setSelectedDeptFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
          >
            <option value="ALL">All Departments</option>
            {departmentsList.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.2))}
            className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold px-1 text-slate-600 dark:text-slate-300">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            onClick={() => setZoomLevel((z) => Math.max(0.4, z - 0.2))}
            className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setZoomLevel(1);
              setPanOffset({ x: 0, y: 0 });
            }}
            className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
            title="Reset View"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Canvas & Inspector Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left 3 cols: Interactive Graph Viewer */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-sm relative overflow-hidden h-[620px]">
          {/* Legend */}
          <div className="absolute top-6 left-6 z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-md flex flex-wrap gap-3 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-indigo-600" />
              <span>Department Node</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-600" />
              <span>Author Node</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-blue-600" />
              <span>Textbook Node</span>
            </div>
          </div>

          {loading ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-slate-400">
              <RotateCcw className="w-8 h-8 animate-spin text-brand-600" />
              <p className="text-sm font-semibold">Constructing Knowledge Graph nodes...</p>
            </div>
          ) : (
            <svg
              ref={svgRef}
              className="w-full h-full cursor-grab active:cursor-grabbing select-none"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
            >
              <rect width="100%" height="100%" fill="transparent" />

              <g
                transform={`translate(${panOffset.x}, ${panOffset.y}) scale(${zoomLevel})`}
                className="transition-transform duration-75"
              >
                {/* Render Links */}
                {filteredLinks.map((link, idx) => {
                  const srcNode = nodes.find(
                    (n) => n.id === (typeof link.source === 'string' ? link.source : link.source.id)
                  );
                  const tgtNode = nodes.find(
                    (n) => n.id === (typeof link.target === 'string' ? link.target : link.target.id)
                  );

                  if (!srcNode || !tgtNode || srcNode.x === undefined || tgtNode.x === undefined) {
                    return null;
                  }

                  return (
                    <line
                      key={idx}
                      x1={srcNode.x}
                      y1={srcNode.y}
                      x2={tgtNode.x}
                      y2={tgtNode.y}
                      stroke="#94a3b8"
                      strokeOpacity="0.35"
                      strokeWidth="1.2"
                    />
                  );
                })}

                {/* Render Nodes */}
                {filteredNodes.map((node) => {
                  const isSelected = selectedNode?.id === node.id;
                  const nodeRadius = node.val || 16;
                  const color = getNodeColor(node);

                  return (
                    <g
                      key={node.id}
                      transform={`translate(${node.x || 0}, ${node.y || 0})`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedNode(node);
                      }}
                      className="cursor-pointer group"
                    >
                      {/* Selection Glow */}
                      {isSelected && (
                        <circle
                          r={nodeRadius + 6}
                          fill="none"
                          stroke={color}
                          strokeWidth="3"
                          strokeDasharray="4 2"
                          className="animate-spin"
                        />
                      )}

                      <circle
                        r={nodeRadius}
                        fill={color}
                        className="transition-transform duration-200 group-hover:scale-110 shadow-lg"
                      />

                      <text
                        dy={nodeRadius + 12}
                        textAnchor="middle"
                        className="text-[10px] font-bold fill-slate-700 dark:fill-slate-300 pointer-events-none group-hover:fill-brand-600 transition-colors"
                      >
                        {node.label}
                      </text>
                    </g>
                  );
                })}
              </g>
            </svg>
          )}
        </div>

        {/* Right 1 col: Node Inspector Sidebar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <Info className="w-5 h-5 text-brand-600" />
              Entity Inspector
            </h3>

            {selectedNode ? (
              <div className="space-y-4 animate-in fade-in">
                {/* Node type badge */}
                <span
                  className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase"
                  style={{
                    backgroundColor: `${getNodeColor(selectedNode)}20`,
                    color: getNodeColor(selectedNode),
                  }}
                >
                  {selectedNode.type} Entity
                </span>

                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-base leading-snug">
                    {selectedNode.fullTitle || selectedNode.label}
                  </h4>
                  {selectedNode.author && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      By {selectedNode.author}
                    </p>
                  )}
                  {selectedNode.department && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Department: {selectedNode.department}
                    </p>
                  )}
                </div>

                {selectedNode.type === 'book' && selectedNode.bookId && (
                  <div className="pt-2">
                    <button
                      onClick={() => navigate(`/book/${selectedNode.bookId}`)}
                      className="w-full py-2.5 px-4 bg-brand-600 hover:bg-brand-700 active:scale-98 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                    >
                      View in Catalog <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-slate-400 space-y-2">
                <Share2 className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                <p className="text-xs font-medium">
                  Click on any node in the knowledge network to inspect its relationships and metadata.
                </p>
              </div>
            )}
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 text-[11px] text-slate-500 dark:text-slate-400">
            💡 <strong>Tip:</strong> Drag to pan across the graph. Use mouse wheel or the zoom buttons to explore dense subject clusters.
          </div>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeGraphPage;
