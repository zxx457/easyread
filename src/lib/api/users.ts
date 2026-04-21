export interface User {
  displayName: string;
  avatar: string;
  email: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export type UserDTO = User;

export function fromDto(user: UserDTO): User {
  return user;
}

export function toDto(user: User): UserDTO {
  return user;
}

/**************************************************/

// Fetch current user
export async function fetchCurrentUser(): Promise<User> {
  const res = await fetch(`/api/users/me`);
  if (!res.ok) throw new Error("Failed to fetch current user");

  const dto: UserDTO = await res.json();
  return fromDto(dto);
}

export async function fetchSession(): Promise<boolean> {
  const res = await fetch(`/api/auth/session`);
  if (!res.ok) throw new Error("Failed to fetch session");

  const body = (await res.json()) as { isAuthenticated: boolean };
  return body.isAuthenticated;
}

export async function login(payload: LoginPayload): Promise<void> {
  const res = await fetch(`/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error("Invalid email or password");
  }
}

export async function logout(): Promise<void> {
  const res = await fetch(`/api/auth/logout`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to logout");
}
