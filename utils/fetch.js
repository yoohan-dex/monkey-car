import * as util from './util';
import request from './request';

// export default method =>
//     url =>
//     data =>
//     request({
//         method,
//         url: util.getUrl(url),
//         data,
//     });

export default method => {
    if (method === 'GET' || method === 'PUT') {
        return (url, param) =>
            request({
                header: {
                    'Third-Session': wx.getStorageSync('token'),
                },
                method,
                url: util.getUrl(url, param),
            })
    }
    return (url, param) =>
        data =>
        request({
            header: {
                'Third-Session': wx.getStorageSync('token'),
            },
            method,
            url: util.getUrl(url, param),
            data,
        })
    }
export function upload(url, formData) {
    return request({
        header: {
            Accept: 'application/json',
            'Content-Type': 'multipart/form-data',
            'Third-Session': wx.getStorageSync('token'),
        },
        method: 'POST',
        url: util.getUrl(url),
        data: formData,
    })
}

