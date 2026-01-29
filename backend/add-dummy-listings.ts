// Add dummy product listings to the database
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

const dummyListings = [
    {
        title: 'iPhone 13 Pro - Excellent Condition',
        description: 'Selling my iPhone 13 Pro in excellent condition. 256GB, Sierra Blue. Comes with original box, charger, and case. Battery health 95%. No scratches or dents.',
        price: 65000,
        category_id: 2, // Electronics
        condition: 'like_new',
        images: ['https://images.unsplash.com/photo-1632661674596-df8be070a5c5?w=800'],
        location: 'Hostel A',
        listing_type: 'sell'
    },
    {
        title: 'MacBook Air M1 2020',
        description: 'MacBook Air M1 chip, 8GB RAM, 256GB SSD. Perfect for students. Barely used, like new condition. Includes original charger and box.',
        price: 75000,
        category_id: 2, // Electronics
        condition: 'like_new',
        images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800'],
        location: 'Hostel B',
        listing_type: 'sell'
    },
    {
        title: 'Engineering Textbooks Bundle',
        description: 'Complete set of engineering textbooks for CSE 3rd year. Includes Data Structures, DBMS, OS, and Computer Networks. All in good condition with minimal highlighting.',
        price: 3500,
        category_id: 1, // Books
        condition: 'good',
        images: ['https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800'],
        location: 'Library',
        listing_type: 'sell'
    },
    {
        title: 'Mountain Bike - Hero Sprint',
        description: 'Hero Sprint mountain bike, 21 gears, excellent condition. Perfect for campus rides and weekend trips. Recently serviced.',
        price: 8500,
        category_id: 8, // Bikes
        condition: 'good',
        images: ['https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?w=800'],
        location: 'Hostel C',
        listing_type: 'sell'
    },
    {
        title: 'Study Table with Chair',
        description: 'Wooden study table with comfortable chair. Great for hostel room. Compact design, perfect for small spaces.',
        price: 2500,
        category_id: 3, // Furniture
        condition: 'good',
        images: ['https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=800'],
        location: 'Hostel D',
        listing_type: 'sell'
    },
    {
        title: 'Gaming Laptop - ASUS ROG',
        description: 'ASUS ROG Strix G15, RTX 3060, Ryzen 7, 16GB RAM, 512GB SSD. Perfect for gaming and heavy tasks. Excellent cooling system.',
        price: 95000,
        category_id: 2, // Electronics
        condition: 'like_new',
        images: ['https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800'],
        location: 'Hostel A',
        listing_type: 'sell'
    },
    {
        title: 'Hostel Room for Rent',
        description: 'Single occupancy room available for rent. Fully furnished with bed, study table, and wardrobe. Attached bathroom. Available from next month.',
        price: null,
        rental_rate: 8000,
        rental_period: 'monthly',
        category_id: 3, // Furniture
        condition: 'like_new',
        images: ['https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800'],
        location: 'Hostel E',
        listing_type: 'rent'
    },
    {
        title: 'Guitar - Yamaha F280',
        description: 'Yamaha F280 acoustic guitar in excellent condition. Perfect for beginners and intermediate players. Comes with bag and extra strings.',
        price: 7500,
        category_id: 7, // Musical Instruments
        condition: 'like_new',
        images: ['https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800'],
        location: 'Music Room',
        listing_type: 'sell'
    },
    {
        title: 'Calculus & Linear Algebra Books',
        description: 'Higher Engineering Mathematics by B.S. Grewal and Linear Algebra by Gilbert Strang. Both in very good condition.',
        price: 1200,
        category_id: 1, // Books
        condition: 'good',
        images: ['https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800'],
        location: 'Academic Block',
        listing_type: 'sell'
    },
    {
        title: 'Wireless Headphones - Sony WH-1000XM4',
        description: 'Sony WH-1000XM4 noise cancelling headphones. Excellent sound quality, perfect for studying. Includes case and cables.',
        price: 18000,
        category_id: 2, // Electronics
        condition: 'like_new',
        images: ['https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800'],
        location: 'Hostel B',
        listing_type: 'sell'
    },
    {
        title: 'Mini Fridge - Perfect for Hostel',
        description: 'Compact mini fridge, 50L capacity. Perfect for hostel room. Energy efficient and quiet operation.',
        price: 4500,
        category_id: 3, // Furniture
        condition: 'good',
        images: ['https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=800'],
        location: 'Hostel C',
        listing_type: 'sell'
    },
    {
        title: 'Cricket Kit - Complete Set',
        description: 'Complete cricket kit including bat, pads, gloves, helmet, and bag. Lightly used, excellent condition.',
        price: 5500,
        category_id: 6, // Sports Equipment
        condition: 'good',
        images: ['https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800'],
        location: 'Sports Complex',
        listing_type: 'sell'
    }
];

async function addDummyListings() {
    const client = await pool.connect();

    try {
        console.log('🚀 Starting to add dummy listings...\n');

        // First, create a test user if doesn't exist
        const userEmail = 'demo@thapar.edu';
        let userId;

        const userCheck = await client.query(
            'SELECT id FROM users WHERE email = $1',
            [userEmail]
        );

        if (userCheck.rows.length > 0) {
            userId = userCheck.rows[0].id;
            console.log('✅ Using existing demo user:', userEmail);
        } else {
            const userResult = await client.query(
                `INSERT INTO users (email, password_hash, name, is_verified) 
                 VALUES ($1, $2, $3, $4) 
                 RETURNING id`,
                [userEmail, '$2b$10$dummy.hash.for.demo.user.only', 'Demo User', true]
            );
            userId = userResult.rows[0].id;
            console.log('✅ Created demo user:', userEmail);
        }

        console.log('\n📦 Adding product listings...\n');

        // Add each listing
        for (const listing of dummyListings) {
            const result = await client.query(
                `INSERT INTO listings 
                (user_id, title, description, price, rental_rate, rental_period, category_id, condition, images, location, listing_type, status) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
                RETURNING id, title`,
                [
                    userId,
                    listing.title,
                    listing.description,
                    listing.price || null,
                    (listing as any).rental_rate || null,
                    (listing as any).rental_period || null,
                    listing.category_id,
                    listing.condition,
                    listing.images,
                    listing.location,
                    listing.listing_type,
                    'active'
                ]
            );

            console.log(`✅ Added: ${result.rows[0].title}`);
        }

        console.log(`\n🎉 Successfully added ${dummyListings.length} dummy listings!`);
        console.log('\n📊 Summary:');
        console.log(`   - User: ${userEmail}`);
        console.log(`   - Total Listings: ${dummyListings.length}`);
        console.log(`   - Categories: Electronics, Books, Sports, Furniture, Housing`);
        console.log('\n✅ You can now view these listings on the homepage!');

    } catch (error) {
        console.error('❌ Error adding dummy listings:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Run the script
addDummyListings()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
