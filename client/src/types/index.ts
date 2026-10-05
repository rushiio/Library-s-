export type Role = 'STUDENT' | 'FACULTY' | 'LIBRARIAN' | 'ADMIN';

export interface ColumnMapping {
  title: string;
  author: string;
  isbn?: string;
  publisher?: string;
  year?: string;
  edition?: string;
  department?: string;
  resourceType?: string;
  language?: string;
  location?: string;
  shelfNumber?: string;
  condition?: string;
  price?: string;
  invoiceNo?: string;
  accessionSeries?: string;
  accessionNumber?: string;
  callNumber?: string;
  copies?: string;
}

export interface User {
  id: string;
  memberId: string;
  name: string;
  email: string;
  role: Role;
  department?: string | null;
  semester?: number | null;
  year?: number | null;
  enrollmentNumber?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  readingStreak: number;
  totalPoints: number;
  badges?: string[];
  status?: 'ACTIVE' | 'PENDING_APPROVAL' | 'INACTIVE' | 'REJECTED';
  isActive?: boolean;
  mustChangePassword?: boolean;
  lastLoginAt?: string | null;
  activeIssuesCount?: number;
  pendingReservationsCount?: number;
  unpaidFinesCount?: number;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn?: string | null;
  publisher?: string | null;
  edition?: string | null;
  year?: number | null;
  department: string;
  resourceType: string;
  language: string;
  description?: string | null;
  coverUrl?: string | null;
  pdfUrl?: string | null;
  difficultyLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  tags?: string[];
  copiesCount?: number;
  availableCopiesCount?: number;
  averageRating?: number;
  reviewsCount?: number;
}

export interface BookCopy {
  id: string;
  bookId: string;
  accessionSeries: string;
  accessionNumber: string;
  barcode: string;
  location: string;
  shelfNumber?: string | null;
  condition: string;
  status: 'AVAILABLE' | 'ISSUED' | 'RESERVED' | 'LOST' | 'DAMAGED' | 'IN_MAINTENANCE';
  price: number;
  invoiceNo?: string | null;
  callNumber?: string | null;
  book?: Book;
}

export interface IssueRecord {
  id: string;
  bookCopyId: string;
  userId: string;
  issuedDate: string;
  dueDate: string;
  returnedDate?: string | null;
  renewCount: number;
  status: 'ACTIVE' | 'RETURNED' | 'OVERDUE' | 'LOST';
  issuedBy?: string | null;
  returnedTo?: string | null;
  remarks?: string | null;
  copy?: BookCopy;
  user?: User;
}

export interface Reservation {
  id: string;
  bookId: string;
  userId: string;
  reservedDate: string;
  expiryDate?: string | null;
  queuePosition: number;
  priorityScore: number;
  status: 'PENDING' | 'FULFILLED' | 'CANCELLED' | 'EXPIRED';
  book?: Book;
  user?: User;
}

export interface Fine {
  id: string;
  issueRecordId: string;
  userId: string;
  amount: number;
  daysOverdue: number;
  status: 'UNPAID' | 'PAID' | 'WAIVED';
  paidDate?: string | null;
  waivedBy?: string | null;
  waiverReason?: string | null;
  createdAt: string;
  issueRecord?: IssueRecord;
  user?: User;
}

export interface BookReview {
  id: string;
  bookId: string;
  userId: string;
  rating: number;
  comment?: string | null;
  sentiment?: 'positive' | 'neutral' | 'negative' | null;
  createdAt: string;
  user?: {
    name: string;
    avatarUrl?: string | null;
    role: string;
  };
}

export interface ActivityLogItem {
  id: string;
  userId?: string | null;
  action: string;
  details: string;
  ipAddress?: string | null;
  previousHash?: string | null;
  currentHash: string;
  createdAt: string;
  user?: {
    name: string;
    memberId: string;
    role: string;
  } | null;
}

export interface Seat {
  seatCode: string;
  seatNumber: number;
  zoneId: string;
  roomType: string;
  isOccupied: boolean;
  bookedBy?: { id: string; name: string; memberId: string } | null;
  bookingId?: string | null;
}

export interface SeatZone {
  id: string;
  name: string;
  roomType: string;
  description: string;
  totalSeats: number;
  availableSeats: number;
  occupiedSeats: number;
  features: string[];
  prefix: string;
  seats: Seat[];
}

export interface UserSeatBooking {
  id: string;
  userId: string;
  seatCode: string;
  roomType: string;
  startTime: string;
  endTime: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
}

export interface LearningStage {
  stageNumber: number;
  title: string;
  description: string;
  estimatedWeeks: number;
  estimatedHours: number;
  keySkills: string[];
  recommendedBooks: {
    id: string;
    title: string;
    author: string;
    department: string;
    difficultyLevel: string;
    availableCopiesCount: number;
    shelfLocation: string;
    coverUrl?: string | null;
  }[];
}

export interface LearningPathResult {
  goal: string;
  department: string;
  semester: number;
  totalStages: number;
  estimatedTotalWeeks: number;
  estimatedTotalHours: number;
  stages: LearningStage[];
}

export interface SyllabusUnitMatch {
  unitNumber: number;
  unitTitle: string;
  topics: string[];
  matchedBooks: {
    book: {
      id: string;
      title: string;
      author: string;
      department: string;
      isbn?: string | null;
      coverUrl?: string | null;
      availableCopiesCount: number;
      shelfLocation: string;
    };
    matchScore: number;
    matchType: 'Primary Textbook' | 'Reference Book';
    matchedTopics: string[];
  }[];
}

export interface GraphNode {
  id: string;
  label: string;
  fullTitle?: string;
  type: 'department' | 'topic' | 'author' | 'book';
  group: string;
  val: number;
  bookId?: string;
  author?: string;
  department?: string;
  availableCount?: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

export interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  label: string;
  value: number;
}

