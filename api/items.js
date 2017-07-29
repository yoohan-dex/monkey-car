import fetch from '../utils/fetch';

function getNear(locationId) {
  return fetch('GET')(`passengerOrder/carpoolingOrderList/${locationId}`)
}

function getMatching() {
  return fetch('GET')('passengerOrder/carpoolingOrderList')
}
function getMatchingDetail(id) {
  return fetch('GET')(`passengerOrder/carpoolingOrderDetail/${id}`)
}
function getMatchSucceed() {
  return fetch('GET')('cargroupOrder/carpoolSuccessOrderList');
}

function getMatchSucceedDetail(id) {
  return fetch('GET')(`cargroupOrder/carpoolSuccessOrderDetail/${id}`);
}

function getCancel() {
  return fetch('GET')('/passengerOrder/canceledOrderList');
}

function getFinish() {
  return fetch('GET')('cargroupOrder/ finishOrderList/10/1');
}

function evaluate({id, rates, comment}) {
  return fetch('POST')('comment/passengerComment')({
    cargroup_orderId: id,
    punctuality_score: rates.punctuality,
    polite_score: rates.quality,
    vehicle_score: rates.neat,
    comment_content: comment || null,
  })
}

function complaint({id, reason, formId}) {
  return fetch('POST')('cargroupOrder/passengerComplain')({
    cargroup_orderId: id,
    complain_reason: reason,
    formId,
  })
}



function cancelMatching(id, formId) {
  console.log(formId);
  return fetch('POST')(`passengerOrder/cancelCarpoolingPassengerOrder`)({
    productId: id,
    formId,
  });
}

function cancelMatchingSucceed(id, formId) {
  return fetch('POST')(`cargroupOrder/cancelCargroupOrderByPassenger`)({
    formId,
    cargroup_orderId: id,
  });
}

function ensureArrival(id) {
  return fetch('POST')(`cargroupOrder/passengerEnsureArrival/${id}`)({});
}

export {
  getNear,
  getMatching,
  getMatchingDetail,
  getMatchSucceed,
  getMatchSucceedDetail,
  evaluate,
  complaint,
  cancelMatching,
  cancelMatchingSucceed,
  ensureArrival,
  getCancel,
  getFinish,
}