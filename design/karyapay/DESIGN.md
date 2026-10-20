---
name: KaryaPay
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#444653'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#757684'
  outline-variant: '#c4c5d5'
  surface-tint: '#3755c3'
  primary: '#00288e'
  on-primary: '#ffffff'
  primary-container: '#1e40af'
  on-primary-container: '#a8b8ff'
  inverse-primary: '#b8c4ff'
  secondary: '#006a61'
  on-secondary: '#ffffff'
  secondary-container: '#86f2e4'
  on-secondary-container: '#006f66'
  tertiary: '#70000c'
  on-tertiary: '#ffffff'
  tertiary-container: '#9b0015'
  on-tertiary-container: '#ffa39c'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dde1ff'
  primary-fixed-dim: '#b8c4ff'
  on-primary-fixed: '#001453'
  on-primary-fixed-variant: '#173bab'
  secondary-fixed: '#89f5e7'
  secondary-fixed-dim: '#6bd8cb'
  on-secondary-fixed: '#00201d'
  on-secondary-fixed-variant: '#005049'
  tertiary-fixed: '#ffdad7'
  tertiary-fixed-dim: '#ffb3ad'
  on-tertiary-fixed: '#410004'
  on-tertiary-fixed-variant: '#930013'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '800'
    lineHeight: 40px
    letterSpacing: -0.03em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 28px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 17px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.04em
  currency-display:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '800'
    lineHeight: 36px
    letterSpacing: -0.02em
  currency-card:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 26px
    letterSpacing: -0.01em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-tablet: 1.5rem
  margin: 1rem
  margin-tablet: 2rem
  margin-desktop: 3rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system is tailored for an agile, mobile-first invoicing, estimation, and payment collection platform built for modern independent professionals, creative freelancers, and service contractors.

### Brand Personality & Core Values
- **Uncompromising Financial Trust:** Projects stability, enterprise-grade accounting accuracy, and prompt payment compliance through crisp geometry and dependable indigo tones.
- **Velocity & Fluidity:** Optimized for on-the-go billing, single-thumb invoice creation, instant client settlement via digital wallets/QRIS/bank transfers, and rapid WhatsApp dispatch.
- **Tactile Modernism:** Combines elevated surface layering, tactile mobile touch targets, micro-interactions, and high-legibility typographic scales tailored for rapid currency comprehension.

### Design Movement
The visual language operates on **Tactile Modernism** fused with **Clean Functional Minimalism**. Interfaces utilize high-contrast pure white elevated cards floating above an ultra-subtle slate canvas. Interactive elements feature refined boundary borders, gentle ambient drop shadows, clear tap affordances, and unmistakable fiscal state signifiers.

## Colors

The palette balances fiscal authority with instantaneous visual telemetry.

- **Primary (`#1E40AF` - Trust Deep Indigo):** Anchor color for navigation chrome, high-level headers, primary CTA buttons (e.g., "Create Invoice", "Confirm Settlement"), and financial ledger borders.
- **Secondary / Accent (`#0D9488` - Emerald Teal):** Denotes positive financial balance, "Lunas" (Paid) status pills, inbound liquidity graphs, and high-conversion WhatsApp dispatch triggers (`#10B981` / `#0D9488`).
- **Tertiary / Warning & Alert (`#EF4444` / `#F59E0B`):** Explicit semantic indicators for overdue payments, impending due dates, tax penalties, and destructive actions.
- **Neutral Core (`#64748B` - Slate Neutral):** Provides crisp contrast across body text, secondary labels, divider lines, and card containers.

### Extended Functional Tokens
- **Canvas Base:** `#F8FAFC` (Slate 50)
- **Surface Elevation 1 (Cards, Sheets):** `#FFFFFF` (Pure White)
- **Surface Elevation 2 (Tonal Insets, Input Fields):** `#F1F5F9` (Slate 100)
- **Subtle Stroke / Separator:** `#E2E8F0` (Slate 200)
- **Text Headings / Numbers:** `#0F172A` (Slate 900)
- **Text Body:** `#334155` (Slate 700)
- **Text Subdued / Hints:** `#64748B` (Slate 500)

## Typography

The typography relies on **Plus Jakarta Sans** across all hierarchies. Its open counters, geometric stems, and friendly yet sharp curves ensure rapid legibility on small screens under intense sunlight or while operating single-handed on mobile devices.

### Numerical Hierarchy for Invoicing
Financial aggregates and Indonesian Rupiah (Rp) values use tight letter-spacing (`-0.02em`) with tabular numbers (`tnum`) enabled by default to prevent vertical jumping across dynamic currency recalculations (PPN, discounts, and line-item totals).

## Layout & Spacing

A mobile-first fluid grid layout prioritizing thumb accessibility within the bottom two-thirds of the viewport.

