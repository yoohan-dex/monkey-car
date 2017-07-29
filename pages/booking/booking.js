//index.js
//获取应用实例
import {
  getRoute,
  getPrice,
  getCoupons,
  bookit,
  pay,
} from '../../api/book';
import {
  checkBinding,
  getValidCode,
  bindPhone,
} from '../../api/auth';

import { removeSame } from '../../utils/util';


Page({
  data: {
    // business data
      //bindPhone
      seconds: 0,
      phone: '',
      validCode: '',

      // location data
      location$: [],
      location: 0,
      start$: [],
      start: 0,
      end$:  [],
      end: 0,
      routes$: [],

      // price data
      labelPrice: {
        total: '',
        average: '',
      },
      price: '',
      coupons$: '',
      coupons: 0,
      detract: 0,
      // key data
      target: '',
      targetTime: '',

      // time data
      today: true,
      minute$: [],
      hour$: [],
      hour: 0,
      minute: 0,

      // booking data
      book$: [1, 2, 3, 4],
      book: 0,
      scale$: [2, 3, 4],
      scale: 0,

    // effect
    route: {},
    time: {},
    action: {},
  },
  
  change(key) {
    return e => this.setData({
      [`${key}`]: e.detail.value,
    })
  },
  onLocationChange(e) {
    this.change('location')(e);
    this.setData({
      start: 0,
      end: 0,
    });
    const {location$, location} = this.data;
    getRoute(location$[location].id).then(res => this.fillStartAndEnd(res));
    this.getTarget();
  },
  fillHourAndMinute() {
    const { target } = this.data;
    const targetTime = target.departureTimeHourlys;
    const hour$ = removeSame(targetTime.map(v => v.hour)).sort((x, y)=> x - y);
    let hour = hour$.reduce((pre, curr, i) => {
      if (curr > new Date().getHours()) {
        pre.push(i);
      }
      return pre;
    }, [])[0];
    this.setData({
      targetTime,
      hour$,
      hour: hour || 0,
    });
    this.fillMinute();
  },
  toHelp() {
    wx.navigateTo({
      url: '../help/help',
    })
  },
  fillMinute() {
    const { hour$, hour, targetTime } = this.data

    const $ = targetTime
      .filter(v => v.hour === hour$[hour])
      .map(v => v.departureTimeIntervals)[0];
    const minute$ = $.map(v => ({
      minute: v.departure_timeInterval,
      id: v.operation_timeId,
    }))
    this.setData({
      minute$,
    })
  },
  fillStart() {
    const { routes$ } = this.data;
    const start$ = removeSame(routes$.map(v => v.start));
    this.setData({
      start$,
    })
  },
  fillStartAndEnd(res) {
    let routes$;
    if (res) {
      const {start} = this.data;
      routes$ = res.KEY_DEPARTURE_ROUTE_LIST.map(v => ({
        id: v.operation_routeId,
        start: v.station_beginName,
        end: v.station_finishName,
      }));
    } else {
      routes$ = getApp().globalData.routes$;
    }
    this.setData({
      routes$,
    })
    this.fillStart();
    this.fillEnd();
  },
  fillEnd() {
    const {start$, start, routes$} = this.data;
    const $ = routes$
      .filter(v => v.start === start$[start])
      .map(v => v.end);
    const end$ = removeSame($);
    this.setData({
      end$,
    })
    this.getTarget();
  },
  getTarget() {
    getPrice(this.getTargetID()).then((price) => {
      this.fillTagetAndFillPrice(price)
    });
  },
  onStartChange(e) {
    this.change('start')(e);
    this.fillEnd();
  },
  onEndChange(e) {
    this.change('end')(e);
    this.fillEnd();
  },
  onBookChange(e) {
    this.change('book')(e);
    this.fillPrice();
  },
  onScaleChange(e) {
    this.change('scale')(e);
    this.fillBook();
    this.fillPrice();
  },
  onTodayChange() {
    this.setData({
      today: !this.data.today,
    })
  },
  onMinuteChange(e) {
    this.change('minute')(e);
  },
  onHourChange(e) {
    this.change('hour')(e);
    this.fillMinute();
  },
  onPhoneChange(e) {
    this.change('phone')(e);
  },
  onValidChange(e) {
    this.change('validCode')(e);
  },
  fillScale() {
    const {target} = this.data;
    const init =[];    
    const {max_passengers, min_passengers} = target;
    for(let i = max_passengers; i >= min_passengers; i--) {
      init.push(i);
    }
    const scale$ = init.filter(v => v >= min_passengers && v <= max_passengers);
    this.setData({
      scale$,
      scale: 0,
    })
  },
  fillBook() {
    const {target, scale$, scale} = this.data;
    const {min_seats, max_setas} = target;
    const init = [1, 2, 3, 4];
    const book$ = init.filter(v => v >= min_seats && v <= max_setas && v <= scale$[scale]);
    this.setData({
      book$,
      book: 0,
    })    
  },
  fillPrice() {
    const { target, book$, book, scale$, scale, detract } = this.data;
    let price = (((target.route_fare / scale$[scale]) * book$[book]) - detract).toFixed(2);
    if (price <= 0) {
      price = 0.01;
    }
    this.setData({
      price,
    });
  },
  fillCoupons() {
    getCoupons(true).then(res => {
      const list = res.KEY_PASSENGER_VOUCHER_LIST;
      const tail = list.map(v => ({
        id: v.voucherId,
        value: parseFloat(v.parValue, 10).toFixed(2),
        text: `价值${parseFloat(v.parValue, 10).toFixed(2)}`,
      }))
      const coupons$ = [{id: -1, value: 0, text: '不使用代金券'}].concat(tail);
      this.setData({
        coupons$,
      })
    })
  },
  fillAfterRouteChange() {
      this.fillHourAndMinute();
      this.fillScale();
      this.fillBook();
      this.fillPrice();
  },
  onRouteConfirm() {
    // showLoad();
    // setTimeout(()=> {
      if (this.data.end$[0]) {
        this.aniConfirm();
        this.fillHourAndMinute();
        this.fillScale();
        this.fillBook();
        this.fillPrice();
      }
      
    //   wx.hideToast();
    // }, 1000)
  },
  payItem(res) {
    pay(res).then(() => {
      wx.showToast({
        title: '支付成功',
        icon: 'success',
      });
      this.fillCoupons();
      wx.switchTab({
        url: '../items/items'
      })
    })
  },
  bookItem(formId) {
    const {book$, book, scale$, scale, minute, minute$, coupons, coupons$, detract, today } = this.data;
    const target = {
      scale: scale$[scale],
      book: book$[book],
      routeId: this.getTargetID(),
      timeId: minute$[minute].id,
      isToday: today,
      couponId: detract ? coupons$[coupons].id : null,
      formId,
    }
    bookit(target).then(this.payItem).catch((e) => wx.showModal({
      title: 'your are handsome',
      content: e,
      showCancel: false,
    }))
  },
  onItemConfirm(e) {
      const formId = e.detail.formId;
    // showLoad();
    // setTimeout(()=> {
      checkBinding()
      .then(() => this.bookItem(formId))
      .catch(this.aniBind)
    //   wx.hideToast();
    // }, 1000)



  },
  aniBind() {
    const animation = this.animation;
    animation.translate(0, '-200%').step();
    this.setData({
      action: animation.export(),
    })
  },
  onBack(){
    this.aniBack();
  },
  onValid() {
    const { seconds, phone } = this.data;
    if (seconds === 0) {
      if (phone.length === 11) {
        getValidCode(this.data.phone);
        this.setData({
          seconds: 30,
        })
        this.checkSecond();  
      } else {
        wx.showModal({
          title: '获取验证码失败',
          content: '请检查手机是否输入正确',
          showCancel: false,
        });
      }
    }
  },
  onConfirmPhone() {
    const { phone, validCode } = this.data;
    if (phone.length === 11 && validCode.length === 4) {
      bindPhone({phone, validCode}).then(
        () => {
          this.aniBack();
          wx.showToast({
            title: '绑定成功',
            icon: 'success',
            duration: 1000,
          })
          getApp().setGlobalData({
            isRegistered: true,
          })
        }
      ).catch(
        () => {
          wx.showModal({
            title: '绑定手机失败',
            content: '请检查手机或验证码是否输入正确',
            showCancel: false,
          })
        }
      )
    } else {
        wx.showModal({
          title: '绑定手机失败',
          content: '请检查手机或验证码是否输入正确',
          showCancel: false,
        });
    }
  },
  checkSecond() {
    const cur = Object.assign({}, this.data);
    this.setData({ seconds: cur.seconds -1})
    if (this.data.seconds > 0) {
      setTimeout(() => this.checkSecond(), 1000);  
    }
  },
  aniConfirm() {
    const animation = this.animation;
    animation.translate('-100%').step();
    this.setData({
      route: animation.export(),
    })


    animation.translate(0, '-100%').step();
    this.setData({
      time: animation.export(),
    })

    animation.translate(0, '-100%').step();
    this.setData({
      action: animation.export(),
    })
  },
  createAni() {
    this.animation = wx.createAnimation({
      duration: 600,
      timingFunction: 'cubic-bezier(0.91,0.1, 0.2, 1)',
      delay: 0,
      transformOrigin: '50% 50% 0',
      success(res) {
        // ...
      }
    })
  },
  aniBack() {
    const animation = this.animation;
    animation.translate(0).step();
    this.setData({
        route: animation.export(),
    })

    animation.translate('100%', '-100%').step();
    this.setData({
        time: animation.export(),
    })

    animation.translate(0, 0).step();
    this.setData({
        action: animation.export(),
    })
  },
  initPosition() {
    const animation = wx.createAnimation({
      duration: 0,
    })

    animation.translate('100%', '-100%').step();
    this.setData({
      time: animation.export(),
    })
  },
  initLocation() {
    const { location$, location } = getApp().globalData;
    this.setData({
      location$,
      location,
    })
  },
  fillTagetAndFillPrice(res) {
    const target = res.KEY_OPERATIONTIME_LIST;
    const total = target.route_fare;
    const priceLabel = {
      total,
      average: (parseFloat(total) / 4),
    }
    this.setData({
      priceLabel,
      target,
    })
  },
  computeDetract(detract) {
    if (detract > 0.00) {
      this.setData({
        detract: this.data.detract + 0.1,
      });
      this.fillPrice();
      setTimeout(() => this.computeDetract(detract - 0.1), 20);
    } else {
      this.fillPrice();
    }
  },
  onCouponsChange(e) {
    this.setData({
      detract: 0,
    })
    
    this.change('coupons')(e);
    this.computeDetract(this.data.coupons$[this.data.coupons].value);
  },
  getTargetID() {
    const { routes$, start$, end$, start, end } = this.data;
    const target = routes$
      .filter(v => v.start === start$[start])
      .filter(v => v.end === end$[end]);
    return target[0].id;
  },
  afterLogin() {
    this.initLocation()
    this.fillStartAndEnd();
    this.getTarget();
    this.fillCoupons();
  },
  ifReady(cb) {
    if (getApp().globalData.ready) {
      cb();
    } else {
      setTimeout(() => this.ifReady(cb), 300);
    }
  },
  onPullDownRefresh() {
    getApp().login(() => wx.stopPullDownRefresh());
  },
  onLoad: function () {
    this.createAni();
    this.initPosition();
    
    this.ifReady(this.afterLogin) 
  }
})
