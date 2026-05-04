export const compressImage = async (file: File): Promise<File> => {
    if (!file.type.startsWith('image/')) return file;
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Max dimension 1200px
          const MAX_SIZE = 1200;
          if (width > height && width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          } else if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
              resolve(file); // fallback
              return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          
          // Output as JPEG at 70% quality
          canvas.toBlob((blob) => {
            if (blob) {
                const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                    type: "image/jpeg",
                    lastModified: Date.now(),
                });
                resolve(newFile);
            } else {
                resolve(file);
            }
          }, 'image/jpeg', 0.7);
        };
        img.onerror = (e) => resolve(file); // fallback
      };
      reader.onerror = (e) => resolve(file); // fallback
    });
  };
