import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Task, TaskStatus, TaskPriority } from '../../../types';
import { buildDependencyGraph, getBlockedTasksFromGraph, getAvailableTasksFromGraph } from '../../utils/dependencyUtils';

interface DependencyGraphViewProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  selectedTaskId?: string;
  className?: string;
}

interface GraphNode {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  x: number;
  y: number;
  isBlocked: boolean;
  isAvailable: boolean;
}

interface GraphEdge {
  from: string;
  to: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

const DependencyGraphView: React.FC<DependencyGraphViewProps> = ({
  tasks,
  onTaskClick,
  selectedTaskId,
  className = ''
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Build dependency graph
  const dependencyGraph = useMemo(() => buildDependencyGraph(tasks), [tasks]);
  const blockedTasks = useMemo(() => getBlockedTasksFromGraph(dependencyGraph), [dependencyGraph]);
  const availableTasks = useMemo(() => getAvailableTasksFromGraph(dependencyGraph), [dependencyGraph]);

  // Layout algorithm - simple force-directed layout
  const { nodes, edges } = useMemo(() => {
    // const taskMap = new Map(tasks.map(t => [t.id, t])); // unused for now
    const nodePositions = new Map<string, { x: number; y: number }>();
    
    // Initialize positions randomly
    tasks.forEach((task, index) => {
      const angle = (index * 2 * Math.PI) / tasks.length;
      const radius = Math.min(dimensions.width, dimensions.height) * 0.3;
      const centerX = dimensions.width / 2;
      const centerY = dimensions.height / 2;
      
      nodePositions.set(task.id, {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle)
      });
    });

    // Simple force-directed layout (simplified)
    for (let iteration = 0; iteration < 50; iteration++) {
      const forces = new Map<string, { fx: number; fy: number }>();
      
      // Initialize forces
      tasks.forEach(task => {
        forces.set(task.id, { fx: 0, fy: 0 });
      });

      // Repulsion forces between all nodes
      tasks.forEach(taskA => {
        tasks.forEach(taskB => {
          if (taskA.id !== taskB.id) {
            const posA = nodePositions.get(taskA.id)!;
            const posB = nodePositions.get(taskB.id)!;
            const dx = posA.x - posB.x;
            const dy = posA.y - posB.y;
            const distance = Math.sqrt(dx * dx + dy * dy) || 1;
            const force = 1000 / (distance * distance);
            
            const forceA = forces.get(taskA.id)!;
            forceA.fx += (dx / distance) * force;
            forceA.fy += (dy / distance) * force;
          }
        });
      });

      // Attraction forces for dependencies
      dependencyGraph.edges.forEach(edge => {
        const posFrom = nodePositions.get(edge.from)!;
        const posTo = nodePositions.get(edge.to)!;
        const dx = posTo.x - posFrom.x;
        const dy = posTo.y - posFrom.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = distance * 0.01;
        
        const forceFrom = forces.get(edge.from)!;
        const forceTo = forces.get(edge.to)!;
        
        forceFrom.fx += (dx / distance) * force;
        forceFrom.fy += (dy / distance) * force;
        forceTo.fx -= (dx / distance) * force;
        forceTo.fy -= (dy / distance) * force;
      });

      // Apply forces
      tasks.forEach(task => {
        const pos = nodePositions.get(task.id)!;
        const force = forces.get(task.id)!;
        
        pos.x += force.fx * 0.1;
        pos.y += force.fy * 0.1;
        
        // Keep within bounds
        pos.x = Math.max(50, Math.min(dimensions.width - 50, pos.x));
        pos.y = Math.max(50, Math.min(dimensions.height - 50, pos.y));
      });
    }

    // Create nodes
    const graphNodes: GraphNode[] = tasks.map(task => {
      const pos = nodePositions.get(task.id)!;
      const graphNode = dependencyGraph.nodes.get(task.id);
      
      return {
        id: task.id,
        title: task.title,
        status: task.status,
        priority: task.priority,
        x: pos.x,
        y: pos.y,
        isBlocked: graphNode?.isBlocked || false,
        isAvailable: graphNode?.isAvailable || false
      };
    });

    // Create edges
    const graphEdges: GraphEdge[] = dependencyGraph.edges.map(edge => {
      const fromPos = nodePositions.get(edge.from)!;
      const toPos = nodePositions.get(edge.to)!;
      
      return {
        from: edge.from,
        to: edge.to,
        fromX: fromPos.x,
        fromY: fromPos.y,
        toX: toPos.x,
        toY: toPos.y
      };
    });

    return { nodes: graphNodes, edges: graphEdges };
  }, [tasks, dependencyGraph, dimensions]);

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const getNodeColor = (node: GraphNode) => {
    if (node.status === TaskStatus.COMPLETED) return '#10b981'; // green
    if (node.isBlocked) return '#ef4444'; // red
    if (node.priority === TaskPriority.URGENT) return '#f59e0b'; // amber
    if (node.priority === TaskPriority.HIGH) return '#f97316'; // orange
    if (node.priority === TaskPriority.MEDIUM) return '#3b82f6'; // blue
    return '#6b7280'; // gray
  };

  const getNodeStroke = (node: GraphNode) => {
    if (selectedTaskId === node.id) return '#0ea5e9'; // sky blue
    if (hoveredNode === node.id) return '#ffffff';
    return getNodeColor(node);
  };

  const getEdgeColor = (edge: GraphEdge) => {
    const fromNode = nodes.find(n => n.id === edge.from);
    const toNode = nodes.find(n => n.id === edge.to);
    
    if (toNode?.isBlocked) return '#ef4444'; // red for blocked dependencies
    if (fromNode?.status === TaskStatus.COMPLETED) return '#10b981'; // green for completed dependencies
    return '#64748b'; // slate
  };

  const handleNodeClick = (node: GraphNode) => {
    const task = tasks.find(t => t.id === node.id);
    if (task && onTaskClick) {
      onTaskClick(task);
    }
  };

  const calculateArrowPath = (edge: GraphEdge) => {
    const dx = edge.toX - edge.fromX;
    const dy = edge.toY - edge.fromY;
    const length = Math.sqrt(dx * dx + dy * dy);
    const unitX = dx / length;
    const unitY = dy / length;
    
    // Offset from node centers
    const nodeRadius = 20;
    const startX = edge.fromX + unitX * nodeRadius;
    const startY = edge.fromY + unitY * nodeRadius;
    const endX = edge.toX - unitX * nodeRadius;
    const endY = edge.toY - unitY * nodeRadius;
    
    return { startX, startY, endX, endY, unitX, unitY };
  };

  return (
    <div className={`relative bg-slate-900 rounded-lg border border-slate-700 ${className}`}>
      <div className="p-4 border-b border-slate-700">
        <h3 className="text-lg font-medium text-slate-200 mb-2">Task Dependency Graph</h3>
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-slate-400">Completed ({tasks.filter(t => t.status === TaskStatus.COMPLETED).length})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-slate-400">Blocked ({blockedTasks.length})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-slate-400">Available ({availableTasks.length})</span>
          </div>
        </div>
      </div>
      
      <div className="relative overflow-hidden" style={{ height: '600px' }}>
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          className="absolute inset-0"
        >
          {/* Arrow marker definition */}
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3.5, 0 7"
                fill="#64748b"
              />
            </marker>
          </defs>
          
          {/* Edges */}
          {edges.map((edge, index) => {
            const { startX, startY, endX, endY } = calculateArrowPath(edge);
            const color = getEdgeColor(edge);
            
            return (
              <line
                key={`${edge.from}-${edge.to}-${index}`}
                x1={startX}
                y1={startY}
                x2={endX}
                y2={endY}
                stroke={color}
                strokeWidth="2"
                markerEnd="url(#arrowhead)"
                opacity={hoveredNode && (hoveredNode === edge.from || hoveredNode === edge.to) ? 1 : 0.6}
              />
            );
          })}
          
          {/* Nodes */}
          {nodes.map(node => (
            <g key={node.id}>
              <circle
                cx={node.x}
                cy={node.y}
                r="20"
                fill={getNodeColor(node)}
                stroke={getNodeStroke(node)}
                strokeWidth={selectedTaskId === node.id ? "3" : "2"}
                className="cursor-pointer transition-all duration-200"
                onClick={() => handleNodeClick(node)}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                opacity={hoveredNode && hoveredNode !== node.id ? 0.5 : 1}
              />
              
              {/* Node label */}
              <text
                x={node.x}
                y={node.y + 35}
                textAnchor="middle"
                className="text-xs fill-slate-300 pointer-events-none"
                fontSize="11"
              >
                {node.title.length > 15 ? `${node.title.substring(0, 15)}...` : node.title}
              </text>
              
              {/* Status indicators */}
              {node.isBlocked && (
                <text
                  x={node.x}
                  y={node.y + 5}
                  textAnchor="middle"
                  className="text-xs fill-white pointer-events-none font-bold"
                  fontSize="10"
                >
                  !
                </text>
              )}
              
              {node.status === TaskStatus.COMPLETED && (
                <text
                  x={node.x}
                  y={node.y + 5}
                  textAnchor="middle"
                  className="text-xs fill-white pointer-events-none font-bold"
                  fontSize="10"
                >
                  ✓
                </text>
              )}
            </g>
          ))}
        </svg>
        
        {/* Tooltip */}
        {hoveredNode && (
          <div className="absolute top-4 left-4 bg-slate-800 border border-slate-600 p-3 rounded-lg shadow-lg z-10">
            {(() => {
              const node = nodes.find(n => n.id === hoveredNode);
              const task = tasks.find(t => t.id === hoveredNode);
              if (!node || !task) return null;
              
              return (
                <div className="space-y-1 text-sm">
                  <div className="font-medium text-slate-200">{task.title}</div>
                  <div className="text-slate-400">Priority: {task.priority}</div>
                  <div className="text-slate-400">Status: {task.status.replace('-', ' ')}</div>
                  {task.due_date && (
                    <div className="text-slate-400">Due: {new Date(task.due_date).toLocaleDateString()}</div>
                  )}
                  <div className="text-slate-400">Dependencies: {task.dependencies.length}</div>
                  {node.isBlocked && (
                    <div className="text-red-400 font-medium">⚠ Blocked</div>
                  )}
                  {node.isAvailable && (
                    <div className="text-green-400 font-medium">✓ Available</div>
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </div>
      
      {tasks.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-slate-500">
            <p className="text-lg font-medium">No tasks to display</p>
            <p className="text-sm mt-1">Create some tasks to see the dependency graph</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DependencyGraphView; 