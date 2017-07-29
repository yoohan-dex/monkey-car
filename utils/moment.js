function toCouponTime(s) {
  const time = new Date(s);
  return `${time.getFullYear()} 年 ${fix(time.getMonth() + 1)} 月 ${fix(time.getDate())} 日前可用`
}

function itemTime(s) {
  const time = new Date(s);
  return `${fix(time.getHours())}: ${fix(time.getMinutes())}`;
}

function itemCancelTime(s) {
  const time = new Date(s);
  return `${fix(time.getMonth() + 1)}月 ${fix(time.getDate())}日`;
}

function downCount(s, set) {
  const left = parseInt((s - new Date().getTime()), 10)/1000;
  if (left < 0) {
    const dead = '00 : 00';
    set(dead);
  } else {
    const hour = fix(parseInt(left / 60 / 60));
    const minute = fix(parseInt((left / 60) % 60));
    const realTime = `${hour} : ${minute}`;
    set(realTime);
    return setTimeout(() => downCount(s + 1000, set), 10000);
  }
}

function fix(num) {
  if (num < 10) {
    return `0${num}`;
  }
  return num;
}
export {
  toCouponTime,
  itemTime,
  downCount,
  itemCancelTime,
}