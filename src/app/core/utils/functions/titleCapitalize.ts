export const toTitleCapitalize = (title: string | undefined): string => {
  if (title === undefined || title === null) {
    return '';
  }

  let result: string = '';
  let addSpace: boolean = false;
  title.split(' ').forEach(word => {
    if (addSpace) {
      result += ' ';
    }
    result += word.slice(0, 1).toUpperCase() + word.slice(1).toLowerCase();
    addSpace = true;
  });

  return result;
} 