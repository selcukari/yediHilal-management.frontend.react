import { curry, split, map, sortBy, identity, pipe, trim, equals, isNil } from 'ramda';

export const areNumberSequencesEqual = curry((str1, str2) => {
  // Null veya undefined değerleri kontrol et
  if (isNil(str1) || isNil(str2)) {
    return str1 === str2; // İkisi de null/undefined ise true, farklı ise false
  }
  
  // String'e dönüştür
  const string1 = String(str1);
  const string2 = String(str2);
  
  const normalize = pipe(
    split(','),
    map(pipe(trim, Number)),
    sortBy(identity)
  );
  
  const arr1 = normalize(string1);
  const arr2 = normalize(string2);
  
  return equals(arr1, arr2);
});