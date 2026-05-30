export interface Attraction {
    id: number;
    name: string;
    categories: string[];
    rating: number;
    location: string;
    coordinates: { lat: number; lng: number };
    img: string;
    description: string;
    gallery?: string[];
    videoUrl?: string;
    reviews?: Review[];
    metadata?: {
        entranceFee?: string;
        hours?: string;
        difficulty?: 'Easy' | 'Moderate' | 'Challenging';
    };
    contactInfo?: string; 
    visits?: number;
    dateAdded?: string;
    tags?: string[];
    featured?: boolean;
    photos?: string[];
    isFreeAdmission?: boolean;
    offers?: Offer[];
}

export interface Offer {
    id: string;
    name: string;
    price: string;
    image?: string;
}

export interface Enterprise {
    id: number;
    name: string;
    categories: string[];
    rating: number;
    location: string;
    coordinates: { lat: number; lng: number };
    img: string;
    description: string;
    rates?: string;
    amenities?: string[];
    gallery?: string[];
    videoUrl?: string;
    reviews?: Review[];
    metadata?: { hours?: string; contact?: string; website?: string; };
    visits?: number;
    dateAdded?: string;
    tags?: string[];
    featured?: boolean;
    photos?: string[];
    offers?: Offer[];
}

export interface Review {
    id: number;
    author: string;
    avatar: string;
    rating: number;
    comment: string;
    date: string;
}

export interface Tour {
    id: number;
    title: string;
    desc: string;
    image: string;
    duration: string;
    groupSize: string;
    price: string;
    highlights: string[];
    routes?: { time: string; location: string; desc: string; type?: 'Attraction' | 'Enterprise' | 'Custom'; referenceId?: number; autoTime?: number }[];
    visits?: number;
    rating?: number;
    dateAdded?: string;
    tags?: string[];
}

export interface BlogPost {
    id: number;
    title: string;
    category: string;
    excerpt: string;
    content: string;
    authorName: string;
    authorAvatar: string;
    date: string;
    image: string;
    readTime: string;
    status?: 'Published' | 'Under Review'; 
}

export interface Inquiry {
    id: number;
    sender: string;
    email: string;
    subject: string;
    message: string;
    date: string;
    status: 'New' | 'Read' | 'Replied';
}

export interface CheckIn {
    id: number;
    userId: string;
    userName: string;
    locationId: string;
    locationName: string;
    timestamp: string;
}

export interface User {
    id: string;
    name: string;
    email: string;
    role: 'USER' | 'ADMIN' | 'OWNER';
    avatar?: string;
    itinerary: number[];
    history: string[];
    joinedDate: string;
    approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
    emailVerified?: boolean;
}

export interface Heritage {
    id: number;
    name: string;
    period: string;
    location: string;
    description: string;
    fullHistory: string;
    significance: string;
    img: string;
    gallery?: string[];
    videoUrl?: string;
    coordinates: { lat: number; lng: number };
    visits?: number;
    rating?: number;
    reviews?: Review[];
    tags?: string[];
    photos?: string[];
}

export interface UserTourDestination {
    itemId: string;
    entityType: 'Attraction' | 'Enterprise' | 'Heritage';
    completed: boolean;
}

export interface CustomUserTour {
    id: string; // Used locally or as firestore id
    userId: string;
    name: string;
    destinations: UserTourDestination[];
    createdAt: number;
}

// ─── Curated Itinerary Booking ────────────────────────────────────────────────

export type TourTheme = 'Seascape' | 'Naturescape' | 'Mountaineering' | 'Camping' | 'Custom' | string;

export interface CuratedRouteStop {
    itemId: string;
    entityType: 'Attraction' | 'Enterprise' | 'Heritage';
    itemName: string;
    suggestedTime?: string; // e.g. "Morning", "Afternoon"
    durationHours?: number; // auto-derived from scheduledTime → endTime
    scheduledTime?: string; // start time e.g. "08:00" (24hr)
    endTime?: string;       // end time e.g. "09:30" (24hr)
    notes?: string;
    dayIndex?: number;
}

// A named premade route within a Tour (e.g. "Route A", "The Coastal Loop")
export interface TourRoute {
    id: string;
    name: string;
    stops: CuratedRouteStop[]; // ordered stops with scheduledTime per stop
}

export interface CuratedRoute {
    id: string;
    name: string;
    theme: TourTheme;
    description: string;
    coverImage?: string;
    // Pool of attraction/enterprise/heritage itemIds approved for this tour
    availableAttractions?: string[];
    // Premade routes for the tour (each has its own ordered stop schedule)
    tourRoutes?: TourRoute[];
    // Legacy flat stops kept for backwards compat with user custom tours
    stops: CuratedRouteStop[];
    estimatedDays: number;
    difficulty?: 'Easy' | 'Moderate' | 'Challenging';
    createdAt: number;
    updatedAt: number;
    isActive: boolean;
}

export interface TravelerBreakdown {
    total: number;
    males: number;
    females: number;
    local: number;
    foreign: number;
    children: number;
}

export type BookingStatus = 'Pending' | 'Confirmed' | 'Cancelled' | 'Completed';

export interface TourBooking {
    id: string;
    routeId: string;
    routeName: string;
    theme: TourTheme;
    // Contact
    contactName: string;
    contactEmail: string;
    contactPhone: string;
    // Travelers
    travelers: TravelerBreakdown;
    // Schedule — array of date strings e.g. ["2025-05-02", "2025-05-03", "2025-05-04"]
    scheduledDates: string[];
    // Auto-schedule answers
    autoScheduled: boolean;
    pace?: 'Relaxed' | 'Moderate' | 'Fast';
    transport?: 'Walking' | 'Vehicle' | 'Both';
    preferredTimeRange?: 'Morning' | 'Afternoon' | 'Full Day';
    // Admin
    status: BookingStatus;
    adminNotes?: string;
    createdAt: number;
    color?: string; // Assigned by system for calendar display
    // Custom Tour Extensions
    userId?: string;
    isCustom?: boolean;
    customStops?: CuratedRouteStop[];
    qrCode?: string; // Assigned upon approval
}
