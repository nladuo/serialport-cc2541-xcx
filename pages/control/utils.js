

export const char2buf = (str) => {
  var out = new ArrayBuffer(str.length * 2);
  var u16a = new Uint16Array(out);
  var strs = str.split("");
  for (var i = 0; i < strs.length; i++) {
    u16a[i] = strs[i].charCodeAt();
  }
  return out;
}

export const buf2char = (buf) => {
  return String.fromCharCode.apply(null, new Uint16Array(buf));
}
