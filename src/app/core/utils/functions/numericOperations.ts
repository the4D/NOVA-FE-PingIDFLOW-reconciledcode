
export const AddNumbers = (valueList: any[]) => {
  let result: number = 0;
  valueList.forEach(value => {
    if (value !== null && value !== undefined) {
      result += parseFloat(value);
    }
  });

  return result;
}

export const SubtractNumbers = (valueList: any[]) => {
  let result: number = 0;
  valueList.forEach(value => {
    if (value !== null && value !== undefined) {
      result -= parseFloat(value);
    }
  });

  return result;
}