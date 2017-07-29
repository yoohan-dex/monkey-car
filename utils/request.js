import Promise from 'es6-promise.min';
module.exports = (options) => {
    return new Promise((resolve, reject) => {
        options = Object.assign(options, {
            success(result) {
                    if (result.statusCode === 200 && result.data.serviceResult) {
                        resolve(result.data.resultParm);
                    } else {
                        if (result.data.resultInfo === '1001') {
                            wx.setStorageSync('expire', true);
                        }
                        reject(result.data.resultInfo);
                    }
                },
                fail(res) {
                    reject(res.data.resultInfo);
                },
        });
        wx.request(options);
    });
};
