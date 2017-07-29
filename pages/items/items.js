// pages/items/items.js
import { getMatching, getMatchSucceed, getCancel, getFinish } from '../../api/items';
import { itemTime, itemCancelTime } from '../../utils/moment';
Page({
  data:{

    matching: '',
    succeed: '',
    cancelled: '',
    finish: '',
    count: 0,
  },
  onLoad:function(options){
    // 页面初始化 options为页面跳转所带来的参数
    
  },
  allItems: {},
  fillMatching(list) {
    const matching = list.map(v => ({
      id: v.productId,
      book: v.seats_booking,
      end: v.station_finishName,
      price: v.pay_accounts,
      time: `${v.date} ${v.plantime_for_departure}`,
    }))
    this.allItems.matching = matching;
    this.increaseCount();
  },
  fillSucceed(list) {
    const succeed = list.map(v => ({
      id: v.productId,
      book: v.seats_booking,
      end: v.station_finishName,
      price: v.pay_accounts,
      time: `${v.date} ${itemTime(v.departure_time)}`,
    }))
    this.allItems.succeed = succeed
    this.increaseCount();
    
  },
  fillCancelled(list) {
    const cancelled = list.map(v => ({
      end: v.station_finishName,
      state: v.refund_state_desc,
      date: itemCancelTime(v.finish_time),
      price: v.pay_accounts,
      mark: v.order_state_desc,
      coupon: v.refund_voucher,
      money: v.refund_accounts,
    }))
    this.allItems.cancelled = cancelled
    this.increaseCount();

  },
  fillFinish({ list }) {
    const finish = list.map(v => ({
      id: v.productId,
      book: v.seats_booking,
      end: v.station_finishName,
      price: v.pay_accounts,
      time: itemTime(v.departureTime),
    }))
    this.allItems.finish = finish;
    this.increaseCount();
  },

  increaseCount() {
    this.setData({
      count: this.data.count + 1,
    })
  },
  onItemTap(e) {
    const {id, index, type} = e.currentTarget.dataset;
    wx.navigateTo({
      url: `../detail/detail?id=${id}&type=${type}`,
    })
  },
  ifReady(cb) {
    if (getApp().globalData.ready) {
      cb();
    } else {
      setTimeout(() => this.ifReady(cb), 300);
    }
  },
  removeItems(type) {
    this.increaseCount();
    const obj = {};
    
    obj[`${type}`] = '';
    
    this.setData(obj);
  },
  onPullDownRefresh() {
    
    this.getItems();
  },
  fillAllItems() {
    if (this.data.count === 4) {
      this.setData({
        finish: '',
        matching: '',
        cancelled: '',
        succeed: '',
      })
      const { finish, matching, cancelled, succeed} = this.allItems;
      this.setData({
        finish,
        matching,
        cancelled,
        succeed,
      })
    }
  },
  getItems() {
    this.setData({
      count: 0,
    })
    this.allItems = {};
    getMatching().then(res => {
      this.fillMatching(res.KEY_CUR_USER_CARPOOLINGORDER_LIST);
      wx.stopPullDownRefresh();
      this.fillAllItems();
    }).catch(() => {
      this.removeItems('matching')
      this.fillAllItems();
    });
    getMatchSucceed().then(res => {
      this.fillSucceed(res.KEY_CARPOOL_SUCCESS_LIST);
      wx.stopPullDownRefresh();
      this.fillAllItems();
    }).catch(() => {
      this.removeItems('succeed');
      this.fillAllItems();
    });
    getCancel().then(res => {
      this.fillCancelled(res.KEY_CARPOOL_FALURE_ORDER_LIST);
      wx.stopPullDownRefresh();
      this.fillAllItems();
    }).catch(() => {
      this.removeItems('cancelled')
      this.fillAllItems();
    })
    getFinish().then(res => {
      this.fillFinish(res.KEY_FINISH_ORDER_LIST);
      wx.stopPullDownRefresh();
      this.fillAllItems();
    }).catch(() => {
      this.removeItems('finish')
      this.fillAllItems();
      })
  },
  onShow:function(){
    // 页面显示
    this.ifReady(() => {
      this.getItems();
      wx.getStorage({
        key: 'expire',
        success: (res) => {
          if (res.data) {
            getApp().login();
            wx.setStorageSync('expire', '');
          }
        },
      })
    });
    

  },
  onHide:function(){
    // 页面隐藏
  },
  onUnload:function(){
    // 页面关闭
  }
})