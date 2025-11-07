# 🎨 Orange Data Mining Style Guide

## Design Philosophy

Based on the Orange Data Mining software, our widgets follow these principles:

### Core Design Elements:

1. **Simple Icon Circles**
   - Clean, flat design
   - Dashed outer circle for connection points
   - Solid inner circle with icon
   - Connection dots at top/bottom

2. **Minimal Color Palette**
   - Orange (#FF9800) for data source widgets
   - Blue for visualization widgets
   - Green for processing widgets
   - Gray for utility widgets

3. **Clean Typography**
   - Widget name below icon (small, semibold)
   - Status text (tiny, light weight)
   - No heavy borders or shadows

4. **Compact Layout**
   - Controls hidden until hover
   - Maximum use of circle space
   - Minimal padding

---

## Widget Style Template

```tsx
<div className="flex flex-col items-center justify-center w-full h-full cursor-default p-3 bg-white">
  {/* Main icon circle */}
  <div className="flex flex-col items-center gap-2 mb-3">
    {/* Outer dashed connection circle */}
    <div 
      className="rounded-full flex items-center justify-center relative"
      style={{
        border: '2px dashed #COLOR_LIGHT',
        width: 90,
        height: 90,
        background: '#COLOR_BG'
      }}
    >
      {/* Inner solid circle with icon */}
      <div 
        className="rounded-full flex items-center justify-center"
        style={{
          width: 65,
          height: 65,
          background: '#COLOR_MAIN',
          boxShadow: '0 2px 8px rgba(COLOR_RGB, 0.3)'
        }}
      >
        <IconComponent className="h-7 w-7 text-white" strokeWidth={2} />
      </div>
      
      {/* Connection dots */}
      <div className="absolute -top-1 left-1/2 -translate-x-1/2">
        <div className="w-2.5 h-2.5 bg-COLOR_ACCENT rounded-full border-2 border-white"></div>
      </div>
      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
        <div className="w-2.5 h-2.5 bg-COLOR_ACCENT rounded-full border-2 border-white"></div>
      </div>
    </div>
    
    {/* Label */}
    <div className="text-center">
      <div className="text-xs font-semibold text-gray-800">Widget Name</div>
      <div className="text-[10px] text-gray-500 mt-0.5">Status info</div>
    </div>
  </div>

  {/* Compact controls - hover to show */}
  <div className="w-full flex flex-col gap-1.5 opacity-0 hover:opacity-100 transition-opacity duration-200">
    {/* Your controls here */}
  </div>
</div>
```

---

## Color Schemes by Widget Type

### Data Sources (Orange)
```css
--main: #FF9800
--light: #FFE4CC
--bg: #FFF8F0
--accent: #FF9800
```
**Widgets:** Supabase, File Upload, Data Input

### Visualizations (Blue)
```css
--main: #2196F3
--light: #BBDEFB
--bg: #E3F2FD
--accent: #2196F3
```
**Widgets:** Line Chart, Scatter Plot, Bar Chart, Data Table

### Processing (Green)
```css
--main: #4CAF50
--light: #C8E6C9
--bg: #E8F5E9
--accent: #4CAF50
```
**Widgets:** Noise Filter, Baseline Correction, Smoothing, Normalization

### Analysis (Purple)
```css
--main: #9C27B0
--light: #E1BEE7
--bg: #F3E5F5
--accent: #9C27B0
```
**Widgets:** Peak Detection, Custom Code, Mean Average

### Utilities (Gray)
```css
--main: #607D8B
--light: #CFD8DC
--bg: #ECEFF1
--accent: #607D8B
```
**Widgets:** Data Table output, Configuration

---

## Implementation Checklist

### For Each Widget:

- [ ] Remove gradients (use flat colors)
- [ ] Simplify to single icon circle
- [ ] Add dashed outer border
- [ ] Add connection dots (top/bottom)
- [ ] Place label below icon
- [ ] Hide controls until hover
- [ ] Remove emoji from buttons
- [ ] Use simple button text ("Load", "Apply", "Open table")
- [ ] Reduce padding and spacing
- [ ] Remove shadows (except subtle icon shadow)

---

## Widget Sizes

**Standard Widget:**
- Outer circle: 90x90px
- Inner circle: 65x65px
- Icon: 28x28px (h-7 w-7)
- Connection dots: 10px (w-2.5 h-2.5)

**Compact Widget (for sidebar):**
- Outer circle: 60x60px
- Inner circle: 45x45px
- Icon: 20x20px (h-5 w-5)

---

## Typography

**Widget Name:**
```css
font-size: 12px (text-xs)
font-weight: 600 (font-semibold)
color: #1F2937 (text-gray-800)
```

**Status Text:**
```css
font-size: 10px (text-[10px])
font-weight: 400 (normal)
color: #6B7280 (text-gray-500)
```

**Button Text:**
```css
font-size: 12px (text-xs)
font-weight: 500 (font-medium)
```

---

## Connection Lines

Update connection lines to match Orange style:

```tsx
{/* Curved connection line */}
<svg>
  <path
    d={`M ${fromX},${fromY} Q ${midX},${fromY} ${midX},${midY} T ${toX},${toY}`}
    stroke="#BDBDBD"
    strokeWidth="2"
    strokeDasharray="5,5"
    fill="none"
  />
</svg>
```

---

## Canvas Background

```css
background: #FAFAFA
/* Or */
background: linear-gradient(to bottom, #FFFFFF 0%, #F5F5F5 100%)
```

---

## Example: Complete Widget Redesign

### Before (Current):
```tsx
<div className="p-4 bg-gradient-to-r...">
  <div className="text-lg font-bold mb-2">📊 Data Visualization</div>
  <button className="px-4 py-2 rounded-lg bg-gradient-to-r...">
    ✨ Generate Chart
  </button>
</div>
```

### After (Orange Style):
```tsx
<div className="p-3 bg-white">
  <div className="flex flex-col items-center gap-2">
    <div className="rounded-full..." style={{ border: '2px dashed #BBDEFB', width: 90, height: 90 }}>
      <div className="rounded-full..." style={{ width: 65, height: 65, background: '#2196F3' }}>
        <BarChart3 className="h-7 w-7 text-white" />
      </div>
    </div>
    <div className="text-xs font-semibold text-gray-800">Data Table</div>
  </div>
  <div className="opacity-0 hover:opacity-100">
    <button className="text-xs">Open table</button>
  </div>
</div>
```

---

## Priority Widgets to Update

1. ✅ **Supabase** - Done!
2. **File Upload** - Orange
3. **Custom Code** - Purple
4. **Line Chart** - Blue
5. **Data Table** - Blue
6. **Noise Filter** - Green
7. **Baseline Correction** - Green
8. **Mean Average** - Purple

---

## Benefits of Orange Style

1. **Cleaner Interface** - Less visual clutter
2. **Better Performance** - Simpler rendering
3. **Professional Look** - Industry-standard design
4. **Easier Maintenance** - Consistent patterns
5. **Better UX** - Clear visual hierarchy

---

## Next Steps

1. Apply this style to all widgets systematically
2. Update connection line rendering
3. Simplify sidebar widget previews
4. Add animation for data flow
5. Update canvas background

Would you like me to continue updating more widgets in this style?
