import { v4 as uuidv4 } from 'uuid';
import { addDays, format } from 'date-fns';
import type { EventProfile } from '@/types/event';
import type { BudgetPlan } from '@/types/budget';
import type { PlanningTask } from '@/types/timeline';
import type { VendorEntry, VendorPaymentMilestone } from '@/types/vendor';
import type { Guest } from '@/types/guest';
import type { ShowBlock } from '@/types/runofshow';
import type { RiskItem, ReadinessScore } from '@/types/risk';
import type { CreativeConcept } from '@/types/ideas';
import type { StoredEvent } from '@/types/persistence';
import { generateDefaultCategories, allocateBudget } from '@/lib/budget-engine';
import { generateTimeline } from '@/lib/timeline-engine';
import { detectRisks, calculateReadinessScore } from '@/lib/risk-engine';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isoDate(d: Date): string {
  return format(d, 'yyyy-MM-dd');
}

function isoNow(): string {
  return new Date().toISOString();
}

function makePaymentMilestone(
  description: string,
  amount: number,
  daysFromNow: number,
): VendorPaymentMilestone {
  return {
    id: uuidv4(),
    description,
    amount,
    dueDate: isoDate(addDays(new Date(), daysFromNow)),
    isPaid: false,
  };
}

// ---------------------------------------------------------------------------
// createDemoEvent helper
// ---------------------------------------------------------------------------

interface DemoEventConfig {
  profile: EventProfile;
  vendors: VendorEntry[];
  guests: Guest[];
  runOfShow: ShowBlock[];
  ideas: CreativeConcept[];
}

function createDemoEvent(config: DemoEventConfig): StoredEvent {
  const { profile, vendors, guests, runOfShow, ideas } = config;

  // Generate timeline
  const tasks: PlanningTask[] = generateTimeline(profile);

  // Generate budget
  const categories = generateDefaultCategories(profile.type);
  const budgetPlan: BudgetPlan = {
    ...allocateBudget(profile.totalBudget, categories, profile.contingencyPercent, []),
    eventId: profile.id,
  };

  // Detect risks
  const riskParams = { event: profile, budget: budgetPlan, tasks, vendors, runOfShow };
  const risks: RiskItem[] = detectRisks(riskParams);

  // Calculate readiness
  const readinessScore: ReadinessScore = calculateReadinessScore(riskParams);

  return {
    profile,
    budget: budgetPlan,
    tasks,
    vendors,
    guests,
    runOfShow,
    risks,
    readinessScore,
    ideas,
    copilotHistory: [],
    undoStack: [],
  };
}

// ---------------------------------------------------------------------------
// DEMO EVENT 1 — Priya & Rohan's Wedding
// ---------------------------------------------------------------------------

