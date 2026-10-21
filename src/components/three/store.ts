// Mutable scroll state shared between DOM scroll triggers and the WebGL scene.
// Plain object (not React state) so the render loop can read it every frame for free.
export const sceneState = {
  weights: {} as Record<string, number>,
  chakra: 0, // 0..6.99 progress through the chakra journey
  pointer: { x: 0, y: 0 },
};

export const weight = (name: string) => sceneState.weights[name] ?? 0;
