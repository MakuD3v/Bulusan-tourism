import { Tour } from './types';

export const tours: Tour[] = [
    {
        id: 1,
        title: 'The Volcano Crater Trek',
        desc: 'An exhilarating full-day hike to the crater lake of Mount Bulusan. Experience diverse flora, a challenging ascent, and breathtaking panoramic views.',
        image: 'https://images.unsplash.com/photo-1522163182402-834f871fd851?auto=format&fit=crop&q=80',
        duration: '8 Hours',
        groupSize: 'Max 10',
        price: '₱2,500',
        highlights: ['Crater Lake Views', 'Rainforest Exploration', 'Local Guide Included'],
        visits: 890,
        rating: 4.9,
        dateAdded: '2023-01-01T00:00:00Z',
        tags: ['hiking', 'volcano', 'nature', 'adventure', 'lake', 'challenging'],
        routes: [
            { time: '05:00 AM', location: 'Bulusan Lake Visitor Center', desc: 'Meetup, registration, and safety briefing.' },
            { time: '06:00 AM', location: 'Ranger Station', desc: 'Start of the ascent through the lower rainforest canopy.' },
            { time: '09:30 AM', location: 'Lake Aguingay', desc: 'Rest stop at the intermittent lake bed. Perfect for photos.' },
            { time: '11:30 AM', location: 'Crater Lake Summit', desc: 'Reach the summit, eat packed lunch, and enjoy the views.' },
            { time: '01:00 PM', location: 'Descent Trail', desc: 'Begin the descent back towards the national park entrance.' },
            { time: '04:00 PM', location: 'Bulusan Springs', desc: 'End the tour with a relaxing dip in the hot springs.' }
        ]
    },
    {
        id: 2,
        title: 'Serene Lake Getaway',
        desc: 'A relaxing half-day tour featuring kayaking on Bulusan Lake, a guided nature walk along the perimeter, and a local picnic.',
        image: 'https://images.unsplash.com/photo-1437622368342-7a3d73a34c8f?auto=format&fit=crop&q=80',
        duration: '4 Hours',
        groupSize: 'Max 20',
        price: '₱850',
        highlights: ['Kayaking', 'Nature Walk', 'Picnic by the Lake'],
        visits: 450,
        rating: 4.6,
        dateAdded: new Date().toISOString(),
        tags: ['lake', 'relaxing', 'kayak', 'family', 'nature'],
        routes: [
            { time: '08:00 AM', location: 'Bulusan Lake Front', desc: 'Arrive and secure life vests for the morning cruise.' },
            { time: '08:15 AM', location: 'Open Water Kayaking', desc: 'Guided kayaking tour around the main bodies of the lake.' },
            { time: '10:00 AM', location: 'Perimeter Trail', desc: 'Dock the kayaks and walk the 3km paved nature trail.' },
            { time: '11:00 AM', location: 'Lake View Picnic Area', desc: 'Enjoy a locally prepared boodle-fight style lunch.' },
            { time: '12:00 PM', location: 'Souvenir Shop', desc: 'Tour concludes with free time for local crafts.' }
        ]
    }
];
