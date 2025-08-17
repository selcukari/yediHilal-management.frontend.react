function setWithExpiry(key: string, value: any, ttl: number) {
  const nowGetTime: number = new Date().getTime();
  const expiry = nowGetTime + ttl;

  // `item` is an object which contains the original value
  // as well as the time when it's supposed to expire
  const item = {
    value,
    expiry
  };
  localStorage.setItem(key, JSON.stringify(item));
}

function getWithExpiry(key: string) {
  const itemStr = localStorage.getItem(key);

  // if the item doesn't exist, return null
  if (!itemStr) {
    return null;
  }

  const item = JSON.parse(itemStr);

  const nowDate = new Date();

  // compare the expiry time of the item with the current time
  if (nowDate.getTime() > item.expiry) {
    // If the item is expired, delete the item from storage
    // and return null
    if (key === 'currentUser') {
      localStorage.removeItem('currentUser');
    } else {
      localStorage.removeItem('rememberMeUser');
    }

    return null;
  }

  return item.value;
}

export { setWithExpiry, getWithExpiry };
