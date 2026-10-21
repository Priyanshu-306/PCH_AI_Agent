// Validated categorical slots (light surface): blue, orange, aqua. Aqua is < 3:1 contrast,
// so every chart keeps direct labels and a table view (relief rule).
// Kept outside the "use client" chart module so server components can import it.
export const SERIES = ["#2a78d6", "#eb6834", "#1baf7a"] as const;
