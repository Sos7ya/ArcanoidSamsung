function generateUUID() {
    const hexDigits = '0123456789abcdef';
    let uuid = '';
  
    for (let i = 0; i < 32; i++) {
      const randomHex = Math.floor(Math.random() * 16);
      uuid += hexDigits[randomHex];
      if (i === 7 ||  i === 11 || i === 15 ||  i === 19) {
        uuid += '-';
      }
    }
  
    return uuid;
  }