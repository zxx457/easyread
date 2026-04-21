import { User } from "@/lib/api/users";

export const me: User = {
  displayName: "Jane Doe",
  avatar: "https://randomuser.me/api/portraits/women/44.jpg",
  email: "jane.doe@uwa.edu.au",
};

export const mockCredentials = {
  email: "jane.doe@uwa.edu.au",
  password: "password123",
};
