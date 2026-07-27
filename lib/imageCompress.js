// lib/imageCompress.js
//
// Хэрэглэгчийн оруулсан зургийг Storage руу upload хийхээс өмнө browser дээр
// нь жижигрүүлж, файлын хэмжээг бууруулна. Энэ нь удаан интернэттэй үед ч
// хурдан ажиллах, Supabase Storage-ийн үнэгүй 1GB квотыг хэмнэхэд тусална.
export function compressImage(file, { maxDimension = 1200, quality = 0.82 } = {}) {
  return new Promise((resolve, reject) => {
    // Зураг биш файл (эсвэл маш жижиг) бол шууд буцаана
    if (!file.type.startsWith('image/')) {
      resolve(file);
      return;
    }

    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file); // compression амжилтгүй бол эх файлаа ашиглана
              return;
            }
            const compressedFile = new File(
              [blob],
              file.name.replace(/\.\w+$/, '.jpg'),
              { type: 'image/jpeg', lastModified: Date.now() }
            );
            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => resolve(file);
      img.src = e.target.result;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}
