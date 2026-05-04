# Bulusan Tourism Platform — Full Overview

> **Stack:** React + TypeScript · Vite · Styled Components · Framer Motion · React Router · React-Leaflet · Firebase (with local fallback)
> **Dev Server:** `npm run dev` → `http://localhost:5173`

---

## ✅ What's Already Built

### Pages (13 total)

| File | Route | Status | Description |
|---|---|---|---|
| `LandingPage.tsx` | `/` | ✅ Done | Hero intro, CTA to Discover |
| `DiscoverPage.tsx` | `/discover` | ✅ Done | Video hero + stats + Top Attractions + Top Tours + Top Accommodations |
| `AttractionsPage.tsx` | `/attractions` | ✅ Done | Full card grid, search, filter, modal with video/images, badges, URL sync, recommendations |
| `AccommodationsPage.tsx` | `/accommodations` | ✅ Done | Same layout as Attractions, booking widget, rates display, badges, recommendations |
| `ToursPage.tsx` | `/tours` | ✅ Done | Tour cards, badges, timeline itinerary modal, reservation form, similar tours |
| `MapPage.tsx` | `/map` | ⚠️ Partial | Shows map with attraction markers; tours & accommodations NOT yet on map |
| `BlogPage.tsx` | `/blog` | ✅ Done | Community posts, submit form, moderation status |
| `ContactPage.tsx` | `/contact` | ✅ Done | Contact form |
| `AccountPage.tsx` | `/account` | ✅ Done | User profile, itinerary, history |
| `LoginPage.tsx` | `/login` | ✅ Done | Email/password login with Firebase + local fallback |
| `SignUpPage.tsx` | `/signup` | ✅ Done | Account creation with Demo Mode fallback |
| `AdminDashboard.tsx` | `/admin` | ✅ Done | Analytics overview, visitor stats, asset counts |
| `AdminPortalPage.tsx` | `/admin-portal` | ✅ Done | Full CMS — add/edit Attractions, Tours, Accommodations with drag-and-drop upload |

---

### Components

#### `src/components/Discover/`
| File | Description |
|---|---|
| `HeroSection.tsx` | Video background hero with animated text overlay |
| `TopAttractions.tsx` | Top 3 by visits → clicks deep-link to `/attractions?openId=X` |
| `TopTours.tsx` | Top 3 by visits → clicks deep-link to `/tours?openId=X` |
| `TopAccommodations.tsx` | Top 3 by visits → clicks deep-link to `/accommodations?openId=X` |

#### `src/components/Layout/`
| File | Description |
|---|---|
| `Header.tsx` | Fixed nav: Discover · Attractions · Stays · Tours · Map · Blog · Contact |
| `PersistentLayout.tsx` | Wraps all pages with Header + Footer |
| `AdminRoute.tsx` | Guards `/admin*` routes, only accessible to ADMIN role |
| `UserRoute.tsx` | Guards logged-in-only pages |

#### `src/components/Map/`
| File | Description |
|---|---|
| `BulusanMap.tsx` | Leaflet map with Barangay labels, attraction markers |

#### `src/components/Admin/`
| File | Description |
|---|---|
| `DataSeeder.tsx` | One-click seed button to push mock data to Firestore |

---

### Data Layer

#### `src/data/`
| File | Contents |
|---|---|
| `types.ts` | All TypeScript interfaces: `Attraction`, `Accommodation`, `Tour`, `User`, `BlogPost`, `Inquiry`, `Review` |
| `attractions.ts` | 3 mock attractions (Bulusan Lake, Hagkan Falls, Inararan Falls) with `tags`, `visits`, `rating`, `dateAdded` |
| `accommodations.ts` | 2 mock accommodations (Balay Buhay Restaurant, Bulusan Spring Resort) |
| `tours.ts` | 2 mock tours (Volcano Summit, Lake Day Tour) with full route timelines |
| `blog.ts` | Mock blog posts |
| `inquiries.ts` | Mock contact inquiries |

#### `src/hooks/`
| File | Description |
|---|---|
| `useFirestore.ts` | Generic hook for Firestore CRUD — exports `useAttractions`, `useTours`, `useAccommodations` |
| `useAuth.tsx` | Auth context with Firebase + Demo Mode local storage fallback |

---

### Smart Features Already Active

| Feature | Where |
|---|---|
| 🔴 **NEW** badge | Any entity added within 30 days (based on `dateAdded`) |
| 🟡 **TOP RATED** badge | Entity with highest `rating` in collection |
| 🟣 **MUST VISIT** badge | Entity with highest `visits` count in collection |
| 🔗 **URL deep-linking** | `?openId=X` on `/attractions`, `/tours`, `/accommodations` auto-opens modal |
| 🧠 **Tag recommendations** | "You might also enjoy" — sorted by shared `tags[]`, fallback to visits |
| 📊 **Sort by visits** | All pages + Discover sections rank by most-visited first |
| 🎥 **Video preview** | Attractions modal shows MP4 or YouTube embed first, falls back to image |

---

## ⚠️ What's Partially Done

### Map Page (`MapPage.tsx`)
- ✅ Shows Leaflet map with barangay labels
- ✅ Attraction markers plotted
- ❌ **No Tour route drawing** — tour waypoints not yet rendered as a path
- ❌ **Accommodations not on the map** — markers missing
- ❌ Clicking a map marker does NOT navigate to modal yet (`?openId=` not wired)

