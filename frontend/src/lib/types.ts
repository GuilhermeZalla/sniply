export type User = {
  id: string;
  name: string;
  email: string;
  defaultLanguage: string;
  fontSize: number;
  wordWrap: boolean;
};
export type Group = {
  id: string;
  name: string;
  kind: string;
  description: string;
  count: number;
  updatedAt: string;
};
export type Language = {
  id: string;
  name: string;
  monacoId: string;
  custom: boolean;
};
export type Snippet = {
  id: string;
  title: string;
  description: string;
  code?: string;
  languageId: string;
  language: string;
  monacoId: string;
  categoryId: string | null;
  category: string | null;
  isFavorite: boolean;
  isPublic: boolean;
  publicSlug: string | null;
  createdAt: string;
  updatedAt: string;
  groups: Pick<Group, "id" | "name" | "kind">[];
};
export type Page<T> = {
  items: T[];
  total: number;
  page: number;
  pages: number;
  pageSize: number;
};
export type Overview = {
  total: number;
  favorites: number;
  collections: number;
  languages: { id: string; name: string; count: number }[];
  recent: Snippet[];
  added: Snippet[];
};
