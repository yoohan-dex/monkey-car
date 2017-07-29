import fetch from '../utils/fetch';

function login(obj) {
    return fetch('POST')('weixin/wxAppClub/login')(obj);
}

function checkBinding() {
    return fetch('GET')('checkIsBindingPhoneResult');
}

function getValidCode(phone) {
    return fetch('GET')(`smsoperation/sendSmsVerificationCodeByAC/${phone}`);
}

function bindPhone({phone, validCode}) {
    return fetch('POST')('passengerBindMobphone')({
        phone_num: phone,
        sms_code: validCode,
    });
}
export {
    login,
    checkBinding,
    getValidCode,
    bindPhone,
}