function buildWeddingEvent(): StoredEvent {
  const now = new Date();
  const eventDate = addDays(now, 270);
  const eventId = uuidv4();
  const eventDateStr = isoDate(eventDate);

  const profile: EventProfile = {
    id: eventId,
    name: "Priya & Rohan's Wedding",
    type: 'wedding',
    status: 'planning',
    date: eventDateStr,
    time: '16:00',
    city: 'Mumbai',
    guestCount: 120,
    confirmedGuestCount: 85,
    currency: 'INR',
    totalBudget: 1500000,
    contingencyPercent: 10,
    theme: {
      style: ['garden', 'romantic', 'traditional'],
      colorPreferences: ['ivory', 'gold', 'blush pink'],
      indoorOutdoor: 'both',
      hasWeatherBackup: true,
      weatherBackupDescription: 'Indoor banquet hall as fallback if rain',
    },
    dietaryRequirements: ['vegetarian', 'vegan'],
    accessibilityNeeds: ['mixed-ages', 'mobility-limited'],
    priorities: ['photography', 'catering', 'venue'],
    culturalNotes: 'Traditional Hindu ceremony with Gujarati customs',
    isDemo: true,
    createdAt: isoNow(),
    updatedAt: isoNow(),
    description: 'A romantic garden wedding celebrating Priya and Rohan with 120 loved ones in Mumbai.',
  };

  // Vendors
  const vendors: VendorEntry[] = [
    {
      id: uuidv4(),
      eventId,
      category: 'venue',
      requirement: 'Banquet hall with garden area, capacity 150+',
      businessName: 'Grand Pavilion Banquet Hall',
      contactName: 'Sunita Mehta',
      contactEmail: 'sunita@grandpavilion.example.com',
      contactPhone: '+91-9800000001',
      status: 'booked',
      estimatedCost: 350000,
      quotedCost: 350000,
      researchDeadline: isoDate(addDays(eventDate, -300)),
      bookingDeadline: isoDate(addDays(eventDate, -270)),
      questionsToAsk: [
        'Is indoor backup included in the package if weather turns bad?',
        'What is the maximum number of catering vendors allowed on premises?',
        'Is parking available for 80+ cars?',
      ],
      redFlags: [
        'Check if the venue has pending municipal NOC renewals',
        'Confirm there is no double-booking on your date',
      ],
      contractSigned: true,
      depositPaid: true,
      cancellationTerms: '50% refund if cancelled 90+ days before event',
      paymentMilestones: [
        makePaymentMilestone('Advance deposit (30%)', 105000, -10),
        makePaymentMilestone('Balance payment (70%)', 245000, 245),
      ],
      isCritical: true,
      isIllustrative: true,
      createdAt: isoNow(),
      updatedAt: isoNow(),
    },
    {
      id: uuidv4(),
      eventId,
      category: 'catering',
      requirement: 'Full vegetarian wedding catering for 120 guests',
      businessName: 'Aromas of India Catering',
      contactName: 'Rajesh Nair',
      contactEmail: 'rajesh@aromasindia.example.com',
      contactPhone: '+91-9800000002',
      status: 'quote-received',
      estimatedCost: 450000,
      quotedCost: 460000,
      researchDeadline: isoDate(addDays(eventDate, -210)),
      bookingDeadline: isoDate(addDays(eventDate, -180)),
      questionsToAsk: [
        'Can you accommodate a separate vegan menu for 15 guests?',
        'Do you provide serving staff and equipment?',
        'What is your policy for surplus food?',
      ],
      redFlags: [
        'Confirm FSSAI license is valid and displayed',
        'Ensure per-plate cost is itemised, not bundled',
      ],
      contractSigned: false,
      depositPaid: false,
      cancellationTerms: '30% cancellation fee if cancelled within 60 days',
      paymentMilestones: [
        makePaymentMilestone('Booking deposit (25%)', 112500, 30),
        makePaymentMilestone('Final payment (75%)', 337500, 255),
      ],
      isCritical: true,
      isIllustrative: true,
      createdAt: isoNow(),
      updatedAt: isoNow(),
    },
    {
      id: uuidv4(),
      eventId,
      category: 'photography',
      requirement: 'Wedding photography and candid shots',
      businessName: 'Moments by Kapoor Studio',
      contactName: 'Arjun Kapoor',
      contactEmail: 'arjun@kapoorstudio.example.com',
      contactPhone: '+91-9800000003',
      status: 'booked',
      estimatedCost: 120000,
      quotedCost: 120000,
      researchDeadline: isoDate(addDays(eventDate, -230)),
      bookingDeadline: isoDate(addDays(eventDate, -210)),
      questionsToAsk: [
        'How many edited images will be delivered, and in what format?',
        'Do you provide a pre-wedding shoot as part of the package?',
      ],
      redFlags: [
        'Check online portfolio — ensure consistent quality, not cherry-picked shots',
      ],
      contractSigned: true,
      depositPaid: true,
      cancellationTerms: 'Non-refundable deposit of 40%',
      paymentMilestones: [
        makePaymentMilestone('Booking deposit (40%)', 48000, -5),
        makePaymentMilestone('Balance on event day (60%)', 72000, 268),
      ],
      isCritical: false,
      isIllustrative: true,
      createdAt: isoNow(),
      updatedAt: isoNow(),
    },
    {
      id: uuidv4(),
      eventId,
      category: 'decor',
      requirement: 'Floral decor, mandap, table centrepieces',
      businessName: 'Blooms & Dreams Decor',
      contactName: 'Pooja Sharma',
      contactEmail: 'pooja@bloomsdreams.example.com',
      contactPhone: '+91-9800000004',
      status: 'contacted',
      estimatedCost: 180000,
      researchDeadline: isoDate(addDays(eventDate, -180)),
      bookingDeadline: isoDate(addDays(eventDate, -120)),
      questionsToAsk: [
        'Can you share your full floral portfolio for garden weddings?',
        'Do you handle setup and breakdown, or only delivery?',
        'What flowers are in season at the event date?',
      ],
      redFlags: [
        'Confirm flowers are fresh and not artificial unless explicitly chosen',
      ],
      contractSigned: false,
      depositPaid: false,
      paymentMilestones: [
        makePaymentMilestone('Booking deposit (30%)', 54000, 60),
        makePaymentMilestone('Final payment', 126000, 255),
      ],
      isCritical: false,
      isIllustrative: true,
      createdAt: isoNow(),
      updatedAt: isoNow(),
    },
    {
      id: uuidv4(),
      eventId,
      category: 'entertainment',
      requirement: 'Live band and DJ for reception',
      businessName: 'Mumbai Beats Entertainment',
      contactName: 'Karan Desai',
      contactEmail: 'karan@mumbaibeats.example.com',
      contactPhone: '+91-9800000005',
      status: 'researching',
      estimatedCost: 80000,
      researchDeadline: isoDate(addDays(eventDate, -150)),
      bookingDeadline: isoDate(addDays(eventDate, -90)),
      questionsToAsk: [
        'What is your setlist and can guests make song requests?',
        'Do you provide your own PA system and lighting?',
      ],
      redFlags: [
        'Ensure the band has performed at similar venues — outdoor acoustics differ from indoor',
      ],
      contractSigned: false,
      depositPaid: false,
      paymentMilestones: [
        makePaymentMilestone('Booking deposit (25%)', 20000, 90),
        makePaymentMilestone('Final payment', 60000, 260),
      ],
      isCritical: false,
      isIllustrative: true,
      createdAt: isoNow(),
      updatedAt: isoNow(),
    },
    {
      id: uuidv4(),
      eventId,
      category: 'transport',
      requirement: 'Luxury car for bride and groom, shuttle for guests',
      businessName: 'City Rides Luxury Transport',
      contactName: 'Amit Joshi',
      contactEmail: 'amit@cityrides.example.com',
      contactPhone: '+91-9800000006',
      status: 'not-started',
      estimatedCost: 45000,
      researchDeadline: isoDate(addDays(eventDate, -90)),
      bookingDeadline: isoDate(addDays(eventDate, -60)),
      questionsToAsk: [
        'Is the bridal car decorated as part of the package?',
        'Can you provide a shuttle loop for hotel guests?',
      ],
      redFlags: [
        'Confirm driver has commercial vehicle licence and insurance',
      ],
      contractSigned: false,
      depositPaid: false,
      paymentMilestones: [
        makePaymentMilestone('Advance (50%)', 22500, 190),
        makePaymentMilestone('Balance on event day (50%)', 22500, 269),
      ],
      isCritical: false,
      isIllustrative: true,
      createdAt: isoNow(),
      updatedAt: isoNow(),
    },
  ];

  // Guests
  const guests: Guest[] = [
    { id: uuidv4(), eventId, firstName: 'Meera', lastName: 'Sharma', email: 'meera.sharma@example.com', rsvpStatus: 'accepted', invitationStatus: 'delivered', hasPlusOne: false, dietaryRequirements: ['vegetarian'], accessibilityNeeds: [], isVIP: true, createdAt: isoNow(), updatedAt: isoNow() },
    { id: uuidv4(), eventId, firstName: 'Vikram', lastName: 'Patel', email: 'vikram.patel@example.com', rsvpStatus: 'accepted', invitationStatus: 'delivered', hasPlusOne: true, plusOneName: 'Sneha Patel', plusOneRsvp: 'accepted', dietaryRequirements: [], accessibilityNeeds: [], isVIP: true, createdAt: isoNow(), updatedAt: isoNow() },
    { id: uuidv4(), eventId, firstName: 'Ananya', lastName: 'Iyer', email: 'ananya.iyer@example.com', rsvpStatus: 'accepted', invitationStatus: 'delivered', hasPlusOne: false, dietaryRequirements: ['vegan'], accessibilityNeeds: ['mobility-limited'], isVIP: false, createdAt: isoNow(), updatedAt: isoNow() },
    { id: uuidv4(), eventId, firstName: 'Rajan', lastName: 'Gupta', email: 'rajan.gupta@example.com', rsvpStatus: 'pending', invitationStatus: 'sent', hasPlusOne: false, dietaryRequirements: [], accessibilityNeeds: [], isVIP: false, createdAt: isoNow(), updatedAt: isoNow() },
    { id: uuidv4(), eventId, firstName: 'Sunita', lastName: 'Reddy', email: 'sunita.reddy@example.com', rsvpStatus: 'accepted', invitationStatus: 'delivered', hasPlusOne: true, plusOneName: 'Mohan Reddy', plusOneRsvp: 'pending', dietaryRequirements: ['vegetarian'], accessibilityNeeds: [], isVIP: false, createdAt: isoNow(), updatedAt: isoNow() },
    { id: uuidv4(), eventId, firstName: 'Deepak', lastName: 'Singh', email: 'deepak.singh@example.com', rsvpStatus: 'accepted', invitationStatus: 'delivered', hasPlusOne: false, dietaryRequirements: [], accessibilityNeeds: ['mixed-ages'], isVIP: false, createdAt: isoNow(), updatedAt: isoNow() },
    { id: uuidv4(), eventId, firstName: 'Kavita', lastName: 'Nambiar', email: 'kavita.nambiar@example.com', rsvpStatus: 'declined', invitationStatus: 'delivered', hasPlusOne: false, dietaryRequirements: [], accessibilityNeeds: [], isVIP: false, createdAt: isoNow(), updatedAt: isoNow() },
    { id: uuidv4(), eventId, firstName: 'Aditya', lastName: 'Bose', email: 'aditya.bose@example.com', rsvpStatus: 'pending', invitationStatus: 'sent', hasPlusOne: false, dietaryRequirements: ['vegan'], accessibilityNeeds: [], isVIP: false, createdAt: isoNow(), updatedAt: isoNow() },
    { id: uuidv4(), eventId, firstName: 'Preethi', lastName: 'Rao', email: 'preethi.rao@example.com', rsvpStatus: 'accepted', invitationStatus: 'delivered', hasPlusOne: false, dietaryRequirements: [], accessibilityNeeds: [], isVIP: true, createdAt: isoNow(), updatedAt: isoNow() },
    { id: uuidv4(), eventId, firstName: 'Nikhil', lastName: 'Verma', email: 'nikhil.verma@example.com', rsvpStatus: 'accepted', invitationStatus: 'delivered', hasPlusOne: true, plusOneName: 'Ritu Verma', plusOneRsvp: 'accepted', dietaryRequirements: [], accessibilityNeeds: [], isVIP: false, createdAt: isoNow(), updatedAt: isoNow() },
    { id: uuidv4(), eventId, firstName: 'Lakshmi', lastName: 'Krishnan', email: 'lakshmi.krishnan@example.com', rsvpStatus: 'pending', invitationStatus: 'sent', hasPlusOne: false, dietaryRequirements: ['vegetarian'], accessibilityNeeds: ['mobility-limited'], isVIP: false, createdAt: isoNow(), updatedAt: isoNow() },
    { id: uuidv4(), eventId, firstName: 'Sanjay', lastName: 'Malhotra', email: 'sanjay.malhotra@example.com', rsvpStatus: 'declined', invitationStatus: 'delivered', hasPlusOne: false, dietaryRequirements: [], accessibilityNeeds: [], isVIP: false, createdAt: isoNow(), updatedAt: isoNow() },
  ];

  // Run of Show
  const runOfShow: ShowBlock[] = [
    { id: uuidv4(), eventId, title: 'Guest Arrival', category: 'arrival', startTime: '15:00', endTime: '16:00', durationMinutes: 60, location: 'Garden entrance', sortOrder: 1, dependencies: [], notes: 'Ushers to guide guests to seating' },
    { id: uuidv4(), eventId, title: 'Pre-ceremony Refreshments', category: 'reception', startTime: '15:30', endTime: '16:15', durationMinutes: 45, location: 'Poolside lounge', sortOrder: 2, dependencies: [], notes: 'Mocktails and light snacks served' },
    { id: uuidv4(), eventId, title: 'Ceremony', category: 'ceremony', startTime: '16:30', endTime: '17:30', durationMinutes: 60, location: 'Garden mandap', sortOrder: 3, dependencies: [], notes: 'Priest to begin at 16:30 sharp' },
    { id: uuidv4(), eventId, title: 'Family Photos', category: 'other', startTime: '17:30', endTime: '18:30', durationMinutes: 60, location: 'Garden backdrop', sortOrder: 4, dependencies: [], notes: 'Photographer to coordinate family groupings' },
    { id: uuidv4(), eventId, title: 'Cocktail Hour', category: 'reception', startTime: '17:45', endTime: '19:00', durationMinutes: 75, location: 'Terrace', sortOrder: 5, dependencies: [], notes: 'Cocktail bar open; band plays background music' },
    { id: uuidv4(), eventId, title: 'Reception Entrance', category: 'reception', startTime: '19:15', endTime: '19:30', durationMinutes: 15, location: 'Banquet hall', sortOrder: 6, dependencies: [], notes: 'Grand entrance of couple with dhol and confetti' },
    { id: uuidv4(), eventId, title: 'Dinner Service', category: 'dining', startTime: '19:30', endTime: '21:30', durationMinutes: 120, location: 'Banquet hall', sortOrder: 7, dependencies: [], notes: 'Buffet with vegan section labelled separately' },
    { id: uuidv4(), eventId, title: 'Speeches & Toasts', category: 'entertainment', startTime: '20:15', endTime: '21:00', durationMinutes: 45, location: 'Banquet hall stage', sortOrder: 8, dependencies: [], notes: 'Best man, maid of honour, and parents' },
    { id: uuidv4(), eventId, title: 'First Dance & Dancing', category: 'entertainment', startTime: '21:00', endTime: '23:00', durationMinutes: 120, location: 'Dance floor', sortOrder: 9, dependencies: [], notes: 'DJ takes over after first dance' },
    { id: uuidv4(), eventId, title: 'Farewell & Departure', category: 'departure', startTime: '23:00', endTime: '23:30', durationMinutes: 30, location: 'Main entrance', sortOrder: 10, dependencies: [], notes: 'Couple departs first; petal shower at exit' },
  ];

  // Ideas
  const ideas: CreativeConcept[] = [
    {
      id: uuidv4(),
      eventId,
      name: 'Garden Royale',
      creativeDirection: 'Lush outdoor garden elegance with cascading florals and candlelit pathways',
      whyItFits: 'Priya and Rohan love nature; a garden setting naturally frames the romantic atmosphere',
      colorPalette: { name: 'Ivory & Gold Garden', colors: ['#FFFFF0', '#D4AF37', '#F4C2C2', '#228B22'], description: 'Soft ivory and warm gold with blush and greenery accents' },
      decorSuggestions: ['Floral archway at mandap', 'Hanging lanterns on pathways', 'Moss table runners with gold candelabras'],
      invitationIdeas: ['Seed-paper invites with pressed flowers', 'Digital invite with animated garden motif'],
      menuDirection: 'Farm-to-table vegetarian with seasonal produce; vegan mezze station',
      activities: ['Floral jewellery-making station', 'Polaroid photo booth with garden backdrop'],
      entertainmentIdeas: ['Live tabla and sitar during ceremony', 'DJ set with Bollywood classics for reception'],
      budgetConscious: ['Use seasonal in-season flowers to reduce floral cost', 'Opt for candlelight over expensive event lighting'],
      sustainableOptions: ['Compostable serving ware', 'Donate leftover flowers to local hospice'],
      accessibilityConsiderations: 'Ensure paved pathways for mobility-limited guests; seating available along walkways',
      estimatedCostImpact: 'on-budget',
      practicalRequirements: ['Venue must have outdoor garden area min 5000 sq ft', 'Rain tent or indoor backup'],
      status: 'saved',
      generatedBy: 'local-engine',
      createdAt: isoNow(),
    },
    {
      id: uuidv4(),
      eventId,
      name: 'Heritage & Heirloom',
      creativeDirection: 'Traditional Indian aesthetics woven with contemporary Indian design',
      whyItFits: 'Reflects Gujarati cultural roots while appealing to a cosmopolitan guest list',
      colorPalette: { name: 'Saffron & Midnight', colors: ['#FF7F11', '#1B1F3B', '#C0A060', '#F5F0E8'], description: 'Warm saffron and deep midnight blue with antique gold highlights' },
      decorSuggestions: ['Antique brass urns with marigolds', 'Block-printed table linens', 'Rangoli entrance with flower petals'],
      invitationIdeas: ['Hand-painted motif card on handmade paper', "QR code linking to couple's story page"],
      menuDirection: 'Elaborate Gujarati thali with curated Indian fusion dessert bar',
      activities: ['Mehendi station for guests', "Story board of couple's journey with printed photos"],
      entertainmentIdeas: ['Classical dance performance during pre-dinner', 'Fusion folk-Bollywood medley'],
      budgetConscious: ['Marigolds are affordable and plentiful for festive decor', 'Limit expensive imported flowers'],
      sustainableOptions: ['Use clay diyas instead of electric lights', 'Recycle marigold garlands into compost'],
      accessibilityConsiderations: 'Ensure mehendi station has chairs; keep pathways clear of rangoli décor',
      estimatedCostImpact: 'slight-premium',
      practicalRequirements: ['Space for classical dance performance', 'Outdoor or large indoor mandap'],
      status: 'generated',
      generatedBy: 'local-engine',
      createdAt: isoNow(),
    },
    {
      id: uuidv4(),
      eventId,
      name: 'Minimalist Luxe',
      creativeDirection: 'Clean, contemporary aesthetic with curated statement pieces and negative space',
      whyItFits: 'Appeals to modern sensibilities while keeping focus on the couple rather than décor',
      colorPalette: { name: 'White, Sage & Charcoal', colors: ['#FFFFFF', '#B2C9AD', '#36454F', '#E8D5C4'], description: 'Crisp white with sage green and charcoal grey, warm nude accents' },
      decorSuggestions: ['Tall sculptural floral installations (2-3 hero pieces)', 'Minimal table settings with single-stem vases', 'Backlit acrylic name signage'],
      invitationIdeas: ['Letterpress white-on-white card', 'Digital micro-site with event details'],
      menuDirection: 'Contemporary Indian-Continental fusion; curated mocktail menu',
      activities: ['Custom perfume blending station', 'Digital guestbook with instant photo prints'],
      entertainmentIdeas: ['String quartet during cocktail hour', 'EDM Bollywood fusion DJ for dancing'],
      budgetConscious: ['Fewer but impactful décor hero pieces reduce total cost', 'Minimise per-table florals'],
      sustainableOptions: ['Rent décor items instead of buying', 'Digital invitations for 60% of guest list'],
      accessibilityConsiderations: 'Simple layout is naturally navigable for mobility-limited guests',
      estimatedCostImpact: 'premium',
      practicalRequirements: ['High ceilings for tall installations', 'AV for DJ and quartet setup'],
      status: 'generated',
      generatedBy: 'local-engine',
      createdAt: isoNow(),
    },
  ];

  return createDemoEvent({ profile, vendors, guests, runOfShow, ideas });
}

