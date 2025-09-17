const stripSpecialCharacters = (text: string) => text.trim().toLocaleLowerCase()
  .replace(/ş/g, 's')
  .replace(/ı/g, 'i')
  .replace(/ç/g, 'c')
  .replace(/ğ/g, 'g')
  .replace(/ö/g, 'o')
  .replace(/ü/g, 'u')
  .replace(/ /g, '-');

export default stripSpecialCharacters;
