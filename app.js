//app.js
import { login } from './api/auth';
import { getLocale } from './api/book';
App({
  onLaunch: function() {
    //调用API从本地缓存中获取数据
    // var logs = wx.getStorageSync('logs') || []
    // logs.unshift(Date.now())
    // wx.setStorageSync('logs', logs)
    this.login();
  },
  login(cb) {
    wx.login({
      success: res => {
        wx.getUserInfo({
          success: user => {
            console.log(user);
            this.setGlobalData({
              user: user.userInfo,
            });
            login(
              Object.assign(
                {},
                {
                  code: res.code,
                },
                user.userInfo,
              ),
            )
              .then(res => {
                const { register, thirdSession } = res;
                this.setGlobalData({
                  isLogin: true,
                  thirdSession,
                  isRegistered: !register,
                });
                wx.setStorageSync('token', thirdSession);
                this.getLocation();
                if (cb) cb();
              })
              .catch(e => {
                console.log('login error:', e);
                this.globalData.loginError = e;
              });
          },
        });
      },
      fail() {
        this.login(); // fail
      },
      complete() {
        // complete
      },
    });
  },
  initLocation(curr, all) {
    let location;
    const location$ = all.map((v, i) => {
      if (v.marketAreaId === curr.marketAreaId) {
        location = i;
      }
      return {
        id: v.marketAreaId,
        area: v.localArea,
      };
    });
    const currentLocation = location$[location];
    this.setGlobalData({
      location$,
      location,
      currentLocation,
    });
  },
  fillStartAndEnd(res) {
    const routes$ = res.KEY_DEPARTURE_ROUTE_LIST.map(v => ({
      id: v.operation_routeId,
      start: v.station_beginName,
      end: v.station_finishName,
    }));
    this.setGlobalData({
      routes$,
      ready: true,
    });
  },
  getLocation() {
    wx.getLocation({
      type: 'wgs84', // 默认为 wgs84 返回 gps 坐标，gcj02 返回可用于 wx.openLocation 的坐标
      success: location => {
        getLocale(location)
          .then(res => {
            this.initLocation(
              res.KEY_NEARBY_MARKETAREA,
              res.KEY_NEARBY_MARKETAREA_LIST,
            );
            this.fillStartAndEnd(res);
          })
          .catch(e =>
            wx.showModal({
              title: '你的位置太远啦～',
              content: e,
              showCancel: false,
            }),
          );
      },
      fail: () => {
        getLocale({
          latitude: 110.308003,
          longitude: 21.156676,
        })
          .then(res => {
            this.initLocation(
              res.KEY_NEARBY_MARKETAREA,
              res.KEY_NEARBY_MARKETAREA_LIST,
            );
            this.fillStartAndEnd(res);
          })
          .catch(e => {
            console.log(e);
            this.getLocation();
          });
      },
      complete() {},
    });
  },
  setGlobalData(obj) {
    this.globalData = Object.assign({}, this.globalData, obj);
  },
  globalData: {
    isLogin: false,
    loginError: '',
    thirdSession: '',
    isRegistered: undefined,
    location$: '',
    location: '',
    currentLocation: '',
    routes$: '',
    ready: '',
    user: '',
  },
});