// ---------------------------------------------------------------------------
// DEMO EVENT 2 — Aarav's 30th Surprise Party
// ---------------------------------------------------------------------------

function buildBirthdayEvent(): StoredEvent {
  const now = new Date();
  const eventDate = addDays(now, 42);
  const eventId = uuidv4();
  const eventDateStr = isoDate(eventDate);

  const profile: EventProfile = {
    id: eventId,
    name: "Aarav's 30th Surprise Party",
    type: 'birthday',
    status: 'planning',
    date: eventDateStr,
    time: '18:00',
    city: 'Bangalore',
    guestCount: 40,
    confirmedGuestCount: 28,
    currency: 'INR',
    totalBudget: 150000,
    contingencyPercent: 10,
    theme: {
      style: ['modern', 'celebratory', 'surprise'],
      colorPreferences: ['black', 'gold', 'white'],
      indoorOutdoor: 'indoor',
      hasWeatherBackup: false,
    },
    dietaryRequirements: ['vegetarian', 'gluten-free'],
    accessibilityNeeds: ['mixed-ages'],
    priorities: ['entertainment', 'catering', 'guest-experience'],
    isDemo: true,
    createdAt: isoNow(),
    updatedAt: isoNow(),
    description: "A surprise 30th birthday party for Aarav with 40 close friends and family in Bangalore.",
  };

  // Vendors
  const vendors: VendorEntry[] = [
    {
      id: uuidv4(),
      eventId,
      category: 'venue',
      requirement: 'Private event space for 40 guests, indoor',
      businessName: 'The Terrace Club Bangalore',
      contactName: 'Rahul Menon',
      contactEmail: 'rahul.menon@terraceclub.example.com',
      contactPhone: '+91-9800000010',
      status: 'booked',
      estimatedCost: 30000,
      quotedCost: 30000,
      researchDeadline: isoDate(addDays(eventDate, -50)),
      bookingDeadline: isoDate(addDays(eventDate, -42)),
      questionsToAsk: [
        'Is a PA system and projector included in the venue hire?',
        'What is the noise curfew for the venue?',
        'Is there a separate green room for the surprise setup?',
      ],
      redFlags: [
        'Confirm the venue has a valid fire safety certificate',
        'Check if there are hidden F&B minimums not in the contract',
      ],
      contractSigned: true,
      depositPaid: true,
      cancellationTerms: 'Full forfeiture of deposit if cancelled within 14 days',
      paymentMilestones: [
        makePaymentMilestone('Booking deposit (50%)', 15000, -5),
        makePaymentMilestone('Balance on event day', 15000, 40),
      ],
      isCritical: true,
      isIllustrative: true,
      createdAt: isoNow(),
      updatedAt: isoNow(),
    },
    {
      id: uuidv4(),
      eventId,
      category: 'catering',
      requirement: 'Dinner buffet for 40 guests, vegetarian and gluten-free options',
      businessName: 'Spice Garden Catering Bangalore',
      contactName: 'Divya Rao',
      contactEmail: 'divya.rao@spicegarden.example.com',
      contactPhone: '+91-9800000011',
      status: 'quote-received',
      estimatedCost: 60000,
      quotedCost: 62000,
      researchDeadline: isoDate(addDays(eventDate, -35)),
      bookingDeadline: isoDate(addDays(eventDate, -21)),
      questionsToAsk: [
        'Which dishes are certified gluten-free vs. simply wheat-free?',
        'Can a custom birthday cake be included in the package?',
      ],
      redFlags: [
        'Request a tasting session before confirming — do not rely on photographs alone',
      ],
      contractSigned: false,
      depositPaid: false,
      paymentMilestones: [
        makePaymentMilestone('Booking deposit (30%)', 18000, 10),
        makePaymentMilestone('Final payment', 42000, 38),
      ],
      isCritical: true,
      isIllustrative: true,
      createdAt: isoNow(),
      updatedAt: isoNow(),
    },
    {
      id: uuidv4(),
      eventId,
      category: 'photography',
      requirement: 'Event photographer and candid videography',
      businessName: 'Click & Candid Studio',
      contactName: 'Nisha Pillai',
      contactEmail: 'nisha.pillai@clickcandid.example.com',
      contactPhone: '+91-9800000012',
      status: 'booked',
      estimatedCost: 20000,
      quotedCost: 20000,
      researchDeadline: isoDate(addDays(eventDate, -28)),
      bookingDeadline: isoDate(addDays(eventDate, -21)),
      questionsToAsk: [
        'Is a surprise reveal capture included in the package?',
        'What is the turnaround time for edited images?',
      ],
      redFlags: [
        'Confirm photographer will arrive 30 minutes early to prepare',
      ],
      contractSigned: true,
      depositPaid: true,
      cancellationTerms: 'Non-refundable 50% deposit',
      paymentMilestones: [
        makePaymentMilestone('Deposit (50%)', 10000, -3),
        makePaymentMilestone('Balance after delivery of images', 10000, 56),
      ],
      isCritical: false,
      isIllustrative: true,
      createdAt: isoNow(),
      updatedAt: isoNow(),
    },
    {
      id: uuidv4(),
      eventId,
      category: 'entertainment',
      requirement: 'DJ for birthday party, 3-hour set',
      businessName: 'BeatBox Events Bangalore',
      contactName: 'Rohan Pillai',
      contactEmail: 'rohan.pillai@beatboxevents.example.com',
      contactPhone: '+91-9800000013',
      status: 'contacted',
      estimatedCost: 15000,
      researchDeadline: isoDate(addDays(eventDate, -28)),
      bookingDeadline: isoDate(addDays(eventDate, -14)),
      questionsToAsk: [
        'Do you take advance song requests for the birthday mix?',
        'Is your equipment suitable for an indoor venue of this size?',
      ],
      redFlags: [
        'Check that the DJ has liability insurance for equipment damage',
      ],
      contractSigned: false,
      depositPaid: false,
      paymentMilestones: [
        makePaymentMilestone('Advance payment (100%)', 15000, 21),
      ],
      isCritical: false,
      isIllustrative: true,
      createdAt: isoNow(),
      updatedAt: isoNow(),
    },
  ];

  // Guests
  const guests: Guest[] = [
    { id: uuidv4(), eventId, firstName: 'Priya', lastName: 'Nair', email: 'priya.nair@example.com', rsvpStatus: 'accepted', invitationStatus: 'delivered', hasPlusOne: false, dietaryRequirements: ['vegetarian'], accessibilityNeeds: [], isVIP: true, createdAt: isoNow(), updatedAt: isoNow() },
    { id: uuidv4(), eventId, firstName: 'Kiran', lastName: 'Bhat', email: 'kiran.bhat@example.com', rsvpStatus: 'accepted', invitationStatus: 'delivered', hasPlusOne: true, plusOneName: 'Smita Bhat', plusOneRsvp: 'accepted', dietaryRequirements: ['gluten-free'], accessibilityNeeds: [], isVIP: false, createdAt: isoNow(), updatedAt: isoNow() },
    { id: uuidv4(), eventId, firstName: 'Tanvi', lastName: 'Kulkarni', email: 'tanvi.kulkarni@example.com', rsvpStatus: 'accepted', invitationStatus: 'delivered', hasPlusOne: false, dietaryRequirements: [], accessibilityNeeds: ['mixed-ages'], isVIP: false, createdAt: isoNow(), updatedAt: isoNow() },
    { id: uuidv4(), eventId, firstName: 'Suresh', lastName: 'Ghosh', email: 'suresh.ghosh@example.com', rsvpStatus: 'pending', invitationStatus: 'sent', hasPlusOne: false, dietaryRequirements: ['vegetarian'], accessibilityNeeds: [], isVIP: false, createdAt: isoNow(), updatedAt: isoNow() },
    { id: uuidv4(), eventId, firstName: 'Meghna', lastName: 'Joshi', email: 'meghna.joshi@example.com', rsvpStatus: 'accepted', invitationStatus: 'delivered', hasPlusOne: false, dietaryRequirements: ['gluten-free'], accessibilityNeeds: [], isVIP: false, createdAt: isoNow(), updatedAt: isoNow() },
    { id: uuidv4(), eventId, firstName: 'Arjun', lastName: 'Shah', email: 'arjun.shah@example.com', rsvpStatus: 'declined', invitationStatus: 'delivered', hasPlusOne: false, dietaryRequirements: [], accessibilityNeeds: [], isVIP: false, createdAt: isoNow(), updatedAt: isoNow() },
    { id: uuidv4(), eventId, firstName: 'Shalini', lastName: 'Dubey', email: 'shalini.dubey@example.com', rsvpStatus: 'pending', invitationStatus: 'sent', hasPlusOne: false, dietaryRequirements: [], accessibilityNeeds: [], isVIP: false, createdAt: isoNow(), updatedAt: isoNow() },
    { id: uuidv4(), eventId, firstName: 'Rohit', lastName: 'Saxena', email: 'rohit.saxena@example.com', rsvpStatus: 'accepted', invitationStatus: 'delivered', hasPlusOne: false, dietaryRequirements: ['vegetarian', 'gluten-free'], accessibilityNeeds: [], isVIP: true, createdAt: isoNow(), updatedAt: isoNow() },
  ];

  // Run of Show
  const runOfShow: ShowBlock[] = [
    { id: uuidv4(), eventId, title: 'Setup & Decoration', category: 'setup', startTime: '14:00', endTime: '16:00', durationMinutes: 120, location: 'Event space', sortOrder: 1, dependencies: [], notes: 'Coordinator to supervise; keep entrance locked' },
    { id: uuidv4(), eventId, title: 'Guest Arrival', category: 'arrival', startTime: '18:00', endTime: '18:30', durationMinutes: 30, location: 'Event space', sortOrder: 2, dependencies: [], notes: 'Guests must arrive before Aarav — strict timing' },
    { id: uuidv4(), eventId, title: 'Surprise Reveal', category: 'other', startTime: '18:30', endTime: '18:45', durationMinutes: 15, location: 'Main room', sortOrder: 3, dependencies: [], notes: 'DJ plays birthday jingle on cue; lights turn on' },
    { id: uuidv4(), eventId, title: 'Welcome Drinks & Mingling', category: 'reception', startTime: '18:45', endTime: '19:30', durationMinutes: 45, location: 'Bar area', sortOrder: 4, dependencies: [], notes: 'Cocktails and mocktails served; photographer active' },
    { id: uuidv4(), eventId, title: 'Dinner', category: 'dining', startTime: '19:30', endTime: '21:00', durationMinutes: 90, location: 'Dining area', sortOrder: 5, dependencies: [], notes: 'Buffet; gluten-free items labelled' },
    { id: uuidv4(), eventId, title: 'Cake & Celebration', category: 'other', startTime: '21:00', endTime: '21:30', durationMinutes: 30, location: 'Main room', sortOrder: 6, dependencies: [], notes: 'Birthday cake cutting; singing; photos' },
    { id: uuidv4(), eventId, title: 'Entertainment & Dancing', category: 'entertainment', startTime: '21:30', endTime: '23:00', durationMinutes: 90, location: 'Dance floor', sortOrder: 7, dependencies: [], notes: 'DJ resumes set; dancing and games' },
  ];

  // Ideas
  const ideas: CreativeConcept[] = [
    {
      id: uuidv4(),
      eventId,
      name: 'Roaring Thirties Gatsby',
      creativeDirection: 'Art-deco glamour inspired by the Roaring Twenties, updated for a 30th milestone',
      whyItFits: "Aarav appreciates vintage aesthetics — this theme gives the party a memorable, cinematic quality",
      colorPalette: { name: 'Black, Gold & Champagne', colors: ['#0D0D0D', '#D4AF37', '#F7E7CE', '#FFFFFF'], description: 'Classic black-gold with champagne whites for a luxe feel' },
      decorSuggestions: ['Feather centrepieces in gold vases', 'Art-deco geometric backdrop for photos', 'Gold balloon arch at entrance'],
      invitationIdeas: ['Gold foil on black card', 'Digital invite styled as a 1920s newspaper front page'],
      menuDirection: 'Finger foods and small plates; custom mocktail/cocktail bar with vintage names',
      activities: ['Vintage photo booth with props', 'Trivia game about the birthday person'],
      entertainmentIdeas: ['Jazz playlist during dinner', 'DJ transitions to modern hits for dancing'],
      budgetConscious: ['DIY balloon arches save 50% vs professional', 'Use LED candles instead of real wax'],
      sustainableOptions: ['Reusable table décor pieces', 'Digital invitations for remote guests'],
      accessibilityConsiderations: 'Ensure dance floor is accessible; seating available throughout venue',
      estimatedCostImpact: 'on-budget',
      practicalRequirements: ['Photo booth space approx 10 sq ft', 'Bar area for mocktail station'],
      status: 'saved',
      generatedBy: 'local-engine',
      createdAt: isoNow(),
    },
    {
      id: uuidv4(),
      eventId,
      name: 'Modern Celebration',
      creativeDirection: 'Sleek, contemporary party with bold pops of colour and interactive elements',
      whyItFits: "Simple to execute, highly photogenic, works well for Bangalore's cosmopolitan crowd",
      colorPalette: { name: 'Electric Blue & White', colors: ['#0057FF', '#FFFFFF', '#FFD700', '#1A1A2E'], description: 'Vibrant electric blue with clean white and gold pop' },
      decorSuggestions: ['LED neon sign with birthday message', 'Balloon wall in blue and gold', 'Minimalist centrepieces with succulents'],
      invitationIdeas: ['Digital animated invite', 'WhatsApp group with countdown sticker'],
      menuDirection: 'Interactive live stations — pasta bar and dessert counter',
      activities: ['Customised trivia about Aarav', 'Group photo collage activity wall'],
      entertainmentIdeas: ['Curated Spotify playlist with guest contributions', 'Dance floor with DJ'],
      budgetConscious: ['Neon signs can be rented, not purchased', 'Succulent centrepieces double as party favours'],
      sustainableOptions: ['Plantable seed-paper place cards', 'Compostable cups and cutlery'],
      accessibilityConsiderations: 'Avoid overly dim lighting; ensure seating for all guests throughout',
      estimatedCostImpact: 'below-budget',
      practicalRequirements: ['Power outlet near entrance for neon sign', 'Dance space min 200 sq ft'],
      status: 'generated',
      generatedBy: 'local-engine',
      createdAt: isoNow(),
    },
  ];

  return createDemoEvent({ profile, vendors, guests, runOfShow, ideas });
}

