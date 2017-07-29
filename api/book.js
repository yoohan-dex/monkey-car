import fetch from '../utils/fetch';
import util from '../utils/util';


function getLocale({ latitude, longitude }) {
    return fetch('POST')('marketArea/getMarketAreasAndRoutes')({
        latitude,
        longitude,
    });
}

function getRoute(id) {
    return fetch('GET')(`operationRoute/operationRoutes/${id}`);
}

function getPrice(id) {
    return fetch('GET')(`operationTime/operationTimesAndInfo/${id}`);
}

function getCoupons(useful) {
     if (useful) {
         return fetch('GET')(`voucher/getVoucherList/${useful}`)
     }
    return fetch('GET')(`voucher/getVoucherList`);
}
function bookit({scale, book, routeId, timeId, isToday, couponId, formId}) {
    return fetch('POST')('weixin/pay/SureCarpool')({
        carpoolSize: scale,
        seats_booking: book,
        operation_routeId: routeId,
        operation_timeId: timeId,
        isToday,
        formId,
        voucherId: couponId
    })
}

function takeAllSeats(id, formId) {
  return fetch('POST')('weixin/pay/buyRemainSeats')({
      productId: id,
      formId,
  });
}

function join({ id, formId, seat, couponId }) {
  return fetch('POST')('weixin/pay/JoinCarpool')({
    formId,
    voucherId: couponId,
    seats_booking: seat,
    productId: id,
  })
}

function keepMatching(formId) {
    return fetch('POST')(`weixin/wxAppClub/continueCarpool/${formId}`)({});
}

function pay(res) {
  const obj = Object.assign({}, {
    signType: 'MD5',
  }, res);
  return new Promise((resolve, reject) => {
    const options = Object.assign(obj, {
        success: (result) => resolve(result),
        fail: (error) => reject(error),
    });
    wx.requestPayment(options);
  })
}

export {
    getLocale,
    getRoute,
    getPrice,
    getCoupons,
    bookit,
    pay,
    join,
    takeAllSeats,
    keepMatching,
};