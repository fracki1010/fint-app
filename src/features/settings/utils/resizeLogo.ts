// The API accepts logos up to 60k characters once encoded, so the image is scaled down before upload.
const MAX_DATA_URL_LENGTH = 60000;
const LOGO_SIZES = [320, 240, 160];

const loadImage = (file: File): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo leer la imagen."));
    };
    image.src = url;
  });

const drawScaled = (image: HTMLImageElement, maxSide: number) => {
  const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");

  canvas.width = Math.round(image.width * scale);
  canvas.height = Math.round(image.height * scale);
  const context = canvas.getContext("2d");

  if (!context) throw new Error("No se pudo procesar la imagen.");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  return canvas;
};

/**
 * Returns a PNG or JPEG data URL small enough for the settings payload.
 * PNG keeps transparency; JPEG is the fallback for photos that are too heavy as PNG.
 */
export const resizeLogoToDataUrl = async (file: File): Promise<string> => {
  if (!file.type.startsWith("image/")) {
    throw new Error("Seleccioná un archivo de imagen.");
  }

  const image = await loadImage(file);

  for (const size of LOGO_SIZES) {
    const canvas = drawScaled(image, size);

    const png = canvas.toDataURL("image/png");

    if (png.length <= MAX_DATA_URL_LENGTH) return png;

    const jpeg = canvas.toDataURL("image/jpeg", 0.85);

    if (jpeg.length <= MAX_DATA_URL_LENGTH) return jpeg;
  }

  throw new Error(
    "La imagen es demasiado compleja. Probá con un logo más simple.",
  );
};
