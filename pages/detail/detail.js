// pages/detail/detail.js

const HAVE_DRIVER = 2;
const WAITING_PARTNER = 1;
import {
  getMatchingDetail,
  getMatchSucceedDetail,
  evaluate,
  complaint,
  cancelMatching,
  cancelMatchingSucceed,
  ensureArrival,
} from '../../api/items';
import { getContact } from '../../api/system';
import { takeAllSeats as takeAll, pay, keepMatching } from '../../api/book';
import { itemTime, downCount as computeTime } from '../../utils/moment';
Page({
  data:{
    busy: false,
    // interface data
    rateType: ['neat', 'punctuality', 'quality'],
    rateTypeChinese: ['车内整洁','守时情况', '服务质量'],
    scores: [1, 2, 3],
    // business data
    ready: false,
    formId: 'undefind',
    rates: {
      neat: 0,
      quality: 0,
      punctuality: 0,
    },
    comment: '',
    item: '',
    itemType: '',
    id: '',
    cs: '',
    downCount: '',

    // view
    tabs: ['订单详情', '联系客服'],
    stv: {
      windowWidth: 0,
      lineWidth: 0,
      offset: 0,
      tStart: false
    },
    activeTab: 0
  },
  adjust() {
    const { downCount } = this.data.item;
    console.log(downCount);
    if (downCount) {
      this.countdownHandler = computeTime(downCount, (s) => {
        this.setData({
          downCount: s,
        })
        console.log(s);
      })
    }
  },
  fetchData(id, type, pull) {
    if (this.countdownHandler) {
      clearTimeout(this.countdownHandler);
    }
    if (type === 'matching') {
      getMatchingDetail(id).then((res) => {
        const detail = res.KEY_CARPOOLING_ORDER_DETAIL;
        this.fillItem(detail);
        if (pull) wx.stopPullDownRefresh();        
      }).catch(() => {
        this.fetchMatchSucceedDetail(id);
        if (pull) wx.stopPullDownRefresh();
      })
    } else if (type === 'succeed' || type === 'finish') {
      this.fetchMatchSucceedDetail(id);
      if (pull) wx.stopPullDownRefresh();
    }
  },
  fetchMatchSucceedDetail(id) {
    getMatchSucceedDetail(id).then(res => {
      const detail = res.KEY_CARPOOL_SUCCESS_DETAIL;
      this.fillItem(detail);
    }).catch(e => {
      wx.showModal({
        title: '获取详情失败',
        content: e,
        showCancel: false,
      })
    })
  },
  onComment(e) {
    this.setData({
      comment: e.detail.value,
    })
  },
  confirmEvaluation() {
    const {rates, comment, item, carId} = this.data;
    const { neat, quality, punctuality } = rates;
    if (neat && quality && punctuality) {
      evaluate({rates, comment, id: carId }).then(res => {
        this.refetchData();
      })
    } else {
      wx.showModal({
        title: '请先填完整评价分数',
        content: '车内整洁， 守时情况， 服务质量都需要您的评价与督促',
        showCancel: false,
      })
    }
  },
  confirmComplaint(reason, formId) {
    const {carId: id} = this.data;
    complaint({id, reason, formId}).then(() => {
      wx.showModal({
        title: '投诉成功',
        content: '非常抱歉,客服会尽快核实情况给您一个交代',
        showCancel: false,
      })
      this.refetchData();
    }).then((res) => {
      wx.showModal({
        title: '投诉失败',
        content: res,
        showCancel: false,
      })
    })
  },

  showComplainOption(res) {
    const {formId} = res.detail;
    wx.showActionSheet({
      itemList: ['司机未送达', '司机因素导致漏载', '自身因素导致漏载'],
      success: ({ tapIndex }) => {
        if (tapIndex !== undefined) {
          this.confirmComplaint(tapIndex + 1, formId);
        }
      },
    })
  },
  handleArrival() {
    const {carId} = this.data;
    ensureArrival(carId).then(() => {
      wx.showToast({
        title: '确认成功',
        icon: 'succeed',
      })
      this.refetchData();
    })
  },
  confirmKeepMatching(e) {
    const { formId } = e.detail;

    keepMatching(formId).then(() => {
      wx.showModal({
        title: '继续拼车成功',
        content: '我们将会继续为您拼车',
        showCancel: false,
      })
    })
  },
  bookOneMore() {
    wx.switchTab({url: '../../pages/booking/booking'});
    wx.navigateBack();
  },
  fillItem(detail) {
    const carId = detail.cargroup_orderId;
    const isCommented = detail.isCommented && detail.isCommented;
    const isDisputed = detail.isDisputed && detail.isDisputed;
    const itemScore = detail.commontScore && detail.commontScore;
    const item = {
      state: detail.order_state,
      date: detail.date,
      book: detail.seats_booking,
      start: detail.station_beginName,
      end: detail.station_finishName,
      disputedInfos: detail.passengerDisputeInfos && detail.passengerDisputeInfos,
      disputedInfo: detail.personalDisputeInfo && detail.personalDisputeInfo,
      downCount: detail.countdown_to_cancel && detail.countdown_to_cancel
      || detail.departure_time && detail.departure_time,
      time: detail.plantime_for_departure || itemTime(detail.departure_time),
      id: detail.productId,
      price: detail.pay_accounts,
      passengers: detail.carpoolPartnerInfos && detail.carpoolPartnerInfos.map(v => ({
        nickname: v.funny_nickname,
        name: v.nickname,
        avatar: v.headImgUrl,
      })) || detail.carpoolerInfos && detail.carpoolerInfos.map(v => ({
        avatar: v.carpooler_image_url,
        name: v.carpooler_nickname,
      })),
      driver: detail.driverInfo && {
        img: detail.driverInfo.carUrl,
        name: detail.driverInfo.nickname,
        phone: detail.driverInfo.mobilephoneNum,
      },
    }
    let tabs = ['订单详情', '联系客服'];
    if (item.passengers && item.passengers[0] ) {
      const { itemType } = this.data;
      if (itemType === 'succeed' || itemType === 'finish') {
        tabs.push('同乘伙伴');
      } else if (itemType === 'matching') {
        tabs.push('当前加入');
      }
    }
    if (item.driver) {
      tabs.push('司机详情');
    }
    if (itemScore) {
      const { polite_score, punctuality_score, vehicle_score, comment_content } = itemScore;
      
      const newRates = {
        neat: vehicle_score || 0,
        quality: polite_score || 0,
        punctuality: punctuality_score || 0,
        comment: comment_content || '',
      }
      this.setData({
      rates: newRates,
    });
    }
    this.setData({
      item,
      ready: true,
      tabs,
      carId,
      isCommented,
      isDisputed,
    })
    this.initTabs();
    this.adjust();
  },

  rate(e) {
    if (!this.data.isCommented) {
      const newRates = Object.assign({}, this.data.rates);
      const { type, score } = e.currentTarget.dataset;

      newRates[type] = score;
      this.setData({
        rates: newRates,
      });
      console.log(this.data.rates);
    }
  },


  phoneCall(e) {
    const { phone } = e.currentTarget.dataset;
    console.log(phone);
    wx.makePhoneCall({
      phoneNumber: phone,
    });
  },
  fillContact() {
    getContact().then(res => {
      const contact = res.KEY_CUSTOMER_CONTACT;
      const cs = {
        avatar: contact.headImgUrl,
        name: contact.nickname,
        phone: contact.phone,
      }
      this.setData({
        cs,
      })
    })
  },
  initTabs() {
    try {
      let {tabs} = this.data; 
      var res = wx.getSystemInfoSync()
      this.windowWidth = res.windowWidth;
      this.data.stv.lineWidth = this.windowWidth / this.data.tabs.length;
      this.data.stv.windowWidth = res.windowWidth;
      this.setData({stv: this.data.stv})
      this.tabsCount = tabs.length;
      } catch (e) {
        // ...
    }
  },
  confirmCancel(formId) {
    this.cancelItem(() => {
      wx.showModal({
        title: '取消成功',
        icon: 'succeed',
        showCancel: false,
      });
      wx.navigateBack();
    }, formId)
  },
  payItem(res) {
    pay(res).then(() => {
      wx.showToast({
        title: '支付成功',
        icon: 'success',
      });
      this.refetchData('succeed');
      this.setData({
        busy: true,
      })
      setTimeout(() => {
        this.refetchData();
        this.setData({
          busy: false,
        })
      }, 2000);
    })
  },
  takeAllSeats(e) {
    const { formId } = e.detail;
    wx.showModal({
      title: '直接包车',
      content: '不和别人拼车了，买下剩下座位，直接包车',
      success: (res) => {
        if (res.confirm) {
          takeAll(this.data.id, formId).then(this.payItem).catch(e => {
            wx.showModal({
              title: '支付失败',
              content: '很抱歉， 请稍后重试',
              showCancel: false,
            })
          })
        }
      }
    })
  },
  handleCancel(res) {
    const {formId} = res.detail;
    if (this.data.itemType === 'succeed') {
      wx.showModal({
        title: '温馨提示',
        content: this.data.item.state !== 3
        ? '真的要取消订单嘛？这样可能会给其他乘客造成困扰。一旦取消订单，会分两次退返等额代金券'
        : '真的要取消订单嘛？',
        success: ({confirm}) => {
          if (confirm) this.confirmCancel(formId);
        },
      })
    } else {
      wx.showModal({
        title: '温馨提示',
        content: '真的要取消订单嘛？',
        success: ({confirm}) => {
          if (confirm) this.confirmCancel(formId);
        },
      })
    }

  },
  cancelItem(cb, formId) {
    const {itemType, carId, id} = this.data;
    if (itemType === 'matching') {
      cancelMatching(id, formId).then(cb).catch(res => {
        wx.showModal({
          title: '取消失败',
          content: res,
          showCancel: false,
        })
      })
    } else if (itemType === 'succeed') {
      cancelMatchingSucceed(carId, formId).then(cb).catch(res => {
        wx.showModal({
          title: '取消失败',
          content: res,
          showCancel: false,
        })
      })
    }
  },
  refetchData(type) {
    if (type === null || type === undefined) {
      const { id, itemType: type } = this.data;
      this.fetchData(id, type);
    } else {
      const { id } = this.data;
      this.fetchData(id, type);
      this.setData({
        itemType: type,
      })
    } 
  },
  onUnload() {
    clearTimeout(this.countdownHandler);
  },
  onPullDownRefresh() {
    const { id, itemType: type } = this.data;
    this.fetchData(id, type, true);
  },
  onLoad:function(options){
    const init = () => {
      const { id, type, directly } = options;
      this.setData({
        itemType: type,
        id,
      });
      this.fetchData(id, type);
      this.fillContact();
    }
    init();
    
    wx.getStorage({
      key: 'expire',
      success: (res) => {
        if (res.data) {
          
          getApp().login(() => init());
          wx.setStorageSync('expire', '')
        }
      },
    })
    
    

   
  },
  handlerStart(e) {
    let {clientX, clientY} = e.touches[0];
    this.startX = clientX;
    this.tapStartX = clientX;
    this.tapStartY = clientY;
    this.data.stv.tStart = true;
    this.tapStartTime = e.timeStamp;
    this.setData({stv: this.data.stv})
  },
  handlerMove(e) {
    let {clientX, clientY} = e.touches[0];
    let {stv} = this.data;
    let offsetX = this.startX - clientX;
    this.startX = clientX;
    stv.offset += offsetX;
    if(stv.offset <= 0) {
      stv.offset = 0;
    } else if(stv.offset >= stv.windowWidth*(this.tabsCount-1)) {
      stv.offset = stv.windowWidth*(this.tabsCount-1);
    }
    this.setData({stv: stv});
  },
  handlerEnd(e) {
    let {clientX, clientY} = e.changedTouches[0];
    let endTime = e.timeStamp;
    let {tabs, stv, activeTab} = this.data;
    let {offset, windowWidth} = stv;
    // rapidly switch
    if(endTime - this.tapStartTime <= 300) {
      // without other direction moving
      if(Math.abs(this.tapStartY - clientY) < 50) {
        // swipe to right
        if(this.tapStartX - clientX > 5) {
          if(activeTab < this.tabsCount -1) {
            this.setData({activeTab: ++activeTab})
          }
          // swipe to left
        } else if (clientX - this.tapStartX > 5) {
          if(activeTab > 0) {
            this.setData({activeTab: --activeTab})
          }
        }
        stv.offset = stv.windowWidth*activeTab;
      } else {
        //rapidly but move bidirectionally
        let page = Math.round(offset/windowWidth);
        if (activeTab != page) {
          this.setData({activeTab: page})
        }
        stv.offset = stv.windowWidth*page;
      }
    } else {
      let page = Math.round(offset/windowWidth);
      if (activeTab != page) {
        this.setData({activeTab: page})
      }
      stv.offset = stv.windowWidth*page;
    }
    stv.tStart = false;
    this.setData({stv: this.data.stv})
  },
  _updateSelectedPage(page) {
    let {tabs, stv, activeTab} = this.data;
    activeTab = page;
    this.setData({activeTab: activeTab})
    stv.offset = stv.windowWidth*activeTab;
    this.setData({stv: this.data.stv})
  },
  handlerTabTap(e) {
    this._updateSelectedPage(e.currentTarget.dataset.index);
  }

})