### Admin Portal (`AdminPortalPage.tsx`)
- ✅ Add/edit Attractions
- ✅ Add Tours with route stops
- ✅ Add Accommodations with rates
- ❌ **Cannot visually build tour routes** from map — admin types coordinates manually
- ❌ No delete confirmation dialog — deletes are instant

---

## 🔧 Things Still To Do (Roadmap)

### Priority 1 — Map Integration
- [ ] Add **Accommodation markers** to `BulusanMap.tsx`
- [ ] Add **Tour route polylines** — draw a path connecting each stop in order
- [ ] Wire **map marker click → `useNavigate('/attractions?openId=X')`** for instant modal
- [ ] Wire same for Tours and Accommodations markers on map

### Priority 2 — Admin Portal Improvements
- [ ] **Visual tour route builder** — drag pins on mini-map to set waypoints
- [ ] **Delete confirmation dialog** — currently deletes immediately
- [ ] **Edit existing records** — admin can only create new, not edit old ones
- [ ] Show live badge preview in admin (NEW / TOP RATED / MUST VISIT)

### Priority 3 — Content & Data
- [ ] Add more mock attractions, tours, accommodations with real Bulusan images
- [ ] Add attraction **gallery images** (multiple photos per modal)
- [ ] Add **real entrance fee / pricing** to attraction metadata
- [ ] More tour **routes** with GPS coordinates

### Priority 4 — User Experience
- [ ] **Search bar** on Discover page (cross-entity search)
- [ ] Map page **sidebar** listing attractions/tours with filter chips
- [ ] **Share button** on modals (copy `?openId=` URL to clipboard)
- [ ] Add view counter increment when a modal is opened
- [ ] **Print itinerary** from Account page

### Priority 5 — Polish
- [ ] Fix `LandingPage.tsx` TypeScript error (`bgLight` theme property)
- [ ] Mobile responsiveness pass on all pages
- [ ] Add loading skeletons to all pages (some have them, some don't)
- [ ] SEO meta tags on each route

---

## 🗂 File Quick Reference

```
bulusan-tourism/
├── public/
│   └── hero.mp4                    ← Background video for Discover page
│
├── src/
│   ├── App.tsx                     ← All routes defined here
│   ├── main.tsx                    ← Entry point
│   │
│   ├── data/
│   │   ├── types.ts                ← ALL TypeScript interfaces
│   │   ├── attractions.ts          ← Mock attraction data
│   │   ├── accommodations.ts       ← Mock accommodation data
│   │   ├── tours.ts                ← Mock tour data
│   │   ├── blog.ts                 ← Mock blog posts
│   │   └── inquiries.ts            ← Mock contact inquiries
│   │
│   ├── hooks/
│   │   ├── useAuth.tsx             ← Login / signup / logout
│   │   └── useFirestore.ts         ← Data fetching for all entities
│   │
│   ├── firebase/                   ← Firebase config (optional, has fallback)
│   │
│   ├── pages/
│   │   ├── LandingPage.tsx
│   │   ├── DiscoverPage.tsx        ← Uses TopAttractions + TopTours + TopAccommodations
│   │   ├── AttractionsPage.tsx     ← Full directory + modal + recommendations
│   │   ├── AccommodationsPage.tsx  ← Full directory + booking widget
│   │   ├── ToursPage.tsx           ← Timeline modal + reservation form
│   │   ├── MapPage.tsx             ← Leaflet map (needs Tour/Accom markers)
│   │   ├── BlogPage.tsx
│   │   ├── ContactPage.tsx
│   │   ├── AccountPage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── SignUpPage.tsx
│   │   ├── AdminDashboard.tsx
│   │   └── AdminPortalPage.tsx     ← Full CMS for all 3 entity types
│   │
│   ├── components/
│   │   ├── Discover/
│   │   │   ├── HeroSection.tsx     ← Video bg hero
│   │   │   ├── TopAttractions.tsx  ← Featured attractions widget
│   │   │   ├── TopTours.tsx        ← Featured tours widget
│   │   │   └── TopAccommodations.tsx ← Featured stays widget
│   │   ├── Layout/
│   │   │   ├── Header.tsx          ← Sticky nav with user menu
│   │   │   ├── PersistentLayout.tsx← Wraps all pages
│   │   │   ├── AdminRoute.tsx
│   │   │   └── UserRoute.tsx
│   │   ├── Map/
│   │   │   └── BulusanMap.tsx      ← Leaflet map + markers
│   │   └── Admin/
│   │       └── DataSeeder.tsx
│   │
│   └── styles/                     ← Global CSS + theme tokens
```

---

## 🔑 Key Rules to Remember

> [!IMPORTANT]
> - Admin access: login with `admin@bulusan.com` (any password in Demo Mode)
> - All new data added via Admin Portal goes to **Firestore** if configured, otherwise **localStorage**
> - To add a new entity type: update `types.ts` → `data/*.ts` → `useFirestore.ts` → new Page → add route in `App.tsx`

> [!TIP]
> - To test **NEW badge**: set `dateAdded` to today's date in any item
> - To test **TOP RATED badge**: give an item the highest `rating` number in its collection
> - To test **MUST VISIT badge**: give an item the highest `visits` number in its collection
> - Deep link test: go to `/attractions?openId=1` — the modal should open instantly
