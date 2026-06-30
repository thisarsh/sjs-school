# SJS School ERP — UI & Design System Guidelines

This document outlines the styling standards, typographic choices, layout rules, and color palettes that compose the premium design system of the SJS School ERP.

---

## 1. Color Palette

The color system is built around professional corporate cool-tones combined with clean neutral whites and grays.

### Core Brand Colors
- **Primary Navy**: `#111827` (Used for headers, strong buttons, and text headings)
- **Primary Indigo Accent**: `#6366f1` to `#a855f7` (Used for active states, highlighted icons, and main hero gradients)

### Status Colors
- **Present / Success**: `#10b981` (Green-light accent)
- **Absent / Danger**: `#ef4444` (Red-light accent)
- **Pending / Warning**: `#f59e0b` (Yellow-light accent)

---

## 2. Typography

The default typography is set to look modern and elegant.
- **Primary Font**: `Outfit`, sans-serif (imported via Google Fonts CDN).
- **Fallback Font**: Inter, system-ui.

### Text Sizes
- **H1 / Page Title**: `24px` (font-weight: 700)
- **H2 / Sub-Section**: `18px` (font-weight: 600)
- **Body Text**: `14px` (font-weight: 400)
- **Metadata / Badges**: `12px` (font-weight: 700)

---

## 3. Spacing & Grid Systems

Spacing utilizes a standard base-8 layout system.

- **Component Padding**: `16px` or `24px`.
- **Card Margins**: `12px` or `16px`.
- **Grid Layouts**: Dashboards use a responsive 3x3 grid system (mobile-first) adapting dynamically.

---

## 4. UI Elements

### Navigation Buttons (Back Button)
- Back buttons must be strictly icon-only using `<i className="fa-solid fa-arrow-left"></i>`.
- **Style**:
  ```css
  .sas-back-btn, .complaint-back-btn, .leave-back-btn {
    background: #ffffff;
    border: 1px solid #e5e7eb;
    width: 36px;
    height: 36px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    color: #111827;
  }
  ```

### Card Design
- All cards use a soft white background with border radii of `16px` to `24px`.
- Shadow definition: `0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)`.
