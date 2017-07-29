// pages/nearby/nearby.js
const HEIGHT = 'height: 80rpx';
const HEIGHT_2 = 'height: 160rpx';
import mock from '../../mock/items';
import { getNear } from '../../api/items';
import { getCoupons, join, pay } from '../../api/book';

function removeBracket(str) {
  const idx = str.indexOf('(');
  if (idx > 0) {
  return str.slice(0, idx);
  }
  return str;
}


Page({
  data:{
    area: '',
    items: '',
    leftText$: [],
    leftText: [],
    isChoosing: [],
    book: [],
    coupons$: '',
    coupons: [],
    detract: [],
    avatarUrl: '',
    // effect
    active: [],
    isOpen: [],
    itemBox: [],
  },
  change(key) {
    return e => this.setData({
      [`${key}`]: e.detail.value,
    })
  },
  onItemTap(e) {
    const {id, index} =  e.currentTarget.dataset
    this.data.active.includes(index) ?
    this.close(index) :
    this.open(index);
  },
  onCouponsChange(e) {
    const { coupons$ } = this.data;
    const { index } =  e.currentTarget.dataset;
    const detract = this.data.detract.slice();
    const coupons = this.data.coupons.slice();
    coupons[index] = parseInt(e.detail.value, 10);
    detract[index] = parseFloat(coupons$[coupons[index]].value);
    this.setData({
      detract,
      coupons,
    })
  },


  open(index) {
    this.ani.translate(0, 0).step();
    const itemBox = this.data.itemBox.slice();
    itemBox[index] = this.ani.export();
    const isOpen = this.data.isOpen.slice();
    isOpen[index] = HEIGHT;
    const active = this.data.active.slice();
    active.push(index);
    this.setData({
      itemBox,
      isOpen,
      active,
    })
  },

  close(index) {
    this.ani.translate(0, '-100%').step();
    const itemBox = this.data.itemBox.slice();
    itemBox[index] = this.ani.export();
    const isOpen = this.data.isOpen.slice();
    isOpen[index] = 'height: 0rpx';
    const active = this.data.active.filter(v => v !== index);
    this.setData({
      itemBox,
      isOpen,
      active,
    })
    this.noSelect(index);
  },
  fillItems(res) {
    const list = res.KEY_CARPOOLING_ORDER_LIST;

    const items = list.map(v => ({
      id: v.productId,
      left: v.seats_remaining,
      end: removeBracket(v.station_finishName),
      start: removeBracket(v.station_beginName),
      price: v.unit_price,
      scale: v.carpool_size,
      time: `${v.date} ${v.plantime_for_departure}`,
      passengers: v.carpoolerInfos && v.carpoolerInfos.map(vv => ({
        avatar: vv.carpooler_image_url,
      })),
    }))
    const book = items.map(() => 0);
    const detract = items.map(() => 0);
    const coupons = items.map(() => 0);
    const isChoosing = items.map(() => false);
    this.setData({
      items,
      book,
      isChoosing,
      detract,
      coupons,
    })
    this.initial();
    this.fillLeft();
    this.fillAva();
    this.fillCoupons();
  },
  fillAva() {
    const { user } = getApp().globalData;
    this.setData({
      avatarUrl: user.avatarUrl,
    })
  },
  fillLeft() {
    const leftText$ = this.data.items.map(v => {
      let arr = []
      for(let i = 1; i <= v.left; i++) {
        arr.push(`选择 ${i} 个座位`);
      }
      return arr;
    })
    const leftText = new Array(this.data.items.length);
    this.setData({
      leftText$,
      leftText,
    })
  },
  select(e) {
    const { index } = e.currentTarget.dataset;
    const { isChoosing } = this.data;
    const newChoosing = isChoosing.slice();
    newChoosing[index] = true;
    this.setData({
      isChoosing: newChoosing,
    })
  },
  noSelect(index) {
    const { isChoosing } = this.data;
    const newChoosing = isChoosing.slice();
    newChoosing[index] = false;
    this.setData({
      isChoosing: newChoosing,
    })
  },
  fillCoupons() {
    getCoupons(true).then(res => {
      const list = res.KEY_PASSENGER_VOUCHER_LIST;
      const tail = list.map(v => ({
        id: v.voucherId,
        value: parseFloat(v.parValue, 10).toFixed(2),
        text: `价值${parseFloat(v.parValue, 10).toFixed(2)}  ${v.oringinRemarks || ''}`,
      }))
      const coupons$ = [{id: -1, value: 0, text: '不使用代金券'}].concat(tail);
      this.setData({
        coupons$,
      })
    })
  },
  bookItem(e) {
    const formId = e.detail.formId;
    const { index } = e.currentTarget.dataset
    const { items, coupons$, book, coupons, detract } = this.data;
    const { id } = items[index];
    const seat = book[index];
    const couponId = detract[index] ? coupons$[coupons[index]].id : null;
    const item = {
      id,
      seat,
      couponId,
      formId,
    };
    
    this.checkBook(book[index], items[index].left, () => this.joinItem(item));
  },
  payItem(res) {
    pay(res).then(() => {
      wx.showToast({
        title: '支付成功',
        icon: 'success',
      });
      wx.switchTab({
        url: '../items/items'
      })
    }).catch(e => {
      wx.showModal({
        title: '加入失败',
        content: e,
        showCancel: false,
      })
      this.getItems();
    })
  },
  joinItem(obj) {
    join(obj).then(this.payItem).catch((e) => {
      wx.showModal({
        title: '加入失败',
        content: e,
        showCancel: false,
      })
      this.getItems();
    });
  },
  checkBook(book, left, success) {
    if (book < left) {
      wx.showModal({
        title: '温馨提示',
        content: '如果加入拼车时没有选择剩下的所有座位，有可能最后拼到的并不是您当前选择的这一个车团',
        cancelText: '考虑一下',
        success: ({confirm}) => {
          if (confirm) success();
        }
      });
    } else {
      success();
    }
  },
  onBook(e) {
    const { index } = e.currentTarget.dataset
    const { value } = e.detail;
    const { book, isOpen } = this.data;
    const newBook = book.slice();
    const newIsOpen = isOpen.slice();
    newBook[index] = parseInt(value, 10) + 1;
    newIsOpen[index] = HEIGHT_2;
    this.setData({
      book: newBook,
      isOpen: newIsOpen,
    })
    this.select(e);
  },
  initial() {
    const ani = wx.createAnimation({
      duration: 400,
      timingFunction: 'cubic-bezier(0, 0.93, 0.43, 1.00)',
      delay: 0,
      transformOrigin: '50% 50% 0',
      success: function(res) {
        // ...
      }
    })
    this.ani = ani;


    const animation = wx.createAnimation({
      duration: 0,
    })

    animation.translate(0, '-100%').step();
    const initialAni = animation.export();
    this.setData({
      itemBox: this.data.items.map(() => initialAni),
      isOpen: this.data.items.map(() => {}),
    })
  },
  getItems() {

    const {id, area} = this.data.currentLocation;
    this.setData({
      area,
    })
    getNear(id).then(
      this.fillItems,
    ).catch(e => {
      this.setData({
        error: e,
        items: '',
      })
    })

  },
  onLocationChange(e) {
    const { location$, location } = this.data;
    const index = e.detail.value;
    this.setData({
      location: index,
    })
    const currentLocation = location$[index];
    const {id, area} = currentLocation;
    this.setData({
      currentLocation,
    })
    getNear(id).then(
      this.fillItems,
    ).catch(e => {
      this.setData({
        error: e,
        items: '',
      })
    })
  },
  ifReady(cb) {
    if (getApp().globalData.ready) {
      cb();
    } else {
      setTimeout(() => this.ifReady(cb), 300);
    }
  },
  onLoad:function(options){
    // 页面初始化 options为页面跳转所带来的参数
    // this.getItems();
    this.ifReady(this.getGlobalLocation);
  },
  getGlobalLocation(){
    const {location, location$, currentLocation } = getApp().globalData
    this.setData({
      location,
      location$,
      currentLocation,
    })
  },
  onPullDownRefresh() {
    const { location$, location } = this.data;
    const currentLocation = location$[location];
    const {id, area} = currentLocation;
    getNear(id).then(() => {
      this.fillItems,
      wx.stopPullDownRefresh()
    }).catch(e => {
      this.setData({
        error: e,
        items: '',
      });
      wx.stopPullDownRefresh();      
    })
  },
  onReady:function(){
    // 页面渲染完成
  },
  onShow:function(){
    // 页面显示
    this.ifReady(this.getItems);
    this.setData({
      active: [],
      isOpen: [],
      itemBox: [],
    })
  },
  onHide:function(){
    // 页面隐藏
  },
  onUnload:function(){
    // 页面关闭
  }
})