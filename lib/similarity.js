// lib/similarity.js
//
// MVP шатанд бид CLIP embedding зэрэг нарийн загвар ХЭРЭГЛЭХГҮЙ (roadmap-ийн Үе шат 1).
// Үүний оронд зурган дээрх дундаж өнгийг тооцож, энгийн "төстэй байдал" харьцуулалт хийнэ.
// Энэ нь "AI шийдвэр гаргах" биш, харин "хамгийн төстэй жагсаалт" санал болгоход хангалттай.
//
// Үе шат 2-т эндээс OpenAI CLIP / Google Vision API руу шилжихдээ
// зөвхөн энэ файлыг сольж, petService.js-ийг өөрчлөх шаардлагагүй байхаар зохион байгуулав.

export function getImageColorSignature(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 40;
        canvas.height = 40;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, 40, 40);
        const { data } = ctx.getImageData(0, 0, 40, 40);

        let r = 0, g = 0, b = 0;
        const n = data.length / 4;
        for (let i = 0; i < data.length; i += 4) {
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
        }
        resolve([r / n, g / n, b / n]);
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
