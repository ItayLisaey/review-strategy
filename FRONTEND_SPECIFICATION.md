# PR Review Strategy Frontend Technical Specification

## Overview

The PR Review Strategy frontend is a React-based interactive visualization tool for analyzing GitHub pull request dependencies and providing an optimal file review order. The application presents a dual-pane interface with a dependency graph visualization and a file review sidebar.

## System Architecture

### Data Flow

```
CLI Analysis → JSON Data File → React App → UI Components
```

### Component Hierarchy

```
App
├── DependencyGraph (vis-network integration)
├── FileList (sidebar container)
│   └── FileItem[] (individual file cards)
└── ProgressBar (review completion tracking)
```

## Core Data Structures

### DependencyGraphData

```typescript
interface DependencyGraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

interface GraphNode {
  id: string; // Unique file identifier (full path)
  label: string; // Display name (filename only)
  title: string; // Tooltip text with metadata
  additions: number; // Lines added (+)
  deletions: number; // Lines deleted (-)
  path: string; // Full file path
  childrenCount: number; // Number of dependent files
}

interface GraphEdge {
  from: string; // Source node ID
  to: string; // Target node ID
}
```

## User Interface Specification

### Layout

- **Viewport**: Full screen (100vh) with horizontal split
- **Left Pane**: Dependency graph visualization (flex: 1)
- **Right Pane**: File review sidebar (fixed width: 320px)

### Graph Visualization (Left Pane)

#### Visual Design

- **Background**: Gradient from slate-600 to slate-700
- **Grid Pattern**: Dual-layer radial gradients for depth
  - Primary: 20px grid with 12% opacity
  - Secondary: 40px grid with 6% opacity
- **Layout**: Hierarchical top-down arrangement

#### Node Appearance

Nodes must visually match sidebar file items:

- **Shape**: Rounded rectangle (12px border-radius)
- **Background**: `rgba(226, 232, 240, 0.05)` with blur effect
- **Border**: `rgba(226, 232, 240, 0.1)` 1px solid
- **Dimensions**: 140-200px width, 80-120px height
- **Typography**: Inter font family, consistent with sidebar

#### Node Content Structure

```
┌─────────────────────────────────┐
│ filename.ext                    │  ← Label (12px, #e2e8f0)
│ full/path/to/file               │  ← Path (9px, #a0aec0)
│                                 │
│ +XX  -YY            ZZ children │  ← Stats (10px)
└─────────────────────────────────┘
```

#### Interaction States

- **Default**: Semi-transparent with subtle border
- **Hover**: Increased opacity, enhanced border
- **Selected**: Green accent color family
- **Highlighted**: Synchronized with sidebar selection

#### Edge Styling

- **Color**: `rgba(160, 174, 192, 0.6)` base
- **Width**: 2px
- **Arrows**: Directional indicators (0.8 scale)
- **Animation**: Smooth curves with dynamic routing

### File Review Sidebar (Right Pane)

#### Header Section

- **Title**: "Files Review" (18px, semibold)
- **Progress Bar**: Visual completion indicator
  - Total files count display
  - Percentage-based fill animation
  - Green gradient fill color

#### File List Section

- **Container**: Scrollable vertical list
- **Spacing**: 8px gap between items
- **Scroll Behavior**: Smooth, with custom styled scrollbar

#### File Item Cards

Each file item displays:

```
┌─[☐]─filename.ext──────────────────┐
│    full/path/to/file               │
│                                    │
│    +XX  -YY            ZZ children │
└────────────────────────────────────┘
```

#### Card States

- **Default**: Subtle background with transparency
- **Hovered**: Enhanced background, slight elevation
- **Checked**: Green accent background and border
- **Highlighted**: Green ring with increased prominence

#### Interactive Elements

- **Checkbox**: Custom styled with check icon
- **Click Area**: Full card clickable for selection
- **Scroll Sync**: Auto-scroll to highlighted items

## Behavioral Specifications

### Graph Interaction Behaviors

#### Node Selection

1. **Click Event**: Select node and notify sidebar
2. **Focus Animation**: Smooth zoom to 1.2x scale (600ms)
3. **Highlight Sync**: Update sidebar highlight state
4. **Deselection**: Click empty space clears selection

#### Navigation Controls

- **Zoom**: Mouse wheel or pinch gestures
- **Pan**: Click and drag background
- **Reset**: Double-click background to fit all nodes

### Sidebar Interaction Behaviors

#### File Selection

1. **Click Event**: Highlight file and notify graph
2. **Graph Sync**: Graph focuses on corresponding node
3. **Scroll Behavior**: Auto-scroll to keep item visible
4. **State Persistence**: Maintain selection across interactions

#### Progress Tracking

1. **Checkbox Toggle**: Update completion state
2. **Progress Bar**: Real-time percentage update
3. **Visual Feedback**: Immediate state change animation
4. **Count Display**: "X / Y" format with current progress

### Synchronization Behaviors

#### Bidirectional Communication

- **Graph → Sidebar**: Node selection updates highlight
- **Sidebar → Graph**: File selection triggers focus
- **State Consistency**: Both views always show same selection

#### Animation Coordination

- **Selection Changes**: 600ms coordinated transitions
- **Smooth Scrolling**: Automatic viewport adjustments
- **Focus Timing**: Delayed scroll after graph animation

## Performance Requirements

### Rendering Optimization

- **Large Datasets**: Support 100+ nodes efficiently
- **Smooth Animations**: 60fps for all transitions
- **Memory Management**: Proper cleanup on unmount

### React Flow Integration

- **React Flow**: Native React component-based graph rendering
- **Dagre Layout**: Automatic hierarchical positioning algorithm
- **Custom Nodes**: FileNode components matching sidebar design
- **Interactive Controls**: Built-in zoom, pan, and fit-view controls
- **Layout Constraints**: Automatic collision detection and spacing
- **Edge Routing**: Smooth bezier curves with directional arrows

## Data Loading and Error Handling

### Loading States

- **Initial Load**: Spinner with descriptive text
- **Empty Data**: Graceful handling of no files
- **Error States**: User-friendly error messages

### Data Validation

- **Schema Validation**: Ensure proper data structure
- **Fallback Behavior**: Handle missing or corrupt data
- **Error Recovery**: Attempt reload on network failures

## Accessibility Requirements

### Keyboard Navigation

- **Tab Order**: Logical focus progression
- **Enter/Space**: Activate selected elements
- **Arrow Keys**: Navigate between items

### Screen Reader Support

- **ARIA Labels**: Descriptive element labeling
- **Live Regions**: Announce state changes
- **Semantic HTML**: Proper heading hierarchy

## Technical Implementation Notes

### Technology Stack

- **React 19**: Component framework
- **TypeScript**: Type safety
- **Tailwind CSS**: Utility-first styling
- **React Flow**: Modern React-native graph visualization library
- **Dagre**: Automatic hierarchical layout algorithm

### State Management

- **Local State**: React useState for UI state
- **Props Drilling**: Parent-child communication
- **Event Handling**: Custom callback patterns

### File Structure

```
src/
├── components/
│   ├── DependencyGraph.tsx    # React Flow graph container
│   ├── FileNode.tsx          # Custom React Flow node component
│   ├── FileList.tsx          # Sidebar container
│   ├── FileItem.tsx          # Individual file cards
│   └── ProgressBar.tsx       # Progress indicator
├── utils/
│   └── layout.ts             # Dagre layout algorithms
├── types.ts                  # TypeScript definitions
└── App.tsx                   # Main application with ReactFlowProvider
```

This specification ensures a consistent, performant, and accessible user experience for PR review workflow optimization.
