# 📱 Prompt: Make Salon Website Fully Responsive for Mobile

---

## ROLE
You are an expert frontend developer and mobile UI/UX specialist. Your task is to take the existing salon website code and make it **100% responsive** — with a primary focus on mobile devices — so that every element fits perfectly on any screen size without anything overflowing, getting cut off, or appearing outside the viewport.

---

## CORE OBJECTIVE
Make the existing salon website fully responsive across all real-world screen sizes:
- 📱 Small phones: 320px – 375px (iPhone SE, older Android)
- 📱 Standard phones: 376px – 414px (iPhone 14, Samsung Galaxy S)
- 📱 Large phones: 415px – 480px (iPhone Pro Max, Pixel XL)
- 📟 Phablets: 481px – 767px
- 💻 Tablets: 768px – 1023px
- 🖥️ Desktop: 1024px and above

**Nothing should overflow or go outside the screen on ANY device.**

---

## WHAT TO FIX — DETAILED INSTRUCTIONS

### 1. GLOBAL OVERFLOW FIX (Apply First)
```css
*, *::before, *::after {
  box-sizing: border-box;
}

html, body {
  overflow-x: hidden;
  max-width: 100%;
  width: 100%;
}
```
- Add `overflow-x: hidden` to html and body
- Apply `box-sizing: border-box` globally
- Remove any fixed pixel widths that exceed the viewport

---

### 2. NAVIGATION / HEADER
- Replace desktop horizontal nav with a **hamburger menu** on mobile (≤ 768px)
- Logo must scale down and stay visible on small screens
- Nav links must stack vertically in a slide-in or dropdown mobile menu
- Header height should shrink on mobile (e.g. 60px instead of 80px)
- Sticky header must not block content — add proper `padding-top` to page body
- Phone numbers / CTAs in header must wrap or hide gracefully on small screens

---

### 3. HERO SECTION
- Hero image must use `background-size: cover` and `background-position: center`
- Headline font size must scale down — use `clamp()` or `vw` units:
  ```css
  font-size: clamp(1.5rem, 5vw, 4rem);
  ```
- Hero text must be readable on small screens (min font-size 14px)
- Hero buttons must be full-width or at least 44px tall on mobile (touch target)
- Never let hero text overflow outside the container
- Background overlay must ensure text contrast on all screen sizes

---

### 4. GRID & CARD LAYOUTS (Services, Gallery, Team, Pricing)
- All multi-column grids must collapse to single column on mobile:
  ```css
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  /* OR explicitly: */
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
  ```
- Cards must never overflow their parent — apply `max-width: 100%`
- Card images must use `width: 100%; height: auto; object-fit: cover`
- Card padding should reduce on mobile (e.g. 1rem instead of 2rem)
- 3-column layouts → 2 columns on tablet → 1 column on phone

---

### 5. IMAGES
- ALL images must be responsive:
  ```css
  img {
    max-width: 100%;
    height: auto;
    display: block;
  }
  ```
- Gallery images must not overflow their containers
- Use `object-fit: cover` for images in fixed-height containers
- Avoid fixed pixel widths on images (e.g. `width: 600px` — this breaks mobile)

---

### 6. TYPOGRAPHY
- All font sizes must scale for mobile — never below 12px for body, 14px minimum recommended
- Use `clamp()` for headings:
  ```css
  h1 { font-size: clamp(1.8rem, 6vw, 4.5rem); }
  h2 { font-size: clamp(1.4rem, 4vw, 2.5rem); }
  h3 { font-size: clamp(1.1rem, 3vw, 1.8rem); }
  ```
- Line heights and letter spacing must adjust for small screens
- Long words/URLs must break: `word-break: break-word; overflow-wrap: break-word;`

---

### 7. BUTTONS & CTAs
- All buttons must have minimum touch target size: `min-height: 44px; min-width: 44px`
- On mobile, primary CTA buttons should be `width: 100%` or at least `min-width: 200px`
- Button text must never be clipped or overflow
- Enough spacing between stacked buttons (at least `gap: 12px`)

