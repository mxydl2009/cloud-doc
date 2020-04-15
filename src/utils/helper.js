
export const flattenArray = (arr) => {
  return arr.reduce((accu, item) => {
    accu[item.id] = item;
    return accu;
  }, {});
}

export const objToArr = (obj) => {
  return Object.keys(obj).map(key => obj[key]);
}

export const getParentNode = (node, parentClassName) => {
  let current = node;
  while(current !== null) {
    if(current.classList.contains(parentClassName)) {
      return current;
    } 
    current = current.parentNode;
  }
  return false;
}

export const timeStampToString = (timestamp) => {
  const date = new Date(timestamp);
  return (date.toLocaleDateString() + ' ' + date.toLocaleTimeString());
}