// ---------------------------------------------------------------------------
// DEMO EVENT 3 — Greenfield Neighborhood Festival
// ---------------------------------------------------------------------------

function buildCommunityEvent(): StoredEvent {
  const now = new Date();
  const eventDate = addDays(now, 70);
  const eventId = uuidv4();
  const eventDateStr = isoDate(eventDate);

  const profile: EventProfile = {
    id: eventId,
    name: 'Greenfield Neighborhood Festival',
    type: 'community',
    status: 'planning',
    date: eventDateStr,
    time: '11:00',
    city: 'Pune',
    guestCount: 300,
    confirmedGuestCount: 180,
    currency: 'INR',
    totalBudget: 800000,
    contingencyPercent: 12,
    theme: {
      style: ['community', 'festive', 'outdoor'],
      colorPreferences: ['green', 'orange', 'white'],
      indoorOutdoor: 'outdoor',
      hasWeatherBackup: true,
      weatherBackupDescription: 'Community center backup venue booked',
    },
    dietaryRequirements: ['vegetarian', 'vegan', 'nut-free', 'gluten-free'],
    accessibilityNeeds: ['wheelchair', 'hearing-impaired', 'mixed-ages'],
    priorities: ['guest-experience', 'catering', 'entertainment'],
    culturalNotes: 'Inclusive neighbourhood event — all age groups from toddlers to seniors',
    isDemo: true,
    createdAt: isoNow(),
    updatedAt: isoNow(),
    description: 'A vibrant outdoor community festival bringing 300 Greenfield residents together for a day of food, culture, and fun.',
  };

  // Vendors
  const vendors: VendorEntry[] = [
    {
      id: uuidv4(),
      eventId,
      category: 'venue',
      requirement: 'Greenfield Park grounds, outdoor, 5000 sq ft min',
      businessName: 'Pune Parks Authority — Greenfield Ground',
      contactName: 'Ashok Kulkarni',
      contactEmail: 'ashok.kulkarni@punepark.example.com',
      contactPhone: '+91-9800000020',
      status: 'booked',
      estimatedCost: 15000,
      quotedCost: 15000,
      researchDeadline: isoDate(addDays(eventDate, -84)),
      bookingDeadline: isoDate(addDays(eventDate, -70)),
      questionsToAsk: [
        'Is there access to electricity and water on the grounds?',
        'Are there any noise ordinances or curfews we must comply with?',
        'Is parking available for 150+ vehicles nearby?',
      ],
      redFlags: [
        'Confirm the ground permit includes setup and breakdown days',
        'Check if any other events are scheduled adjacent to your date',
      ],
      contractSigned: true,
      depositPaid: true,
      cancellationTerms: 'Full fee forfeited if cancelled within 30 days',
      paymentMilestones: [
        makePaymentMilestone('Permit fee (100%)', 15000, -7),
      ],
      isCritical: true,
      isIllustrative: true,
      createdAt: isoNow(),
      updatedAt: isoNow(),
    },
    {
      id: uuidv4(),
      eventId,
      category: 'catering',
      requirement: 'Multiple food stalls with diverse menu for 300 guests',
      businessName: 'Pune Street Eats Collective',
      contactName: 'Vijaya Patil',
      contactEmail: 'vijaya.patil@streeteatspune.example.com',
      contactPhone: '+91-9800000021',
      status: 'booked',
      estimatedCost: 250000,
      quotedCost: 250000,
      researchDeadline: isoDate(addDays(eventDate, -63)),
      bookingDeadline: isoDate(addDays(eventDate, -56)),
      questionsToAsk: [
        'Can each stall clearly label allergens, especially nut and gluten content?',
        'Will you bring your own generators or require venue power?',
        'How do you handle food safety and hygiene compliance?',
      ],
      redFlags: [
        'Insist on FSSAI registration for every stall participating',
        'Ensure no single vendor has monopoly — diversity is key for this event',
      ],
      contractSigned: true,
      depositPaid: true,
      cancellationTerms: '25% cancellation fee with 30 days notice',
      paymentMilestones: [
        makePaymentMilestone('Advance deposit (30%)', 75000, -3),
        makePaymentMilestone('Balance after event', 175000, 75),
      ],
      isCritical: true,
      isIllustrative: true,
      createdAt: isoNow(),
      updatedAt: isoNow(),
    },
    {
      id: uuidv4(),
      eventId,
      category: 'audio-visual',
      requirement: 'Full PA system, stage lighting, and two LED screens',
      businessName: 'SoundWave AV Solutions Pune',
      contactName: 'Prakash Deshpande',
      contactEmail: 'prakash@soundwavepune.example.com',
      contactPhone: '+91-9800000022',
      status: 'quote-received',
      estimatedCost: 80000,
      quotedCost: 85000,
      researchDeadline: isoDate(addDays(eventDate, -56)),
      bookingDeadline: isoDate(addDays(eventDate, -42)),
      questionsToAsk: [
        'Is an induction loop or FM hearing loop available for hearing-impaired guests?',
        'Can you provide sign-language interpreter AV support on stage?',
        'What is your contingency if equipment fails mid-event?',
      ],
      redFlags: [
        'Verify the generator capacity can handle full PA load in outdoor setting',
      ],
      contractSigned: false,
      depositPaid: false,
      paymentMilestones: [
        makePaymentMilestone('Booking deposit (40%)', 32000, 20),
        makePaymentMilestone('Final payment', 48000, 65),
      ],
      isCritical: false,
      isIllustrative: true,
      createdAt: isoNow(),
      updatedAt: isoNow(),
    },
    {
      id: uuidv4(),
      eventId,
      category: 'entertainment',
      requirement: "Cultural performers, children's activities, community stage show",
      businessName: 'Rang Tarang Cultural Troupe',
      contactName: 'Savita Joshi',
      contactEmail: 'savita.joshi@rangtarang.example.com',
      contactPhone: '+91-9800000023',
      status: 'contacted',
      estimatedCost: 120000,
      researchDeadline: isoDate(addDays(eventDate, -56)),
      bookingDeadline: isoDate(addDays(eventDate, -35)),
      questionsToAsk: [
        'Does the troupe include children-friendly performers?',
        'What are the stage and sound requirements for each act?',
        'Are costumes and props included in the quoted fee?',
      ],
      redFlags: [
        'Request a live or video demo before confirming',
      ],
      contractSigned: false,
      depositPaid: false,
      paymentMilestones: [
        makePaymentMilestone('Booking deposit (35%)', 42000, 25),
        makePaymentMilestone('Balance on event day', 78000, 69),
      ],
      isCritical: false,
      isIllustrative: true,
      createdAt: isoNow(),
      updatedAt: isoNow(),
    },
    {
      id: uuidv4(),
      eventId,
      category: 'staffing',
      requirement: 'Event volunteers and paid staff for crowd management',
      businessName: 'Greenfield Resident Volunteer Network',
      contactName: 'Asha Deshpande',
      contactEmail: 'asha.deshpande@greenfieldrvn.example.com',
      contactPhone: '+91-9800000024',
      status: 'researching',
      estimatedCost: 30000,
      researchDeadline: isoDate(addDays(eventDate, -42)),
      bookingDeadline: isoDate(addDays(eventDate, -21)),
      questionsToAsk: [
        'How many trained first-aid volunteers can you provide?',
        'Can staff be briefed on accessibility protocols in advance?',
      ],
      redFlags: [
        'Ensure adequate staff-to-guest ratio — at least 1 per 30 guests',
      ],
      contractSigned: false,
      depositPaid: false,
      paymentMilestones: [
        makePaymentMilestone('Advance (50%)', 15000, 45),
        makePaymentMilestone('Balance after event', 15000, 72),
      ],
      isCritical: false,
      isIllustrative: true,
      createdAt: isoNow(),
      updatedAt: isoNow(),
    },
    {
      id: uuidv4(),
      eventId,
      category: 'security',
      requirement: 'Licensed security personnel for crowd safety',
      businessName: 'SafeGuard Event Security Pune',
      contactName: 'Rajendra Kamble',
      contactEmail: 'rajendra.kamble@safeguard.example.com',
      contactPhone: '+91-9800000025',
      status: 'booked',
      estimatedCost: 40000,
      quotedCost: 40000,
      researchDeadline: isoDate(addDays(eventDate, -56)),
      bookingDeadline: isoDate(addDays(eventDate, -42)),
      questionsToAsk: [
        'Are guards trained in crowd management and emergency evacuation?',
        'Will walkie-talkies be provided for inter-team communication?',
      ],
      redFlags: [
        'Verify the agency has a valid Private Security Agencies Regulation Act licence',
      ],
      contractSigned: true,
      depositPaid: true,
      cancellationTerms: 'Cancellation within 14 days forfeits full deposit',
      paymentMilestones: [
        makePaymentMilestone('Deposit (50%)', 20000, -2),
        makePaymentMilestone('Balance on event day', 20000, 69),
      ],
      isCritical: false,
      isIllustrative: true,
      createdAt: isoNow(),
      updatedAt: isoNow(),
    },
  ];

  // Guests
  const guests: Guest[] = [
    { id: uuidv4(), eventId, firstName: 'Padma', lastName: 'Krishnaswamy', email: 'padma.k@example.com', rsvpStatus: 'accepted', invitationStatus: 'delivered', hasPlusOne: false, dietaryRequirements: ['vegetarian'], accessibilityNeeds: ['wheelchair'], isVIP: false, createdAt: isoNow(), updatedAt: isoNow() },
    { id: uuidv4(), eventId, firstName: 'Girish', lastName: 'Patil', email: 'girish.patil@example.com', rsvpStatus: 'accepted', invitationStatus: 'delivered', hasPlusOne: true, plusOneName: 'Shobha Patil', plusOneRsvp: 'accepted', dietaryRequirements: ['vegan'], accessibilityNeeds: [], isVIP: false, createdAt: isoNow(), updatedAt: isoNow() },
    { id: uuidv4(), eventId, firstName: 'Rashida', lastName: 'Khan', email: 'rashida.khan@example.com', rsvpStatus: 'accepted', invitationStatus: 'delivered', hasPlusOne: false, dietaryRequirements: ['nut-free'], accessibilityNeeds: ['hearing-impaired'], isVIP: false, createdAt: isoNow(), updatedAt: isoNow() },
    { id: uuidv4(), eventId, firstName: 'Sunil', lastName: 'Bhosale', email: 'sunil.bhosale@example.com', rsvpStatus: 'pending', invitationStatus: 'sent', hasPlusOne: false, dietaryRequirements: [], accessibilityNeeds: [], isVIP: true, createdAt: isoNow(), updatedAt: isoNow() },
    { id: uuidv4(), eventId, firstName: 'Vrinda', lastName: 'Karmarkar', email: 'vrinda.karmarkar@example.com', rsvpStatus: 'accepted', invitationStatus: 'delivered', hasPlusOne: false, dietaryRequirements: ['gluten-free'], accessibilityNeeds: ['mixed-ages'], isVIP: false, createdAt: isoNow(), updatedAt: isoNow() },
    { id: uuidv4(), eventId, firstName: 'Manoj', lastName: 'Salunke', email: 'manoj.salunke@example.com', rsvpStatus: 'accepted', invitationStatus: 'delivered', hasPlusOne: true, plusOneName: 'Lata Salunke', plusOneRsvp: 'pending', dietaryRequirements: ['vegetarian', 'nut-free'], accessibilityNeeds: [], isVIP: false, createdAt: isoNow(), updatedAt: isoNow() },
    { id: uuidv4(), eventId, firstName: 'Asha', lastName: 'Wagh', email: 'asha.wagh@example.com', rsvpStatus: 'declined', invitationStatus: 'delivered', hasPlusOne: false, dietaryRequirements: [], accessibilityNeeds: [], isVIP: false, createdAt: isoNow(), updatedAt: isoNow() },
    { id: uuidv4(), eventId, firstName: 'Nilesh', lastName: 'More', email: 'nilesh.more@example.com', rsvpStatus: 'pending', invitationStatus: 'sent', hasPlusOne: false, dietaryRequirements: ['vegan', 'gluten-free'], accessibilityNeeds: [], isVIP: false, createdAt: isoNow(), updatedAt: isoNow() },
    { id: uuidv4(), eventId, firstName: 'Sujata', lastName: 'Gaikwad', email: 'sujata.gaikwad@example.com', rsvpStatus: 'accepted', invitationStatus: 'delivered', hasPlusOne: false, dietaryRequirements: ['vegetarian'], accessibilityNeeds: ['wheelchair', 'mixed-ages'], isVIP: true, createdAt: isoNow(), updatedAt: isoNow() },
    { id: uuidv4(), eventId, firstName: 'Anand', lastName: 'Jadhav', email: 'anand.jadhav@example.com', rsvpStatus: 'accepted', invitationStatus: 'delivered', hasPlusOne: false, dietaryRequirements: [], accessibilityNeeds: [], isVIP: false, createdAt: isoNow(), updatedAt: isoNow() },
  ];

  // Run of Show
  const runOfShow: ShowBlock[] = [
    { id: uuidv4(), eventId, title: 'Venue Setup & Decoration', category: 'setup', startTime: '06:00', endTime: '10:00', durationMinutes: 240, location: 'Greenfield Ground', sortOrder: 1, dependencies: [], notes: 'Tents, signage, and stage to be erected by 10:00' },
    { id: uuidv4(), eventId, title: 'Vendor Setup', category: 'setup', startTime: '08:00', endTime: '11:00', durationMinutes: 180, location: 'Food stall zone', sortOrder: 2, dependencies: [], notes: 'Food stall vendors to complete setup by 11:00' },
    { id: uuidv4(), eventId, title: 'Staff Briefing', category: 'other', startTime: '10:00', endTime: '10:30', durationMinutes: 30, location: 'Coordination tent', sortOrder: 3, dependencies: [], notes: 'Roles, emergency procedures, accessibility protocols reviewed' },
    { id: uuidv4(), eventId, title: 'Gates Open & Guest Arrival', category: 'arrival', startTime: '11:00', endTime: '12:00', durationMinutes: 60, location: 'Main entrance', sortOrder: 4, dependencies: [], notes: 'Volunteers stationed at gates; wheelchair ramp at east entrance' },
    { id: uuidv4(), eventId, title: 'Welcome & Opening Ceremony', category: 'ceremony', startTime: '12:00', endTime: '12:30', durationMinutes: 30, location: 'Main stage', sortOrder: 5, dependencies: [], notes: 'Committee chairperson address; FM loop active for hearing-impaired' },
    { id: uuidv4(), eventId, title: 'Food Stalls Open', category: 'dining', startTime: '12:00', endTime: '20:00', durationMinutes: 480, location: 'Food stall zone', sortOrder: 6, dependencies: [], notes: 'All-day food service; allergen signage visible at each stall' },
    { id: uuidv4(), eventId, title: "Children's Activities", category: 'activity', startTime: '12:30', endTime: '15:00', durationMinutes: 150, location: 'Kids zone', sortOrder: 7, dependencies: [], notes: 'Face painting, games, balloon modelling; 2 dedicated volunteers' },
    { id: uuidv4(), eventId, title: 'Cultural Performances', category: 'entertainment', startTime: '13:00', endTime: '15:00', durationMinutes: 120, location: 'Main stage', sortOrder: 8, dependencies: [], notes: 'Dance and music performances from community groups' },
    { id: uuidv4(), eventId, title: 'Community Stage Show', category: 'entertainment', startTime: '15:30', endTime: '17:30', durationMinutes: 120, location: 'Main stage', sortOrder: 9, dependencies: [], notes: 'Featured performers from Rang Tarang; MC to host' },
    { id: uuidv4(), eventId, title: 'Evening Entertainment', category: 'entertainment', startTime: '18:00', endTime: '20:00', durationMinutes: 120, location: 'Main stage', sortOrder: 10, dependencies: [], notes: 'Live band and community open-mic segment' },
    { id: uuidv4(), eventId, title: 'Prize Distribution & Closing Ceremony', category: 'other', startTime: '19:30', endTime: '20:00', durationMinutes: 30, location: 'Main stage', sortOrder: 11, dependencies: [], notes: 'Raffle draw, prizes, thank-you address' },
    { id: uuidv4(), eventId, title: 'Cleanup & Breakdown', category: 'breakdown', startTime: '20:00', endTime: '22:00', durationMinutes: 120, location: 'Entire grounds', sortOrder: 12, dependencies: [], notes: 'All vendors and volunteers responsible for their zone' },
  ];

  // Ideas
  const ideas: CreativeConcept[] = [
    {
      id: uuidv4(),
      eventId,
      name: 'Festival of Lights',
      creativeDirection: 'A twilight community fair bathed in warm string lights and vibrant lanterns, celebrating togetherness',
      whyItFits: 'Light installations create a magical evening atmosphere that appeals to all ages at an outdoor festival',
      colorPalette: { name: 'Warm Amber & Deep Green', colors: ['#FFA500', '#2D6A4F', '#FFFFFF', '#FFD700'], description: 'Warm amber glows with lush green accents and pops of gold' },
      decorSuggestions: ['String lights across the entire ground perimeter', 'Paper lanterns at food stall entrances', 'Illuminated community message board where guests pin notes'],
      invitationIdeas: ['Flyer with lantern graphic; bilingual Marathi-English design', 'WhatsApp broadcast with event map QR code'],
      menuDirection: 'Regional Maharashtra street food — pav bhaji, vada pav, corn; dedicated vegan and nut-free counters',
      activities: ['Community photo wall', 'Lantern-making workshop for children', 'Heritage quiz about Greenfield neighbourhood'],
      entertainmentIdeas: ['Lavani folk dance performance', 'Community choir open-mic', 'Evening DJ for younger crowd'],
      budgetConscious: ['Fairy lights are highly cost-effective for large outdoor coverage', 'Community volunteers reduce staffing cost by 30%'],
      sustainableOptions: ['Use solar-powered string lights', 'Compostable packaging for all food stalls', 'No single-use plastic on site'],
      accessibilityConsiderations: 'Hearing loop on main stage; wheelchair ramps at all entry points; seating areas throughout grounds',
      estimatedCostImpact: 'on-budget',
      practicalRequirements: ['Generator for string-light circuit', 'Fire safety officer present at all times'],
      status: 'saved',
      generatedBy: 'local-engine',
      createdAt: isoNow(),
    },
    {
      id: uuidv4(),
      eventId,
      name: 'Green Community Fair',
      creativeDirection: 'Eco-conscious community market celebrating local artisans, organic food, and sustainability',
      whyItFits: 'Aligns with Greenfield community values; green theme differentiates from generic festivals',
      colorPalette: { name: 'Forest Green & Earthy Terracotta', colors: ['#228B22', '#C17F5A', '#F5F0E8', '#FAD02C'], description: 'Natural greens and earthy terracotta with cream and sunshine yellow' },
      decorSuggestions: ['Potted plants as centrepieces (gifted to attendees)', 'Upcycled tyre planters around the perimeter', 'Handmade jute signage'],
      invitationIdeas: ['Seed-paper flyer that guests can plant after reading', 'Community notice board digital and physical'],
      menuDirection: 'Organic farmers market stalls; traditional recipes using seasonal produce',
      activities: ['Composting and waste-sorting demonstration', 'Native plant sapling giveaway', 'Upcycling craft station'],
      entertainmentIdeas: ['Acoustic folk music performances', 'Storytelling circle for children'],
      budgetConscious: ['Partner with local NGOs who can contribute activities for free', 'Pot plants as decor reduce floral costs to near zero'],
      sustainableOptions: ['100% waste-segregation policy on site', 'All decor repurposed or donated after event'],
      accessibilityConsiderations: 'Flat ground pathways suitable for wheelchairs; clear audio descriptions of visual activities for visually impaired guests',
      estimatedCostImpact: 'below-budget',
      practicalRequirements: ['Space for market stalls approx 20 x 10 ft each', 'NGO partnership agreements needed 30 days before event'],
      status: 'generated',
      generatedBy: 'local-engine',
      createdAt: isoNow(),
    },
  ];

  return createDemoEvent({ profile, vendors, guests, runOfShow, ideas });
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export function getDemoEvents(): StoredEvent[] {
  return [buildWeddingEvent(), buildBirthdayEvent(), buildCommunityEvent()];
}

export const DEMO_EVENTS: StoredEvent[] = getDemoEvents();
