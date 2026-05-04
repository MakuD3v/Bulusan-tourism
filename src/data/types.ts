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
    droneVideoId?: string;
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
    firebaseId?: string;
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
    firebaseId?: string;
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
    firebaseId?: string;
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
    firebaseId?: string;
}

export interface Inquiry {
    id: number;
    sender: string;
    email: string;
    subject: string;
    message: string;
    date: string;
    status: 'New' | 'Read' | 'Replied';
    firebaseId?: string;
}

export interface CheckIn {
    id: number;
    userId: string;
    userName: string;
    locationId: string;
    locationName: string;
    timestamp: string;
    firebaseId?: string;
}

export interface User {
    id: string;
    name: string;
    email: string;
    role: 'USER' | 'ADMIN';
    avatar?: string;
    itinerary: number[];
    history: string[];
    joinedDate: string;
    firebaseId?: string;
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
    firebaseId?: string;
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
    firebaseId?: string;
}
