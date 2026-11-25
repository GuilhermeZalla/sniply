import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
export function useData<T>(key: string, path: string) {
  return useQuery({ queryKey: [key, path], queryFn: () => api<T>(path) });
}
