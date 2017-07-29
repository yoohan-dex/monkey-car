// pages/coupons/coupons.js
import coupons from '../../mock/coupons';
import { toCouponTime } from '../../utils/moment';
import { getCoupons } from '../../api/book';
Page({
  data:{
    coupons$: '',
  },
  fillCoupons() {
    getCoupons().then(res => {
      const list = res.KEY_PASSENGER_VOUCHER_LIST;
      const coupons$ = list.map(v => ({
        id: v.voucherId,
        value: parseFloat(v.parValue, 10).toFixed(2),
        text: v.oringinRemarks,
        date: toCouponTime(v.userfulTime),
        state: v.voucherState,
        isUseful: v.isUseful,
      }))
      this.setData({
        coupons$,
      })
    })
  },
  onLoad:function(options){
    // 页面初始化 options为页面跳转所带来的参数
    this.fillCoupons();
  },
  onReady:function(){
    // 页面渲染完成
  },
  onShow:function(){
    // 页面显示
  },
  onHide:function(){
    // 页面隐藏
  },
  onUnload:function(){
    // 页面关闭
  }
})