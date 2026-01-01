# UI Design Editor - Architecture & Documentation

## Overview

This is a **Figma/Adobe XD-style UI design editor** built entirely in the browser. It runs 100% client-side with no backend requirements, using local storage and IndexedDB for persistence.

## Tech Stack

- **React 18** with **Vite** for fast development
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Zustand** with **Immer** for state management
- **Konva.js** (react-konva) for canvas rendering
- **IndexedDB** (idb-keyval) for local storage
- **File System Access API** for native file operations

## Architecture

### State Management

The editor uses **Zustand** with **Immer** middleware for immutable state updates:

```
src/store/editor-store.ts
```

**State Structure:**

- `project`: Current project data (pages, elements)
- `currentPageId`: Active page
- `selectedElementIds`: Currently selected elements
- `tool`: Active tool (select, frame, rectangle, etc.)
- `zoom`: Canvas zoom level (10-500%)
- `pan`: Canvas pan position
- `history`: Undo/redo stack

### Component Structure

```
src/
├── components/editor/
│   ├── CanvasEditor.tsx      # Main canvas with Konva
│   ├── LayersPanel.tsx       # Left sidebar (layers & pages)
│   ├── PropertiesPanel.tsx   # Right sidebar (element properties)
│   └── Toolbar.tsx           # Bottom toolbar (tools & actions)
├── pages/pro/
│   └── UIEditor.tsx          # Main editor page
├── store/
│   └── editor-store.ts      # Zustand store
├── types/
│   └── editor.ts            # TypeScript definitions
└── lib/
    ├── editor-utils.ts      # Utility functions
    └── file-system.ts       # File save/load operations
```

## File Format (.uix)

The `.uix` file is a JSON-based format:

```json
{
  "id": "project-id",
  "name": "Project Name",
  "pages": [
    {
      "id": "page-id",
      "name": "Page 1",
      "elements": [
        {
          "id": "element-id",
          "type": "rectangle",
          "name": "Rectangle",
          "transform": {
            "x": 100,
            "y": 100,
            "width": 200,
            "height": 150,
            "rotation": 0,
            "opacity": 1
          },
          "fill": {
            "type": "solid",
            "color": "#3b82f6"
          },
          "stroke": {
            "color": "#000000",
            "width": 0
          },
          "borderRadius": 0,
          "visible": true,
          "locked": false
        }
      ]
    }
  ],
  "createdAt": 1234567890,
  "updatedAt": 1234567890
}
```

## Core Features

### ✅ Canvas Editor

- Infinite canvas with zoom (10-500%) and pan
- Grid overlay (toggleable)
- Snap-to-grid
- Multi-select support
- Drag & drop elements
- Resize & rotate with transformer

### ✅ Layer System

- Hierarchical layer tree
- Page management (multiple screens)
- Show/hide layers
- Lock/unlock layers
- Inline renaming
- Drag-to-reorder (future)

### ✅ Element Types

- **Frame**: Container with preset sizes (mobile, tablet, desktop)
- **Rectangle**: Basic rectangle shape
- **Ellipse**: Circle/ellipse shape
- **Text**: Text element with styling
- **Image**: Image element with fit modes
- **Group**: Container for multiple elements

### ✅ Properties Panel

- **Layout**: Position (X, Y), Size (W, H), Rotation, Opacity
- **Style**: Fill color, Stroke, Border radius, Shadows
- **Text**: Font family, size, weight, alignment, content
- **Image**: Replace image, fit mode

### ✅ Tools

- **Select**: Select and move elements
- **Frame**: Create frame containers
- **Rectangle**: Draw rectangles
- **Ellipse**: Draw ellipses
- **Text**: Add text elements
- **Image**: Upload and place images
- **Hand**: Pan the canvas

### ✅ File Operations

- **Autosave**: Automatically saves to IndexedDB every 30 seconds
- **Save**: Export to `.uix` file (File System Access API or download)
- **Load**: Import `.uix` file
- **Export**: PNG, SVG, HTML/CSS (future)

### ✅ Keyboard Shortcuts

- `Ctrl/Cmd + Z`: Undo
- `Ctrl/Cmd + Shift + Z`: Redo
- `Ctrl/Cmd + A`: Select all
- `Delete/Backspace`: Delete selected elements
- `Escape`: Clear selection

### ✅ Mobile Support

- Responsive layout with collapsible panels
- Touch gestures (pinch zoom, pan)
- Mobile-optimized UI with sheets/drawers
- Floating property panel

## Performance Optimizations

1. **Memoization**: Canvas elements are memoized to prevent unnecessary re-renders
2. **Throttled Updates**: Drag and resize events are throttled
3. **Virtualization**: Layer list could be virtualized for large projects (future)
4. **RequestAnimationFrame**: Canvas updates use RAF for smooth animations
5. **History Limit**: Undo/redo stack limited to 50 states

## Usage

### Starting the Editor

1. Navigate to `/pro` route
2. Editor automatically creates a new project or loads autosaved project
3. Use tools from bottom toolbar to create elements
4. Select elements to edit properties in right panel
5. Manage layers in left panel

### Creating Elements

1. Select a tool (rectangle, ellipse, text, etc.)
2. Click on canvas to place element
3. Select element to edit properties

### Managing Pages

1. Click "+" button in layers panel header
2. Switch between pages by clicking page name
3. Delete pages (minimum 1 page required)

### Saving Projects

- **Autosave**: Automatically saves to IndexedDB
- **Manual Save**: Click "Save" in toolbar to export `.uix` file
- **Load**: Click "Load" to import `.uix` file

## Future Enhancements

### Planned Features

- [ ] Export to PNG/SVG
- [ ] Export to HTML/CSS
- [ ] Gradient fills
- [ ] Layer drag-to-reorder
- [ ] Smart guides (snap to other elements)
- [ ] Copy/paste elements
- [ ] Group/ungroup elements
- [ ] Align & distribute tools
- [ ] Text editing on canvas
- [ ] Image filters/effects
- [ ] Component library
- [ ] Templates

### Performance Improvements

- [ ] Virtualize layer list for large projects
- [ ] Web Workers for heavy operations
- [ ] Canvas rendering optimization
- [ ] Lazy loading of images

## Development

### Running Locally

```bash
npm install
npm run dev
```

### Building

```bash
npm run build
```

### Type Checking

```bash
npm run check
```

## Browser Support

- **Chrome/Edge**: Full support (File System Access API)
- **Firefox**: Full support (fallback to download)
- **Safari**: Full support (fallback to download)
- **Mobile**: Full support with touch gestures

## Notes

- All data is stored locally - no server required
- Projects are saved to IndexedDB automatically
- File System Access API provides native file picker (Chrome/Edge)
- Falls back to download/upload for other browsers
- No authentication required for core usage

## License

MIT
