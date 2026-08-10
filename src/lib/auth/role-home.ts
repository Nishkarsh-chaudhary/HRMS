/** All authenticated flows enter through the dashboard, which performs role routing. */
export function roleHome(role: string): string {
  void role;
  return "/dashboard";
}
