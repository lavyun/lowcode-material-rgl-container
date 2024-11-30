export const cls = (classNames: object) => {
  return Object.keys(classNames).filter(key => classNames[key]).join(' ');
};

export const getSymbolValue = (obj, key: string) => {
  const symbols = Object.getOwnPropertySymbols(obj);
  for(let symbol of symbols) {
    if (symbol.toString() === `Symbol(${key})`) {
      return obj[symbol];
    }
  }
}
