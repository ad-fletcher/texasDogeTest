# Plan: Move Chat to Separate Page

## Overview
Currently, the chat functionality is on the landing page (`app/page.tsx`). We need to:
1. Transform `page.tsx` into a proper landing page with "Texas doge" title and "Get Started" button
2. Move chat functionality to a dedicated `analyst` route
3. Implement proper navigation between pages

## Step-by-Step Implementation Plan

### Step 1: Create analyst Page Route
- Create new directory: `app/analyst/`
- Create `app/analyst/page.tsx` 
- Move the entire chat component from `app/page.tsx` to `app/analyst/page.tsx`
- Ensure all imports and functionality remain intact

### Step 2: Update Landing Page (app/page.tsx)
- Replace current chat content with landing page design
- Add "Texas doge" as main heading
- Add "Get Started" button that navigates to `/analyst`
- Use Next.js `Link` component for navigation
- Apply proper styling for landing page aesthetics

### Step 3: Navigation Implementation
- Import `Link` from `next/link` in landing page
- Set up button to navigate to `/analyst` route
- Ensure smooth navigation without page reload

### Step 4: Styling and UX Improvements
- Design landing page with modern, clean layout
- Center content appropriately
- Add responsive design considerations
- Maintain consistent theme with existing dark/light mode support
- Consider adding hero section, branding elements

### Step 5: Route Structure Verification
- Test navigation from landing page to chat page
- Verify chat functionality works correctly on new route
- Ensure back navigation works properly
- Test on both desktop and mobile viewports

### Step 6: Optional Enhancements
- Add loading states for navigation
- Consider adding breadcrumbs or navigation header
- Add meta tags for better SEO on landing page
- Consider adding analytics for user flow tracking

## File Structure After Implementation
```
app/
├── page.tsx          (Landing page with "Texas doge" + CTA)
├── analyst/
│   └── page.tsx      (Chat functionality)
├── layout.tsx        (Shared layout)
└── globals.css       (Global styles)
```

## Technical Considerations
- Use Next.js 13+ App Router conventions
- Maintain existing chat functionality without breaking changes
- Preserve all tool integrations and chat features
- Follow React component best practices
- Ensure TypeScript compatibility

## Testing Checklist
- [ ] Landing page displays correctly
- [ ] "Get Started" button navigates to chat
- [ ] Chat functionality works on `/analyst` route
- [ ] All tool integrations remain functional
- [ ] Navigation is smooth and intuitive
- [ ] Responsive design works on all devices
- [ ] Dark/light mode themes work correctly
