export interface User {
  id: string;
  name: string;
  avatar: string;
  department: string;
  level: string;
}

export interface Product {
  id: string;
  title: string;
  price: number;
  image: string;
  category: string;
  description: string;
  condition: string;
  seller: User;
  createdAt: string;
  location: string;
}

export interface Post {
  id: string;
  author: User;
  content: string;
  image?: string;
  likes: number;
  comments: number;
  createdAt: string;
}

export interface Message {
  id: string;
  sender: User;
  content: string;
  createdAt: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  participant: User;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export interface NewsArticle {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  image: string;
  author: User;
  category: string;
  createdAt: string;
  readTime: string;
}

export const currentUser: User = {
  id: "u1",
  name: "Adebayo Johnson",
  avatar: "https://api.dicebear.com/9.x/initials/svg?seed=AJ",
  department: "Computer Science",
  level: "300L",
};

const users: User[] = [
  currentUser,
  {
    id: "u2",
    name: "Funmi Oladele",
    avatar: "https://api.dicebear.com/9.x/initials/svg?seed=FO",
    department: "Accounting",
    level: "200L",
  },
  {
    id: "u3",
    name: "Tunde Bakare",
    avatar: "https://api.dicebear.com/9.x/initials/svg?seed=TB",
    department: "Engineering",
    level: "400L",
  },
  {
    id: "u4",
    name: "Chioma Eze",
    avatar: "https://api.dicebear.com/9.x/initials/svg?seed=CE",
    department: "Mass Communication",
    level: "100L",
  },
  {
    id: "u5",
    name: "Ibrahim Musa",
    avatar: "https://api.dicebear.com/9.x/initials/svg?seed=IM",
    department: "Law",
    level: "500L",
  },
];

export const products: Product[] = [
  {
    id: "p1",
    title: "HP Laptop - Core i5, 8GB RAM",
    price: 150000,
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400",
    category: "Electronics",
    description:
      "Fairly used HP laptop in excellent condition. Core i5 processor, 8GB RAM, 256GB SSD. Battery lasts up to 4 hours. Perfect for school work and programming.",
    condition: "Fairly Used",
    seller: users[1],
    createdAt: "2 hours ago",
    location: "EKSU Campus",
  },
  {
    id: "p2",
    title: "Organic Chemistry Textbook (Morrison & Boyd)",
    price: 5000,
    image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400",
    category: "Books",
    description:
      "Morrison & Boyd Organic Chemistry 7th Edition. Clean copy with no markings. Essential for chemistry students.",
    condition: "Like New",
    seller: users[2],
    createdAt: "5 hours ago",
    location: "Faculty of Science",
  },
  {
    id: "p3",
    title: "iPhone 13 - 128GB",
    price: 280000,
    image: "https://images.unsplash.com/photo-1632661674596-df8be59a8238?w=400",
    category: "Electronics",
    description:
      "iPhone 13 in great condition. 128GB storage, battery health 89%. Comes with charger and case. No cracks or scratches.",
    condition: "Fairly Used",
    seller: users[3],
    createdAt: "1 day ago",
    location: "EKSU Hostel",
  },
  {
    id: "p4",
    title: "Study Table & Chair Set",
    price: 15000,
    image: "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=400",
    category: "Furniture",
    description:
      "Sturdy wooden study table with matching chair. Perfect for hostel rooms. Easy to move around.",
    condition: "Good",
    seller: users[4],
    createdAt: "2 days ago",
    location: "Off-Campus",
  },
  {
    id: "p5",
    title: "Scientific Calculator (Casio FX-991ES)",
    price: 8000,
    image: "https://images.unsplash.com/photo-1564466809058-bf4114d55352?w=400",
    category: "Electronics",
    description:
      "Casio FX-991ES Plus scientific calculator. Works perfectly. Ideal for engineering and science students.",
    condition: "Like New",
    seller: users[1],
    createdAt: "3 days ago",
    location: "EKSU Campus",
  },
  {
    id: "p6",
    title: "Room Fan - OX Industrial Standing Fan",
    price: 12000,
    image: "https://images.unsplash.com/photo-1617375407361-9815c5b10a8c?w=400",
    category: "Appliances",
    description:
      "OX 18-inch standing fan. Strong airflow, adjustable height. Perfect for the hot weather. Almost brand new.",
    condition: "Like New",
    seller: users[2],
    createdAt: "4 days ago",
    location: "EKSU Hostel",
  },
  {
    id: "p7",
    title: "Men's Academic Gown (Convocation)",
    price: 3500,
    image: "https://images.unsplash.com/photo-1523050854058-8df90110c476?w=400",
    category: "Fashion",
    description:
      "Black academic gown for convocation ceremonies. Size L. Used only once. Clean and well-ironed.",
    condition: "Like New",
    seller: users[3],
    createdAt: "5 days ago",
    location: "EKSU Campus",
  },
  {
    id: "p8",
    title: "Rechargeable Reading Lamp",
    price: 4500,
    image: "https://images.unsplash.com/photo-1507473885765-e6ed057ab6fe?w=400",
    category: "Appliances",
    description:
      "LED rechargeable desk lamp with adjustable brightness. Lasts up to 8 hours on full charge. Great for night reading.",
    condition: "Brand New",
    seller: users[4],
    createdAt: "1 week ago",
    location: "Off-Campus",
  },
];

export const posts: Post[] = [
  {
    id: "post1",
    author: users[0],
    content:
      "Just finished my final year project defense! 🎉 The panel was tough but we pulled through. Computer Science class of 2025 let's go! #EKSU #FinalYear",
    likes: 45,
    comments: 12,
    createdAt: "30 minutes ago",
  },
  {
    id: "post2",
    author: users[1],
    content:
      "Anyone in 200L Accounting that has the past questions for ACC 201? Please DM me. Exam is next week! 📚",
    likes: 8,
    comments: 23,
    createdAt: "2 hours ago",
  },
  {
    id: "post3",
    author: users[2],
    content:
      "EKSU SUG elections coming up next month. Make sure you register and vote! Your voice matters. 🗳️",
    image: "https://images.unsplash.com/photo-1494172961521-33799ddd43a5?w=600",
    likes: 120,
    comments: 45,
    createdAt: "5 hours ago",
  },
  {
    id: "post4",
    author: users[3],
    content:
      "The new cafeteria food is actually good! Tried the jollof rice and chicken today. Affordable too. 🍛",
    likes: 67,
    comments: 34,
    createdAt: "8 hours ago",
  },
  {
    id: "post5",
    author: users[4],
    content:
      "Law faculty mooting competition this Friday at the auditorium. Come support your colleagues! ⚖️",
    likes: 34,
    comments: 7,
    createdAt: "1 day ago",
  },
];

export const conversations: Conversation[] = [
  {
    id: "conv1",
    participant: users[1],
    lastMessage: "Is the laptop still available?",
    lastMessageTime: "2 min ago",
    unreadCount: 2,
  },
  {
    id: "conv2",
    participant: users[2],
    lastMessage: "Thanks! I'll come pick it up tomorrow",
    lastMessageTime: "1 hour ago",
    unreadCount: 0,
  },
  {
    id: "conv3",
    participant: users[3],
    lastMessage: "Can you do 250k for the iPhone?",
    lastMessageTime: "3 hours ago",
    unreadCount: 1,
  },
  {
    id: "conv4",
    participant: users[4],
    lastMessage: "See you at the library at 4pm",
    lastMessageTime: "Yesterday",
    unreadCount: 0,
  },
];

export const chatMessages: Message[] = [
  {
    id: "m1",
    sender: users[1],
    content: "Hi! I saw the HP laptop you listed. Is it still available?",
    createdAt: "10:30 AM",
    read: true,
  },
  {
    id: "m2",
    sender: currentUser,
    content: "Yes it is! Are you interested?",
    createdAt: "10:32 AM",
    read: true,
  },
  {
    id: "m3",
    sender: users[1],
    content: "Very interested! Can I see it today? I'm at the Faculty of Management Sciences",
    createdAt: "10:33 AM",
    read: true,
  },
  {
    id: "m4",
    sender: currentUser,
    content: "Sure! I'll be at the CS department till 4pm. You can come check it out anytime.",
    createdAt: "10:35 AM",
    read: true,
  },
  {
    id: "m5",
    sender: users[1],
    content: "Is the laptop still available?",
    createdAt: "2:15 PM",
    read: false,
  },
];

export const newsArticles: NewsArticle[] = [
  {
    id: "n1",
    title: "EKSU Wins National University Games (NUGA) Basketball Championship",
    excerpt:
      "The EKSU basketball team clinched the gold medal at the National University Games, defeating UNILAG in a thrilling final.",
    content: `The Ekiti State University basketball team has brought home the gold medal from the National University Games (NUGA), defeating the University of Lagos in a thrilling championship final that ended 78-72.

The team, coached by Mr. Adekunle Fashola, showed remarkable resilience throughout the tournament, winning all six of their games to claim the championship title.

Captain Oluwaseun Ajayi led the scoring with 24 points in the final, including a crucial three-pointer in the closing minutes that sealed the victory.

"This is a proud moment for EKSU and the entire Ekiti State," said the Vice Chancellor, Prof. Ojo Olumide, during the team's reception ceremony on campus.

The university has announced plans to upgrade the sports facilities and provide scholarships for outstanding athletes to encourage more students to participate in sports.`,
    image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=600",
    author: users[3],
    category: "Sports",
    createdAt: "1 hour ago",
    readTime: "3 min read",
  },
  {
    id: "n2",
    title: "New Computer Science Lab Officially Opened with State-of-the-Art Equipment",
    excerpt:
      "The Faculty of Science unveils a modern computer lab equipped with 100 new workstations and high-speed internet.",
    content: `The Faculty of Science at Ekiti State University has officially opened a new state-of-the-art computer science laboratory, equipped with 100 new workstations, high-speed internet connectivity, and modern software tools.

The lab, funded through a partnership with the Ekiti State Government and private sector donors, features Dell workstations with Intel Core i7 processors, dual monitors, and access to professional software including MATLAB, AutoCAD, and various programming environments.

"This facility will transform the learning experience for our computer science students and provide them with hands-on experience using industry-standard tools," said the Dean of Science, Prof. Adesanya Kehinde.

The lab will be open to students from 8 AM to 10 PM on weekdays and 9 AM to 5 PM on weekends. Students can book time slots through the new online reservation system.`,
    image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600",
    author: users[0],
    category: "Academics",
    createdAt: "3 hours ago",
    readTime: "4 min read",
  },
  {
    id: "n3",
    title: "EKSU Entrepreneurship Centre Launches Startup Incubator Program",
    excerpt:
      "Students can now apply for the new startup incubator program offering mentorship, funding, and workspace.",
    content: `The EKSU Entrepreneurship Centre has launched an exciting new startup incubator program designed to support student entrepreneurs in turning their innovative ideas into viable businesses.

The program offers selected students access to dedicated workspace, mentorship from experienced entrepreneurs, seed funding of up to ₦500,000, and networking opportunities with investors and industry leaders.

Applications are now open for the first cohort, with 20 spots available. Interested students from all departments are encouraged to apply with their business ideas before the deadline of March 30th.

"We believe that Nigerian universities should be breeding grounds for the next generation of entrepreneurs," said Dr. Folake Adeniyi, Director of the Entrepreneurship Centre.`,
    image: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=600",
    author: users[4],
    category: "Campus Life",
    createdAt: "6 hours ago",
    readTime: "3 min read",
  },
  {
    id: "n4",
    title: "Important: Second Semester Registration Deadline Extended",
    excerpt:
      "The university management has extended the course registration deadline by two weeks following student appeals.",
    content: `Following appeals from the Student Union Government and numerous student requests, the university management has announced a two-week extension for second semester course registration.

The new deadline is now April 15th, 2025. Students who have not yet completed their registration are urged to do so before the new deadline to avoid any academic complications.

The extension applies to all undergraduate and postgraduate programs. Students should visit their departmental offices or use the student portal to complete their registration.

Late registration fees will not be charged during this extension period.`,
    image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600",
    author: users[1],
    category: "Announcement",
    createdAt: "1 day ago",
    readTime: "2 min read",
  },
];

export const categories = [
  "All",
  "Electronics",
  "Books",
  "Fashion",
  "Furniture",
  "Appliances",
  "Services",
  "Food",
  "Others",
];
