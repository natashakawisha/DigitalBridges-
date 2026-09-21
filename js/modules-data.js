// ===== Module Content Data =====
// Single source of truth for training module content.
// Used by learning.html (module cards) and module.html (detail page).
// Each topic/objective/lesson icon is a key resolved by ICON_MAP in script.js.
window.MODULES_DATA = [
  {
    id: 1, number: '01', duration: '2 hours', level: 'Beginner',
    title: 'Introduction to Digital Literacy',
    subtitle: 'Build your foundation in digital technology',
    description: 'Learn the essentials of using digital devices, from smartphones to computers. Understand how to navigate the internet, use basic apps, and communicate digitally with confidence.',
    topics: [
      { label: 'Understanding Digital Devices', icon: 'device' },
      { label: 'Smartphone & Computer Basics', icon: 'computer' },
      { label: 'Internet Navigation', icon: 'globe' },
      { label: 'Digital Communication Intro', icon: 'chat' }
    ],
    objectives: [
      'Identify common digital devices and explain what each is used for',
      'Navigate a smartphone and a computer confidently',
      'Connect to the internet and browse for information',
      'Send your first digital message to a friend or family member'
    ],
    lessons: [
      { title: 'What is Digital Literacy?', summary: 'Why digital skills matter for work, learning, and everyday life in Zambia.' },
      { title: 'Getting to Know Your Device', summary: 'Parts of a smartphone and computer, turning on, and basic controls.' },
      { title: 'Connecting to the Internet', summary: 'Wi-Fi and mobile data, opening a browser, and searching the web.' },
      { title: 'Your First Online Communication', summary: 'Sending a message and making your first video or voice call.' }
    ]
  },
  {
    id: 2, number: '02', duration: '2.5 hours', level: 'Beginner',
    title: 'Online Safety & Cyber Hygiene',
    subtitle: 'Protect yourself in the digital world',
    description: 'Learn how to create strong passwords, recognize scams and phishing attempts, protect your personal data, and practice safe online behavior across all platforms.',
    topics: [
      { label: 'Password Management', icon: 'lock' },
      { label: 'Scam & Phishing Awareness', icon: 'alert' },
      { label: 'Social Media Safety', icon: 'shield' },
      { label: 'Privacy & Data Protection', icon: 'eye' },
      { label: 'Safe Online Behavior', icon: 'check' }
    ],
    objectives: [
      'Create and manage strong, unique passwords',
      'Recognize scams, phishing messages, and fake links',
      'Configure privacy settings on social media',
      'Protect your personal and financial data online'
    ],
    lessons: [
      { title: 'Strong Passwords', summary: 'Building passwords that are hard to guess and easy to remember.' },
      { title: 'Spotting Scams & Phishing', summary: 'Real examples of fraud targeting Zambian users and how to avoid them.' },
      { title: 'Social Media Privacy', summary: 'Controlling who sees your posts, photos, and personal details.' },
      { title: 'Protecting Your Data', summary: 'Safe browsing, secure connections, and what to do if you are hacked.' }
    ]
  },
  {
    id: 3, number: '03', duration: '2 hours', level: 'Beginner',
    title: 'Digital Communication & Collaboration',
    subtitle: 'Connect and work with others effectively',
    description: 'Master the tools and etiquette for digital communication. From professional email use to video conferencing and collaborative platforms.',
    topics: [
      { label: 'Email Use & Etiquette', icon: 'mail' },
      { label: 'Messaging Platforms', icon: 'chat' },
      { label: 'Video Conferencing Tools', icon: 'video' },
      { label: 'Digital Teamwork', icon: 'users' }
    ],
    objectives: [
      'Write clear, professional emails',
      'Use messaging apps like WhatsApp effectively',
      'Join and host video calls with confidence',
      'Collaborate with others on shared documents'
    ],
    lessons: [
      { title: 'Email Essentials', summary: 'Creating an account, subject lines, attachments, and etiquette.' },
      { title: 'Messaging Platforms', summary: 'Group chats, voice notes, and staying organized.' },
      { title: 'Video Conferencing', summary: 'Joining Zoom or Google Meet calls and presenting yourself well.' },
      { title: 'Collaborative Tools', summary: 'Working together on shared documents in real time.' }
    ]
  },
  {
    id: 4, number: '04', duration: '2 hours', level: 'Intermediate',
    title: 'Information & Media Literacy',
    subtitle: 'Think critically about what you see online',
    description: 'Develop critical thinking skills to identify misinformation, verify sources, and share content responsibly in the complex information landscape.',
    topics: [
      { label: 'Identifying Misinformation', icon: 'search' },
      { label: 'Fact-Checking Basics', icon: 'check' },
      { label: 'Responsible Content Sharing', icon: 'share' },
      { label: 'Critical Digital Thinking', icon: 'book' }
    ],
    objectives: [
      'Evaluate online information critically before believing it',
      'Verify sources and check facts',
      'Share content responsibly without spreading rumours',
      'Recognize bias, clickbait, and misinformation'
    ],
    lessons: [
      { title: 'What is Misinformation?', summary: 'Fake news, doctored images, and how false claims spread.' },
      { title: 'Fact-Checking Tools', summary: 'Practical ways to verify a story before you share it.' },
      { title: 'Responsible Sharing', summary: 'The impact of forwarding unverified content.' },
      { title: 'Critical Thinking Online', summary: 'Asking the right questions about what you read.' }
    ]
  },
  {
    id: 5, number: '05', duration: '2.5 hours', level: 'Intermediate',
    title: 'Digital Financial Literacy',
    subtitle: 'Manage money safely in the digital age',
    description: 'Learn to use mobile money services safely, make secure digital payments, recognize financial fraud, and protect yourself during online transactions.',
    topics: [
      { label: 'Mobile Money Safety', icon: 'device' },
      { label: 'Digital Payments', icon: 'card' },
      { label: 'Fraud Awareness', icon: 'alert' },
      { label: 'Safe Online Transactions', icon: 'lock' }
    ],
    objectives: [
      'Use mobile money services such as Airtel Money and MTN MoMo safely',
      'Make secure digital payments and transfers',
      'Recognize and avoid financial fraud',
      'Protect yourself during online transactions'
    ],
    lessons: [
      { title: 'Mobile Money Basics', summary: 'Sending, receiving, and keeping your mobile money PIN safe.' },
      { title: 'Digital Payments', summary: 'Paying bills, buying airtime, and online transfers.' },
      { title: 'Avoiding Financial Fraud', summary: 'Common money scams and red flags to watch for.' },
      { title: 'Safe Online Shopping', summary: 'Buying online securely and protecting your card details.' }
    ]
  },
  {
    id: 6, number: '06', duration: '3 hours', level: 'Intermediate',
    title: 'Productivity & Work Readiness',
    subtitle: 'Build skills for the modern workplace',
    description: 'Develop practical workplace skills including document creation, internet research, online applications, and building a professional digital profile.',
    topics: [
      { label: 'Document Creation', icon: 'clipboard' },
      { label: 'Internet Research', icon: 'search' },
      { label: 'Online Applications', icon: 'edit' },
      { label: 'CV & Digital Profile', icon: 'users' }
    ],
    objectives: [
      'Create and edit documents and spreadsheets',
      'Research information effectively online',
      'Complete online application and registration forms',
      'Build a professional CV and digital profile'
    ],
    lessons: [
      { title: 'Document Creation', summary: 'Word processing and spreadsheets for everyday tasks.' },
      { title: 'Effective Online Research', summary: 'Finding reliable information and saving it properly.' },
      { title: 'Filling Online Forms', summary: 'Applying for jobs, services, and registrations online.' },
      { title: 'Building Your Digital CV', summary: 'Creating a CV and a professional online presence.' }
    ]
  },
  {
    id: 7, number: '07', duration: '3 hours', level: 'Advanced',
    title: 'Digital Entrepreneurship',
    subtitle: 'Grow your business using digital tools',
    description: 'Leverage social media for marketing, engage customers online, use digital business tools, and start selling through e-commerce platforms.',
    topics: [
      { label: 'Social Media Marketing', icon: 'trending' },
      { label: 'Customer Engagement', icon: 'users' },
      { label: 'Digital Business Tools', icon: 'tool' },
      { label: 'E-Commerce Basics', icon: 'cart' }
    ],
    objectives: [
      'Market a business using social media',
      'Engage and grow customers online',
      'Use digital tools to run a small business',
      'Start selling products or services online'
    ],
    lessons: [
      { title: 'Social Media Marketing', summary: 'Building a business page and reaching customers for free.' },
      { title: 'Customer Engagement', summary: 'Responding to customers and building trust online.' },
      { title: 'Digital Business Tools', summary: 'Free tools for records, invoices, and inventory.' },
      { title: 'E-Commerce Basics', summary: 'Selling on marketplaces and taking payments online.' }
    ]
  },
  {
    id: 8, number: '08', duration: '2 hours', level: 'All levels',
    title: 'Responsible Digital Citizenship',
    subtitle: 'Be a positive force in the digital world',
    description: 'Understand your digital rights and responsibilities, practice ethical technology use, promote inclusive online participation, and maintain mental wellbeing.',
    topics: [
      { label: 'Ethical Technology Use', icon: 'shield' },
      { label: 'Digital Rights', icon: 'clipboard' },
      { label: 'Inclusive Participation', icon: 'globe' },
      { label: 'Mental Wellbeing', icon: 'heart' }
    ],
    objectives: [
      'Understand your digital rights and responsibilities',
      'Use technology ethically and respectfully',
      'Promote inclusive, positive online participation',
      'Maintain healthy digital habits and wellbeing'
    ],
    lessons: [
      { title: 'Digital Rights & Responsibilities', summary: 'What you are entitled to online and what is expected of you.' },
      { title: 'Ethical Technology Use', summary: 'Respecting others, copyright, and honest behaviour online.' },
      { title: 'Inclusive Participation', summary: 'Making digital spaces welcoming for everyone.' },
      { title: 'Digital Wellbeing', summary: 'Balancing screen time and protecting your mental health.' }
    ]
  }
];
