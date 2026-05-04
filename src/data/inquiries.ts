import { Inquiry } from './types';

export const inquiries: Inquiry[] = [
    {
        id: 1,
        sender: 'Juan dela Cruz',
        email: 'juan@example.ph',
        subject: 'Bulusan Lake Kayaking Query',
        message: 'Hello! I am planning a visit next week. Are the kayaks available on weekends, and do I need to book in advance?',
        date: '2024-04-01',
        status: 'New'
    },
    {
        id: 2,
        sender: 'Maria Clara',
        email: 'maria.c@outlook.com',
        subject: 'Wedding Photo Inquiry',
        message: 'Is it possible to have a pre-wedding photoshoot at the volcano natural park? What are the fees involved?',
        date: '2024-03-31',
        status: 'Read'
    }
];
