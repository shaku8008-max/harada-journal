type Rgb = [number, number, number];

const positionPalettes: Record<number, Rgb[]> = {
  1: [[242, 160, 125], [255, 207, 159], [213, 107, 77]],
  2: [[158, 224, 167], [206, 255, 211], [97, 173, 109]],
  3: [[145, 215, 255], [194, 239, 255], [91, 168, 209]],
  4: [[207, 171, 255], [235, 215, 255], [157, 114, 216]],
  5: [[255, 158, 187], [255, 210, 225], [214, 109, 145]],
  6: [[255, 216, 117], [255, 239, 170], [198, 157, 54]],
  7: [[174, 183, 255], [216, 220, 255], [114, 125, 208]],
  8: [[141, 228, 206], [200, 255, 239], [93, 179, 157]],
};

const actionAccents: Rgb[] = [
  [196, 154, 255],
  [137, 214, 255],
  [255, 178, 126],
  [255, 143, 199],
  [151, 239, 180],
  [255, 222, 117],
  [169, 162, 255],
  [123, 232, 215],
];

export function overviewPalette(position: number) {
  return positionPalettes[position] ?? positionPalettes[4];
}

export function actionPalette(position: number, actionPosition: number) {
  const base = overviewPalette(position);
  return [base[0], actionAccents[(actionPosition - 1) % actionAccents.length], base[2]];
}