### Breakpoints & Canvas Bounds
- **Mobile (< 640px):** Single-column fluid view with `16px` (`margin`) outer edge offsets. Key actions are docked within bottom sheets or sticky footer bars.
- **Tablet (640px - 1024px):** 6-column fluid structure with `24px` guttering and centered maximum application frame width of `720px`.
- **Desktop (> 1024px):** 12-column centered layout (maximum reading width of `1140px`) pairing the live interactive invoice preview sheet alongside the creation form panel.

### Touch Target System
All interactive controls, quick-add buttons, invoice item increments, and navigation icons strictly maintain a minimum physical touch target of `48px x 48px` with at least `8px` (`space-sm`) safety clearance between adjacent targets.

## Elevation & Depth

Visual hierarchy is communicated through clear **Tonal Layers paired with Crisp Ambient Shadows**.

- **Level 0 (App Canvas):** Flat `#F8FAFC`, no shadow.
- **Level 1 (Card & Content Blocks):** Pure white `#FFFFFF`, border `1px solid #E2E8F0`, shadow `0px 1px 3px rgba(15, 23, 42, 0.05), 0px 1px 2px rgba(15, 23, 42, 0.03)`.
- **Level 2 (Active Dropdowns, Tonal Panels & Signature Pad):** Pure white `#FFFFFF`, border `1px solid #CBD5E1`, shadow `0px 4px 12px -2px rgba(15, 23, 42, 0.08)`.
- **Level 3 (Mobile Bottom Sheet, Modal Confirmations & Sticky Bottom Nav):** `#FFFFFF` with top border `1px solid #E2E8F0`, shadow `0px -4px 20px rgba(15, 23, 42, 0.08)`.
- **Level 4 (Floating Action Button / FAB):** Indigo tinted shadow `0px 8px 24px -4px rgba(30, 64, 175, 0.35)`.

## Shapes

The design system implements a **Rounded (Level 2)** shape language, balancing software utility with ergonomic, handheld friendliness.

- **Standard Inputs, Textareas, & Buttons:** `0.75rem` (`rounded-xl` / 12px).
- **Cards, Document Frames, & Signature Canvas:** `1rem` (`rounded-2xl` / 16px).
- **Status Badges, Steppers, & Quick-Action Chips:** Full pill geometry (`rounded-full` / 9999px).
- **Bottom Navigation Dock & Slide Sheets:** Top-left and top-right radii set to `1.5rem` (24px).

## Components

### Buttons & Quick Actions
- **Primary Action (Create / Send):** Background `#1E40AF`, text `#FFFFFF`, height `50px`, font weight `600`, radius `12px`. Subtle press compression (`scale(0.98)`).
- **WhatsApp Direct Dispatch:** Background `#0D9488`, text `#FFFFFF`, paired with the brand WhatsApp icon glyph, triggers instant pre-filled text + PDF link delivery.
- **Floating Action Button (FAB):** Fixed at bottom right `16px` above navigation. Dimensions `56px x 56px`, pill-circular, elevated at Level 4.

### Mobile Bottom Navigation Bar
- Fixed at the bottom screen edge with blurred translucent backing (`rgba(255, 255, 255, 0.92)` with `12px` backdrop-blur).
- Contains 4 core destinations: Invoices, Clients, Quotations, and Settings.
- Visual state: Active items use `#1E40AF` fill with an active pip dot below the icon; inactive items render in `#64748B`.

### Input Fields & Monetary Entry
- Height `48px`, background `#FFFFFF`, border `1px solid #E2E8F0`, active focus ring `2px solid #1E40AF`.
- Currency inputs feature a fixed, non-editable leading badge: `Rp` in `#64748B` with automatic localized thousand separators (e.g., `15.000.000`).

### Interactive Tax (PPN 11% / 12%) & Discount Switches
- Horizontal segmented pill selector container with neutral fill `#F1F5F9`.
- Selected segment translates smoothly with pure white card surface and subtle drop-shadow, toggleable between `Non-Aktif`, `PPN 11%`, or custom tax brackets.

### Signature Pad Frame
- Enclosed white container bounded by `1.5px dashed #CBD5E1` with clear action button ("Hapus / Clear") positioned top-right. Smooth SVG vector stroke rendering in deep slate.

### Invoice Document Summary Cards
- Displays: Recipient client name, invoice serial badge (e.g., `#INV-2025-004`), date, and aggregate value.
- Status indicator pill anchored top-right:
  - *Lunas / Paid:* `#F0FDF4` surface, `#15803D` text.
  - *Menunggu / Pending:* `#FEF3C7` surface, `#B45309` text.
  - *Jatuh Tempo / Overdue:* `#FEF2F2` surface, `#B91C1C` text.