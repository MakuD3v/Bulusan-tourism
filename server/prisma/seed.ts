import { PrismaClient } from '@prisma/client';
import { tours } from '../../src/data/tours';
import { blogPosts } from '../../src/data/blog';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing old data...');
  // Clear old data safely
  await prisma.route.deleteMany();
  await prisma.tour.deleteMany();
  await prisma.blogPost.deleteMany();
  await prisma.attraction.deleteMany();
  await prisma.enterprise.deleteMany();
  await prisma.heritage.deleteMany();

  console.log('Seeding Tours...');
  for (const tour of tours) {
    await prisma.tour.create({
      data: {
        title: tour.title,
        desc: tour.desc,
        image: tour.image,
        duration: tour.duration,
        groupSize: tour.groupSize,
        price: tour.price,
        highlights: tour.highlights,
        visits: tour.visits,
        rating: tour.rating,
        tags: tour.tags,
        routes: {
          create: tour.routes?.map(r => ({
            time: r.time,
            location: r.location,
            desc: r.desc
          })) || []
        }
      }
    });
  }

  console.log('Seeding Blogs...');
  for (const post of blogPosts) {
    await prisma.blogPost.create({
      data: {
        title: post.title,
        category: post.category,
        excerpt: post.excerpt,
        content: post.content,
        authorName: post.author.name,
        authorAvatar: post.author.avatar,
        image: post.image,
        readTime: post.readTime
      }
    });
  }

  console.log('Seeding Mock Attractions...');
  await prisma.attraction.createMany({
    data: [
      {
        name: 'Bulusan Lake',
        categories: ['Nature', 'Lake'],
        rating: 4.8,
        location: 'Bulusan Volcano National Park',
        lat: 12.7667,
        lng: 124.1,
        img: 'https://images.unsplash.com/photo-1437622368342-7a3d73a34c8f?auto=format&fit=crop&q=80',
        description: 'A serene crater lake surrounded by lush rainforest, perfect for kayaking and nature walks.',
        gallery: ['https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&q=80'],
        tags: ['lake', 'nature', 'kayaking'],
        featured: true
      },
      {
        name: 'Palogtok Falls',
        categories: ['Waterfall', 'Swimming'],
        rating: 4.5,
        location: 'San Roque, Bulusan',
        lat: 12.75,
        lng: 124.1333,
        img: 'https://images.unsplash.com/photo-1522163182402-834f871fd851?auto=format&fit=crop&q=80',
        description: 'A beautiful miniature waterfall featuring cold, refreshing spring water surrounded by coconut groves.',
        gallery: [],
        tags: ['waterfall', 'swimming', 'cold spring'],
        featured: true
      }
    ]
  });

  console.log('Seeding Mock Enterprises...');
  await prisma.enterprise.createMany({
    data: [
      {
        name: 'Balay Buhay sa Doban',
        categories: ['Resort', 'Dining'],
        rating: 4.7,
        location: 'San Roque, Bulusan',
        lat: 12.752,
        lng: 124.131,
        img: 'https://images.unsplash.com/photo-1542314831-c6a4d14d8376?auto=format&fit=crop&q=80',
        description: 'An eco-resort offering traditional dining, comfortable lodging, and nature trails.',
        amenities: ['Restaurant', 'Pool', 'Parking'],
        tags: ['resort', 'eco', 'food'],
        featured: true
      }
    ]
  });

  console.log('Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
