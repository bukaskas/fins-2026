const sampleData = {
  users: [
    {
      name: 'John',
      email: 'admin@example.com',
      password: '123456',
      role: 'admin',
    },
    {
      name: 'Jane',
      email: 'user@example.com',
      password: '123456',
      role: 'user',
    },
  ],
  products: [
    {
      name: 'Private Beginner Course',
      slug: 'private-beginner-course',
      category: "Lessons",
      description: 'You will learn basics of the kite and proceed attempt your first water start with your IKO Instructor. You will now put your skills to the test and experience the full potential of the wind and the kite. You will learn to use the kite power to body drag in all possible directions, water relaunch your kite, recover your board; and attempt your first rides on the board!',
      images: [
        "/_next/static/media/product-1.a610ed59.webp"

      ],
      price: 22000,
      brand: 'Fins Kitesurfing',
      rating: 5,
      numReviews: 0,
      stock: 100,
      isFeatured: true,
      time: '6 hours',
    },
    {
      name: 'Group Beginner Course',
      slug: 'group-beginner-course',
      category: "Lessons",
      description: 'You will learn basics of the kite and proceed attempt your first water start with your IKO Instructor. You will now put your skills to the test and experience the full potential of the wind and the kite. You will learn to use the kite power to body drag in all possible directions, water relaunch your kite, recover your board; and attempt your first rides on the board!',
      images: [
        "/_next/static/media/product-2.a5f212e0.webp"

      ],
      price: 17000,
      brand: 'Fins Kitesurfing',
      rating: 5,
      numReviews: 0,
      stock: 100,
      isFeatured: true,
      time: '8 hours',
    },
    {
      name: 'Private Intro course',
      slug: 'private-intro-course',
      category: "Lessons",
      description: 'Do you want to discover the exciting sport of kiteboarding? Your IKO-certified instructor will introduce you to the sport and teach you essential safety rules and skills before entering the water. After that, you will learn how to control the kite, navigate with general concepts.',
      images: [

        "/_next/static/media/product-3.7c6c7cae.webp"
      ],
      price: 7500,
      brand: 'Fins Kitesurfing',
      rating: 5,
      numReviews: 0,
      stock: 100,
      isFeatured: true,
      time: '2 hours',
    },
    {
      name: 'Group intro course',
      slug: 'group-intro-course',
      category: "Lessons",
      description: 'Do you want to discover the exciting sport of kiteboarding? Your IKO-certified instructor will introduce you to the sport and teach you essential safety rules and skills before entering the water. After that, you will learn how to control the kite, navigate with general concepts.',
      images: [
        "/_next/static/media/product-4.57b78c64.webp"
      ],
      price: 5000,
      brand: 'Fins Kitesurfing',
      rating: 5,
      numReviews: 0,
      stock: 100,
      isFeatured: true,
      time: '2 hours',
    },

  ],
  inventoryItems: [
    { sku: "KITE-12M-001", name: "Kite 12m", category: "KITE", size: "12m", totalQty: 3, condition: "GOOD" },
    { sku: "KITE-9M-001", name: "Kite 9m", category: "KITE", size: "9m", totalQty: 2, condition: "GOOD" },
    { sku: "KITE-7M-001", name: "Kite 7m", category: "KITE", size: "7m", totalQty: 2, condition: "GOOD" },
    { sku: "BOARD-TT-140", name: "Twin Tip Board", category: "BOARD", size: "140cm", totalQty: 4, condition: "GOOD" },
    { sku: "BOARD-TT-136", name: "Twin Tip Board", category: "BOARD", size: "136cm", totalQty: 3, condition: "GOOD" },
    { sku: "BAR-001", name: "Control Bar", category: "BAR", size: null, totalQty: 3, condition: "GOOD" },
    { sku: "HARNESS-M-001", name: "Harness", category: "HARNESS", size: "M", totalQty: 3, condition: "GOOD" },
    { sku: "HARNESS-L-001", name: "Harness", category: "HARNESS", size: "L", totalQty: 2, condition: "GOOD" },
    { sku: "WETSUIT-M-001", name: "Wetsuit", category: "WETSUIT", size: "M", totalQty: 3, condition: "GOOD" },
    { sku: "WETSUIT-L-001", name: "Wetsuit", category: "WETSUIT", size: "L", totalQty: 2, condition: "GOOD" },
    { sku: "ACC-LEASH-001", name: "Safety Leash", category: "ACCESSORY", size: null, totalQty: 5, condition: "GOOD" },
    { sku: "ACC-HELMET-001", name: "Helmet", category: "ACCESSORY", size: null, totalQty: 4, condition: "GOOD" },
  ],
};

export default sampleData;
