export type BookStatus = "want" | "reading" | "read";

export interface Book {
  id: string;
  user_id: string;
  title: string;
  author: string;
  isbn: string | null;
  cover_url: string | null;
  status: BookStatus;
  rating: number | null;
  review: string | null;
  location_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Location {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface ReferenceNote {
  id: string;
  user_id: string;
  book_id: string;
  project_id: string;
  content: string;
  page_ref: string | null;
  created_at: string;
  updated_at: string;
  book?: Book;
  project?: Project;
}

export interface GoogleBookResult {
  id: string;
  volumeInfo: {
    title: string;
    authors?: string[];
    imageLinks?: {
      thumbnail?: string;
    };
    industryIdentifiers?: {
      type: string;
      identifier: string;
    }[];
  };
}