---

### 8. FORMS (Booking / Contact)
- Form fields must be `width: 100%` on mobile
- Input font size minimum `16px` to prevent iOS auto-zoom:
  ```css
  input, textarea, select {
    font-size: 16px;
    width: 100%;
  }
  ```
- Multi-column form layouts must collapse to single column on mobile
- Submit button must be full width on mobile
- Labels must stack above inputs (not inline) on small screens

---

### 9. SECTIONS / CONTAINERS
- Max container width: `max-width: 1200px; margin: 0 auto`
- Horizontal padding must scale:
  ```css
  .container {
    padding: 0 clamp(1rem, 5vw, 3rem);
  }
  ```
- Section vertical padding must reduce on mobile:
  ```css
  section {
    padding: clamp(2rem, 8vw, 6rem) 0;
  }
  ```
- Never use fixed pixel widths that exceed 100vw

---

### 10. PRICING TABLES
- Pricing cards must stack vertically on mobile
- If using a horizontal comparison table, convert to stacked card format on mobile
- Prices must be large and readable (min 22px on mobile)
- "Book Now" buttons in pricing must be full-width on mobile

---

### 11. TESTIMONIALS / REVIEWS
- Testimonial sliders/carousels must work on touch (swipe support)
- Single-column stacked cards on mobile instead of side-by-side
- Star ratings must not overflow

---

### 12. FOOTER
- Footer columns must stack vertically on mobile
- Footer links must have enough tap area (min 44px height)
- Social icons must have enough spacing between them
- Footer must not have horizontal scroll

---

### 13. SPACING & PADDING SYSTEM
- Replace fixed `margin: 80px` style spacing with responsive equivalents
- Use `rem` units instead of `px` for spacing where possible
- Add breathing room between stacked mobile sections

---

### 14. FIXED / ABSOLUTE POSITIONED ELEMENTS
- Floating buttons (WhatsApp, call buttons) must not overlap content
- Modal/popup overlays must be `width: 100vw; height: 100vh` with `overflow-y: auto`
- Fixed banners must not be taller than 15% of viewport height on mobile

---

## BREAKPOINT SYSTEM TO USE

```css
/* Mobile first approach */

/* Base styles → Mobile (320px+) */

/* Small tablet */
@media (min-width: 480px) { ... }

/* Tablet */
@media (min-width: 768px) { ... }

/* Small desktop */
@media (min-width: 1024px) { ... }

/* Large desktop */
@media (min-width: 1280px) { ... }
```

---

## TESTING REQUIREMENTS
After making all changes, mentally verify the layout renders correctly at these exact widths:
- 320px (smallest supported phone)
- 375px (iPhone SE / standard)
- 390px (iPhone 14)
- 414px (iPhone Plus)
- 768px (iPad portrait)
- 1024px (iPad landscape / small laptop)
- 1440px (desktop)

**No horizontal scrollbar should appear at any of these widths.**
**No element should be cut off, overflow, or go outside the screen.**

---

## OUTPUT FORMAT
- Provide the COMPLETE updated HTML/CSS/JS code
- Include all responsive CSS inline or in a `<style>` block
- Comment each major responsive section for clarity
- Do NOT remove any existing design, content, colors, or fonts
- Only ADD or MODIFY CSS/layout — preserve all visual identity
- The final result must look great on mobile AND desktop

---

## PRIORITY ORDER
Fix in this order:
1. ✅ Global overflow fix
2. ✅ Navigation / hamburger menu
3. ✅ Hero section scaling
4. ✅ All grid/card layouts
5. ✅ Images
6. ✅ Typography scaling
7. ✅ Forms
8. ✅ Buttons
9. ✅ Footer
10. ✅ Everything else

---

**REMEMBER: The goal is that a person on a $100 Android phone with a 320px screen sees the same beautiful, fully functional salon website as someone on a MacBook Pro. Nothing should ever go outside the screen.**